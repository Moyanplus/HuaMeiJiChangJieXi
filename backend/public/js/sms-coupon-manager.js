/**
 * 短信验证码 + 优惠券二维码模块
 */

class SmsCouponManager {
  /**
   * 初始化短信取券管理器。
   * @param {ApiService} apiService - API 服务实例
   * @param {QRCodeManager} qrCodeManager - 二维码管理实例
   */
  constructor(apiService, qrCodeManager) {
    this.apiService = apiService;
    this.qrCodeManager = qrCodeManager;
    this.statusEl = document.getElementById("smsStatusMsg");
    this.smsTokenEl = document.getElementById("smsTokenValue");
    this.lastSmsToken = null;
    this.lastOrderId = null;
  }

  /**
   * 展示状态提示。
   * @param {string} message - 提示内容
   * @param {string} type - 状态类型
   * @returns {void}
   */
  showStatus(message, type = "info") {
    if (!this.statusEl) return;
    this.statusEl.textContent = message;
    this.statusEl.className = `status ${type}`;
    this.statusEl.style.display = "block";
  }

  /**
   * 设置并展示 smsToken。
   * @param {string} token - 短信 token
   * @returns {void}
   */
  setSmsToken(token) {
    this.lastSmsToken = token || null;
    if (this.smsTokenEl) {
      this.smsTokenEl.textContent = token || "--";
    }
  }

  /**
   * 获取订单号输入值。
   * @returns {string} 订单号
   */
  getOrderId() {
    const el = document.getElementById("orderIdInputQR");
    return el ? el.value.trim() : "";
  }

  /**
   * 获取短信验证码输入值。
   * @returns {string} 短信验证码
   */
  getSmsCode() {
    const el = document.getElementById("smsCodeInputQR");
    return el ? el.value.trim() : "";
  }

  /**
   * 解析 data 字段（可能为 JSON 字符串）。
   * @param {string|Object} data - 原始数据
   * @returns {Object|string|null} 解析结果
   */
  normalizeDataField(data) {
    if (typeof data !== "string") return data;
    try {
      return JSON.parse(data);
    } catch (_) {
      return data;
    }
  }

  /**
   * 从响应中提取优惠券代码。
   * @param {Object} resp - 接口响应
   * @returns {string|null} 优惠券代码
   */
  resolveCouponCode(resp) {
    if (resp && resp.code) return resp.code;
    if (resp && resp.meta && resp.meta.code) return resp.meta.code;
    const dataField = this.normalizeDataField(resp?.result?.data);
    if (dataField && typeof dataField === "object") {
      return dataField.couponCode || dataField.couponNum || null;
    }
    return null;
  }

  /**
   * 解析二维码有效期（秒）。
   * @param {Object} resp - 接口响应
   * @returns {number} 剩余秒数
   */
  resolveExpirySeconds(resp) {
    const meta = resp && resp.meta ? resp.meta : {};
    if (typeof meta.expiresInSeconds === "number") {
      return meta.expiresInSeconds;
    }
    if (meta.validTime && typeof meta.validTime === "string") {
      const normalized = meta.validTime.includes("T")
        ? meta.validTime
        : meta.validTime.replace(" ", "T");
      const ts = Date.parse(normalized);
      if (!Number.isNaN(ts)) {
        return Math.max(0, Math.ceil((ts - Date.now()) / 1000));
      }
    }
    return 180;
  }

  /**
   * 发送短信验证码。
   * @returns {Promise<void>}
   */
  async handleSendSms() {
    const orderId = this.getOrderId();
    if (!orderId) {
      this.showStatus("请输入订单号后再发送验证码", "warning");
      return;
    }

    this.showStatus("正在发送验证码...", "info");
    try {
      const resp = await this.apiService.sendSmsCode(orderId);
      if (!resp.ok) {
        throw new Error(resp.error || "短信发送失败");
      }
      this.lastOrderId = orderId;
      this.showStatus("验证码已发送，请查收短信", "success");
    } catch (e) {
      this.showStatus(
        "发送失败: " + (e && e.message ? e.message : e),
        "error"
      );
    }
  }

  /**
   * 验证短信验证码并获取二维码。
   * @returns {Promise<void>}
   */
  async handleVerifyAndFetch() {
    const orderId = this.getOrderId();
    const smsCode = this.getSmsCode();

    if (!orderId) {
      this.showStatus("请输入订单号", "warning");
      return;
    }
    if (!smsCode) {
      this.showStatus("请输入短信验证码", "warning");
      return;
    }

    this.showStatus("正在验证验证码...", "info");
    try {
      const verifyResp = await this.apiService.verifySmsCode(orderId, smsCode);
      if (!verifyResp.ok) {
        throw new Error(verifyResp.error || "验证码验证失败");
      }

      const smsToken = verifyResp.smsToken;
      if (!smsToken) {
        throw new Error("未获取到smsToken");
      }

      this.setSmsToken(smsToken);
      this.lastOrderId = orderId;

      await this.fetchCoupon(orderId, smsToken);
    } catch (e) {
      this.showStatus(
        "验证失败: " + (e && e.message ? e.message : e),
        "error"
      );
    }
  }

  /**
   * 获取优惠券并生成二维码。
   * @param {string} orderId - 订单号
   * @param {string} smsToken - 短信 token
   * @returns {Promise<void>}
   */
  async fetchCoupon(orderId, smsToken) {
    this.showStatus("正在获取二维码...", "info");
    try {
      const resp = await this.apiService.fetchCouponBySms(orderId, smsToken);
      if (!resp.ok) {
        throw new Error(resp.error || "获取优惠券失败");
      }

      const code = this.resolveCouponCode(resp);
      if (!code) {
        throw new Error("未获取到优惠券代码");
      }

      const expirySeconds = this.resolveExpirySeconds(resp);
      if (expirySeconds <= 0) {
        this.showStatus("二维码已过期，请重新获取验证码", "warning");
        return;
      }

      if (this.qrCodeManager) {
        this.qrCodeManager.setElements(
          "qrcodeTab",
          "countdownTab",
          "codeTextTab"
        );
        await this.qrCodeManager.generateQRCode(
          String(code),
          expirySeconds,
          false
        );
      }

      this.showStatus(
        `获取成功，有效期约 ${expirySeconds}s`,
        "success"
      );
    } catch (e) {
      this.showStatus(
        "获取失败: " + (e && e.message ? e.message : e),
        "error"
      );
    }
  }
}

window.SmsCouponManager = SmsCouponManager;
