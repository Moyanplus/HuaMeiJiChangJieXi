const cfg = require("../core/config");
const { postEncryptedAndDecrypt } = require("./remoteApi");

async function sendSmsCode(orderId, sdTimestamp = Date.now()) {
  return postEncryptedAndDecrypt(
    cfg.API_ENDPOINTS.SMS_SEND,
    { orderId, sdTimestamp },
    { timeout: cfg.TIMEOUT.COUPON_REQUEST }
  );
}

async function verifySmsCode({ orderId, smsCode, sdTimestamp = Date.now() }) {
  return postEncryptedAndDecrypt(
    cfg.API_ENDPOINTS.SMS_VERIFY,
    { orderId, smsCode, sdTimestamp },
    { timeout: cfg.TIMEOUT.COUPON_REQUEST }
  );
}

module.exports = {
  sendSmsCode,
  verifySmsCode,
};
