import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

const chatId = '7604922557';
const username = 'Jason Xu';
const verificationCode = '159325';

// 先删除旧记录
await connection.query(
  'DELETE FROM adminTelegramBindings WHERE telegramChatId = ?',
  [chatId]
);

// 插入新记录（adminUserId 设为 1，表示系统管理员）
const [result] = await connection.query(
  `INSERT INTO adminTelegramBindings 
   (adminUserId, telegramChatId, telegramUsername, verificationCode, isVerified, createdAt) 
   VALUES (?, ?, ?, ?, ?, NOW())`,
  [1, chatId, username, verificationCode, false]
);

console.log('✅ 验证码记录已插入');
console.log('   Chat ID:', chatId);
console.log('   验证码:', verificationCode);
console.log('   用户名:', username);

// 查看插入的记录
const [rows] = await connection.query(
  'SELECT * FROM adminTelegramBindings WHERE telegramChatId = ?',
  [chatId]
);
console.log('\n📋 记录详情:', rows[0]);

await connection.end();
