import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '../drizzle/schema.ts';

const botToken = '8240028274:AAF6GXsZr4BRcsh_smsMgJrj4M5yWOoivpw';
const chatId = 7604922557;
const username = 'Jason Xu';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { schema, mode: 'default' });

// 生成6位验证码
const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30分钟后过期

console.log('🔐 生成验证码:', verificationCode);

// 保存到数据库
try {
  await db.insert(schema.adminTelegramBindings).values({
    telegramChatId: chatId.toString(),
    telegramUsername: username,
    verificationCode,
    isVerified: false,
    expiresAt,
    createdAt: new Date(),
  });
  console.log('✅ 验证码已保存到数据库');
} catch (error) {
  console.log('⚠️ 数据库保存提示:', error.message);
}

// 发送验证码消息
const message = `🎉 欢迎使用 CHU TEA 通知系统！

您的验证码是: *${verificationCode}*

请在后台管理系统中输入此验证码完成绑定：
1. 登录后台管理系统
2. 点击右上角的通知铃铛 🔔
3. 在"Telegram 绑定"部分输入验证码
4. 点击"绑定"按钮

验证码有效期：30分钟

绑定成功后，您将收到以下通知：
• 🛒 新订单提醒
• 📦 库存预警
• ⚠️ 支付失败提醒
• 🚨 系统警报`;

const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    chat_id: chatId,
    text: message,
    parse_mode: 'Markdown',
  }),
});

const result = await response.json();
if (result.ok) {
  console.log('✅ 验证码消息已发送到 Telegram');
} else {
  console.log('❌ 发送失败:', result.description);
}

await connection.end();
