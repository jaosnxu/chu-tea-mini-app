const botToken = '8240028274:AAF6GXsZr4BRcsh_smsMgJrj4M5yWOoivpw';
const webhookUrl = 'https://3000-i0ovh96evdxwggmrl8tpz-d731c093.sg1.manus.computer/api/telegram/webhook';

console.log('🔍 测试 Webhook 连接...\n');

// 1. 测试 Webhook URL 是否可访问
console.log('1️⃣ 测试 Webhook URL 可访问性:');
try {
  const testResponse = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ test: true }),
  });
  console.log('   状态码:', testResponse.status);
  console.log('   可访问: ✅\n');
} catch (error) {
  console.log('   可访问: ❌');
  console.log('   错误:', error.message, '\n');
}

// 2. 获取当前 Webhook 信息
console.log('2️⃣ 获取 Telegram Webhook 信息:');
const webhookInfoResponse = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
const webhookInfo = await webhookInfoResponse.json();
console.log('   URL:', webhookInfo.result.url);
console.log('   待处理更新:', webhookInfo.result.pending_update_count);
console.log('   最后错误时间:', webhookInfo.result.last_error_date || '无');
console.log('   最后错误信息:', webhookInfo.result.last_error_message || '无');
console.log('   最大连接数:', webhookInfo.result.max_connections);
console.log('   IP 地址:', webhookInfo.result.ip_address, '\n');

// 3. 测试直接发送消息（需要 chat_id）
console.log('3️⃣ 解决方案:');
console.log('   由于开发环境的 Webhook URL 可能无法被 Telegram 访问，');
console.log('   我们需要使用轮询模式 (getUpdates) 而不是 Webhook 模式。');
console.log('   或者，我们可以使用 ngrok 等工具暴露本地服务器。\n');

// 4. 删除 Webhook，改用轮询模式
console.log('4️⃣ 切换到轮询模式:');
const deleteWebhookResponse = await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook`);
const deleteResult = await deleteWebhookResponse.json();
console.log('   删除 Webhook:', deleteResult.ok ? '✅' : '❌');
console.log('   描述:', deleteResult.description);
