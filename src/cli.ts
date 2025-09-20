#!/usr/bin/env node
import { Command } from 'commander';
import { setupCommand } from './commands/setup.js';
import { addHookCommand } from './commands/addHook.js';
import { addCommandCommand } from './commands/addCommand.js';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'));

const program = new Command();

program
  .name('aiblueprint')
  .description('AIBlueprint CLI for setting up Claude Code configurations')
  .version(packageJson.version);

const claudeCodeCmd = program
  .command('claude-code')
  .description('Claude Code configuration commands')
  .option('-f, --folder <path>', 'Specify custom folder path (default: ~/.claude)')
  .option('-s, --skip', 'Skip interactive prompts and install all features');

claudeCodeCmd
  .command('setup')
  .description('Setup Claude Code configuration with AIBlueprint defaults')
  .action((options, command) => {
    const parentOptions = command.parent.opts();
    setupCommand(parentOptions.folder, parentOptions.skip);
  });

const addCmd = claudeCodeCmd
  .command('add')
  .description('Add components to your Claude Code configuration\n' +
    'Examples:\n' +
    '  aiblueprint claude-code add hook post-edit-typescript\n' +
    '  aiblueprint claude-code add commands\n' +
    '  aiblueprint claude-code add commands commit');

addCmd
  .command('hook <type>')
  .description('Add a hook to your Claude Code configuration. Available types: post-edit-typescript')
  .action((type, options, command) => {
    const parentOptions = command.parent.parent.opts();
    addHookCommand(type, { folder: parentOptions.folder });
  });

addCmd
  .command('commands [command-name]')
  .description('Install a Claude Code command or list all available commands (use without argument to list)')
  .action((commandName, options, command) => {
    const parentOptions = command.parent.parent.opts();
    addCommandCommand(commandName, { folder: parentOptions.folder });
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  console.log(chalk.blue('🚀 AIBlueprint CLI'));
  console.log(chalk.gray('Use --help for usage information'));
}