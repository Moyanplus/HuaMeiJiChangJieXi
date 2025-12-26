#!/usr/bin/env node

/**
 * 快速启动脚本 - 华美机场解析系统多线程版本
 * 提供简单的命令行界面和预设配置
 */

const { spawn } = require("child_process");
const path = require("path");

// 预设配置
const PRESETS = {
  fast: {
    name: "快速模式",
    description: "高并发，适合网络良好时使用",
    concurrent: 15,
    batch: 30,
    delay: 100,
  },
  balanced: {
    name: "平衡模式",
    description: "中等并发，稳定可靠",
    concurrent: 10,
    batch: 20,
    delay: 200,
  },
  safe: {
    name: "安全模式",
    description: "低并发，避免被限制",
    concurrent: 5,
    batch: 10,
    delay: 500,
  },
  test: {
    name: "测试模式",
    description: "只处理前50个机场，快速测试",
    concurrent: 8,
    batch: 10,
    delay: 100,
    limit: 50,
  },
};

// 显示帮助信息
function showHelp() {
  console.log(`
🚀 华美机场解析系统 - 多线程优化版

使用方法:
  node run-optimized.js [模式] [选项]

预设模式:
  fast      快速模式 - 高并发，适合网络良好 (并发15, 批处理30, 延迟100ms)
  balanced  平衡模式 - 中等并发，稳定可靠 (并发10, 批处理20, 延迟200ms) [默认]
  safe      安全模式 - 低并发，避免被限制 (并发5, 批处理10, 延迟500ms)
  test      测试模式 - 只处理前50个机场 (并发8, 批处理10, 延迟100ms)

自定义选项:
  --concurrent=N    设置最大并发数
  --batch=N         设置批处理大小  
  --delay=N         设置请求延迟(毫秒)
  --limit=N         限制处理机场数量(测试用)

示例:
  node run-optimized.js                    # 使用平衡模式
  node run-optimized.js fast               # 使用快速模式
  node run-optimized.js test               # 使用测试模式
  node run-optimized.js --concurrent=20 --batch=40 --delay=50  # 自定义配置

性能说明:
  - 原版: 串行处理，每个机场约3秒，711个机场需要约35分钟
  - 多线程版: 并发处理，预计可提升5-10倍速度
  - 建议根据网络情况选择合适的模式

  --help, -h    显示此帮助信息
`);
}

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    showHelp();
    process.exit(0);
  }

  const config = {
    preset: "balanced",
    concurrent: null,
    batch: null,
    delay: null,
    limit: null,
  };

  // 检查预设模式
  const presetArg = args.find((arg) => PRESETS[arg]);
  if (presetArg) {
    config.preset = presetArg;
    const preset = PRESETS[presetArg];
    config.concurrent = preset.concurrent;
    config.batch = preset.batch;
    config.delay = preset.delay;
    config.limit = preset.limit;
  }

  // 解析自定义参数
  for (const arg of args) {
    if (arg.startsWith("--concurrent=")) {
      config.concurrent = parseInt(arg.split("=")[1]);
    } else if (arg.startsWith("--batch=")) {
      config.batch = parseInt(arg.split("=")[1]);
    } else if (arg.startsWith("--delay=")) {
      config.delay = parseInt(arg.split("=")[1]);
    } else if (arg.startsWith("--limit=")) {
      config.limit = parseInt(arg.split("=")[1]);
    }
  }

  return config;
}

// 运行多线程脚本
function runOptimizedScript(config) {
  const scriptPath = path.join(__dirname, "getAllLounges-multithreaded.js");
  const args = [];

  if (config.concurrent) args.push(`--concurrent=${config.concurrent}`);
  if (config.batch) args.push(`--batch=${config.batch}`);
  if (config.delay) args.push(`--delay=${config.delay}`);

  console.log(`🚀 启动多线程版本...`);
  console.log(
    `⚙️ 配置: 并发=${config.concurrent}, 批处理=${config.batch}, 延迟=${config.delay}ms`
  );
  if (config.limit) {
    console.log(`📊 限制: 只处理前${config.limit}个机场`);
  }
  console.log("");

  const child = spawn("node", [scriptPath, ...args], {
    stdio: "inherit",
    cwd: path.dirname(scriptPath),
  });

  child.on("close", (code) => {
    if (code === 0) {
      console.log("\n✅ 处理完成！");
    } else {
      console.log(`\n❌ 处理失败，退出代码: ${code}`);
      process.exit(code);
    }
  });

  child.on("error", (error) => {
    console.error("❌ 启动失败:", error.message);
    process.exit(1);
  });
}

// 主函数
function main() {
  console.log("🏛️ 华美机场解析系统 - 多线程优化版");
  console.log("=".repeat(50));

  const config = parseArgs();
  const preset = PRESETS[config.preset];

  console.log(`📋 使用模式: ${preset.name}`);
  console.log(`📝 描述: ${preset.description}`);
  console.log("");

  // 如果有限制，先创建测试数据
  if (config.limit) {
    try {
      const fs = require("fs");
      const citiesPath = path.join(__dirname, "../data/cities.csv");
      const csvContent = fs.readFileSync(citiesPath, "utf8");
      const lines = csvContent.split("\n");
      const testLines = lines.slice(0, config.limit + 1); // +1 for header
      const testCsvPath = path.join(__dirname, "../data/cities-test.csv");
      fs.writeFileSync(testCsvPath, testLines.join("\n"));

      // 临时替换cities.csv
      const originalCsvPath = path.join(
        __dirname,
        "../data/cities-original.csv"
      );
      fs.copyFileSync(citiesPath, originalCsvPath);
      fs.copyFileSync(testCsvPath, citiesPath);

      console.log(`📊 已创建测试数据，限制处理前${config.limit}个机场`);
      console.log("");
    } catch (error) {
      console.error("❌ 创建测试数据失败:", error.message);
      process.exit(1);
    }
  }

  runOptimizedScript(config);
}

// 处理退出信号，恢复原始数据
process.on("SIGINT", () => {
  console.log("\n🛑 正在停止...");
  try {
    const fs = require("fs");
    const originalCsvPath = path.join(__dirname, "../data/cities-original.csv");
    const citiesPath = path.join(__dirname, "../data/cities.csv");
    const testCsvPath = path.join(__dirname, "../data/cities-test.csv");

    if (fs.existsSync(originalCsvPath)) {
      fs.copyFileSync(originalCsvPath, citiesPath);
      fs.unlinkSync(originalCsvPath);
    }
    if (fs.existsSync(testCsvPath)) {
      fs.unlinkSync(testCsvPath);
    }
  } catch (e) {
    // 忽略清理错误
  }
  process.exit(0);
});

main();
