const path = require("path");

// 优化 dotenv 加载
try {
  require("dotenv").config({
    path: path.resolve(process.cwd(), ".env"),
    silent: true, // 静默模式，减少日志输出
  });
} catch (_) {
  // 忽略 dotenv 加载错误
}

module.exports = {
  REQUEST_SALT: process.env.REQUEST_SALT || "REQUESTAUTOSHENGDA",
  RESPONSE_SALT: process.env.RESPONSE_SALT || "RESPONSEAUTOSHENGDA",
  SM2_PUBLIC_KEY:
    (process.env.SM2_PUBLIC_KEY ||
      "04c86244fa853b05e165bdcb483a5fcf61c3744dd27077b892420eb3ad1f73a40cf8fdffc045c37f376de7534c4ed24654a868be42520a67ada59e740012393eae") +
    (process.env.SM2_PUBLIC_KEY_NEWLINE === "true" ? "\n" : ""),
  SM2_PRIVATE_KEY:
    process.env.SM2_PRIVATE_KEY ||
    "880ca1346b235f3866226e53aacd7c80501a4cdd88c197a8e0f599d5153aeb5a",

  // API 基础配置
  API_BASE_URL: process.env.API_BASE_URL || "https://h5.schengle.com",
  API_PREFIX: process.env.API_PREFIX || "/ShengDaHXZHJSJHD",

  // API 端点配置
  API_ENDPOINTS: {
    DECRYPT: process.env.API_DECRYPT || "/decrypt",
    COUPON: process.env.API_COUPON || "/bespeak/VipHall/getCoupon",
    ORDER_INFO:
      process.env.API_ORDER_INFO || "/bespeak/VipHall/queryH5OrderInfo",
    BESPEAK_LIST: process.env.API_BESPEAK_LIST || "/bespeak/list",
    USER_INFO: process.env.API_USER_INFO || "/user/getUserInfo",
    CREATE_ORDER:
      process.env.API_CREATE_ORDER || "/bespeak/VipHall/createProductOrder",
    QUERY_ORDERS: process.env.API_QUERY_ORDERS || "/bespeak/query",
    CANCEL_ORDER:
      process.env.API_CANCEL_ORDER || "/bespeak/VipHall/cancelOrder",
    CHANGE_LOUNGE: process.env.API_CHANGE_LOUNGE || "/bespeak/VipHall/change",
    QUERY_STATION_LIST:
      process.env.API_QUERY_STATION_LIST || "/bespeak/VipHall/queryStationList",
    SMS_SEND: process.env.API_SMS_SEND || "/sms/send",
    SMS_VERIFY: process.env.API_SMS_VERIFY || "/sms/verify",
  },

  // 活动配置
  ACTIVITY_ID: process.env.ACTIVITY_ID || "5476",

  // 卡类型配置
  CARD_TYPE_CODE: process.env.CARD_TYPE_CODE,

  // 错误图片配置
  ERROR_IMAGES: {
    QR_CODE_ERROR: process.env.QR_CODE_ERROR_IMAGE,
  },

  // 超时配置
  TIMEOUT: {
    DEFAULT: parseInt(process.env.DEFAULT_TIMEOUT) || 10000, // 默认10秒
    COUPON_REQUEST: parseInt(process.env.COUPON_REQUEST_TIMEOUT) || 15000, // 优惠券请求15秒
    USER_INFO_REQUEST: parseInt(process.env.USER_INFO_REQUEST_TIMEOUT) || 10000, // 用户信息请求10秒
    ORDER_REQUEST: parseInt(process.env.ORDER_REQUEST_TIMEOUT) || 15000, // 订单请求15秒
  },

  // 服务器配置
  SERVER: {
    PORT: process.env.PORT || 8081,
    HOST: process.env.HOST || "0.0.0.0",
  },

  // 二维码配置
  QR_CODE: {
    WIDTH: parseInt(process.env.QR_WIDTH) || 260,
    MARGIN: parseInt(process.env.QR_MARGIN) || 1,
    ERROR_CORRECTION_LEVEL: process.env.QR_ERROR_CORRECTION_LEVEL || "H",
    VERSION: parseInt(process.env.QR_VERSION) || 10,
  },

  DEFAULT_HEADERS: {
    origin: "https://h5.schengle.com",
    referer: "https://h5.schengle.com/ShengDaHXZHJSJ/",
    token: "null",
    "user-agent":
      "Mozilla/5.0 (Linux; Android 13; 23046RP50C Build/TKQ1.221114.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.180 Safari/537.36 XWEB/1380187 MMWEBSDK/20250201 MMWEBID/911 MicroMessenger/8.0.60.2860(0x28003C55) WeChat/arm64 Weixin Android Tablet NetType/WIFI Language/zh_CN ABI/arm64",
    "x-requested-with": "com.tencent.mm",
  },
};
