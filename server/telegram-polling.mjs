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

    // 发送欢迎消息（带有 Web App 按钮）
    const welcomeMessage = `🍵 *欢迎来到 CHU TEA!*

您好！感谢您使用 CHU TEA 奶茶点单系统。

点击下方按钮开始点单吧！

---
🇷🇺 *Добро пожаловать в CHU TEA!*

Нажмите кнопку ниже, чтобы начать заказ.`;

    await sendMessageWithButton(chatId, welcomeMessage);
  } else if (text === '/help') {
    const helpMessage = `📖 CHU TEA Bot 帮助

可用命令：
/start - 获取验证码并绑定账号
/help - 显示此帮助信息

如需帮助，请联系系统管理员。`;

    await sendMessage(chatId, helpMessage);
  }
}

// 发送带按钮的消息
async function sendMessageWithButton(chatId, text) {
  const webAppUrl = 'https://3000-i0ovh96evdxwggmrl8tpz-d731c093.sg1.manus.computer';
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🍵 打开 CHU TEA / Открыть приложение',
                web_app: { url: webAppUrl }
              }
            ]
          ]
        }
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
