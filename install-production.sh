#!/bin/bash

# CHU TEA Mini App - 生产环境一键安装脚本
# 适用于：Ubuntu 22.04 LTS
# 服务器：腾讯云轻量应用服务器

set -e  # 遇到错误立即退出

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}CHU TEA Mini App - 生产环境一键安装${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}请使用 root 用户运行此脚本${NC}"
  echo "使用命令: sudo bash install-production.sh"
  exit 1
fi

# 1. 更新系统
echo -e "${YELLOW}[1/12] 更新系统软件包...${NC}"
apt update && apt upgrade -y
echo -e "${GREEN}✓ 系统更新完成${NC}"
echo ""

# 2. 安装基础工具
echo -e "${YELLOW}[2/12] 安装基础工具...${NC}"
apt install -y curl wget git unzip software-properties-common
echo -e "${GREEN}✓ 基础工具安装完成${NC}"
echo ""

# 3. 安装 Node.js 22
echo -e "${YELLOW}[3/12] 安装 Node.js 22...${NC}"
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
node --version
npm --version
echo -e "${GREEN}✓ Node.js 安装完成${NC}"
echo ""

# 4. 安装 pnpm
echo -e "${YELLOW}[4/12] 安装 pnpm...${NC}"
npm install -g pnpm
pnpm --version
echo -e "${GREEN}✓ pnpm 安装完成${NC}"
echo ""

# 5. 安装 PM2
echo -e "${YELLOW}[5/12] 安装 PM2 进程管理器...${NC}"
npm install -g pm2
pm2 --version
echo -e "${GREEN}✓ PM2 安装完成${NC}"
echo ""

# 6. 安装 MySQL
echo -e "${YELLOW}[6/12] 安装 MySQL 8.0...${NC}"
apt install -y mysql-server
systemctl start mysql
systemctl enable mysql
echo -e "${GREEN}✓ MySQL 安装完成${NC}"
echo ""

# 7. 配置 MySQL
echo -e "${YELLOW}[7/12] 配置 MySQL 数据库...${NC}"
mysql -e "CREATE DATABASE IF NOT EXISTS chu_tea_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS 'chu_tea_user'@'localhost' IDENTIFIED BY 'ChuTea2025!@#';"
mysql -e "GRANT ALL PRIVILEGES ON chu_tea_db.* TO 'chu_tea_user'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"
echo -e "${GREEN}✓ MySQL 配置完成${NC}"
echo -e "${BLUE}数据库名: chu_tea_db${NC}"
echo -e "${BLUE}用户名: chu_tea_user${NC}"
echo -e "${BLUE}密码: ChuTea2025!@#${NC}"
echo ""

# 8. 克隆项目代码
echo -e "${YELLOW}[8/12] 克隆项目代码...${NC}"
cd /var/www
if [ -d "chu-tea-mini-app" ]; then
  echo "项目目录已存在，正在更新..."
  cd chu-tea-mini-app
  git pull origin main
else
  git clone https://github.com/jaosnxu/chu-tea-mini-app.git
  cd chu-tea-mini-app
fi
echo -e "${GREEN}✓ 项目代码克隆完成${NC}"
echo ""

# 9. 创建环境变量文件
echo -e "${YELLOW}[9/12] 配置环境变量...${NC}"
cat > .env << 'EOF'
# 数据库配置
DATABASE_URL="mysql://chu_tea_user:ChuTea2025!@#@localhost:3306/chu_tea_db"

# JWT 密钥
JWT_SECRET="$(openssl rand -hex 32)"

# 应用配置
NODE_ENV="production"
PORT=3000
VITE_APP_TITLE="CHU TEA"
VITE_APP_LOGO="/logo.png"

# Telegram 配置（需要后续配置）
TELEGRAM_BOT_TOKEN=""
TELEGRAM_WEBHOOK_URL="http://43.166.239.99:3000/api/telegram/webhook"

# 支付配置（需要后续配置）
YOOKASSA_SHOP_ID=""
YOOKASSA_SECRET_KEY=""

# IIKO 配置（需要后续配置）
IIKO_API_URL=""
IIKO_LOGIN=""
IIKO_ORGANIZATION_ID=""
EOF

# 生成真实的 JWT_SECRET
JWT_SECRET=$(openssl rand -hex 32)
sed -i "s/\$(openssl rand -hex 32)/$JWT_SECRET/" .env

echo -e "${GREEN}✓ 环境变量配置完成${NC}"
echo ""

# 10. 安装项目依赖
echo -e "${YELLOW}[10/12] 安装项目依赖（可能需要几分钟）...${NC}"
pnpm install --frozen-lockfile
echo -e "${GREEN}✓ 依赖安装完成${NC}"
echo ""

# 11. 数据库迁移
echo -e "${YELLOW}[11/12] 执行数据库迁移...${NC}"
pnpm db:push
echo -e "${GREEN}✓ 数据库迁移完成${NC}"
echo ""

# 12. 构建项目
echo -e "${YELLOW}[12/12] 构建项目...${NC}"
pnpm build
echo -e "${GREEN}✓ 项目构建完成${NC}"
echo ""

# 启动服务
echo -e "${YELLOW}启动应用服务...${NC}"
pm2 start ecosystem.config.js
pm2 save
pm2 startup
echo -e "${GREEN}✓ 应用服务启动完成${NC}"
echo ""

# 配置防火墙
echo -e "${YELLOW}配置防火墙规则...${NC}"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
echo "y" | ufw enable
echo -e "${GREEN}✓ 防火墙配置完成${NC}"
echo ""

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}🎉 安装完成！${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "${BLUE}访问地址: http://43.166.239.99:3000${NC}"
echo ""
echo -e "${YELLOW}数据库信息：${NC}"
echo "  数据库名: chu_tea_db"
echo "  用户名: chu_tea_user"
echo "  密码: ChuTea2025!@#"
echo ""
echo -e "${YELLOW}常用命令：${NC}"
echo "  查看应用状态: pm2 status"
echo "  查看应用日志: pm2 logs chu-tea-app"
echo "  重启应用: pm2 restart chu-tea-app"
echo "  停止应用: pm2 stop chu-tea-app"
echo ""
echo -e "${YELLOW}下一步：${NC}"
echo "  1. 配置 Telegram Bot Token（编辑 /var/www/chu-tea-mini-app/.env）"
echo "  2. 配置支付信息（YooKassa）"
echo "  3. 配置域名和 SSL 证书"
echo "  4. 测试系统功能"
echo ""
echo -e "${GREEN}部署完成！祝您使用愉快！${NC}"
echo ""
