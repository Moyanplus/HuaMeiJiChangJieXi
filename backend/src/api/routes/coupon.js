const express = require("express");
const logger = require("../../utils/logger");
const { normalizeDataField } = require("../../utils/parse");
const {
  fetchCouponByOrderNo,
  fetchCouponBySmsToken,
  fetchCouponFromOrderId,
} = require("../../services/couponService");
const { generateQrData } = require("../../services/qrService");

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
 * 将有效期字符串解析为时间戳。
 * @param {string} value - 时间字符串
 * @returns {number|null} 时间戳或 null
 */
function parseValidTime(value) {
  if (!value || typeof value !== "string") return null;
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const timestamp = Date.parse(normalized);
  if (Number.isNaN(timestamp)) return null;
  return timestamp;
}

/**
 * 构建优惠券元数据。
 * @param {Object} result - 接口响应对象
 * @returns {Object} 元数据
 */
function buildCouponMeta(result) {
  const dataField = normalizeDataField(result && result.data);
  const code =
    dataField && (dataField.couponCode || dataField.couponNum || null);
  const validTime =
    dataField &&
    (dataField.validTime || dataField.valid_time || dataField.validAt || null);
  const timestamp = parseValidTime(validTime);
  let expiresAt = null;
  let expiresInSeconds = null;
  let expired = null;

  if (timestamp) {
    const diff = timestamp - Date.now();
    expiresAt = new Date(timestamp).toISOString();
    expiresInSeconds = Math.max(0, Math.ceil(diff / 1000));
    expired = diff <= 0;
  }

  return {
    code,
    validTime,
    expiresAt,
    expiresInSeconds,
    expired,
  };
}

/**
 * 创建优惠券相关路由。
 * @returns {import("express").Router} 路由实例
 */
function createCouponRouter() {
  const router = express.Router();

  /**
   * 根据订单号获取优惠券与二维码。
   * @param {import("express").Request} req - 请求对象
   * @param {import("express").Response} res - 响应对象
   * @returns {Promise<void>}
   */
  router.post("/api/coupon", async (req, res) => {
    try {
      const { orderNo } = req.body || {};
      if (!orderNo) {
        return res
          .status(400)
          .json({ ok: false, error: "orderNo is required" });
      }

      const decrypted = await fetchCouponByOrderNo(orderNo);

      try {
        const dataField = normalizeDataField(decrypted && decrypted.data);
        const code =
          dataField && (dataField.couponCode || dataField.couponNum);
        if (code) {
          const qrDataUrl = await generateQrData(code);
          return res.json({ ok: true, result: { ...decrypted, qrDataUrl } });
        }
      } catch (e) {
        logger.warn("coupon qr generate failed", e && e.message ? e.message : e);
      }

      res.json({ ok: true, result: decrypted });
    } catch (e) {
      logger.error("coupon error", e && e.message ? e.message : e);
      res
        .status(500)
        .json({ ok: false, error: e && e.message ? e.message : String(e) });
    }
  });

  /**
   * 从订单链接解析并获取优惠券信息。
   * @param {import("express").Request} req - 请求对象
   * @param {import("express").Response} res - 响应对象
   * @returns {Promise<void>}
   */
  router.post("/api/coupon-from-url", async (req, res) => {
    try {
      const { data, sign } = req.body || {};
      if (!data || !sign) {
        return res
          .status(400)
          .json({ ok: false, error: "data and sign are required" });
      }

      const { orderNo, coupon } = await fetchCouponFromOrderId(data);

      if (!orderNo) {
        return res.status(400).json({
          ok: false,
          error: "无法从订单信息中获取orderNo",
        });
      }

      res.json({ ok: true, result: coupon });
    } catch (e) {
      logger.error("coupon-from-url error", e && e.message ? e.message : e);
      res
        .status(500)
        .json({ ok: false, error: e && e.message ? e.message : String(e) });
    }
  });

  /**
   * 通过短信验证令牌获取优惠券与二维码。
   * @param {import("express").Request} req - 请求对象
   * @param {import("express").Response} res - 响应对象
   * @returns {Promise<void>}
   */
  router.post("/api/coupon-by-sms", async (req, res) => {
    try {
      const { orderId, smsToken } = req.body || {};
      if (!orderId || !smsToken) {
        return res.status(400).json({
          ok: false,
          error: "orderId and smsToken are required",
        });
      }

      const decrypted = await fetchCouponBySmsToken({ orderId, smsToken });
      if (!isSuccessResult(decrypted)) {
        return res.status(400).json({
          ok: false,
          error: decrypted?.msg || decrypted?.resultDesc || "获取优惠券失败",
          result: decrypted,
        });
      }

      const meta = buildCouponMeta(decrypted);
      if (!meta.code) {
        return res.status(400).json({
          ok: false,
          error: "未获取到优惠券代码",
          result: decrypted,
          meta,
        });
      }

      let qrDataUrl = null;
      try {
        qrDataUrl = await generateQrData(meta.code);
      } catch (e) {
        logger.warn(
          "coupon-by-sms qr generate failed",
          e && e.message ? e.message : e
        );
      }

      res.json({
        ok: true,
        result: decrypted,
        code: meta.code,
        qrDataUrl,
        meta,
      });
    } catch (e) {
      logger.error("coupon-by-sms error", e && e.message ? e.message : e);
      res
        .status(500)
        .json({ ok: false, error: e && e.message ? e.message : String(e) });
    }
  });

  return router;
}

module.exports = createCouponRouter;
