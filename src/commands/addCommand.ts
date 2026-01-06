import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { listFilesFromGitHub, isGitHubAvailable } from '../utils/github.js';
import { parseYamlFrontmatter, getTargetDirectory, findLocalConfigDir } from '../utils/claude-config.js';
import { installFileWithGitHubFallback, getFileContentWithGitHubFallback } from '../utils/file-installer.js';
import { getVersion } from '../lib/version.js';

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

interface AddCommandOptions {
  folder?: string;
}

interface CommandMetadata {
  name: string;
  description: string;
  allowedTools?: string;
  argumentHint?: string;
  commandFile: string;
}


async function getLocalMdFilesRecursively(dir: string, basePath: string = ''): Promise<string[]> {
  const files: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      const subFiles = await getLocalMdFilesRecursively(path.join(dir, entry.name), relativePath);
      files.push(...subFiles);
    } else if (entry.name.endsWith('.md')) {
      files.push(relativePath);
    }
  }

  return files;
}

async function discoverAvailableCommands(): Promise<Record<string, CommandMetadata>> {
  const commands: Record<string, CommandMetadata> = {};
  const useGitHub = await isGitHubAvailable();

  let mdFiles: string[] = [];

  if (useGitHub) {
    // Get command list from GitHub (includes nested folders)
    mdFiles = (await listFilesFromGitHub('commands')).filter(file => file.endsWith('.md'));
  }

  // If GitHub failed to return files or is unavailable, fallback to local files
  if (mdFiles.length === 0) {
    const commandsDir = await findLocalConfigDir('commands');
    if (!commandsDir) {
      throw new Error('Commands directory not found');
    }

    mdFiles = await getLocalMdFilesRecursively(commandsDir);
  }

  // Process each command file
  for (const file of mdFiles) {
    const commandName = file.replace('.md', '');

    try {
      const content = await getFileContentWithGitHubFallback('commands', file);
      const { metadata } = parseYamlFrontmatter(content);

      commands[commandName] = {
        name: commandName.split('/').map(part => part.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())).join('/'),
        description: metadata.description || 'No description available',
        allowedTools: metadata['allowed-tools'],
        argumentHint: metadata['argument-hint'],
        commandFile: file
      };
    } catch (error) {
      console.log(chalk.yellow(`⚠️  Warning: Could not process ${file}: ${error}`));
    }
  }

  return commands;
}

function displayAvailableCommands(commands: Record<string, CommandMetadata>) {
  console.log(chalk.bgBlue(' Available Claude Code Commands '));
  console.log();

  const maxNameLength = Math.max(...Object.values(commands).map(cmd => cmd.name.length));

  Object.entries(commands).forEach(([key, command]) => {
    const paddedName = command.name.padEnd(maxNameLength);
    console.log(chalk.blue(`  ${key}`) + chalk.gray(` • ${command.description}`));
    if (command.allowedTools) {
      console.log(chalk.gray(`    Tools: ${command.allowedTools}`));
    }
    if (command.argumentHint) {
      console.log(chalk.gray(`    Usage: ${key} ${command.argumentHint}`));
    }
    console.log();
  });

  console.log(chalk.gray('Usage:'));
  console.log(chalk.gray('  aiblueprint claude-code add commands <command-name>  # Install specific command'));
  console.log(chalk.gray('  aiblueprint claude-code add commands                 # Show this list'));
}

export async function addCommandCommand(commandName?: string, options: AddCommandOptions = {}) {
  console.log(chalk.bgBlue(` aiblueprint-cli v${getVersion()} `));

  const availableCommands = await discoverAvailableCommands();

  if (!commandName) {
    displayAvailableCommands(availableCommands);
    return;
  }

  if (!availableCommands[commandName]) {
    console.log(chalk.red(`❌ Command '${commandName}' not found.`));
    console.log(chalk.gray('Available commands:'));
    Object.keys(availableCommands).forEach(key => {
      console.log(chalk.gray(`  • ${key}: ${availableCommands[key].description}`));
    });
    process.exit(1);
  }

  const command = availableCommands[commandName];
  const s = new SimpleSpinner();

  // Determine target directory for Claude configuration
  const targetDir = await getTargetDirectory(options);

  if (options.folder) {
    console.log(chalk.gray(`Using custom folder: ${targetDir}`));
  }

  const commandsDir = path.join(targetDir, 'commands');
  const commandFilePath = path.join(commandsDir, command.commandFile);

  // Check if command already exists
  if (await fs.pathExists(commandFilePath)) {
    const overwriteAnswer = await inquirer.prompt([{
      type: 'confirm',
      name: 'overwrite',
      message: `Command file already exists at ${commandFilePath}. Overwrite?`,
    }]);

    if (!overwriteAnswer.overwrite) {
      console.log(chalk.yellow('Command installation cancelled.'));
      process.exit(0);
    }
  }

  try {
    s.start('Installing command...');

    await installFileWithGitHubFallback({
      sourceDir: 'commands',
      targetPath: commandFilePath,
      fileName: command.commandFile
    });

    s.stop('Command file installed');

    console.log(chalk.green('✨ Command installed successfully!'));

    console.log(chalk.gray('\nCommand details:'));
    console.log(chalk.gray(`  • Name: ${command.name}`));
    console.log(chalk.gray(`  • File: ${commandFilePath}`));
    console.log(chalk.gray(`  • Description: ${command.description}`));
    if (command.allowedTools) {
      console.log(chalk.gray(`  • Tools: ${command.allowedTools}`));
    }
    if (command.argumentHint) {
      console.log(chalk.gray(`  • Usage: ${commandName} ${command.argumentHint}`));
    }
    console.log(chalk.gray('\nThe command will be available immediately in Claude Code.'));

  } catch (error) {
    s.stop('Installation failed');
    console.log(chalk.red(`❌ Failed to install command: ${error}`));
    process.exit(1);
  }
}