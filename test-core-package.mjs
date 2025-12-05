/**
 * POC: Test npm-shared-library-core functions
 */

import { 
  getWinCCOAInstallationPathByVersion,
  getAvailableWinCCOAVersions,
  getWindowsAvailableVersions 
} from '../npm-shared-library-core/dist/utils/winccoa-paths.js';

console.log('=== WinCC OA Core Package POC ===\n');

// Test 1: Get available versions
console.log('📦 Available WinCC OA Versions:');
const versions = getAvailableWinCCOAVersions();
console.log(versions);
console.log(`Found ${versions.length} version(s)\n`);

// Test 2: Get installation paths for each version
console.log('📁 Installation Paths:');
versions.forEach(version => {
  const path = getWinCCOAInstallationPathByVersion(version);
  console.log(`  ${version}: ${path || 'NOT FOUND'}`);
});
console.log('');

// Test 3: Try specific version (might not exist)
console.log('🔍 Test specific version (3.20):');
const path320 = getWinCCOAInstallationPathByVersion('3.20');
console.log(`  Path: ${path320 || 'NOT FOUND'}\n`);

// Test 4: Windows-specific (if on Windows)
if (process.platform === 'win32') {
  console.log('🪟 Windows-specific function:');
  const winVersions = getWindowsAvailableVersions();
  console.log(winVersions);
} else {
  console.log('🐧 Running on Linux/Unix - Windows function skipped\n');
}

console.log('=== POC Complete ===');

