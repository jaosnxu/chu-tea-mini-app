import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '../drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { schema, mode: 'default' });

const botToken = '8240028274:AAF6GXsZr4BRcsh_smsMgJrj4M5yWOoivpw';
const webhookUrl = 'https://3000-i0ovh96evdxwggmrl8tpz-d731c093.sg1.manus.computer/api/telegram/webhook';

// 更新 Telegram API 配置
const result = await db.update(schema.apiConfigs)
  .set({
    apiKey: botToken,
    endpoint: webhookUrl,
    isActive: true,
    config: JSON.stringify({ webhookUrl }),
    updatedAt: new Date(),
  })
  .where(eq(schema.apiConfigs.provider, 'telegram'));

console.log('✅ Telegram Bot Token 已更新');
console.log('Bot Token:', botToken);
console.log('Webhook URL:', webhookUrl);
console.log('更新记录数:', result);

await connection.end();
