const https = require('https');
const fs = require('fs');

https.get('https://www.directliquidation.com/how-it-works', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const urls = new Set();
    const regex = /https:\/\/[^"'>]+?(?:\.png|\.jpg|\.jpeg|\.svg|\.webp)/g;
    let match;
    while ((match = regex.exec(data)) !== null) {
      urls.add(match[0]);
    }
    console.log(Array.from(urls).join('\n'));
  });
}).on('error', (err) => {
  console.log('Error: ', err.message);
});
