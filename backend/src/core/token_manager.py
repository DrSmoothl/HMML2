"""Token 管理器 (哈希存储 & 审计)

更新需求实现:
1. 仅存储哈希而非明文 (采用 Argon2id)
2. 第一次生成时在控制台打印一次明文 Token, 以后不再可见
3. 运行内存最小暴露: 初始化后仅缓存哈希; 再生(re-generate)时返回新明文一次
4. 提供一次性“再生+显示”方法, 旧 token 立即失效
5. 失败/成功验证审计: 统计总尝试/成功/失败/最后一次时间与最近失败窗口

文件结构:
    config/token.token    -> JSON: {"hash":"<argon2 hash>", "created_at": <ts>, "updated_at": <ts>, "version": 1}
    logs/hmml-token-audit.log -> 追加审计日志 (可与主 logger 融合; 这里独立轻量写入)

说明:
    - 不再读取旧版本格式; 若文件损坏将重新生成新 token 并提示
    - Argon2 参数可后续配置化
"""
from __future__ import annotations
import secrets
import json
import time
import re
from pathlib import Path
from typing import Optional, Dict, Any
from argon2 import PasswordHasher, exceptions as argon_exc

TOKEN_FILE_PATH = Path('config') / 'token.token'
AUDIT_LOG_PATH = Path('logs') / 'hmml-token-audit.log'

_TOKEN_PATTERN = re.compile(r'^[A-Za-z0-9]{48,128}$')  # 允许更长, 默认生成64

# Argon2id 参数 (平衡安全与性能; 可根据机器性能调优)
_ARGON_TIME_COST = 3
_ARGON_MEMORY_COST = 64 * 1024  # KB = 64MB
_ARGON_PARALLELISM = 2
_ARGON_HASH_LEN = 32
_ARGON_SALT_LEN = 16

_DEFAULT_TOKEN_LENGTH = 64  # 比原32增加熵

_ph = PasswordHasher(
    time_cost=_ARGON_TIME_COST,
    memory_cost=_ARGON_MEMORY_COST,
    parallelism=_ARGON_PARALLELISM,
    hash_len=_ARGON_HASH_LEN,
    salt_len=_ARGON_SALT_LEN
)

