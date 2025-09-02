"""
数据库操作验证工具
提供数据验证和清理功能
"""

import re
from typing import Any, Optional, Dict, List
import logging

logger = logging.getLogger("HMML")


class DatabaseValidator:
    """数据库验证器"""
    
    @staticmethod
    def validate_table_name(table_name: str) -> bool:
        """
        验证表名是否有效
        
        Args:
            table_name: 表名
            
        Returns:
            是否有效
        """
        if not table_name:
            return False
        
        # 检查是否只包含字母、数字和下划线
        pattern = r'^[a-zA-Z_][a-zA-Z0-9_]*$'
        return bool(re.match(pattern, table_name))
    
    @staticmethod
    def validate_field_name(field_name: str) -> bool:
        """
        验证字段名是否有效
        
        Args:
            field_name: 字段名
            
        Returns:
            是否有效
        """
        if not field_name:
            return False
        
        # 检查是否只包含字母、数字和下划线
        pattern = r'^[a-zA-Z_][a-zA-Z0-9_]*$'
        return bool(re.match(pattern, field_name))
    
    @staticmethod
    def validate_pagination_params(page: int, page_size: int) -> tuple[int, int]:
        """
        验证和清理分页参数
        
        Args:
            page: 页码
            page_size: 页大小
            
        Returns:
            验证后的页码和页大小
        """
        # 验证页码
        if page < 1:
            page = 1
        
        # 验证页大小
        if page_size < 1:
            page_size = 10
        elif page_size > 1000:
            page_size = 1000
        
        return page, page_size
    
    @staticmethod
    def sanitize_string(value: str, max_length: Optional[int] = None) -> str:
        """
        清理字符串输入
        
        Args:
            value: 输入字符串
            max_length: 最大长度
            
        Returns:
            清理后的字符串
        """
        if not isinstance(value, str):
            value = str(value)
        
        # 移除首尾空白
        value = value.strip()
        
        # 限制长度
        if max_length and len(value) > max_length:
            value = value[:max_length]
        
        return value
    
    @staticmethod
    def validate_sort_field(field: str, allowed_fields: List[str]) -> bool:
        """
        验证排序字段是否在允许列表中
        
        Args:
            field: 排序字段
            allowed_fields: 允许的字段列表
            
        Returns:
            是否有效
        """
        return field in allowed_fields
    
    @staticmethod
    def clean_where_conditions(conditions: Dict[str, Any]) -> Dict[str, Any]:
        """
        清理WHERE条件
        
        Args:
            conditions: 原始条件
            
        Returns:
            清理后的条件
        """
        cleaned = {}
        
        for key, value in conditions.items():
            # 验证字段名
            if not DatabaseValidator.validate_field_name(key):
                logger.warning(f"无效的字段名: {key}")
                continue
            
            # 跳过None值
            if value is None:
                continue
            
            # 清理字符串值
            if isinstance(value, str):
                value = DatabaseValidator.sanitize_string(value)
                if not value:  # 跳过空字符串
                    continue
            
            cleaned[key] = value
        
        return cleaned
    
    @staticmethod
    def validate_insert_data(data: Dict[str, Any], required_fields: List[str]) -> tuple[bool, str]:
        """
        验证插入数据
        
        Args:
            data: 插入数据
            required_fields: 必需字段列表
            
        Returns:
            (是否有效, 错误消息)
        """
        if not data:
            return False, "插入数据不能为空"
        
        # 检查必需字段
        missing_fields = []
        for field in required_fields:
            if field not in data or data[field] is None:
                missing_fields.append(field)
        
        if missing_fields:
            return False, f"缺少必需字段: {', '.join(missing_fields)}"
        
        # 验证字段名
        for field in data.keys():
            if not DatabaseValidator.validate_field_name(field):
                return False, f"无效的字段名: {field}"
        
        return True, ""
    
    @staticmethod
    def validate_update_data(data: Dict[str, Any]) -> tuple[bool, str]:
        """
        验证更新数据
        
        Args:
            data: 更新数据
            
        Returns:
            (是否有效, 错误消息)
        """
        if not data:
            return False, "更新数据不能为空"
        
        # 验证字段名
        for field in data.keys():
            if not DatabaseValidator.validate_field_name(field):
                return False, f"无效的字段名: {field}"
        
        # 检查是否有有效的更新字段（排除None值）
        valid_fields = {k: v for k, v in data.items() if v is not None}
        if not valid_fields:
            return False, "没有有效的更新字段"
        
        return True, ""
    
    @staticmethod
    def validate_id(id_value: Any, field_name: str = "id") -> tuple[bool, str]:
        """
        验证ID值
        
        Args:
            id_value: ID值
            field_name: 字段名
            
        Returns:
            (是否有效, 错误消息)
        """
        try:
            id_int = int(id_value)
            if id_int <= 0:
                return False, f"{field_name}必须大于0"
            return True, ""
        except (ValueError, TypeError):
            return False, f"{field_name}必须是有效的整数"


class SqlSanitizer:
    """SQL注入防护工具"""
    
    @staticmethod
    def escape_like_pattern(pattern: str) -> str:
        """
        转义LIKE模式中的特殊字符
        
        Args:
            pattern: 原始模式
            
        Returns:
            转义后的模式
        """
        # 转义SQL LIKE中的特殊字符
        pattern = pattern.replace('\\', '\\\\')
        pattern = pattern.replace('%', '\\%')
        pattern = pattern.replace('_', '\\_')
        return pattern
    
    @staticmethod
    def validate_order_direction(direction: str) -> str:
        """
        验证排序方向
        
        Args:
            direction: 排序方向
            
        Returns:
            有效的排序方向
        """
        direction = direction.upper().strip()
        return "DESC" if direction == "DESC" else "ASC"
    
    @staticmethod
    def is_safe_identifier(identifier: str) -> bool:
        """
        检查标识符是否安全（防止SQL注入）
        
        Args:
            identifier: 标识符
            
        Returns:
            是否安全
        """
        # 只允许字母、数字和下划线
        pattern = r'^[a-zA-Z_][a-zA-Z0-9_]*$'
        return bool(re.match(pattern, identifier))


# 常用验证器实例
db_validator = DatabaseValidator()
sql_sanitizer = SqlSanitizer()
