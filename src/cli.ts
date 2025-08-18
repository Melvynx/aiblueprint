#!/usr/bin/env node
import { Command } from 'commander';
import { setupCommand } from './commands/setup.js';
import chalk from 'chalk';

const program = new Command();

program
  .name('aiblueprint')
  .description('AIBlueprint CLI for setting up Claude Code configurations')
  .version('1.0.0');

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

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  console.log(chalk.blue('🚀 AIBlueprint CLI'));
  console.log(chalk.gray('Use --help for usage information'));
}