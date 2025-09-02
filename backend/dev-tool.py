#!/usr/bin/env python3
"""
HMML 开发工具脚本
提供开发期间的各种实用功能
"""

import argparse
import subprocess
import os
from pathlib import Path
import json


def get_project_root():
    """获取项目根目录"""
    return Path(__file__).parent


def run_command(cmd, cwd=None):
    """运行命令"""
    try:
        result = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True)
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)


def start_server():
    """启动开发服务器"""
    print("🚀 启动 HMML 开发服务器...")
    root = get_project_root()
    python_exe = Path(root.parent / ".venv" / "Scripts" / "python.exe")
    
    if not python_exe.exists():
        print("❌ 找不到虚拟环境中的 Python 解释器")
        return False
    
    os.chdir(root)
    try:
        subprocess.run([str(python_exe), "start.py"])
    except KeyboardInterrupt:
        print("\n👋 服务已停止")
    return True


def install_deps():
    """安装依赖"""
    print("📦 安装 Python 依赖包...")
    root = get_project_root()
    python_exe = Path(root.parent / ".venv" / "Scripts" / "python.exe")
    
    success, stdout, stderr = run_command(f'"{python_exe}" -m pip install -r requirements.txt', cwd=root)
    
    if success:
        print("✅ 依赖包安装完成")
    else:
        print(f"❌ 安装失败: {stderr}")
    
    return success


def show_status():
    """显示服务状态"""
    print("📊 检查服务状态...")
    
    # 检查配置
    root = get_project_root()
    config_file = root / "config" / "server.json"
    
    if config_file.exists():
        with open(config_file, 'r', encoding='utf-8') as f:
            config = json.load(f)
            port = config.get('server', {}).get('port', 7999)
            host = config.get('server', {}).get('host', '0.0.0.0')
            
        print(f"⚙️  配置端口: {port}")
        print(f"⚙️  配置主机: {host}")
        
        # 检查端口
        success, stdout, stderr = run_command(f"netstat -an | findstr :{port}")
        if success and stdout:
            print(f"✅ 端口 {port} 已被占用 - 服务可能正在运行")
            print(f"🌐 访问地址: http://localhost:{port}")
        else:
            print(f"❌ 端口 {port} 空闲 - 服务未运行")
    else:
        print("❌ 配置文件不存在")
    
    # 检查日志
    log_dir = root / "logs"
    if log_dir.exists():
        log_files = list(log_dir.glob("*.log"))
        print(f"📝 日志文件数量: {len(log_files)}")
    else:
        print("📝 日志目录不存在")


def show_logs():
    """显示日志"""
    root = get_project_root()
    log_dir = root / "logs"
    
    if not log_dir.exists():
        print(f"❌ 日志目录不存在: {log_dir}")
        return
    
    log_files = sorted(log_dir.glob("*.log"), key=lambda x: x.stat().st_mtime, reverse=True)
    
    if not log_files:
        print("📝 没有找到日志文件")
        return
    
    latest_log = log_files[0]
    print(f"📝 最新日志文件: {latest_log.name}")
    print(f"   大小: {latest_log.stat().st_size / 1024:.2f} KB")
    print(f"   修改时间: {latest_log.stat().st_mtime}")
    print()
    
    # 显示最后几行
    try:
        with open(latest_log, 'r', encoding='utf-8') as f:
            lines = f.readlines()[-10:]
            print("最后 10 行:")
            for line in lines:
                print(f"  {line.rstrip()}")
    except Exception as e:
        print(f"❌ 读取日志文件失败: {e}")


def clean_files():
    """清理文件"""
    print("🧹 清理文件...")
    root = get_project_root()
    
    # 清理日志
    log_dir = root / "logs"
    if log_dir.exists():
        log_files = list(log_dir.glob("*.log"))
        for log_file in log_files:
            log_file.unlink()
        print(f"✅ 已清理 {len(log_files)} 个日志文件")
    
    # 清理Python缓存
    cache_dirs = list(root.rglob("__pycache__"))
    for cache_dir in cache_dirs:
        import shutil
        shutil.rmtree(cache_dir)
    
    if cache_dirs:
        print(f"✅ 已清理 {len(cache_dirs)} 个 Python 缓存目录")
    
    print("🎉 清理完成")


def show_help():
    """显示帮助"""
    print()
    print("🚀 HMML Python Backend 开发工具")
    print("================================")
    print()
    print("可用命令:")
    print("  start    - 启动开发服务器")
    print("  install  - 安装依赖包")
    print("  status   - 显示服务状态")
    print("  logs     - 查看日志文件")
    print("  clean    - 清理日志和缓存")
    print("  help     - 显示此帮助信息")
    print()


def main():
    parser = argparse.ArgumentParser(description="HMML Python Backend 开发工具")
    parser.add_argument("command", nargs="?", default="help", 
                       choices=["start", "install", "status", "logs", "clean", "help"],
                       help="要执行的命令")
    
    args = parser.parse_args()
    
    commands = {
        "start": start_server,
        "install": install_deps,
        "status": show_status,
        "logs": show_logs,
        "clean": clean_files,
        "help": show_help
    }
    
    command_func = commands.get(args.command, show_help)
    command_func()


if __name__ == "__main__":
    main()
