const logger = require("../../utils/logger");

/**
 * 记录基础请求信息的中间件。
 * @param {import("express").Request} req - 请求对象
 * @param {import("express").Response} res - 响应对象
 * @param {import("express").NextFunction} next - 中间件回调
 * @returns {void}
 */
function requestLogger(req, res, next) {
  logger.info("request", {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });
  next();
}

module.exports = requestLogger;
