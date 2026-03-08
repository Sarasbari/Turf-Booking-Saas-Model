const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');
const errors = fs.readFileSync(path.join(__dirname, '../ts_errors_clean.txt'), 'utf8').split('\n');

const filesToFix = {
    components: [],
    pages: []
};

for (const line of errors) {
    const match = line.match(/^src\/(.+?)\.tsx?\(\d+,\d+\): error TS2307: Cannot find module '(.+?)'/);
    if (match) {
        const file = path.join(__dirname, '../', `src/${match[1]}.tsx`); // or ts
        const actualFile = fs.existsSync(file) ? file : file.replace(/\.tsx$/, '.ts');
        
        let content = fs.readFileSync(actualFile, 'utf8');
        const brokenImport = match[2];
        
        if (brokenImport.startsWith('../services/firebase') && actualFile.includes(path.sep + 'pages' + path.sep)) {
            // inside pages, it was deeply nested so `../services` is wrong, needs `../../services`
            content = content.replace(/from '\.\.\/services\/firebase'/g, "from '../../services/firebase'");
        } else if (actualFile.includes(path.sep + 'components' + path.sep)) {
            // inside components, it moved 1 level deeper
            if (brokenImport.startsWith('../../')) {
                const fixedImport = brokenImport.replace('../../', '../../../');
                content = content.replace(`from '${brokenImport}'`, `from '${fixedImport}'`);
            } else if (brokenImport.startsWith('../')) {
                // if it's pointing to another component that is now in a different place?
                // actually we only saw TS2307 for things like `../LocationModal/LocationModal` or `../ToastContainer/...`
                // LocationModal is now in ../../features/LocationModal/LocationModal
                // ToastContainer is now in ../../ui/ToastContainer/ToastContainer
                // Just let's do a naive replace for those two specifics
                if (brokenImport.includes('LocationModal')) {
                    content = content.replace(`from '${brokenImport}'`, `from '../../features/LocationModal/LocationModal'`);
                } else if (brokenImport.includes('ToastContainer')) {
                    content = content.replace(`from '${brokenImport}'`, `from '../../ui/ToastContainer/ToastContainer'`);
                }
            }
        }
        
        fs.writeFileSync(actualFile, content, 'utf8');
        console.log('Fixed imports in', path.relative(__dirname, actualFile));
    }
}
