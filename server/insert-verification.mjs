import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

const chatId = '7604922557';
const username = 'Jason Xu';
const verificationCode = '159325';
const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

// 先删除旧记录
await connection.query(
  'DELETE FROM adminTelegramBindings WHERE telegramChatId = ?',
  [chatId]
);

// 插入新记录
const [result] = await connection.query(
  `INSERT INTO adminTelegramBindings 
   (telegramChatId, telegramUsername, verificationCode, isVerified, expiresAt, createdAt) 
   VALUES (?, ?, ?, ?, ?, NOW())`,
  [chatId, username, verificationCode, false, expiresAt]
);

console.log('✅ 验证码记录已插入');
console.log('   Chat ID:', chatId);
console.log('   验证码:', verificationCode);
console.log('   过期时间:', expiresAt);

await connection.end();
