/**
 * 初始化 Telegram API 配置
 * 运行: node server/init-telegram-config.mjs
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { apiConfigs } from '../drizzle/schema.js';
import { eq, and } from 'drizzle-orm';

async function initTelegramConfig() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);

  try {
    // 检查是否已存在 Telegram 配置
    const existing = await db.select()
      .from(apiConfigs)
      .where(and(
        eq(apiConfigs.provider, 'telegram'),
        eq(apiConfigs.category, 'notification')
      ))
      .limit(1);

    if (existing.length > 0) {
      console.log('✓ Telegram API 配置已存在，跳过初始化');
      return;
    }

    // 创建 Telegram API 配置
    await db.insert(apiConfigs).values({
      provider: 'telegram',
      category: 'notification',
      nameZh: 'Telegram Bot',
      nameRu: 'Telegram Bot',
      nameEn: 'Telegram Bot',
      config: {
        apiKey: '',
        webhookUrl: '',
      },
      isActive: false,
      lastTestAt: null,
      lastTestResult: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('✓ Telegram API 配置初始化成功');
  } catch (error) {
    console.error('✗ 初始化失败:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

initTelegramConfig()
  .then(() => {
    console.log('完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('错误:', error);
    process.exit(1);
  });
