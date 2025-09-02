"""
SQLite数据库连接管理器
负责管理数据库连接的创建、管理和销毁
"""

import sqlite3
import os
import threading
from typing import Optional
from pathlib import Path
from models.database import DatabaseConfig, DatabaseInfo, TableInfo
import logging

logger = logging.getLogger("HMML")


class DatabaseConnection:
    """数据库连接管理类"""
    
    def __init__(self, config: DatabaseConfig):
        """
        初始化数据库连接
        
        Args:
            config: 数据库配置
        """
        self.config = config
        self.connection: Optional[sqlite3.Connection] = None
        self._lock = threading.Lock()
        self.connection_id = f"db_{id(self)}"
        
    def connect(self) -> None:
        """建立数据库连接"""
        with self._lock:
            if self.connection is not None:
                logger.warning(f"数据库连接已存在: {self.connection_id}")
                return
                
            try:
                # 确保数据库目录存在
                db_path = Path(self.config.path)
                db_path.parent.mkdir(parents=True, exist_ok=True)
                
                # 建立连接
                self.connection = sqlite3.connect(
                    self.config.path,
                    timeout=self.config.timeout,
                    check_same_thread=self.config.check_same_thread
                )
                
                # 设置行工厂，使查询结果返回字典
                self.connection.row_factory = sqlite3.Row
                
                # 设置外键支持
                self.connection.execute("PRAGMA foreign_keys = ON")
                
                logger.info(f"数据库连接成功: {self.config.path}")
                
            except Exception as error:
                logger.error(f"数据库连接失败: {error}")
                raise
                
    def disconnect(self) -> None:
        """关闭数据库连接"""
        with self._lock:
            if self.connection is not None:
                try:
                    self.connection.close()
                    self.connection = None
                    logger.info(f"数据库连接已关闭: {self.connection_id}")
                except Exception as error:
                    logger.error(f"关闭数据库连接失败: {error}")
                    
    def is_connected(self) -> bool:
        """检查连接状态"""
        return self.connection is not None
        
    def get_connection(self) -> sqlite3.Connection:
        """获取数据库连接"""
        if self.connection is None:
            raise RuntimeError("数据库未连接")
        return self.connection
        
    def execute_query(self, sql: str, params: tuple = ()) -> sqlite3.Cursor:
        """
        执行查询SQL
        
        Args:
            sql: SQL语句
            params: 参数
            
        Returns:
            查询结果游标
        """
        if self.connection is None:
            raise RuntimeError("数据库未连接")
            
        try:
            cursor = self.connection.execute(sql, params)
            return cursor
        except Exception as error:
            logger.error(f"执行查询失败: {error}, SQL: {sql}")
            raise
            
    def execute_update(self, sql: str, params: tuple = ()) -> int:
        """
        执行更新SQL
        
        Args:
            sql: SQL语句
            params: 参数
            
        Returns:
            影响的行数
        """
        if self.connection is None:
            raise RuntimeError("数据库未连接")
            
        try:
            cursor = self.connection.execute(sql, params)
            self.connection.commit()
            # 保存最后插入的ID到实例变量
            self._last_insert_rowid = cursor.lastrowid
            return cursor.rowcount
        except Exception as error:
            self.connection.rollback()
            logger.error(f"执行更新失败: {error}, SQL: {sql}")
            raise
            
    def get_last_insert_id(self) -> Optional[int]:
        """获取最后插入的ID"""
        if self.connection is None:
            raise RuntimeError("数据库未连接")
        return getattr(self, '_last_insert_rowid', None)
        
    def begin_transaction(self) -> None:
        """开始事务"""
        if self.connection is None:
            raise RuntimeError("数据库未连接")
        self.connection.execute("BEGIN")
        
    def commit_transaction(self) -> None:
        """提交事务"""
        if self.connection is None:
            raise RuntimeError("数据库未连接")
        self.connection.commit()
        
    def rollback_transaction(self) -> None:
        """回滚事务"""
        if self.connection is None:
            raise RuntimeError("数据库未连接")
        self.connection.rollback()
        
    def get_table_info(self, table_name: str) -> Optional[TableInfo]:
        """
        获取表信息
        
        Args:
            table_name: 表名
            
        Returns:
            表信息或None
        """
        try:
            # 检查表是否存在
            cursor = self.execute_query(
                "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
                (table_name,)
            )
            if not cursor.fetchone():
                return None
                
            # 获取列信息
            cursor = self.execute_query(f"PRAGMA table_info({table_name})")
            columns = [dict(row) for row in cursor.fetchall()]
            
            # 获取行数
            cursor = self.execute_query(f"SELECT COUNT(*) as count FROM {table_name}")
            row_count = cursor.fetchone()['count']
            
            return TableInfo(
                name=table_name,
                column_count=len(columns),
                row_count=row_count,
                columns=columns
            )
            
        except Exception as error:
            logger.error(f"获取表信息失败: {error}")
            return None
            
    def get_database_info(self) -> DatabaseInfo:
        """获取数据库信息"""
        try:
            # 获取文件大小
            file_size = os.path.getsize(self.config.path) if os.path.exists(self.config.path) else 0
            
            # 获取所有表名
            cursor = self.execute_query(
                "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
            )
            tables = [row['name'] for row in cursor.fetchall()]
            
            return DatabaseInfo(
                path=self.config.path,
                size=file_size,
                table_count=len(tables),
                tables=tables
            )
            
        except Exception as error:
            logger.error(f"获取数据库信息失败: {error}")
            raise
            
    def validate_connection(self) -> bool:
        """验证连接是否可用"""
        try:
            if self.connection is None:
                return False
            cursor = self.connection.execute("SELECT 1")
            cursor.fetchone()
            return True
        except Exception:
            return False
            
    def __enter__(self):
        """上下文管理器入口"""
        self.connect()
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        """上下文管理器出口"""
        self.disconnect()
        
    def __del__(self):
        """析构函数"""
        if self.connection is not None:
            self.disconnect()
