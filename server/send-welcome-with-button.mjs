const botToken = '8240028274:AAF6GXsZr4BRcsh_smsMgJrj4M5yWOoivpw';
const chatId = '7604922557';
const webAppUrl = 'https://3000-i0ovh96evdxwggmrl8tpz-d731c093.sg1.manus.computer';

console.log('📱 发送带有 Web App 按钮的欢迎消息...\n');

const welcomeMessage = `🍵 *欢迎来到 CHU TEA!*

您好！感谢您使用 CHU TEA 奶茶点单系统。

*我们提供：*
• 🧋 新鲜现制奶茶
• 🍹 果茶和冰沙
• 🎁 会员专属优惠
• 🚚 快速配送服务

点击下方按钮开始点单吧！

---
🇷🇺 *Добро пожаловать в CHU TEA!*

Нажмите кнопку ниже, чтобы открыть приложение.`;

const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    chat_id: chatId,
    text: welcomeMessage,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🍵 打开 CHU TEA / Открыть',
            web_app: { url: webAppUrl }
          }
        ],
        [
          {
            text: '📋 查看菜单 / Меню',
            web_app: { url: webAppUrl + '/menu' }
          },
          {
            text: '📦 我的订单 / Заказы',
            web_app: { url: webAppUrl + '/orders' }
          }
        ],
        [
          {
            text: '🛒 商城 / Магазин',
            web_app: { url: webAppUrl + '/mall' }
          },
          {
            text: '👤 个人中心 / Профиль',
            web_app: { url: webAppUrl + '/profile' }
          }
        ]
      ]
    }
  }),
});

const result = await response.json();
if (result.ok) {
  console.log('✅ 欢迎消息已发送！');
  console.log('\n请在 Telegram 中查看消息，点击按钮即可进入 Mini App。');
} else {
  console.log('❌ 发送失败:', result.description);
}
