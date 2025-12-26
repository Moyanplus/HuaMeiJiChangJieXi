const axios = require("axios");
const { encryptRequest, decryptResponse } = require("./cryptoUtils");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

/**
 * 获取所有机场贵宾厅数据的脚本
 * 遍历cities.csv中的所有机场，获取每个机场的贵宾厅列表
 */

// 读取cities.csv文件
function readCitiesData() {
  const csvPath = path.join(__dirname, "../data/cities.csv");
  const csvContent = fs.readFileSync(csvPath, "utf8");
  const lines = csvContent.split("\n");

  const cities = [];
  for (let i = 1; i < lines.length; i++) {
    // 跳过标题行
    const line = lines[i].trim();
    if (line) {
      const columns = line.split(",");
      if (columns.length >= 10) {
        cities.push({
          siteCode: columns[0].replace(/"/g, ""),
          cityName: columns[1].replace(/"/g, ""),
          cityCode: columns[2].replace(/"/g, ""),
          cityEnName: columns[3].replace(/"/g, ""),
          siteName: columns[4].replace(/"/g, ""),
          siteEnName: columns[5].replace(/"/g, ""),
          countryCode: columns[6].replace(/"/g, ""),
          countryName: columns[7].replace(/"/g, ""),
          countryEnName: columns[8].replace(/"/g, ""),
          siteType: columns[9].replace(/"/g, ""),
        });
      }
    }
  }

  return cities;
}

// 获取单个机场的贵宾厅数据
async function getLoungeDataForAirport(airport, page = 1, size = 10) {
  try {
    console.log(
      `🏛️ 获取 ${airport.cityName} - ${airport.siteName} 的贵宾厅数据 (第${page}页)...`
    );

    // 构建请求数据
    const requestData = {
      serviceId: "5476",
      domesticForeign: airport.domesticForeign || "1", // 1-国内，2-境外
      continentType: "",
      countryCode: airport.countryCode,
      cityCode: airport.cityCode,
      siteCode: airport.siteCode,
      page: page,
      size: size,
      loungeType: "1,2,3", // 所有类型的贵宾厅
      sdTimestamp: Date.now(),
    };

    // 显示请求参数（调试用）
    console.log(
      `🔍 请求参数: domesticForeign=${requestData.domesticForeign}, countryCode=${requestData.countryCode}`
    );

    // 加密请求数据
    const sdData = encryptRequest(requestData);

    // 发送请求
    const url =
      "https://h5.schengle.com/ShengDaHXZHJSJHD/bespeak/VipHall/vipHallList";
    const response = await axios.post(
      url,
      { sdData },
      {
        headers: {
          referer: "https://h5.schengle.com/ShengDaHXZHJSJ/",
          "user-agent":
            "Mozilla/5.0 (Linux; Android 13; 23046RP50C Build/TKQ1.221114.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.180 Safari/537.36 XWEB/1380187 MMWEBSDK/20250201 MMWEBID/911 MicroMessenger/8.0.60.2860(0x28003C55) WeChat/arm64 Weixin Android Tablet NetType/WIFI Language/zh_CN ABI/arm64",
        },
        timeout: 15000,
      }
    );

    // 处理响应数据
    let data = response && response.data;
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch (e) {
        console.warn(`⚠️ ${airport.siteName} 响应数据不是有效的JSON格式`);
        return [];
      }
    }

    // 解密响应数据
    if (data && data.sdData) {
      try {
        const decrypted = decryptResponse(data);
        if (decrypted && decrypted.data) {
          let loungeData = decrypted.data;

          // 如果data是字符串，尝试解析为JSON
          if (typeof loungeData === "string") {
            try {
              loungeData = JSON.parse(loungeData);
            } catch (e) {
              console.warn(`⚠️ ${airport.siteName} 无法解析data字段为JSON`);
              return [];
            }
          }

          // 处理贵宾厅数据
          if (Array.isArray(loungeData)) {
            console.log(
              `✅ ${airport.siteName} 找到 ${loungeData.length} 个贵宾厅`
            );
            return loungeData.map((lounge) => ({
              ...lounge,
              airportSiteCode: airport.siteCode,
              airportSiteName: airport.siteName,
              airportCityName: airport.cityName,
              airportCountryName: airport.countryName,
            }));
          }
        }
      } catch (decryptError) {
        console.error(`❌ ${airport.siteName} 解密失败:`, decryptError.message);
      }
    }

    return [];
  } catch (error) {
    console.error(`❌ ${airport.siteName} 获取贵宾厅数据失败:`, error.message);
    return [];
  }
}

// 获取所有机场的贵宾厅数据
async function getAllLounges() {
  try {
    console.log("🏛️ 开始获取所有机场的贵宾厅数据...");
    console.log("=".repeat(60));

    // 读取机场数据
    console.log("📖 读取机场数据...");
    const cities = readCitiesData();
    console.log(`✅ 共读取到 ${cities.length} 个机场`);
    console.log("");

    const allLounges = [];
    const processedAirports = new Set(); // 用于去重
    let successCount = 0;
    let errorCount = 0;

    // 遍历所有机场
    for (let i = 0; i < cities.length; i++) {
      const airport = cities[i];

      // 跳过重复的机场
      if (processedAirports.has(airport.siteCode)) {
        console.log(`⏭️ 跳过重复机场: ${airport.siteName}`);
        continue;
      }
      processedAirports.add(airport.siteCode);

      console.log(
        `\n📍 处理机场 ${i + 1}/${cities.length}: ${airport.cityName} - ${
          airport.siteName
        }`
      );

      try {
        // 获取国内贵宾厅
        const domesticLounges = await getLoungeDataForAirport({
          ...airport,
          domesticForeign: "1",
        });

        // 获取境外贵宾厅
        const internationalLounges = await getLoungeDataForAirport({
          ...airport,
          domesticForeign: "2",
        });

        const airportLounges = [...domesticLounges, ...internationalLounges];
        allLounges.push(...airportLounges);

        if (airportLounges.length > 0) {
          successCount++;
          console.log(
            `✅ ${airport.siteName} 成功获取 ${airportLounges.length} 个贵宾厅`
          );
        } else {
          console.log(`ℹ️ ${airport.siteName} 暂无贵宾厅数据`);
        }

        // 添加延迟避免请求过于频繁
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        errorCount++;
        console.error(`❌ ${airport.siteName} 处理失败:`, error.message);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 数据收集完成统计:");
    console.log(`✅ 成功处理机场: ${successCount} 个`);
    console.log(`❌ 失败处理机场: ${errorCount} 个`);
    console.log(`🏛️ 总共收集贵宾厅: ${allLounges.length} 个`);
    console.log("");

    // 去重处理
    const uniqueLounges = [];
    const seenCodes = new Set();

    for (const lounge of allLounges) {
      if (lounge.loungeCode && !seenCodes.has(lounge.loungeCode)) {
        seenCodes.add(lounge.loungeCode);
        uniqueLounges.push(lounge);
      }
    }

    console.log(`🔄 去重后贵宾厅数量: ${uniqueLounges.length} 个`);
    console.log("");

    // 保存数据
    if (uniqueLounges.length > 0) {
      await saveToFiles(uniqueLounges);
    } else {
      console.log("⚠️ 没有收集到任何贵宾厅数据");
    }

    console.log("🏁 所有机场贵宾厅数据获取完成");
  } catch (error) {
    console.error("❌ 获取所有贵宾厅数据失败:", error.message);
    console.error("错误详情:", error);
    process.exit(1);
  }
}

// 保存数据到文件
async function saveToFiles(lounges) {
  const outputDir = path.join(__dirname);

  // 保存JSON格式
  const jsonFile = path.join(outputDir, "all-lounges.json");
  fs.writeFileSync(jsonFile, JSON.stringify(lounges, null, 2), "utf8");
  console.log(`💾 JSON数据已保存到: ${jsonFile}`);

  // 保存CSV格式
  const csvFile = path.join(outputDir, "all-lounges.csv");
  const csvHeader =
    "loungeCode,loungeName,cityName,cityCode,cityEnName,countryCode,countryName,countryEnName,siteName,siteCode,siteType,terminalName,terminalCode,businessHours,deductPoints,loungeType,domesticForeign,address,latitude,longitude,serviceName,airportSiteCode,airportSiteName,airportCityName,airportCountryName\n";

  let csvData = "";
  for (const lounge of lounges) {
    const row =
      [
        lounge.loungeCode || "",
        lounge.loungeName || "",
        lounge.cityName || "",
        lounge.cityCode || "",
        lounge.cityEnName || "",
        lounge.countryCode || "",
        lounge.countryName || "",
        lounge.countryEnName || "",
        lounge.siteName || "",
        lounge.siteCode || "",
        lounge.siteType || "",
        lounge.terminalName || "",
        lounge.terminalCode || "",
        lounge.businessHours || "",
        lounge.deductPoints || "",
        lounge.loungeType || "",
        lounge.domesticForeign || "",
        lounge.address || "",
        lounge.latitude || "",
        lounge.longitude || "",
        lounge.serviceName || "",
        lounge.airportSiteCode || "",
        lounge.airportSiteName || "",
        lounge.airportCityName || "",
        lounge.airportCountryName || "",
      ]
        .map((field) => `"${field}"`)
        .join(",") + "\n";
    csvData += row;
  }

  fs.writeFileSync(csvFile, csvHeader + csvData, "utf8");
  console.log(`💾 CSV数据已保存到: ${csvFile}`);

  // 保存Excel格式
  const excelFile = path.join(outputDir, "all-lounges.xlsx");
  const worksheet = XLSX.utils.json_to_sheet(lounges);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "贵宾厅数据");
  XLSX.writeFile(workbook, excelFile);
  console.log(`💾 Excel数据已保存到: ${excelFile}`);

  // 创建贵宾厅代码列表
  const loungeCodes = lounges.map((lounge) => ({
    loungeCode: lounge.loungeCode,
    loungeName: lounge.loungeName,
    cityName: lounge.cityName,
    countryName: lounge.countryName,
    siteName: lounge.siteName,
  }));

  const codesFile = path.join(outputDir, "lounge-codes.json");
  fs.writeFileSync(codesFile, JSON.stringify(loungeCodes, null, 2), "utf8");
  console.log(`💾 贵宾厅代码列表已保存到: ${codesFile}`);

  // 保存贵宾厅代码Excel
  const codesExcelFile = path.join(outputDir, "lounge-codes.xlsx");
  const codesWorksheet = XLSX.utils.json_to_sheet(loungeCodes);
  const codesWorkbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(codesWorkbook, codesWorksheet, "贵宾厅代码");
  XLSX.writeFile(codesWorkbook, codesExcelFile);
  console.log(`💾 贵宾厅代码Excel已保存到: ${codesExcelFile}`);

  console.log("");
  console.log("📋 文件保存完成:");
  console.log(`  - ${jsonFile}`);
  console.log(`  - ${csvFile}`);
  console.log(`  - ${excelFile}`);
  console.log(`  - ${codesFile}`);
  console.log(`  - ${codesExcelFile}`);
}

// 显示使用说明
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
获取所有机场贵宾厅数据脚本使用说明:

基本用法:
  node getAllLounges.js

测试用法:
  node getAllLounges.js --test

功能:
  - 读取cities.csv中的所有机场数据
  - 为每个机场获取贵宾厅列表数据
  - 自动去重处理
  - 保存为多种格式文件

测试功能:
  - 测试国外机场贵宾厅数据获取
  - 只测试前5个国外机场（美国、日本、英国、德国、法国、澳大利亚）
  - 使用 domesticForeign: "2" 参数
  - 保存测试结果到 test-international-lounges.json

输出文件:
  - all-lounges.json       完整贵宾厅数据(JSON格式)
  - all-lounges.csv        完整贵宾厅数据(CSV格式)
  - all-lounges.xlsx       完整贵宾厅数据(Excel格式)
  - lounge-codes.json      贵宾厅代码列表(JSON格式)
  - lounge-codes.xlsx      贵宾厅代码列表(Excel格式)
  - test-international-lounges.json  测试结果(JSON格式)

注意事项:
  - 脚本会自动添加请求延迟避免过于频繁
  - 会自动跳过重复的机场
  - 会同时获取国内和境外贵宾厅数据
  - 处理时间较长，请耐心等待
  - 使用 --test 参数可以快速测试国外机场功能

  --help, -h         显示此帮助信息
  --test             测试国外机场贵宾厅数据获取
`);
  process.exit(0);
}

// 测试单个国外机场的方法
async function testInternationalAirport() {
  try {
    console.log("🧪 开始测试国外机场贵宾厅数据获取...");
    console.log("=".repeat(60));

    // 读取机场数据
    const cities = readCitiesData();

    // 找到一些国外机场进行测试
    const testAirports = cities
      .filter(
        (airport) =>
          airport.countryCode !== "CN" &&
          (airport.countryCode === "USA" ||
            airport.countryCode === "JPN" ||
            airport.countryCode === "GBR" ||
            airport.countryCode === "DEU" ||
            airport.countryCode === "FRA" ||
            airport.countryCode === "AUS")
      )
      .slice(0, 5); // 只测试前5个国外机场

    if (testAirports.length === 0) {
      console.log("❌ 没有找到合适的国外机场进行测试");
      return;
    }

    console.log(`📋 将测试 ${testAirports.length} 个国外机场:`);
    testAirports.forEach((airport, index) => {
      console.log(
        `  ${index + 1}. ${airport.cityName} - ${airport.siteName} (${
          airport.countryName
        })`
      );
    });
    console.log("");

    const allLounges = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < testAirports.length; i++) {
      const airport = testAirports[i];

      console.log(
        `\n📍 测试机场 ${i + 1}/${testAirports.length}: ${airport.cityName} - ${
          airport.siteName
        } (${airport.countryName})`
      );
      console.log(`   国家代码: ${airport.countryCode}`);
      console.log(`   城市代码: ${airport.cityCode}`);
      console.log(`   机场代码: ${airport.siteCode}`);

      try {
        // 测试国外贵宾厅 (domesticForeign: "2")
        console.log(`🏛️ 测试国外贵宾厅数据获取...`);
        const internationalLounges = await getLoungeDataForAirport({
          ...airport,
          domesticForeign: "2",
        });

        allLounges.push(...internationalLounges);

        if (internationalLounges.length > 0) {
          successCount++;
          console.log(
            `✅ ${airport.siteName} 成功获取 ${internationalLounges.length} 个国外贵宾厅`
          );

          // 显示贵宾厅详情
          internationalLounges.forEach((lounge, index) => {
            console.log(
              `   ${index + 1}. ${lounge.loungeName || "未知名称"} (代码: ${
                lounge.loungeCode || "未知"
              })`
            );
          });
        } else {
          console.log(`ℹ️ ${airport.siteName} 暂无国外贵宾厅数据`);
        }

        // 添加延迟避免请求过于频繁
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        errorCount++;
        console.error(`❌ ${airport.siteName} 测试失败:`, error.message);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("🧪 国外机场测试完成统计:");
    console.log(`✅ 成功测试机场: ${successCount} 个`);
    console.log(`❌ 失败测试机场: ${errorCount} 个`);
    console.log(`🏛️ 总共获取贵宾厅: ${allLounges.length} 个`);
    console.log("");

    // 保存测试结果
    if (allLounges.length > 0) {
      const testFile = path.join(__dirname, "test-international-lounges.json");
      fs.writeFileSync(testFile, JSON.stringify(allLounges, null, 2), "utf8");
      console.log(`💾 测试结果已保存到: ${testFile}`);
    }

    console.log("🏁 国外机场测试完成");
  } catch (error) {
    console.error("❌ 测试国外机场失败:", error.message);
    console.error("错误详情:", error);
  }
}

// 运行获取所有贵宾厅数据
if (process.argv.includes("--test")) {
  testInternationalAirport();
} else {
  getAllLounges();
}
