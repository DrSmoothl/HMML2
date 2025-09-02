"""
模型配置服务
Model Configuration Service
提供对model_config.toml文件的读取和写入操作
"""

import os
import shutil
from datetime import datetime
from typing import Optional, Dict, Any

import toml

from core.logger import logger
from core.path_cache_manager import path_cache_manager
from models.config import (
    ModelConfigData,
    ConfigUpdateData,
    ConfigFileInfo,
    ConfigServiceOptions,
    ApiProviderData,
    ModelData
)
from utils.toml_helpers import stringify_config_to_clean_toml


class ModelConfigService:
    """模型配置服务类"""
    
    CONFIG_FILE_NAME = 'model_config.toml'
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
            logger.error(f'获取模型配置文件信息失败: {error}')
            raise RuntimeError('获取模型配置文件信息失败')
    
    @classmethod
    async def get_config(cls, options: Optional[ConfigServiceOptions] = None) -> ModelConfigData:
        """读取模型配置文件"""
        try:
            opts = options or ConfigServiceOptions()
            config_path = cls._get_config_path()
            
            # 检查文件是否存在
            file_info = await cls.get_config_file_info()
            if not file_info.exists:
                raise FileNotFoundError(f'模型配置文件不存在: {config_path}')
            
            if not file_info.readable:
                raise PermissionError(f'模型配置文件不可读: {config_path}')
            
            # 读取文件内容
            try:
                with open(config_path, 'r', encoding=opts.encoding) as f:
                    file_content = f.read()
            except Exception as error:
                logger.error(f'读取模型配置文件失败: {error}')
                raise RuntimeError(f'读取模型配置文件失败: {error}')
            
            # 解析TOML内容
            try:
                config_data = toml.loads(file_content)
            except Exception as error:
                logger.error(f'解析模型配置文件失败: {error}')
                raise ValueError(f'模型配置文件格式错误: {error}')
            
            logger.info('模型配置读取成功')
            return ModelConfigData(**config_data)
            
        except Exception as error:
            logger.error(f'获取模型配置失败: {error}')
            raise error
    
    @classmethod
    async def update_config(
        cls,
        update_data: ConfigUpdateData,
        options: Optional[ConfigServiceOptions] = None
    ) -> None:
        """更新模型配置文件"""
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
                    raise PermissionError(f'模型配置文件不可读: {config_path}')
                if not file_info.writable:
                    raise PermissionError(f'模型配置文件不可写: {config_path}')
                
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
                toml_content = stringify_config_to_clean_toml(merged_config, toml)
                with open(config_path, 'w', encoding=opts.encoding) as f:
                    f.write(toml_content)
            except Exception as error:
                logger.error(f'写入模型配置文件失败: {error}')
                raise RuntimeError(f'写入模型配置文件失败: {error}')
            
            logger.info('模型配置更新成功')
            
        except Exception as error:
            logger.error(f'更新模型配置失败: {error}')
            raise error
    
    @classmethod
    async def add_provider(
        cls,
        provider_data: ApiProviderData,
        options: Optional[ConfigServiceOptions] = None
    ) -> None:
        """添加API服务提供商"""
        try:
            # 读取现有配置
            current_config = await cls.get_config(ConfigServiceOptions(validate=False))
            current_dict = current_config.model_dump()
            
            # 确保api_providers数组存在
            if 'api_providers' not in current_dict:
                current_dict['api_providers'] = []
            
            # 检查供应商名称是否已存在
            for provider in current_dict['api_providers']:
                if provider.get('name') == provider_data.name:
                    raise ValueError(f'供应商 "{provider_data.name}" 已存在')
            
            # 添加新供应商
            new_provider = provider_data.model_dump()
            current_dict['api_providers'].append(new_provider)
            
            # 更新配置
            update_data = ConfigUpdateData(**current_dict)
            await cls.update_config(update_data, options)
            logger.info(f'已添加API供应商: {provider_data.name}')
            
        except Exception as error:
            logger.error(f'添加API供应商失败: {error}')
            raise error
    
    @classmethod
    async def delete_provider(
        cls,
        provider_name: str,
        options: Optional[ConfigServiceOptions] = None
    ) -> None:
        """删除API服务提供商"""
        try:
            # 读取现有配置
            current_config = await cls.get_config(ConfigServiceOptions(validate=False))
            current_dict = current_config.model_dump()
            
            if 'api_providers' not in current_dict:
                raise ValueError(f'供应商 "{provider_name}" 不存在')
            
            # 查找供应商索引
            provider_index = -1
            for i, provider in enumerate(current_dict['api_providers']):
                if provider.get('name') == provider_name:
                    provider_index = i
                    break
            
            if provider_index == -1:
                raise ValueError(f'供应商 "{provider_name}" 不存在')
            
            # 检查是否有模型正在使用这个供应商
            if 'models' in current_dict and current_dict['models']:
                using_models = [
                    model.get('name') for model in current_dict['models']
                    if model.get('api_provider') == provider_name
                ]
                if using_models:
                    raise ValueError(f'无法删除供应商 "{provider_name}"，以下模型正在使用: {", ".join(using_models)}')
            
            # 删除供应商
            current_dict['api_providers'].pop(provider_index)
            
            # 更新配置
            update_data = ConfigUpdateData(**current_dict)
            await cls.update_config(update_data, options)
            logger.info(f'已删除API供应商: {provider_name}')
            
        except Exception as error:
            logger.error(f'删除API供应商失败: {error}')
            raise error
    
    @classmethod
    async def add_model(
        cls,
        model_data: ModelData,
        options: Optional[ConfigServiceOptions] = None
    ) -> None:
        """添加模型配置"""
        try:
            # 读取现有配置
            current_config = await cls.get_config(ConfigServiceOptions(validate=False))
            current_dict = current_config.model_dump()
            
            # 确保models数组存在
            if 'models' not in current_dict:
                current_dict['models'] = []
            
            # 检查模型名称是否已存在
            for model in current_dict['models']:
                if model.get('name') == model_data.name:
                    raise ValueError(f'模型 "{model_data.name}" 已存在')
            
            # 检查API供应商是否存在
            if 'api_providers' in current_dict and current_dict['api_providers']:
                provider_exists = any(
                    provider.get('name') == model_data.api_provider
                    for provider in current_dict['api_providers']
                )
                if not provider_exists:
                    raise ValueError(f'API供应商 "{model_data.api_provider}" 不存在')
            
            # 添加新模型
            new_model = model_data.model_dump()
            # 移除None值的字段
            new_model = {k: v for k, v in new_model.items() if v is not None}
            current_dict['models'].append(new_model)
            
            # 更新配置
            update_data = ConfigUpdateData(**current_dict)
            await cls.update_config(update_data, options)
            logger.info(f'已添加模型: {model_data.name}')
            
        except Exception as error:
            logger.error(f'添加模型失败: {error}')
            raise error
    
    @classmethod
    async def delete_model(
        cls,
        model_name: str,
        options: Optional[ConfigServiceOptions] = None
    ) -> None:
        """删除模型配置"""
        try:
            # 读取现有配置
            current_config = await cls.get_config(ConfigServiceOptions(validate=False))
            current_dict = current_config.model_dump()
            
            if 'models' not in current_dict:
                raise ValueError(f'模型 "{model_name}" 不存在')
            
            # 查找模型索引
            model_index = -1
            for i, model in enumerate(current_dict['models']):
                if model.get('name') == model_name:
                    model_index = i
                    break
            
            if model_index == -1:
                raise ValueError(f'模型 "{model_name}" 不存在')
            
            # 删除模型
            current_dict['models'].pop(model_index)
            
            # 更新配置
            update_data = ConfigUpdateData(**current_dict)
            await cls.update_config(update_data, options)
            logger.info(f'已删除模型: {model_name}')
            
        except Exception as error:
            logger.error(f'删除模型失败: {error}')
            raise error
    
    @classmethod
    def _validate_config_data(cls, data: Dict[str, Any]) -> None:
        """验证配置数据格式"""
        if not isinstance(data, dict):
            raise ValueError('配置数据必须是一个对象')
        
        # 模型配置特定验证规则
        cls._validate_model_specific_rules(data)
        
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
    def _validate_model_specific_rules(cls, data: Dict[str, Any]) -> None:
        """验证模型配置特定规则"""
        # API相关验证
        if 'api_key' in data and data['api_key'] is not None:
            if not isinstance(data['api_key'], str):
                raise ValueError('API密钥必须是字符串格式')
        
        if 'api_base' in data and data['api_base'] is not None:
            if not isinstance(data['api_base'], str) or not cls._is_valid_url(data['api_base']):
                raise ValueError('API基础URL必须是有效的URL格式')
    
    @classmethod
    def _is_valid_url(cls, url: str) -> bool:
        """验证URL格式"""
        try:
            from urllib.parse import urlparse
            result = urlparse(url)
            return all([result.scheme, result.netloc])
        except Exception:
            return False
    
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
            main_root = path_cache_manager.get_main_root()
            if not main_root:
                raise RuntimeError('无法获取麦麦根目录路径')
            
            # 创建备份目录结构：config/LauncherConfigBak/model/
            backup_dir = os.path.join(main_root, 'config', 'LauncherConfigBak', 'model')
            os.makedirs(backup_dir, exist_ok=True)
            
            # 生成带时间戳的备份文件名
            timestamp = datetime.now().isoformat().replace(':', '-').replace('.', '-')
            config_filename = os.path.basename(config_path)
            backup_filename = f'{config_filename}.backup.{timestamp}'
            backup_path = os.path.join(backup_dir, backup_filename)
            
            # 复制配置文件到备份目录
            shutil.copy2(config_path, backup_path)
            logger.info(f'模型配置备份已创建: {backup_path}')
            
        except Exception as error:
            logger.warning(f'创建模型配置文件备份失败: {error}')
            # 备份失败不应该阻止配置更新，只记录警告
