'use strict';

// The in-app IME is a standalone JavaScript asset. Build just this patch
// for an existing compatible desktop installation, without rebuilding CEF.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const relative = 'apps/common/main/lib/util/vietnamese-ime.js';
const source = path.join(root, relative);
execFileSync(process.execPath, ['--check', source], { stdio: 'inherit' });
execFileSync(process.execPath, [path.join(root, 'test/vietnamese-ime.test.js')], { stdio: 'inherit' });
const target = path.join(root, 'deploy/web-apps', relative);
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.copyFileSync(source, target);
const manifest = {
    asset: relative,
    sha256: crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex'),
    buildType: 'standalone JavaScript IME asset; not a desktop binary or full Grunt build'
};
fs.writeFileSync(path.join(root, 'deploy/vietnamese-ime.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest, null, 2));
