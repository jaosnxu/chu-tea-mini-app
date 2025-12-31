import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 源图标路径
const SOURCE_ICON = path.resolve(__dirname, '../client/public/images/brand-logo.png');
const OUTPUT_DIR = path.resolve(__dirname, '../client/public/icons');

// 需要生成的图标尺寸
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// 生成图标
async function generateIcons() {
  console.log('🎨 Generating PWA icons...\n');

  // 确保输出目录存在
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 检查源图标是否存在
  if (!fs.existsSync(SOURCE_ICON)) {
    console.error(`❌ Source icon not found: ${SOURCE_ICON}`);
    return;
  }

  // 生成标准图标
  for (const size of SIZES) {
    const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);
    
    try {
      await sharp(SOURCE_ICON)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated: icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`❌ Failed to generate ${size}x${size}:`, error.message);
    }
  }

  // 生成 maskable 图标（带安全区域）
  for (const size of [192, 512]) {
    const outputPath = path.join(OUTPUT_DIR, `icon-maskable-${size}x${size}.png`);
    const padding = Math.floor(size * 0.1); // 10% 安全区域
    
    try {
      await sharp(SOURCE_ICON)
        .resize(size - padding * 2, size - padding * 2, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .extend({
          top: padding,
          bottom: padding,
          left: padding,
          right: padding,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated: icon-maskable-${size}x${size}.png`);
    } catch (error) {
      console.error(`❌ Failed to generate maskable ${size}x${size}:`, error.message);
    }
  }

  console.log('\n✨ PWA icons generated successfully!');
}

generateIcons().catch(console.error);
