import * as vscode from 'vscode';
import { logInfo, logError } from '../outputChannel';

// ──────────────────────────────────────────────
// TexView Commands - because viewing textures is half the fun
// ──────────────────────────────────────────────

export function registerTexViewCommands(context: vscode.ExtensionContext) {
  // Register command to open texture with TexView
  const openWithTexViewCommand = vscode.commands.registerCommand('rvmat.openTextureWithTexView', async (uri: vscode.Uri) => {
    if (uri) {
      const filePath = uri.fsPath;

      // Get the TexView path from settings, with fallback to default
      const config = vscode.workspace.getConfiguration('rvmat-linter');
      const texViewPath = config.get<string>('texViewPath', 'D:\\\\SteamLibrary\\\\steamapps\\\\common\\\\Arma 3 Tools\\\\TexView2\\\\TexView.exe');

      try {
        // Check if the specific TexView path exists
        await vscode.workspace.fs.stat(vscode.Uri.file(texViewPath));

        // If it exists, execute TexView with the texture file
        execCommand(`"${texViewPath}" "${filePath}"`, (error: Error | null) => {
          if (error) {
            logError(`Failed to execute TexView: ${error.message}`);
            vscode.window.showErrorMessage(`Failed to open TexView: ${error.message}`);
            // Fallback to opening with default application
            vscode.env.openExternal(uri);
          }
        });
      } catch (_err) {
        // TexView not found at the specific path, try other common locations
        const fallbackPaths = [
          'C:\\\\Program Files\\\\TexView2\\\\TexView2.exe',
          'C:\\\\Program Files (x86)\\\\TexView2\\\\TexView2.exe',
          'C:\\\\TexView2\\\\TexView2.exe'
        ];

        let foundTexView = false;
        for (const path of fallbackPaths) {
          try {
            await vscode.workspace.fs.stat(vscode.Uri.file(path));

            execCommand(`"${path}" "${filePath}"`, (error: Error | null) => {
              if (error) {
                logError(`Failed to execute TexView: ${error.message}`);
                vscode.window.showErrorMessage(`Failed to open TexView: ${error.message}`);
                // Fallback to opening with default application
                vscode.env.openExternal(uri);
              }
            });
            foundTexView = true;
            break;
          } catch (_fallbackErr) {
            // File doesn't exist, try next path
          }
        }

        if (!foundTexView) {
          // TexView not found anywhere, open with default application
          logInfo('TexView not found, opening with default application');
          vscode.window.showInformationMessage('TexView not found, opening with default application');
          vscode.env.openExternal(uri);
        }
      }
    }
  });

  context.subscriptions.push(openWithTexViewCommand);

  // Also register a context menu command for texture paths in RVMAT files
  const openTextureContextCommand = vscode.commands.registerTextEditorCommand('rvmat.openTextureAtCursorWithTexView', (textEditor: vscode.TextEditor) => {
    const selection = textEditor.selection;
    const text = textEditor.document.getText();
    const offset = textEditor.document.offsetAt(selection.active);

    // Find the texture line at cursor position
    const lines = text.split('\n');
    let currentOffset = 0;
    let targetLine = '';

    for (let i = 0; i < lines.length; i++) {
      const lineEndOffset = currentOffset + lines[i].length + 1; // +1 for newline

      if (offset >= currentOffset && offset <= lineEndOffset) {
        targetLine = lines[i];
        break;
      }

      currentOffset = lineEndOffset;
    }

    // Extract texture path from the line
    const textureMatch = targetLine.match(/texture\s*=\s*["'](.*?\.(?:paa|jpg|png|tga))["']/i);
    if (textureMatch) {
      let texturePath = textureMatch[1].replace(/\\/g, '/');

      // Handle P: drive paths
      if (!/^[A-Za-z]:/.test(texturePath)) {
        texturePath = `P:\\\\${texturePath.replace(/\//g, '\\\\')}`;
      } else {
        texturePath = texturePath.replace(/\//g, '\\\\');
      }

      const uri = vscode.Uri.file(texturePath);
      vscode.commands.executeCommand('rvmat.openTextureWithTexView', uri);
    } else {
      vscode.window.showWarningMessage('No texture path found at cursor position');
    }
  });

  context.subscriptions.push(openTextureContextCommand);
}

// Helper function to wrap exec in try-catch with proper error handling
// Because child processes can be unpredictable (like most things in life)
function execCommand(command: string, callback: (error: Error | null) => void) {
  const { exec } = require('child_process');
  try {
    exec(command, (error: Error | null, _stdout: string, _stderr: string) => {
      callback(error);
    });
  } catch (error) {
    callback(error as Error);
  }
}