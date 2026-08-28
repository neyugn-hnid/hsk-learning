const fs = require('fs');

const content = fs.readFileSync('app/routes/admin.tsx', 'utf8');

// Check JSX tags match
const tags = [];
const regex = /<(\/)?([A-Za-z0-9_]+)([^>]*?)(\/)?>/g;
let match;
let line = 1;
let lastIndex = 0;

const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  const lineContent = lines[i];
  // Simple tag matcher ignoring strings / comments
  const tagRegex = /<\/?([A-Za-z0-9_\.]+)[^>]*?>/g;
  let m;
  while ((m = tagRegex.exec(lineContent)) !== null) {
    const full = m[0];
    const isClose = full.startsWith('</');
    const isSelfClose = full.endsWith('/>') || full.startsWith('<input') || full.startsWith('<img') || full.startsWith('<br') || full.startsWith('<hr');
    const tagName = m[1];
    
    // Ignore html self closing or components
    if (!isSelfClose && !isClose) {
      tags.push({ tag: tagName, line: i + 1, full });
    } else if (isClose) {
      if (tags.length === 0) {
        console.log(`Extra close tag </${tagName}> at line ${i + 1}`);
      } else {
        const last = tags.pop();
        if (last.tag !== tagName) {
          console.log(`Mismatched tag at line ${i + 1}: expected </${last.tag}> (opened at ${last.line}), got </${tagName}>`);
        }
      }
    }
  }
}

console.log('Remaining unclosed tags:', tags);
