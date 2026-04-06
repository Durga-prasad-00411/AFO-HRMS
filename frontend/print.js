const fs = require('fs');
const data = JSON.parse(fs.readFileSync('eslint_report.json', 'utf16le'));
data.forEach(f => {
    if (f.messages && f.messages.length > 0) {
        console.log("FILE:", f.filePath);
        f.messages.forEach(m => console.log(`  ${m.line}:${m.column} ${m.message}`));
    }
});
