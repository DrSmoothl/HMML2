"""
主程序配置服务
Main Configuration Service
提供对bot_config.toml文件的读取和写入操作
"""

import os
import shutil
from datetime import datetime
from typing import Optional, Dict, Any

import toml
import tomlkit

from core.logger import logger
from core.path_cache_manager import path_cache_manager
from models.config import (
    MainConfigData,
    ConfigUpdateData,
    ConfigFileInfo,
    ConfigServiceOptions
)
from utils.toml_helpers import stringify_config_to_clean_toml


class MainConfigService:
    """主程序配置服务类"""
    
    CONFIG_FILE_NAME = 'bot_config.toml'
    CONFIG_DIR = 'config'
    
    @classmethod
    def _get_config_path(cls) -> str:
        """获取配置文件的完整路径"""
        main_root = path_cache_manager.get_main_root()
        if not main_root:
            raise FileNotFoundError('麦麦主程序根目录未设置，请先设置根目录缓存')
        
        return os.path.join(main_root, cls.CONFIG_DIR, cls.CONFIG_FILE_NAME)
    
    @classmethod
    async def get_config_file_info(cls) -> ConfigFileInfo:
        """检查配置文件信息"""
        try:
            config_path = cls._get_config_path()
            
            exists = os.path.exists(config_path)
            readable = False
            writable = False
            size = 0
            last_modified = datetime.now().isoformat()
            
            if exists:
                stat_info = os.stat(config_path)
                size = stat_info.st_size
                last_modified = datetime.fromtimestamp(stat_info.st_mtime).isoformat()
                
                # 检查读写权限
                readable = os.access(config_path, os.R_OK)
                writable = os.access(config_path, os.W_OK)
            
            return ConfigFileInfo(
                path=config_path,
                exists=exists,
                readable=readable,
                writable=writable,
                size=size,
                last_modified=last_modified
            )
            
        except Exception as error:
            logger.error(f'获取配置文件信息失败: {error}')
            raise RuntimeError('获取配置文件信息失败')
    
    @classmethod
    async def get_config(cls, options: Optional[ConfigServiceOptions] = None) -> MainConfigData:
        """读取主程序配置文件"""
        try:
            opts = options or ConfigServiceOptions()
            config_path = cls._get_config_path()
            
            # 检查文件是否存在
            file_info = await cls.get_config_file_info()
            if not file_info.exists:
                raise FileNotFoundError(f'主程序配置文件不存在: {config_path}')
            
            if not file_info.readable:
                raise PermissionError(f'主程序配置文件不可读: {config_path}')
            
            # 读取文件内容
            try:
                with open(config_path, 'r', encoding=opts.encoding) as f:
                    file_content = f.read()
            except Exception as error:
                logger.error(f'读取主程序配置文件失败: {error}')
                raise RuntimeError(f'读取主程序配置文件失败: {error}')
            
            # 解析TOML内容
            try:
                config_data = toml.loads(file_content)
            except Exception as error:
                logger.error(f'解析主程序配置文件失败: {error}')
                raise ValueError(f'主程序配置文件格式错误: {error}')
            
            logger.info('主程序配置读取成功')
            return MainConfigData(**config_data)
            
        except Exception as error:
            logger.error(f'获取主程序配置失败: {error}')
            raise error
    
    @classmethod
    async def update_config(
        cls,
        update_data: ConfigUpdateData,
        options: Optional[ConfigServiceOptions] = None
    ) -> None:
        """更新主程序配置文件"""
        try:
            opts = options or ConfigServiceOptions()
            config_path = cls._get_config_path()
            
            if not update_data:
                raise ValueError('更新数据不能为空')
            
            update_dict = update_data.model_dump()
            if not update_dict:
                raise ValueError('更新数据不能为空')
            
            # 验证更新数据格式
            if opts.validate:
                cls._validate_config_data(update_dict)
            
            # 检查文件状态
            file_info = await cls.get_config_file_info()
            
            current_config = {}
            
            # 如果文件存在，先读取当前配置
            if file_info.exists:
                if not file_info.readable:
                    raise PermissionError(f'主程序配置文件不可读: {config_path}')
                if not file_info.writable:
                    raise PermissionError(f'主程序配置文件不可写: {config_path}')
                
                current_config_data = await cls.get_config(ConfigServiceOptions(validate=False))
                current_config = current_config_data.model_dump()
            else:
                # 确保目录存在
                config_dir = os.path.dirname(config_path)
                os.makedirs(config_dir, exist_ok=True)
            
            # 合并配置数据
            merged_config = cls._merge_config(current_config, update_dict)
            
            # 创建备份（如果文件存在且启用备份）
            if file_info.exists and opts.backup:
                await cls._create_backup(config_path)
            
            # 转换为TOML格式并写入文件
            try:
                if file_info.exists:
                    # 如果文件存在，使用tomlkit保留注释和格式
                    with open(config_path, 'r', encoding=opts.encoding) as f:
                        original_content = f.read()
                    
                    # 使用tomlkit解析原始内容
                    doc = tomlkit.parse(original_content)
                    
                    # 更新配置值
                    cls._update_tomlkit_doc(doc, merged_config)
                    
                    # 写入更新后的内容
                    with open(config_path, 'w', encoding=opts.encoding) as f:
                        f.write(tomlkit.dumps(doc))
                else:
                    # 如果是新文件，使用标准方法
                    toml_content = stringify_config_to_clean_toml(merged_config, toml)
                    with open(config_path, 'w', encoding=opts.encoding) as f:
                        f.write(toml_content)
            except Exception as error:
                logger.error(f'写入主程序配置文件失败: {error}')
                raise RuntimeError(f'写入主程序配置文件失败: {error}')
            
            logger.info('主程序配置更新成功')
            
        except Exception as error:
            logger.error(f'更新主程序配置失败: {error}')
            raise error
    
    @classmethod
    def _validate_config_data(cls, data: Dict[str, Any]) -> None:
        """验证配置数据格式"""
        if not isinstance(data, dict):
            raise ValueError('配置数据必须是一个对象')
        
        # 递归检查嵌套对象，确保数据结构合理
        def validate_object(obj: Any, path: str = '') -> None:
            if isinstance(obj, dict):
                for key, value in obj.items():
                    current_path = f'{path}.{key}' if path else key
                    
                    # 检查键名
                    if not isinstance(key, str) or not key.strip():
                        raise ValueError(f'配置项键名无效: {current_path}')
                    
                    # 检查值类型（TOML支持的类型）
                    if not cls._is_valid_toml_type(value):
                        raise ValueError(f'配置项类型不支持: {current_path} ({type(value).__name__})')
                    
                    # 递归验证嵌套对象
                    if isinstance(value, (dict, list)):
                        validate_object(value, current_path)
            
            elif isinstance(obj, list):
                # 验证数组元素类型一致性
                if obj and len(obj) > 0:
                    first_type = type(obj[0])
                    if not all(isinstance(item, first_type) for item in obj):
                        raise ValueError(f'数组元素类型不一致: {path}')
                    
                    # 递归验证数组元素
                    for i, item in enumerate(obj):
                        validate_object(item, f'{path}[{i}]')
        
        validate_object(data)
    
    @classmethod
    def _is_valid_toml_type(cls, value: Any) -> bool:
        """检查值是否是TOML支持的类型"""
        return (
            isinstance(value, (str, int, float, bool)) or
            value is None or
            isinstance(value, list) or
            isinstance(value, dict)
        )
    
    @classmethod
    def _merge_config(cls, current: Dict[str, Any], update: Dict[str, Any]) -> Dict[str, Any]:
        """合并配置数据（深度合并）"""
        merged = current.copy()
        
        for key, value in update.items():
            if value is not None:
                if (
                    isinstance(value, dict) and
                    key in merged and
                    isinstance(merged[key], dict)
                ):
                    # 递归合并嵌套对象
                    merged[key] = cls._merge_config(merged[key], value)
                else:
                    # 直接替换值
                    merged[key] = value
        
        return merged
    
    @classmethod
    def _update_tomlkit_doc(cls, doc: tomlkit.TOMLDocument, config: Dict[str, Any]) -> None:
        """使用tomlkit更新文档，保留注释和格式"""
        for key, value in config.items():
            if isinstance(value, dict):
                # 处理嵌套对象
                if key not in doc:
                    doc[key] = tomlkit.table()
                
                if isinstance(doc[key], tomlkit.items.Table):
                    cls._update_tomlkit_table(doc[key], value)
                else:
                    doc[key] = value
            else:
                # 直接设置值
                doc[key] = value
    
    @classmethod
    def _update_tomlkit_table(cls, table: tomlkit.items.Table, config: Dict[str, Any]) -> None:
        """更新tomlkit表格"""
        for key, value in config.items():
            if isinstance(value, dict):
                if key not in table:
                    table[key] = tomlkit.table()
                
                if isinstance(table[key], tomlkit.items.Table):
                    cls._update_tomlkit_table(table[key], value)
                else:
                    table[key] = value
            else:
                table[key] = value
    
    @classmethod
    async def _create_backup(cls, config_path: str) -> None:
        """创建配置文件备份"""
        try:
            main_root = path_cache_manager.get_main_root()
            if not main_root:
                raise RuntimeError('无法获取麦麦根目录路径')
            
            # 创建备份目录结构：config/LauncherConfigBak/main/
            backup_dir = os.path.join(main_root, 'config', 'LauncherConfigBak', 'main')
            os.makedirs(backup_dir, exist_ok=True)
            
            # 生成带时间戳的备份文件名
            timestamp = datetime.now().isoformat().replace(':', '-').replace('.', '-')
            config_filename = os.path.basename(config_path)
            backup_filename = f'{config_filename}.backup.{timestamp}'
            backup_path = os.path.join(backup_dir, backup_filename)
            
            # 复制配置文件到备份目录
            shutil.copy2(config_path, backup_path)
            logger.info(f'主程序配置备份已创建: {backup_path}')
            
        except Exception as error:
            logger.warning(f'创建配置文件备份失败: {error}')
            # 备份失败不应该阻止配置更新，只记录警告
