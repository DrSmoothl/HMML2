"""
HMML Logger System
日志系统 - 提供统一的日志记录功能
"""

import logging
import sys
from pathlib import Path
from logging.handlers import RotatingFileHandler
from pythonjsonlogger import jsonlogger
from enum import Enum


class LogLevel(Enum):
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class Logger:
    """HMML 日志管理器"""
    
    def __init__(self):
        self.logger = logging.getLogger("HMML")
        self.logger.setLevel(logging.DEBUG)
        self._handlers_added = False
        self._log_dir = Path("logs")
    
    def configure(self, level: str = "INFO", enable_console: bool = True, 
                 enable_file: bool = True, max_file_size: int = 10, max_files: int = 5):
        """配置日志系统"""
        
        # 清除现有的处理器
        if self._handlers_added:
            for handler in self.logger.handlers[:]:
                self.logger.removeHandler(handler)
        
        # 设置日志级别
        log_level = getattr(logging, level.upper(), logging.INFO)
        self.logger.setLevel(log_level)
        
        # 控制台处理器
        if enable_console:
            console_handler = logging.StreamHandler(sys.stdout)
            console_formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                datefmt='%Y-%m-%d %H:%M:%S'
            )
            console_handler.setFormatter(console_formatter)
            console_handler.setLevel(log_level)
            self.logger.addHandler(console_handler)
        
        # 文件处理器
        if enable_file:
            self._log_dir.mkdir(exist_ok=True)
            
            # 普通日志文件
            file_handler = RotatingFileHandler(
                self._log_dir / "hmml.log",
                maxBytes=max_file_size * 1024 * 1024,  # MB to bytes
                backupCount=max_files,
                encoding='utf-8'
            )
            
            # JSON格式的日志
            json_formatter = jsonlogger.JsonFormatter(
                '%(asctime)s %(name)s %(levelname)s %(message)s',
                datefmt='%Y-%m-%d %H:%M:%S'
            )
            file_handler.setFormatter(json_formatter)
            file_handler.setLevel(log_level)
            self.logger.addHandler(file_handler)
            
            # 错误日志文件（只记录WARNING及以上级别）
            error_handler = RotatingFileHandler(
                self._log_dir / "hmml-error.log",
                maxBytes=max_file_size * 1024 * 1024,
                backupCount=max_files,
                encoding='utf-8'
            )
            error_handler.setFormatter(json_formatter)
            error_handler.setLevel(logging.WARNING)
            self.logger.addHandler(error_handler)
        
        self._handlers_added = True
    
    def debug(self, msg, *args, **kwargs):
        """调试级别日志"""
        self.logger.debug(msg, *args, **kwargs)
    
    def info(self, msg, *args, **kwargs):
        """信息级别日志"""
        self.logger.info(msg, *args, **kwargs)
    
    def warning(self, msg, *args, **kwargs):
        """警告级别日志"""
        self.logger.warning(msg, *args, **kwargs)
    
    def warn(self, msg, *args, **kwargs):
        """警告级别日志（别名）"""
        self.logger.warning(msg, *args, **kwargs)
    
    def error(self, msg, *args, **kwargs):
        """错误级别日志"""
        self.logger.error(msg, *args, **kwargs)
    
    def critical(self, msg, *args, **kwargs):
        """严重错误级别日志"""
        self.logger.critical(msg, *args, **kwargs)
    
    def fatal(self, msg, *args, **kwargs):
        """致命错误级别日志（别名）"""
        self.logger.critical(msg, *args, **kwargs)
    
    async def close(self):
        """关闭日志系统"""
        for handler in self.logger.handlers[:]:
            handler.close()
            self.logger.removeHandler(handler)


# 全局日志实例
logger = Logger()
