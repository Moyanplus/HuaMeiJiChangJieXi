const cron = require("node-cron");
const { syncCityData } = require("../services/syncCityData");
const fs = require("fs");
const path = require("path");

/**
 * 定时任务调度器
 * 负责管理城市数据同步的定时任务
 */
class TaskScheduler {
  constructor() {
    this.tasks = new Map();
    this.logFile = path.join(__dirname, "..", "..", "logs", "scheduler.log");
  }

  // 记录日志
  log(message, level = "INFO") {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}\n`;

    console.log(logMessage.trim());

    // 写入日志文件
    fs.appendFileSync(this.logFile, logMessage, "utf8");
  }

  // 启动城市数据同步定时任务
  startCityDataSync() {
    // 每天凌晨2点执行城市数据同步
    const cronExpression = "0 2 * * *"; // 每天凌晨2点

    const task = cron.schedule(
      cronExpression,
      async () => {
        this.log("开始执行城市数据同步定时任务");

        try {
          const result = await syncCityData();

          if (result.success) {
            this.log(`城市数据同步成功: ${result.data.totalCities} 个城市`);
          } else {
            this.log(`城市数据同步失败: ${result.error}`, "ERROR");
          }
        } catch (error) {
          this.log(`城市数据同步异常: ${error.message}`, "ERROR");
        }
      },
      {
        scheduled: false, // 不立即启动
        timezone: "Asia/Shanghai",
      }
    );

    this.tasks.set("cityDataSync", task);
    this.log(`城市数据同步定时任务已创建: ${cronExpression}`);

    return task;
  }

  // 启动所有定时任务
  startAll() {
    this.log("启动定时任务调度器");

    // 启动城市数据同步任务
    this.startCityDataSync();

    // 启动所有任务
    this.tasks.forEach((task, name) => {
      task.start();
      this.log(`定时任务已启动: ${name}`);
    });

    this.log("所有定时任务已启动");
  }

  // 停止所有定时任务
  stopAll() {
    this.log("停止定时任务调度器");

    this.tasks.forEach((task, name) => {
      task.stop();
      this.log(`定时任务已停止: ${name}`);
    });

    this.log("所有定时任务已停止");
  }

  // 获取任务状态
  getStatus() {
    const status = {};

    this.tasks.forEach((task, name) => {
      status[name] = {
        running: task.running,
        scheduled: task.scheduled,
      };
    });

    return status;
  }

  // 手动执行城市数据同步
  async manualSync() {
    this.log("手动执行城市数据同步");

    try {
      const result = await syncCityData();

      if (result.success) {
        this.log(`手动同步成功: ${result.data.totalCities} 个城市`);
        return result;
      } else {
        this.log(`手动同步失败: ${result.error}`, "ERROR");
        return result;
      }
    } catch (error) {
      this.log(`手动同步异常: ${error.message}`, "ERROR");
      throw error;
    }
  }
}

// 创建全局调度器实例
const scheduler = new TaskScheduler();

// 优雅关闭处理
process.on("SIGINT", () => {
  console.log("\n收到 SIGINT 信号，正在关闭定时任务调度器...");
  scheduler.stopAll();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n收到 SIGTERM 信号，正在关闭定时任务调度器...");
  scheduler.stopAll();
  process.exit(0);
});

// 如果直接运行此脚本
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case "start":
      scheduler.startAll();
      // 保持进程运行
      setInterval(() => {}, 1000);
      break;

    case "stop":
      scheduler.stopAll();
      process.exit(0);
      break;

    case "status":
      console.log(
        "定时任务状态:",
        JSON.stringify(scheduler.getStatus(), null, 2)
      );
      process.exit(0);
      break;

    case "sync":
      scheduler
        .manualSync()
        .then((result) => {
          console.log("手动同步结果:", result);
          process.exit(result.success ? 0 : 1);
        })
        .catch((error) => {
          console.error("手动同步失败:", error);
          process.exit(1);
        });
      break;

    default:
      console.log(`
定时任务调度器使用说明:

命令:
  node scheduler.js start    - 启动定时任务调度器
  node scheduler.js stop     - 停止定时任务调度器
  node scheduler.js status   - 查看任务状态
  node scheduler.js sync     - 手动执行城市数据同步

定时任务配置:
  - 城市数据同步: 每天凌晨2点执行
  - 时区: Asia/Shanghai
  - 日志文件: scheduler.log
      `);
      process.exit(0);
  }
}

module.exports = { TaskScheduler, scheduler };
