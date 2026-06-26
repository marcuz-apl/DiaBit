const fs = require('fs');
const path = require('path');

const commitMsgFile = process.argv[2];
if (!commitMsgFile) {
  console.error("Missing commit message file path argument.");
  process.exit(1);
}

const pkgPath = path.join(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const version = pkg.version || '1.0.0';

// Read the user-provided commit message
let commitMsg = fs.readFileSync(commitMsgFile, 'utf8').trim();

// Skip formatting for empty messages, merge commits, or messages already containing the build prefix
if (!commitMsg || commitMsg.startsWith('Merge ') || commitMsg.match(/^v\d+\.\d+\.\d+ Build/)) {
  process.exit(0);
}

// Format current local date-time: YYYY-MM-DD-HH-mm
const now = new Date();
const pad = (num) => String(num).padStart(2, '0');
const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}`;

// Combine: vm.n.p Build YYYY-MM-DD-HH-mm feature message
const formattedMsg = `v${version} Build ${timestamp} ${commitMsg}`;

// Save the formatted message back to Git's temporary commit message file
fs.writeFileSync(commitMsgFile, formattedMsg, 'utf8');
console.log(`Commit message formatted: "${formattedMsg}"`);
