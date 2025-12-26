/**
 * 标签页管理模块
 * 处理标签页切换功能
 */

class TabManager {
  /**
   * 初始化标签页管理器。
   */
  constructor() {
    this.tabChips = document.querySelectorAll(".tab-chip");
    this.tabContents = document.querySelectorAll(".tab-content");
    this.init();
  }

  /**
   * 初始化入口。
   * @returns {void}
   */
  init() {
    this.bindEvents();
  }

  /**
   * 绑定标签页切换事件。
   * @returns {void}
   */
  bindEvents() {
    this.tabChips.forEach((chip) => {
      chip.addEventListener("click", () => {
        const tabId = chip.dataset.tab;
        this.switchTab(tabId);
      });
    });
  }

  /**
   * 切换标签页。
   * @param {string} tabId - 标签页ID
   * @returns {void}
   */
  switchTab(tabId) {
    // 移除所有活动状态
    this.tabChips.forEach((chip) => {
      chip.classList.remove("active");
    });

    this.tabContents.forEach((content) => {
      content.classList.remove("active");
    });

    // 激活选中的标签页
    const activeChip = document.querySelector(`[data-tab="${tabId}"]`);
    const activeContent = document.getElementById(`tab-${tabId}`);

    if (activeChip) {
      activeChip.classList.add("active");
    }

    if (activeContent) {
      activeContent.classList.add("active");
    }

    // 如果切换到查询订单标签页，自动显示缓存的订单数据
    if (tabId === "query" && window.app && window.app.orderManager) {
      window.app.orderManager.autoDisplayCachedOrders();
    }
  }

  /**
   * 获取当前活动标签页。
   * @returns {string} 当前标签页ID
   */
  getActiveTab() {
    const activeChip = document.querySelector(".tab-chip.active");
    return activeChip ? activeChip.dataset.tab : null;
  }
}

// 导出标签页管理器类
window.TabManager = TabManager;
