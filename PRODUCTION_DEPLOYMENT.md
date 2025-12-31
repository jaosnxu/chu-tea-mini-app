# CHU TEA 生产环境发布指南

## 📋 发布前检查清单

在发布到生产环境之前，请确保：

- ✅ 所有功能已测试完成
- ✅ 数据库迁移已执行（`pnpm db:push`）
- ✅ 环境变量已正确配置
- ✅ 已保存最新的 checkpoint
- ✅ 支付网关已配置并测试

## 🚀 发布步骤

### 步骤 1：在 Manus 中发布项目

1. **打开 Manus 管理界面**
   - 在对话页面右侧找到管理面板
   - 如果没有显示，点击右上角的图标展开

2. **进入 Dashboard 或 Settings**
   - 点击 "Dashboard" 标签页
   - 或点击 "Settings" → "General"

3. **点击 Publish 按钮**
   - 在页面顶部（通常在右上角）找到 "Publish" 按钮
   - 点击后系统会自动构建和部署

4. **获取生产域名**
   - 发布成功后，您会获得一个永久域名
   - 格式：`https://chu-tea-xxxxx.manus.space`
   - 这个域名不会因沙箱休眠而失效

### 步骤 2：配置 Telegram Bot

#### 方法 A：使用 BotFather 配置 Web App

1. **打开 Telegram，搜索 @BotFather**

2. **配置 Menu Button**
   ```
   /mybots
   ```
   - 选择您的 "CHU TEA bot"
   - 选择 "Bot Settings"
   - 选择 "Menu Button"
   - 选择 "Configure Menu Button"

3. **输入生产域名**
   ```
   https://chu-tea-xxxxx.manus.space
   ```
   （替换为您实际的域名）

4. **输入按钮文字**
   ```
   打开小程序
   ```

#### 方法 B：使用命令直接配置

```
/setmenubutton
```
- 选择您的 bot
- 输入生产域名
- 输入按钮文字

### 步骤 3：配置自定义域名（可选）

如果您想使用自己的域名（如 `app.chutea.ru`）：

1. **在 Manus Settings → Domains 中绑定域名**
   - 点击 "Add Custom Domain"
   - 输入您的域名
   - 按照提示配置 DNS 记录

2. **在域名提供商处添加 DNS 记录**
   - 类型：CNAME
   - 名称：app（或您想要的子域名）
   - 值：按 Manus 提示的值配置

3. **等待 DNS 生效**（通常需要几分钟到几小时）

4. **在 Telegram Bot 中更新域名**
   - 使用新的自定义域名替换 manus.space 域名

## 🔧 生产环境配置

### 环境变量检查

确保以下环境变量已正确配置（在 Manus Settings → Secrets 中）：

**必需的系统变量**（自动注入）：
- `DATABASE_URL` - 数据库连接字符串
- `JWT_SECRET` - JWT 签名密钥
- `OAUTH_SERVER_URL` - OAuth 服务器地址
- `VITE_APP_ID` - 应用 ID

**支付相关**（需要手动添加）：
- `YOOKASSA_SHOP_ID` - YooKassa 商户 ID
- `YOOKASSA_SECRET_KEY` - YooKassa 密钥

**IIKO 集成**（如果使用）：
- `IIKO_API_LOGIN` - IIKO API 登录名
- `IIKO_ORGANIZATION_ID` - IIKO 组织 ID

### 数据库迁移

在发布前确保数据库 schema 是最新的：

```bash
pnpm db:push
```

### 初始数据准备

1. **创建管理员账户**
   - 首次登录后，在数据库中将用户的 `role` 字段改为 `admin`
   - 或使用 Database 管理界面直接修改

2. **配置系统设置**
   - 登录后台 `/admin/delivery-settings` 配置配送方式
   - 访问 `/admin/points-rules` 配置积分规则
   - 添加商品分类和商品

## 📱 Telegram Bot 完整配置

### 基本信息配置

在 @BotFather 中配置：

1. **Bot 名称和描述**
   ```
   /setname - 设置 bot 名称
   /setdescription - 设置 bot 描述
   /setabouttext - 设置关于文本
   ```

2. **Bot 头像**
   ```
   /setuserpic - 上传 bot 头像
   ```

3. **命令列表**
   ```
   /setcommands
   ```
   建议的命令：
   ```
   start - 开始使用
   menu - 查看菜单
   orders - 我的订单
   help - 帮助
   ```

### Web App 配置

```
/newapp
```
- 选择您的 bot
- 输入 Web App 标题：CHU TEA
- 输入 Web App 描述：在线点单和积分商城
- 上传 Web App 图标（512x512 PNG）
- 输入 Web App URL：您的生产域名

## 🔒 安全建议

1. **启用 HTTPS**
   - Manus 自动提供 HTTPS
   - 自定义域名也会自动配置 SSL 证书

2. **保护敏感信息**
   - 不要在代码中硬编码密钥
   - 使用 Manus Secrets 管理所有敏感信息

3. **限制管理员权限**
   - 只给必要的用户分配 admin 角色
   - 定期审查管理员列表

4. **监控异常活动**
   - 定期检查订单和支付记录
   - 关注异常的积分变动

## 📊 监控和维护

### 查看应用状态

在 Manus Dashboard 中可以查看：
- 访问量统计（UV/PV）
- 服务器状态
- 错误日志

### 数据库备份

Manus 会自动备份数据库，但建议：
- 定期导出重要数据
- 在 Database 管理界面中可以导出 CSV

### 更新应用

1. 在 Manus 中修改代码
2. 保存新的 checkpoint
3. 再次点击 Publish 按钮
4. 用户会自动获得最新版本

## 🆘 常见问题

### Q: 发布后小程序打不开？
A: 检查：
- Telegram Bot 中配置的域名是否正确
- 域名是否可以在浏览器中正常访问
- OAuth 回调地址是否正确配置

### Q: 支付功能不工作？
A: 检查：
- YooKassa 密钥是否正确配置
- 回调 URL 是否在 YooKassa 后台正确设置
- 测试模式和生产模式的密钥不同

### Q: 如何回滚到之前的版本？
A: 
- 在 Manus 管理界面找到之前的 checkpoint
- 点击 "Rollback" 按钮
- 再次点击 Publish

### Q: 如何查看错误日志？
A:
- 在 Manus Dashboard 中查看服务器日志
- 或在浏览器控制台查看前端错误

## 📞 技术支持

如有问题，请访问：
- Manus 帮助中心：https://help.manus.im
- Telegram 支持群：（如果有）

## 🎉 发布完成检查

发布后请测试以下功能：

- [ ] 用户可以正常登录
- [ ] 可以浏览商品和菜单
- [ ] 可以添加到购物车
- [ ] 可以创建订单
- [ ] 支付功能正常
- [ ] 积分系统工作正常
- [ ] 优惠券可以使用
- [ ] 管理员后台可以访问
- [ ] 订单状态更新正常
- [ ] Telegram 通知正常发送

全部测试通过后，您的 CHU TEA 小程序就可以正式运营了！🎊
