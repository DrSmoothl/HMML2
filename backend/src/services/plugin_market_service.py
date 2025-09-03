"""
插件广场服务
"""
import requests
import time
import json
import asyncio
from pathlib import Path
from typing import Optional, List
from models.plugin import Plugin, PluginListResponse
from models.database import ApiResponse
from services.git_clone_service import get_git_clone_service
from core.logger import logger


class PluginMarketService:
    """插件广场服务"""
    
    PLUGIN_DETAILS_URL = "http://jp1-proxy.gitwarp.com:8123/https://raw.githubusercontent.com/DrSmoothl/plugin-repo/refs/heads/main/plugin_details.json"
    
    # 缓存已安装插件信息，避免重复文件读取
    _installed_plugins_cache: Optional[List[dict]] = None
    _cache_timestamp: float = 0
    _cache_duration: float = 30  # 缓存30秒
    
    @classmethod
    async def get_all_plugins(cls) -> ApiResponse:
        """
        获取所有插件列表
        
        Returns:
            ApiResponse: 包含插件列表的响应
        """
        start_time = time.time()
        logger.info("开始获取所有插件列表")
        
        try:
            # 发起HTTP请求获取插件详情
            http_start = time.time()
            logger.info(f"开始请求插件数据: {cls.PLUGIN_DETAILS_URL}")
            response = requests.get(cls.PLUGIN_DETAILS_URL, timeout=10)
            response.raise_for_status()
            http_duration = time.time() - http_start
            logger.info(f"HTTP请求完成，耗时: {http_duration:.3f}s")
            
            # 解析JSON数据
            parse_start = time.time()
            plugin_data = response.json()
            parse_duration = time.time() - parse_start
            logger.info(f"JSON解析完成，耗时: {parse_duration:.3f}s，插件数量: {len(plugin_data)}")
            
            # 获取已安装的插件（使用缓存）
            cache_start = time.time()
            installed_plugins = await cls._get_installed_plugins_cached()
            cache_duration = time.time() - cache_start
            logger.info(f"获取已安装插件完成，耗时: {cache_duration:.3f}s，插件数量: {len(installed_plugins)}")
            
            # 验证数据格式并转换为Plugin对象
            process_start = time.time()
            plugins = []
            for i, item in enumerate(plugin_data):
                try:
                    # 确保基本结构存在
                    if not isinstance(item, dict):
                        continue
                    
                    plugin_id = item.get('id', f'unknown_{len(plugins)}')
                    manifest_data = item.get('manifest', {})
                    
                    # 快速处理必要字段，减少处理时间
                    cls._normalize_manifest_data(manifest_data)
                    
                    # 快速检查是否已安装（只检查名称匹配）
                    is_installed = cls._quick_check_installed(manifest_data, installed_plugins)
                    
                    plugin = Plugin(id=plugin_id, manifest=manifest_data, installed=is_installed)
                    plugins.append(plugin)
                    
                    # 每处理10个插件记录一次进度
                    if (i + 1) % 10 == 0:
                        logger.debug(f"已处理 {i + 1}/{len(plugin_data)} 个插件")
                        
                except Exception as e:
                    # 如果某个插件数据格式错误，跳过该插件但不影响其他插件
                    logger.warning(f"解析插件数据失败: {item.get('id', 'unknown')}, 错误: {str(e)}")
                    continue
            
            process_duration = time.time() - process_start
            logger.info(f"插件数据处理完成，耗时: {process_duration:.3f}s，成功处理: {len(plugins)}")
            
            # 创建响应数据
            response_start = time.time()
            plugin_list = PluginListResponse(items=plugins)
            response_duration = time.time() - response_start
            logger.info(f"响应数据创建完成，耗时: {response_duration:.3f}s")
            
            total_duration = time.time() - start_time
            logger.info(f"获取所有插件列表完成，总耗时: {total_duration:.3f}s")
            
            return ApiResponse(
                status=200,
                message="查询成功",
                data=plugin_list.dict(),
                time=int(time.time() * 1000)
            )
            
        except requests.exceptions.RequestException as e:
            error_duration = time.time() - start_time
            logger.error(f"获取插件数据失败，耗时: {error_duration:.3f}s，错误: {str(e)}")
            return ApiResponse(
                status=500,
                message=f"获取插件数据失败: {str(e)}",
                data=None,
                time=int(time.time() * 1000)
            )
        except Exception as e:
            error_duration = time.time() - start_time
            logger.error(f"处理插件数据失败，耗时: {error_duration:.3f}s，错误: {str(e)}")
            return ApiResponse(
                status=500,
                message=f"处理插件数据失败: {str(e)}",
                data=None,
                time=int(time.time() * 1000)
            )
    
    @classmethod
    def _normalize_manifest_data(cls, manifest_data: dict) -> None:
        """快速标准化manifest数据"""
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
    
    @classmethod
    def _quick_check_installed(cls, manifest_data: dict, installed_plugins: List[dict]) -> bool:
        """快速检查插件是否已安装（只检查名称匹配，避免复杂计算）"""
        market_name = manifest_data.get('name', '').strip().lower()
        if not market_name:
            return False
        
        for installed_plugin in installed_plugins:
            installed_name = installed_plugin.get('name', '').strip().lower()
            if market_name == installed_name:
                return True
        return False
    
    @classmethod
    async def _get_installed_plugins_cached(cls) -> List[dict]:
        """获取已安装插件信息（带缓存）"""
        current_time = time.time()
        
        # 检查缓存是否有效
        if (cls._installed_plugins_cache is not None and 
            current_time - cls._cache_timestamp < cls._cache_duration):
            logger.debug(f"使用缓存的已安装插件信息，插件数量: {len(cls._installed_plugins_cache)}")
            return cls._installed_plugins_cache
        
        # 缓存过期或不存在，重新获取
        logger.info("缓存过期，重新获取已安装插件信息")
        cache_start = time.time()
        cls._installed_plugins_cache = await cls._get_installed_plugins()
        cache_duration = time.time() - cache_start
        cls._cache_timestamp = current_time
        
        logger.info(f"重新获取已安装插件完成，耗时: {cache_duration:.3f}s，插件数量: {len(cls._installed_plugins_cache)}")
        
        return cls._installed_plugins_cache
    
    @classmethod
    def _clear_installed_plugins_cache(cls) -> None:
        """清除已安装插件缓存"""
        cls._installed_plugins_cache = None
        cls._cache_timestamp = 0
    
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
            git_clone_service = get_git_clone_service()
            git_result = await git_clone_service.clone_repository(
                repository_url, plugin_dir, is_onekey
            )
            
            if not git_result.success:
                return ApiResponse(
                    status=500,
                    message=f"安装失败: {git_result.message}",
                    data={
                        "error_details": {
                            "mirror_used": git_result.mirror_used,
                            "attempts": git_result.attempts,
                            "duration": git_result.duration
                        }
                    },
                    time=int(time.time() * 1000)
                )
            
            # 安装成功，清除缓存以便下次获取最新状态
            cls._clear_installed_plugins_cache()
            
            return ApiResponse(
                status=200,
                message="安装成功",
                data={
                    "id": 1,  # 这里可以返回实际的安装ID
                    "install_details": {
                        "mirror_used": git_result.mirror_used,
                        "attempts": git_result.attempts,
                        "duration": git_result.duration
                    }
                },
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
            start_time = time.time()
            # 直接调用路径缓存管理器
            from core.path_cache_manager import path_cache_manager
            result = await path_cache_manager.get_all_paths()
            duration = time.time() - start_time
            
            main_root = result.get("mainRoot")
            logger.debug(f"获取麦麦根目录耗时: {duration:.3f}s，结果: {main_root}")
            
            return main_root
        except Exception as e:
            logger.error(f"获取麦麦根目录失败: {e}")
            return None
    
    @classmethod
    async def _get_installed_plugins(cls) -> list[dict]:
        """获取已安装的插件信息（优化版）"""
        start_time = time.time()
        logger.info("开始扫描已安装插件")
        
        try:
            # 获取麦麦根目录
            root_start = time.time()
            maimai_root = await cls._get_maimai_root()
            root_duration = time.time() - root_start
            logger.debug(f"获取麦麦根目录耗时: {root_duration:.3f}s，路径: {maimai_root}")
            
            if not maimai_root:
                logger.warning("麦麦根目录为空，返回空插件列表")
                return []
            
            plugin_dir = Path(maimai_root) / "plugins"
            
            if not plugin_dir.exists():
                logger.info(f"插件目录不存在: {plugin_dir}")
                return []
            
            # 扫描插件目录
            scan_start = time.time()
            plugin_folders = [f for f in plugin_dir.iterdir() if f.is_dir()]
            scan_duration = time.time() - scan_start
            logger.info(f"扫描插件目录耗时: {scan_duration:.3f}s，发现 {len(plugin_folders)} 个文件夹")
            
            installed_plugins = []
            
            # 遍历插件目录下的所有子文件夹，限制处理数量以提高性能
            process_start = time.time()
            processed_count = 0
            
            for plugin_folder in plugin_folders[:50]:  # 限制最多检查50个插件文件夹
                try:
                    # 查找manifest文件，支持多种文件名
                    manifest_path = None
                    for manifest_name in ["manifest.json", "_manifest.json", "package.json"]:
                        potential_path = plugin_folder / manifest_name
                        if potential_path.exists():
                            manifest_path = potential_path
                            break
                    
                    if not manifest_path:
                        logger.debug(f"插件文件夹缺少manifest文件: {plugin_folder.name}")
                        continue
                    
                    # 读取文件并处理编码问题，设置超时以避免阻塞
                    file_start = time.time()
                    with open(manifest_path, 'r', encoding='utf-8-sig') as f:
                        content = f.read(10240)  # 限制读取大小，最多10KB
                        if len(content) >= 10240:
                            logger.warning(f"插件manifest文件过大，跳过: {plugin_folder.name}")
                            continue
                        
                        manifest_data = json.loads(content)
                    
                    file_duration = time.time() - file_start
                    
                    # 标准化插件信息，只保留必要字段
                    plugin_info = {
                        'name': manifest_data.get('name', plugin_folder.name),
                        'version': manifest_data.get('version', '0.0.0'),
                        'folder_name': plugin_folder.name
                    }
                    
                    installed_plugins.append(plugin_info)
                    processed_count += 1
                    
                    logger.debug(f"处理插件 {plugin_folder.name} 耗时: {file_duration:.3f}s")
                    
                except (json.JSONDecodeError, IOError, UnicodeDecodeError):
                    logger.warning(f"解析插件manifest失败，跳过: {plugin_folder.name}")
                    continue
                except Exception:
                    logger.warning(f"处理插件时发生异常，跳过: {plugin_folder.name}")
                    continue
            
            process_duration = time.time() - process_start
            total_duration = time.time() - start_time
            
            logger.info(f"已安装插件扫描完成 - 总耗时: {total_duration:.3f}s，处理耗时: {process_duration:.3f}s")
            logger.info(f"成功处理 {processed_count} 个插件，有效插件: {len(installed_plugins)}")
            
            return installed_plugins
            
        except Exception as e:
            error_duration = time.time() - start_time
            logger.error(f"获取已安装插件失败，耗时: {error_duration:.3f}s，错误: {e}")
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
