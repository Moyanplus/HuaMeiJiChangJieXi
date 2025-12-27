/**
 * API工具模块
 * 处理所有与后端API的通信
 */

class ApiService {
  /**
   * 初始化 API 服务实例。
   */
  constructor() {
    this.baseUrl = "";
  }

  /**
   * 发送POST请求
   * @param {string} url - 请求URL
   * @param {Object} body - 请求体
   * @returns {Promise<Object>} 响应数据
   */
  async post(url, body) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body || {}),
    });

    let rawText = "";
    try {
      rawText = await response.text();
    } catch (_) {
      rawText = "";
    }

    let data = null;
    if (rawText) {
      try {
        data = JSON.parse(rawText);
      } catch (_) {
        data = { raw: rawText };
      }
    }

    if (!data || typeof data !== "object") {
      data = {};
    }

    if (typeof data.ok !== "boolean") {
      data.ok = response.ok;
    }
    data.status = response.status;

    if (!response.ok) {
      data.error =
        data.error ||
        data.msg ||
        data.resultDesc ||
        data.result?.msg ||
        data.result?.resultDesc ||
        `HTTP ${response.status}`;
    }

    if (data.ok === false && !data.error) {
      data.error =
        data.msg ||
        data.resultDesc ||
        data.result?.msg ||
        data.result?.resultDesc ||
        "请求失败";
    }

    return data;
  }

  /**
   * 解析URL参数
   * @param {string} url - 要解析的URL
   * @returns {Object} 包含data和sign参数的对象
   */
  parseUrl(url) {
    try {
      const urlObj = new URL(url);
      let params;

      if (urlObj.hash && urlObj.hash.includes("?")) {
        const hashQuery = urlObj.hash.split("?")[1];
        params = new URLSearchParams(hashQuery);
      } else {
        params = new URLSearchParams(urlObj.search);
      }

      return {
        data: params.get("data"),
        sign: params.get("sign"),
      };
    } catch (e) {
      throw new Error("URL解析失败: " + e.message);
    }
  }

  /**
   * 加密文本
   * @param {string} text - 要加密的文本
   * @returns {Promise<Object>} 加密结果
   */
  async encrypt(text) {
    return this.post("/api/encrypt", { text });
  }

  /**
   * 解密文本
   * @param {string} sdData - 要解密的数据
   * @returns {Promise<Object>} 解密结果
   */
  async decrypt(sdData) {
    return this.post("/api/decrypt", { sdData });
  }

  /**
   * 执行完整流程
   * @param {string} data - data参数
   * @param {string} sign - sign参数
   * @returns {Promise<Object>} 完整流程结果
   */
  async fullFlow(data, sign) {
    return this.post("/api/full-flow", { data, sign });
  }

  /**
   * 获取用户信息
   * @param {string} cardTypeCode - 卡类型代码
   * @param {string} data - 从链接解析得到的data参数
   * @returns {Promise<Object>} 用户信息
   */
  async getUserInfo(
    cardTypeCode = window.CONFIG?.CARD_TYPE_CODE || "HXYX0803",
    data = null
  ) {
    return this.post("/api/get-user-info", { cardTypeCode, data });
  }

  /**
   * 创建订单
   * @param {Object} orderData - 订单数据
   * @returns {Promise<Object>} 创建结果
   */
  async createOrder(orderData) {
    return this.post("/api/create-order", orderData);
  }

  /**
   * 发送短信验证码
   * @param {string} orderId - 订单号（短信验证用）
   * @returns {Promise<Object>} 发送结果
   */
  async sendSmsCode(orderId) {
    return this.post("/api/sms/send", { orderId });
  }

  /**
   * 验证短信验证码
   * @param {string} orderId - 订单号
   * @param {string} smsCode - 短信验证码
   * @returns {Promise<Object>} 验证结果
   */
  async verifySmsCode(orderId, smsCode, extra = {}) {
    return this.post("/api/sms/verify", { orderId, smsCode, ...extra });
  }

  /**
   * 使用短信token获取优惠券二维码
   * @param {string} orderId - 订单号
   * @param {string} smsToken - 短信token
   * @returns {Promise<Object>} 优惠券结果
   */
  async fetchCouponBySms(orderId, smsToken) {
    return this.post("/api/coupon-by-sms", { orderId, smsToken });
  }

  /**
   * 查询订单列表
   * @param {Object} queryData - 查询参数
   * @returns {Promise<Object>} 查询结果
   */
  async queryOrders(queryData) {
    return this.post("/api/query-orders", queryData);
  }

  /**
   * 取消订单
   * @param {Object} cancelData - 取消订单参数
   * @returns {Promise<Object>} 取消结果
   */
  async cancelOrder(cancelData) {
    return this.post("/api/cancel-order", cancelData);
  }

  /**
   * 更换贵宾厅
   * @param {Object} changeData - 更换贵宾厅参数 {orderId, loungeCode, sdTimestamp}
   * @returns {Promise<Object>} 更换结果
   */
  async changeLounge(changeData) {
    return this.post("/api/change-lounge", changeData);
  }

  /**
   * 搜索贵宾厅
   * @param {string} query - 搜索关键词
   * @param {number} limit - 返回数量限制
   * @returns {Promise<Object>} 搜索结果
   */
  async searchLounges(query, limit = 50) {
    return this.get(
      `/api/lounges/search?q=${encodeURIComponent(query)}&limit=${limit}`
    );
  }
}

// 导出API服务实例
window.apiService = new ApiService();
