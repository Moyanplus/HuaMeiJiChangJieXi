/**
 * 测试贵宾厅API功能
 */

async function testLoungeAPI() {
  const baseUrl = "http://localhost:3000";

  console.log("🧪 开始测试贵宾厅API...");
  console.log("=".repeat(50));

  try {
    // 测试获取贵宾厅列表
    console.log("1️⃣ 测试获取贵宾厅列表...");
    const listResponse = await fetch(`${baseUrl}/api/lounges?limit=5`);
    const listData = await listResponse.json();

    if (listData.ok) {
      console.log(
        `✅ 获取贵宾厅列表成功: ${listData.returned}/${listData.total} 条`
      );
      console.log(
        `   示例: ${listData.data[0]?.loungeName} (${listData.data[0]?.loungeCode})`
      );
    } else {
      console.log("❌ 获取贵宾厅列表失败:", listData.error);
    }

    // 测试搜索贵宾厅
    console.log("\n2️⃣ 测试搜索贵宾厅...");
    const searchResponse = await fetch(
      `${baseUrl}/api/lounges/search?q=${encodeURIComponent("北京")}&limit=3`
    );
    const searchData = await searchResponse.json();

    if (searchData.ok) {
      console.log(`✅ 搜索贵宾厅成功: 找到 ${searchData.total} 条结果`);
      console.log(`   查询词: "${searchData.query}"`);
      searchData.data.forEach((lounge, index) => {
        console.log(
          `   ${index + 1}. ${lounge.loungeName} (${lounge.loungeCode})`
        );
      });
    } else {
      console.log("❌ 搜索贵宾厅失败:", searchData.error);
    }

    // 测试获取贵宾厅详情
    console.log("\n3️⃣ 测试获取贵宾厅详情...");
    if (listData.data && listData.data.length > 0) {
      const loungeCode = listData.data[0].loungeCode;
      const detailResponse = await fetch(
        `${baseUrl}/api/lounges/${loungeCode}`
      );
      const detailData = await detailResponse.json();

      if (detailData.ok) {
        console.log(`✅ 获取贵宾厅详情成功: ${detailData.data.loungeName}`);
        console.log(
          `   位置: ${detailData.data.cityName} ${detailData.data.siteName}`
        );
        console.log(`   营业时间: ${detailData.data.businessHours}`);
      } else {
        console.log("❌ 获取贵宾厅详情失败:", detailData.error);
      }
    }

    console.log("\n🎉 贵宾厅API测试完成！");
    console.log("=".repeat(50));
    console.log(
      "📱 现在可以访问 http://localhost:3000/simple.html 测试前端功能"
    );
  } catch (error) {
    console.error("❌ 测试过程中发生错误:", error.message);
  }
}

// 运行测试
testLoungeAPI();
