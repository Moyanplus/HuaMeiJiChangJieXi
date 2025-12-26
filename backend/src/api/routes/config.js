const express = require("express");
const cfg = require("../../core/config");

const router = express.Router();

/**
 * 获取后端运行时配置。
 * @param {import("express").Request} req - 请求对象
 * @param {import("express").Response} res - 响应对象
 * @returns {void}
 */
router.get("/api/config", (req, res) => {
  res.json({
    ok: true,
    config: {
      CARD_TYPE_CODE: cfg.CARD_TYPE_CODE,
      ACTIVITY_ID: cfg.ACTIVITY_ID,
    },
  });
});

module.exports = router;
