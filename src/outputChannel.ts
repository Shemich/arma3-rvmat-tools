import * as vscode from 'vscode';

// ──────────────────────────────────────────────
// Output Channel for logging - keeping track of what goes wrong
// ──────────────────────────────────────────────

export const outputChannel = vscode.window.createOutputChannel('RVMAT Linter');

// Log info messages - when things are going well (surprisingly often!)
export function logInfo(message: string): void {
  outputChannel.appendLine(`[RVMAT Linter INFO] ${message}`);
}

// Log warning messages - when things are slightly concerning
export function logWarning(message: string): void {
  outputChannel.appendLine(`[RVMAT Linter WARNING] ${message}`);
}

// Log error messages - when things go sideways (as they sometimes do)
export function logError(message: string): void {
  outputChannel.appendLine(`[RVMAT Linter ERROR] ${message}`);
}