const cfg = require("../core/config");
const { normalizeDataField } = require("../utils/parse");
const { decryptUrlData } = require("./userService");
const { fetchCouponByOrderNo } = require("./couponService");
const { postEncryptedAndDecrypt } = require("./remoteApi");

async function runFullFlow({ data, db }) {
  const results = {
    step1_decrypt_data: null,
    step2_custNo: null,
    step3_orderId: null,
    step4_orderNo: null,
    step5_coupon: null,
  };

  const decryptedData = await decryptUrlData(data, cfg.ACTIVITY_ID);
  results.step1_decrypt_data = decryptedData;

  let custNo = null;
  if (decryptedData && decryptedData.data) {
    const parsed = normalizeDataField(decryptedData.data);
    if (parsed && typeof parsed === "object") {
      custNo = parsed.custNo;
    }
  }

  if (!custNo) {
    return {
      ok: false,
      error: "无法从解密数据中获取custNo",
    };
  }

  const decryptedCustNo = await postEncryptedAndDecrypt(
    cfg.API_ENDPOINTS.BESPEAK_LIST,
    { custNo: custNo, sdTimestamp: Date.now(), status: "1" },
    { timeout: cfg.TIMEOUT.COUPON_REQUEST }
  );
  results.step2_custNo = decryptedCustNo;

  let selectedOrderId = null;
  let decryptedOrderId = null;

  if (
    decryptedCustNo &&
    decryptedCustNo.data &&
    Array.isArray(decryptedCustNo.data) &&
    decryptedCustNo.data.length > 0
  ) {
    selectedOrderId = decryptedCustNo.data[0].orderId;

    try {
      decryptedOrderId = await postEncryptedAndDecrypt(
        cfg.API_ENDPOINTS.ORDER_INFO,
        { orderId: selectedOrderId, sdTimestamp: Date.now() },
        { timeout: cfg.TIMEOUT.COUPON_REQUEST }
      );
    } catch (e) {
      decryptedOrderId = { error: e.message, step: "step3_orderId" };
    }
  } else {
    decryptedOrderId = {
      error: "步骤2没有返回有效的订单列表",
      step: "step3_orderId",
    };
  }

  results.step3_orderId = decryptedOrderId;

  let orderNo = null;
  let step4Result = null;

  if (decryptedOrderId && decryptedOrderId.data && !decryptedOrderId.error) {
    const parsedData = normalizeDataField(decryptedOrderId.data);
    if (parsedData && typeof parsedData === "object") {
      orderNo = parsedData.orderNo || parsedData.orderId;
    }

    if (orderNo) {
      step4Result = { orderNo: orderNo, success: true };
    } else {
      step4Result = {
        error: "无法从订单信息中获取orderNo",
        step: "step4_orderNo",
      };
    }
  } else {
    step4Result = {
      error: decryptedOrderId?.error || "步骤3失败，无法获取orderNo",
      step: "step4_orderNo",
    };
  }

  results.step4_orderNo = step4Result;

  let couponResult = null;
  if (orderNo) {
    try {
      couponResult = await fetchCouponByOrderNo(orderNo);
    } catch (e) {
      couponResult = { error: e.message, step: "step5_coupon" };
    }
  } else {
    couponResult = {
      error: "步骤4失败，无法获取orderNo，跳过优惠券请求",
      step: "step5_coupon",
    };
  }

  results.step5_coupon = couponResult;

  let saveResult = null;
  if (
    couponResult &&
    couponResult.data &&
    decryptedOrderId &&
    decryptedOrderId.data &&
    !decryptedOrderId.error
  ) {
    try {
      const couponData = normalizeDataField(couponResult.data);
      const orderData = normalizeDataField(decryptedOrderId.data);

      const userData = {
        userName: orderData.userName || "未知用户",
        bespeakCardType: couponData.bespeakCardType,
        orderNo: orderNo,
        serverName: orderData.serverName || "机场贵宾厅",
        telephone: orderData.telephone,
        h5OrderId: orderData.h5OrderId,
        activityId: cfg.ACTIVITY_ID,
        h5OrderNo: orderData.h5OrderNo,
        orderTime: orderData.orderTime,
        couponSync: orderData.couponSync,
        loungeCode: orderData.loungeCode,
        rightsRemainPoint: orderData.rightsRemainPoint,
        endTime: orderData.endTime,
        status: orderData.status,
      };

      saveResult = await db.saveUserData(userData);
    } catch (e) {
      saveResult = { error: e.message, step: "step6_save_to_db" };
    }
  } else {
    saveResult = {
      error: "前置步骤失败，无法保存数据到数据库",
      step: "step6_save_to_db",
      details: {
        couponResult: couponResult?.error || "优惠券请求失败",
        orderId: decryptedOrderId?.error || "订单信息获取失败",
      },
    };
  }

  results.step6_save_to_db = saveResult;

  const hasErrors = Object.values(results).some((step) => step?.error);
  const successCount = Object.values(results).filter(
    (step) => step && !step.error
  ).length;
  const totalSteps = Object.keys(results).length;

  return {
    ok: true,
    result: results,
    summary: {
      decryptedData: decryptedData,
      custNo: decryptedCustNo,
      orderId: decryptedOrderId,
      finalOrderNo: orderNo,
      couponResult: couponResult,
      saveResult: saveResult,
    },
    flowStatus: {
      hasErrors: hasErrors,
      successCount: successCount,
      totalSteps: totalSteps,
      successRate: `${successCount}/${totalSteps}`,
      message: hasErrors
        ? `流程执行完成，但有 ${totalSteps - successCount} 个步骤失败`
        : "所有步骤执行成功",
    },
  };
}

module.exports = {
  runFullFlow,
};
