/**
 * 二维码模块
 * 处理二维码生成和倒计时功能
 */

class QRCodeManager {
  /**
   * 初始化二维码管理器。
   */
  constructor() {
    this.qrElement = document.getElementById("qrcode");
    this.countdownElement = document.getElementById("countdown");
    this.codeTextElement = document.getElementById("codeText");
    this.countdownInterval = null;
    this.expiryTime = null;
    this.autoRefresh = true;
  }

  /**
   * 设置二维码元素（用于不同标签页）
   * @param {string} qrId - 二维码容器ID
   * @param {string} countdownId - 倒计时元素ID
   * @param {string} codeTextId - 代码文本元素ID
   */
  setElements(qrId, countdownId, codeTextId) {
    this.qrElement = document.getElementById(qrId);
    this.countdownElement = document.getElementById(countdownId);
    this.codeTextElement = document.getElementById(codeTextId);
  }

  /**
   * 生成二维码
   * @param {string} code - 要生成二维码的代码
   * @param {number} expirySeconds - 过期时间（秒）
   * @param {boolean} autoRefresh - 是否自动刷新
   * @returns {Promise<void>}
   */
  async generateQRCode(code, expirySeconds = 30, autoRefresh = true) {
    if (!this.qrElement) {
      console.error("二维码容器元素未找到");
      return;
    }

    // 检查QRCode库是否可用
    if (typeof QRCode === "undefined") {
      console.error("QRCode库未加载");
      this.qrElement.innerHTML =
        '<div style="color: #ff6b6b; text-align: center; padding: 20px;">QRCode库未加载</div>';
      return;
    }

    try {
      // 清空容器
      this.qrElement.innerHTML = "";

      // 创建canvas元素
      const canvas = document.createElement("canvas");
      this.qrElement.appendChild(canvas);

      // 根据屏幕宽度调整二维码尺寸
      const screenWidth = window.innerWidth;
      const qrSize = screenWidth <= 480 ? 200 : 260;

      // 生成二维码
      await QRCode.toCanvas(canvas, String(code), {
        width: qrSize,
        margin: 1,
        errorCorrectionLevel: "H",
        color: {
          dark: "#67a8ff",
          light: "#0f1628",
        },
      });

      // 设置代码文本
      if (this.codeTextElement) {
        this.codeTextElement.textContent = String(code);
      }

      this.autoRefresh = autoRefresh;

      // 设置过期时间并开始倒计时
      this.setExpiryTime(expirySeconds);
      this.startCountdown();

      console.log("二维码生成成功");
    } catch (error) {
      console.error("QR code generation error:", error);
      this.qrElement.innerHTML = `<div style="color: #ff6b6b; text-align: center; padding: 20px;">二维码生成失败: ${error.message}</div>`;
    }
  }

  /**
   * 设置过期时间
   * @param {number} seconds - 过期秒数
   * @returns {void}
   */
  setExpiryTime(seconds) {
    this.expiryTime = Date.now() + seconds * 1000;
  }

  /**
   * 开始倒计时。
   * @returns {void}
   */
  startCountdown() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    this.countdownInterval = setInterval(() => {
      if (!this.expiryTime) return;

      const now = Date.now();
      const remaining = Math.max(0, this.expiryTime - now);

      if (remaining <= 0) {
        this.clearCountdown();
        if (this.autoRefresh) {
          this.refreshQRCode();
        }
        return;
      }

      const seconds = Math.ceil(remaining / 1000);
      if (this.countdownElement) {
        this.countdownElement.textContent = `${seconds}s`;
      }
    }, 1000);
  }

  /**
   * 清除倒计时。
   * @returns {void}
   */
  clearCountdown() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }

    if (this.countdownElement) {
      this.countdownElement.textContent = "--";
    }
  }

  /**
   * 刷新二维码（重新生成）。
   * @returns {Promise<void>}
   */
  async refreshQRCode() {
    if (this.codeTextElement && this.codeTextElement.textContent !== "--") {
      const code = this.codeTextElement.textContent;
      await this.generateQRCode(code, 30);
    }
  }

  /**
   * 销毁二维码。
   * @returns {void}
   */
  destroy() {
    this.clearCountdown();
    if (this.qrElement) {
      this.qrElement.innerHTML = "";
    }
  }
}

// 导出二维码管理器类
window.QRCodeManager = QRCodeManager;
