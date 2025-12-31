import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 图片目录
const IMAGE_DIRS = [
  path.resolve(__dirname, '../client/public'),
  path.resolve(__dirname, '../attached_assets'),
];

// 支持的图片格式
const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png'];

// 递归查找所有图片文件
function findImages(dir, images = []) {
  if (!fs.existsSync(dir)) {
    return images;
  }

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findImages(filePath, images);
    } else {
      const ext = path.extname(file).toLowerCase();
      if (SUPPORTED_FORMATS.includes(ext)) {
        images.push(filePath);
      }
    }
  }

  return images;
}

// 转换单个图片
async function convertImage(inputPath) {
  const ext = path.extname(inputPath);
  const outputPath = inputPath.replace(ext, '.webp');

  // 如果 WebP 文件已存在，跳过
  if (fs.existsSync(outputPath)) {
    console.log(`⏭️  Skipped (already exists): ${path.basename(outputPath)}`);
    return { skipped: true };
  }

  try {
    const inputStat = fs.statSync(inputPath);
    const inputSize = inputStat.size;

    await sharp(inputPath)
      .webp({ quality: 85 })
      .toFile(outputPath);

    const outputStat = fs.statSync(outputPath);
    const outputSize = outputStat.size;
    const reduction = ((inputSize - outputSize) / inputSize * 100).toFixed(1);

    console.log(`✅ Converted: ${path.basename(inputPath)} → ${path.basename(outputPath)} (${reduction}% smaller)`);

    return {
      inputPath,
      outputPath,
      inputSize,
      outputSize,
      reduction: parseFloat(reduction),
    };
  } catch (error) {
    console.error(`❌ Failed to convert ${inputPath}:`, error.message);
    return { error: true };
  }
}

// 主函数
async function main() {
  console.log('🔍 Searching for images...\n');

  const images = [];
  for (const dir of IMAGE_DIRS) {
    findImages(dir, images);
  }

  if (images.length === 0) {
    console.log('No images found.');
    return;
  }

  console.log(`Found ${images.length} images.\n`);
  console.log('🔄 Converting to WebP...\n');

  const results = [];
  for (const imagePath of images) {
    const result = await convertImage(imagePath);
    if (!result.skipped && !result.error) {
      results.push(result);
    }
  }

  // 统计
  if (results.length > 0) {
    const totalInputSize = results.reduce((sum, r) => sum + r.inputSize, 0);
    const totalOutputSize = results.reduce((sum, r) => sum + r.outputSize, 0);
    const totalReduction = ((totalInputSize - totalOutputSize) / totalInputSize * 100).toFixed(1);

    console.log('\n📊 Summary:');
    console.log(`   Converted: ${results.length} images`);
    console.log(`   Original size: ${(totalInputSize / 1024).toFixed(2)} KB`);
    console.log(`   WebP size: ${(totalOutputSize / 1024).toFixed(2)} KB`);
    console.log(`   Total reduction: ${totalReduction}%`);
  } else {
    console.log('\n✨ All images are already converted!');
  }
}

main().catch(console.error);
