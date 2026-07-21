const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const srcDir = path.resolve(__dirname);
const githubDir = path.join(srcDir, 'github');
const destDir = path.join(githubDir, 'Watbus');
const zipFile = path.join(githubDir, 'Watbus-Ready.zip');

// Files and directories to ignore during packaging
// CRITICAL: db-store.json is ignored to prevent overwriting production data
const ignoreList = [
  'node_modules',
  '.git',
  'dist',
  'whatsapp-sessions',
  'github',
  '.gemini',
  'startup-error.log',
  '.env',
  'db-store.json',
  'db-store.json.tmp'
];

console.log('Starting packaging process...');

// 1. Build frontend
console.log('Building frontend and backend...');
try {
  execSync('npm run build:local', { stdio: 'inherit', cwd: srcDir });
} catch (err) {
  console.error('Build failed!', err);
  process.exit(1);
}

// 2. Clear destination
if (fs.existsSync(destDir)) {
  fs.rmSync(destDir, { recursive: true, force: true });
}
if (fs.existsSync(zipFile)) {
  fs.rmSync(zipFile, { force: true });
}

// 3. Copy files
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  if (ignoreList.includes(path.basename(src))) return;
  if (exists && stats.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

console.log('Copying files to staging directory...');
copyRecursiveSync(srcDir, destDir);
console.log('Copy complete.');

// 4. Create ZIP
console.log('Creating ZIP archive...');
try {
  execSync(`powershell -Command "Compress-Archive -Path '${destDir}' -DestinationPath '${zipFile}' -Force"`, { stdio: 'inherit', cwd: srcDir });
  console.log(`\n✅ Packaging complete! File ready at: ${zipFile}`);
} catch (err) {
  console.error('Failed to create ZIP archive!', err);
}
