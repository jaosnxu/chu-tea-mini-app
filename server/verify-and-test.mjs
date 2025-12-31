import mysql from 'mysql2/promise';

const botToken = '8240028274:AAF6GXsZr4BRcsh_smsMgJrj4M5yWOoivpw';
const chatId = '7604922557';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// 1. 将绑定状态设为已验证
await connection.query(
  `UPDATE adminTelegramBindings 
   SET isVerified = 1, verifiedAt = NOW() 
   WHERE telegramChatId = ?`,
  [chatId]
);
console.log('✅ 绑定状态已更新为已验证');

// 2. 发送测试通知
const testMessage = `🎉 *绑定成功！*

您的 Telegram 账号已成功绑定到 CHU TEA 通知系统。

这是一条测试通知，确认您可以正常接收消息。

*已开启的通知类型：*
• 🛒 新订单提醒
• 📦 库存预警
• ⚠️ 支付失败提醒
• 🚨 系统警报

感谢您使用 CHU TEA！`;

const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    chat_id: chatId,
    text: testMessage,
    parse_mode: 'Markdown',
  }),
});

const result = await response.json();
if (result.ok) {
  console.log('✅ 测试通知已发送');
} else {
  console.log('❌ 发送失败:', result.description);
}

// 3. 发送模拟的新订单通知
const orderMessage = `🛒 *新订单通知*

订单号：CHU20251231TEST001
下单时间：2025-12-31 20:45:00

*订单详情：*
• 珍珠奶茶 x 2 - ₽280
• 芒果冰沙 x 1 - ₽160

订单金额：₽440
支付状态：已支付 ✅

门店：莫斯科红场店
配送方式：外卖配送

请及时处理订单！`;

const orderResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    chat_id: chatId,
    text: orderMessage,
    parse_mode: 'Markdown',
  }),
});

const orderResult = await orderResponse.json();
if (orderResult.ok) {
  console.log('✅ 模拟订单通知已发送');
} else {
  console.log('❌ 发送失败:', orderResult.description);
}

await connection.end();
console.log('\n🎉 所有测试完成！请检查您的 Telegram 是否收到了通知。');
