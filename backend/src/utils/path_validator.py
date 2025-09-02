"""
路径验证工具
Path Validator Utility
"""

import os
from pathlib import Path
from models.path_cache import PathValidationResult
from core.logger import logger


class PathValidator:
    """路径验证工具类"""
    
    @staticmethod
    async def validate_path(path_str: str, must_exist: bool = True) -> PathValidationResult:
        """
        验证路径有效性
        
        Args:
            path_str: 要验证的路径字符串
            must_exist: 是否必须存在
            
        Returns:
            PathValidationResult: 验证结果
        """
        try:
            # 规范化路径
            normalized_path = PathValidator.normalize_path(path_str)
            absolute_path = Path(normalized_path).resolve()
            
            # 检查路径是否存在
            exists = absolute_path.exists()
            is_directory = absolute_path.is_dir() if exists else False
            
            # 验证逻辑
            if must_exist and not exists:
                return PathValidationResult(
                    is_valid=False,
                    error=f"路径不存在: {absolute_path}",
                    exists=False,
                    is_directory=False,
                    absolute_path=str(absolute_path)
                )
            
            if exists and not is_directory:
                return PathValidationResult(
                    is_valid=False,
                    error=f"路径不是目录: {absolute_path}",
                    exists=True,
                    is_directory=False,
                    absolute_path=str(absolute_path)
                )
            
            return PathValidationResult(
                is_valid=True,
                error=None,
                exists=exists,
                is_directory=is_directory,
                absolute_path=str(absolute_path)
            )
            
        except Exception as e:
            logger.error(f"路径验证失败: {e}")
            return PathValidationResult(
                is_valid=False,
                error=f"路径验证失败: {str(e)}",
                exists=False,
                is_directory=False,
                absolute_path=None
            )
    
    @staticmethod
    def normalize_path(path_str: str) -> str:
        """
        规范化路径
        
        Args:
            path_str: 原始路径字符串
            
        Returns:
            str: 规范化后的路径
        """
        if not path_str:
            return ""
        
        # 去除首尾空白
        path_str = path_str.strip()
        
        # 替换反斜杠为正斜杠（Windows兼容）
        path_str = path_str.replace('\\', '/')
        
        # 规范化路径
        normalized = os.path.normpath(path_str)
        
        return normalized
    
    @staticmethod
    async def ensure_directory(path_str: str) -> bool:
        """
        确保目录存在，如果不存在则创建
        
        Args:
            path_str: 目录路径
            
        Returns:
            bool: 是否成功创建或已存在
        """
        try:
            path_obj = Path(path_str)
            path_obj.mkdir(parents=True, exist_ok=True)
            return True
        except Exception as e:
            logger.error(f"创建目录失败 {path_str}: {e}")
            return False
