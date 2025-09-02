"""
SQLite数据库管理器
负责管理多个数据库连接和提供统一的数据库操作接口
"""

import os
from typing import Dict, Optional
from .database_connection import DatabaseConnection
from .database_operator import DatabaseOperator
from models.database import DatabaseConfig, DatabaseInfo
from .path_cache_manager import PathCacheManager
import logging

logger = logging.getLogger("HMML")


class DatabaseManager:
    """数据库管理器"""
    
    def __init__(self):
        """初始化数据库管理器"""
        self.connections: Dict[str, DatabaseConnection] = {}
        self.operators: Dict[str, DatabaseOperator] = {}
        self.path_cache_manager: Optional[PathCacheManager] = None
        self.is_initialized = False
        
    async def initialize(self, path_cache_manager: PathCacheManager) -> None:
        """
        初始化数据库管理器
        
        Args:
            path_cache_manager: 路径缓存管理器
        """
        try:
            logger.info("正在初始化数据库管理器...")
            self.path_cache_manager = path_cache_manager
            
            # 自动初始化麦麦数据库连接
            await self._initialize_maimai_database()
            
            self.is_initialized = True
            logger.info("数据库管理器初始化完成")
            
        except Exception as error:
            logger.error(f"数据库管理器初始化失败: {error}")
            raise
            
    async def _initialize_maimai_database(self) -> None:
        """初始化麦麦主程序数据库连接"""
        try:
            if not self.path_cache_manager:
                logger.warning("路径缓存管理器未设置，跳过麦麦数据库初始化")
                return
                
            main_root = self.path_cache_manager.get_main_root()
            logger.info(f"从路径缓存管理器获取到的主程序根目录: {main_root}")
            
            if not main_root:
                logger.warning("麦麦主程序根目录未设置，跳过数据库初始化")
                return
                
            # 构建数据库路径
            db_path = os.path.join(main_root, "data", "MaiBot.db")
            logger.info(f"构建的数据库路径: {db_path}")
            
            # 检查数据库文件是否存在
            if not os.path.exists(db_path):
                logger.warning(f"麦麦数据库文件不存在: {db_path}")
                return
                
            # 添加数据库连接
            await self.add_database("maibot", DatabaseConfig(
                path=db_path,
                readonly=False,
                timeout=30,
                check_same_thread=False
            ))
            
            logger.info(f"麦麦数据库连接已建立: {db_path}")
            
        except Exception as error:
            logger.error(f"初始化麦麦数据库失败: {error}")
            # 不抛出异常，允许继续运行
            
    async def add_database(self, name: str, config: DatabaseConfig) -> None:
        """
        添加数据库连接
        
        Args:
            name: 连接名称
            config: 数据库配置
        """
        try:
            if name in self.connections:
                logger.warning(f"数据库连接已存在: {name}")
                return
                
            # 创建连接
            connection = DatabaseConnection(config)
            connection.connect()
            
            # 创建操作器
            operator = DatabaseOperator(connection)
            
            # 保存连接和操作器
            self.connections[name] = connection
            self.operators[name] = operator
            
            logger.info(f"数据库连接添加成功: {name}")
            
        except Exception as error:
            logger.error(f"添加数据库连接失败: {error}")
            raise
            
    def remove_database(self, name: str) -> None:
        """
        移除数据库连接
        
        Args:
            name: 连接名称
        """
        try:
            if name not in self.connections:
                logger.warning(f"数据库连接不存在: {name}")
                return
                
            # 关闭连接
            connection = self.connections[name]
            connection.disconnect()
            
            # 移除连接和操作器
            del self.connections[name]
            del self.operators[name]
            
            logger.info(f"数据库连接已移除: {name}")
            
        except Exception as error:
            logger.error(f"移除数据库连接失败: {error}")
            
    def get_connection(self, name: str) -> Optional[DatabaseConnection]:
        """
        获取数据库连接
        
        Args:
            name: 连接名称
            
        Returns:
            数据库连接或None
        """
        return self.connections.get(name)
        
    def get_operator(self, name: str) -> Optional[DatabaseOperator]:
        """
        获取数据库操作器
        
        Args:
            name: 连接名称
            
        Returns:
            数据库操作器或None
        """
        return self.operators.get(name)
        
    def list_connections(self) -> list[str]:
        """获取所有连接名称列表"""
        return list(self.connections.keys())
        
    def get_database_info(self, name: str) -> Optional[DatabaseInfo]:
        """
        获取数据库信息
        
        Args:
            name: 连接名称
            
        Returns:
            数据库信息或None
        """
        connection = self.get_connection(name)
        if not connection:
            return None
            
        try:
            return connection.get_database_info()
        except Exception as error:
            logger.error(f"获取数据库信息失败: {error}")
            return None
            
    def test_connection(self, name: str) -> bool:
        """
        测试数据库连接
        
        Args:
            name: 连接名称
            
        Returns:
            连接是否可用
        """
        connection = self.get_connection(name)
        if not connection:
            return False
            
        return connection.validate_connection()
        
    async def close_all_connections(self) -> None:
        """关闭所有数据库连接"""
        try:
            logger.info("正在关闭所有数据库连接...")
            
            for name, connection in self.connections.items():
                try:
                    connection.disconnect()
                    logger.info(f"数据库连接已关闭: {name}")
                except Exception as error:
                    logger.error(f"关闭数据库连接失败 {name}: {error}")
                    
            self.connections.clear()
            self.operators.clear()
            self.is_initialized = False
            
            logger.info("所有数据库连接已关闭")
            
        except Exception as error:
            logger.error(f"关闭数据库连接失败: {error}")
            
    def get_maibot_operator(self) -> Optional[DatabaseOperator]:
        """获取麦麦数据库操作器的便捷方法"""
        return self.get_operator("maibot")
        
    def is_maibot_connected(self) -> bool:
        """检查麦麦数据库是否已连接"""
        return self.test_connection("maibot")


# 全局数据库管理器实例
database_manager = DatabaseManager()
