#!/bin/bash

# 华美机场解析系统 PM2 启动脚本

echo "🚀 启动华美机场解析系统..."

# 进入项目目录
cd "$(dirname "$0")"

# 检查 PM2 是否安装
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 未安装，请先安装 PM2:"
    echo "npm install -g pm2"
    exit 1
fi

# 停止现有进程（如果存在）
echo "🛑 停止现有进程..."
pm2 stop huamei-airport-parser 2>/dev/null || true
pm2 delete huamei-airport-parser 2>/dev/null || true

# 启动应用
echo "🚀 启动应用..."
pm2 start ecosystem.config.js --env production

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup

echo "✅ 华美机场解析系统已启动！"
echo "📱 访问地址: http://localhost:8081/simple.html"
echo "📊 查看状态: pm2 status"
echo "📋 查看日志: pm2 logs huamei-airport-parser"
echo "🔄 重启应用: pm2 restart huamei-airport-parser"
echo "🛑 停止应用: pm2 stop huamei-airport-parser"
