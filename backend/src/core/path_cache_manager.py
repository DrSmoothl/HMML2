"""
路径缓存管理器
Path Cache Manager
负责管理麦麦主程序和适配器根目录的缓存
"""

import os
from pathlib import Path
from datetime import datetime
from typing import Optional, List

from core.logger import logger
from utils.file_manager import FileManager
from utils.path_validator import PathValidator
from models.path_cache import (
    PathCacheData, 
    AdapterRootInfo, 
    PathCacheConfig,
    CacheStats
)


class PathCacheManager:
    """路径缓存管理器"""
    
    def __init__(self, config: Optional[PathCacheConfig] = None):
        """
        初始化路径缓存管理器
        
        Args:
            config: 缓存配置，如果为None则使用默认配置
        """
        # 默认配置 - 使用绝对路径指向正确的缓存文件
        cache_file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))),'data', 'pathCache.json')
        default_config = PathCacheConfig(
            cache_file_path=cache_file_path,
            enable_validation=True,
            auto_create_directory=False,
            max_adapters=50
        )
        
        self.config = config or default_config
        self.cache_data: Optional[PathCacheData] = None
        self.is_loaded = False
        
        logger.info('路径缓存管理器已初始化')
    
    def _get_default_cache_data(self) -> PathCacheData:
        """获取默认缓存数据"""
        return PathCacheData(
            main_root=None,
            adapter_roots=[],
            last_updated=datetime.now().isoformat(),
            version='1.0.0'
        )
    
    async def initialize(self) -> None:
        """初始化缓存管理器"""
        try:
            await self.load_cache()
            
            # 检测是否为一键包环境并自动配置
            await self._auto_configure_onekey_environment()
            
            logger.info('路径缓存管理器初始化完成')
        except Exception as error:
            logger.error(f'路径缓存管理器初始化失败: {error}')
            raise error
    
    async def load_cache(self) -> None:
        """加载缓存数据"""
        try:
            # 确保缓存目录存在
            cache_dir = Path(self.config.cache_file_path).parent
            await FileManager.ensure_dir(str(cache_dir))
            
            # 尝试读取缓存文件
            logger.debug(f"读取缓存文件: {self.config.cache_file_path}")
            data = await FileManager.read_json(self.config.cache_file_path, PathCacheData)
            logger.debug(f"读取到的原始数据: {data}")
            
            if data:
                # 验证数据结构
                if self._validate_cache_data(data):
                    self.cache_data = data
                    logger.info(f'路径缓存数据加载成功: main_root={data.main_root}')
                else:
                    logger.warn('缓存数据格式无效，使用默认数据')
                    self.cache_data = self._get_default_cache_data()
                    await self.save_cache()
            else:
                # 文件不存在，创建默认缓存
                logger.info('缓存文件不存在，创建默认缓存文件')
                self.cache_data = self._get_default_cache_data()
                await self.save_cache()
            
            self.is_loaded = True
            
        except Exception as error:
            logger.error(f'加载路径缓存失败: {error}')
            # 使用默认数据
            self.cache_data = self._get_default_cache_data()
            self.is_loaded = True
    
    async def save_cache(self) -> None:
        """保存缓存数据"""
        try:
            if self.cache_data is None:
                raise RuntimeError("缓存数据未初始化")
            
            # 更新时间戳
            self.cache_data.last_updated = datetime.now().isoformat()
            
            # 保存到文件
            success = await FileManager.write_json(self.config.cache_file_path, self.cache_data)
            
            if not success:
                raise RuntimeError('写入缓存文件失败')
            
            logger.debug('路径缓存数据已保存')
            
        except Exception as error:
            logger.error(f'保存路径缓存失败: {error}')
            raise error
    
    def _validate_cache_data(self, data: PathCacheData) -> bool:
        """验证缓存数据格式"""
        try:
            return (
                isinstance(data.adapter_roots, list) and
                isinstance(data.last_updated, str) and
                isinstance(data.version, str)
            )
        except Exception:
            return False
    
    async def get_all_paths(self) -> dict:
        """获取所有缓存的路径"""
        self._ensure_loaded()
        return {
            "mainRoot": self.cache_data.main_root,
            "adapterRoots": [
                {
                    "adapterName": adapter.adapter_name,
                    "rootPath": adapter.root_path
                } for adapter in self.cache_data.adapter_roots
            ]
        }
    
    async def set_main_root(self, root_path: str) -> None:
        """设置主程序根目录"""
        self._ensure_loaded()
        
        # 路径验证
        if self.config.enable_validation:
            validation = await PathValidator.validate_path(
                root_path, not self.config.auto_create_directory
            )
            if not validation.is_valid:
                raise ValueError(validation.error or '路径验证失败')
            
            # 如果启用自动创建目录且目录不存在
            if self.config.auto_create_directory and not validation.exists:
                created = await PathValidator.ensure_directory(validation.absolute_path)
                if not created:
                    raise RuntimeError('无法创建目录')
            
            # 使用绝对路径
            self.cache_data.main_root = validation.absolute_path
        else:
            # 不验证，直接规范化路径
            self.cache_data.main_root = PathValidator.normalize_path(root_path)
        
        await self.save_cache()
        logger.info(f'主程序根目录已设置: {self.cache_data.main_root}')
    
    def get_main_root(self) -> Optional[str]:
        """获取主程序根目录"""
        self._ensure_loaded()
        logger.debug(f"获取主程序根目录: cache_data={self.cache_data}, main_root={self.cache_data.main_root if self.cache_data else None}")
        return self.cache_data.main_root if self.cache_data else None
    
    async def add_adapter_root(self, adapter_name: str, root_path: str) -> None:
        """添加适配器根目录"""
        self._ensure_loaded()
        
        # 验证适配器名称
        if not adapter_name or adapter_name.strip() == '':
            raise ValueError('适配器名称不能为空')
        
        trimmed_name = adapter_name.strip()
        
        # 检查适配器数量限制
        if len(self.cache_data.adapter_roots) >= self.config.max_adapters:
            raise ValueError(f'适配器数量已达上限 ({self.config.max_adapters})')
        
        # 检查适配器是否已存在
        if self._is_adapter_exists(trimmed_name):
            raise ValueError(f'适配器 "{trimmed_name}" 已存在')
        
        # 路径验证
        if self.config.enable_validation:
            validation = await PathValidator.validate_path(
                root_path, not self.config.auto_create_directory
            )
            if not validation.is_valid:
                raise ValueError(validation.error or '路径验证失败')
            
            # 如果启用自动创建目录且目录不存在
            if self.config.auto_create_directory and not validation.exists:
                created = await PathValidator.ensure_directory(validation.absolute_path)
                if not created:
                    raise RuntimeError('无法创建目录')
            
            final_path = validation.absolute_path
        else:
            final_path = PathValidator.normalize_path(root_path)
        
        # 添加适配器
        adapter_info = AdapterRootInfo(
            adapter_name=trimmed_name,
            root_path=final_path
        )
        self.cache_data.adapter_roots.append(adapter_info)
        
        await self.save_cache()
        logger.info(f'适配器根目录已添加: {trimmed_name} -> {final_path}')
    
    async def remove_adapter_root(self, adapter_name: str) -> bool:
        """移除适配器根目录"""
        self._ensure_loaded()
        
        trimmed_name = adapter_name.strip()
        initial_count = len(self.cache_data.adapter_roots)
        
        self.cache_data.adapter_roots = [
            adapter for adapter in self.cache_data.adapter_roots
            if adapter.adapter_name != trimmed_name
        ]
        
        removed = len(self.cache_data.adapter_roots) < initial_count
        
        if removed:
            await self.save_cache()
            logger.info(f'适配器根目录已移除: {trimmed_name}')
        
        return removed
    
    async def update_adapter_root(self, adapter_name: str, new_root_path: str) -> None:
        """更新适配器根目录"""
        self._ensure_loaded()
        
        trimmed_name = adapter_name.strip()
        adapter_index = None
        
        for i, adapter in enumerate(self.cache_data.adapter_roots):
            if adapter.adapter_name == trimmed_name:
                adapter_index = i
                break
        
        if adapter_index is None:
            raise ValueError(f'适配器 "{trimmed_name}" 不存在')
        
        # 路径验证
        if self.config.enable_validation:
            validation = await PathValidator.validate_path(
                new_root_path, not self.config.auto_create_directory
            )
            if not validation.is_valid:
                raise ValueError(validation.error or '路径验证失败')
            
            # 如果启用自动创建目录且目录不存在
            if self.config.auto_create_directory and not validation.exists:
                created = await PathValidator.ensure_directory(validation.absolute_path)
                if not created:
                    raise RuntimeError('无法创建目录')
            
            final_path = validation.absolute_path
        else:
            final_path = PathValidator.normalize_path(new_root_path)
        
        # 更新适配器路径
        self.cache_data.adapter_roots[adapter_index].root_path = final_path
        
        await self.save_cache()
        logger.info(f'适配器根目录已更新: {trimmed_name} -> {final_path}')
    
    def get_adapter_root(self, adapter_name: str) -> Optional[str]:
        """获取适配器根目录"""
        self._ensure_loaded()
        trimmed_name = adapter_name.strip()
        
        for adapter in self.cache_data.adapter_roots:
            if adapter.adapter_name == trimmed_name:
                return adapter.root_path
        
        return None
    
    def get_all_adapters(self) -> List[AdapterRootInfo]:
        """获取所有适配器"""
        self._ensure_loaded()
        return self.cache_data.adapter_roots.copy()
    
    def _is_adapter_exists(self, adapter_name: str) -> bool:
        """检查适配器是否存在"""
        trimmed_name = adapter_name.strip()
        return any(
            adapter.adapter_name == trimmed_name
            for adapter in self.cache_data.adapter_roots
        )
    
    async def clear_cache(self) -> None:
        """清空所有缓存"""
        self._ensure_loaded()
        self.cache_data = self._get_default_cache_data()
        await self.save_cache()
        logger.info('路径缓存已清空')
    
    def get_cache_stats(self) -> CacheStats:
        """获取缓存统计信息"""
        self._ensure_loaded()
        return CacheStats(
            has_main_root=bool(self.cache_data.main_root),
            adapter_count=len(self.cache_data.adapter_roots),
            last_updated=self.cache_data.last_updated
        )
    
    def _ensure_loaded(self) -> None:
        """确保缓存已加载"""
        if not self.is_loaded:
            raise RuntimeError('路径缓存管理器未初始化，请先调用 initialize()')
    
    async def _auto_configure_onekey_environment(self) -> None:
        """自动配置一键包环境 (兼容多种目录结构)"""
        try:
            if not self._is_onekey_environment():
                logger.info('当前不在一键包环境中运行，跳过自动配置')
                logger.info('请使用前端界面手动配置麦麦根目录和适配器根目录')
                return

            logger.info('检测到一键包环境，开始自动配置路径')

            file_path = Path(__file__).resolve()
            modules_dir = None
            onekey_root = None
            for ancestor in file_path.parents:
                if ancestor.name == 'modules' and ancestor.parent.name == 'MaiBotOneKey':
                    modules_dir = ancestor
                    onekey_root = ancestor.parent
                    break

            if not modules_dir or not onekey_root:
                logger.warning('未找到 modules/MaiBotOneKey 结构，放弃自动配置')
                return

            maibot_root = modules_dir / 'MaiBot'
            qq_adapter_root = modules_dir / 'MaiBot-NapCat-Adapter'

            if not maibot_root.exists():
                logger.warning(f'麦麦根目录不存在: {maibot_root}')
                return
            if not qq_adapter_root.exists():
                logger.warning(f'QQ适配器根目录不存在: {qq_adapter_root}')
                return

            if not self.cache_data.main_root:
                self.cache_data.main_root = str(maibot_root)
                logger.info(f'已自动设置麦麦根目录: {maibot_root}')
            else:
                logger.debug(f'麦麦根目录已存在，跳过设置: {self.cache_data.main_root}')

            qq_adapter_exists = any(
                adapter.adapter_name in ("QQ适配器", "qq") for adapter in self.cache_data.adapter_roots
            )
            if not qq_adapter_exists:
                self.cache_data.adapter_roots.append(
                    AdapterRootInfo(adapter_name='QQ适配器', root_path=str(qq_adapter_root))
                )
                logger.info(f'已自动添加QQ适配器根目录: {qq_adapter_root}')
            else:
                logger.debug('QQ适配器根目录已存在，跳过添加')

            await self.save_cache()
            logger.info('一键包环境自动配置完成')
        except Exception as error:
            logger.error(f'一键包环境自动配置失败: {error}')
    
    def _is_onekey_environment(self) -> bool:
        """检测是否为一键包环境 (放宽: 不要求 MaiBot 目录)"""
        try:
            fp = Path(__file__).resolve()
            core_dir = fp.parent
            src_dir = core_dir.parent
            parent_dir = src_dir.parent  # backend 或 HMML2Backend
            variant = None

            # 变体 A: modules / HMML2Backend / backend / src / core
            if parent_dir.name == 'backend' and parent_dir.parent.name == 'HMML2Backend':
                hmml2backend_dir = parent_dir.parent
                modules_dir = hmml2backend_dir.parent
                variant = 'A-with-backend'
            # 变体 B: modules / HMML2Backend / src / core
            elif parent_dir.name == 'HMML2Backend' and parent_dir.parent.name == 'modules':
                hmml2backend_dir = parent_dir
                modules_dir = parent_dir.parent
                variant = 'B-no-backend'
            else:
                logger.debug('[OneKeyCheck][core] 未匹配结构 parent=%s pparent=%s', parent_dir.name, parent_dir.parent.name if parent_dir.parent else None)
                return False

            logger.info('[OneKeyCheck][core] variant=%s fp=%s', variant, fp)
            logger.info('[OneKeyCheck][core] core=%s src=%s hmml2=%s modules=%s',
                         core_dir.name, src_dir.name, hmml2backend_dir.name, modules_dir.name)

            if core_dir.name != 'core' or src_dir.name != 'src':
                return False
            if hmml2backend_dir.name != 'HMML2Backend' or modules_dir.name != 'modules':
                return False
            if not (modules_dir / 'HMML2Backend').exists():
                return False
            return True
        except Exception as e:
            logger.info(f'[OneKeyCheck][core] 检测异常: {e}')
            return False


# 创建全局路径缓存管理器实例
path_cache_manager = PathCacheManager()
