const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

const version = pkg.version || '1.0.0';
const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);

if (!match) {
  console.error(`Invalid version format: ${version}. Expected m.n.p`);
  process.exit(1);
}

let m = parseInt(match[1], 10);
let n = parseInt(match[2], 10);
let p = parseInt(match[3], 10);

// Increment patch (p)
p += 1;

// Handle carries (each digit max 9)
if (p > 9) {
  p = 0;
  n += 1;
}
if (n > 9) {
  n = 0;
  m += 1;
}

const newVersion = `${m}.${n}.${p}`;
pkg.version = newVersion;

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
console.log(`Version bumped: ${version} -> ${newVersion}`);
