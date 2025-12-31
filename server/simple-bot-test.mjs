const botToken = '8240028274:AAF6GXsZr4BRcsh_smsMgJrj4M5yWOoivpw';

console.log('🤖 CHU TEA Bot 简单测试');
console.log('📱 请在 Telegram 中向 @CHUTEABOT 发送任何消息\n');
console.log('等待消息中...\n');

let offset = 0;

async function checkUpdates() {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/getUpdates?offset=${offset}&timeout=10`
    );
    const data = await response.json();
    
    console.log('API 响应:', JSON.stringify(data, null, 2));
    
    if (data.ok && data.result.length > 0) {
      for (const update of data.result) {
        offset = update.update_id + 1;
        
        if (update.message) {
          const msg = update.message;
          const chatId = msg.chat.id;
          const text = msg.text || '(无文本)';
          const from = msg.from;
          
          console.log('\n📨 收到消息!');
          console.log('   Chat ID:', chatId);
          console.log('   用户:', from.first_name, from.last_name || '', `(@${from.username || 'N/A'})`);
          console.log('   消息:', text);
          
          // 发送回复
          const replyText = `✅ 收到您的消息: "${text}"\n\n您的 Chat ID 是: ${chatId}\n\n验证码: 123456\n\n请在后台管理系统中使用此验证码完成绑定。`;
          
          const sendResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: replyText,
            }),
          });
          
          const sendResult = await sendResponse.json();
          console.log('   回复结果:', sendResult.ok ? '✅ 成功' : '❌ 失败');
          if (!sendResult.ok) {
            console.log('   错误:', sendResult.description);
          }
        }
      }
    } else {
      console.log('没有新消息');
    }
  } catch (error) {
    console.error('错误:', error.message);
  }
}

// 运行一次检查
await checkUpdates();

console.log('\n测试完成。如果没有收到消息，请确认：');
console.log('1. 您搜索的是 @CHUTEABOT');
console.log('2. 您点击了 Start 按钮');
console.log('3. 您发送了消息');
