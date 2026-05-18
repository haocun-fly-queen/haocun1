#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
OpenClaw CLI v2.0 - API直连模式终端工具
通过 Playwright + postMessage 与 Bridge v2.0 通信

用法示例：
    python openclaw_cli.py record-weight --weight 65.5
    python openclaw_cli.py record-weight --weight 65.5 --date 2026-05-13 --remark "早餐前"
    python openclaw_cli.py edit-weight --id 42 --weight 66.0
    python openclaw_cli.py delete-weight --id 42
    python openclaw_cli.py get-data
    python openclaw_cli.py call-api --endpoint /api/weight/stats --method GET
    python openclaw_cli.py "帮我记录体重 65.5"

安装依赖：
    pip install playwright requests
    playwright install chromium
"""

import sys
import re
import json
import time
import uuid
import argparse
from typing import Optional, Dict, Any

try:
    import requests
    from playwright.sync_api import sync_playwright, Page, Browser
except ImportError:
    print("[OpenClaw] ❌ 缺少依赖，请先安装:")
    print("   pip install playwright requests")
    print("   playwright install chromium")
    sys.exit(1)


# ==================== 配置 ====================
class Config:
    # H5 页面地址
    BASE_URL = "http://testsu.fun-med.cn"

    # API 地址（用于直接登录获取 token）
    API_BASE = "http://testsu.fun-med.cn"
    LOGIN_API = "/api/user/login-password"

    # 登录账号（请修改成你自己的）
    USERNAME = "123123"        # ← 修改为你的账号
    PASSWORD = "123123"        # ← 修改为你的密码

    # 浏览器设置
    HEADLESS = False  # True=无头模式（后台运行），False=显示浏览器窗口
    TIMEOUT = 30000   # 页面加载超时（毫秒）

    # Bridge 通信超时（秒）
    BRIDGE_TIMEOUT = 15


# ==================== OpenClaw 自动化类 ====================
class OpenClawAutomator:
    def __init__(self, headless: bool = Config.HEADLESS, base_url: str = None):
        self.headless = headless
        self.base_url = base_url or Config.BASE_URL
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None
        self.token: Optional[str] = None
        self.user_id: Optional[str] = None

    def start(self):
        """启动浏览器"""
        self._log("启动浏览器...")
        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(
            headless=self.headless,
            args=['--disable-blink-features=AutomationControlled']
        )
        context = self.browser.new_context(
            viewport={'width': 1280, 'height': 800}
        )
        self.page = context.new_page()
        self.page.set_default_timeout(Config.TIMEOUT)
        self._log("浏览器已启动")

    def api_login(self) -> bool:
        """通过 API 直接登录，获取 token"""
        self._log(f"正在登录 ({Config.USERNAME})...")
        try:
            resp = requests.post(
                f"{Config.API_BASE}{Config.LOGIN_API}",
                json={
                    "username": Config.USERNAME,
                    "password": Config.PASSWORD
                },
                timeout=10
            )
            data = resp.json()
            if data.get("code") == 200:
                user_data = data.get("data", {})
                self.token = user_data.get("token")
                self.user_id = str(user_data.get("id", ""))
                self._log(f"登录成功，userId: {self.user_id}")
                return True
            else:
                self._log(f"登录失败: {data.get('message', '未知错误')}", error=True)
                return False
        except Exception as e:
            self._log(f"登录请求失败: {e}", error=True)
            return False

    def navigate_to_home(self):
        """导航到 H5 首页（带 userId 参数，不需要特定页面）"""
        self._log("导航到首页...")
        url = f"{self.base_url}/?userId={self.user_id}"
        if self.token:
            url += f"&token={self.token}"
        self.page.goto(url, wait_until="domcontentloaded")
        # 注入认证信息到 localStorage
        self._inject_auth()
        self._log(f"已导航: {url}")

    def _inject_auth(self):
        """将认证信息注入到页面 localStorage"""
        if not self.user_id:
            return
        self.page.evaluate(f"""
            () => {{
                localStorage.setItem('userId', '{self.user_id}');
                localStorage.setItem('isLogin', 'true');
                {'localStorage.setItem("token", "' + self.token + '");' if self.token else ''}
                console.log('[OpenClaw CLI] 认证信息已注入');
            }}
        """)

    def wait_for_bridge(self, timeout_sec: int = Config.BRIDGE_TIMEOUT) -> bool:
        """等待 OpenClaw Bridge v2.0 就绪"""
        self._log("等待 Bridge 就绪...")
        start = time.time()
        while time.time() - start < timeout_sec:
            ready = self.page.evaluate("""
                () => {
                    return window.__openClawBridge && window.__openClawBridge.ready === true;
                }
            """)
            if ready:
                version = self.page.evaluate(
                    "() => window.__openClawBridge ? window.__openClawBridge.version : 'unknown'"
                )
                self._log(f"Bridge 已就绪 (v{version})")
                return True
            time.sleep(0.5)
        self._log("Bridge 未在规定时间内就绪", error=True)
        return False

    def send_command(self, action: str, params: Dict[str, Any] = None) -> Dict:
        """
        通过 postMessage 发送指令到 Bridge v2.0，等待 OPENCLAW_RESPONSE。
        
        通信协议：
        - 发送: {type: 'OPENCLAW_REQUEST', id, action, params}
        - 接收: {type: 'OPENCLAW_RESPONSE', id, success, data}
        
        超时：15秒
        """
        params = params or {}
        request_id = str(uuid.uuid4())[:8]

        self._log(f"发送指令: {action} {json.dumps(params, ensure_ascii=False)}")

        try:
            # 通过 postMessage 发送请求，监听响应
            # Bridge 在同一 window 中，window.parent === window
            result = self.page.evaluate(
                """
                ([requestId, action, params, timeoutMs]) => {
                    return new Promise((resolve, reject) => {
                        // 超时处理
                        const timer = setTimeout(() => {
                            window.removeEventListener('message', handler);
                            reject(new Error('Bridge 响应超时'));
                        }, timeoutMs);

                        // 监听 OPENCLAW_RESPONSE
                        function handler(event) {
                            const msg = event.data;
                            if (msg && msg.type === 'OPENCLAW_RESPONSE' && msg.id === requestId) {
                                clearTimeout(timer);
                                window.removeEventListener('message', handler);
                                resolve({
                                    success: msg.success,
                                    data: msg.data
                                });
                            }
                        }
                        window.addEventListener('message', handler);

                        // 发送 OPENCLAW_REQUEST
                        window.postMessage({
                            type: 'OPENCLAW_REQUEST',
                            id: requestId,
                            action: action,
                            params: params
                        }, '*');
                    });
                }
                """,
                [request_id, action, params, Config.BRIDGE_TIMEOUT * 1000]
            )

            # 解析响应
            if result.get("success"):
                return {"success": True, "data": result.get("data")}
            else:
                data = result.get("data", {})
                error_msg = data.get("error", "未知错误") if isinstance(data, dict) else str(data)
                return {"success": False, "error": error_msg}

        except Exception as e:
            return {"success": False, "error": str(e)}

    # ==================== 业务方法 ====================

    def record_weight(self, weight: float, date: str = None, remark: str = None):
        """记录体重"""
        params = {"weight": weight}
        if date:
            params["date"] = date
        if remark:
            params["remark"] = remark
        return self.send_command("recordWeight", params)

    def edit_weight(self, id: Any, weight: float, date: str = None):
        """修改体重记录"""
        params = {"id": id, "weight": weight}
        if date:
            params["date"] = date
        return self.send_command("editWeight", params)

    def delete_weight(self, id: Any):
        """删除体重记录"""
        return self.send_command("deleteWeight", {"id": id})

    def get_weight_data(self):
        """获取体重数据"""
        return self.send_command("getWeightData")

    def call_api(self, endpoint: str, method: str = "GET", data: Any = None):
        """通用 API 调用"""
        params = {"endpoint": endpoint, "method": method}
        if data:
            params["data"] = data
        return self.send_command("callApi", params)

    def screenshot(self, path: str = "screenshot.png"):
        """截图"""
        if self.page:
            self.page.screenshot(path=path, full_page=True)
            self._log(f"截图已保存: {path}")

    def close(self):
        """关闭浏览器"""
        if self.browser:
            self.browser.close()
            self.browser = None
        if hasattr(self, 'playwright') and self.playwright:
            self.playwright.stop()
            self.playwright = None
        self._log("浏览器已关闭")

    # ==================== 完整流程 ====================
    def run(self, action: str, screenshot_path: str = None, **kwargs) -> Dict:
        """
        执行完整自动化流程：
        1. 启动浏览器
        2. 导航到 H5 首页（URL 带 userId）
        3. 等待 OPENCLAW_READY 信号
        4. 发送指令
        5. 接收响应
        6. 输出结果
        7. 关闭浏览器
        """
        try:
            # 1. 启动浏览器
            self.start()

            # 2. API 登录获取 token 和 userId
            if not self.api_login():
                return {"success": False, "error": "登录失败"}

            # 3. 导航到 H5 首页
            self.navigate_to_home()

            # 4. 等待 Bridge 就绪
            if not self.wait_for_bridge():
                return {"success": False, "error": "Bridge 未就绪，请确认页面已加载 openclaw-bridge.js"}

            # 5. 执行操作
            if action == "record":
                result = self.record_weight(**kwargs)
            elif action == "edit":
                result = self.edit_weight(**kwargs)
            elif action == "delete":
                result = self.delete_weight(**kwargs)
            elif action == "get":
                result = self.get_weight_data()
            elif action == "call-api":
                result = self.call_api(**kwargs)
            else:
                self._log(f"未知操作: {action}", error=True)
                return {"success": False, "error": f"未知操作: {action}"}

            # 6. 输出结果
            self._output_result(result)

            # 7. 截图（如果需要）
            if screenshot_path:
                self.screenshot(screenshot_path)

            return result

        except Exception as e:
            self._log(f"执行出错: {e}", error=True)
            import traceback
            traceback.print_exc()
            return {"success": False, "error": str(e)}
        finally:
            self.close()

    # ==================== 辅助方法 ====================

    def _log(self, msg: str, error: bool = False):
        """统一输出，带 [OpenClaw] 前缀"""
        if error:
            print(f"[OpenClaw] ❌ {msg}")
        else:
            print(f"[OpenClaw] {msg}")

    def _output_result(self, result: Dict):
        """格式化输出操作结果"""
        print()
        print(f"[OpenClaw] {'=' * 40}")
        if result.get("success"):
            print("[OpenClaw] ✅ 操作成功")
            data = result.get("data")
            if data:
                print("[OpenClaw] 返回数据:")
                print(json.dumps(data, ensure_ascii=False, indent=2))
        else:
            print("[OpenClaw] ❌ 操作失败")
            print(f"[OpenClaw] 错误: {result.get('error', '未知错误')}")
        print(f"[OpenClaw] {'=' * 40}")


# ==================== 自然语言解析 ====================
def parse_natural_language(text: str) -> tuple:
    """
    解析自然语言指令，映射到对应命令：
    - "记录体重 XX" → record-weight
    - "查看/获取体重数据" → get-data
    - "修改体重 ID XX 为 YY" → edit-weight
    - "删除体重 ID XX" → delete-weight
    """
    text = text.strip()

    # 记录体重 XX (kg)
    m = re.search(r'记录.*?(\d+\.?\d*)\s*(kg|公斤)?', text)
    if m:
        return "record", {"weight": float(m.group(1))}

    # 修改体重 ID XX 为 YY
    m = re.search(r'修改.*?[Ii][Dd]\s*(\w+).*?[为到]\s*(\d+\.?\d*)\s*(kg|公斤)?', text)
    if m:
        return "edit", {"id": m.group(1), "weight": float(m.group(2))}

    # 删除体重 ID XX
    m = re.search(r'删除.*?[Ii][Dd]\s*(\w+)', text)
    if m:
        return "delete", {"id": m.group(1)}

    # 查看/获取体重数据
    if re.search(r'(查看|获取|查询|显示).*?(体重|数据)', text):
        return "get", {}

    return None, {}


# ==================== 主入口 ====================
def main():
    parser = argparse.ArgumentParser(
        description='🐥 OpenClaw CLI v2.0 - API直连模式终端工具',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  python openclaw_cli.py record-weight --weight 65.5
  python openclaw_cli.py record-weight --weight 65.5 --date 2026-05-13 --remark "早餐前"
  python openclaw_cli.py edit-weight --id 42 --weight 66.0
  python openclaw_cli.py edit-weight --id 42 --weight 66.0 --date 2026-05-14
  python openclaw_cli.py delete-weight --id 42
  python openclaw_cli.py get-data
  python openclaw_cli.py call-api --endpoint /api/weight/stats --method GET
  python openclaw_cli.py call-api --endpoint /api/weight --method POST --data '{"weight":65}'
  python openclaw_cli.py "帮我记录体重 65.5"
  python openclaw_cli.py "修改体重 ID 42 为 66.0"
  python openclaw_cli.py "删除体重 ID 42"
  python openclaw_cli.py "查看体重数据"
        """
    )

    # 子命令
    subparsers = parser.add_subparsers(dest='command', help='操作命令')

    # 记录体重
    p_record = subparsers.add_parser('record-weight', help='记录体重')
    p_record.add_argument('--weight', '-w', type=float, required=True, help='体重值 (kg)')
    p_record.add_argument('--date', '-d', type=str, help='日期 (YYYY-MM-DD，默认今天)')
    p_record.add_argument('--remark', '-r', type=str, help='备注')

    # 修改体重
    p_edit = subparsers.add_parser('edit-weight', help='修改体重记录')
    p_edit.add_argument('--id', type=str, required=True, help='记录ID')
    p_edit.add_argument('--weight', '-w', type=float, required=True, help='新体重值 (kg)')
    p_edit.add_argument('--date', '-d', type=str, help='新日期 (YYYY-MM-DD)')

    # 删除体重
    p_delete = subparsers.add_parser('delete-weight', help='删除体重记录')
    p_delete.add_argument('--id', type=str, required=True, help='记录ID')

    # 获取数据
    subparsers.add_parser('get-data', help='获取体重数据')

    # 通用 API 调用
    p_api = subparsers.add_parser('call-api', help='通用API调用')
    p_api.add_argument('--endpoint', '-e', type=str, required=True,
                       help='API路径 (如 /api/weight/stats)')
    p_api.add_argument('--method', '-m', type=str, default='GET',
                       help='HTTP方法 (默认 GET)')
    p_api.add_argument('--data', type=str,
                       help='请求数据 (JSON字符串)')

    # 自然语言模式（位置参数）
    parser.add_argument('natural', nargs='?',
                        help='自然语言指令（如"帮我记录体重 65.5"）')

    # 通用选项
    parser.add_argument('--url', type=str,
                        help='H5应用地址 (默认 http://testsu.fun-med.cn)')
    parser.add_argument('--headless', action='store_true',
                        help='无头模式（不显示浏览器窗口）')
    parser.add_argument('--screenshot', '-s', type=str,
                        help='操作完成后截图保存路径')

    args = parser.parse_args()

    # 解析命令
    action = None
    kwargs = {}

    if args.natural:
        # 自然语言模式
        action, kwargs = parse_natural_language(args.natural)
        if not action:
            print(f"[OpenClaw] ❌ 无法理解的指令: {args.natural}")
            print("[OpenClaw] 支持的指令示例:")
            print('  "帮我记录体重 65.5"')
            print('  "修改体重 ID 42 为 66.0"')
            print('  "删除体重 ID 42"')
            print('  "查看体重数据"')
            sys.exit(1)
        print(f"[OpenClaw] 🎯 解析为: {action} {kwargs}")
    elif args.command == 'record-weight':
        action = "record"
        kwargs = {"weight": args.weight}
        if args.date:
            kwargs["date"] = args.date
        if args.remark:
            kwargs["remark"] = args.remark
    elif args.command == 'edit-weight':
        action = "edit"
        kwargs = {"id": args.id, "weight": args.weight}
        if args.date:
            kwargs["date"] = args.date
    elif args.command == 'delete-weight':
        action = "delete"
        kwargs = {"id": args.id}
    elif args.command == 'get-data':
        action = "get"
    elif args.command == 'call-api':
        action = "call-api"
        kwargs = {"endpoint": args.endpoint, "method": args.method}
        if args.data:
            try:
                kwargs["data"] = json.loads(args.data)
            except json.JSONDecodeError:
                print("[OpenClaw] ❌ --data 参数必须是有效的 JSON 字符串")
                sys.exit(1)
    else:
        parser.print_help()
        sys.exit(1)

    # 确定 H5 地址
    base_url = args.url if args.url else None

    # 执行
    auto = OpenClawAutomator(headless=args.headless, base_url=base_url)
    result = auto.run(action, screenshot_path=args.screenshot, **kwargs)

    sys.exit(0 if result and result.get("success") else 1)


if __name__ == "__main__":
    main()
