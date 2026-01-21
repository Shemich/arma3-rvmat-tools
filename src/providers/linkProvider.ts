import * as vscode from 'vscode';

// ──────────────────────────────────────────────
// Link Provider - making texture paths clickable because clicking is fun
// ──────────────────────────────────────────────

export function registerLinkProvider(context: vscode.ExtensionContext) {
  const linkProvider = vscode.languages.registerDocumentLinkProvider('rvmat', {
    provideDocumentLinks(document: vscode.TextDocument, _token: vscode.CancellationToken): vscode.DocumentLink[] {
      const links: vscode.DocumentLink[] = [];
      const text = document.getText();
      const regex = /texture\s*=\s*["'](.*?\.(?:paa|jpg|png|tga))["']/gi;

      let match;
      while ((match = regex.exec(text))) {
        // Extract the actual texture path without the property name
        const pathRegex = /["'](.*?\.(?:paa|jpg|png|tga))["']/i;
        const pathMatch = pathRegex.exec(match[0]);
        if (pathMatch) {
          const pathStart = document.positionAt(match.index + match[0].indexOf(pathMatch[1]));
          const pathEnd = document.positionAt(match.index + match[0].indexOf(pathMatch[1]) + pathMatch[1].length);
          const pathRange = new vscode.Range(pathStart, pathEnd);

          // Create a URI for the texture file - handle P: drive paths
          const texturePath = pathMatch[1].replace(/\\/g, '/');

          // Check if the path starts with P: or similar drive letter, and handle accordingly
          let fullPath: string;
          if (/^[A-Za-z]:/.test(texturePath)) {
            // If it's already an absolute path like P:ca\weapons\..., use it as-is
            fullPath = texturePath.replace(/\//g, '\\');
          } else {
            // Otherwise, treat it as relative to P: drive
            fullPath = `P:\\${texturePath.replace(/\//g, '\\')}`;
          }

          // Create file URI for the texture
          const uri = vscode.Uri.file(fullPath);

          // Create a command URI to execute our TexView command
          const commandUri = vscode.Uri.parse(`command:rvmat.openTextureWithTexView?${encodeURIComponent(JSON.stringify(uri))}`);

          const link = new vscode.DocumentLink(pathRange, commandUri);
          link.tooltip = `Click to open texture file in TexView: ${fullPath}`;
          links.push(link);
        }
      }

      return links;
    }
  });

  context.subscriptions.push(linkProvider);
}