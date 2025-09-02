"""
HMML Configuration Manager
配置管理器 - 负责加载和管理应用配置
"""

import json
from pathlib import Path
from typing import Optional
from pydantic import BaseModel, Field


class ServerConfig(BaseModel):
    port: int = 7999
    host: str = "0.0.0.0"
    prefix: str = ""
    reverse_proxy_mode: bool = False


class LoggerConfig(BaseModel):
    level: str = "INFO"
    enable_console: bool = True
    enable_file: bool = True
    max_file_size: int = 10
    max_files: int = 5


class SecurityConfig(BaseModel):
    session_secret: str = "hmml-default-secret-key-please-change-in-production"
    cors_enabled: bool = True
    cors_origins: list[str] = ["*"]
    max_request_size: str = "10mb"


class AppConfig(BaseModel):
    name: str = "HMML"
    version: str = "1.0.0"
    description: str = "Hello MaiMai Launcher Backend Service"


class Config(BaseModel):
    version: str = "1.0.0"
    server: ServerConfig = Field(default_factory=ServerConfig)
    logger: LoggerConfig = Field(default_factory=LoggerConfig)
    security: SecurityConfig = Field(default_factory=SecurityConfig)
    app: AppConfig = Field(default_factory=AppConfig)


class ConfigManager:
    """配置管理器"""
    
    def __init__(self, config_dir: str = "config"):
        self.config_dir = Path(config_dir)
        self.config_file = self.config_dir / "server.json"
        self._config: Optional[Config] = None
    
    async def load(self) -> Config:
        """加载配置"""
        try:
            if self.config_file.exists():
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    config_data = json.load(f)
                self._config = Config(**config_data)
            else:
                # 创建默认配置
                self._config = Config()
                await self.save()
            
            return self._config
        except Exception as e:
            print(f"配置加载失败，使用默认配置: {e}")
            self._config = Config()
            return self._config
    
    async def save(self) -> None:
        """保存配置"""
        if self._config is None:
            return
        
        # 确保配置目录存在
        self.config_dir.mkdir(parents=True, exist_ok=True)
        
        with open(self.config_file, 'w', encoding='utf-8') as f:
            json.dump(self._config.model_dump(), f, indent=2, ensure_ascii=False)
    
    def get(self) -> Config:
        """获取当前配置"""
        if self._config is None:
            raise RuntimeError("配置未加载，请先调用 load() 方法")
        return self._config
    
    def update(self, **kwargs) -> None:
        """更新配置"""
        if self._config is None:
            raise RuntimeError("配置未加载，请先调用 load() 方法")
        
        # 这里可以实现更复杂的配置更新逻辑
        for key, value in kwargs.items():
            if hasattr(self._config, key):
                setattr(self._config, key, value)


# 全局配置管理器实例
config_manager = ConfigManager()
