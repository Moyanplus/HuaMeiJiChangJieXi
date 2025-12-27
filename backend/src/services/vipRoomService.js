const logger = require("../utils/logger");
const { normalizeDataField } = require("../utils/parse");
const { fetchCouponByOrderNo, fetchCouponBySmsToken } = require("./couponService");

async function buildVipRoomData({ db, name, orderUserName }) {
  const queryUserName = orderUserName || name;
  const userData = await db.getUserDataByName(queryUserName);

  if (!userData) {
    return { error: `未找到用户 ${queryUserName} 的数据`, userData: null };
  }

  let couponNum = null;

  const extractCouponCode = (couponResult) => {
    if (!couponResult || !couponResult.data) return null;
    const parsed = normalizeDataField(couponResult.data);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed.couponNum || parsed.couponCode || null;
  };

  const smsToken = userData.smsToken;
  const smsTokenExpiresAt = userData.smsTokenExpiresAt;
  const tokenExpired =
    smsTokenExpiresAt && Date.parse(smsTokenExpiresAt) <= Date.now();

  if (smsToken && !tokenExpired) {
    try {
      const orderId =
        userData.h5OrderNo || userData.orderNo || userData.h5OrderId;
      if (orderId) {
        const smsCoupon = await fetchCouponBySmsToken({
          orderId,
          smsToken,
        });
        couponNum = extractCouponCode(smsCoupon);
      }
    } catch (couponError) {
      logger.warn("vip-room smsToken coupon failed", {
        error: couponError && couponError.message ? couponError.message : couponError,
      });
    }
  }

  if (!couponNum && userData.orderNo) {
    try {
      const decryptedCoupon = await fetchCouponByOrderNo(userData.orderNo);
      couponNum = extractCouponCode(decryptedCoupon);
    } catch (couponError) {
      logger.error(
        "vip-room coupon request failed",
        couponError && couponError.message ? couponError.message : couponError
      );
    }
  }

  const responseData = {
    couponCode: couponNum,
    userName: name,
    code: couponNum || userData.h5OrderNo || userData.orderNo,
    startData: userData.orderTime,
    stopDate: userData.endTime,
    orderId: userData.orderNo,
    telephone: userData.telephone,
    serverName: userData.serverName,
    loungeCode: userData.loungeCode,
    rightsRemainPoint: userData.rightsRemainPoint,
    status: userData.status,
  };

  return { data: responseData, userData };
}

module.exports = {
  buildVipRoomData,
};
