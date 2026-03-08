const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');
const componentsDir = path.join(srcDir, 'components');

const layoutComponents = ['Header', 'Footer', 'NavigationDrawer', 'SubNavigation', 'ScrollToTop.tsx'];
const uiComponents = ['FilterChip', 'SectionHeader', 'Toast', 'ToastContainer', 'SeedButton.jsx'];
// Everything else goes to features
const directories = fs.readdirSync(componentsDir, { withFileTypes: true });

const movedComponents = {
    layout: [],
    ui: [],
    features: []
};

for (const dirent of directories) {
    if (['layout', 'ui', 'features'].includes(dirent.name)) continue;

    const sourcePath = path.join(componentsDir, dirent.name);
    let targetFolder = 'features';

    if (layoutComponents.includes(dirent.name)) {
        targetFolder = 'layout';
    } else if (uiComponents.includes(dirent.name)) {
        targetFolder = 'ui';
    }

    const destPath = path.join(componentsDir, targetFolder, dirent.name);
    fs.renameSync(sourcePath, destPath);
    movedComponents[targetFolder].push(dirent.name.replace(/\.tsx?$|\.jsx?$/, ''));
}

console.log('Moved categories:', movedComponents);

// Now update imports globally
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
    let original = content;

    for (const category of ['layout', 'ui', 'features']) {
        for (const comp of movedComponents[category]) {
            // Replace imports like: import { ... } from '../../components/Header/Header'
            // with: import { ... } from '../../components/layout/Header/Header'
            
            // This regex will capture the relative path portion ending in "/components/"
            // and the component name
            const regex = new RegExp(`(['"])([\\.\\/]*components)\\/(${comp}(?:\\/.*|['"]))`, 'g');
            content = content.replace(regex, `$1$2/${category}/$3`);
        }
    }

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        changedFiles++;
    }
}

console.log(`Updated imports in ${changedFiles} files.`);
