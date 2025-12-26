const express = require("express");
const { decryptResponse, encryptRequest } = require("../../core/cryptoUtils");

const router = express.Router();

/**
 * 解密服务端响应体。
 * @param {import("express").Request} req - 请求对象
 * @param {import("express").Response} res - 响应对象
 * @returns {void}
 */
router.post("/api/decrypt", (req, res) => {
  try {
    const body = req.body;
    const result = decryptResponse(body);
    res.json({ ok: true, result });
  } catch (e) {
    res
      .status(400)
      .json({ ok: false, error: e && e.message ? e.message : String(e) });
  }
});

/**
 * 加密请求体并生成签名。
 * @param {import("express").Request} req - 请求对象
 * @param {import("express").Response} res - 响应对象
 * @returns {void}
 */
router.post("/api/encrypt", (req, res) => {
  try {
    const { text } = req.body;
    if (!text)
      return res.status(400).json({ ok: false, error: "text is required" });

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { text: text };
    }

    const result = encryptRequest(data);
    res.json({ ok: true, result });
  } catch (e) {
    res
      .status(400)
      .json({ ok: false, error: e && e.message ? e.message : String(e) });
  }
});

module.exports = router;
