const fs = require('fs');
let code = fs.readFileSync('frontend/js/ui.js', 'utf8');

const oldBlock = `    menu.forEach(item => {
        const card = document.createElement('div');
        card.className = 'menu-card';
        card.dataset.category = item.category;
        card.dataset.name = item.name;
        
        if (item.is_ramen) {
            card.onclick = () => window.openRamen(item.name);
        } else {
            card.onclick = () => window.addMenuItem(item.name);
        }

        card.innerHTML = \`
            <img src="\${item.image_url || 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=800'}" alt="\${item.name}">`;

const newBlock = `    menu.forEach(item => {
        const card = document.createElement('div');
        const isUnavailable = item.is_available === 0 || item.is_available === false;
        card.className = \`menu-card \${isUnavailable ? 'out-of-stock' : ''}\`;
        card.dataset.category = item.category;
        card.dataset.name = item.name;
        
        if (!isUnavailable) {
            if (item.is_ramen) {
                card.onclick = () => window.openSheetForItem(item.name, 'new');
            } else {
                card.onclick = () => window.openSheetForItem(item.name, 'new');
            }
        }

        card.innerHTML = \`
            \${isUnavailable ? '<div class="out-of-stock-overlay"><div class="out-of-stock-badge">Out of Stock</div></div>' : ''}
            <img src="\${item.image_url || 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=800'}" alt="\${item.name}">`;

// Also fix it if it's in an intermediate broken state from regexes
code = code.replace(oldBlock, newBlock);

if (!code.includes('isUnavailable')) {
    code = code.replace(/window\.addMenuItem\(item\.name\)/, "window.openSheetForItem(item.name, 'new')");
    code = code.replace(/window\.openRamen\(item\.name\)/, "window.openSheetForItem(item.name, 'new')");
}

fs.writeFileSync('frontend/js/ui.js', code);
