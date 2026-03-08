const { execSync } = require('child_process');
const fs = require('fs');

try {
    const output = execSync('npx tsc --noEmit', { encoding: 'utf8' });
    console.log("No errors!");
} catch (e) {
    fs.writeFileSync('ts_errors_clean.txt', e.stdout, 'utf-8');
    console.log("Wrote errors to ts_errors_clean.txt");
}
