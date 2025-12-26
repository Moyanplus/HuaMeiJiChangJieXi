const logger = require("../../utils/logger");

/**
 * 统一处理未捕获异常并返回标准错误响应。
 * @param {Error} err - 异常对象
 * @param {import("express").Request} req - 请求对象
 * @param {import("express").Response} res - 响应对象
 * @param {import("express").NextFunction} next - 中间件回调
 * @returns {void}
 */
function errorHandler(err, req, res, next) {
  logger.error("server error", err && err.message ? err.message : err);
  res.status(500).json({
    ok: false,
    error: "服务器内部错误",
    message: err && err.message ? err.message : String(err),
  });
}

/**
 * 处理未匹配路由的请求并返回 404。
 * @param {import("express").Request} req - 请求对象
 * @param {import("express").Response} res - 响应对象
 * @returns {void}
 */
function notFoundHandler(req, res) {
  logger.warn("route not found", `${req.method} ${req.originalUrl}`);
  res.status(404).json({
    ok: false,
    error: "未找到请求的资源",
  });
}

module.exports = {
  errorHandler,
  notFoundHandler,
};
