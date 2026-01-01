/**
 * 俄罗斯短信服务 - SMS.ru
 * 文档: https://sms.ru/api
 */

/**
 * 发送短信验证码
 * @param phone 手机号（俄罗斯格式，如 +79123456789）
 * @param code 验证码
 * @returns 是否发送成功
 */
export async function sendSMS(phone: string, code: string): Promise<boolean> {
  // 从环境变量获取 SMS.ru API Key
  const apiKey = process.env.SMS_RU_API_KEY;
  
  if (!apiKey) {
    console.error('[SMS] SMS_RU_API_KEY not configured');
    // 开发环境下，打印验证码到控制台
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SMS] Development mode - Verification code for ${phone}: ${code}`);
      return true;
    }
    return false;
  }

  try {
    const message = `Ваш код подтверждения CHU TEA: ${code}. Действителен 5 минут.`;
    
    const url = new URL('https://sms.ru/sms/send');
    url.searchParams.append('api_id', apiKey);
    url.searchParams.append('to', phone);
    url.searchParams.append('msg', message);
    url.searchParams.append('json', '1'); // 返回 JSON 格式

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status === 'OK' && data.status_code === 100) {
      console.log(`[SMS] Sent verification code to ${phone}`);
      return true;
    } else {
      console.error('[SMS] Failed to send SMS:', data);
      return false;
    }
  } catch (error) {
    console.error('[SMS] Error sending SMS:', error);
    return false;
  }
}

/**
 * 生成 6 位数字验证码
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * 验证俄罗斯手机号格式
 * @param phone 手机号
 * @returns 是否有效
 */
export function isValidRussianPhone(phone: string): boolean {
  // 俄罗斯手机号格式：+7 后跟 10 位数字
  // 支持格式：+79123456789, 79123456789, 89123456789
  const regex = /^(\+?7|8)?[0-9]{10}$/;
  return regex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

/**
 * 格式化俄罗斯手机号为标准格式
 * @param phone 手机号
 * @returns 标准格式手机号（+79123456789）
 */
export function formatRussianPhone(phone: string): string {
  // 移除所有非数字字符
  const digits = phone.replace(/\D/g, '');
  
  // 如果以 8 开头，替换为 7
  if (digits.startsWith('8') && digits.length === 11) {
    return '+7' + digits.substring(1);
  }
  
  // 如果以 7 开头
  if (digits.startsWith('7') && digits.length === 11) {
    return '+' + digits;
  }
  
  // 如果只有 10 位，添加 +7
  if (digits.length === 10) {
    return '+7' + digits;
  }
  
  return phone;
}
