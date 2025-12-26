const cfg = require("../core/config");
const logger = require("../utils/logger");
const { normalizeDataField } = require("../utils/parse");
const { postEncrypted } = require("./remoteApi");
const { decryptResponse } = require("../core/cryptoUtils");
const { decryptUrlData, fetchUserInfo } = require("./userService");

async function extractActivityIdFromData(data) {
  if (!data) return null;

  let decryptedData = null;
  if (typeof data === "string" && data.length > 100) {
    decryptedData = await decryptUrlData(data, cfg.ACTIVITY_ID);
  } else {
    decryptedData = data;
  }

  if (decryptedData && decryptedData.data) {
    const dataObj = normalizeDataField(decryptedData.data);
    if (dataObj && typeof dataObj === "object") {
      return dataObj.activityId || null;
    }
  }

  return null;
}

async function maybeFetchUserInfo({ autoGetUserInfo, bespeakCardType, data }) {
  if (!autoGetUserInfo) return null;

  try {
    const { userInfo } = await fetchUserInfo({
      cardTypeCode: bespeakCardType,
      data,
    });
    return userInfo || null;
  } catch (e) {
    logger.warn(
      "auto get user info failed",
      e && e.message ? e.message : e
    );
    return null;
  }
}

function buildOrderResult({ decrypted, name, phoneNo }) {
  let orderResult = {
    success: false,
    message: "",
    orderData: null,
    errorCode: null,
    errorDesc: null,
  };

  if (!decrypted) {
    orderResult.success = false;
    orderResult.message = "无法解析响应数据";
    return orderResult;
  }

  if (decrypted.resultCode === "0000" || decrypted.success === "true") {
    orderResult.success = true;
    orderResult.message = "订单创建成功!";

    if (decrypted.data) {
      const orderData = normalizeDataField(decrypted.data);
      if (orderData && typeof orderData === "object") {
        orderResult.orderData = {
          orderNo: orderData.orderNo || "未知",
          loungeName: "未知",
          siteName: "未知",
          terminalName: "未知",
          name: name || "未知",
          phoneNo: phoneNo || "未知",
          bespeakDate: "未知",
          bespeakTime: "",
          orderStatus: "未知",
          qrCode: orderData.qrCode || null,
          verificationCode: orderData.verificationCode || null,
          h5OrderNo: orderData.h5OrderNo || null,
          commCode: orderData.commCode || null,
          couponCode: orderData.couponCode || null,
          redirectUrl: orderData.redirectUrl || null,
          directUrl: orderData.directUrl || null,
        };
      }
    }

    return orderResult;
  }

  orderResult.success = false;
  orderResult.errorCode = decrypted.resultCode || decrypted.errorCode;
  orderResult.errorDesc = decrypted.resultDesc || decrypted.msg || decrypted.message;

  if (orderResult.errorCode === "1001") {
    orderResult.message = "贵宾厅代码无效或不存在";
  } else if (orderResult.errorCode === "1002") {
    orderResult.message = "手机号格式错误";
  } else if (orderResult.errorCode === "1003") {
    orderResult.message = "姓名格式错误";
  } else if (orderResult.errorCode === "2001") {
    orderResult.message = "积分不足";
  } else if (orderResult.errorCode === "Y00067") {
    orderResult.message = "当前有未使用完成的订单，使用完成后可预约下一单！";
  } else {
    orderResult.message = orderResult.errorDesc || "订单创建失败";
  }

  return orderResult;
}

async function createOrder(payload) {
  const {
    activityId,
    bespType = "VIP",
    bespeakCardType = cfg.CARD_TYPE_CODE,
    phoneNo,
    name,
    loungeCode,
    data,
    accompanierNumber = "0",
    sdTimestamp = Date.now(),
    autoGetUserInfo = true,
  } = payload;

  const extractedActivityId =
    activityId || (await extractActivityIdFromData(data)) || cfg.ACTIVITY_ID;

  const userInfo = await maybeFetchUserInfo({
    autoGetUserInfo,
    bespeakCardType,
    data,
  });

  const requestData = {
    activityId: extractedActivityId,
    bespType,
    bespeakCardType,
    phoneNo,
    name,
    loungeCode,
    data,
    accompanierNumber,
    sdTimestamp,
  };

  const rawResponse = await postEncrypted(
    cfg.API_ENDPOINTS.CREATE_ORDER,
    requestData,
    { timeout: cfg.TIMEOUT.COUPON_REQUEST }
  );

  const decrypted =
    rawResponse && rawResponse.sdData ? decryptResponse(rawResponse) : rawResponse;

  const orderResult = buildOrderResult({ decrypted, name, phoneNo });

  return {
    orderResult,
    rawResponse: decrypted,
    userInfo,
  };
}

