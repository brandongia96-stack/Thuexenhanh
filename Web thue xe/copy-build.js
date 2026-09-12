import fs from 'fs';

try {
  fs.copyFileSync('dist/index.html', 'preview_offline.html');
  console.log('Successfully copied dist/index.html to preview_offline.html');
} catch (err) {
  console.error('Failed to copy dist/index.html to preview_offline.html:', err);
  process.exit(1);
}
