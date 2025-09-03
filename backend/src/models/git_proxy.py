"""
Git代理加速配置模型
用于管理Git克隆时使用的代理加速服务
"""

from typing import List, Optional
from pydantic import BaseModel, Field, validator


class GitProxyMirror(BaseModel):
    """Git代理镜像配置"""
    name: str = Field(..., description="镜像名称")
    base_url: str = Field(..., description="镜像基础URL")
    enabled: bool = Field(default=True, description="是否启用")
    priority: int = Field(default=1, description="优先级，数字越小优先级越高")
    timeout: int = Field(default=60, description="超时时间(秒)")
    description: Optional[str] = Field(default=None, description="描述")
    
    @validator('base_url')
    def validate_base_url(cls, v):
        """验证基础URL格式"""
        if not v.startswith(('http://', 'https://')):
            raise ValueError('base_url必须以http://或https://开头')
        return v.rstrip('/')


class GitProxyConfig(BaseModel):
    """Git代理配置"""
    enabled: bool = Field(default=True, description="是否启用代理加速")
    mirrors: List[GitProxyMirror] = Field(default_factory=list, description="镜像列表")
    retry_count: int = Field(default=3, description="每个镜像的重试次数")
    retry_delay: float = Field(default=2.0, description="重试延迟(秒)")
    fallback_to_original: bool = Field(default=True, description="是否fallback到原始地址")
    timeout: int = Field(default=300, description="克隆超时时间(秒)")
    
    @validator('retry_count')
    def validate_retry_count(cls, v):
        if v < 1 or v > 10:
            raise ValueError('retry_count必须在1-10之间')
        return v
    
    @validator('retry_delay')
    def validate_retry_delay(cls, v):
        if v < 0.1 or v > 60:
            raise ValueError('retry_delay必须在0.1-60秒之间')
        return v


def get_default_git_proxy_config() -> GitProxyConfig:
    """获取默认的Git代理配置"""
    return GitProxyConfig(
        enabled=True,
        mirrors=[
            GitProxyMirror(
                name="GitWarp香港加速",
                base_url="http://hk-yd-proxy.gitwarp.com:6699/",
                priority=1,
                timeout=60,
                description="GitWarp香港节点加速服务"
            ),
            GitProxyMirror(
                name="GitWarp香港移动优化",
                base_url="http://hk-yd-proxy.gitwarp.com:6699/",
                priority=2,
                timeout=60,
                description="GitWarp香港移动优化服务"
            ),
            GitProxyMirror(
                name="GitWarp香港节点1",
                base_url="http://hk1-proxy.gitwarp.com:8888/",
                priority=3,
                timeout=60,
                description="GitWarp香港节点1服务"
            ),
            GitProxyMirror(
                name="GitWarp日本节点1",
                base_url="http://jp1-proxy.gitwarp.com:8123/",
                priority=4,
                timeout=60,
                description="GitWarp日本节点1服务"
            ),
            GitProxyMirror(
                name="GitClone杭州节点",
                base_url="https://gitclone.com/github.com/",
                priority=5,
                timeout=60,
                description="GitClone杭州节点服务"
            ),
        ],
        retry_count=2,
        retry_delay=1.5,
        fallback_to_original=True,
        timeout=300
    )
