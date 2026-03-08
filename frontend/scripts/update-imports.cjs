const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');

function walkDir(dir) {
    let files = [];
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        if (fs.statSync(fullPath).isDirectory()) {
            files = files.concat(walkDir(fullPath));
        } else if (/\.(js|jsx|ts|tsx)$/.test(fullPath)) {
            files.push(fullPath);
        }
    }
    return files;
}

const allFiles = walkDir(srcDir);
let changedFiles = 0;

for (const file of allFiles) {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('firebase/config')) {
        let newContent = content.replace(/(['"])(\.\.\/)*firebase\/config(['"])/g, (match, p1, p2, p3) => {
            return `${p1}${p2 || ''}services/firebase${p3}`;
        });
        if (content !== newContent) {
            fs.writeFileSync(file, newContent, 'utf8');
            console.log('Updated:', file);
            changedFiles++;
        }
    }
}
console.log(`Updated ${changedFiles} files.`);
