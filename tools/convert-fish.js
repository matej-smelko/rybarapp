const fs = require('fs');
let content = fs.readFileSync('frontend/src/data/fish.js', 'utf8');

content = content.replace('export default [', '');
content = content.replace(/];\s*$/, '');
content = content.replace(/require\('[^']+'\)/g, 'null');
content = content.replace(/require\("[^"]+"\)/g, 'null');

const wrapped = 'module.exports = [' + content + '];';
fs.writeFileSync('backend/seed-fish.js', wrapped);
console.log('Done');
