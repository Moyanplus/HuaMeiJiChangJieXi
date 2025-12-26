/**
 * 主应用模块
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

    this.currentData = "";
    this.currentSign = "";
    this.currentActivityId = null;
    this.currentCardTypeCode = null;
    this.cachedOrders = []; // 存储从一键运行获取的订单数据

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
   * 初始化模块并注册事件。
   */
  setup() {
    console.log("页面加载完成，开始初始化...");

    // 初始化各个模块
    this.qrCodeManager = new window.QRCodeManager();
    this.loungeSearch = new window.LoungeSearch();
    this.tabManager = new window.TabManager();

    // 绑定事件
    this.bindEvents();

    // 设置示例链接
    this.setExampleUrl();

    console.log("应用初始化完成");
  }

  /**
   * 绑定页面交互事件。
   */
  bindEvents() {
    // 加密按钮事件
    const btnEncrypt = document.getElementById("btn-encrypt");
    if (btnEncrypt) {
      btnEncrypt.onclick = () => this.handleEncrypt();
    }

    // 解密按钮事件
    const btnDecrypt = document.getElementById("btn-decrypt");
    if (btnDecrypt) {
      btnDecrypt.onclick = () => this.handleDecrypt();
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
      btnQueryOrders.onclick = () => this.handleQueryOrders();
    }

    // 刷新订单按钮事件
    const btnRefreshOrders = document.getElementById("btn-refresh-orders");
    if (btnRefreshOrders) {
      btnRefreshOrders.onclick = () => this.handleQueryOrders();
    }

    // 生成专属链接按钮事件（链接解析标签页）
    const btnGenerateLink = document.getElementById("btn-generate-link");
    if (btnGenerateLink) {
      btnGenerateLink.onclick = () => this.handleGenerateLink();
    }

    // 生成专属链接按钮事件（二维码标签页）
    const btnGenerateLinkTab = document.getElementById("btn-generate-link-tab");
    if (btnGenerateLinkTab) {
      btnGenerateLinkTab.onclick = () => this.handleGenerateLinkTab();
    }
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

  /**
   * 处理完整流程。
   * @returns {Promise<void>}
   */
  async handleFullFlow() {
    const urlInput = document.getElementById("urlInput");
    const outStep1 = document.getElementById("out-step1");
    const outStep2 = document.getElementById("out-step2");
    const outStep3 = document.getElementById("out-step3");
    const outStep4 = document.getElementById("out-step4");
    const outStep5 = document.getElementById("out-step5");
    const orderUserNameInput = document.getElementById("orderUserNameInput");

    if (!urlInput) return;

    // 清空所有结果
    [outStep1, outStep2, outStep3, outStep4, outStep5].forEach((el) => {
      if (el) el.textContent = "";
    });

    if (this.qrCodeManager) {
      this.qrCodeManager.destroy();
    }

    this.statusManager.hideStatus();

    try {
      const url = urlInput.value.trim();
      if (!url) {
        this.statusManager.showStatus("请输入链接", "error");
        return;
      }

      this.statusManager.showStatus("正在执行完整流程...", "info");

      const params = this.apiService.parseUrl(url);

      if (!params.data) {
        this.statusManager.showStatus("链接中未找到 data 参数", "error");
        return;
      }

      if (!params.sign) {
        this.statusManager.showStatus(
          "警告：链接中未找到 sign 参数，将尝试仅使用 data 参数",
          "warning"
        );
      }

      this.currentData = params.data;
      this.currentSign = params.sign;

      // 自动获取用户信息并填充到创建订单输入框（在URL解析之后）
      try {
        this.statusManager.showStatus("正在获取用户信息...", "info");
        const userInfoResp = await this.apiService.getUserInfo(
          window.CONFIG?.CARD_TYPE_CODE || "HXYX0803",
          this.currentData // 传递当前解析的data参数
        );

        if (userInfoResp.ok && userInfoResp.data) {
          const userInfo = userInfoResp.data;

          // 自动填充创建订单的输入框
          const phoneNoInput = document.getElementById("createPhoneNoOrder");
          const nameInput = document.getElementById("createNameOrder");

          if (phoneNoInput && userInfo.phone) {
            phoneNoInput.value = userInfo.phone;
            phoneNoInput.readOnly = true;
            phoneNoInput.classList.add("readonly-field");
            console.log("✅ 自动填充手机号:", userInfo.phone);
          }

          if (nameInput && userInfo.userName) {
            nameInput.value = userInfo.userName;
            nameInput.readOnly = true;
            nameInput.classList.add("readonly-field");
            console.log("✅ 自动填充姓名:", userInfo.userName);
          }

          this.statusManager.showStatus(
            "用户信息获取成功，已自动填充",
            "success"
          );
        } else {
          console.log("⚠️ 用户信息获取失败，将使用手动输入的信息");
          this.statusManager.showStatus(
            "用户信息获取失败，请手动输入",
            "warning"
          );
        }
      } catch (userInfoError) {
        console.log("⚠️ 获取用户信息时出错:", userInfoError);
        this.statusManager.showStatus(
          "用户信息获取失败，请手动输入",
          "warning"
        );
      }

      this.statusManager.showStatus(
        "正在执行完整流程：data→custNo→orderId→orderNo→coupon...",
        "info"
      );

      const resp = await this.apiService.fullFlow(
        this.currentData,
        this.currentSign
      );

      if (!resp.ok) {
        throw new Error(resp.error || "完整流程执行失败");
      }

      // 显示各个步骤的结果
      this.displayStepResults(
        resp.result,
        outStep1,
        outStep2,
        outStep3,
        outStep4,
        outStep5
      );

      // 提取并更新 cardTypeCode
      this.extractAndUpdateCardTypeCode(resp.result);

      // 提取并存储 activityId
      this.extractAndStoreActivityId(resp.result);

      // 自动提取订单用户名
      this.extractOrderUserName(resp.result, orderUserNameInput);

      // 存储订单数据到查询订单模块
      this.storeOrdersFromFlow(resp.result);

      // 由于extractOrderUserName已经直接设置了orderUserNameInputQR，这里不需要额外同步
      console.log(
        "订单用户名已通过extractOrderUserName方法直接设置到二维码标签页"
      );

      // 处理优惠券和二维码
      await this.handleCouponAndQRCode(resp.result);
    } catch (e) {
      this.handleFullFlowError(
        e,
        outStep1,
        outStep2,
        outStep3,
        outStep4,
        outStep5
      );
    }
  }

  /**
   * 显示完整流程各步骤结果。
   * @param {Object} result - 完整流程结果
   * @param {HTMLElement} outStep1 - 步骤1输出
   * @param {HTMLElement} outStep2 - 步骤2输出
   * @param {HTMLElement} outStep3 - 步骤3输出
   * @param {HTMLElement} outStep4 - 步骤4输出
   * @param {HTMLElement} outStep5 - 步骤5输出
   * @returns {void}
   */
  displayStepResults(result, outStep1, outStep2, outStep3, outStep4, outStep5) {
    if (outStep1)
      outStep1.textContent = JSON.stringify(result.step1_decrypt_data, null, 2);
    if (outStep2)
      outStep2.textContent = JSON.stringify(result.step2_custNo, null, 2);
    if (outStep3)
      outStep3.textContent = JSON.stringify(result.step3_orderId, null, 2);
    if (outStep4)
      outStep4.textContent = JSON.stringify(result.step4_orderNo, null, 2);
    if (outStep5)
      outStep5.textContent = JSON.stringify(result.step5_coupon, null, 2);

    console.log("完整流程结果:", result);
    console.log("最终orderNo:", result.step4_orderNo);
    console.log("优惠券结果:", result.step5_coupon);
  }

  /**
   * 提取并更新 cardTypeCode。
   * @param {Object} result - 完整流程结果
   * @returns {void}
   */
  extractAndUpdateCardTypeCode(result) {
    let cardTypeCode = null;
    const step1Data = result.step1_decrypt_data;

    if (step1Data && step1Data.data) {
      if (typeof step1Data.data === "string") {
        try {
          const parsedData = JSON.parse(step1Data.data);
          cardTypeCode = parsedData.cardTypeCode;
        } catch (e) {
          console.warn("解析步骤1数据中的cardTypeCode失败:", e.message);
        }
      } else if (step1Data.data && typeof step1Data.data === "object") {
        cardTypeCode = step1Data.data.cardTypeCode;
      }
    }

    // 如果从步骤1获取到了cardTypeCode，存储到实例变量中
    if (cardTypeCode) {
      console.log("从步骤1获取到cardTypeCode:", cardTypeCode);
      this.currentCardTypeCode = cardTypeCode;
      // 同时更新全局配置以保持向后兼容
      window.CONFIG = window.CONFIG || {};
      window.CONFIG.CARD_TYPE_CODE = cardTypeCode;
      this.statusManager.showStatus(
        `已提取卡类型代码: ${cardTypeCode}`,
        "info"
      );
    } else {
      console.log("步骤1中未找到cardTypeCode，使用默认值");
    }
  }

  /**
   * 提取并存储 activityId。
   * @param {Object} result - 完整流程结果
   * @returns {void}
   */
  extractAndStoreActivityId(result) {
    let activityId = null;
    const step1Data = result.step1_decrypt_data;

    if (step1Data && step1Data.data) {
      if (typeof step1Data.data === "string") {
        try {
          const parsedData = JSON.parse(step1Data.data);
          activityId = parsedData.activityId;
        } catch (e) {
          console.warn("解析步骤1数据中的activityId失败:", e.message);
        }
      } else if (step1Data.data && typeof step1Data.data === "object") {
        activityId = step1Data.data.activityId;
      }
    }

    // 如果从步骤1获取到了activityId，存储到实例变量中
    if (activityId) {
      console.log("从步骤1获取到activityId:", activityId);
      this.currentActivityId = activityId;
      this.statusManager.showStatus(`已提取活动ID: ${activityId}`, "info");
    } else {
      console.log("步骤1中未找到activityId");
    }
  }

  /**
   * 提取订单用户名并写入输入框。
   * @param {Object} result - 完整流程结果
   * @param {HTMLInputElement} orderUserNameInput - 订单用户名输入框
   * @returns {void}
   */
  extractOrderUserName(result, orderUserNameInput) {
    let orderUserName = null;
    const orderData = result.step3_orderId;

    console.log("extractOrderUserName 调试信息:");
    console.log("orderData:", orderData);
    console.log("传入的orderUserNameInput元素:", orderUserNameInput);

    if (orderData && orderData.data) {
      console.log("orderData.data:", orderData.data);
      if (typeof orderData.data === "string") {
        try {
          const parsedData = JSON.parse(orderData.data);
          orderUserName = parsedData.userName;
          console.log("从字符串解析得到的userName:", orderUserName);
        } catch (e) {
          console.warn("解析订单数据中的userName失败:", e.message);
        }
      } else if (orderData.data && typeof orderData.data === "object") {
        orderUserName = orderData.data.userName;
        console.log("从对象直接获取的userName:", orderUserName);
      }
    }

    // 如果步骤三没有userName，尝试从步骤五的优惠券数据中获取
    if (!orderUserName) {
      const couponData = result.step5_coupon;
      console.log("尝试从优惠券数据获取userName:", couponData);
      if (couponData && couponData.data && couponData.data.userName) {
        orderUserName = couponData.data.userName;
        console.log("从优惠券数据获取的userName:", orderUserName);
      }
    }

    // 直接获取元素，优先使用orderUserNameInputQR（二维码标签页）
    let orderUserNameInputElement = document.getElementById(
      "orderUserNameInputQR"
    );
    if (!orderUserNameInputElement) {
      // 如果二维码标签页的元素不存在，尝试获取链接解析标签页的元素
      orderUserNameInputElement = document.getElementById("orderUserNameInput");
    }
    console.log(
      "直接获取的orderUserNameInputElement元素:",
      orderUserNameInputElement
    );

    // 设置订单用户名到输入框
    if (orderUserName && orderUserNameInputElement) {
      console.log("自动提取的订单用户名:", orderUserName);
      orderUserNameInputElement.value = orderUserName;
      this.statusManager.showStatus(
        `已自动设置订单用户名: ${orderUserName}`,
        "info"
      );
    } else {
      console.log("未找到订单用户名或元素，订单数据:", orderData);
      console.log("优惠券数据:", result.step5_coupon);
      console.log(
        "orderUserNameInputElement元素存在:",
        !!orderUserNameInputElement
      );
      console.log("orderUserName存在:", !!orderUserName);
    }
  }

  /**
   * 检查流程中是否有错误。
   * @param {Object} result - 完整流程结果
   * @returns {boolean} 是否存在错误
   */
  checkFlowErrors(result) {
    const errors = [];

    // 检查步骤1: 解密data参数
    if (!result.step1_decrypt_data || result.step1_decrypt_data.error) {
      errors.push("步骤1: 解密data参数失败");
    }

    // 检查步骤2: 获取custNo
    if (!result.step2_custNo || result.step2_custNo.error) {
      errors.push("步骤2: 获取custNo失败");
    }

    // 检查步骤3: 获取orderId
    if (!result.step3_orderId || result.step3_orderId.error) {
      errors.push("步骤3: 获取orderId失败");
    }

    // 检查步骤4: 获取orderNo
    if (!result.step4_orderNo || result.step4_orderNo.error) {
      errors.push("步骤4: 获取orderNo失败");
    } else if (!result.step4_orderNo.orderNo) {
      errors.push("步骤4: orderNo为空");
    }

    // 检查步骤5: 获取优惠券
    if (!result.step5_coupon || result.step5_coupon.error) {
      errors.push("步骤5: 获取优惠券失败");
    } else if (!result.step5_coupon.data) {
      errors.push("步骤5: 优惠券数据为空");
    } else if (
      !result.step5_coupon.data.couponCode &&
      !result.step5_coupon.data.couponNum
    ) {
      errors.push("步骤5: 未获取到优惠券代码");
    }

    if (errors.length > 0) {
      console.log("流程检查发现错误:", errors);
      return true;
    }

    return false;
  }

  /**
   * 处理优惠券与二维码展示。
   * @param {Object} result - 完整流程结果
   * @returns {Promise<void>}
   */
  async handleCouponAndQRCode(result) {
    const couponData = result.step5_coupon;
    console.log("优惠券数据:", couponData);

    // 检查各个步骤是否有错误
    const hasErrors = this.checkFlowErrors(result);

    if (hasErrors) {
      this.statusManager.showStatus(
        `完整流程执行失败！存在错误，请检查各步骤结果`,
        "error"
      );
      return;
    }

    if (
      couponData &&
      couponData.data &&
      (couponData.data.couponCode || couponData.data.couponNum)
    ) {
      const code = couponData.data.couponCode || couponData.data.couponNum;
      console.log("优惠券代码:", code);

      // 检查QRCode库是否可用
      if (typeof QRCode === "undefined") {
        console.error("QRCode库未加载");
        this.statusManager.showStatus(
          `完整流程执行成功！orderNo: ${JSON.stringify(
            result.step4_orderNo
          )}，优惠券代码: ${code}，但QRCode库未加载`,
          "warning"
        );
        return;
      }

      // 生成二维码（链接解析标签页）
      await this.qrCodeManager.generateQRCode(String(code), 30);

      // 同时在二维码标签页生成二维码
      this.qrCodeManager.setElements(
        "qrcodeTab",
        "countdownTab",
        "codeTextTab"
      );
      await this.qrCodeManager.generateQRCode(String(code), 30);

      this.statusManager.showStatus(
        `完整流程执行成功！orderNo: ${JSON.stringify(
          result.step4_orderNo
        )}，couponNum: ${code}`,
        "success"
      );
    } else {
      console.log("未找到优惠券代码，优惠券数据:", couponData);
      this.statusManager.showStatus(
        `完整流程执行失败！orderNo: ${JSON.stringify(
          result.step4_orderNo
        )}，未获取到优惠券代码`,
        "error"
      );
    }
  }

  /**
   * 处理完整流程错误展示。
   * @param {Error} error - 异常对象
   * @param {HTMLElement} outStep1 - 步骤1输出
   * @param {HTMLElement} outStep2 - 步骤2输出
   * @param {HTMLElement} outStep3 - 步骤3输出
   * @param {HTMLElement} outStep4 - 步骤4输出
   * @param {HTMLElement} outStep5 - 步骤5输出
   * @returns {void}
   */
  handleFullFlowError(error, outStep1, outStep2, outStep3, outStep4, outStep5) {
    const errorMsg =
      "流程失败: " + (error && error.message ? error.message : error);
    [outStep1, outStep2, outStep3, outStep4, outStep5].forEach((el) => {
      if (el) el.textContent = errorMsg;
    });
    this.statusManager.showStatus(
      "完整流程执行失败: " + error.message,
      "error"
    );
  }

  /**
   * 处理创建订单（链接解析标签页）。
   * @returns {Promise<void>}
   */
  async handleCreateOrder() {
    const phoneNo = document.getElementById("createPhoneNo")?.value?.trim();
    const name = document.getElementById("createName")?.value?.trim();
    let loungeCode = document.getElementById("createLoungeCode")?.value?.trim();
    const accompanierNumber =
      document.getElementById("createAccompanierNumber")?.value || "0";

    // 如果隐藏字段中没有贵宾厅代码，尝试从输入框中提取
    if (!loungeCode) {
      const searchInput = document
        .getElementById("loungeSearchInput")
        ?.value?.trim();
      if (searchInput) {
        // 尝试从输入框中提取贵宾厅代码
        // 格式可能是 "贵宾厅名称 (代码)" 或直接是代码
        const match = searchInput.match(/\(([^)]+)\)$/);
        if (match) {
          // 如果匹配到 "名称 (代码)" 格式，提取代码
          loungeCode = match[1];
        } else {
          // 否则直接使用输入的值作为代码
          loungeCode = searchInput;
        }
        console.log(`从输入框提取贵宾厅代码: ${loungeCode}`);
      }
    }

    // 验证必需参数
    if (!phoneNo || !name || !loungeCode) {
      this.statusManager.showCreateOrderStatus(
        "请填写手机号码、姓名和贵宾厅代码",
        "error"
      );
      return;
    }

    // 检查是否有从链接解析得到的data参数
    if (!this.currentData) {
      this.statusManager.showCreateOrderStatus(
        "请先通过链接解析获取 data 参数",
        "error"
      );
      return;
    }

    try {
      this.statusManager.showCreateOrderStatus("正在创建订单...", "info");

      const orderData = {
        phoneNo,
        name,
        loungeCode,
        accompanierNumber,
        data: this.currentData, // 使用从链接解析得到的data参数
      };

      // 如果当前有从链接解析得到的activityId，则使用它
      if (this.currentActivityId) {
        orderData.activityId = this.currentActivityId;
        console.log("使用从链接解析得到的activityId:", this.currentActivityId);
      }

      // 如果当前有从链接解析得到的cardTypeCode，则使用它
      if (this.currentCardTypeCode) {
        orderData.bespeakCardType = this.currentCardTypeCode;
        console.log(
          "使用从链接解析得到的cardTypeCode:",
          this.currentCardTypeCode
        );
      }

      const resp = await this.apiService.createOrder(orderData);

      if (resp.ok) {
        const result = resp.result;
        this.displayCreateOrderResult(result);
      } else {
        throw new Error(resp.error || "创建订单失败");
      }
    } catch (e) {
      this.handleCreateOrderError(e);
    }
  }

  /**
   * 存储从一键运行流程中获取的订单数据
   */
  /**
   * 从完整流程结果中缓存订单数据。
   * @param {Object} result - 完整流程结果
   * @returns {void}
   */
  storeOrdersFromFlow(result) {
    try {
      // 从步骤2的结果中提取订单数据
      const step2Data = result.step2_custNo;
      if (step2Data && step2Data.data && Array.isArray(step2Data.data)) {
        this.cachedOrders = step2Data.data;
        console.log("✅ 已存储订单数据:", this.cachedOrders.length, "个订单");
        console.log("订单数据详情:", this.cachedOrders);

        // 自动填充查询订单的手机号码
        this.autoFillQueryPhoneNumber(result);

        // 如果当前在查询订单标签页，自动显示订单
        this.autoDisplayCachedOrders();
      } else {
        console.log("⚠️ 步骤2中未找到有效的订单数据");
        console.log("步骤2数据结构:", step2Data);
      }
    } catch (error) {
      console.error("存储订单数据失败:", error);
    }
  }

  /**
   * 自动填充查询订单的手机号码。
   * @param {Object} result - 完整流程结果
   * @returns {void}
   */
  autoFillQueryPhoneNumber(result) {
    try {
      // 从步骤1的结果中提取手机号码
      const step1Data = result.step1_decryptedData;
      if (step1Data && step1Data.phone) {
        const queryPhoneInput = document.getElementById("queryPhoneNo");
        if (queryPhoneInput && !queryPhoneInput.value) {
          queryPhoneInput.value = step1Data.phone;
          console.log("✅ 已自动填充查询订单手机号码:", step1Data.phone);
        }
      }
    } catch (error) {
      console.error("自动填充手机号码失败:", error);
    }
  }

  /**
   * 自动显示缓存的订单数据。
   * @returns {void}
   */
  autoDisplayCachedOrders() {
    // 检查当前是否在查询订单标签页
    const queryTab = document.getElementById("tab-query");
    if (queryTab && queryTab.classList.contains("active")) {
      if (this.cachedOrders && this.cachedOrders.length > 0) {
        this.displayOrders(this.cachedOrders);
        this.statusManager.showQueryStatus(
          `已显示缓存的订单数据，共 ${this.cachedOrders.length} 个订单`,
          "success"
        );
      }
    }
  }

  /**
   * 处理查询订单（查询订单标签页）。
   * @returns {Promise<void>}
   */
  async handleQueryOrders() {
    // 查询订单模块只显示从链接解析获取的订单数据，不调用API
    if (this.cachedOrders && this.cachedOrders.length > 0) {
      console.log("显示缓存的订单数据");
      this.displayOrders(this.cachedOrders);
      this.statusManager.showQueryStatus(
        `显示订单数据，共 ${this.cachedOrders.length} 个订单`,
        "success"
      );
    } else {
      console.log("没有缓存的订单数据");
      this.displayOrders([]);
      this.statusManager.showQueryStatus(
        "暂无订单数据，请先执行链接解析获取订单信息",
        "warning"
      );
    }
  }

  /**
   * 渲染订单列表。
   * @param {Array<Object>} orders - 订单数组
   * @returns {void}
   */
  displayOrders(orders) {
    const orderList = document.getElementById("orderList");
    const orderCount = document.getElementById("orderCount");

    if (!orderList || !orderCount) return;

    // 更新订单数量
    orderCount.textContent = `共 ${orders.length} 个订单`;

    if (orders.length === 0) {
      orderList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <div class="empty-text">暂无订单数据</div>
          <div class="empty-desc">请检查手机号码或稍后再试</div>
        </div>
      `;
      return;
    }

    // 渲染订单列表
    orderList.innerHTML = orders
      .map((order) => this.renderOrderItem(order))
      .join("");
  }

  /**
   * 渲染单个订单项。
   * @param {Object} order - 订单对象
   * @returns {string} 订单 HTML 片段
   */
  renderOrderItem(order) {
    const statusClass = this.getOrderStatusClass(order.status);
    const statusText = this.getOrderStatusText(order.status);

    // 调试输出订单数据结构
    console.log("渲染订单项:", order);

    return `
      <div class="order-item">
        <div class="order-header">
          <div class="order-id">订单号: ${
            order.orderId || order.orderNo || order.id || "未知"
          }</div>
          <div class="order-status ${statusClass}">${statusText}</div>
        </div>
        <div class="order-details">
          <div class="order-detail-item">
            <div class="order-detail-label">贵宾厅代码</div>
            <div class="order-detail-value">${
              order.loungeCode || order.lounge_code || "未知"
            }</div>
          </div>
          <div class="order-detail-item">
            <div class="order-detail-label">贵宾厅名称</div>
            <div class="order-detail-value">${
              order.loungeName || order.lounge_name || order.name || "未知"
            }</div>
          </div>
          <div class="order-detail-item">
            <div class="order-detail-label">预约时间</div>
            <div class="order-detail-value">${
              order.bespeakTime || order.bespeak_time || order.time || "未知"
            }</div>
          </div>
          <div class="order-detail-item">
            <div class="order-detail-label">创建时间</div>
            <div class="order-detail-value">${
              order.createTime ||
              order.create_time ||
              order.created_at ||
              "未知"
            }</div>
          </div>
        </div>
        <div class="order-actions">
          <button 
            class="btn-cancel" 
            onclick="app.cancelOrder('${
              order.orderId || order.orderNo || order.id
            }')"
            ${
              order.status === "CANCELLED" ||
              order.status === "COMPLETED" ||
              order.status === "cancelled" ||
              order.status === "completed"
                ? "disabled"
                : ""
            }
          >
            ${
              order.status === "CANCELLED" || order.status === "cancelled"
                ? "已取消"
                : order.status === "COMPLETED" || order.status === "completed"
                ? "已完成"
                : "取消订单"
            }
          </button>
        </div>
      </div>
    `;
  }

  /**
   * 获取订单状态样式类。
   * @param {string} status - 订单状态
   * @returns {string} 状态样式类
   */
  getOrderStatusClass(status) {
    switch (status) {
      case "ACTIVE":
      case "PENDING":
        return "active";
      case "CANCELLED":
        return "cancelled";
      case "COMPLETED":
        return "completed";
      default:
        return "active";
    }
  }

  /**
   * 获取订单状态文本。
   * @param {string} status - 订单状态
   * @returns {string} 状态文本
   */
  getOrderStatusText(status) {
    switch (status) {
      case "ACTIVE":
        return "进行中";
      case "PENDING":
        return "待处理";
      case "CANCELLED":
        return "已取消";
      case "COMPLETED":
        return "已完成";
      default:
        return "未知";
    }
  }

  /**
   * 取消订单。
   * @param {string} orderId - 订单号
   * @returns {Promise<void>}
   */
  async cancelOrder(orderId) {
    if (!orderId) {
      this.statusManager.showQueryStatus("订单ID不能为空", "error");
      return;
    }

    const phoneNo = document.getElementById("queryPhoneNo")?.value?.trim();
    if (!phoneNo) {
      this.statusManager.showQueryStatus("手机号码不能为空", "error");
      return;
    }

    if (!confirm("确定要取消这个订单吗？")) {
      return;
    }

    try {
      this.statusManager.showQueryStatus("正在取消订单...", "info");

      const cancelData = {
        orderId,
        phoneNo,
      };

      const response = await this.apiService.cancelOrder(cancelData);

      if (response.ok && response.result.success) {
        this.statusManager.showQueryStatus("订单取消成功", "success");
        // 重新查询订单列表
        setTimeout(() => {
          this.handleQueryOrders();
        }, 1000);
      } else {
        this.statusManager.showQueryStatus(
          `取消失败: ${response.result.message || response.error}`,
          "error"
        );
      }
    } catch (error) {
      console.error("取消订单失败:", error);
      this.statusManager.showQueryStatus(`取消失败: ${error.message}`, "error");
    }
  }

  /**
   * 处理创建订单（创建订单标签页）。
   * @returns {Promise<void>}
   */
  async handleCreateOrderTab() {
    const phoneNo = document
      .getElementById("createPhoneNoOrder")
      ?.value?.trim();
    const name = document.getElementById("createNameOrder")?.value?.trim();
    let loungeCode = document
      .getElementById("createLoungeCodeOrder")
      ?.value?.trim();
    const accompanierNumber =
      document.getElementById("createAccompanierNumberOrder")?.value || "0";

    // 如果隐藏字段中没有贵宾厅代码，尝试从输入框中提取
    if (!loungeCode) {
      const searchInput = document
        .getElementById("loungeSearchInputOrder")
        ?.value?.trim();
      if (searchInput) {
        // 尝试从输入框中提取贵宾厅代码
        // 格式可能是 "贵宾厅名称 (代码)" 或直接是代码
        const match = searchInput.match(/\(([^)]+)\)$/);
        if (match) {
          // 如果匹配到 "名称 (代码)" 格式，提取代码
          loungeCode = match[1];
        } else {
          // 否则直接使用输入的值作为代码
          loungeCode = searchInput;
        }
        console.log(`从输入框提取贵宾厅代码: ${loungeCode}`);
      }
    }

    // 验证必需参数
    if (!phoneNo || !name || !loungeCode) {
      this.statusManager.showCreateOrderStatusTab(
        "请填写手机号码、姓名和贵宾厅代码",
        "error"
      );
      return;
    }

    try {
      this.statusManager.showCreateOrderStatusTab(
        "正在获取用户信息...",
        "info"
      );

      // 先获取用户信息
      let userInfo = null;
      try {
        const userInfoResp = await this.apiService.getUserInfo(
          this.currentCardTypeCode || window.CONFIG?.CARD_TYPE_CODE,
          this.currentData // 传递当前解析的data参数
        );
        if (userInfoResp.ok) {
          userInfo = userInfoResp.data;
          this.statusManager.showCreateOrderStatusTab(
            "用户信息获取成功，正在创建订单...",
            "info"
          );
        } else {
          console.warn("获取用户信息失败，使用默认参数创建订单");
          this.statusManager.showCreateOrderStatusTab(
            "用户信息获取失败，使用默认参数创建订单...",
            "warning"
          );
        }
      } catch (userInfoError) {
        console.warn("获取用户信息失败:", userInfoError);
        this.statusManager.showCreateOrderStatusTab(
          "用户信息获取失败，使用默认参数创建订单...",
          "warning"
        );
      }

      // 创建订单（如果当前有data参数则使用，否则让后端自动获取用户信息）
      const orderData = {
        phoneNo,
        name,
        loungeCode,
        accompanierNumber,
      };

      // 如果当前有从链接解析得到的data参数，则使用它
      if (this.currentData) {
        orderData.data = this.currentData;
        orderData.autoGetUserInfo = false; // 不需要自动获取用户信息
      } else {
        orderData.autoGetUserInfo = true; // 启用自动获取用户信息
      }

      // 如果当前有从链接解析得到的activityId，则使用它
      if (this.currentActivityId) {
        orderData.activityId = this.currentActivityId;
        console.log("使用从链接解析得到的activityId:", this.currentActivityId);
      }

      // 如果当前有从链接解析得到的cardTypeCode，则使用它
      if (this.currentCardTypeCode) {
        orderData.bespeakCardType = this.currentCardTypeCode;
        console.log(
          "使用从链接解析得到的cardTypeCode:",
          this.currentCardTypeCode
        );
      }

      const resp = await this.apiService.createOrder(orderData);

      if (resp.ok) {
        const result = resp.result;
        // 在结果中显示用户信息
        if (resp.userInfo) {
          result.userInfo = resp.userInfo;
          result.usedAutoData = resp.usedAutoData;
        }
        this.displayCreateOrderResultTab(result);
      } else {
        throw new Error(resp.error || "创建订单失败");
      }
    } catch (e) {
      this.handleCreateOrderErrorTab(e);
    }
  }

  /**
   * 显示创建订单结果。
   * @param {Object} result - 创建订单结果
   * @returns {void}
   */
  displayCreateOrderResult(result) {
    const createOrderResult = document.getElementById("createOrderResult");
    const createOrderOutput = document.getElementById("createOrderOutput");

    if (createOrderResult) createOrderResult.style.display = "block";
    if (createOrderOutput)
      createOrderOutput.textContent = JSON.stringify(result, null, 2);

    if (result.success) {
      this.statusManager.showCreateOrderStatus("订单创建成功！", "success");

      // 如果成功，显示订单详情
      if (result.orderData) {
        const orderData = result.orderData;
        let orderInfo = `订单创建成功！\n\n`;

        // 显示用户信息（如果可用）
        if (result.userInfo) {
          orderInfo += `用户信息：\n`;
          orderInfo += `用户名: ${result.userInfo.userName || "未知"}\n`;
          orderInfo += `手机号: ${result.userInfo.phone || "未知"}\n`;
          orderInfo += `卡类型: ${result.userInfo.cardTypeCode || "未知"}\n\n`;
        }

        // 显示是否使用了自动获取的数据
        if (result.usedAutoData) {
          orderInfo += `✅ 使用了自动获取的用户数据\n\n`;
        }

        orderInfo += `订单详情：\n`;
        orderInfo += `订单号: ${orderData.orderNo}\n`;
        orderInfo += `贵宾厅: ${orderData.loungeName}\n`;
        orderInfo += `地点: ${orderData.siteName} - ${orderData.terminalName}\n`;
        orderInfo += `预约人: ${orderData.name}\n`;
        orderInfo += `手机号: ${orderData.phoneNo}\n`;
        orderInfo += `预约时间: ${orderData.bespeakDate} ${orderData.bespeakTime}\n`;
        orderInfo += `状态: ${orderData.orderStatus}\n`;

        // 显示其他有用信息
        if (orderData.h5OrderNo)
          orderInfo += `H5订单号: ${orderData.h5OrderNo}\n`;
        if (orderData.couponCode)
          orderInfo += `优惠券代码: ${orderData.couponCode}\n`;
        if (orderData.commCode)
          orderInfo += `通信代码: ${orderData.commCode}\n`;
        if (orderData.redirectUrl)
          orderInfo += `重定向URL: ${orderData.redirectUrl}\n`;
        if (orderData.directUrl)
          orderInfo += `直接URL: ${orderData.directUrl}\n`;

        if (orderData.qrCode) orderInfo += `二维码: ${orderData.qrCode}\n`;
        if (orderData.verificationCode)
          orderInfo += `验证码: ${orderData.verificationCode}\n`;

        this.statusManager.showCreateOrderStatus(orderInfo, "success");
      }
    } else {
      this.statusManager.showCreateOrderStatus(
        `订单创建失败: ${result.message}`,
        "error"
      );
    }
  }

  /**
   * 处理创建订单错误。
   * @param {Error} error - 异常对象
   * @returns {void}
   */
  handleCreateOrderError(error) {
    const createOrderResult = document.getElementById("createOrderResult");
    const createOrderOutput = document.getElementById("createOrderOutput");

    if (createOrderResult) createOrderResult.style.display = "block";
    if (createOrderOutput) {
      createOrderOutput.textContent =
        "创建订单失败: " + (error && error.message ? error.message : error);
    }
    this.statusManager.showCreateOrderStatus(
      "创建订单失败: " + error.message,
      "error"
    );
  }

  /**
   * 显示创建订单结果（创建订单标签页）。
   * @param {Object} result - 创建订单结果
   * @returns {void}
   */
  displayCreateOrderResultTab(result) {
    const createOrderResult = document.getElementById("createOrderResultTab");
    const createOrderOutput = document.getElementById("createOrderOutputTab");

    if (createOrderResult) createOrderResult.style.display = "block";
    if (createOrderOutput)
      createOrderOutput.textContent = JSON.stringify(result, null, 2);

    if (result.success) {
      this.statusManager.showCreateOrderStatusTab("订单创建成功！", "success");

      // 如果成功，显示订单详情
      if (result.orderData) {
        const orderData = result.orderData;
        let orderInfo = `订单创建成功！\n\n`;

        // 显示用户信息（如果可用）
        if (result.userInfo) {
          orderInfo += `用户信息：\n`;
          orderInfo += `用户名: ${result.userInfo.userName || "未知"}\n`;
          orderInfo += `手机号: ${result.userInfo.phone || "未知"}\n`;
          orderInfo += `卡类型: ${result.userInfo.cardTypeCode || "未知"}\n\n`;
        }

        // 显示是否使用了自动获取的数据
        if (result.usedAutoData) {
          orderInfo += `✅ 使用了自动获取的用户数据\n\n`;
        }

        orderInfo += `订单详情：\n`;
        orderInfo += `订单号: ${orderData.orderNo}\n`;
        orderInfo += `贵宾厅: ${orderData.loungeName}\n`;
        orderInfo += `地点: ${orderData.siteName} - ${orderData.terminalName}\n`;
        orderInfo += `预约人: ${orderData.name}\n`;
        orderInfo += `手机号: ${orderData.phoneNo}\n`;
        orderInfo += `预约时间: ${orderData.bespeakDate} ${orderData.bespeakTime}\n`;
        orderInfo += `状态: ${orderData.orderStatus}\n`;

        // 显示其他有用信息
        if (orderData.h5OrderNo)
          orderInfo += `H5订单号: ${orderData.h5OrderNo}\n`;
        if (orderData.couponCode)
          orderInfo += `优惠券代码: ${orderData.couponCode}\n`;
        if (orderData.commCode)
          orderInfo += `通信代码: ${orderData.commCode}\n`;
        if (orderData.redirectUrl)
          orderInfo += `重定向URL: ${orderData.redirectUrl}\n`;
        if (orderData.directUrl)
          orderInfo += `直接URL: ${orderData.directUrl}\n`;

        if (orderData.qrCode) orderInfo += `二维码: ${orderData.qrCode}\n`;
        if (orderData.verificationCode)
          orderInfo += `验证码: ${orderData.verificationCode}\n`;

        this.statusManager.showCreateOrderStatusTab(orderInfo, "success");
      }
    } else {
      this.statusManager.showCreateOrderStatusTab(
        `订单创建失败: ${result.message}`,
        "error"
      );
    }
  }

  /**
   * 处理创建订单错误（创建订单标签页）。
   * @param {Error} error - 异常对象
   * @returns {void}
   */
  handleCreateOrderErrorTab(error) {
    const createOrderResult = document.getElementById("createOrderResultTab");
    const createOrderOutput = document.getElementById("createOrderOutputTab");

    if (createOrderResult) createOrderResult.style.display = "block";
    if (createOrderOutput) {
      createOrderOutput.textContent =
        "创建订单失败: " + (error && error.message ? error.message : error);
    }
    this.statusManager.showCreateOrderStatusTab(
      "创建订单失败: " + error.message,
      "error"
    );
  }

  /**
   * 处理生成专属链接（链接解析标签页）。
   * @returns {Promise<void>}
   */
  async handleGenerateLink() {
    const userNameInput = document.getElementById("userNameInput");
    const typeSelect = document.getElementById("typeSelect");
    const orderUserNameInput = document.getElementById("orderUserNameInput");
    const btnGenerateLink = document.getElementById("btn-generate-link");

    if (!userNameInput || !typeSelect || !btnGenerateLink) return;

    const userName = userNameInput.value.trim();
    if (!userName) {
      this.statusManager.showStatus("请输入用户姓名", "error");
      return;
    }

    try {
      this.statusManager.showStatus("正在生成专属链接...", "info");

      // 生成专属链接，包含用户名参数
      const baseUrl = window.location.origin;
      const selectedType = typeSelect.value;
      let customUrl = `${baseUrl}/custom-page?name=${encodeURIComponent(
        userName
      )}&type=${selectedType}`;

      // 如果存在订单用户名，也添加到链接中
      let orderUserName = orderUserNameInput
        ? orderUserNameInput.value.trim()
        : null;

      // 如果链接解析标签页的订单用户名为空，尝试从二维码标签页获取
      if (!orderUserName) {
        const orderUserNameFromQR = document.getElementById(
          "orderUserNameInputQR"
        );
        if (orderUserNameFromQR && orderUserNameFromQR.value.trim()) {
          orderUserName = orderUserNameFromQR.value.trim();
          console.log("从二维码标签页获取订单用户名:", orderUserName);
        }
      }

      console.log("生成链接调试信息 (链接解析标签页):");
      console.log("userName:", userName);
      console.log("orderUserName:", orderUserName);
      console.log("orderUserNameInput元素:", orderUserNameInput);
      console.log(
        "orderUserNameInput.value:",
        orderUserNameInput ? orderUserNameInput.value : "元素不存在"
      );

      if (orderUserName && orderUserName !== userName) {
        customUrl += `&orderUserName=${encodeURIComponent(orderUserName)}`;
        console.log("添加了orderUserName参数到链接");
      } else {
        console.log(
          "未添加orderUserName参数，原因:",
          !orderUserName ? "orderUserName为空" : "orderUserName与userName相同"
        );
      }

      // 显示生成的链接
      this.statusManager.showStatus(`专属链接已生成: ${customUrl}`, "success");

      // 将链接复制到剪贴板
      try {
        await navigator.clipboard.writeText(customUrl);
        this.statusManager.showStatus(
          `专属链接已生成并复制到剪贴板: ${customUrl}`,
          "success"
        );
      } catch (e) {
        console.log("剪贴板复制失败，但链接已生成");
      }

      // 在页面上显示链接
      this.displayGeneratedLink(customUrl, btnGenerateLink);
    } catch (e) {
      this.statusManager.showStatus("生成链接失败: " + e.message, "error");
    }
  }

  /**
   * 处理生成专属链接（二维码标签页）。
   * @returns {Promise<void>}
   */
  async handleGenerateLinkTab() {
    const userNameInput = document.getElementById("userNameInputQR");
    const typeSelect = document.getElementById("typeSelectQR");
    const orderUserNameInput = document.getElementById("orderUserNameInputQR");
    const btnGenerateLink = document.getElementById("btn-generate-link-tab");

    if (!userNameInput || !typeSelect || !btnGenerateLink) return;

    const userName = userNameInput.value.trim();
    if (!userName) {
      this.statusManager.showStatus("请输入用户姓名", "error");
      return;
    }

    try {
      this.statusManager.showStatus("正在生成专属链接...", "info");

      // 生成专属链接，包含用户名参数
      const baseUrl = window.location.origin;
      const selectedType = typeSelect.value;
      let customUrl = `${baseUrl}/custom-page?name=${encodeURIComponent(
        userName
      )}&type=${selectedType}`;

      // 如果存在订单用户名，也添加到链接中
      let orderUserName = orderUserNameInput
        ? orderUserNameInput.value.trim()
        : null;

      // 如果二维码标签页的订单用户名为空，尝试从链接解析标签页获取
      if (!orderUserName) {
        const orderUserNameFromDecrypt =
          document.getElementById("orderUserNameInput");
        if (orderUserNameFromDecrypt && orderUserNameFromDecrypt.value.trim()) {
          orderUserName = orderUserNameFromDecrypt.value.trim();
          console.log("从链接解析标签页获取订单用户名:", orderUserName);
        }
      }

      console.log("生成链接调试信息 (二维码标签页):");
      console.log("userName:", userName);
      console.log("orderUserName:", orderUserName);
      console.log("orderUserNameInput元素:", orderUserNameInput);
      console.log(
        "orderUserNameInput.value:",
        orderUserNameInput ? orderUserNameInput.value : "元素不存在"
      );

      if (orderUserName && orderUserName !== userName) {
        customUrl += `&orderUserName=${encodeURIComponent(orderUserName)}`;
        console.log("添加了orderUserName参数到链接");
      } else {
        console.log(
          "未添加orderUserName参数，原因:",
          !orderUserName ? "orderUserName为空" : "orderUserName与userName相同"
        );
      }

      // 显示生成的链接
      this.statusManager.showStatus(`专属链接已生成: ${customUrl}`, "success");

      // 将链接复制到剪贴板
      try {
        await navigator.clipboard.writeText(customUrl);
        this.statusManager.showStatus(
          `专属链接已生成并复制到剪贴板: ${customUrl}`,
          "success"
        );
      } catch (e) {
        console.log("剪贴板复制失败，但链接已生成");
      }

      // 在页面上显示链接
      this.displayGeneratedLink(customUrl, btnGenerateLink);
    } catch (e) {
      this.statusManager.showStatus("生成链接失败: " + e.message, "error");
    }
  }

  /**
   * 显示生成的链接。
   * @param {string} customUrl - 生成的链接
   * @param {HTMLElement} btnGenerateLink - 触发按钮
   * @returns {void}
   */
  displayGeneratedLink(customUrl, btnGenerateLink) {
    const linkDisplay = document.createElement("div");
    linkDisplay.style.cssText = `
      margin-top: 12px;
      padding: 10px;
      background: #0f1628;
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 10px;
      word-break: break-all;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 12px;
      color: #67a8ff;
    `;
    linkDisplay.innerHTML = `
      <div style="color: #a6c1ff; margin-bottom: 5px;">专属链接:</div>
      <a href="${customUrl}" target="_blank" style="color: #67a8ff; text-decoration: none;">${customUrl}</a>
    `;

    // 移除之前的链接显示
    const existingLink = document.getElementById("generated-link");
    if (existingLink) {
      existingLink.remove();
    }

    linkDisplay.id = "generated-link";
    btnGenerateLink.parentNode.insertBefore(
      linkDisplay,
      btnGenerateLink.nextSibling
    );
  }

  /**
   * 设置示例链接。
   * @returns {void}
   */
  setExampleUrl() {
    const urlInput = document.getElementById("urlInput");
    if (urlInput) {
      urlInput.value =
        "https://h5.schengle.com/ShengDaHXZHJSJ/#/airTrainVIP/hxVipHall?data=JnLbTvXqXZX7WUzS1tnXMKuminY68JHvRHTc2yZK7NM%2BqaPw8YUhjIEXmz0wDd0RKSy6jMIKi4GtbWeg9IkSqWLP5%2B%2FxM3p2r2DB0knRDhR58VkvxnDAxodhjhIk1LglxUv0CeHDketCXdSeKrSfD1voXgUtj56YLzezJjV1tV6LRccdCCimo1EyYL3gJ6VliIcH17ljlQ5Piy0IrG9Eoq7KlNd18AFWqGoN62Z2jYJsvf19UHnDz3%2Bfj3T68Pc%2FwphkTTrNCu0FBQLXNxDkgALA4PdjewMhvfmWJ9zACYzUE8E0JqIl7DViUOdU83xw11qxVqnij%2FK0tRwGP737Dg%3D%3D";
    }
  }
}

// 初始化应用
window.app = new App();
