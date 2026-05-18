/**
 * OpenClaw Bridge v2.0
 * H5应用自动化控制桥接层 - API直连模式
 * 
 * 通过 postMessage 接收外部指令，体重模块直接调用后端 API，
 * 不再依赖 UI 自动化（模拟点击/输入），更稳定更快速。
 */
class OpenClawBridge {
  constructor() {
    this.version = '2.0.0';
    this.BASE_URL = 'https://laobushi.fun-med.cn';
    this.ready = false;

    // 监听 message 事件
    window.addEventListener('message', this.handleMessage.bind(this));

    this.ready = true;
    console.log('[OpenClaw] Bridge 已初始化，版本:', this.version);

    // 发送就绪通知
    this.notifyReady();
  }

  // ========================
  // 认证与基础请求
  // ========================

  /**
   * 从 localStorage 获取认证信息
   */
  getAuth() {
    const token = localStorage.getItem('token') || '';
    const userId = localStorage.getItem('userId') || '';
    return { token, userId };
  }

  /**
   * 封装 fetch 请求，自动加 token、userId 和错误处理
   * @param {string} endpoint - API路径，如 "/api/weight"
   * @param {string} method - HTTP方法
   * @param {object|null} data - 请求体数据
   * @returns {Promise<any>} 响应数据
   */
  async apiRequest(endpoint, method = 'GET', data = null) {
    const { token, userId } = this.getAuth();
    const url = method === 'GET' && data
      ? `${this.BASE_URL}${endpoint}?${new URLSearchParams(data).toString()}`
      : `${this.BASE_URL}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-User-Id': userId
    };

    const options = { method, headers };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    console.log('[OpenClaw] API请求:', method, endpoint, data || '');

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '未知错误');
      throw new Error(`API请求失败 (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log('[OpenClaw] API响应:', endpoint, result);
    return result;
  }

  // ========================
  // 消息处理
  // ========================

  /**
   * 处理来自外部的 postMessage
   */
  handleMessage(event) {
    const { data } = event;

    // 只处理 OPENCLAW_REQUEST 类型
    if (!data || data.type !== 'OPENCLAW_REQUEST') return;

    const { id, action, params } = data;
    console.log('[OpenClaw] 收到请求:', action, params);

    // 路由到对应方法并处理响应
    this.dispatch(action, params || {})
      .then(result => {
        this.sendResponse(id, true, result);
      })
      .catch(error => {
        console.error('[OpenClaw] 执行失败:', action, error);
        this.sendResponse(id, false, { error: error.message || String(error) });
      });
  }

  /**
   * 指令路由
   */
  async dispatch(action, params) {
    switch (action) {
      // 体重模块
      case 'recordWeight':
        return this.recordWeight(params);
      case 'getWeightData':
        return this.getWeightData(params);
      case 'editWeight':
        return this.editWeight(params);
      case 'deleteWeight':
        return this.deleteWeight(params);

      // 通用指令
      case 'callApi':
        return this.callApi(params);
      case 'navigate':
        return this.navigate(params);
      case 'getPageInfo':
        return this.getPageInfo();
      case 'screenshot':
        return { message: '请使用Playwright截图' };

      // DOM操作（兼容）
      case 'click':
        return this.doClick(params);
      case 'input':
        return this.doInput(params);
      case 'getValue':
        return this.doGetValue(params);
      case 'getText':
        return this.doGetText(params);

      default:
        throw new Error(`未知指令: ${action}`);
    }
  }

  /**
   * 发送响应
   */
  sendResponse(id, success, data) {
    const message = {
      type: 'OPENCLAW_RESPONSE',
      id: id,
      success: success,
      data: data
    };
    console.log('[OpenClaw] 发送响应:', id, success);
    window.parent.postMessage(message, '*');
  }

  /**
   * 发送就绪通知
   */
  notifyReady() {
    window.parent.postMessage({
      type: 'OPENCLAW_READY',
      version: this.version,
      url: window.location.href
    }, '*');
    console.log('[OpenClaw] 已发送就绪通知');
  }

  // ========================
  // 体重模块 - API直连
  // ========================

  /**
   * 记录体重
   * @param {object} params - {weight, date?, remark?}
   */
  async recordWeight(params) {
    try {
      const { weight, date, remark } = params;
      const { userId } = this.getAuth();

      if (!weight) throw new Error('weight 参数必填');

      const body = {
        userId,
        weight: Number(weight),
        date: date || this.getTodayDate(),
        remark: remark || ''
      };

      const result = await this.apiRequest('/api/weight', 'POST', body);
      return { recorded: true, weight: body.weight, date: body.date, response: result };
    } catch (error) {
      throw new Error(`记录体重失败: ${error.message}`);
    }
  }

  /**
   * 获取体重统计和记录
   */
  async getWeightData(params) {
    try {
      const { userId } = this.getAuth();
      const result = await this.apiRequest(`/api/weight/stats?userId=${userId}`, 'GET');
      return result;
    } catch (error) {
      throw new Error(`获取体重数据失败: ${error.message}`);
    }
  }

  /**
   * 编辑体重记录
   * @param {object} params - {id, weight, date?}
   */
  async editWeight(params) {
    try {
      const { id, weight, date } = params;

      if (!id) throw new Error('id 参数必填');
      if (!weight) throw new Error('weight 参数必填');

      const body = { id, weight: Number(weight) };
      if (date) body.date = date;

      const result = await this.apiRequest('/api/weight', 'PUT', body);
      return { edited: true, id, weight: body.weight, response: result };
    } catch (error) {
      throw new Error(`编辑体重失败: ${error.message}`);
    }
  }

  /**
   * 删除体重记录
   * @param {object} params - {id}
   */
  async deleteWeight(params) {
    try {
      const { id } = params;

      if (!id) throw new Error('id 参数必填');

      const result = await this.apiRequest(`/api/weight?id=${id}`, 'DELETE');
      return { deleted: true, id, response: result };
    } catch (error) {
      throw new Error(`删除体重失败: ${error.message}`);
    }
  }

  // ========================
  // 通用指令
  // ========================

  /**
   * 通用API调用
   * @param {object} params - {endpoint, method, data?}
   */
  async callApi(params) {
    try {
      const { endpoint, method = 'GET', data } = params;

      if (!endpoint) throw new Error('endpoint 参数必填');

      const result = await this.apiRequest(endpoint, method.toUpperCase(), data || null);
      return result;
    } catch (error) {
      throw new Error(`API调用失败: ${error.message}`);
    }
  }

  /**
   * 页面导航
   * @param {object} params - {page}
   */
  navigate(params) {
    try {
      const { page } = params;

      if (!page) throw new Error('page 参数必填');

      console.log('[OpenClaw] 导航到:', page);

      // 优先使用 uni 路由
      if (typeof uni !== 'undefined' && uni.navigateTo) {
        uni.navigateTo({
          url: page,
          fail: () => {
            // navigateTo 失败时尝试 switchTab
            uni.switchTab({
              url: page,
              fail: () => {
                // 最终降级为 location 跳转
                window.location.href = page;
              }
            });
          }
        });
      } else {
        window.location.href = page;
      }

      return { navigated: true, page };
    } catch (error) {
      throw new Error(`导航失败: ${error.message}`);
    }
  }

  /**
   * 获取页面信息
   */
  getPageInfo() {
    return {
      url: window.location.href,
      title: document.title,
      readyState: document.readyState,
      userAgent: navigator.userAgent,
      timestamp: Date.now()
    };
  }

  // ========================
  // DOM操作（兼容保留）
  // ========================

  /**
   * 点击元素
   * @param {object} params - {selector?, text?}
   */
  doClick(params) {
    const { selector, text } = params;
    let element;

    if (selector) {
      element = document.querySelector(selector);
    } else if (text) {
      element = this.findElementByText(text);
    }

    if (!element) throw new Error('元素未找到');

    element.click();
    element.dispatchEvent(new Event('tap', { bubbles: true }));

    return { clicked: true, tagName: element.tagName };
  }

  /**
   * 输入文本
   * @param {object} params - {selector, value, clear?}
   */
  doInput(params) {
    const { selector, value, clear = true } = params;
    const element = document.querySelector(selector);

    if (!element) throw new Error('输入框未找到: ' + selector);

    if (clear) element.value = '';
    element.value = value;

    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));

