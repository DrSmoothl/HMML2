"""
插件广场服务
"""
import requests
import time
import subprocess
import json
import os
from pathlib import Path
from models.plugin import Plugin, PluginListResponse
from models.database import ApiResponse


class PluginMarketService:
    """插件广场服务"""
    
    PLUGIN_DETAILS_URL = "https://raw.githubusercontent.com/DrSmoothl/plugin-repo/refs/heads/main/plugin_details.json"
    
    @classmethod
    async def get_all_plugins(cls) -> ApiResponse:
        """
        获取所有插件列表
        
        Returns:
            ApiResponse: 包含插件列表的响应
        """
        try:
            # 发起HTTP请求获取插件详情
            response = requests.get(cls.PLUGIN_DETAILS_URL, timeout=10)
            response.raise_for_status()
            
            # 解析JSON数据
            plugin_data = response.json()
            
            # 获取已安装的插件
            installed_plugins = await cls._get_installed_plugins()
            
            # 验证数据格式并转换为Plugin对象
            plugins = []
            for item in plugin_data:
                try:
                    # 确保基本结构存在
                    if not isinstance(item, dict):
                        continue
                    
                    plugin_id = item.get('id', f'unknown_{len(plugins)}')
                    manifest_data = item.get('manifest', {})
                    
                    # 处理manifest_version字段，确保是整数
                    if 'manifest_version' in manifest_data:
                        try:
                            manifest_data['manifest_version'] = int(manifest_data['manifest_version'])
                        except (ValueError, TypeError):
                            manifest_data['manifest_version'] = 1
                    
                    # 确保keywords是列表
                    if 'keywords' not in manifest_data:
                        manifest_data['keywords'] = []
                    elif not isinstance(manifest_data['keywords'], list):
                        manifest_data['keywords'] = []
                    
                    # 确保author字段存在且格式正确
                    if 'author' not in manifest_data:
                        manifest_data['author'] = {"name": "未知作者"}
                    elif isinstance(manifest_data['author'], str):
                        manifest_data['author'] = {"name": manifest_data['author']}
                    elif not isinstance(manifest_data['author'], dict):
                        manifest_data['author'] = {"name": "未知作者"}
                    
                    # 确保host_application字段存在且格式正确
                    if 'host_application' not in manifest_data:
                        manifest_data['host_application'] = {"min_version": "0.0.0"}
                    elif not isinstance(manifest_data['host_application'], dict):
                        manifest_data['host_application'] = {"min_version": "0.0.0"}
                    
                    # 检查是否已安装
                    is_installed = False
                    for installed_plugin in installed_plugins:
                        similarity = cls._calculate_similarity(installed_plugin, item)
                        if similarity >= 60.0:  # 60%相似度阈值
                            is_installed = True
                            break
                    
                    plugin = Plugin(id=plugin_id, manifest=manifest_data, installed=is_installed)
                    plugins.append(plugin)
                except Exception as e:
                    # 如果某个插件数据格式错误，跳过该插件但不影响其他插件
                    print(f"解析插件数据失败: {item.get('id', 'unknown')}, 错误: {str(e)}")
                    continue
            
            # 创建响应数据
            plugin_list = PluginListResponse(items=plugins)
            
            return ApiResponse(
                status=200,
                message="查询成功",
                data=plugin_list.dict(),
                time=int(time.time() * 1000)
            )
            
        except requests.exceptions.RequestException as e:
            return ApiResponse(
                status=500,
                message=f"获取插件数据失败: {str(e)}",
                data=None,
                time=int(time.time() * 1000)
            )
        except Exception as e:
            return ApiResponse(
                status=500,
                message=f"处理插件数据失败: {str(e)}",
                data=None,
                time=int(time.time() * 1000)
            )
    
    @classmethod
    async def get_plugin_by_id(cls, plugin_id: str) -> ApiResponse:
        """
        根据插件ID获取单个插件详情
        
        Args:
            plugin_id: 插件ID
            
        Returns:
            ApiResponse: 包含插件详情的响应
        """
        try:
            # 获取所有插件
            all_plugins_response = await cls.get_all_plugins()
            
            if all_plugins_response.status != 200:
                return all_plugins_response
            
            # 查找指定ID的插件
            plugins = all_plugins_response.data.get("items", [])
            for plugin in plugins:
                if plugin.get("id") == plugin_id:
                    return ApiResponse(
                        status=200,
                        message="查询成功",
                        data=plugin,
                        time=int(time.time() * 1000)
                    )
            
            # 未找到插件
            return ApiResponse(
                status=404,
                message=f"未找到插件: {plugin_id}",
                data=None,
                time=int(time.time() * 1000)
            )
            
        except Exception as e:
            return ApiResponse(
                status=500,
                message=f"查询插件失败: {str(e)}",
                data=None,
                time=int(time.time() * 1000)
            )
    
    @classmethod
    async def install_plugin(cls, plugin_id: str) -> ApiResponse:
        """
        安装插件
        
        Args:
            plugin_id: 插件ID
            
        Returns:
            ApiResponse: 安装结果响应
        """
        try:
            # 1. 获取插件详情
            plugin_response = await cls.get_plugin_by_id(plugin_id)
            if plugin_response.status != 200:
                return plugin_response
            
            plugin_data = plugin_response.data
            if not plugin_data:
                return ApiResponse(
                    status=404,
                    message=f"插件不存在: {plugin_id}",
                    data=None,
                    time=int(time.time() * 1000)
                )
            
            manifest = plugin_data.get("manifest", {})
            repository_url = manifest.get("repository_url")
            
            if not repository_url:
                return ApiResponse(
                    status=400,
                    message="插件缺少repository_url字段，无法安装",
                    data=None,
                    time=int(time.time() * 1000)
                )
            
            # 2. 检查环境类型
            is_onekey_response = await cls._check_onekey_environment()
            if is_onekey_response.status != 200:
                return is_onekey_response
            
            is_onekey = is_onekey_response.data.get("isOneKeyEnv", False)
            
            # 3. 获取麦麦根目录
            maimai_root = await cls._get_maimai_root()
            if not maimai_root:
                return ApiResponse(
                    status=500,
                    message="无法获取麦麦根目录",
                    data=None,
                    time=int(time.time() * 1000)
                )
            
            # 4. 准备安装目录
            plugins_dir = Path(maimai_root) / "plugins"
            plugins_dir.mkdir(exist_ok=True)
            
            plugin_dir = plugins_dir / plugin_id
            if plugin_dir.exists():
                return ApiResponse(
                    status=400,
                    message=f"插件已存在: {plugin_id}",
                    data=None,
                    time=int(time.time() * 1000)
                )
            
            # 5. 执行git clone
            git_result = await cls._clone_plugin(repository_url, plugin_dir, is_onekey)
            if not git_result["success"]:
                return ApiResponse(
                    status=500,
                    message=f"安装失败: {git_result['error']}",
                    data=None,
                    time=int(time.time() * 1000)
                )
            
            return ApiResponse(
                status=200,
                message="安装成功",
                data={"id": 1},  # 这里可以返回实际的安装ID
                time=int(time.time() * 1000)
            )
            
        except Exception as e:
            return ApiResponse(
                status=500,
                message=f"安装失败: {str(e)}",
                data=None,
                time=int(time.time() * 1000)
            )
    
    @classmethod
    async def _check_onekey_environment(cls) -> ApiResponse:
        """检查是否在一键包环境中"""
        try:
            # 直接调用系统路由中的逻辑
            from routes.system import is_onekey_environment
            is_onekey = is_onekey_environment()
            
            return ApiResponse(
                status=200,
                message="检测成功",
                data={"isOneKeyEnv": is_onekey},
                time=int(time.time() * 1000)
            )
        except Exception as e:
            return ApiResponse(
                status=500,
                message=f"检查环境失败: {str(e)}",
                data=None,
                time=int(time.time() * 1000)
            )
    
    @classmethod
    async def _get_maimai_root(cls) -> str:
        """获取麦麦根目录"""
        try:
            # 直接调用路径缓存管理器
            from core.path_cache_manager import path_cache_manager
            result = await path_cache_manager.get_all_paths()
            return result.get("mainRoot")
        except Exception:
            return None
    
    @classmethod
    async def _clone_plugin(cls, repository_url: str, plugin_dir: Path, is_onekey: bool) -> dict:
        """
        克隆插件代码
        
        Args:
            repository_url: 仓库URL
            plugin_dir: 插件安装目录
            is_onekey: 是否为一键包环境
            
        Returns:
            dict: 克隆结果
        """
        try:
            if is_onekey:
                # 一键包环境，使用内置git
                git_exe = cls._get_onekey_git_path()
                if not git_exe or not Path(git_exe).exists():
                    return {
                        "success": False,
                        "error": "一键包环境中未找到git执行文件"
                    }
            else:
                # 普通环境，检查系统git
                git_exe = "git"
                if not cls._check_git_available():
                    return {
                        "success": False,
                        "error": "系统中未安装git，请先安装git后再尝试安装插件"
                    }
            
            # 执行git clone
            cmd = [git_exe, "clone", repository_url, str(plugin_dir)]
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=60  # 60秒超时
            )
            
            if result.returncode == 0:
                return {"success": True}
            else:
                return {
                    "success": False,
                    "error": f"Git clone失败: {result.stderr}"
                }
                
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "error": "Git clone操作超时"
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Git clone异常: {str(e)}"
            }
    
    @classmethod
    def _get_onekey_git_path(cls) -> str:
        """获取一键包git路径"""
        try:
            # 获取当前后端所在目录
            current_dir = Path(__file__).resolve().parent
            # 向上查找到MaiBotOneKey目录
            onekey_root = current_dir
            while onekey_root.parent != onekey_root:
                if onekey_root.name == "MaiBotOneKey":
                    break
                onekey_root = onekey_root.parent
            else:
                # 如果没找到，尝试相对路径推算
                # 假设当前在 MaiBotOneKey/modules/HMMLBackend
                onekey_root = current_dir.parent.parent
            
            git_path = onekey_root / "runtime" / "PortableGit" / "bin" / "git.exe"
            return str(git_path)
        except Exception:
            return None
    
    @classmethod
    def _check_git_available(cls) -> bool:
        """检查系统git是否可用"""
        try:
            result = subprocess.run(
                ["git", "--version"],
                capture_output=True,
                text=True,
                timeout=5
            )
            return result.returncode == 0
        except Exception:
            return False
    
    @classmethod
    async def _get_installed_plugins(cls) -> list[dict]:
        """获取已安装的插件信息"""
        try:
            # 获取麦麦根目录
            maimai_root = await cls._get_maimai_root()
            
            if not maimai_root:
                return []
            
            plugin_dir = Path(maimai_root) / "plugins"
            
            if not plugin_dir.exists():
                return []
            
            installed_plugins = []
            
            # 遍历插件目录下的所有子文件夹
            for plugin_folder in plugin_dir.iterdir():
                if not plugin_folder.is_dir():
                    continue
                
                # 查找manifest文件，支持多种文件名
                manifest_path = None
                for manifest_name in ["manifest.json", "_manifest.json", "package.json"]:
                    potential_path = plugin_folder / manifest_name
                    if potential_path.exists():
                        manifest_path = potential_path
                        break
                
                if not manifest_path:
                    continue
                
                try:
                    # 读取文件并处理编码问题
                    with open(manifest_path, 'r', encoding='utf-8-sig') as f:
                        manifest_data = json.load(f)
                    
                    # 标准化插件信息
                    plugin_info = {
                        'name': manifest_data.get('name', plugin_folder.name),
                        'version': manifest_data.get('version', '0.0.0'),
                        'description': manifest_data.get('description', ''),
                        'author': manifest_data.get('author', ''),
                        'folder_name': plugin_folder.name
                    }
                    
                    # 处理author字段，支持字符串和对象格式
                    if isinstance(plugin_info['author'], dict):
                        plugin_info['author'] = plugin_info['author'].get('name', '')
                    
                    installed_plugins.append(plugin_info)
                    
                except (json.JSONDecodeError, IOError) as e:
                    print(f"Failed to parse manifest for {plugin_folder.name}: {e}")
                    continue
            
            return installed_plugins
            
        except Exception as e:
            print(f"Error getting installed plugins: {e}")
            return []
    
    @classmethod
    def _calculate_similarity(cls, installed_plugin: dict, market_plugin: dict) -> float:
        """计算插件相似度 - 简化版：只检查name和description是否完全匹配"""
        # 获取市场插件的manifest信息
        manifest = market_plugin.get('manifest', {})
        market_name = manifest.get('name', '').strip().lower()
        market_description = manifest.get('description', '').strip().lower()
        
        # 获取已安装插件信息
        installed_name = installed_plugin.get('name', '').strip().lower()
        installed_description = installed_plugin.get('description', '').strip().lower()
        
        # 如果名称和描述都不为空且完全匹配，则认为是同一插件
        if (market_name and installed_name and market_name == installed_name and 
            market_description and installed_description and market_description == installed_description):
            return 100.0
        
        # 如果只有名称匹配且名称不为空，给60%相似度
        if market_name and installed_name and market_name == installed_name:
            return 60.0
            
        return 0.0
