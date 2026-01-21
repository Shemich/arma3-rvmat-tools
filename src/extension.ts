import * as vscode from 'vscode';
import { validateDocument } from './validation/validateDocument';
import { registerLinkProvider } from './providers/linkProvider';
import { registerTexViewCommands } from './commands/texViewCommands';
import { registerValidateCommand } from './commands/validateCommand';
import { registerCompletionProvider } from './providers/completionProvider';

// ──────────────────────────────────────────────
// Output Channel for logging
// ──────────────────────────────────────────────

import { outputChannel } from './outputChannel';

// ──────────────────────────────────────────────
// Extension activation - where the magic begins
// ──────────────────────────────────────────────

export function activate(context: vscode.ExtensionContext) {
  outputChannel.appendLine('[RVMAT Linter] Activated — version with smart uvSource checking');

  const diagnosticCollection = vscode.languages.createDiagnosticCollection('rvmat-linter');
  context.subscriptions.push(diagnosticCollection);

  // Register our validation commands
  registerValidateCommand(context, diagnosticCollection);

  // Hook up TexView functionality
  registerTexViewCommands(context);

  // Set up event listeners to keep an eye on RVMAT files
  const disposables = [
    vscode.workspace.onDidChangeTextDocument((e: vscode.TextDocumentChangeEvent) => {
      if (e.document.languageId === 'rvmat') validateDocument(e.document, diagnosticCollection);
    }),
    vscode.workspace.onDidOpenTextDocument((doc: vscode.TextDocument) => {
      if (doc.languageId === 'rvmat') validateDocument(doc, diagnosticCollection);
    }),
    vscode.workspace.onDidSaveTextDocument((doc: vscode.TextDocument) => {
      if (doc.languageId === 'rvmat') validateDocument(doc, diagnosticCollection);
    }),
    vscode.workspace.onDidCloseTextDocument((doc: vscode.TextDocument) => {
      if (doc.languageId === 'rvmat') {
        // Clean up diagnostics when document closes
        diagnosticCollection.delete(doc.uri);
      }
    })
  ];

  context.subscriptions.push(...disposables);

  // Hook up link provider for navigation
  registerLinkProvider(context);

  // And don't forget our shiny completion provider
  registerCompletionProvider(context);

  // Validate any RVMAT files that are already open
  vscode.workspace.textDocuments.forEach((doc: vscode.TextDocument) => {
    if (doc.languageId === 'rvmat') validateDocument(doc, diagnosticCollection);
  });
}

// Extension deactivation - cleanup time
export function deactivate() {}