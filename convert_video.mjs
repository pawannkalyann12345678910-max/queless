import ffmpeg from 'ffmpeg-static';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const src = 'C:/Users/Admin/Downloads/Comparing_queue_and_smart_token_202608291352.mp4';
const dstDir = path.join(process.cwd(), 'public', 'videos');
if (!fs.existsSync(dstDir)) {
  fs.mkdirSync(dstDir, { recursive: true });
}

const dst = path.join(dstDir, 'hero_comparison_30fps.mp4');

console.log('Using ffmpeg path:', ffmpeg);
console.log('Converting', src, 'to 30 FPS at', dst);

try {
  execSync(`"${ffmpeg}" -y -i "${src}" -r 30 -c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p -movflags +faststart "${dst}"`, {
    stdio: 'inherit'
  });
  console.log('✅ Video converted to 30 FPS successfully!');
} catch (err) {
  console.error('Error during ffmpeg conversion:', err);
}
