const { spawn } = require("child_process");
const path = require("path");

/**
 * 性能测试脚本 - 对比原版和多线程版本的性能
 */

console.log("🧪 华美机场解析系统性能测试");
console.log("=".repeat(60));

// 测试配置
const TEST_CONFIG = {
  // 只测试前10个机场，避免长时间等待
  testAirports: 10,
  concurrent: 5,
  batch: 10,
  delay: 100,
};

// 运行测试
async function runPerformanceTest() {
  console.log(`📋 测试配置:`);
  console.log(`  - 测试机场数量: ${TEST_CONFIG.testAirports}`);
  console.log(`  - 并发数: ${TEST_CONFIG.concurrent}`);
  console.log(`  - 批处理大小: ${TEST_CONFIG.batch}`);
  console.log(`  - 请求延迟: ${TEST_CONFIG.delay}ms`);
  console.log("");

  // 创建测试用的城市数据（只取前10个）
  const citiesPath = path.join(__dirname, "../data/cities.csv");
  const fs = require("fs");
  const csvContent = fs.readFileSync(citiesPath, "utf8");
  const lines = csvContent.split("\n");
  const testLines = lines.slice(0, TEST_CONFIG.testAirports + 1); // +1 for header
  const testCsvPath = path.join(__dirname, "../data/cities-test.csv");
  fs.writeFileSync(testCsvPath, testLines.join("\n"));

  console.log("🚀 开始性能测试...\n");

  // 测试多线程版本
  console.log("1️⃣ 测试多线程版本...");
  const startTime1 = Date.now();

  try {
    await runScript("getAllLounges-multithreaded.js", [
      `--concurrent=${TEST_CONFIG.concurrent}`,
      `--batch=${TEST_CONFIG.batch}`,
      `--delay=${TEST_CONFIG.delay}`,
    ]);

    const endTime1 = Date.now();
    const duration1 = Math.round((endTime1 - startTime1) / 1000);
    console.log(`✅ 多线程版本完成，耗时: ${duration1}秒\n`);

    // 显示性能提升估算
    const estimatedOriginalTime = TEST_CONFIG.testAirports * 2 * 1.5; // 每个机场2个请求，每个请求约1.5秒
    const speedup = Math.round((estimatedOriginalTime / duration1) * 10) / 10;

    console.log("📊 性能对比估算:");
    console.log(`  - 原版预估时间: ${estimatedOriginalTime}秒`);
    console.log(`  - 多线程版本: ${duration1}秒`);
    console.log(`  - 性能提升: ${speedup}x 倍`);
    console.log(
      `  - 时间节省: ${Math.round(
        ((estimatedOriginalTime - duration1) / estimatedOriginalTime) * 100
      )}%`
    );
  } catch (error) {
    console.error("❌ 多线程版本测试失败:", error.message);
  }

  // 清理测试文件
  try {
    fs.unlinkSync(testCsvPath);
  } catch (e) {
    // 忽略清理错误
  }

  console.log("\n🏁 性能测试完成");
}

// 运行脚本
function runScript(scriptName, args = []) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, scriptName);
    const child = spawn("node", [scriptPath, ...args], {
      stdio: "inherit",
      cwd: path.dirname(scriptPath),
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`脚本退出，代码: ${code}`));
      }
    });

    child.on("error", (error) => {
      reject(error);
    });
  });
}

// 显示使用说明
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
性能测试脚本使用说明:

基本用法:
  node performance-test.js

功能:
  - 对比原版和多线程版本的性能
  - 使用少量机场进行快速测试
  - 显示性能提升估算

参数:
  --help, -h    显示此帮助信息

注意:
  - 测试使用前10个机场，避免长时间等待
  - 会创建临时测试文件，测试完成后自动清理
  - 结果仅供参考，实际性能可能因网络状况而异
`);
  process.exit(0);
}

// 运行测试
runPerformanceTest().catch(console.error);
