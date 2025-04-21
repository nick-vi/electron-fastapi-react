#!/usr/bin/env node

/**
 * Enhanced build script for Electron FastAPI Sidecar
 * This script:
 * 1. Builds the Electron app with electron-vite
 * 2. Builds the installer with electron-builder
 * 3. Logs timing and size information
 */

import { execSync } from 'child_process';
import { readFileSync, statSync, readdirSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

// Emojis for different build steps
const emojis = {
  start: '🚀',
  clean: '🧹',
  build: '🔨',
  package: '📦',
  done: '✅',
  error: '❌',
  time: '⏱️',
  size: '📊',
};

// Get the directory of the current script
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootDir = resolve(__dirname, '..');

/**
 * Format file size in a human-readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} - Formatted size
 */
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  const units = ['KB', 'MB', 'GB', 'TB'];
  let size = bytes / 1024;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return size.toFixed(2) + ' ' + units[unitIndex];
}

/**
 * Format time in a human-readable format
 * @param {number} ms - Time in milliseconds
 * @returns {string} - Formatted time
 */
function formatTime(ms) {
  if (ms < 1000) return ms + 'ms';
  const seconds = ms / 1000;
  if (seconds < 60) return seconds.toFixed(2) + 's';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = (seconds % 60).toFixed(1);
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Get the size of a directory
 * @param {string} dirPath - Path to the directory
 * @returns {number} - Size in bytes
 */
function getDirSize(dirPath) {
  let size = 0;
  
  try {
    const files = readdirSync(dirPath, { withFileTypes: true });
    
    for (const file of files) {
      const filePath = join(dirPath, file.name);
      
      if (file.isDirectory()) {
        size += getDirSize(filePath);
      } else {
        size += statSync(filePath).size;
      }
    }
  } catch (error) {
    console.error(`Error getting size of ${dirPath}:`, error.message);
  }
  
  return size;
}

/**
 * Run a command and log the output
 * @param {string} command - Command to run
 * @param {string} description - Description of the command
 * @param {string} emoji - Emoji to use
 * @returns {number} - Time taken in milliseconds
 */
function runCommand(command, description, emoji) {
  console.log(`\n${emoji} ${colors.bold}${colors.cyan}${description}${colors.reset}`);
  console.log(`${colors.yellow}$ ${command}${colors.reset}`);
  
  const startTime = Date.now();
  
  try {
    execSync(command, { stdio: 'inherit', cwd: rootDir });
    const endTime = Date.now();
    const timeTaken = endTime - startTime;
    
    console.log(`${emojis.time} ${colors.green}Completed in ${formatTime(timeTaken)}${colors.reset}`);
    return timeTaken;
  } catch (error) {
    console.error(`${emojis.error} ${colors.red}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

/**
 * Get the package.json data
 * @returns {object} - Package.json data
 */
function getPackageJson() {
  try {
    const packageJsonPath = join(rootDir, 'package.json');
    const packageJsonContent = readFileSync(packageJsonPath, 'utf8');
    return JSON.parse(packageJsonContent);
  } catch (error) {
    console.error(`${emojis.error} ${colors.red}Error reading package.json: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

/**
 * Main build function
 */
async function build() {
  console.log(`\n${emojis.start} ${colors.bold}${colors.magenta}Starting build process for Electron FastAPI Sidecar${colors.reset}`);
  
  const startTime = Date.now();
  const packageJson = getPackageJson();
  const appVersion = packageJson.version;
  
  console.log(`${colors.bold}Version:${colors.reset} ${appVersion}`);
  
  // Clean up previous builds
  let totalTime = runCommand('rm -rf dist dist-electron', 'Cleaning previous builds', emojis.clean);
  
  // Build the Electron app with electron-vite
  totalTime += runCommand('pnpm run build:vite', 'Building Electron app with electron-vite', emojis.build);
  
  // Get the size of the dist-electron directory
  const distElectronSize = getDirSize(join(rootDir, 'dist-electron'));
  console.log(`${emojis.size} ${colors.blue}dist-electron size: ${formatSize(distElectronSize)}${colors.reset}`);
  
  // Build the installer with electron-builder
  totalTime += runCommand('pnpm run build:electron', 'Building installer with electron-builder', emojis.package);
  
  // Get the size of the dist directory
  const distSize = getDirSize(join(rootDir, 'dist'));
  console.log(`${emojis.size} ${colors.blue}dist size: ${formatSize(distSize)}${colors.reset}`);
  
  // Get the size of specific installers
  try {
    const distFiles = readdirSync(join(rootDir, 'dist'));
    
    for (const file of distFiles) {
      if (file.endsWith('.dmg') || file.endsWith('.exe') || file.endsWith('.AppImage') || file.endsWith('.deb')) {
        const filePath = join(rootDir, 'dist', file);
        const fileSize = statSync(filePath).size;
        console.log(`${emojis.size} ${colors.blue}${file}: ${formatSize(fileSize)}${colors.reset}`);
      }
    }
  } catch (error) {
    console.error(`Error getting installer sizes:`, error.message);
  }
  
  const endTime = Date.now();
  const totalTimeTaken = endTime - startTime;
  
  console.log(`\n${emojis.done} ${colors.bold}${colors.green}Build completed successfully in ${formatTime(totalTimeTaken)}${colors.reset}`);
  console.log(`${colors.cyan}Total build time: ${formatTime(totalTime)}${colors.reset}`);
}

// Run the build function
build().catch((error) => {
  console.error(`${emojis.error} ${colors.red}Build failed: ${error.message}${colors.reset}`);
  process.exit(1);
});
