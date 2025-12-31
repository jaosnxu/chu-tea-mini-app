# CHU TEA Mini App - 生产环境发布检查清单

## 📋 发布前检查清单

### 1. 代码质量检查
- [ ] 所有 TypeScript 错误已修复
- [ ] 所有单元测试通过
- [ ] 代码已提交到最新 checkpoint
- [ ] 没有 console.log 调试代码
- [ ] 没有硬编码的测试数据

### 2. 配置检查
- [ ] 生产环境变量已配置
- [ ] YooKassa 生产环境凭证已配置
- [ ] IIKO API 生产环境配置已完成
- [ ] Telegram Bot Token 已配置
- [ ] 数据库连接已验证

### 3. 功能测试
- [ ] 用户注册和登录流程正常
- [ ] 商品浏览和搜索功能正常
- [ ] 购物车功能正常
- [ ] 订单创建流程正常
- [ ] 支付流程正常（使用测试卡号）
- [ ] 订单状态更新正常
- [ ] Telegram 通知推送正常
- [ ] 积分系统正常
- [ ] 优惠券系统正常
- [ ] 会员升级功能正常

### 4. 性能检查
- [ ] 首屏加载时间 < 3秒
- [ ] 图片已优化（WebP 格式）
- [ ] Service Worker 缓存正常
- [ ] PWA 安装提示正常
- [ ] 移动端响应式布局正常

### 5. 安全检查
- [ ] API 接口已添加权限验证
- [ ] 敏感数据已加密
- [ ] XSS 防护已启用
- [ ] CSRF 防护已启用
- [ ] SQL 注入防护已启用

---

## 🚀 发布步骤

### 步骤 1：在 Manus 界面中发布

1. **打开 Manus 对话页面**
   - 找到右侧的管理面板
   - 如果没有显示，点击右上角的图标展开

2. **找到 Publish 按钮**
   - 在管理面板的顶部导航栏
   - 通常在右上角位置
   - 按钮文字可能是 "Publish" 或 "发布"

3. **点击 Publish 按钮**
   - 系统会自动构建和部署您的网站
   - 等待构建完成（通常需要 1-3 分钟）

4. **获取永久域名**
   - 发布成功后会显示永久域名
   - 格式类似：`chu-tea-xxxxx.manus.space`
   - **复制这个域名**，后续步骤需要使用

---

### 步骤 2：配置 Telegram Bot

1. **打开 Telegram，找到 @BotFather**

2. **配置 Web App URL**
   ```
   /mybots
   ```
   - 选择您的 "CHU TEA bot"
   - 选择 "Bot Settings"
   - 选择 "Menu Button"
   - 选择 "Configure Menu Button"

3. **输入永久域名**
   ```
   https://chu-tea-xxxxx.manus.space
   ```
   （替换为您在步骤 1 中获得的实际域名）

4. **设置按钮文字**
   ```
   打开小程序
   ```

5. **确认配置**
   - 返回您的 bot
   - 检查底部是否出现菜单按钮
   - 点击按钮测试是否能打开小程序

---

### 步骤 3：配置 Webhook（可选，用于接收 Telegram 消息）

如果您需要接收用户发送给 Bot 的消息（如验证码验证），需要配置 Webhook：

1. **在系统后台配置 Webhook URL**
   - 访问 `/admin/api`
   - 找到 Telegram Bot 配置
   - Webhook URL 设置为：
     ```
     https://chu-tea-xxxxx.manus.space/api/telegram/webhook
     ```

2. **测试 Webhook**
   - 在后台点击"测试连接"按钮
   - 确认连接成功

---

### 步骤 4：配置 YooKassa 生产环境

1. **登录 YooKassa 商户后台**
   - 网址：https://yookassa.ru/my

2. **获取生产环境凭证**
   - 进入"设置" → "API 密钥"
   - 复制 Shop ID（商店ID）
   - 创建并复制 Secret Key（密钥）

3. **在系统后台配置**
   - 访问 `/admin/yookassa`
   - 输入 Shop ID 和 Secret Key
   - **取消勾选"测试模式"**
   - 点击"保存配置"

4. **配置 Webhook**
   - 在 YooKassa 后台设置 Webhook URL：
     ```
     https://chu-tea-xxxxx.manus.space/api/payment/yookassa/webhook
     ```
   - 选择需要接收的事件：
     - `payment.succeeded`（支付成功）
     - `payment.canceled`（支付取消）
     - `refund.succeeded`（退款成功）

5. **测试支付**
   - 创建一个测试订单
   - 使用真实银行卡支付小额金额（如 1₽）
   - 确认支付成功并收到通知

---

### 步骤 5：配置 IIKO 生产环境（如果使用）

1. **在系统后台配置 IIKO**
   - 访问 `/admin/iiko`
   - 输入生产环境的 API URL
   - 输入 Login 和密码
   - 输入组织 ID 和终端组 ID

2. **测试连接**
   - 点击"测试连接"按钮
   - 确认连接成功

3. **测试订单同步**
   - 创建一个测试订单
   - 检查 IIKO 监控页面（`/admin/iiko-monitor`）
   - 确认订单已成功同步到 IIKO

---

### 步骤 6：最终测试

1. **完整用户流程测试**
   - 从 Telegram Bot 打开小程序
   - 浏览商品并添加到购物车
   - 创建订单并完成支付
   - 检查是否收到 Telegram 通知
   - 在后台查看订单状态
   - 测试订单状态更新

2. **管理员功能测试**
   - 登录后台管理系统
   - 测试订单管理功能
   - 测试商品管理功能
   - 测试数据分析仪表板
   - 测试退款功能

3. **性能测试**
   - 使用 Google PageSpeed Insights 测试性能
   - 使用 Lighthouse 测试 PWA 评分
   - 在不同设备上测试响应式布局

---

## 🎉 发布完成

恭喜！您的 CHU TEA Mini App 已成功发布到生产环境。

### 后续维护

1. **监控系统状态**
   - 定期检查后台监控页面
   - 关注错误日志
   - 监控支付成功率

2. **数据备份**
   - 定期备份数据库
   - 保存重要配置信息

3. **用户反馈**
   - 收集用户反馈
   - 及时修复 bug
   - 持续优化用户体验

---

## 📞 需要帮助？

如果在发布过程中遇到问题：

1. **检查开发者控制台**
   - 按 F12 打开浏览器开发者工具
   - 查看 Console 和 Network 标签
   - 记录错误信息

2. **查看系统日志**
   - 访问 `/admin/logs`
   - 查找相关错误日志

3. **联系技术支持**
   - Manus 平台支持：https://help.manus.im
   - YooKassa 支持：https://yookassa.ru/docs/support
   - IIKO 支持：https://api-ru.iiko.services

---

## 🔒 安全提示

- ✅ 不要在代码中硬编码 API 密钥
- ✅ 定期更换 API 密钥
- ✅ 限制 API 访问 IP 白名单（如果可能）
- ✅ 启用 HTTPS（Manus 自动提供）
- ✅ 定期更新依赖包
- ✅ 监控异常登录和支付行为

---

**祝您发布顺利！🚀**
