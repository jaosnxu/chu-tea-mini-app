# CHU TEA Mini App - 生产环境部署文档

## 📋 目录

1. [服务器要求](#服务器要求)
2. [环境准备](#环境准备)
3. [数据库配置](#数据库配置)
4. [项目部署](#项目部署)
5. [Nginx 配置](#nginx-配置)
6. [SSL 证书配置](#ssl-证书配置)
7. [进程管理](#进程管理)
8. [环境变量配置](#环境变量配置)
9. [常见问题](#常见问题)

---

## 🖥️ 服务器要求

### 最低配置
- **CPU**: 2核
- **内存**: 4GB
- **硬盘**: 40GB SSD
- **操作系统**: Ubuntu 20.04/22.04 或 CentOS 7/8
- **网络**: 公网 IP，开放 80、443、3000 端口

### 推荐配置
- **CPU**: 4核
- **内存**: 8GB
- **硬盘**: 80GB SSD

---

## 🔧 环境准备

### 1. 更新系统

```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS
sudo yum update -y
```

### 2. 安装 Node.js 22.x

```bash
# 使用 nvm 安装（推荐）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22

# 或者使用 NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 3. 安装 pnpm

```bash
npm install -g pnpm
```

### 4. 安装 PM2（进程管理）

```bash
npm install -g pm2
```

### 5. 安装 Nginx

```bash
# Ubuntu/Debian
sudo apt install nginx -y

# CentOS
sudo yum install nginx -y

# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 6. 安装 Git

```bash
# Ubuntu/Debian
sudo apt install git -y

# CentOS
sudo yum install git -y
```

---

## 🗄️ 数据库配置

### 选项 1: 使用腾讯云 TencentDB（推荐）

1. 在腾讯云控制台创建 MySQL 实例
2. 选择版本: MySQL 8.0
3. 配置规格: 至少 2核4GB
4. 创建数据库: `chu_tea_db`
5. 记录连接信息:
   - 主机地址
   - 端口（默认 3306）
   - 用户名
   - 密码

### 选项 2: 在服务器上安装 MySQL

```bash
# Ubuntu/Debian
sudo apt install mysql-server -y

# CentOS
sudo yum install mysql-server -y

# 启动 MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# 安全配置
sudo mysql_secure_installation

# 创建数据库和用户
sudo mysql -u root -p
```

```sql
CREATE DATABASE chu_tea_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'chu_tea_user'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON chu_tea_db.* TO 'chu_tea_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## 🚀 项目部署

### 1. 克隆代码

```bash
cd /var/www
sudo git clone https://github.com/jaosnxu/chu-tea-mini-app.git
cd chu-tea-mini-app
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
nano .env
```

**必填环境变量：**

```env
# 数据库配置
DATABASE_URL="mysql://username:password@host:3306/chu_tea_db"

# JWT 密钥（随机生成）
JWT_SECRET="your-random-jwt-secret-key-here"

# Telegram 配置
TELEGRAM_BOT_TOKEN="your-telegram-bot-token"
TELEGRAM_WEBHOOK_URL="https://yourdomain.com/api/telegram/webhook"

# YooKassa 支付配置
YOOKASSA_SHOP_ID="your-shop-id"
YOOKASSA_SECRET_KEY="your-secret-key"

# IIKO 配置（可选）
IIKO_API_URL="https://api-ru.iiko.services"
IIKO_LOGIN="your-iiko-login"
IIKO_ORGANIZATION_ID="your-organization-id"

# 应用配置
NODE_ENV="production"
PORT=3000
VITE_APP_TITLE="CHU TEA"
VITE_APP_LOGO="/logo.png"
```

### 3. 安装依赖

```bash
pnpm install --frozen-lockfile
```

### 4. 数据库迁移

```bash
pnpm db:push
```

### 5. 构建项目

```bash
pnpm build
```

### 6. 启动服务

```bash
# 使用 PM2 启动
pm2 start ecosystem.config.js

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
```

---

## 🌐 Nginx 配置

### 1. 创建 Nginx 配置文件

```bash
sudo nano /etc/nginx/sites-available/chu-tea
```

### 2. 配置内容

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL 证书配置（稍后配置）
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # SSL 优化
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # 日志
    access_log /var/log/nginx/chu-tea-access.log;
    error_log /var/log/nginx/chu-tea-error.log;

    # 反向代理到 Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 静态文件缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 3. 启用配置

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/chu-tea /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

---

## 🔒 SSL 证书配置

### 使用 Let's Encrypt（免费）

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx -y

# 自动配置 SSL
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 自动续期
sudo certbot renew --dry-run
```

### 使用腾讯云 SSL 证书

1. 在腾讯云申请免费 SSL 证书
2. 下载 Nginx 格式证书
3. 上传到服务器 `/etc/nginx/ssl/`
4. 更新 Nginx 配置中的证书路径

---

## 🔄 进程管理

### PM2 配置文件（ecosystem.config.js）

```javascript
module.exports = {
  apps: [{
    name: 'chu-tea-app',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
```

### PM2 常用命令

```bash
# 启动应用
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs

# 重启应用
pm2 restart chu-tea-app

# 停止应用
pm2 stop chu-tea-app

# 删除应用
pm2 delete chu-tea-app

# 监控
pm2 monit
```

---

## 🔐 环境变量配置

### 生成 JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 配置 Telegram Webhook

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://yourdomain.com/api/telegram/webhook"}'
```

---

## 🔄 更新部署

### 1. 拉取最新代码

```bash
cd /var/www/chu-tea-mini-app
git pull origin main
```

### 2. 安装新依赖

```bash
pnpm install
```

### 3. 数据库迁移

```bash
pnpm db:push
```

### 4. 重新构建

```bash
pnpm build
```

### 5. 重启服务

```bash
pm2 restart chu-tea-app
```

---

## 🐛 常见问题

### 1. 端口被占用

```bash
# 查看端口占用
sudo lsof -i :3000

# 杀死进程
sudo kill -9 <PID>
```

### 2. 数据库连接失败

- 检查 DATABASE_URL 是否正确
- 检查数据库服务是否运行
- 检查防火墙规则

### 3. Nginx 502 错误

- 检查 Node.js 应用是否运行
- 检查端口配置是否正确
- 查看 Nginx 错误日志

### 4. SSL 证书问题

```bash
# 查看证书有效期
sudo certbot certificates

# 手动续期
sudo certbot renew
```

### 5. 内存不足

```bash
# 创建 Swap 分区
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 📊 监控和日志

### 查看应用日志

```bash
# PM2 日志
pm2 logs chu-tea-app

# Nginx 访问日志
sudo tail -f /var/log/nginx/chu-tea-access.log

# Nginx 错误日志
sudo tail -f /var/log/nginx/chu-tea-error.log
```

### 系统监控

```bash
# 查看系统资源
htop

# 查看磁盘使用
df -h

# 查看内存使用
free -h
```

---

## 🔒 安全建议

1. **防火墙配置**
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

2. **定期备份数据库**
```bash
mysqldump -u username -p chu_tea_db > backup_$(date +%Y%m%d).sql
```

3. **定期更新系统和依赖**
```bash
sudo apt update && sudo apt upgrade -y
pnpm update
```

4. **使用环境变量存储敏感信息**，不要硬编码在代码中

5. **启用 HTTPS**，强制使用 SSL 加密

---

## 📞 技术支持

如有问题，请联系：
- GitHub Issues: https://github.com/jaosnxu/chu-tea-mini-app/issues
- Email: jason2896666@gmail.com

---

**部署完成后，访问您的域名即可使用 CHU TEA Mini App！** 🎉
