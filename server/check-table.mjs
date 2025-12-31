import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

const [rows] = await connection.query('DESCRIBE adminTelegramBindings');
console.log('表结构:');
rows.forEach(row => {
  console.log(`  ${row.Field}: ${row.Type} ${row.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${row.Default ? `DEFAULT ${row.Default}` : ''}`);
});

await connection.end();
