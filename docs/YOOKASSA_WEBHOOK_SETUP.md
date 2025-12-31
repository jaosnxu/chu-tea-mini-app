# YooKassa Webhook 配置指南

本文档说明如何在 YooKassa 控制台配置 Webhook，以便自动接收支付状态更新通知。

## 为什么需要配置 Webhook？

Webhook 允许 YooKassa 在支付状态发生变化时（如支付成功、失败、退款等）主动通知您的服务器，而不需要您的应用程序不断轮询支付状态。这样可以：

- **实时更新订单状态**：用户支付成功后立即更新订单状态
- **提高系统效率**：避免频繁的 API 调用
- **改善用户体验**：用户完成支付后立即看到订单状态变化

## Webhook URL

您的 Webhook URL 格式如下：

```
https://your-domain.com/api/yookassa/webhook
```

请将 `your-domain.com` 替换为您的实际域名。例如：

- 如果您的网站是 `https://chutea.manus.space`，则 Webhook URL 为 `https://chutea.manus.space/api/yookassa/webhook`
- 如果您使用自定义域名 `https://chutea.ru`，则 Webhook URL 为 `https://chutea.ru/api/yookassa/webhook`

## 配置步骤

### 1. 登录 YooKassa 控制台

访问 [YooKassa 控制台](https://yookassa.ru/my) 并使用您的账号登录。

### 2. 进入 Webhook 设置

1. 在左侧菜单中找到 **"Настройки"**（设置）
2. 点击 **"Уведомления"**（通知）或 **"HTTP-уведомления"**（HTTP 通知）

### 3. 添加 Webhook URL

1. 在 **"URL для уведомлений"**（通知 URL）字段中输入您的 Webhook URL
2. 选择要接收的通知类型（建议全选）：
   - ✅ **payment.succeeded** - 支付成功
   - ✅ **payment.canceled** - 支付取消
   - ✅ **payment.waiting_for_capture** - 等待确认
   - ✅ **refund.succeeded** - 退款成功
   - ✅ **refund.canceled** - 退款取消

### 4. 保存配置

点击 **"Сохранить"**（保存）按钮保存配置。

### 5. 测试 Webhook

YooKassa 控制台通常提供测试功能：

1. 在 Webhook 配置页面找到 **"Отправить тестовое уведомление"**（发送测试通知）按钮
2. 点击按钮发送测试通知
3. 检查您的服务器日志，确认收到测试通知

## Webhook 安全性

我们的系统已经实现了 Webhook 签名验证，确保只有来自 YooKassa 的合法请求才会被处理。验证逻辑位于 `server/yookassa.ts` 文件中。

## 常见问题

### Q: Webhook URL 必须是 HTTPS 吗？

**A:** 是的，YooKassa 要求 Webhook URL 必须使用 HTTPS 协议，以确保数据传输安全。

### Q: 如何查看 Webhook 日志？

**A:** 您可以在以下位置查看 Webhook 日志：

1. **YooKassa 控制台**：在通知设置页面可以看到发送历史和响应状态
2. **服务器日志**：在后台管理 → 操作日志中查看 Webhook 处理记录

### Q: Webhook 请求失败怎么办？

**A:** 如果 Webhook 请求失败，YooKassa 会自动重试。重试策略：

- 第 1 次重试：1 分钟后
- 第 2 次重试：5 分钟后
- 第 3 次重试：1 小时后
- 第 4 次重试：6 小时后
- 第 5 次重试：24 小时后

### Q: 如何测试本地开发环境的 Webhook？

**A:** 本地开发时，您可以使用以下工具将本地服务器暴露到公网：

1. **ngrok**：`ngrok http 3000`
2. **localtunnel**：`lt --port 3000`
3. **Cloudflare Tunnel**：`cloudflared tunnel --url localhost:3000`

获取公网 URL 后，在 YooKassa 控制台配置该 URL 即可。

## 支持的 Webhook 事件

我们的系统目前处理以下 Webhook 事件：

| 事件类型 | 说明 | 处理逻辑 |
|---------|------|---------|
| `payment.succeeded` | 支付成功 | 更新订单状态为"已支付"，更新支付记录状态 |
| `payment.canceled` | 支付取消 | 更新支付记录状态为"已取消" |
| `payment.waiting_for_capture` | 等待确认 | 更新支付记录状态为"处理中" |
| `refund.succeeded` | 退款成功 | 更新订单状态为"已退款"，更新支付记录状态 |

## 技术细节

### Webhook 请求格式

YooKassa 发送的 Webhook 请求格式如下：

```json
{
  "type": "notification",
  "event": "payment.succeeded",
  "object": {
    "id": "2d8b8e0a-000f-5000-8000-18db351245c7",
    "status": "succeeded",
    "amount": {
      "value": "100.00",
      "currency": "RUB"
    },
    "metadata": {
      "orderId": "123",
      "userId": "456"
    },
    "created_at": "2025-12-31T10:00:00.000Z"
  }
}
```

### 响应要求

您的服务器必须在 10 秒内返回 HTTP 200 状态码，否则 YooKassa 会认为请求失败并进行重试。

我们的实现会立即返回 200 状态码，然后异步处理 Webhook 数据，确保不会超时。

## 相关文件

- `server/yookassa.ts` - YooKassa 服务实现，包含 Webhook 处理逻辑
- `server/_core/index.ts` - Express 路由配置，注册 Webhook 端点
- `drizzle/schema.ts` - 数据库表定义，包含支付记录表

## 更多信息

- [YooKassa API 文档](https://yookassa.ru/developers/api)
- [YooKassa Webhook 文档](https://yookassa.ru/developers/using-api/webhooks)
- [YooKassa Node.js SDK](https://github.com/a2seven/yookassa-sdk-nodejs)
