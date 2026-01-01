# CHU TEA Mini App - 快速开始指南

## 🚀 5 分钟快速部署

### 前提条件

- 一台腾讯云服务器（Ubuntu 20.04/22.04）
- 域名已解析到服务器 IP
- 服务器已开放 80、443、3000 端口

---

## 📦 方式一：传统部署（推荐新手）

### 1. 登录服务器

```bash
ssh root@your-server-ip
```

### 2. 安装必要软件

```bash
# 更新系统
apt update && apt upgrade -y

# 安装 Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

# 安装 pnpm
npm install -g pnpm

# 安装 PM2
npm install -g pm2

# 安装 Git
apt install git -y

# 安装 MySQL
apt install mysql-server -y
systemctl start mysql
systemctl enable mysql
```

### 3. 配置数据库

```bash
# 登录 MySQL
mysql -u root -p

# 创建数据库和用户
CREATE DATABASE chu_tea_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'chu_tea_user'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON chu_tea_db.* TO 'chu_tea_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 4. 克隆项目

```bash
cd /var/www
git clone https://github.com/jaosnxu/chu-tea-mini-app.git
cd chu-tea-mini-app
```

### 5. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
nano .env
```

**最少需要配置：**

```env
DATABASE_URL="mysql://chu_tea_user:your_password@localhost:3306/chu_tea_db"
JWT_SECRET="your-random-secret-key"
TELEGRAM_BOT_TOKEN="your-bot-token"
```

### 6. 安装依赖和构建

```bash
pnpm install
pnpm db:push
pnpm build
```

### 7. 启动服务

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 8. 配置 Nginx（可选，用于 HTTPS）

```bash
# 安装 Nginx
apt install nginx -y

# 复制配置文件
cp nginx.conf /etc/nginx/sites-available/chu-tea

# 编辑配置，修改域名
nano /etc/nginx/sites-available/chu-tea

# 启用配置
ln -s /etc/nginx/sites-available/chu-tea /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### 9. 配置 SSL 证书

```bash
# 安装 Certbot
apt install certbot python3-certbot-nginx -y

# 自动配置 SSL
certbot --nginx -d yourdomain.com
```

**完成！** 访问 https://yourdomain.com 查看您的应用

---

## 🐳 方式二：Docker 部署（推荐进阶用户）

### 1. 安装 Docker

```bash
# 安装 Docker
curl -fsSL https://get.docker.com | bash

# 安装 Docker Compose
apt install docker-compose -y

# 启动 Docker
systemctl start docker
systemctl enable docker
```

### 2. 克隆项目

```bash
cd /var/www
git clone https://github.com/jaosnxu/chu-tea-mini-app.git
cd chu-tea-mini-app
```

### 3. 配置环境变量

```bash
cp .env.example .env
nano .env
```

### 4. 启动服务

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 查看状态
docker-compose ps
```

**完成！** 访问 http://your-server-ip:3000

---

## 🔄 日常更新流程

### 方式一：使用自动部署脚本

```bash
cd /var/www/chu-tea-mini-app
bash deploy.sh
```

### 方式二：手动更新

```bash
cd /var/www/chu-tea-mini-app
git pull origin main
pnpm install
pnpm db:push
pnpm build
pm2 restart chu-tea-app
```

### 方式三：Docker 更新

```bash
cd /var/www/chu-tea-mini-app
git pull origin main
docker-compose down
docker-compose up -d --build
```

---

## 🔍 常用命令

### PM2 管理

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs chu-tea-app

# 重启应用
pm2 restart chu-tea-app

# 停止应用
pm2 stop chu-tea-app

# 监控
pm2 monit
```

### Docker 管理

```bash
# 查看容器状态
docker-compose ps

# 查看日志
docker-compose logs -f app

# 重启服务
docker-compose restart app

# 停止所有服务
docker-compose down

# 重新构建并启动
docker-compose up -d --build
```

### 数据库管理

```bash
# 备份数据库
mysqldump -u chu_tea_user -p chu_tea_db > backup_$(date +%Y%m%d).sql

# 恢复数据库
mysql -u chu_tea_user -p chu_tea_db < backup_20240101.sql
```

---

## 🐛 故障排查

### 应用无法启动

```bash
# 检查日志
pm2 logs chu-tea-app --lines 100

# 检查端口占用
lsof -i :3000

# 检查环境变量
cat .env
```

### 数据库连接失败

```bash
# 测试数据库连接
mysql -u chu_tea_user -p chu_tea_db

# 检查 MySQL 状态
systemctl status mysql
```

### Nginx 502 错误

```bash
# 检查 Nginx 日志
tail -f /var/log/nginx/error.log

# 检查应用是否运行
pm2 status

# 测试 Nginx 配置
nginx -t
```

---

## 📞 获取帮助

- **详细文档**: 查看 [DEPLOYMENT.md](./DEPLOYMENT.md)
- **GitHub Issues**: https://github.com/jaosnxu/chu-tea-mini-app/issues
- **Email**: jason2896666@gmail.com

---

## ✅ 部署检查清单

- [ ] 服务器已更新到最新版本
- [ ] Node.js 22 已安装
- [ ] MySQL 数据库已配置
- [ ] 环境变量已正确设置
- [ ] 项目代码已克隆
- [ ] 依赖已安装
- [ ] 数据库已迁移
- [ ] 项目已构建
- [ ] PM2 服务已启动
- [ ] Nginx 已配置（可选）
- [ ] SSL 证书已配置（可选）
- [ ] 防火墙规则已设置
- [ ] 域名已正确解析
- [ ] 应用可以正常访问

**祝您部署顺利！** 🎉
