"""
TOML 工具函数
TOML Helpers
提供TOML格式化和处理功能
"""

import re
from typing import Any


def remove_number_underscores(toml_string: str) -> str:
    """
    移除TOML字符串中数字的下划线分隔符
    toml库会自动为大数字添加下划线提高可读性，但有时我们需要干净的数字格式
    
    Args:
        toml_string: 包含下划线数字的TOML字符串
        
    Returns:
        移除数字下划线后的TOML字符串
    """
    result = toml_string
    
    # 1. 处理赋值语句中的单个数字
    # 匹配赋值语句中的数字（可能包含下划线）
    # 正则说明：
    # =\s* - 匹配等号和可选的空白字符
    # ([0-9_]+) - 捕获数字和下划线的组合
    # (?=\s*$) - 正向前瞻，确保数字后面只有空白字符直到行尾
    # 多行模式
    def replace_assignment(match):
        number_with_underscores = match.group(1)
        # 移除所有下划线
        clean_number = number_with_underscores.replace('_', '')
        return f"= {clean_number}"
    
    result = re.sub(r'=\s*([0-9_]+)(?=\s*$)', replace_assignment, result, flags=re.MULTILINE)
    
    # 2. 处理数组中的数字
    # 匹配数组中的数字（可能包含下划线）
    # 正则说明：
    # ([0-9]+(?:_[0-9]+)+) - 捕获包含下划线的数字（至少有一个下划线）
    # (?=[,\s\]]) - 正向前瞻，确保数字后面是逗号、空白字符或右括号
    def replace_array_number(match):
        # 移除所有下划线
        return match.group(0).replace('_', '')
    
    result = re.sub(r'([0-9]+(?:_[0-9]+)+)(?=[,\s\]])', replace_array_number, result)
    
    return result


def stringify_config_to_clean_toml(config: Any, toml_module: Any) -> str:
    """
    将配置对象转换为清理过的TOML字符串
    
    Args:
        config: 要转换的配置对象
        toml_module: TOML库模块
        
    Returns:
        移除数字下划线的TOML字符串
    """
    toml_string = toml_module.dumps(config)
    return remove_number_underscores(toml_string)
