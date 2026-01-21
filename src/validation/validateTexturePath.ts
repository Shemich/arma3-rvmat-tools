import * as vscode from 'vscode';
import { logInfo, logError } from '../outputChannel';

// ──────────────────────────────────────────────
// Texture path validation - hunting down missing textures like a digital detective
// ──────────────────────────────────────────────

export async function validateTexturePath(texturePath: string, document: vscode.TextDocument, diagnostics: vscode.Diagnostic[], lineNumber: number, collection: vscode.DiagnosticCollection) {
  logInfo(`Starting validation for texture: ${texturePath} at line ${lineNumber}`);

  const normalizedPath = texturePath.replace(/\\/g, '/');
  logInfo(`Normalized path: ${normalizedPath}`);

  try {
    let files = [];

    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
      for (const folder of vscode.workspace.workspaceFolders) {
        if (normalizedPath.toLowerCase().startsWith('p:/') || normalizedPath.toLowerCase().startsWith('p:\\')) {
          const actualPath = normalizedPath.replace(/^p:[\\/]/i, 'P:\\');
          try {
            const uri = vscode.Uri.file(actualPath);
            await vscode.workspace.fs.stat(uri);
            files = [uri];
            break;
          } catch (_error) {
            // File doesn't exist, continue to next iteration
          }
        } else {
          const uriPattern = new vscode.RelativePattern(folder, `**/${normalizedPath}`);
          const foundFiles = await vscode.workspace.findFiles(uriPattern, null, 1);
          if (foundFiles.length > 0) {
            files = foundFiles;
            break;
          }
        }
      }
    }

    // If not found — try variations
    let found = files.length > 0;

    if (!found) {
      logInfo('File not found in base search, trying variations...');
      const variations = [
        normalizedPath,
        `P:${normalizedPath}`,
        `P:\\${normalizedPath.replace('/', '\\')}`,
      ];

      for (const variant of variations) {
        if (variant.toLowerCase().startsWith('p:/') || variant.toLowerCase().startsWith('p:\\')) {
          const actualPath = variant.replace(/\//g, '\\');
          try {
            const uri = vscode.Uri.file(actualPath);
            await vscode.workspace.fs.stat(uri);
            found = true;
            break;
          } catch (_error) {
            // File doesn't exist, continue to next iteration
          }
        }
      }
    }

    if (!found) {
      logInfo(`Texture file not found: ${texturePath}`);

      const range = document.lineAt(lineNumber).range;  // whole line — reliably displayed

      const diag = new vscode.Diagnostic(
        range,
        `Texture file not found: ${texturePath}`,
        vscode.DiagnosticSeverity.Warning
      );
      diag.source = 'RVMAT Linter';
      diag.code = 'missing-texture-file';

      diagnostics.push(diag);

      // Most important — update collection immediately
      collection.set(document.uri, diagnostics);
    } else {
      logInfo(`Texture found: ${texturePath}`);
    }
  } catch (error: unknown) {
    logError(`Texture validation failed: ${(error as Error).message}`);
  }
}