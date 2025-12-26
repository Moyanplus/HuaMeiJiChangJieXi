const cfg = require("../core/config");
const logger = require("../utils/logger");
const { normalizeDataField } = require("../utils/parse");
const { fetchCouponByOrderNo } = require("./couponService");
const { generateQrData } = require("./qrService");

async function buildVipRoomData({ db, name, orderUserName }) {
  const queryUserName = orderUserName || name;
  const userData = await db.getUserDataByName(queryUserName);

  if (!userData) {
    return { error: `未找到用户 ${queryUserName} 的数据`, userData: null };
  }

  let qrData = null;
  let couponNum = null;

  if (userData.orderNo) {
    try {
      const decryptedCoupon = await fetchCouponByOrderNo(userData.orderNo);
      if (decryptedCoupon && decryptedCoupon.data) {
        const parsed = normalizeDataField(decryptedCoupon.data);
        couponNum = parsed.couponNum || parsed.couponCode;
        if (couponNum) {
          qrData = await generateQrData(couponNum);
        }
      }
    } catch (couponError) {
      logger.error(
        "vip-room coupon request failed",
        couponError && couponError.message ? couponError.message : couponError
      );
      qrData = cfg.ERROR_IMAGES.QR_CODE_ERROR || null;
    }
  }

  const responseData = {
    qrData: qrData,
    userName: name,
    code: couponNum || userData.h5OrderNo,
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
