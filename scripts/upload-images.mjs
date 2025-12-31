import { storagePut } from '../server/storage.js';
import fs from 'fs';
import path from 'path';

const images = [
  {
    localPath: '/home/ubuntu/upload/pasted_file_HSZsSU_image.png',
    key: 'products/milk-tea-cup.png',
    description: 'CHU TEA 奶茶杯'
  },
  {
    localPath: '/home/ubuntu/upload/pasted_file_Ho3OvD_image.png',
    key: 'products/fruit-tea-cup.png',
    description: 'CHU TEA 果茶杯'
  },
  {
    localPath: '/home/ubuntu/upload/pasted_file_KGsVYk_image.png',
    key: 'products/pearl-milk-tea.png',
    description: '珍珠奶茶'
  },
  {
    localPath: '/home/ubuntu/upload/pasted_file_Y9yflp_image.png',
    key: 'brand/logo.png',
    description: 'CHU TEA Logo'
  }
];

async function uploadImages() {
  const results = [];
  
  for (const img of images) {
    try {
      const fileBuffer = fs.readFileSync(img.localPath);
      const result = await storagePut(img.key, fileBuffer, 'image/png');
      console.log(`✅ Uploaded ${img.description}: ${result.url}`);
      results.push({ ...img, url: result.url });
    } catch (error) {
      console.error(`❌ Failed to upload ${img.description}:`, error.message);
    }
  }
  
  return results;
}

uploadImages().then(results => {
  console.log('\\n=== Upload Results ===');
  results.forEach(r => console.log(`${r.description}: ${r.url}`));
}).catch(console.error);
