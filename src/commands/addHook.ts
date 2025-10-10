import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getTargetDirectory } from '../utils/claude-config.js';
import { installFileWithGitHubFallback } from '../utils/file-installer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simple spinner replacement for clack.spinner()
class SimpleSpinner {
  private message: string = '';

  start(message: string) {
    this.message = message;
    console.log(chalk.gray(`⏳ ${message}...`));
  }

  stop(message: string) {
    console.log(chalk.green(`✓ ${message}`));
  }
}

interface AddHookOptions {
  folder?: string;
}

const supportedHooks = {
  'post-edit-typescript': {
    name: 'Post Edit TypeScript Hook',
    description: 'Runs Prettier, ESLint, and TypeScript checks after editing TypeScript files',
    hookFile: 'hook-post-file.ts',
    sourceDir: 'scripts',
    targetDir: 'scripts',
    event: 'PostToolUse',
    matcher: 'Edit|Write|MultiEdit'
  }
};

export async function addHookCommand(hookType: string, options: AddHookOptions) {
  console.log(chalk.bgBlue(' aiblueprint-cli '));

  if (!supportedHooks[hookType as keyof typeof supportedHooks]) {
    console.log(chalk.red(`❌ Unsupported hook type: ${hookType}`));
    console.log(chalk.gray('Available hooks:'));
    Object.entries(supportedHooks).forEach(([key, hook]) => {
      console.log(chalk.gray(`  • ${key}: ${hook.description}`));
    });
    process.exit(1);
  }

  const hook = supportedHooks[hookType as keyof typeof supportedHooks];
  const s = new SimpleSpinner();

  // Determine target directory for Claude configuration
  const targetDir = await getTargetDirectory(options);
  const claudeDir = targetDir;
  const targetHookDir = path.join(claudeDir, hook.targetDir || 'hooks');
  const hookFilePath = path.join(targetHookDir, hook.hookFile);
  const settingsPath = path.join(claudeDir, 'settings.json');

  // Check if hook already exists
  if (await fs.pathExists(hookFilePath)) {
    const overwriteAnswer = await inquirer.prompt([{
      type: 'confirm',
      name: 'overwrite',
      message: `Hook file already exists at ${hookFilePath}. Overwrite?`,
    }]);

    if (!overwriteAnswer.overwrite) {
      console.log(chalk.yellow('Hook installation cancelled.'));
      process.exit(0);
    }
  }

  try {
    s.start('Installing hook...');

    // Ensure directories exist
    await fs.ensureDir(targetHookDir);

    // Install hook file using GitHub fallback
    await installFileWithGitHubFallback({
      sourceDir: hook.sourceDir || 'hooks',
      targetPath: hookFilePath,
      fileName: hook.hookFile
    });

    // Make hook executable
    await fs.chmod(hookFilePath, 0o755);

    s.stop('Hook file installed');

    s.start('Updating settings.json...');

    // Update settings.json
    let settings: any = {};
    try {
      const existingSettings = await fs.readFile(settingsPath, 'utf-8');
      settings = JSON.parse(existingSettings);
    } catch {
      // Settings file doesn't exist or is invalid
      settings = {};
    }

    if (!settings.hooks) {
      settings.hooks = {};
    }

    if (!settings.hooks[hook.event]) {
      settings.hooks[hook.event] = [];
    }

    const newHook = {
      matcher: hook.matcher,
      hooks: [
        {
          type: 'command',
          command: `bun $CLAUDE_PROJECT_DIR/.claude/${hook.targetDir || 'hooks'}/${hook.hookFile}`
        }
      ]
    };

    // Check if similar hook already exists
    const existingHook = settings.hooks[hook.event].find((h: any) =>
      h.matcher === hook.matcher &&
      h.hooks?.some((subHook: any) => subHook.command?.includes(hook.hookFile))
    );

    if (existingHook) {
      const replaceAnswer = await inquirer.prompt([{
        type: 'confirm',
        name: 'replace',
        message: `A similar ${hook.event} hook already exists in settings.json. Replace it?`,
      }]);

      if (!replaceAnswer.replace) {
        console.log(chalk.yellow('Hook installation cancelled.'));
        process.exit(0);
      } else {
        // Remove existing hook and add new one
        settings.hooks[hook.event] = settings.hooks[hook.event].filter((h: any) => h !== existingHook);
        settings.hooks[hook.event].push(newHook);
      }
    } else {
      settings.hooks[hook.event].push(newHook);
    }

    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));

    s.stop('Settings updated');

    console.log(chalk.green('✨ Hook installed successfully!'));

    console.log(chalk.gray('\nHook details:'));
    console.log(chalk.gray(`  • Name: ${hook.name}`));
    console.log(chalk.gray(`  • File: ${hookFilePath}`));
    console.log(chalk.gray(`  • Event: ${hook.event}`));
    console.log(chalk.gray(`  • Matcher: ${hook.matcher}`));
    console.log(chalk.gray('\nThe hook will run automatically when you edit TypeScript files with Claude Code.'));

  } catch (error) {
    s.stop('Installation failed');
    console.log(chalk.red(`❌ Failed to install hook: ${error}`));
    process.exit(1);
  }
}