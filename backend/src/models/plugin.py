"""
插件模型定义
"""
from typing import List, Optional
from pydantic import BaseModel


class PluginAuthor(BaseModel):
    """插件作者信息"""
    name: Optional[str] = "未知作者"
    url: Optional[str] = None


class PluginHostApplication(BaseModel):
    """插件适配的主机应用版本信息"""
    min_version: Optional[str] = "0.0.0"
    max_version: Optional[str] = None


class PluginManifest(BaseModel):
    """插件清单文件结构"""
    manifest_version: Optional[int] = 1
    name: Optional[str] = "未知插件"
    version: Optional[str] = "0.0.0"
    description: Optional[str] = "暂无描述"
    author: Optional[PluginAuthor] = None
    license: Optional[str] = "未知许可证"
    host_application: Optional[PluginHostApplication] = None
    homepage_url: Optional[str] = None
    repository_url: Optional[str] = None
    keywords: List[str] = []
    categories: Optional[List[str]] = None
    default_locale: Optional[str] = "CN"
    locales_path: Optional[str] = None


class Plugin(BaseModel):
    """插件信息"""
    id: str
    manifest: PluginManifest
    installed: bool = False


class PluginListResponse(BaseModel):
    """插件列表响应"""
    items: List[Plugin]


class PluginInstallRequest(BaseModel):
    """插件安装请求"""
    plugin_id: str


class PluginInstallResponse(BaseModel):
    """插件安装响应"""
    id: int
