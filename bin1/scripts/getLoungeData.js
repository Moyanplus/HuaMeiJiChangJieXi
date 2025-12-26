const axios = require('axios');
const { encryptRequest, decryptResponse, generateSign, REQUEST_SALT } = require('../utils/cryptoUtils');
const cfg = require('../new/config');
const fs = require('fs');
const path = require('path');

/**
 * 获取贵宾厅数据的脚本
 * 从API获取贵宾厅列表并保存到文件
 */

function parseArgJson() {
  const arg = process.argv.find(v => v.startsWith('--json='));
  if (!arg) return null;
  const s = arg.slice('--json='.length);
  try { return JSON.parse(s); } catch { return null; }
}

async function getLoungeData() {
  try {
    console.log('🏛️ 开始获取贵宾厅数据...');
    console.log('='.repeat(50));
    
    // 解析命令行参数
    // const cli = parseArgJson() || {};
    
    // 构建请求数据 - 获取贵宾厅列表
    const requestData = 
    // {
    //     "serviceId": "5476",
    //     "domesticForeign": "1",
    //     "continentType": "",
    //     "countryCode": "CN",
    //     "cityCode": "654300",
    //     "siteCode": "ZD02419",
    //     "page": 1,
    //     "size": 10,
    //     "loungeType": "3",
    //     "sdTimestamp": Date.now()
    // }
    {
        "serviceId": "5476",
        "domesticForeign": "2",
        "continentType": "",
        "countryCode": "MO",
        "cityCode": "820100",
        "siteCode": "ZD22669",
        "page": 1,
        "size": 10,
        "loungeType": "1,2",
        "sdTimestamp":  Date.now()
    }

    // 生成签名
    // requestData.sign = generateSign(requestData, REQUEST_SALT);

    console.log('📋 请求数据:');
    console.log(JSON.stringify(requestData, null, 2));
    console.log('');
    
    // 加密请求数据
    console.log('🔐 开始加密请求数据...');
    const sdData = encryptRequest(requestData);
    console.log('✅ 加密完成');
    console.log(`加密数据长度: ${sdData.length} 字符`);
    console.log('加密数据:', sdData);
    console.log('');
    
    // 发送请求到获取贵宾厅列表的API
    console.log('📤 发送请求到贵宾厅列表API...');
    const url = 'https://h5.schengle.com/ShengDaHXZHJSJHD/bespeak/VipHall/vipHallList';
    
    const response = await axios.post(url, { sdData }, {
      headers: {
        'referer': 'https://h5.schengle.com/ShengDaHXZHJSJ/',
        'user-agent': 'Mozilla/5.0 (Linux; Android 13; 23046RP50C Build/TKQ1.221114.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.180 Safari/537.36 XWEB/1380187 MMWEBSDK/20250201 MMWEBID/911 MicroMessenger/8.0.60.2860(0x28003C55) WeChat/arm64 Weixin Android Tablet NetType/WIFI Language/zh_CN ABI/arm64'
      },
      timeout: 10000,
    });
    
    console.log(`✅ 请求完成，状态码: ${response.status}`);
    console.log('');
    
    // 处理响应数据
    let data = response && response.data;
    if (typeof data === 'string') {
      try { 
        data = JSON.parse(data); 
      } catch (e) {
        console.warn('⚠️ 响应数据不是有效的JSON格式');
      }
    }
    
    console.log('📥 原始响应数据:');
    console.log(JSON.stringify(data, null, 2));
    console.log('');
    
    // 解密响应数据
    if (data && data.sdData) {
      console.log('🔓 开始解密响应数据...');
      try {
        const decrypted = decryptResponse(data);
        console.log('✅ 解密成功');
        console.log('📊 解密后的贵宾厅数据:');
        console.log(JSON.stringify(decrypted, null, 2));
        
        // 解析贵宾厅数据
        if (decrypted && decrypted.data) {
          let loungeData = decrypted.data;
          
          // 如果data是字符串，尝试解析为JSON
          if (typeof loungeData === 'string') {
            try {
              loungeData = JSON.parse(loungeData);
            } catch (e) {
              console.warn('⚠️ 无法解析data字段为JSON');
            }
          }
          
          // 处理贵宾厅数据
          if (Array.isArray(loungeData)) {
            console.log('');
            console.log(`🏛️ 总共找到 ${loungeData.length} 个贵宾厅`);
            console.log('');
            
            // 格式化贵宾厅数据
            const formattedLounges = loungeData.map(lounge => ({
              loungeCode: lounge.loungeCode,
              loungeName: lounge.loungeName,
              cityName: lounge.cityName,
              cityCode: lounge.cityCode,
              cityEnName: lounge.cityEnName,
              countryCode: lounge.countryCode,
              countryName: lounge.countryName,
              countryEnName: lounge.countryEnName,
              siteName: lounge.siteName,
              siteCode: lounge.siteCode,
              siteType: lounge.siteType,
              terminalName: lounge.terminalName,
              terminalCode: lounge.terminalCode,
              businessHours: lounge.businessHours,
              deductPoints: lounge.deductPoints,
              loungeType: lounge.loungeType,
              domesticForeign: lounge.domesticForeign,
              address: lounge.address,
              latitude: lounge.latitude,
              longitude: lounge.longitude,
              serviceName: lounge.serviceName,
              serviceList: lounge.serviceList || [],
              restrictionList: lounge.restrictionList || [],
              positionInfo: lounge.positionInfo || [],
              imageList: lounge.imageList || []
            }));
            
            // 保存到文件
            const outputDir = path.join(__dirname);
            const outputFile = path.join(outputDir, 'lounges.json');
            const csvFile = path.join(outputDir, 'lounges.csv');
            
            // 保存JSON格式
            fs.writeFileSync(outputFile, JSON.stringify(formattedLounges, null, 2), 'utf8');
            console.log(`💾 贵宾厅数据已保存到: ${outputFile}`);
            
            // 保存CSV格式
            const csvHeader = 'loungeCode,loungeName,cityName,cityCode,cityEnName,countryCode,countryName,countryEnName,siteName,siteCode,siteType,terminalName,terminalCode,businessHours,deductPoints,loungeType,domesticForeign,address,latitude,longitude,serviceName\n';
            const csvData = formattedLounges.map(lounge => 
              `"${lounge.loungeCode}","${lounge.loungeName}","${lounge.cityName}","${lounge.cityCode}","${lounge.cityEnName}","${lounge.countryCode}","${lounge.countryName}","${lounge.countryEnName}","${lounge.siteName}","${lounge.siteCode}","${lounge.siteType}","${lounge.terminalName}","${lounge.terminalCode}","${lounge.businessHours}","${lounge.deductPoints}","${lounge.loungeType}","${lounge.domesticForeign}","${lounge.address}","${lounge.latitude}","${lounge.longitude}","${lounge.serviceName}"`
            ).join('\n');
            
            fs.writeFileSync(csvFile, csvHeader + csvData, 'utf8');
            console.log(`💾 贵宾厅数据CSV已保存到: ${csvFile}`);
            
            // 统计贵宾厅信息
            const domesticCount = formattedLounges.filter(lounge => lounge.domesticForeign === '国内').length;
            const internationalCount = formattedLounges.filter(lounge => lounge.domesticForeign === '境外').length;
            
            console.log('');
            console.log('📊 贵宾厅统计:');
            console.log(`  🇨🇳 国内贵宾厅: ${domesticCount} 个`);
            console.log(`  🌍 国外贵宾厅: ${internationalCount} 个`);
            console.log(`  📍 总计: ${formattedLounges.length} 个贵宾厅`);
            console.log('');
            
            // 按机场分组统计
            const airportGroups = {};
            formattedLounges.forEach(lounge => {
              const key = `${lounge.siteName} (${lounge.cityName})`;
              if (!airportGroups[key]) {
                airportGroups[key] = 0;
              }
              airportGroups[key]++;
            });
            
            console.log('🏢 按机场分组统计:');
            Object.entries(airportGroups).forEach(([airport, count]) => {
              console.log(`  ${airport}: ${count} 个贵宾厅`);
            });
            console.log('');
            
            // 显示前几个贵宾厅作为示例
            console.log('🏛️ 贵宾厅数据示例 (前5个):');
            formattedLounges.slice(0, 5).forEach((lounge, index) => {
              const countryFlag = lounge.domesticForeign === '国内' ? '🇨🇳' : '🌍';
              console.log(`${index + 1}. ${countryFlag} ${lounge.loungeName} - ${lounge.siteName} [${lounge.cityName}]`);
              console.log(`   营业时间: ${lounge.businessHours} | 积分: ${lounge.deductPoints} | 类型: ${lounge.loungeType}`);
            });
            
            if (formattedLounges.length > 5) {
              console.log(`... 还有 ${formattedLounges.length - 5} 个贵宾厅`);
            }
            
          } else {
            console.log('⚠️ 未找到有效的贵宾厅数据');
          }
        }
        
      } catch (decryptError) {
        console.error('❌ 解密失败:', decryptError.message);
        console.error('解密错误详情:', decryptError);
      }
    } else {
      console.log('⚠️ 响应中没有sdData字段，无法解密');
    }
    
    console.log('');
    console.log('🏁 获取贵宾厅数据完成');
    
  } catch (error) {
    console.error('❌ 获取贵宾厅数据失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
    console.error('错误详情:', error);
    process.exit(1);
  }
}

// 显示使用说明
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
获取贵宾厅数据脚本使用说明:

基本用法:
  node getLoungeData.js

使用自定义参数:
  node getLoungeData.js --json='{"domesticForeign":"1","cityCode":"210300"}'

参数说明:
  --json=JSON_STRING  自定义请求参数，JSON格式
  
  常用参数:
  - domesticForeign: "1"(国内) 或 "2"(国外)
  - cityCode: 城市代码 (如: "210300" 大连)
  - siteCode: 机场代码 (如: "ZD65139" 大连周水子国际机场)
  - countryCode: 国家代码 (如: "CN" 中国, "MO" 澳门)
  - page: 页码 (默认: 1)
  - size: 每页数量 (默认: 10)
  - loungeType: 贵宾厅类型 (默认: "3")
  
  --help, -h         显示此帮助信息

输出文件:
  - lounges.json     JSON格式的贵宾厅数据
  - lounges.csv      CSV格式的贵宾厅数据

示例:
  # 获取大连机场的贵宾厅
  node getLoungeData.js --json='{"domesticForeign":"1","cityCode":"210300","siteCode":"ZD65139"}'
  
  # 获取澳门机场的贵宾厅
  node getLoungeData.js --json='{"domesticForeign":"2","countryCode":"MO","cityCode":"820100","siteCode":"ZD22669"}'
`);
  process.exit(0);
}

// 运行获取贵宾厅数据
getLoungeData();
