const express = require("express");
const logger = require("../../utils/logger");
const { normalizeDataField } = require("../../utils/parse");
const { sendSmsCode, verifySmsCode } = require("../../services/smsService");

/**
 * 判断接口返回是否为成功态。
 * @param {Object} result - 接口响应对象
 * @returns {boolean} 是否成功
 */
function isSuccessResult(result) {
  if (!result) return false;
  const code = result.errorCode || result.resultCode || result.code;
  if (code === "0000" || code === "000000") return true;
  if (result.success === true || result.success === "true") return true;
  if (result.resultCode === "success") return true;
  if (typeof result.msg === "string" && result.msg.includes("成功")) return true;
  if (
    typeof result.resultDesc === "string" &&
    result.resultDesc.includes("成功")
  ) {
    return true;
  }
  return false;
}

/**
 * 从响应中提取 smsToken。
 * @param {Object} result - 接口响应对象
 * @returns {string|null} 短信令牌
 */
function extractSmsToken(result) {
  const dataField = normalizeDataField(result && result.data);
  if (!dataField || typeof dataField !== "object") return null;
  return dataField.smsToken || dataField.sms_token || dataField.token || null;
}

/**
 * 创建短信相关路由。
 * @returns {import("express").Router} 路由实例
 */
function createSmsRouter() {
  const router = express.Router();

  /**
   * 发送短信验证码。
   * @param {import("express").Request} req - 请求对象
   * @param {import("express").Response} res - 响应对象
   * @returns {Promise<void>}
   */
  router.post("/api/sms/send", async (req, res) => {
    try {
      const { orderId } = req.body || {};
      if (!orderId) {
        logger.warn("sms send missing orderId");
        return res
          .status(400)
          .json({ ok: false, error: "orderId is required" });
      }

      const result = await sendSmsCode(orderId);
      if (!isSuccessResult(result)) {
        logger.warn("sms send failed", {
          orderId,
          result: result && (result.msg || result.resultDesc || result.errorCode),
        });
        return res.status(400).json({
          ok: false,
          error: result?.msg || result?.resultDesc || "短信发送失败",
          result,
        });
      }

      res.json({ ok: true, result });
    } catch (e) {
      logger.error("sms send error", e && e.message ? e.message : e);
      res
        .status(500)
        .json({ ok: false, error: e && e.message ? e.message : String(e) });
    }
  });

  /**
   * 校验短信验证码并返回 smsToken。
   * @param {import("express").Request} req - 请求对象
   * @param {import("express").Response} res - 响应对象
   * @returns {Promise<void>}
   */
  router.post("/api/sms/verify", async (req, res) => {
    try {
      const { orderId, smsCode } = req.body || {};
      if (!orderId || !smsCode) {
        return res.status(400).json({
          ok: false,
          error: "orderId and smsCode are required",
        });
      }

      const result = await verifySmsCode({ orderId, smsCode });
      if (!isSuccessResult(result)) {
        return res.status(400).json({
          ok: false,
          error: result?.msg || result?.resultDesc || "短信验证失败",
          result,
        });
      }

      const smsToken = extractSmsToken(result);
      if (!smsToken) {
        return res.status(400).json({
          ok: false,
          error: "未获取到smsToken",
          result,
        });
      }

      res.json({ ok: true, result, smsToken });
    } catch (e) {
      logger.error("sms verify error", e && e.message ? e.message : e);
      res
        .status(500)
        .json({ ok: false, error: e && e.message ? e.message : String(e) });
    }
  });

  return router;
}

module.exports = createSmsRouter;
