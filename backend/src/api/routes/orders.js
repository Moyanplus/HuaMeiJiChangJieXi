const express = require("express");
const cfg = require("../../core/config");
const logger = require("../../utils/logger");
const {
  createOrder,
  queryOrders,
  cancelOrder,
  changeLounge,
} = require("../../services/orderService");

/**
 * 创建订单相关路由。
 * @returns {import("express").Router} 路由实例
 */
function createOrdersRouter() {
  const router = express.Router();

  /**
   * 创建贵宾厅订单。
   * @param {import("express").Request} req - 请求对象
   * @param {import("express").Response} res - 响应对象
   * @returns {Promise<void>}
   */
  router.post("/api/create-order", async (req, res) => {
    try {
      const {
        activityId,
        bespType = "VIP",
        bespeakCardType = cfg.CARD_TYPE_CODE,
        phoneNo,
        name,
        loungeCode,
        data,
        accompanierNumber = "0",
        sdTimestamp = Date.now(),
        autoGetUserInfo = true,
      } = req.body;

      if (!phoneNo || !name || !loungeCode) {
        return res.status(400).json({
          ok: false,
          error: "phoneNo、name 和 loungeCode 是必需参数",
        });
      }

      if (!data) {
        return res.status(400).json({
          ok: false,
          error: "data 参数是必需的，请先通过链接解析获取 data 参数",
        });
      }

      const result = await createOrder({
        activityId,
        bespType,
        bespeakCardType,
        phoneNo,
        name,
        loungeCode,
        data,
        accompanierNumber,
        sdTimestamp,
        autoGetUserInfo,
      });

      res.json({
        ok: true,
        result: result.orderResult,
        rawResponse: result.rawResponse,
        userInfo: result.userInfo,
      });
    } catch (error) {
      logger.error("create-order error", error && error.message);
      res.status(500).json({
        ok: false,
        error: "创建订单失败",
        details: error.message,
      });
    }
  });

  /**
   * 查询订单列表。
   * @param {import("express").Request} req - 请求对象
   * @param {import("express").Response} res - 响应对象
   * @returns {Promise<void>}
   */
  router.post("/api/query-orders", async (req, res) => {
    try {
      const {
        phoneNo,
        page = 1,
        size = 10,
        cityCode = "AUSADL",
        continentType = "",
        countryCode = "AU",
        domesticForeign = "2",
        loungeType = "3",
        serviceId = "5476",
        siteCode = "ZD74575",
      } = req.body;

      if (!phoneNo) {
        return res.status(400).json({
          ok: false,
          error: "phoneNo 参数是必需的",
        });
      }

      const { orders, rawResponse } = await queryOrders({
        cityCode,
        continentType,
        countryCode,
        domesticForeign,
        loungeType,
        page,
        serviceId,
        siteCode,
        size,
      });

      res.json({
        ok: true,
        result: {
          orders: orders,
          total: orders.length,
          page: parseInt(page),
          size: parseInt(size),
        },
        rawResponse: rawResponse,
      });
    } catch (error) {
      logger.error("query-orders error", error && error.message);
      res.status(500).json({
        ok: false,
        error: "查询订单失败",
        details: error.message,
      });
    }
  });

  /**
   * 取消订单。
   * @param {import("express").Request} req - 请求对象
   * @param {import("express").Response} res - 响应对象
   * @returns {Promise<void>}
   */
  router.post("/api/cancel-order", async (req, res) => {
    try {
      const { orderId, sdTimestamp = Date.now() } = req.body;

      if (!orderId) {
        return res.status(400).json({
          ok: false,
          error: "orderId 参数是必需的",
        });
      }

      const requestData = {
        orderId,
        sdTimestamp,
      };

      const { cancelResult, rawResponse } = await cancelOrder({
        orderId,
        sdTimestamp,
      });

      res.json({
        ok: true,
        result: cancelResult,
        rawResponse: rawResponse,
      });
    } catch (error) {
      logger.error("cancel-order error", error && error.message);
      res.status(500).json({
        ok: false,
        error: "取消订单失败",
        details: error.message,
      });
    }
  });

  /**
   * 变更订单中的贵宾厅。
   * @param {import("express").Request} req - 请求对象
   * @param {import("express").Response} res - 响应对象
   * @returns {Promise<void>}
   */
  router.post("/api/change-lounge", async (req, res) => {
    try {
      const { orderId, loungeCode, sdTimestamp = Date.now() } = req.body;

      if (!orderId || !loungeCode) {
        return res.status(400).json({
          ok: false,
          error: "orderId 和 loungeCode 参数是必需的",
        });
      }

      const requestData = {
        orderId,
        loungeCode,
        sdTimestamp,
      };

      const { changeResult, rawResponse } = await changeLounge({
        orderId,
        loungeCode,
        sdTimestamp,
      });

      res.json({
        ok: true,
        result: changeResult,
        rawResponse: rawResponse,
      });
    } catch (error) {
      logger.error("change-lounge error", error && error.message);
      res.status(500).json({
        ok: false,
        error: "更换贵宾厅失败",
        details: error.message,
      });
    }
  });

  return router;
}

module.exports = createOrdersRouter;
