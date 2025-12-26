/**
 * 流程管理模块
 * 处理一键运行完整流程相关的业务逻辑
 */

class FlowManager {
  /**
   * 初始化流程管理器。
   * @param {ApiService} apiService - API 服务实例
   * @param {StatusManager} statusManager - 状态管理实例
   * @param {QRCodeManager} qrCodeManager - 二维码管理实例
   */
  constructor(apiService, statusManager, qrCodeManager) {
    this.apiService = apiService;
    this.statusManager = statusManager;
    this.qrCodeManager = qrCodeManager;
  }

  /**
   * 处理完整流程。
   * @param {string} currentData - 当前 data 参数
   * @param {string} currentSign - 当前 sign 参数
   * @param {OrderManager} orderManager - 订单管理实例
   * @returns {Promise<Object>} 流程输出结果
   */
  async handleFullFlow(currentData, currentSign, orderManager) {
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

      // 自动获取用户信息并填充到创建订单输入框（在URL解析之后）
      try {
        this.statusManager.showStatus("正在获取用户信息...", "info");
        const userInfoResp = await this.apiService.getUserInfo(
          window.CONFIG?.CARD_TYPE_CODE || "HXYX0803",
          params.data // 传递当前解析的data参数
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

      const resp = await this.apiService.fullFlow(params.data, params.sign);

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
      const cardTypeCode = this.extractAndUpdateCardTypeCode(resp.result);

      // 提取并存储 activityId
      const activityId = this.extractAndStoreActivityId(resp.result);

      // 自动提取订单用户名
      this.extractOrderUserName(resp.result, orderUserNameInput);

      // 存储订单数据到查询订单模块
      orderManager.storeOrdersFromFlow(resp.result);

      // 由于extractOrderUserName已经直接设置了orderUserNameInputQR，这里不需要额外同步
      console.log(
        "订单用户名已通过extractOrderUserName方法直接设置到二维码标签页"
      );

      // 处理优惠券和二维码
      await this.handleCouponAndQRCode(resp.result);

      return {
        cardTypeCode,
        activityId,
        data: params.data,
        sign: params.sign,
      };
    } catch (e) {
      this.handleFullFlowError(
        e,
        outStep1,
        outStep2,
        outStep3,
        outStep4,
        outStep5
      );
      throw e;
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
   * @returns {string|null} 卡类型代码
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

    return cardTypeCode;
  }

  /**
   * 提取并存储 activityId。
   * @param {Object} result - 完整流程结果
   * @returns {string|null} 活动 ID
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
      this.statusManager.showStatus(`已提取活动ID: ${activityId}`, "info");
    } else {
      console.log("步骤1中未找到activityId");
    }

    return activityId;
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
}

// 导出流程管理器类
window.FlowManager = FlowManager;
