import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '../drizzle/schema.ts';

const botToken = '8240028274:AAF6GXsZr4BRcsh_smsMgJrj4M5yWOoivpw';
let offset = 0;

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { schema, mode: 'default' });

console.log('🤖 CHU TEA Bot 轮询模式已启动');
console.log('📱 请在 Telegram 中搜索 @CHUTEABOT 并发送 /start\n');

// 生成6位验证码
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 轮询获取更新
async function pollUpdates() {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/getUpdates?offset=${offset}&timeout=30`
    );
    const data = await response.json();

    if (data.ok && data.result.length > 0) {
      for (const update of data.result) {
        offset = update.update_id + 1;
        await handleUpdate(update);
      }
    }
  } catch (error) {
    console.error('❌ 轮询错误:', error.message);
  }

  // 继续轮询
  setTimeout(pollUpdates, 1000);
}

// 处理更新
async function handleUpdate(update) {
  const message = update.message;
  if (!message || !message.text) return;

  const chatId = message.chat.id;
  const text = message.text;
  const username = message.from.username || message.from.first_name;

  console.log(`📨 收到消息: ${text} (来自 @${username}, chat_id: ${chatId})`);

  if (text === '/start' || text.toLowerCase() === '/start') {
    // 生成验证码
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟后过期

    // 保存到数据库
    await db.insert(schema.adminTelegramBindings).values({
      telegramChatId: chatId.toString(),
      telegramUsername: username,
      verificationCode,
      isVerified: false,
      expiresAt,
      createdAt: new Date(),
    });

    // 发送欢迎消息
    const welcomeMessage = `🎉 欢迎使用 CHU TEA 通知系统！

您的验证码是: *${verificationCode}*

请在后台管理系统中输入此验证码完成绑定：
1. 登录后台管理系统
2. 点击右上角的通知铃铛
3. 在"Telegram 绑定"部分输入验证码
4. 点击"绑定"按钮

验证码有效期：10分钟

绑定成功后，您将收到以下通知：
• 🛒 新订单提醒
• 📦 库存预警
• ⚠️ 支付失败提醒
• 🚨 系统警报`;

    await sendMessage(chatId, welcomeMessage);
  } else if (text === '/help') {
    const helpMessage = `📖 CHU TEA Bot 帮助

可用命令：
/start - 获取验证码并绑定账号
/help - 显示此帮助信息

如需帮助，请联系系统管理员。`;

    await sendMessage(chatId, helpMessage);
  }
}

// 发送消息
async function sendMessage(chatId, text) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      }),
    });

    const data = await response.json();
    if (data.ok) {
      console.log('✅ 消息已发送');
    } else {
      console.error('❌ 发送失败:', data.description);
    }
  } catch (error) {
    console.error('❌ 发送错误:', error.message);
  }
}

// 开始轮询
pollUpdates();
