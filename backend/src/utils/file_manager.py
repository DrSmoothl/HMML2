"""
文件管理器工具
File Manager Utility
"""

import json
import aiofiles
from pathlib import Path
from typing import Optional, TypeVar, Type
from pydantic import BaseModel
from core.logger import logger

T = TypeVar('T', bound=BaseModel)


class FileManager:
    """文件管理器工具类"""
    
    @staticmethod
    async def ensure_dir(dir_path: str) -> bool:
        """
        确保目录存在
        
        Args:
            dir_path: 目录路径
            
        Returns:
            bool: 是否成功
        """
        try:
            Path(dir_path).mkdir(parents=True, exist_ok=True)
            return True
        except Exception as e:
            logger.error(f"创建目录失败 {dir_path}: {e}")
            return False
    
    @staticmethod
    async def read_json(file_path: str, model_class: Optional[Type[T]] = None) -> Optional[T]:
        """
        读取JSON文件
        
        Args:
            file_path: 文件路径
            model_class: Pydantic模型类（可选）
            
        Returns:
            解析后的数据或None
        """
        try:
            path_obj = Path(file_path)
            if not path_obj.exists():
                logger.debug(f"JSON文件不存在: {file_path}")
                return None
            
            async with aiofiles.open(file_path, 'r', encoding='utf-8') as f:
                content = await f.read()
                data = json.loads(content)
                
                if model_class:
                    return model_class(**data)
                return data
                
        except Exception as e:
            logger.error(f"读取JSON文件失败 {file_path}: {e}")
            return None
    
    @staticmethod
    async def write_json(file_path: str, data: BaseModel) -> bool:
        """
        写入JSON文件
        
        Args:
            file_path: 文件路径
            data: 要写入的Pydantic模型数据
            
        Returns:
            bool: 是否成功
        """
        try:
            # 确保目录存在
            dir_path = Path(file_path).parent
            await FileManager.ensure_dir(str(dir_path))
            
            # 序列化数据
            json_data = data.model_dump(exclude_none=False)
            json_str = json.dumps(json_data, ensure_ascii=False, indent=2)
            
            # 写入文件
            async with aiofiles.open(file_path, 'w', encoding='utf-8') as f:
                await f.write(json_str)
            
            logger.debug(f"JSON文件写入成功: {file_path}")
            return True
            
        except Exception as e:
            logger.error(f"写入JSON文件失败 {file_path}: {e}")
            return False
