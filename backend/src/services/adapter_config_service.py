"""
适配器配置服务
Adapter Configuration Service
提供对QQ适配器config.toml文件的读取和写入操作
"""

import os
import shutil
from datetime import datetime
from typing import Optional, Dict, Any

import toml

from core.logger import logger
from core.path_cache_manager import path_cache_manager
from models.config import (
    AdapterConfigData,
    ConfigUpdateData,
    ConfigFileInfo,
    ConfigServiceOptions
)
from utils.toml_helpers import stringify_config_to_clean_toml


class AdapterConfigService:
    """适配器配置服务类"""
    
    CONFIG_FILE_NAME = 'config.toml'
    ADAPTER_NAME = 'QQ适配器'
    
    @classmethod
    def _get_config_path(cls) -> str:
        """获取配置文件的完整路径"""
        adapter_root = path_cache_manager.get_adapter_root(cls.ADAPTER_NAME)
        if not adapter_root:
            raise FileNotFoundError('QQ适配器根目录未设置，请先在路径缓存中设置适配器根目录')
        
        return os.path.join(adapter_root, cls.CONFIG_FILE_NAME)
    
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
            logger.error(f'获取QQ适配器配置文件信息失败: {error}')
            raise RuntimeError('获取QQ适配器配置文件信息失败')
    
    @classmethod
    async def get_config(cls, options: Optional[ConfigServiceOptions] = None) -> AdapterConfigData:
        """读取QQ适配器配置文件"""
        try:
            opts = options or ConfigServiceOptions()
            config_path = cls._get_config_path()
            
            # 检查文件是否存在
            file_info = await cls.get_config_file_info()
            if not file_info.exists:
                raise FileNotFoundError(f'QQ适配器配置文件不存在: {config_path}')
            
            if not file_info.readable:
                raise PermissionError(f'QQ适配器配置文件不可读: {config_path}')
            
            # 读取文件内容
            try:
                with open(config_path, 'r', encoding=opts.encoding) as f:
                    file_content = f.read()
            except Exception as error:
                logger.error(f'读取QQ适配器配置文件失败: {error}')
                raise RuntimeError(f'读取QQ适配器配置文件失败: {error}')
            
            # 解析TOML内容
            try:
                config_data = toml.loads(file_content)
            except Exception as error:
                logger.error(f'解析QQ适配器配置文件失败: {error}')
                raise ValueError(f'QQ适配器配置文件格式错误: {error}')
            
            logger.info('QQ适配器配置读取成功')
            return AdapterConfigData(**config_data)
            
        except Exception as error:
            logger.error(f'获取QQ适配器配置失败: {error}')
            raise error
    
    @classmethod
    async def update_config(
        cls,
        update_data: ConfigUpdateData,
        options: Optional[ConfigServiceOptions] = None
    ) -> None:
        """更新QQ适配器配置文件"""
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
            
            if not file_info.exists:
                raise FileNotFoundError(f'QQ适配器配置文件不存在: {config_path}')
            
            if not file_info.readable:
                raise PermissionError(f'QQ适配器配置文件不可读: {config_path}')
            if not file_info.writable:
                raise PermissionError(f'QQ适配器配置文件不可写: {config_path}')
            
            # 读取当前配置
            current_config_data = await cls.get_config(ConfigServiceOptions(validate=False))
            current_config = current_config_data.model_dump()
            
            # 合并配置数据
            merged_config = cls._merge_config(current_config, update_dict)
            
            # 创建备份（如果启用备份）
            if opts.backup:
                await cls._create_backup(config_path)
            
            # 转换为TOML格式并写入文件
            try:
                toml_content = stringify_config_to_clean_toml(merged_config, toml)
                with open(config_path, 'w', encoding=opts.encoding) as f:
                    f.write(toml_content)
            except Exception as error:
                logger.error(f'写入QQ适配器配置文件失败: {error}')
                raise RuntimeError(f'写入QQ适配器配置文件失败: {error}')
            
            logger.info('QQ适配器配置更新成功')
            
        except Exception as error:
            logger.error(f'更新QQ适配器配置失败: {error}')
            raise error
    
    @classmethod
    def _validate_config_data(cls, data: Dict[str, Any]) -> None:
        """验证配置数据格式"""
        if not isinstance(data, dict):
            raise ValueError('配置数据必须是一个对象')
        
        # 验证特定的配置结构
        if 'napcat_server' in data:
            cls._validate_server_config(data['napcat_server'], 'napcat_server')
        
        if 'maibot_server' in data:
            cls._validate_server_config(data['maibot_server'], 'maibot_server')
        
        if 'chat' in data:
            cls._validate_chat_config(data['chat'])
        
        if 'debug' in data and 'level' in data['debug']:
            valid_levels = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']
            if data['debug']['level'] not in valid_levels:
                raise ValueError(f'无效的日志等级: {data["debug"]["level"]}')
        
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
    def _validate_server_config(cls, server_config: Any, config_name: str) -> None:
        """验证服务器配置"""
        if not isinstance(server_config, dict):
            raise ValueError(f'{config_name} 必须是一个对象')
        
        if 'host' in server_config and not isinstance(server_config['host'], str):
            raise ValueError(f'{config_name}.host 必须是字符串')
        
        if 'port' in server_config:
            if not isinstance(server_config['port'], int) or not (1 <= server_config['port'] <= 65535):
                raise ValueError(f'{config_name}.port 必须是1-65535之间的数字')
        
        if 'heartbeat_interval' in server_config:
            if not isinstance(server_config['heartbeat_interval'], (int, float)) or server_config['heartbeat_interval'] < 1:
                raise ValueError(f'{config_name}.heartbeat_interval 必须是大于0的数字')
    
    @classmethod
    def _validate_chat_config(cls, chat_config: Any) -> None:
        """验证聊天配置"""
        if not isinstance(chat_config, dict):
            raise ValueError('chat 配置必须是一个对象')
        
        # 验证名单类型
        if 'group_list_type' in chat_config and chat_config['group_list_type'] not in ['whitelist', 'blacklist']:
            raise ValueError('group_list_type 必须是 whitelist 或 blacklist')
        
        if 'private_list_type' in chat_config and chat_config['private_list_type'] not in ['whitelist', 'blacklist']:
            raise ValueError('private_list_type 必须是 whitelist 或 blacklist')
        
        # 验证列表是否为数字数组
        def validate_number_array(arr: Any, name: str) -> None:
            if not isinstance(arr, list):
                raise ValueError(f'{name} 必须是数组')
            if not all(isinstance(item, int) and item > 0 for item in arr):
                raise ValueError(f'{name} 数组中的所有元素必须是正整数')
        
        if 'group_list' in chat_config:
            validate_number_array(chat_config['group_list'], 'group_list')
        
        if 'private_list' in chat_config:
            validate_number_array(chat_config['private_list'], 'private_list')
        
        if 'ban_user_id' in chat_config:
            validate_number_array(chat_config['ban_user_id'], 'ban_user_id')
        
        # 验证布尔值
        if 'ban_qq_bot' in chat_config and not isinstance(chat_config['ban_qq_bot'], bool):
            raise ValueError('ban_qq_bot 必须是布尔值')
        
        if 'enable_poke' in chat_config and not isinstance(chat_config['enable_poke'], bool):
            raise ValueError('enable_poke 必须是布尔值')
    
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
    async def _create_backup(cls, config_path: str) -> None:
        """创建配置文件备份"""
        try:
            adapter_root = path_cache_manager.get_adapter_root(cls.ADAPTER_NAME)
            if not adapter_root:
                raise RuntimeError('无法获取QQ适配器根目录路径')
            
            # 创建备份目录结构：LauncherConfigBak/adapter/qq/
            backup_dir = os.path.join(os.path.dirname(adapter_root), 'config', 'LauncherConfigBak', 'adapter', 'qq')
            os.makedirs(backup_dir, exist_ok=True)
            
            # 生成带时间戳的备份文件名
            timestamp = datetime.now().isoformat().replace(':', '-').replace('.', '-')
            config_filename = os.path.basename(config_path)
            backup_filename = f'{config_filename}.backup.{timestamp}'
            backup_path = os.path.join(backup_dir, backup_filename)
            
            # 复制配置文件到备份目录
            shutil.copy2(config_path, backup_path)
            logger.info(f'QQ适配器配置备份已创建: {backup_path}')
            
        except Exception as error:
            logger.warning(f'创建QQ适配器配置文件备份失败: {error}')
            # 备份失败不应该阻止配置更新，只记录警告
