const axios = require("axios");
const {
  encryptRequest,
  decryptResponse,
  generateSign,
  REQUEST_SALT,
} = require("./cryptoUtils");
const cfg = require("./config");
const fs = require("fs");
const path = require("path");

/**
 * 获取用户信息的脚本
 * 从API获取用户信息并保存到文件
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

async function getUserInfo() {
  try {
    console.log("👤 开始获取用户信息...");
    console.log("=".repeat(50));

    // 解析命令行参数
    const cli = parseArgJson() || {};

    // 构建请求数据 - 获取用户信息
    const requestData = {
      cardTypeCode: cli.cardTypeCode || "HXYX0803",
      data:
        cli.data ||
        "dJB93zUeB9KwSvETEKjXukpYzpG1oXtR3ouZF+s7ABDre10tRTolbunxBxQeVvC4oiW4qWDfaj7FhaUVByAeFbzEfJH8/YeeuqwUkwHTDQ4Vu7/4qpVoB1wJdvJbzyJFgoqp6HF+5IKzsciwFCGJGsPiELHIfxRFcMulaGfrU5W8UrVuKETOJozTqd6/RxYkkpRpxqLApRkgDEFTG5ZpbsIp8/XASh14AgwZDyrlwdU8Cb+d3r8eZ/ejBwa3b0tA+0vR3J/zDmppg/ZCXh9S3ERSY43LEGFGsnqlSnI3JGkYg0/y1EpvJpsa9W6rpuSsyA+lMSI+t4AUhYjK88bQ5Q==",
      sdTimestamp: cli.sdTimestamp || Date.now(),
    };

    console.log("📋 请求数据:");
    console.log(JSON.stringify(requestData, null, 2));
    console.log("");

    const sdData = encryptRequest(requestData);

    // 发送请求到获取用户信息的API
    console.log("📤 发送请求到用户信息API...");
    const url = "https://h5.schengle.com/ShengDaHXZHJSJHD/user/getUserInfo";

    const response = await axios.post(
      url,
      { sdData },
      {
        headers: {
          referer: "https://h5.schengle.com/ShengDaHXZHJSJ/",
          "user-agent":
            "Mozilla/5.0 (Linux; Android 13; 23046RP50C Build/TKQ1.221114.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.180 Safari/537.36 XWEB/1380187 MMWEBSDK/20250201 MMWEBID/911 MicroMessenger/8.0.60.2860(0x28003C55) WeChat/arm64 Weixin Android Tablet NetType/WIFI Language/zh_CN ABI/arm64",
          "content-type": "application/json;charset=UTF-8",
          accept: "application/json, text/plain, */*",
          origin: "https://h5.schengle.com",
          "x-requested-with": "com.tencent.mm",
        },
        timeout: 10000,
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
        console.log("📊 解密后的用户信息数据:");
        console.log(JSON.stringify(decrypted, null, 2));

        // 解析用户信息数据
        if (decrypted && decrypted.data) {
          let userData = decrypted.data;

          // 如果data是字符串，尝试解析为JSON
          if (typeof userData === "string") {
            try {
              userData = JSON.parse(userData);
            } catch (e) {
              console.warn("⚠️ 无法解析data字段为JSON");
            }
          }

          // 处理用户信息数据
          if (userData && typeof userData === "object") {
            console.log("");
            console.log("👤 用户信息详情:");
            console.log("");

            // 格式化用户信息数据
            const formattedUserInfo = {
              cardTypeCode: userData.cardTypeCode || "",
              userName: userData.userName || "",
              phone: userData.phone || "",
              idCard: userData.idCard || "",
              email: userData.email || "",
              address: userData.address || "",
              points: userData.points || 0,
              level: userData.level || "",
              status: userData.status || "",
              createTime: userData.createTime || "",
              lastLoginTime: userData.lastLoginTime || "",
              ...userData, // 包含其他可能的字段
            };

            // 保存到文件
            const outputDir = path.join(__dirname);
            const outputFile = path.join(outputDir, "userInfo.json");

            // 保存JSON格式
            fs.writeFileSync(
              outputFile,
              JSON.stringify(formattedUserInfo, null, 2),
              "utf8"
            );
            console.log(`💾 用户信息已保存到: ${outputFile}`);

            // 显示用户信息摘要
            console.log("");
            console.log("📊 用户信息摘要:");
            console.log(`  🆔 卡类型: ${formattedUserInfo.cardTypeCode}`);
            console.log(`  👤 用户名: ${formattedUserInfo.userName}`);
            console.log(`  📱 手机号: ${formattedUserInfo.phone}`);
            console.log(`  🆔 身份证: ${formattedUserInfo.idCard}`);
            console.log(`  📧 邮箱: ${formattedUserInfo.email}`);
            console.log(`  🏠 地址: ${formattedUserInfo.address}`);
            console.log(`  ⭐ 积分: ${formattedUserInfo.points}`);
            console.log(`  🎖️ 等级: ${formattedUserInfo.level}`);
            console.log(`  📊 状态: ${formattedUserInfo.status}`);
            console.log(`  📅 创建时间: ${formattedUserInfo.createTime}`);
            console.log(`  🕐 最后登录: ${formattedUserInfo.lastLoginTime}`);
            console.log("");

            // 显示所有字段（包括未知字段）
            console.log("🔍 完整用户信息字段:");
            Object.entries(formattedUserInfo).forEach(([key, value]) => {
              const valueStr =
                typeof value === "object"
                  ? JSON.stringify(value)
                  : String(value);
              console.log(`  ${key}: ${valueStr}`);
            });
          } else {
            console.log("⚠️ 未找到有效的用户信息数据");
            console.log("原始数据:", userData);
          }
        } else {
          console.log("⚠️ 响应中没有data字段");
          console.log("解密后的完整数据:", decrypted);
        }
      } catch (decryptError) {
        console.error("❌ 解密失败:", decryptError.message);
        console.error("解密错误详情:", decryptError);
      }
    } else {
      console.log("⚠️ 响应中没有sdData字段，无法解密");
      console.log("尝试直接解析响应数据...");

      // 如果没有sdData字段，尝试直接处理响应
      if (data && typeof data === "object") {
        console.log("📊 直接响应数据:");
        console.log(JSON.stringify(data, null, 2));

        // 保存原始响应
        const outputDir = path.join(__dirname);
        const outputFile = path.join(outputDir, "userInfo_raw.json");
        fs.writeFileSync(outputFile, JSON.stringify(data, null, 2), "utf8");
        console.log(`💾 原始响应数据已保存到: ${outputFile}`);
      }
    }

    console.log("");
    console.log("🏁 获取用户信息完成");
  } catch (error) {
    console.error("❌ 获取用户信息失败:", error.message);
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
获取用户信息脚本使用说明:

基本用法:
  node getUserInfo.js

使用自定义参数:
  node getUserInfo.js --json='{"cardTypeCode":"HXYX0803","data":"your_data_here"}'

参数说明:
  --json=JSON_STRING  自定义请求参数，JSON格式
  
  常用参数:
  - cardTypeCode: 卡类型代码 (如: "HXYX0803")
  - data: 加密的用户数据
  - sdTimestamp: 时间戳 (默认: 当前时间)
  - sign: 签名 (可选)
  
  --help, -h         显示此帮助信息

输出文件:
  - userInfo.json     JSON格式的用户信息数据
  - userInfo_raw.json 原始响应数据（如果无法解密）

示例:
  # 使用默认参数获取用户信息
  node getUserInfo.js
  
  # 使用自定义卡类型
  node getUserInfo.js --json='{"cardTypeCode":"HXYX0803"}'
`);
  process.exit(0);
}

// 运行获取用户信息
getUserInfo();
