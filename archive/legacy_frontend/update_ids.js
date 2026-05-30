const fs = require('fs');
const path = require('path');

const dir = 'd:/TMS Project/TMS test new/modules';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

files.forEach(file => {
    const p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf8');

    // Pattern: 'PRE-' + String(this.array.length + 1).padStart(3, '0')
    const regex = /'([A-Z0-9]+)-' \+ String\(this\.([a-zA-Z0-9_]+)\.length \+ 1\)\.padStart\((2|3),\s*'0'\)/g;

    let modified = false;
    content = content.replace(regex, (match, prefix, arrayName, padding) => {
        modified = true;
        return `RefNumberGenerator.generateSequential('${prefix}', this.${arrayName}, ${padding})`;
    });

    // Special case for accounting.js
    if (file === 'accounting.js') {
        const accRegex = /const i = this\.entries\.length \+ 1;[\s\S]*?'TXN-' \+ String\(i\)\.padStart\(3, '0'\).*?'MAN-' \+ i/;
        if (accRegex.test(content)) {
            content = content.replace(
                /const i = this\.entries\.length \+ 1;([^]*?)id: 'TXN-' \+ String\(i\)\.padStart\(3, '0'\)([^]*?)ref: 'MAN-' \+ i/,
                (match, p1, p2) => {
                    modified = true;
                    return `const id = RefNumberGenerator.generateSequential('TXN', this.entries);${p1}id: id${p2}ref: 'MAN-' + id.split('-')[1]`;
                }
            );
        }
    }

    if (modified) {
        fs.writeFileSync(p, content, 'utf8');
        console.log(`Updated ${file}`);
    }
});
