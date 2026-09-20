const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '..', 'dist');
const indexPath = path.join(distPath, 'index.html');

if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf-8');
  html = html.replace(/\scrossorigin(="[^"]*")?/g, '');
  fs.writeFileSync(indexPath, html);
  console.log('Removed crossorigin from index.html');
}
