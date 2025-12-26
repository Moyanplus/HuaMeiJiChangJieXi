/**
 * 主应用模块（重构版）
 * 协调各个功能模块，处理主要业务逻辑
 */

class App {
  /**
   * 初始化应用实例与基础状态。
   */
  constructor() {
    this.apiService = window.apiService;
    this.statusManager = window.statusManager;
    this.qrCodeManager = null;
    this.loungeSearch = null;
    this.tabManager = null;
    this.smsCouponManager = null;

    // 业务模块
    this.orderManager = null;
    this.flowManager = null;
    this.cryptoManager = null;
    this.linkManager = null;

    // 状态数据
    this.currentData = "";
    this.currentSign = "";
    this.currentActivityId = null;
    this.currentCardTypeCode = null;

    this.init();
  }

  /**
   * 初始化入口，等待 DOM 就绪。
   */
  init() {
    // 等待页面加载完成
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.setup());
    } else {
      this.setup();
    }
  }

  /**
   * 完成模块初始化与事件绑定。
   */
  setup() {
    console.log("页面加载完成，开始初始化...");

    // 初始化各个模块
    this.qrCodeManager = new window.QRCodeManager();
    this.loungeSearch = new window.LoungeSearch();
    this.tabManager = new window.TabManager();
    this.smsCouponManager = new window.SmsCouponManager(
      this.apiService,
      this.qrCodeManager
    );

    // 初始化业务模块
    this.orderManager = new window.OrderManager(
      this.apiService,
      this.statusManager
    );
    this.flowManager = new window.FlowManager(
      this.apiService,
      this.statusManager,
      this.qrCodeManager
    );
    this.cryptoManager = new window.CryptoManager(
      this.apiService,
      this.statusManager
    );
    this.linkManager = new window.LinkManager(this.statusManager);

    // 绑定事件
    this.bindEvents();
    this.orderManager.setupPhoneAutoQuery();

    // 设置示例链接
    this.linkManager.setExampleUrl();

    console.log("应用初始化完成");
  }

  /**
   * 绑定页面交互事件。
   */
  bindEvents() {
    // 加密按钮事件
    const btnEncrypt = document.getElementById("btn-encrypt");
    if (btnEncrypt) {
      btnEncrypt.onclick = () => this.cryptoManager.handleEncrypt();
    }

    // 解密按钮事件
    const btnDecrypt = document.getElementById("btn-decrypt");
    if (btnDecrypt) {
      btnDecrypt.onclick = () => this.cryptoManager.handleDecrypt();
    }

    // 完整流程按钮事件
    const btnFullFlow = document.getElementById("btn-full-flow");
    if (btnFullFlow) {
      btnFullFlow.onclick = () => this.handleFullFlow();
    }

    // 创建订单按钮事件（链接解析标签页）
    const btnCreateOrder = document.getElementById("btn-create-order");
    if (btnCreateOrder) {
      btnCreateOrder.onclick = () => this.handleCreateOrder();
    }

    // 创建订单按钮事件（创建订单标签页）
    const btnCreateOrderTab = document.getElementById("btn-create-order-tab");
    if (btnCreateOrderTab) {
      btnCreateOrderTab.onclick = () => this.handleCreateOrderTab();
    }

    // 查询订单按钮事件
    const btnQueryOrders = document.getElementById("btn-query-orders");
    if (btnQueryOrders) {
      btnQueryOrders.onclick = () => this.orderManager.handleQueryOrders();
    }

    // 刷新订单按钮事件
    const btnRefreshOrders = document.getElementById("btn-refresh-orders");
    if (btnRefreshOrders) {
      btnRefreshOrders.onclick = () => this.orderManager.handleQueryOrders();
    }

    // 生成专属链接按钮事件（链接解析标签页）
    const btnGenerateLink = document.getElementById("btn-generate-link");
    if (btnGenerateLink) {
      btnGenerateLink.onclick = () => this.linkManager.handleGenerateLink();
    }

    // 生成专属链接按钮事件（二维码标签页）
    const btnGenerateLinkTab = document.getElementById("btn-generate-link-tab");
    if (btnGenerateLinkTab) {
      btnGenerateLinkTab.onclick = () =>
        this.linkManager.handleGenerateLinkTab();
    }

    const btnSendSms = document.getElementById("btn-send-sms");
    if (btnSendSms) {
      btnSendSms.onclick = () => this.smsCouponManager.handleSendSms();
    }

    const btnConfirmSms = document.getElementById("btn-confirm-sms");
    if (btnConfirmSms) {
      btnConfirmSms.onclick = () => this.smsCouponManager.handleVerifyAndFetch();
    }
  }

  /**
   * 处理完整流程。
   * @returns {Promise<void>}
   */
  async handleFullFlow() {
    try {
      const result = await this.flowManager.handleFullFlow(
        this.currentData,
        this.currentSign,
        this.orderManager
      );

      if (result) {
        // 更新状态数据
        this.currentData = result.data;
        this.currentSign = result.sign;
        this.currentActivityId = result.activityId;
        this.currentCardTypeCode = result.cardTypeCode;
      }
    } catch (error) {
      console.error("完整流程执行失败:", error);
    }
  }

  /**
   * 处理创建订单（链接解析标签页）。
   * @returns {Promise<void>}
   */
  async handleCreateOrder() {
    await this.orderManager.handleCreateOrder(
      this.currentData,
      this.currentActivityId,
      this.currentCardTypeCode
    );
  }

  /**
   * 处理创建订单（创建订单标签页）。
   * @returns {Promise<void>}
   */
  async handleCreateOrderTab() {
    await this.orderManager.handleCreateOrderTab(
      this.currentData,
      this.currentActivityId,
      this.currentCardTypeCode
    );
  }
}

// 初始化应用
window.app = new App();
