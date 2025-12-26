const cfg = require("../core/config");
const VipRoomDatabase = require("../core/database");
const CityDataManager = require("../services/cityDataManager");
const createApp = require("./app");
const logger = require("../utils/logger");

const db = new VipRoomDatabase();
const cityManager = new CityDataManager();
const app = createApp({ db, cityManager });

const port = cfg.SERVER.PORT;
const host = cfg.SERVER.HOST;

/**
 * 启动 HTTP 服务并初始化依赖。
 * @returns {Promise<void>}
 */
async function start() {
  logger.info("init database");
  await db.init();

  app.listen(port, host, () => {
    logger.info(`server started: http://${host}:${port}`);
    logger.info(`local: http://localhost:${port}/simple.html`);
    logger.info(`custom page: http://localhost:${port}/custom-page?name=用户名`);
  });
}

start().catch((err) => {
  logger.error("server start failed", err && err.message ? err.message : err);
  process.exit(1);
});

/**
 * 处理退出信号并释放资源。
 * @param {string} signal - 信号名称
 * @returns {void}
 */
function shutdown(signal) {
  logger.info(`shutdown ${signal}`);
  db.close();
  cityManager.close();
  process.exit(0);
}

/**
 * 处理未捕获异常。
 * @param {Error} err - 异常对象
 * @returns {void}
 */
function handleUncaughtException(err) {
  logger.error("uncaughtException", err && err.message ? err.message : err);
  process.exit(1);
}

/**
 * 处理未捕获的 Promise 拒绝。
 * @param {unknown} reason - 拒绝原因
 * @returns {void}
 */
function handleUnhandledRejection(reason) {
  logger.error(
    "unhandledRejection",
    reason && reason.message ? reason.message : reason
  );
  process.exit(1);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("uncaughtException", handleUncaughtException);
process.on("unhandledRejection", handleUnhandledRejection);
