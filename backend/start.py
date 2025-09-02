#!/usr/bin/env python3
"""
HMML 开发启动脚本
"""

import os
import sys
from pathlib import Path

# 添加src目录到Python路径
src_path = Path(__file__).parent / "src"
sys.path.insert(0, str(src_path))

# 设置工作目录
os.chdir(Path(__file__).parent)

if __name__ == "__main__":
    from app import main
    import asyncio
    
    print("🚀 启动 HMML 开发服务器...")
    asyncio.run(main())
