import * as vscode from 'vscode';
import {
  VALID_PIXEL_SHADER_IDS,
  VALID_VERTEX_SHADER_IDS,
  VALID_UV_SOURCES,
  VALID_RENDER_FLAGS,
  VALID_FILTERS
} from '../constants';

/**
 * Registers the RVMAT completion provider for the extension
 */
export function registerCompletionProvider(context: vscode.ExtensionContext) {
  const provider = vscode.languages.registerCompletionItemProvider(
    'rvmat',
    new RVMATCompletionProvider(),
    '"', // Trigger character for string values
    '{', // Trigger character for render flags array
    '='  // Trigger character for assignments
  );

  context.subscriptions.push(provider);
}

/**
 * Completion provider for RVMAT files
 * Because who doesn't love auto-completion, right?
 */
class RVMATCompletionProvider implements vscode.CompletionItemProvider {
  private textureCache: vscode.CompletionItem[] | null = null;
  private lastTextureScan = 0;

  /**
   * Provides completion items for RVMAT files
   * Tries to be smart about what the user might want to type next
   */
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    _context: vscode.CompletionContext
  ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {

    const linePrefix = document.lineAt(position).text.substring(0, position.character);
    const textBeforePosition = document.getText(new vscode.Range(new vscode.Position(0, 0), position));

    // Determine if we're inside a renderFlags array
    const isInRenderFlagsArray = this.isInsideRenderFlagsArray(textBeforePosition);

    // Determine if we're inside a class definition
    const currentClass = this.getCurrentClass(textBeforePosition);

    // Determine if we're inside a Stage class
    const isInsideStage = currentClass && currentClass.startsWith('Stage');

    const completionItems: vscode.CompletionItem[] = [];

    // Check for PixelShaderID completion
    if (this.isAfterPattern(linePrefix, /PixelShaderID\s*=\s*"/i)) {
      completionItems.push(...this.getPixelShaderCompletions());
    }

    // Check for VertexShaderID completion
    else if (this.isAfterPattern(linePrefix, /VertexShaderID\s*=\s*"/i)) {
      completionItems.push(...this.getVertexShaderCompletions());
    }

    // Check for uvSource completion
    else if (this.isAfterPattern(linePrefix, /uvSource\s*=\s*"/i)) {
      completionItems.push(...this.getUVSourceCompletions());
    }

    // Check for renderFlags completion (inside array)
    else if (isInRenderFlagsArray || this.isAfterPattern(linePrefix, /renderFlags\[\]\s*=\s*\{/i)) {
      completionItems.push(...this.getRenderFlagCompletions());
    }

    // Check for Filter completion
    else if (this.isAfterPattern(linePrefix, /Filter\s*=\s*"/i)) {
      completionItems.push(...this.getFilterCompletions());
    }

    // Check for texture completion
    else if (this.isAfterPattern(linePrefix, /texture\s*=\s*"/i)) {
      // For texture completion, use the cached results
      // The cache is populated in the background or when first accessed
      completionItems.push(...this.getCachedTextureCompletions());
    }

    // Check for texGen completion
    else if (this.isAfterPattern(linePrefix, /texGen\s*=\s*"?/i)) {
      completionItems.push(...this.getTexGenCompletions(document));
    }

    // If inside a Stage class, prioritize texture and texGen completions
    if (isInsideStage) {
      if (!this.hasAssignment(linePrefix)) {
        // If we're not completing after an assignment, suggest property names
        completionItems.push(...this.getStagePropertyCompletions());
      }
    }

    return completionItems;
  }

  /**
   * Resolves completion items if needed
   * Sometimes we need to fill in extra details after the initial suggestion
   */
  resolveCompletionItem(item: vscode.CompletionItem, _token: vscode.CancellationToken): vscode.ProviderResult<vscode.CompletionItem> {
    return item;
  }

  /**
   * Gets cached texture completions, triggering a scan if needed
   * Because scanning every time would be way too slow
   */
  private getCachedTextureCompletions(): vscode.CompletionItem[] {
    const now = Date.now();
    const cacheTimeout = 30000; // 30 seconds - not too frequent, not too rare

    // Check if we have a valid cache
    if (this.textureCache && (now - this.lastTextureScan) < cacheTimeout) {
      return this.textureCache;
    }

    // If no valid cache, trigger a scan in the background and return a placeholder
    this.scanTexturesInBackground();

    // Return a placeholder while scanning
    return [this.createCompletionItem(
      "Scanning textures...",
      vscode.CompletionItemKind.Text,
      "Scanning for texture files...",
      "Scanning workspace for texture files (.paa, .jpg, .png, .tga)"
    )];
  }

  /**
   * Scans for texture files in the background and caches the results
   * This could take a while, so we do it in the background
   */
  private async scanTexturesInBackground() {
    const now = Date.now();
    const cacheTimeout = 30000; // 30 seconds - seems like a good balance

    // Only scan if cache is expired
    if (!this.textureCache || (now - this.lastTextureScan) >= cacheTimeout) {
      try {
        // Find texture files in the workspace
        const textureFiles = await vscode.workspace.findFiles(
          '**/*.{paa,jpg,png,tga}',
          '**/{node_modules,out,dist,.git}/**',
          500
        );

        if (textureFiles.length === 0) {
          // If no files found, cache a placeholder
          this.textureCache = [this.createCompletionItem(
            "No textures found",
            vscode.CompletionItemKind.Text,
            "No texture files found in workspace",
            "No texture files (.paa, .jpg, .png, .tga) were found in the current workspace."
          )];
        } else {
          const completionItems: vscode.CompletionItem[] = [];

          for (const fileUri of textureFiles) {
            let relativePath = vscode.workspace.asRelativePath(fileUri.path);

            // If path contains P:\ (from Arma 3 P drive), handle it appropriately
            const pDrivePath = vscode.workspace.getConfiguration('rvmat-linter').get<string>('pDrivePath', 'P:\\');
            if (relativePath.toLowerCase().startsWith(pDrivePath.toLowerCase())) {
              // Remove the P:\ prefix for cleaner display
              relativePath = relativePath.substring(pDrivePath.length);
            }

            // Normalize path separators to backslashes (standard for RVMAT)
            relativePath = relativePath.replace(/\//g, '\\');

            const fileName = fileUri.path.split(/[\/\\]/).pop() || '';

            const item = this.createCompletionItem(
              relativePath,
              vscode.CompletionItemKind.File,
              fileName,
              `Texture file: ${fileUri.path}\n\nThis is a texture file that can be used in RVMAT materials.`
            );

            completionItems.push(item);
          }

          // Update cache
          this.textureCache = completionItems;
        }

        this.lastTextureScan = now;
      } catch (error) {
        // If scanning fails, cache an error indicator
        this.textureCache = [this.createCompletionItem(
          "Error scanning textures",
          vscode.CompletionItemKind.Text,
          (error as Error).message,
          `An error occurred while scanning for texture files: ${(error as Error).message}`
        )];
        this.lastTextureScan = now;
      }
    }
  }

  /**
   * Checks if the cursor is after a specific pattern
   * Regex magic to figure out what the user is trying to do
   */
  private isAfterPattern(text: string, pattern: RegExp): boolean {
    const match = text.match(pattern);
    return match !== null;
  }

  /**
   * Checks if we're inside a renderFlags array
   * Counting braces like a sane person would
   */
  private isInsideRenderFlagsArray(text: string): boolean {
    // Find the start of renderFlags array
    const renderFlagsStartIndex = text.lastIndexOf('renderFlags[] = {');
    if (renderFlagsStartIndex === -1) {
      return false;
    }

    // Get the content after the start
    const contentAfterStart = text.substring(renderFlagsStartIndex);

    // Count braces to determine if we're still inside the array
    let braceCount = 0;
    let inArray = false;

    for (let i = 0; i < contentAfterStart.length; i++) {
      const char = contentAfterStart[i];

      if (char === '{') {
        if (!inArray) inArray = true;
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          inArray = false;
          break;
        }
      }
    }

    return inArray;
  }

  /**
   * Gets the current class we're inside of
   * Simple parser to keep track of context
   */
  private getCurrentClass(text: string): string | null {
    // Find all class declarations before the current position
    const classMatches = [...text.matchAll(/class\s+(\w+)/gi)];
    if (classMatches.length === 0) {
      return null;
    }

    // Get the last class declaration
    const lastClassMatch = classMatches[classMatches.length - 1];
    if (!lastClassMatch) {
      return null;
    }

    // Count braces to determine if we're still inside this class
    const classKeywordIndex = lastClassMatch.index!;
    const classContent = text.substring(classKeywordIndex);

    let braceCount = 0;
    let inClass = false;

    for (let i = 0; i < classContent.length; i++) {
      const char = classContent[i];

      if (char === '{') {
        if (!inClass) inClass = true;
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          inClass = false;
          break;
        }
      }
    }

    if (inClass) {
      return lastClassMatch[1];
    }

    return null;
  }

  /**
   * Checks if there's an assignment operator in the current line
   * Just a simple check for '='
   */
  private hasAssignment(text: string): boolean {
    return /=/.test(text);
  }

  /**
   * Creates a completion item with common properties
   * Makes sure all our completion items look consistent
   */
  private createCompletionItem(label: string, kind: vscode.CompletionItemKind, detail?: string, documentation?: string): vscode.CompletionItem {
    const item = new vscode.CompletionItem(label, kind);
    if (detail) {
      item.detail = detail;
    }
    if (documentation) {
      item.documentation = new vscode.MarkdownString(documentation);
    }
    return item;
  }

  /**
   * Gets Pixel Shader ID completions
   * These come from our validated list of pixel shaders
   */
  private getPixelShaderCompletions(): vscode.CompletionItem[] {
    return VALID_PIXEL_SHADER_IDS.map(id => {
      const item = this.createCompletionItem(
        id,
        vscode.CompletionItemKind.Value,
        'Pixel Shader ID',
        `Pixel shader identifier: ${id}`
      );
      return item;
    });
  }

  /**
   * Gets Vertex Shader ID completions
   * These come from our validated list of vertex shaders
   */
  private getVertexShaderCompletions(): vscode.CompletionItem[] {
    return VALID_VERTEX_SHADER_IDS.map(id => {
      const item = this.createCompletionItem(
        id,
        vscode.CompletionItemKind.Value,
        'Vertex Shader ID',
        `Vertex shader identifier: ${id}`
      );
      return item;
    });
  }

  /**
   * Gets UV Source completions
   * These are the valid UV sources for RVMAT files
   */
  private getUVSourceCompletions(): vscode.CompletionItem[] {
    return VALID_UV_SOURCES.map(source => {
      const item = this.createCompletionItem(
        source,
        vscode.CompletionItemKind.Enum,
        'UV Source',
        `UV coordinate source: ${source}`
      );
      return item;
    });
  }

  /**
   * Gets Render Flag completions
   * These are the valid render flags for RVMAT files
   */
  private getRenderFlagCompletions(): vscode.CompletionItem[] {
    return VALID_RENDER_FLAGS.map(flag => {
      const item = this.createCompletionItem(
        flag,
        vscode.CompletionItemKind.Enum,
        'Render Flag',
        `Render flag: ${flag}`
      );
      // Add comma and space if we're inside the array context
      item.insertText = new vscode.SnippetString(`${flag}, `);
      return item;
    });
  }

  /**
   * Gets Filter completions
   * These are the valid filter types for RVMAT files
   */
  private getFilterCompletions(): vscode.CompletionItem[] {
    return VALID_FILTERS.map(filter => {
      const item = this.createCompletionItem(
        filter,
        vscode.CompletionItemKind.Enum,
        'Filter Type',
        `Texture filtering mode: ${filter}`
      );
      return item;
    });
  }

  /**
   * Gets TexGen completions based on existing TexGen classes in the document
   * Finds all TexGen classes in the current document and suggests them
   */
  private getTexGenCompletions(document: vscode.TextDocument): vscode.CompletionItem[] {
    const text = document.getText();
    const items: vscode.CompletionItem[] = [];

    // Find all TexGen class definitions in the document
    const texGenRegex = /class\s+TexGen(\d+)/gi;
    const matches = [...text.matchAll(texGenRegex)];

    // Extract unique TexGen numbers
    const texGenNumbers = new Set<number>();
    for (const match of matches) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num)) {
        texGenNumbers.add(num);
      }
    }

    // Create completion items for each found TexGen number
    for (const num of Array.from(texGenNumbers).sort()) {
      const item = this.createCompletionItem(
        num.toString(),
        vscode.CompletionItemKind.Reference,
        'TexGen Reference',
        `Reference to TexGen${num}`
      );
      items.push(item);
    }

    return items;
  }

  /**
   * Gets Stage property completions
   * Suggests common properties when inside a Stage class
   */
  private getStagePropertyCompletions(): vscode.CompletionItem[] {
    const properties = [
      { label: 'texture', detail: 'Texture path', documentation: 'Path to the texture file' },
      { label: 'uvSource', detail: 'UV Source', documentation: 'UV coordinate source' },
      { label: 'texGen', detail: 'Texture Generation', documentation: 'Reference to TexGen class' },
      { label: 'PixelShaderID', detail: 'Pixel Shader ID', documentation: 'Pixel shader identifier' },
      { label: 'VertexShaderID', detail: 'Vertex Shader ID', documentation: 'Vertex shader identifier' },
      { label: 'Filter', detail: 'Filter Type', documentation: 'Texture filtering mode' }
    ];

    return properties.map(prop => {
      const item = this.createCompletionItem(
        prop.label,
        vscode.CompletionItemKind.Property,
        prop.detail,
        prop.documentation
      );
      // Add equals sign after property name
      item.insertText = new vscode.SnippetString(`${prop.label} = "`);
      return item;
    });
  }
}