    return { value: element.value };
  }

  /**
   * 获取 input 值
   * @param {object} params - {selector}
   */
  doGetValue(params) {
    const { selector } = params;
    const element = document.querySelector(selector);

    if (!element) throw new Error('元素未找到: ' + selector);

    return { value: element.value };
  }

  /**
   * 获取元素文本
   * @param {object} params - {selector}
   */
  doGetText(params) {
    const { selector } = params;
    const element = document.querySelector(selector);

    if (!element) throw new Error('元素未找到: ' + selector);

    return { text: element.textContent.trim() };
  }

  // ========================
  // 工具方法
  // ========================

  /**
   * 通过文本内容查找元素
   */
  findElementByText(text) {
    const allElements = document.querySelectorAll('*');
    for (const el of allElements) {
      if (el.children.length === 0 && el.textContent && el.textContent.trim() === text) {
        return el;
      }
    }
    // 宽松匹配：包含该文本的最深层元素
    for (const el of allElements) {
      if (el.textContent && el.textContent.trim() === text) {
        return el;
      }
    }
    return null;
  }

  /**
   * 获取今天日期 YYYY-MM-DD
   */
  getTodayDate() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

// 全局实例化（确保 window 对象存在）
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.__openClawBridge = new OpenClawBridge();
    });
  } else {
    window.__openClawBridge = new OpenClawBridge();
  }
}
