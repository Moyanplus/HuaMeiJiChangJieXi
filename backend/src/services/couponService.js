const cfg = require("../core/config");
const { normalizeDataField } = require("../utils/parse");
const { postEncryptedAndDecrypt } = require("./remoteApi");

async function fetchCouponByOrderNo(orderNo) {
  const payload = { orderNo, sdTimestamp: Date.now() };
  return postEncryptedAndDecrypt(cfg.API_ENDPOINTS.COUPON, payload, {
    timeout: cfg.TIMEOUT.COUPON_REQUEST,
  });
}

async function fetchCouponBySmsToken({ orderId, smsToken, sdTimestamp }) {
  const payload = {
    orderId,
    smsToken,
    sdTimestamp: sdTimestamp || Date.now(),
  };
  return postEncryptedAndDecrypt(cfg.API_ENDPOINTS.COUPON, payload, {
    timeout: cfg.TIMEOUT.COUPON_REQUEST,
  });
}

function extractOrderNo(orderInfo) {
  if (!orderInfo || !orderInfo.data) return null;
  const parsed = normalizeDataField(orderInfo.data);
  if (!parsed || typeof parsed !== "object") return null;
  return parsed.orderNo || parsed.orderId || null;
}

async function fetchCouponFromOrderId(orderId) {
  const orderInfo = await postEncryptedAndDecrypt(
    cfg.API_ENDPOINTS.ORDER_INFO,
    { orderId, sdTimestamp: Date.now() },
    { timeout: cfg.TIMEOUT.COUPON_REQUEST }
  );

  const orderNo = extractOrderNo(orderInfo);
  if (!orderNo) {
    return { orderInfo, orderNo: null, coupon: null };
  }

  const coupon = await fetchCouponByOrderNo(orderNo);
  return { orderInfo, orderNo, coupon };
}

module.exports = {
  fetchCouponByOrderNo,
  fetchCouponBySmsToken,
  fetchCouponFromOrderId,
  extractOrderNo,
};
