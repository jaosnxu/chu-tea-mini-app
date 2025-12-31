const botToken = '8240028274:AAF6GXsZr4BRcsh_smsMgJrj4M5yWOoivpw';
const webAppUrl = 'https://3000-i0ovh96evdxwggmrl8tpz-d731c093.sg1.manus.computer';

console.log('🤖 配置 Telegram Bot Web App...\n');

// 1. 设置 Bot 菜单按钮（左下角的菜单按钮）
console.log('1️⃣ 设置菜单按钮...');
const menuButtonResponse = await fetch(`https://api.telegram.org/bot${botToken}/setChatMenuButton`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    menu_button: {
      type: 'web_app',
      text: '🍵 打开 CHU TEA',
      web_app: {
        url: webAppUrl
      }
    }
  }),
});
const menuButtonResult = await menuButtonResponse.json();
console.log('   结果:', menuButtonResult.ok ? '✅ 成功' : '❌ 失败');
if (!menuButtonResult.ok) console.log('   错误:', menuButtonResult.description);

// 2. 设置 Bot 命令列表
console.log('\n2️⃣ 设置命令列表...');
const commandsResponse = await fetch(`https://api.telegram.org/bot${botToken}/setMyCommands`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    commands: [
      { command: 'start', description: '🚀 开始使用 / Начать' },
      { command: 'menu', description: '🍵 查看菜单 / Меню' },
      { command: 'order', description: '📦 我的订单 / Мои заказы' },
      { command: 'help', description: '❓ 帮助 / Помощь' },
    ]
  }),
});
const commandsResult = await commandsResponse.json();
console.log('   结果:', commandsResult.ok ? '✅ 成功' : '❌ 失败');
if (!commandsResult.ok) console.log('   错误:', commandsResult.description);

// 3. 获取当前 Bot 信息确认配置
console.log('\n3️⃣ 获取 Bot 信息...');
const botInfoResponse = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
const botInfo = await botInfoResponse.json();
console.log('   Bot 名称:', botInfo.result.first_name);
console.log('   用户名:', '@' + botInfo.result.username);

// 4. 获取菜单按钮配置
console.log('\n4️⃣ 获取菜单按钮配置...');
const getMenuResponse = await fetch(`https://api.telegram.org/bot${botToken}/getChatMenuButton`);
const menuInfo = await getMenuResponse.json();
console.log('   菜单类型:', menuInfo.result.type);
if (menuInfo.result.type === 'web_app') {
  console.log('   按钮文字:', menuInfo.result.text);
  console.log('   Web App URL:', menuInfo.result.web_app.url);
}

console.log('\n🎉 配置完成！');
console.log('\n📱 用户现在可以通过以下方式进入 CHU TEA Mini App:');
console.log('   1. 点击 Bot 对话框左下角的菜单按钮');
console.log('   2. 点击欢迎消息中的"打开应用"按钮');
