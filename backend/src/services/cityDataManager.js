const axios = require("axios");
const { encryptRequest, decryptResponse } = require("../core/cryptoUtils");
const VipRoomDatabase = require("../core/database");
const cfg = require("../core/config");
const fs = require("fs");
const path = require("path");

/**
 * 城市数据管理器
 * 负责从API获取城市数据并存储到数据库
 */
class CityDataManager {
  constructor() {
    this.db = new VipRoomDatabase();
    this.isInitialized = false;
  }

  // 初始化数据库连接
  async init() {
    if (!this.isInitialized) {
      await this.db.init();
      this.isInitialized = true;
    }
  }

  // 获取城市数据并保存到数据库
  async syncCityData() {
    try {
      console.log("🌍 开始同步城市数据...");
      console.log("=".repeat(50));

      await this.init();

      // 构建请求数据
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

      // 发送请求
      console.log("📤 发送请求到城市列表API...");
      const url = `${cfg.API_BASE_URL}${cfg.API_PREFIX}${cfg.API_ENDPOINTS.QUERY_STATION_LIST}`;

      const response = await axios.post(
        url,
        { sdData },
        {
          headers: {
            "Content-Type": "application/json",
            "User-Agent":
              "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
          },
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
          throw new Error("响应数据不是有效的JSON格式");
        }
      }

      console.log("📥 原始响应数据:");
      console.log(JSON.stringify(data, null, 2));
      console.log("");

      // 解密响应数据
      if (!data || !data.sdData) {
        throw new Error("响应中没有sdData字段，无法解密");
      }

      console.log("🔓 开始解密响应数据...");
      const decrypted = decryptResponse(data);
      console.log("✅ 解密成功");
      console.log("📊 解密后的城市数据:");
      console.log(JSON.stringify(decrypted, null, 2));

      // 解析城市数据
      if (!decrypted || !decrypted.data) {
        throw new Error("未找到有效的城市数据");
      }

      let cityData = decrypted.data;

      // 如果data是字符串，尝试解析为JSON
      if (typeof cityData === "string") {
        try {
          cityData = JSON.parse(cityData);
        } catch (e) {
          throw new Error("无法解析data字段为JSON");
        }
      }

      // 提取城市列表
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

      if (allCities.length === 0) {
        throw new Error("未找到任何城市数据");
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

      // 保存到数据库
      console.log("💾 开始保存城市数据到数据库...");
      const saveResult = await this.db.saveCitiesData(formattedCities);
      console.log(
        `✅ 数据库保存完成: 成功 ${saveResult.successCount} 条, 失败 ${saveResult.errorCount} 条`
      );

      // 统计国内外机场数量
      const domesticCount = formattedCities.filter(
        (city) => city.countryCode === "CN"
      ).length;
      const internationalCount = formattedCities.length - domesticCount;

      // 记录同步日志
      const today = new Date().toISOString().split("T")[0];
      await this.db.saveSyncLog({
        syncDate: today,
        totalCities: formattedCities.length,
        domesticCount: domesticCount,
        internationalCount: internationalCount,
        syncStatus: "success",
        errorMessage: null,
      });

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

      // 同时保存到文件作为备份
      await this.saveToFiles(formattedCities);

      console.log("");
      console.log("🏁 城市数据同步完成");

      return {
        success: true,
        totalCities: formattedCities.length,
        domesticCount,
        internationalCount,
        saveResult,
      };
    } catch (error) {
      console.error("❌ 同步城市数据失败:", error.message);

      // 记录错误日志
      const today = new Date().toISOString().split("T")[0];
      try {
        await this.db.saveSyncLog({
          syncDate: today,
          totalCities: 0,
          domesticCount: 0,
          internationalCount: 0,
          syncStatus: "error",
          errorMessage: error.message,
        });
      } catch (logError) {
        console.error("记录错误日志失败:", logError.message);
      }

      throw error;
    }
  }

  // 保存到文件作为备份
  async saveToFiles(citiesData) {
    try {
      const outputDir = path.join(__dirname);
      const outputFile = path.join(outputDir, "cities.json");
      const csvFile = path.join(outputDir, "cities.csv");

      // 保存JSON格式
      fs.writeFileSync(outputFile, JSON.stringify(citiesData, null, 2), "utf8");
      console.log(`💾 城市数据已保存到: ${outputFile}`);

      // 保存CSV格式
      const csvHeader =
        "siteCode,cityName,cityCode,cityEnName,siteName,siteEnName,countryCode,countryName,countryEnName,siteType\n";
      const csvData = citiesData
        .map(
          (city) =>
            `"${city.siteCode}","${city.cityName}","${city.cityCode}","${city.cityEnName}","${city.siteName}","${city.siteEnName}","${city.countryCode}","${city.countryName}","${city.countryEnName}","${city.siteType}"`
        )
        .join("\n");

      fs.writeFileSync(csvFile, csvHeader + csvData, "utf8");
      console.log(`💾 城市数据CSV已保存到: ${csvFile}`);
    } catch (error) {
      console.error("保存文件失败:", error.message);
    }
  }

  // 获取所有城市数据
  async getAllCities() {
    await this.init();
    return await this.db.getAllCities();
  }

  // 根据国家代码获取城市数据
  async getCitiesByCountry(countryCode) {
    await this.init();
    return await this.db.getCitiesByCountry(countryCode);
  }

  // 搜索城市数据
  async searchCities(keyword) {
    await this.init();
    return await this.db.searchCities(keyword);
  }

  // 获取同步日志
  async getSyncLogs(limit = 30) {
    await this.init();
    return await this.db.getSyncLogs(limit);
  }

  // 关闭数据库连接
  async close() {
    if (this.isInitialized) {
      this.db.close();
      this.isInitialized = false;
    }
  }
}

module.exports = CityDataManager;
