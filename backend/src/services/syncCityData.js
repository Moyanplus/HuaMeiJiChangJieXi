const CityDataManager = require("./cityDataManager");

/**
 * 城市数据同步脚本
 * 从API获取城市数据并保存到数据库
 * 支持手动执行和定时任务调用
 */

async function syncCityData() {
  const cityManager = new CityDataManager();

  try {
    console.log("🌍 开始同步城市数据...");
    console.log("=".repeat(50));
    console.log(`⏰ 执行时间: ${new Date().toLocaleString("zh-CN")}`);
    console.log("");

    // 使用城市数据管理器同步数据
    const result = await cityManager.syncCityData();

    console.log("");
    console.log("🏁 城市数据同步完成");
    console.log(`✅ 成功同步 ${result.totalCities} 个城市到数据库`);
    console.log(`📊 统计信息:`);
    console.log(`  🇨🇳 国内机场: ${result.domesticCount} 个`);
    console.log(`  🌍 国外机场: ${result.internationalCount} 个`);
    console.log(
      `  💾 数据库保存: 成功 ${result.saveResult.successCount} 条, 失败 ${result.saveResult.errorCount} 条`
    );

    return {
      success: true,
      message: "城市数据同步成功",
      data: result,
    };
  } catch (error) {
    console.error("❌ 同步城市数据失败:", error.message);
    console.error("错误详情:", error);

    return {
      success: false,
      message: "城市数据同步失败",
      error: error.message,
    };
  } finally {
    // 关闭数据库连接
    await cityManager.close();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  syncCityData()
    .then((result) => {
      if (result.success) {
        console.log("✅ 脚本执行成功");
        process.exit(0);
      } else {
        console.log("❌ 脚本执行失败");
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error("❌ 脚本执行异常:", error);
      process.exit(1);
    });
}

module.exports = { syncCityData };
