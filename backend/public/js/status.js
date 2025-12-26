/**
 * 状态管理模块
 * 处理页面状态显示和消息提示
 */

class StatusManager {
  /**
   * 初始化状态管理器。
   */
  constructor() {
    this.statusEl = document.getElementById("status");
    this.statusMsgEl = document.getElementById("statusMsg");
  }

  /**
   * 显示状态消息
   * @param {string} message - 消息内容
   * @param {string} type - 消息类型 (info, success, error, warning)
   * @returns {void}
   */
  showStatus(message, type = "info") {
    if (!this.statusMsgEl) return;

    this.statusMsgEl.textContent = message;
    this.statusMsgEl.className = `status ${type}`;
    this.statusMsgEl.style.display = "block";

    if (this.statusEl) {
      this.statusEl.textContent =
        type === "error" ? "错误" : type === "success" ? "成功" : "处理中";
    }
  }

  /**
   * 隐藏状态消息。
   * @returns {void}
   */
  hideStatus() {
    if (this.statusMsgEl) {
      this.statusMsgEl.style.display = "none";
    }
  }

  /**
   * 显示创建订单状态
   * @param {string} message - 消息内容
   * @param {string} type - 消息类型
   * @returns {void}
   */
  showCreateOrderStatus(message, type) {
    const statusEl = document.getElementById("createOrderStatus");
    if (!statusEl) return;

    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
    statusEl.style.display = "block";
  }

  /**
   * 显示创建订单状态（创建订单标签页）
   * @param {string} message - 消息内容
   * @param {string} type - 消息类型
   * @returns {void}
   */
  showCreateOrderStatusTab(message, type) {
    const statusEl = document.getElementById("createOrderStatusTab");
    if (!statusEl) return;

    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
    statusEl.style.display = "block";
  }

  /**
   * 显示查询订单状态
   * @param {string} message - 消息内容
   * @param {string} type - 消息类型
   * @returns {void}
   */
  showQueryStatus(message, type) {
    const statusEl = document.getElementById("queryStatusMsg");
    if (!statusEl) return;

    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
    statusEl.style.display = "block";
  }
}

// 导出状态管理器实例
window.statusManager = new StatusManager();
