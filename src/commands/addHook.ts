import * as clack from '@clack/prompts';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface AddHookOptions {
  folder?: string;
}

const supportedHooks = {
  'post-edit-typescript': {
    name: 'Post Edit TypeScript Hook',
    description: 'Runs Prettier, ESLint, and TypeScript checks after editing TypeScript files',
    hookFile: 'hook-post-file.ts',
    event: 'PostToolUse',
    matcher: 'Edit|Write|MultiEdit'
  }
};

export async function addHookCommand(hookType: string, options: AddHookOptions) {
  clack.intro(chalk.bgBlue(' aiblueprint-cli '));

  if (!supportedHooks[hookType as keyof typeof supportedHooks]) {
    clack.outro(chalk.red(`❌ Unsupported hook type: ${hookType}`));
    console.log(chalk.gray('Available hooks:'));
    Object.entries(supportedHooks).forEach(([key, hook]) => {
      console.log(chalk.gray(`  • ${key}: ${hook.description}`));
    });
    process.exit(1);
  }

  const hook = supportedHooks[hookType as keyof typeof supportedHooks];
  const s = clack.spinner();

  // Detect project directory
  const cwd = process.cwd();
  const isGitRepo = await fs.pathExists(path.join(cwd, '.git'));
  const hasClaudeConfig = await fs.pathExists(path.join(cwd, '.claude'));

  if (!isGitRepo && !hasClaudeConfig) {
    clack.outro(chalk.red('❌ Not in a project directory. Please run this command in a Git repository or a directory with .claude/ configuration.'));
    process.exit(1);
  }

  const claudeDir = path.join(cwd, '.claude');
  const hooksDir = path.join(claudeDir, 'hooks');
  const hookFilePath = path.join(hooksDir, hook.hookFile);
  const settingsPath = path.join(claudeDir, 'settings.json');

  // Check if hook already exists
  if (await fs.pathExists(hookFilePath)) {
    const overwrite = await clack.confirm({
      message: `Hook file already exists at ${hookFilePath}. Overwrite?`,
    });

    if (clack.isCancel(overwrite) || !overwrite) {
      clack.outro(chalk.yellow('Hook installation cancelled.'));
      process.exit(0);
    }
  }

  try {
    s.start('Installing hook...');

    // Ensure directories exist
    await fs.ensureDir(hooksDir);

    // Copy hook file from template
    const templatePath = path.join(__dirname, '../../claude-code-config/hooks', hook.hookFile);
    await fs.copy(templatePath, hookFilePath);

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
          command: `bun $CLAUDE_PROJECT_DIR/.claude/hooks/${hook.hookFile}`
        }
      ]
    };

    // Check if similar hook already exists
    const existingHook = settings.hooks[hook.event].find((h: any) =>
      h.matcher === hook.matcher &&
      h.hooks?.some((subHook: any) => subHook.command?.includes(hook.hookFile))
    );

    if (existingHook) {
      const replace = await clack.confirm({
        message: `A similar ${hook.event} hook already exists in settings.json. Replace it?`,
      });

      if (clack.isCancel(replace)) {
        clack.outro(chalk.yellow('Hook installation cancelled.'));
        process.exit(0);
      }

      if (replace) {
        // Remove existing hook and add new one
        settings.hooks[hook.event] = settings.hooks[hook.event].filter((h: any) => h !== existingHook);
        settings.hooks[hook.event].push(newHook);
      }
    } else {
      settings.hooks[hook.event].push(newHook);
    }

    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));

    s.stop('Settings updated');

    clack.outro(chalk.green('✨ Hook installed successfully!'));

    console.log(chalk.gray('\nHook details:'));
    console.log(chalk.gray(`  • Name: ${hook.name}`));
    console.log(chalk.gray(`  • File: ${hookFilePath}`));
    console.log(chalk.gray(`  • Event: ${hook.event}`));
    console.log(chalk.gray(`  • Matcher: ${hook.matcher}`));
    console.log(chalk.gray('\nThe hook will run automatically when you edit TypeScript files with Claude Code.'));

  } catch (error) {
    s.stop('Installation failed');
    clack.outro(chalk.red(`❌ Failed to install hook: ${error}`));
    process.exit(1);
  }
}