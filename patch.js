const fs = require('fs');
let code = fs.readFileSync('frontend/js/ui.js', 'utf8');

code = code.replace(/card\.className = 'menu-card';/, `const isUnavailable = item.is_available === 0 || item.is_available === false;
        card.className = \`menu-card \${isUnavailable ? 'out-of-stock' : ''}\`;`);

code = code.replace(/if \\(item\\.is_ramen\\) \\{/, `if (!isUnavailable) {
            if (item.is_ramen) {`);

code = code.replace(/card\\.onclick = \\(\\) => window\\.addMenuItem\\(item\\.name\\);\n        \\}/, `card.onclick = () => window.addMenuItem(item.name);
            }
        }`);

code = code.replace(/<img src=/, `\${isUnavailable ? '<div class="out-of-stock-overlay"><div class="out-of-stock-badge">Out of Stock</div></div>' : ''}
            <img src=`);

fs.writeFileSync('frontend/js/ui.js', code);
