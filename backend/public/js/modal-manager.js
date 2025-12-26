/**
 * 自定义弹窗管理器
 * 提供美观的确认弹窗功能
 */
class ModalManager {
  /**
   * 初始化弹窗管理器实例。
   */
  constructor() {
    this.modal = document.getElementById("customModal");
    this.messageElement = document.getElementById("modalMessage");
    this.cancelButton = document.getElementById("modalCancel");
    this.confirmButton = document.getElementById("modalConfirm");

    this.init();
  }

  /**
   * 绑定弹窗相关事件。
   * @returns {void}
   */
  init() {
    if (!this.modal) {
      console.error("自定义弹窗元素未找到");
      return;
    }

    // 绑定事件
    this.cancelButton.addEventListener("click", () => this.hide());
    this.confirmButton.addEventListener("click", () => this.confirm());

    // 点击遮罩层关闭弹窗
    this.modal.addEventListener("click", (e) => {
      if (
        e.target === this.modal ||
        e.target.classList.contains("custom-modal-overlay")
      ) {
        this.hide();
      }
    });

    // ESC键关闭弹窗
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isVisible()) {
        this.hide();
      }
    });
  }

  /**
   * 显示确认弹窗。
   * @param {string} message - 提示信息
   * @param {Function} onConfirm - 确认回调
   * @param {Function} onCancel - 取消回调
   * @param {Object} options - 选项
   * @returns {Promise<boolean>} 用户选择结果
   */
  show(message, onConfirm, onCancel, options = {}) {
    if (!this.modal) return Promise.reject("弹窗未初始化");

    return new Promise((resolve, reject) => {
      // 设置消息内容
      this.messageElement.textContent = message;

      // 设置按钮文本
      this.confirmButton.textContent = options.confirmText || "确认";
      this.cancelButton.textContent = options.cancelText || "取消";

      // 设置确认按钮样式
      if (options.confirmType === "danger") {
        this.confirmButton.className = "btn-primary";
        this.confirmButton.style.background =
          "linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%)";
      } else {
        this.confirmButton.className = "btn-primary";
        this.confirmButton.style.background =
          "linear-gradient(135deg, #4f8cff 0%, #00d4ff 100%)";
      }

      // 清除之前的事件监听器
      const newConfirmButton = this.confirmButton.cloneNode(true);
      const newCancelButton = this.cancelButton.cloneNode(true);

      this.confirmButton.parentNode.replaceChild(
        newConfirmButton,
        this.confirmButton
      );
      this.cancelButton.parentNode.replaceChild(
        newCancelButton,
        this.cancelButton
      );

      this.confirmButton = newConfirmButton;
      this.cancelButton = newCancelButton;

      // 绑定新的事件监听器
      this.confirmButton.addEventListener("click", () => {
        this.hide();
        if (onConfirm) onConfirm();
        resolve(true);
      });

      this.cancelButton.addEventListener("click", () => {
        this.hide();
        if (onCancel) onCancel();
        resolve(false);
      });

      // 显示弹窗
      this.modal.style.display = "flex";

      // 添加显示动画
      setTimeout(() => {
        this.modal.classList.add("show");
      }, 10);
    });
  }

  /**
   * 隐藏弹窗。
   * @returns {void}
   */
  hide() {
    if (!this.modal) return;

    this.modal.classList.remove("show");
    setTimeout(() => {
      this.modal.style.display = "none";
    }, 300);
  }

  /**
   * 检查弹窗是否可见。
   * @returns {boolean} 是否可见
   */
  isVisible() {
    return this.modal && this.modal.style.display !== "none";
  }

  /**
   * 显示确认对话框（替换原生confirm）。
   * @param {string} message - 提示信息
   * @param {Object} options - 选项
   * @returns {Promise<boolean>} 用户选择结果
   */
  confirm(message, options = {}) {
    return this.show(
      message,
      null, // onConfirm
      null, // onCancel
      {
        confirmText: "确认",
        cancelText: "取消",
        confirmType: "danger",
        ...options,
      }
    );
  }
}

// 创建全局实例
window.modalManager = new ModalManager();

// 导出类
window.ModalManager = ModalManager;
