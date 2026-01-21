import * as vscode from 'vscode';
import { VALID_PIXEL_SHADER_IDS, VALID_VERTEX_SHADER_IDS, VALID_UV_SOURCES, VALID_RENDER_FLAGS, VALID_FILTERS } from '../constants';
import { ValidationState } from '../types';
import { validateTexturePath } from './validateTexturePath';

// ──────────────────────────────────────────────
// Adding diagnostics - because someone has to keep track of mistakes
// ──────────────────────────────────────────────

export function addDiagnostic(diagnostics: vscode.Diagnostic[], document: vscode.TextDocument, lineNum: number, code: string, message: string, severity: vscode.DiagnosticSeverity = vscode.DiagnosticSeverity.Warning) {
  const line = document.lineAt(lineNum);
  const start = line.text.match(/^\s*/)?.[0].length || 0;
  const range = new vscode.Range(lineNum, start, lineNum, line.text.length);

  const diag = new vscode.Diagnostic(range, message, severity);
  diag.source = 'RVMAT Linter';
  diag.code = code;
  diagnostics.push(diag);
}

// ──────────────────────────────────────────────
// Property validation - where we judge your RVMAT skills
// ──────────────────────────────────────────────

export async function validateProperty(prop: string, rawValue: string, lineNumber: number, _fullLine: string, document: vscode.TextDocument, diagnostics: vscode.Diagnostic[], _state: ValidationState, collection: vscode.DiagnosticCollection) {
  const clean = rawValue.replace(/[";]/g, '').trim().toLowerCase();

  if (prop === 'pixelshaderid') {
    if (!VALID_PIXEL_SHADER_IDS.includes(clean)) {
      addDiagnostic(diagnostics, document, lineNumber, 'unknown-pixel', `Unknown PixelShaderID: ${clean}`, vscode.DiagnosticSeverity.Warning);
    }
  }

  if (prop === 'vertexshaderid') {
    if (!VALID_VERTEX_SHADER_IDS.includes(clean)) {
      addDiagnostic(diagnostics, document, lineNumber, 'unknown-vertex', `Unknown VertexShaderID: ${clean}`, vscode.DiagnosticSeverity.Warning);
    }
  }

  if (prop === 'uvsource' && !VALID_UV_SOURCES.includes(clean)) {
    addDiagnostic(diagnostics, document, lineNumber, 'bad-uvsource', `Invalid uvSource: ${clean}`, vscode.DiagnosticSeverity.Warning);
  }

  if (prop === 'renderflags') {
    const flags = rawValue.replace(/[{}"]/g, '').split(',').map(f => f.trim().toLowerCase());
    flags.forEach(f => {
      if (f && !VALID_RENDER_FLAGS.includes(f)) {
        addDiagnostic(diagnostics, document, lineNumber, 'bad-flag', `Unknown renderFlag: ${f}`, vscode.DiagnosticSeverity.Warning);
      }
    });
  }

  if (prop === 'texture') {
    const path = rawValue.replace(/[";]/g, '').trim();
    if (!path.startsWith('#(') && !path.toLowerCase().endsWith('.paa')) {
      addDiagnostic(diagnostics, document, lineNumber, 'bad-texture-ext',
        'Texture should end with .paa (or be procedural)',
        vscode.DiagnosticSeverity.Warning);

      collection.set(document.uri, diagnostics);
    }
    else if (path.toLowerCase().endsWith('.paa') && !path.startsWith('#(')) {
      const config = vscode.workspace.getConfiguration('rvmat-linter');
      const checkTextures = config.get<boolean>('checkTextures', true);

      if (checkTextures) {
        await validateTexturePath(path, document, diagnostics, lineNumber, collection);
      }
    }
  }

  if (prop === 'filter' && !VALID_FILTERS.includes(clean)) {
    addDiagnostic(diagnostics, document, lineNumber, 'bad-filter', `Invalid Filter: ${clean}`, vscode.DiagnosticSeverity.Warning);
  }

  if (prop === 'useworldenvmap' && !['true', 'false'].includes(clean)) {
    addDiagnostic(diagnostics, document, lineNumber, 'bad-bool', `useWorldEnvMap should be true/false`, vscode.DiagnosticSeverity.Error);
  }

  // RGBA properties validation - strict format checking
  if (['ambient','diffuse','specular','emissive','emmisive','forceddiffuse'].includes(prop)) {
    // Match the format {value,value,value,value}
    const m = rawValue.match(/\{([^}]+)\}/);
    if (m) {
      const values = m[1].split(',');
      const nums: number[] = [];
      let hasError = false;

      // Check each value individually for strict numeric format
      for (let i = 0; i < values.length; i++) {
        const val = values[i].trim();

        // Strict check: value must be a valid number format (no extra chars)
        // Matches: "0.7", "1", "-0.5", "123.456" but NOT "0.7qwe", "1abc", etc.
        if (!/^-?\d+(\.\d+)?$/.test(val)) {
          addDiagnostic(diagnostics, document, lineNumber, 'bad-rgba-value', `${prop}[${i}] — invalid numeric value: "${val}", expected a decimal number`, vscode.DiagnosticSeverity.Error);
          hasError = true;
          continue;
        }

        const num = parseFloat(val);
        if (isNaN(num)) {
          addDiagnostic(diagnostics, document, lineNumber, 'bad-rgba-value', `${prop}[${i}] — invalid numeric value: "${val}"`, vscode.DiagnosticSeverity.Error);
          hasError = true;
          continue;
        }

        nums.push(num);
      }

      // If there were format errors, we already reported them
      if (hasError) {
        // Error already reported for invalid values
      } else if (nums.length !== 4) {
        // Check if we have exactly 4 values
        addDiagnostic(diagnostics, document, lineNumber, 'bad-rgba', `${prop} — should have exactly 4 values in format {r,g,b,a} (got: ${nums.length})`, vscode.DiagnosticSeverity.Error);
      } else {
        // All 4 values are valid numbers, now check range
        // Standard range is 0..1, but allow up to 100 as reasonable maximum
        if (nums.some(n => n < 0)) {
          addDiagnostic(diagnostics, document, lineNumber, 'rgba-range', `${prop} — values must be non-negative (got: ${nums.join(',')})`, vscode.DiagnosticSeverity.Warning);
        } else if (nums.some(n => n > 100)) {
          addDiagnostic(diagnostics, document, lineNumber, 'rgba-range', `${prop} — values should be <= 100 (got: ${nums.join(',')})`, vscode.DiagnosticSeverity.Warning);
        } else if (nums.some(n => n > 1)) {
          // Values between 1 and 100 are allowed but warn about it
          addDiagnostic(diagnostics, document, lineNumber, 'rgba-range', `${prop} — values > 1 detected (got: ${nums.join(',')}); typical range is 0..1`, vscode.DiagnosticSeverity.Information);
        }
      }
    } else {
      // Format doesn't match {value,value,value,value}
      addDiagnostic(diagnostics, document, lineNumber, 'bad-rgba-format', `${prop} — invalid format, expected {r,g,b,a}`, vscode.DiagnosticSeverity.Error);
    }
  }

  if (prop === 'specularpower') {
    // Strict check for specularPower: must be a pure number (no extra chars)
    // Matches: "40", "0.5", "123.456" but NOT "40abc", "0.5xyz", etc.
    if (!/^-?\d+(\.\d+)?$/.test(clean)) {
      addDiagnostic(diagnostics, document, lineNumber, 'bad-specpower', `specularPower — invalid numeric value: "${clean}", expected a decimal number`, vscode.DiagnosticSeverity.Error);
    } else {
      const n = parseFloat(clean);
      if (isNaN(n)) {
        addDiagnostic(diagnostics, document, lineNumber, 'bad-specpower', 'specularPower — expected numeric value', vscode.DiagnosticSeverity.Error);
      } else if (n < 0) {
        // Negative values are not allowed
        addDiagnostic(diagnostics, document, lineNumber, 'bad-specpower', 'specularPower — should be non-negative value', vscode.DiagnosticSeverity.Warning);
      } else if (n > 10000) {
        // Very large values are suspicious
        addDiagnostic(diagnostics, document, lineNumber, 'bad-specpower', `specularPower — value ${n} seems too large (>10000)`, vscode.DiagnosticSeverity.Warning);
      }
    }
  }
}