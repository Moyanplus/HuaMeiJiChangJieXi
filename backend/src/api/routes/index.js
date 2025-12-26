const express = require("express");
const healthRoutes = require("./health");
const configRoutes = require("./config");
const cryptoRoutes = require("./crypto");
const createVipRoomRoutes = require("./vipRoom");
const createCouponRoutes = require("./coupon");
const createUserInfoRoutes = require("./userInfo");
const createFullFlowRoutes = require("./fullFlow");
const createUserDataRoutes = require("./userData");
const createCityRoutes = require("./cities");
const createLoungeRoutes = require("./lounges");
const createOrderRoutes = require("./orders");
const createSmsRoutes = require("./sms");

/**
 * 创建并聚合所有 API 路由。
 * @param {Object} deps - 依赖对象
 * @returns {import("express").Router} 路由实例
 */
function createRouter(deps = {}) {
  const router = express.Router();

  router.use(healthRoutes);
  router.use(configRoutes);
  router.use(cryptoRoutes);
  router.use(createVipRoomRoutes(deps));
  router.use(createCouponRoutes(deps));
  router.use(createUserInfoRoutes(deps));
  router.use(createFullFlowRoutes(deps));
  router.use(createUserDataRoutes(deps));
  router.use(createCityRoutes(deps));
  router.use(createLoungeRoutes(deps));
  router.use(createOrderRoutes(deps));
  router.use(createSmsRoutes(deps));

  return router;
}

module.exports = createRouter;
