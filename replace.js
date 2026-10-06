const fs = require('fs');
const path = require('path');

const traverse = (dir) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverse(fullPath);
        } else if (fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // Replace standard res.status(xxx).send("string") pattern
            // Note: handles status codes like 403, 404, 500
            const regex = /res\.status\((\d+)\)\.send\((["'])(.*?)\2\)/g;
            const newContent = content.replace(regex, (match, statusCode, quote, errorMsg) => {
                modified = true;
                return `res.status(${statusCode}).render("error", { error: "${errorMsg}", currentUser: req.user || null })`;
            });

            if (modified) {
                fs.writeFileSync(fullPath, newContent, 'utf8');
                console.log(`Updated ${fullPath}`);
            }
        }
    }
};

traverse(path.join(__dirname, 'controllers'));
traverse(path.join(__dirname, 'routes'));
console.log("Done.");
