const botToken = '8240028274:AAF6GXsZr4BRcsh_smsMgJrj4M5yWOoivpw';
const webhookUrl = 'https://3000-i0ovh96evdxwggmrl8tpz-d731c093.sg1.manus.computer/api/telegram/webhook';

// 设置 Webhook
const setWebhookResponse = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: webhookUrl }),
});

const setWebhookResult = await setWebhookResponse.json();
console.log('✅ Telegram Webhook 设置结果:', JSON.stringify(setWebhookResult, null, 2));

// 获取 Webhook 信息
const getWebhookResponse = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
const getWebhookResult = await getWebhookResponse.json();
console.log('\n📋 当前 Webhook 信息:', JSON.stringify(getWebhookResult, null, 2));

// 获取 Bot 信息
const getMeResponse = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
const getMeResult = await getMeResponse.json();
console.log('\n🤖 Bot 信息:', JSON.stringify(getMeResult, null, 2));
