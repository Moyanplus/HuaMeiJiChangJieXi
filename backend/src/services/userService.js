const cfg = require("../core/config");
const logger = require("../utils/logger");
const { normalizeDataField } = require("../utils/parse");
const { postEncryptedAndDecrypt } = require("./remoteApi");

async function decryptUrlData(data, activityId) {
  const payload = {
    data,
    activityId: activityId || cfg.ACTIVITY_ID,
    sdTimestamp: Date.now(),
  };
  return postEncryptedAndDecrypt(cfg.API_ENDPOINTS.DECRYPT, payload, {
    timeout: cfg.TIMEOUT.COUPON_REQUEST,
  });
}

function buildUserInfo(dataField, cardTypeCode) {
  if (!dataField || typeof dataField !== "object") return null;
  return {
    cardTypeCode: dataField.cardTypeCode || cardTypeCode,
    userName: dataField.userName || "",
    phone: dataField.phone || dataField.telephone || "",
    idCard: dataField.idCard || "",
    email: dataField.email || "",
    address: dataField.address || "",
    points: dataField.points || 0,
    level: dataField.level || "",
    status: dataField.status || "",
    createTime: dataField.createTime || "",
    lastLoginTime: dataField.lastLoginTime || "",
    ...dataField,
  };
}

async function fetchUserInfo({ cardTypeCode, data }) {
  const payload = {
    cardTypeCode: cardTypeCode,
    data,
    sdTimestamp: Date.now(),
  };

  const decrypted = await postEncryptedAndDecrypt(
    cfg.API_ENDPOINTS.USER_INFO,
    payload,
    { timeout: cfg.TIMEOUT.USER_INFO_REQUEST }
  );

  if (!decrypted || !decrypted.data) {
    logger.warn("user info missing data");
    return { raw: decrypted, userInfo: null };
  }

  const dataField = normalizeDataField(decrypted.data);
  return {
    raw: decrypted,
    userInfo: buildUserInfo(dataField, cardTypeCode),
  };
}

module.exports = {
  decryptUrlData,
  buildUserInfo,
  fetchUserInfo,
};
