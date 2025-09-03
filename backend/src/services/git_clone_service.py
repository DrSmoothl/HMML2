"""
Git克隆服务
提供支持代理加速、重试机制和fallback的Git克隆功能
"""

import subprocess
import asyncio
import logging
import time
from pathlib import Path
from typing import Optional, Tuple
import json

from models.git_proxy import GitProxyConfig, GitProxyMirror, get_default_git_proxy_config

logger = logging.getLogger("HMML")


class GitCloneResult:
    """Git克隆结果"""
    def __init__(self, success: bool, message: str = "", mirror_used: Optional[str] = None, 
                 attempts: int = 0, duration: float = 0.0):
        self.success = success
        self.message = message
        self.mirror_used = mirror_used
        self.attempts = attempts
        self.duration = duration
    
    def to_dict(self) -> dict:
        return {
            "success": self.success,
            "message": self.message,
            "mirror_used": self.mirror_used,
            "attempts": self.attempts,
            "duration": round(self.duration, 2)
        }


class EnhancedGitCloneService:
    """增强的Git克隆服务"""
    
    def __init__(self, config: Optional[GitProxyConfig] = None):
        self.config = config or get_default_git_proxy_config()
        
    @classmethod
    def load_config_from_file(cls, config_path: str) -> 'EnhancedGitCloneService':
        """从配置文件加载Git代理配置"""
        try:
            config_file = Path(config_path)
            if config_file.exists():
                with open(config_file, 'r', encoding='utf-8') as f:
                    config_data = json.load(f)
                config = GitProxyConfig(**config_data)
            else:
                logger.info(f"配置文件不存在，使用默认配置: {config_path}")
                config = get_default_git_proxy_config()
                # 保存默认配置到文件
                cls.save_config_to_file(config, config_path)
            
            return cls(config)
        except Exception as e:
            logger.warning(f"加载Git代理配置失败，使用默认配置: {e}")
            return cls(get_default_git_proxy_config())
    
    @staticmethod
    def save_config_to_file(config: GitProxyConfig, config_path: str) -> None:
        """保存配置到文件"""
        try:
            config_file = Path(config_path)
            config_file.parent.mkdir(parents=True, exist_ok=True)
            
            with open(config_file, 'w', encoding='utf-8') as f:
                json.dump(config.dict(), f, indent=2, ensure_ascii=False)
            logger.info(f"Git代理配置已保存到: {config_path}")
        except Exception as e:
            logger.error(f"保存Git代理配置失败: {e}")
    
    def _convert_github_url_to_mirror(self, original_url: str, mirror: GitProxyMirror) -> str:
        """将GitHub URL转换为镜像URL"""
        try:
            # 确保原始URL以.git结尾
            if not original_url.endswith('.git'):
                original_url += '.git'
            
            # 构建镜像URL
            mirror_base = mirror.base_url.rstrip('/')
            
            # 特判：对于gitclone.com，去掉GitHub的https://
            if 'gitclone.com' in mirror_base:
                # 去掉https://github.com/部分
                if original_url.startswith('https://github.com/'):
                    clean_url = original_url.replace('https://github.com/', '')
                    mirror_url = f"{mirror_base}/{clean_url}"
                else:
                    mirror_url = f"{mirror_base}/{original_url}"
            else:
                # 其他镜像直接拼接完整URL
                mirror_url = f"{mirror_base}/{original_url}"
            
            logger.debug(f"URL转换: {original_url} -> {mirror_url}")
            return mirror_url
        except Exception as e:
            logger.error(f"转换镜像URL失败: {e}")
            return original_url
    
    def _get_git_executable(self, is_onekey: bool = False) -> Optional[str]:
        """获取Git可执行文件路径"""
        if is_onekey:
            # 一键包环境，查找内置git
            try:
                current_dir = Path(__file__).resolve().parent
                # 向上查找到MaiBotOneKey目录
                onekey_root = current_dir
                while onekey_root.parent != onekey_root:
                    if onekey_root.name == "MaiBotOneKey":
                        break
                    onekey_root = onekey_root.parent
                else:
                    # 如果没找到，尝试相对路径推算
                    onekey_root = current_dir.parent.parent.parent
                
                git_path = onekey_root / "runtime" / "PortableGit" / "bin" / "git.exe"
                if git_path.exists():
                    return str(git_path)
                
                # 尝试其他可能的路径
                alt_paths = [
                    onekey_root / "PortableGit" / "bin" / "git.exe",
                    onekey_root / "git" / "bin" / "git.exe",
                ]
                for alt_path in alt_paths:
                    if alt_path.exists():
                        return str(alt_path)
                        
            except Exception as e:
                logger.debug(f"查找一键包Git失败: {e}")
        
        # 检查系统Git
        try:
            result = subprocess.run(
                ["git", "--version"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                return "git"
        except Exception:
            pass
        
        return None
    
    async def _execute_git_clone(self, git_exe: str, clone_url: str, target_dir: Path, 
                                timeout: int) -> Tuple[bool, str]:
        """执行Git克隆命令"""
        try:
            cmd = [git_exe, "clone", "--depth", "1", clone_url, str(target_dir)]
            logger.info(f"执行Git克隆: {' '.join(cmd)}")
            
            # 使用asyncio.create_subprocess_exec执行异步命令
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            try:
                stdout, stderr = await asyncio.wait_for(
                    process.communicate(), 
                    timeout=timeout
                )
                
                if process.returncode == 0:
                    return True, "克隆成功"
                else:
                    error_msg = stderr.decode('utf-8', errors='ignore').strip()
                    return False, f"Git克隆失败: {error_msg}"
                    
            except asyncio.TimeoutError:
                # 超时，终止进程
                try:
                    process.terminate()
                    await asyncio.wait_for(process.wait(), timeout=5)
                except Exception:
                    process.kill()
                return False, f"Git克隆超时 ({timeout}秒)"
                
        except Exception as e:
            return False, f"执行Git克隆异常: {str(e)}"
    
    async def clone_repository(self, repository_url: str, target_dir: Path, 
                             is_onekey: bool = False) -> GitCloneResult:
        """
        克隆Git仓库，支持代理加速、重试和fallback
        
        Args:
            repository_url: 原始仓库URL
            target_dir: 目标目录
            is_onekey: 是否为一键包环境
            
        Returns:
            GitCloneResult: 克隆结果
        """
        start_time = time.time()
        total_attempts = 0
        
        # 检查Git可执行文件
        git_exe = self._get_git_executable(is_onekey)
        if not git_exe:
            return GitCloneResult(
                success=False,
                message="未找到Git可执行文件，请检查Git安装",
                attempts=0,
                duration=time.time() - start_time
            )
        
        logger.info(f"开始克隆仓库: {repository_url} -> {target_dir}")
        logger.info(f"使用Git: {git_exe}")
        logger.info(f"代理配置启用: {self.config.enabled}")
        
        # 如果目标目录存在，先删除
        if target_dir.exists():
            import shutil
            shutil.rmtree(target_dir)
        
        # 准备克隆URL列表
        clone_urls = []
        
        if self.config.enabled and self.config.mirrors:
            # 按优先级排序镜像
            sorted_mirrors = sorted(
                [m for m in self.config.mirrors if m.enabled],
                key=lambda x: x.priority
            )
            
            # 为每个镜像生成克隆URL
            for mirror in sorted_mirrors:
                mirror_url = self._convert_github_url_to_mirror(repository_url, mirror)
                clone_urls.append((mirror_url, mirror.name, mirror.timeout))
                logger.info(f"添加镜像: {mirror.name}")
                logger.info(f"  原始URL: {repository_url}")
                logger.info(f"  镜像URL: {mirror_url}")
        
        # 如果启用了fallback或没有可用镜像，添加原始URL
        if self.config.fallback_to_original or not clone_urls:
            clone_urls.append((repository_url, "原始地址", self.config.timeout))
            logger.info(f"添加原始地址: {repository_url}")
        
        # 依次尝试每个URL
        last_error = ""
        for clone_url, mirror_name, timeout in clone_urls:
            logger.info(f"尝试使用 {mirror_name} 克隆...")
            
            # 对每个镜像进行重试
            for attempt in range(1, self.config.retry_count + 1):
                total_attempts += 1
                logger.info(f"第 {attempt}/{self.config.retry_count} 次尝试 {mirror_name}")
                
                success, message = await self._execute_git_clone(
                    git_exe, clone_url, target_dir, timeout
                )
                
                if success:
                    duration = time.time() - start_time
                    logger.info(f"克隆成功！使用 {mirror_name}，耗时 {duration:.2f} 秒")
                    return GitCloneResult(
                        success=True,
                        message="克隆成功",
                        mirror_used=mirror_name,
                        attempts=total_attempts,
                        duration=duration
                    )
                
                last_error = message
                logger.warning(f"{mirror_name} 第 {attempt} 次尝试失败: {message}")
                
                # 如果不是最后一次尝试，等待重试延迟
                if attempt < self.config.retry_count:
                    logger.info(f"等待 {self.config.retry_delay} 秒后重试...")
                    await asyncio.sleep(self.config.retry_delay)
            
            logger.error(f"{mirror_name} 所有尝试均失败")
        
        # 所有尝试都失败了
        duration = time.time() - start_time
        logger.error(f"所有克隆尝试均失败，总耗时 {duration:.2f} 秒")
        
        return GitCloneResult(
            success=False,
            message=f"所有克隆尝试均失败。最后错误: {last_error}",
            attempts=total_attempts,
            duration=duration
        )
    
    def get_config(self) -> GitProxyConfig:
        """获取当前配置"""
        return self.config
    
    def update_config(self, new_config: GitProxyConfig) -> None:
        """更新配置"""
        self.config = new_config
        logger.info("Git代理配置已更新")
    
    def add_mirror(self, mirror: GitProxyMirror) -> None:
        """添加镜像"""
        self.config.mirrors.append(mirror)
        logger.info(f"已添加镜像: {mirror.name}")
    
    def remove_mirror(self, mirror_name: str) -> bool:
        """移除镜像"""
        original_count = len(self.config.mirrors)
        self.config.mirrors = [m for m in self.config.mirrors if m.name != mirror_name]
        removed = len(self.config.mirrors) < original_count
        if removed:
            logger.info(f"已移除镜像: {mirror_name}")
        return removed
    
    def enable_mirror(self, mirror_name: str) -> bool:
        """启用镜像"""
        for mirror in self.config.mirrors:
            if mirror.name == mirror_name:
                mirror.enabled = True
                logger.info(f"已启用镜像: {mirror_name}")
                return True
        return False
    
    def disable_mirror(self, mirror_name: str) -> bool:
        """禁用镜像"""
        for mirror in self.config.mirrors:
            if mirror.name == mirror_name:
                mirror.enabled = False
                logger.info(f"已禁用镜像: {mirror_name}")
                return True
        return False


# 全局Git克隆服务实例
git_clone_service = EnhancedGitCloneService()


def get_git_clone_service() -> EnhancedGitCloneService:
    """获取Git克隆服务实例"""
    return git_clone_service


def initialize_git_clone_service(config_path: str = "config/git_proxy.json") -> None:
    """初始化Git克隆服务"""
    global git_clone_service
    git_clone_service = EnhancedGitCloneService.load_config_from_file(config_path)
    logger.info("Git克隆服务已初始化")
