/**
 * 加解密管理模块
 * 处理加解密相关的业务逻辑
 */

class CryptoManager {
  /**
   * 初始化加解密管理器。
   * @param {ApiService} apiService - API 服务实例
   * @param {StatusManager} statusManager - 状态管理实例
   */
  constructor(apiService, statusManager) {
    this.apiService = apiService;
    this.statusManager = statusManager;
  }

  /**
   * 处理加密。
   * @returns {Promise<void>}
   */
  async handleEncrypt() {
    const textInput = document.getElementById("textInput");
    const outCrypto = document.getElementById("out-crypto");

    if (!textInput || !outCrypto) return;

    const text = textInput.value.trim();
    if (!text) {
      this.statusManager.showStatus("请输入要加密的文本", "error");
      return;
    }

    try {
      this.statusManager.showStatus("正在加密...", "info");
      const resp = await this.apiService.encrypt(text);

      if (resp.ok) {
        outCrypto.textContent = resp.result;
        this.statusManager.showStatus("加密成功", "success");
      } else {
        throw new Error(resp.error || "加密失败");
      }
    } catch (e) {
      outCrypto.textContent = "加密失败: " + (e && e.message ? e.message : e);
      this.statusManager.showStatus("加密失败: " + e.message, "error");
    }
  }

  /**
   * 处理解密。
   * @returns {Promise<void>}
   */
  async handleDecrypt() {
    const textInput = document.getElementById("textInput");
    const outCrypto = document.getElementById("out-crypto");

    if (!textInput || !outCrypto) return;

    const text = textInput.value.trim();
    if (!text) {
      this.statusManager.showStatus("请输入要解密的文本", "error");
      return;
    }

    try {
      this.statusManager.showStatus("正在解密...", "info");
      const resp = await this.apiService.decrypt(text);

      if (resp.ok) {
        outCrypto.textContent = JSON.stringify(resp.result, null, 2);
        this.statusManager.showStatus("解密成功", "success");
      } else {
        throw new Error(resp.error || "解密失败");
      }
    } catch (e) {
      outCrypto.textContent = "解密失败: " + (e && e.message ? e.message : e);
      this.statusManager.showStatus("解密失败: " + e.message, "error");
    }
  }
}

// 导出加解密管理器类
window.CryptoManager = CryptoManager;
