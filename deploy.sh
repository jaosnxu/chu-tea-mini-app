#!/bin/bash

# CHU TEA Mini App - 一键部署脚本
# 使用方法: bash deploy.sh

set -e  # 遇到错误立即退出

echo "========================================="
echo "CHU TEA Mini App - 自动部署脚本"
echo "========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查是否为 root 用户
if [ "$EUID" -eq 0 ]; then 
  echo -e "${RED}请不要使用 root 用户运行此脚本${NC}"
  exit 1
fi

# 1. 拉取最新代码
echo -e "${YELLOW}[1/7] 拉取最新代码...${NC}"
git pull origin main
echo -e "${GREEN}✓ 代码更新完成${NC}"
echo ""

# 2. 安装依赖
echo -e "${YELLOW}[2/7] 安装依赖...${NC}"
pnpm install --frozen-lockfile
echo -e "${GREEN}✓ 依赖安装完成${NC}"
echo ""

# 3. 数据库迁移
echo -e "${YELLOW}[3/7] 执行数据库迁移...${NC}"
pnpm db:push
echo -e "${GREEN}✓ 数据库迁移完成${NC}"
echo ""

# 4. 构建项目
echo -e "${YELLOW}[4/7] 构建项目...${NC}"
pnpm build
echo -e "${GREEN}✓ 项目构建完成${NC}"
echo ""

# 5. 重启 PM2 服务
echo -e "${YELLOW}[5/7] 重启应用服务...${NC}"
if pm2 list | grep -q "chu-tea-app"; then
  pm2 restart chu-tea-app
  echo -e "${GREEN}✓ 应用重启完成${NC}"
else
  pm2 start ecosystem.config.js
  pm2 save
  echo -e "${GREEN}✓ 应用首次启动完成${NC}"
fi
echo ""

# 6. 清理缓存
echo -e "${YELLOW}[6/7] 清理缓存...${NC}"
pnpm store prune
echo -e "${GREEN}✓ 缓存清理完成${NC}"
echo ""

# 7. 检查服务状态
echo -e "${YELLOW}[7/7] 检查服务状态...${NC}"
pm2 status
echo ""

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}部署完成！${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "查看日志: pm2 logs chu-tea-app"
echo "查看状态: pm2 status"
echo "重启服务: pm2 restart chu-tea-app"
echo ""