class TokenManager:
    def __init__(self):
        self._hash: Optional[str] = None  # 仅保存哈希
        self._meta: Dict[str, Any] = {}
        self._initialized = False
        self._audit_cache = {
            'total_attempts': 0,
            'success': 0,
            'failed': 0,
            'last_attempt_ts': None,
            'recent_failures': []  # timestamps
        }

    # ---------------- 工具 ----------------
    def _generate_token(self, length: int = _DEFAULT_TOKEN_LENGTH) -> str:
        alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        return ''.join(secrets.choice(alphabet) for _ in range(length))

    def _write_audit(self, event: str, detail: str):
        try:
            AUDIT_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
            with AUDIT_LOG_PATH.open('a', encoding='utf-8') as f:
                f.write(f"{int(time.time()*1000)}\t{event}\t{detail}\n")
        except Exception:
            pass

    def _load_file(self):
        try:
            raw = TOKEN_FILE_PATH.read_text(encoding='utf-8')
            data = json.loads(raw)
            if not isinstance(data, dict):
                raise ValueError('格式错误')
            self._hash = data.get('hash')
            self._meta = data
        except Exception:
            # 文件损坏 -> 重新生成
            self._create_new(first=True, note='corrupted')

    def _persist(self):
        TOKEN_FILE_PATH.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            'hash': self._hash,
            'created_at': self._meta.get('created_at'),
            'updated_at': self._meta.get('updated_at'),
            'version': 1
        }
        TOKEN_FILE_PATH.write_text(json.dumps(payload, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')

    def _create_new(self, first: bool = False, note: str = '') -> str:
        plain = self._generate_token()
        hashed = _ph.hash(plain)
        now = int(time.time()*1000)
        self._hash = hashed
        self._meta = {
            'hash': hashed,
            'created_at': now if first else self._meta.get('created_at', now),
            'updated_at': now,
            'version': 1
        }
        self._persist()
        origin = 'first_init' if first else 'regenerate'
        self._write_audit('TOKEN_GENERATED', f'{origin}\t{note}')
        return plain

    # ---------------- 对外生命周期 ----------------
    def initialize(self):
        if self._initialized:
            return
        if TOKEN_FILE_PATH.exists():
            self._load_file()
            if not self._hash:
                # 再次保险
                first_plain = self._create_new(first=True, note='missing_hash')
                self._print_first_token(first_plain)
            else:
                self._write_audit('TOKEN_LOADED', 'ok')
        else:
            first_plain = self._create_new(first=True, note='no_file')
            self._print_first_token(first_plain)
        self._initialized = True

    def _print_first_token(self, token: str):
        separator = '=' * 60
        print(f'\n{separator}')
        print('重要：访问Token（仅显示一次）')
        print(separator)
        print(f'Token: {token}')
        print('\n警告：请立即复制并保存此Token！')
        print('   • 此Token仅显示一次，关闭窗口后无法再次查看')
        print('   • 如果丢失，只能通过重新生成来获取新Token')
        print('   • 重新生成会使旧Token失效')
        print(f'\n{separator}\n')
        
        while True:
            try:
                choice = input("已保存Token？ [Yes] 是  [No] 否: ").strip().lower()
                if choice in ['y', 'yes', '是', 'shi']:
                    print("Token已确认保存，服务继续启动...\n")
                    self._write_audit('TOKEN_DISPLAYED', 'first_show_confirmed')
                    break
                elif choice in ['n', 'no', '否', 'fou']:
                    print("Token未保存，下次启动将重新生成新Token！")
                    # 删除当前token文件，强制下次重新生成
                    if TOKEN_FILE_PATH.exists():
                        TOKEN_FILE_PATH.unlink()
                    self._write_audit('TOKEN_DISPLAYED', 'first_show_rejected')
                    print("服务继续启动...\n")
                    break
                else:
                    print("请输入 Yes 或 No")
            except (KeyboardInterrupt, EOFError):
                print("\n跳过确认，请确保已保存Token！\n")
                self._write_audit('TOKEN_DISPLAYED', 'first_show_interrupted')
                break

    # ---------------- 功能接口 ----------------
    def verify_token(self, user_token: str) -> bool:
        if not self._initialized:
            self.initialize()
        self._audit_cache['total_attempts'] += 1
        self._audit_cache['last_attempt_ts'] = int(time.time()*1000)
        try:
            _ph.verify(self._hash, user_token)
            self._audit_cache['success'] += 1
            # 清理过期失败记录
            self._audit_cache['recent_failures'] = [ts for ts in self._audit_cache['recent_failures'] if self._audit_cache['last_attempt_ts'] - ts < 3600_000]
            self._write_audit('VERIFY_OK', 'success')
            return True
        except argon_exc.VerifyMismatchError:
            self._audit_cache['failed'] += 1
            ts = self._audit_cache['last_attempt_ts']
            self._audit_cache['recent_failures'].append(ts)
            # 只保留最近1小时
            self._audit_cache['recent_failures'] = [t for t in self._audit_cache['recent_failures'] if ts - t < 3600_000]
            self._write_audit('VERIFY_FAIL', 'mismatch')
            return False
        except Exception as e:
            self._audit_cache['failed'] += 1
            self._write_audit('VERIFY_ERROR', repr(e))
            return False

    def regenerate(self) -> str:
        if not self._initialized:
            self.initialize()
        new_plain = self._create_new(first=False, note='manual_regenerate')
        self._write_audit('TOKEN_REGENERATED', 'manual')
        return new_plain

    def get_audit_stats(self) -> Dict[str, Any]:
        if not self._initialized:
            self.initialize()
        return {
            'totalAttempts': self._audit_cache['total_attempts'],
            'success': self._audit_cache['success'],
            'failed': self._audit_cache['failed'],
            'lastAttemptTs': self._audit_cache['last_attempt_ts'],
            'recentFailuresLastHour': len(self._audit_cache['recent_failures'])
        }

    # 兼容旧调用 (如果有代码引用 get_token, 返回 None 表示不再提供明文)
    def get_token(self) -> Optional[str]:  # pragma: no cover - 明文不再暴露
        return None

# 单例
_token_manager = TokenManager()

def get_token_manager() -> TokenManager:
    return _token_manager
