const express = require("express");
const logger = require("../../utils/logger");

const router = express.Router();

/**
 * 健康检查接口。
 * @param {import("express").Request} req - 请求对象
 * @param {import("express").Response} res - 响应对象
 * @returns {void}
 */
router.get("/health", (req, res) => {
  logger.info("health check");
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

module.exports = router;
