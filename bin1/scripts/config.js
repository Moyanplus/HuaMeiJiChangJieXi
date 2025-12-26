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
  },

  // 活动配置
  ACTIVITY_ID: process.env.ACTIVITY_ID || "5476",

  // 服务器配置
  SERVER: {
    PORT: process.env.PORT || 3000,
    HOST: process.env.HOST || "0.0.0.0",
  },

  // 二维码配置
  QR_CODE: {
    WIDTH: parseInt(process.env.QR_WIDTH) || 260,
    MARGIN: parseInt(process.env.QR_MARGIN) || 1,
    ERROR_CORRECTION_LEVEL: process.env.QR_ERROR_CORRECTION_LEVEL || "H",
    VERSION: parseInt(process.env.QR_VERSION) || 10,
  },

  // 测试数据配置
  TEST_DATA: {
    userName: process.env.TEST_USER_NAME || "史建华",
    couponNum: process.env.TEST_COUPON_NUM || "SDL1MFPWDCPNMVLO",
    bespeakCardType: process.env.TEST_BESPEAK_CARD_TYPE || "HXYX0803",
    orderNo: process.env.TEST_ORDER_NO || "P202509190042761782",
    serverName: process.env.TEST_SERVER_NAME || "机场贵宾厅",
    telephone: process.env.TEST_TELEPHONE || "15152536915",
    h5OrderId:
      process.env.TEST_H5_ORDER_ID ||
      "rctdSvcil1K6jzmKc9G1nKJYPgfNYKqLIazIDcdm3bQ=",
    h5OrderNo: process.env.TEST_H5_ORDER_NO || "HXZHXYK475383735776564388",
    orderTime: process.env.TEST_ORDER_TIME || "2025-09-19",
    couponSync: parseInt(process.env.TEST_COUPON_SYNC) || 1,
    loungeCode: process.env.TEST_LOUNGE_CODE || "GB7280",
    rightsRemainPoint: process.env.TEST_RIGHTS_REMAIN_POINT || "2.0",
    endTime: process.env.TEST_END_TIME || "2025-09-20 23:59:59",
    status: parseInt(process.env.TEST_STATUS) || 2,
  },
  DEFAULT_HEADERS: {
    accept: "application/json, text/plain, */*",
    "accept-encoding": "gzip, deflate, br, zstd",
    "accept-language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
    "cache-control": "no-cache",
    connection: "keep-alive",
    "content-type": "application/json;charset=UTF-8",
    host: "h5.schengle.com",
    origin: "https://h5.schengle.com",
    pragma: "no-cache",
    referer: "https://h5.schengle.com/ShengDaHXZHJSJ/",
    "sec-ch-ua":
      '"Not)A;Brand";v="8", "Chromium";v="138", "Android WebView";v="138"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Android"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    token: "null",
    "user-agent":
      "Mozilla/5.0 (Linux; Android 13; 23046RP50C Build/TKQ1.221114.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.180 Safari/537.36 XWEB/1380187 MMWEBSDK/20250201 MMWEBID/911 MicroMessenger/8.0.60.2860(0x28003C55) WeChat/arm64 Weixin Android Tablet NetType/WIFI Language/zh_CN ABI/arm64",
    "x-requested-with": "com.tencent.mm",
  },
};
