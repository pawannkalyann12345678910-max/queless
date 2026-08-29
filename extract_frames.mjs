import fs from 'fs';
import path from 'path';
import ffmpeg from 'ffmpeg-static';
import { execSync } from 'child_process';

const framesDir = path.join(process.cwd(), 'public', 'frames');
if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });

const src = 'C:/Users/Admin/Downloads/Comparing_queue_and_smart_token_202608291352.mp4';
console.log('Extracting 30 FPS frames from', src, 'to', framesDir);

try {
  execSync(`"${ffmpeg}" -y -i "${src}" -r 30 -q:v 2 "${path.join(framesDir, 'frame_%03d.jpg')}"`, { stdio: 'inherit' });
  const files = fs.readdirSync(framesDir);
  console.log('✅ Total extracted frames:', files.length);
} catch (e) {
  console.error('Error extracting frames:', e);
}
