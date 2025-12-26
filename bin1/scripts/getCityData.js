const axios = require("axios");
const {
  encryptRequest,
  decryptResponse,
  generateSign,
  REQUEST_SALT,
} = require("../utils/cryptoUtils");
const cfg = require("../new/config");
const fs = require("fs");
const path = require("path");
const CityDataManager = require("../backend/cityDataManager");

/**
 * 获取所有城市数据的脚本
 * 从API获取城市列表并保存到文件
 */

function parseArgJson() {
  const arg = process.argv.find((v) => v.startsWith("--json="));
  if (!arg) return null;
  const s = arg.slice("--json=".length);
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

async function getCityData() {
  try {
    console.log("🌍 开始获取城市数据...");
    console.log("=".repeat(50));

    // 构建请求数据 - 获取城市列表
    const requestData = {
      serviceId: "5476",
      sdTimestamp: Date.now(),
    };

    console.log("📋 请求数据:");
    console.log(JSON.stringify(requestData, null, 2));
    console.log("");

    // 加密请求数据
    console.log("🔐 开始加密请求数据...");
    const sdData = encryptRequest(requestData);
    console.log("✅ 加密完成");
    console.log(`加密数据长度: ${sdData.length} 字符`);
    console.log("");

    // 发送请求到获取城市列表的API
    console.log("📤 发送请求到城市列表API...");
    const url =
      "https://h5.schengle.com/ShengDaHXZHJSJHD/bespeak/VipHall/queryStationList";

    const response = await axios.post(
      url,
      { sdData },
      {
        headers: cfg.DEFAULT_HEADERS,
        timeout: 15000,
      }
    );

    console.log(`✅ 请求完成，状态码: ${response.status}`);
    console.log("");

    // 处理响应数据
    let data = response && response.data;
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch (e) {
        console.warn("⚠️ 响应数据不是有效的JSON格式");
      }
    }

    console.log("📥 原始响应数据:");
    console.log(JSON.stringify(data, null, 2));
    console.log("");

    // 解密响应数据
    if (data && data.sdData) {
      console.log("🔓 开始解密响应数据...");
      try {
        const decrypted = decryptResponse(data);
        console.log("✅ 解密成功");
        console.log("📊 解密后的城市数据:");
        console.log(JSON.stringify(decrypted, null, 2));

        // 解析城市数据
        if (decrypted && decrypted.data) {
          let cityData = decrypted.data;

          // 如果data是字符串，尝试解析为JSON
          if (typeof cityData === "string") {
            try {
              cityData = JSON.parse(cityData);
            } catch (e) {
              console.warn("⚠️ 无法解析data字段为JSON");
            }
          }

          // 提取城市列表 - 处理多个区域的数据
          let allCities = [];

          if (Array.isArray(cityData)) {
            // 遍历所有区域数据
            cityData.forEach((region, regionIndex) => {
              if (region.areaList && Array.isArray(region.areaList)) {
                console.log(
                  `📍 区域 ${regionIndex + 1}: ${
                    region.domesticForeign === 1 ? "国内" : "国外"
                  } - ${region.areaList.length} 个机场`
                );
                allCities = allCities.concat(region.areaList);
              }
            });
          } else if (cityData.areaList && Array.isArray(cityData.areaList)) {
            // 单个区域数据
            allCities = cityData.areaList;
            console.log(
              `📍 区域: ${cityData.domesticForeign === 1 ? "国内" : "国外"} - ${
                allCities.length
              } 个机场`
            );
          }

          console.log("");
          console.log(`🏙️ 总共找到 ${allCities.length} 个机场`);
          console.log("");

          // 格式化城市数据
          const formattedCities = allCities.map((city) => ({
            siteCode: city.siteCode,
            cityName: city.cityName,
            cityCode: city.cityCode,
            cityEnName: city.cityEnName,
            siteName: city.siteName,
            siteEnName: city.siteEnName,
            countryCode: city.countryCode,
            countryName: city.countryName,
            countryEnName: city.countryEnName,
            siteType: city.siteType,
          }));

          // 保存到文件
          const outputDir = path.join(__dirname);
          const outputFile = path.join(outputDir, "cities.json");
          const csvFile = path.join(outputDir, "cities.csv");

          // 保存JSON格式
          fs.writeFileSync(
            outputFile,
            JSON.stringify(formattedCities, null, 2),
            "utf8"
          );
          console.log(`💾 城市数据已保存到: ${outputFile}`);

          // 保存CSV格式
          const csvHeader =
            "siteCode,cityName,cityCode,cityEnName,siteName,siteEnName,countryCode,countryName,countryEnName,siteType\n";
          const csvData = formattedCities
            .map(
              (city) =>
                `"${city.siteCode}","${city.cityName}","${city.cityCode}","${city.cityEnName}","${city.siteName}","${city.siteEnName}","${city.countryCode}","${city.countryName}","${city.countryEnName}","${city.siteType}"`
            )
            .join("\n");

          fs.writeFileSync(csvFile, csvHeader + csvData, "utf8");
          console.log(`💾 城市数据CSV已保存到: ${csvFile}`);

          // 统计国内外机场数量
          const domesticCount = formattedCities.filter(
            (city) => city.countryCode === "CN"
          ).length;
          const internationalCount = formattedCities.length - domesticCount;

          console.log("");
          console.log("📊 机场统计:");
          console.log(`  🇨🇳 国内机场: ${domesticCount} 个`);
          console.log(`  🌍 国外机场: ${internationalCount} 个`);
          console.log(`  📍 总计: ${formattedCities.length} 个机场`);
          console.log("");

          // 显示前几个城市作为示例
          console.log("🏙️ 机场数据示例 (前10个):");
          formattedCities.slice(0, 10).forEach((city, index) => {
            const countryFlag = city.countryCode === "CN" ? "🇨🇳" : "🌍";
            console.log(
              `${index + 1}. ${countryFlag} ${city.cityName} (${
                city.cityEnName
              }) - ${city.siteName} [${city.countryName}]`
            );
          });

          if (formattedCities.length > 10) {
            console.log(`... 还有 ${formattedCities.length - 10} 个机场`);
          }
        } else {
          console.log("⚠️ 未找到有效的城市数据");
        }
      } catch (decryptError) {
        console.error("❌ 解密失败:", decryptError.message);
        console.error("解密错误详情:", decryptError);
      }
    } else {
      console.log("⚠️ 响应中没有sdData字段，无法解密");
    }

    console.log("");
    console.log("🏁 获取城市数据完成");
  } catch (error) {
    console.error("❌ 获取城市数据失败:", error.message);
    if (error.response) {
      console.error("响应状态:", error.response.status);
      console.error("响应数据:", error.response.data);
    }
    console.error("错误详情:", error);
    process.exit(1);
  }
}

// 显示使用说明
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
获取城市数据脚本使用说明:

基本用法:
  node getCityData.js

使用自定义参数:
  node getCityData.js --json='{"serviceId":"5476"}'

参数说明:
  --json=JSON_STRING  自定义请求参数，JSON格式
  --help, -h         显示此帮助信息

输出文件:
  - cities.json      JSON格式的城市数据
  - cities.csv       CSV格式的城市数据

示例:
  node getCityData.js --json='{"serviceId":"5476","sdTimestamp":1758364000000}'
`);
  process.exit(0);
}

// 运行获取城市数据
getCityData();
