const https = require('https');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'apps', 'web', 'public');
const dirs = ['how-it-works', 'how-it-works/lot-images', 'icons'];

// Create directories if not exist
dirs.forEach(d => {
  const fullPath = path.join(publicDir, d);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

const files = [
  { url: 'https://www.directliquidation.com/assets/how-it-works/headline-desktop.png', dest: 'how-it-works/headline-desktop.png' },
  { url: 'https://www.directliquidation.com/assets/how-it-works/headline-mobile.png', dest: 'how-it-works/headline-mobile.png' },
  { url: 'https://www.directliquidation.com/assets/how-it-works/lot-images/hs.png', dest: 'how-it-works/lot-images/hs.png' },
  { url: 'https://www.directliquidation.com/assets/how-it-works/lot-images/ferguson.png', dest: 'how-it-works/lot-images/ferguson.png' },
  { url: 'https://www.directliquidation.com/assets/how-it-works/lot-images/walmart.png', dest: 'how-it-works/lot-images/walmart.png' },
  { url: 'https://www.directliquidation.com/assets/how-it-works/lot-images/jcpenny.png', dest: 'how-it-works/lot-images/jcpenny.png' },
  { url: 'https://www.directliquidation.com/assets/icons/handshake.svg', dest: 'icons/handshake.svg' },
  { url: 'https://www.directliquidation.com/assets/icons/money-under-loupe.svg', dest: 'icons/money-under-loupe.svg' },
  { url: 'https://www.directliquidation.com/assets/icons/money-in-hand.svg', dest: 'icons/money-in-hand.svg' }
];

async function download() {
  for (const file of files) {
    const destPath = path.join(publicDir, file.dest);
    console.log(`Downloading ${file.url} to ${destPath}`);
    await new Promise((resolve, reject) => {
      const fileStream = fs.createWriteStream(destPath);
      https.get(file.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
        }
      }, (res) => {
        if (res.statusCode !== 200) {
          console.error(`Failed to get ${file.url} (Status: ${res.statusCode})`);
          resolve(); 
          return;
        }
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          console.log(`Success: ${file.dest}`);
          resolve();
        });
      }).on('error', (err) => {
        console.error(`Error downloading ${file.url}: ${err.message}`);
        fs.unlink(destPath, () => resolve());
      });
    });
  }
}

download().then(() => console.log('Done downloading.'));