async function queryOrders(payload) {
  const requestData = {
    cityCode: payload.cityCode,
    continentType: payload.continentType,
    countryCode: payload.countryCode,
    domesticForeign: payload.domesticForeign,
    loungeType: payload.loungeType,
    page: parseInt(payload.page, 10),
    sdTimestamp: Date.now(),
    serviceId: payload.serviceId,
    siteCode: payload.siteCode,
    size: parseInt(payload.size, 10),
  };

  const rawResponse = await postEncrypted(
    cfg.API_ENDPOINTS.QUERY_ORDERS,
    requestData,
    { timeout: cfg.TIMEOUT.COUPON_REQUEST }
  );

  let orders = [];
  if (rawResponse && rawResponse.sdData) {
    const decrypted = decryptResponse(rawResponse);
    if (decrypted && decrypted.resultCode === "0000") {
      orders = decrypted.data || [];
    }
  }

  return { orders, rawResponse };
}

async function cancelOrder({ orderId, sdTimestamp = Date.now() }) {
  const rawResponse = await postEncrypted(
    cfg.API_ENDPOINTS.CANCEL_ORDER,
    { orderId, sdTimestamp },
    { timeout: cfg.TIMEOUT.COUPON_REQUEST }
  );

  let cancelResult = {
    success: false,
    message: "取消订单失败",
  };

  if (rawResponse && rawResponse.sdData) {
    const decrypted = decryptResponse(rawResponse);
    if (decrypted) {
      const isSuccess =
        decrypted.resultCode === "0000" ||
        decrypted.code === "0000" ||
        decrypted.success === true ||
        decrypted.status === "success" ||
        (decrypted.resultDesc && decrypted.resultDesc.includes("成功")) ||
        (decrypted.msg && decrypted.msg.includes("成功"));

      if (isSuccess) {
        cancelResult.success = true;
        cancelResult.message =
          decrypted.resultDesc || decrypted.msg || "订单取消成功";
      } else {
        cancelResult.success = false;
        cancelResult.message =
          decrypted.resultDesc || decrypted.msg || "取消订单失败";
      }
    } else {
      cancelResult.success = false;
      cancelResult.message = "响应数据解密失败";
    }
  } else {
    cancelResult.success = false;
    cancelResult.message = "响应数据格式错误";
  }

  return { cancelResult, rawResponse };
}

async function changeLounge({ orderId, loungeCode, sdTimestamp = Date.now() }) {
  const rawResponse = await postEncrypted(
    cfg.API_ENDPOINTS.CHANGE_LOUNGE,
    { orderId, loungeCode, sdTimestamp },
    { timeout: cfg.TIMEOUT.COUPON_REQUEST }
  );

  let changeResult = {
    success: false,
    message: "更换贵宾厅失败",
  };

  if (rawResponse && rawResponse.sdData) {
    const decrypted = decryptResponse(rawResponse);
    if (decrypted) {
      const isSuccess =
        decrypted.resultCode === "0000" ||
        decrypted.code === "0000" ||
        decrypted.success === true ||
        decrypted.status === "success" ||
        (decrypted.resultDesc && decrypted.resultDesc.includes("成功")) ||
        (decrypted.msg && decrypted.msg.includes("成功"));

      if (isSuccess) {
        changeResult.success = true;
        changeResult.message =
          decrypted.resultDesc || decrypted.msg || "贵宾厅更换成功";
      } else {
        changeResult.success = false;
        changeResult.message =
          decrypted.resultDesc || decrypted.msg || "更换贵宾厅失败";
      }
    } else {
      changeResult.success = false;
      changeResult.message = "响应数据解密失败";
    }
  } else {
    changeResult.success = false;
    changeResult.message = "响应数据格式错误";
  }

  return { changeResult, rawResponse };
}

module.exports = {
  extractActivityIdFromData,
  createOrder,
  queryOrders,
  cancelOrder,
  changeLounge,
};
