import * as vscode from 'vscode';
import { logInfo } from '../outputChannel';

// ──────────────────────────────────────────────
// Validate Command - because we all need someone to double-check our work
// ──────────────────────────────────────────────

export function registerValidateCommand(context: vscode.ExtensionContext, collection: vscode.DiagnosticCollection) {
  const validateCurrentFileCommand = vscode.commands.registerCommand('rvmat.validateCurrentFile', () => {
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor && activeEditor.document.languageId === 'rvmat') {
      // Import the validateDocument function dynamically to avoid circular dependencies
      // (because TypeScript can be picky about these things)
      import('../validation/validateDocument').then(({ validateDocument }) => {
        validateDocument(activeEditor.document, collection);
        logInfo(`Manual validation triggered for: ${activeEditor.document.fileName}`);
        vscode.window.showInformationMessage('RVMAT file validation completed.');
      });
    } else {
      vscode.window.showWarningMessage('No active RVMAT file to validate.');
    }
  });

  context.subscriptions.push(validateCurrentFileCommand);
}