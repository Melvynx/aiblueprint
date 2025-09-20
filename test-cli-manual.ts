#!/usr/bin/env bun

// Manual CLI test - run with: bun test-cli-manual.ts
// This tests the real CLI without any Vitest mocking interference

import { execSync } from 'child_process';
import fs from 'fs-extra';

async function testCLI() {
  const tempDir = `./tmp/manual-test-${Date.now()}`;

  console.log(`🧪 Testing CLI with directory: ${tempDir}`);

  try {
    // Ensure tmp directory exists
    await fs.ensureDir('./tmp');

    console.log('⚡ Executing CLI command...');
    const output = execSync(`bun src/cli.ts claude-code -f "${tempDir}" --skip setup`, {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: 'inherit' // Show output in real time
    });

    console.log('✅ CLI command completed');

    // Wait a bit for any async operations
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if files were created
    const settingsExists = await fs.pathExists(`${tempDir}/settings.json`);
    const scriptsExists = await fs.pathExists(`${tempDir}/scripts`);
    const dirExists = await fs.pathExists(tempDir);

    console.log('\n📊 Results:');
    console.log(`Directory exists: ${dirExists}`);
    console.log(`settings.json exists: ${settingsExists}`);
    console.log(`scripts/ directory exists: ${scriptsExists}`);

    if (dirExists) {
      const contents = await fs.readdir(tempDir);
      console.log(`Directory contents: ${contents.join(', ')}`);
    }

    if (settingsExists) {
      const settings = JSON.parse(await fs.readFile(`${tempDir}/settings.json`, 'utf-8'));
      console.log('settings.json structure:', Object.keys(settings));
    }

    if (settingsExists && scriptsExists) {
      console.log('🎉 SUCCESS: CLI created files correctly!');
    } else {
      console.log('❌ FAILURE: CLI did not create expected files');
    }

  } catch (error) {
    console.error('❌ Error running CLI:', error);
  }
}

// Run the test
testCLI();