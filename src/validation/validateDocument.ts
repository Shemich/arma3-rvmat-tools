import * as vscode from 'vscode';
import { ValidationState } from '../types';
import { addDiagnostic } from './validateProperty';
import { validateProperty } from './validateProperty';
import { VALID_UV_SOURCES } from '../constants';

// Main document validation function - where the magic happens
export async function validateDocument(document: vscode.TextDocument, collection: vscode.DiagnosticCollection) {
  if (document.languageId !== 'rvmat') return;

  const diagnostics: vscode.Diagnostic[] = [];

  const state: ValidationState = {
    pixelShader: null,
    vertexShader: null,
    currentStage: null,
    currentTexGen: null,
    insideStage: false,
    insideTexGen: false,
    hasTexture: false,
    hasUvSourceInStage: false,
    hasTexGenRef: false,
    texGenReferences: new Set<number>(),
    texGenHasUvSource: new Map<number, boolean>(),
    hasAnyValidTexGen: false,
    hasAnyTexGenWithUvSource: false,
    bracketStack: [],
  };

  const text = document.getText();
  const lines = text.split(/\r?\n/);

  let i = 0;
  while (i < lines.length) {
    let line = lines[i];
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('//')) {
      i++;
      continue;
    }

    // Удаляем однострочный комментарий
    const commentIndex = line.indexOf('//');
    if (commentIndex !== -1) {
      line = line.substring(0, commentIndex);
    }

    // ─── Bracket balance tracking ───────────────────────
    let pos = 0;
    while ((pos = line.indexOf('{', pos)) !== -1) {
      state.bracketStack.push({ line: i, char: pos });
      pos++;
    }

    pos = 0;
    while ((pos = line.indexOf('}', pos)) !== -1) {
      if (state.bracketStack.length === 0) {
        addDiagnostic(
          diagnostics,
          document,
          i,
          'extra-closing-brace',
          'Extra closing brace }',
          vscode.DiagnosticSeverity.Error
        );
      } else {
        state.bracketStack.pop();
      }
      pos++;
    }

    // ─── Shader ID detection ────────────────────────────
    const pixelMatch = line.match(/PixelShaderID\s*=\s*"([^"]*)"/i);
    if (pixelMatch) {
      state.pixelShader = pixelMatch[1].trim().toLowerCase();
      // Validate the PixelShaderID value
      await validateProperty('pixelshaderid', `"${pixelMatch[1]}"`, i, line, document, diagnostics, state, collection);
    }

    const vertexMatch = line.match(/VertexShaderID\s*=\s*"([^"]*)"/i);
    if (vertexMatch) {
      state.vertexShader = vertexMatch[1].trim().toLowerCase();
      // Validate the VertexShaderID value
      await validateProperty('vertexshaderid', `"${vertexMatch[1]}"`, i, line, document, diagnostics, state, collection);
    }

    // ─── Class start ────────────────────────────────────
    const classMatch = line.match(/\bclass\s+([a-zA-Z0-9_]+)/i);
    if (classMatch) {
      const className = classMatch[1];

      if (/^Stage(\d+)$/i.test(className)) {
        state.currentStage = parseInt(RegExp.$1, 10);
        state.insideStage = true;
        state.currentTexGen = null;
        state.insideTexGen = false;
        state.hasTexture = false;
        state.hasUvSourceInStage = false;
        state.hasTexGenRef = false;
        state.texGenReferences.clear();
      }
      else if (/^TexGen(\d+)$/i.test(className)) {
        const num = parseInt(RegExp.$1, 10);
        state.currentTexGen = num;
        state.insideTexGen = true;
        state.hasAnyValidTexGen = true;
        if (!state.texGenHasUvSource.has(num)) {
          state.texGenHasUvSource.set(num, false); // default — пока не увидим нормальный uvSource
        }
      }
      else if (/^(uvTransform|aside|up|dir|pos)$/i.test(className)) {
        // вложенные — ок
      }
      else {
        addDiagnostic(
          diagnostics,
          document,
          i,
          'suspicious-class',
          `Unexpected class name: "${className}"`,
          vscode.DiagnosticSeverity.Information
        );
      }

      // Parse properties inside the class definition if present in the same line
      if (line.includes('{')) {
        const contentAfterBrace = line.substring(line.indexOf('{') + 1);
        // const contentBeforeClosingBrace = contentAfterBrace.includes('}')
        //   ? contentAfterBrace.substring(0, contentAfterBrace.indexOf('}'))
        //   : contentAfterBrace;

        // Split by semicolons to get individual property assignments
        const propertyParts = contentAfterBrace.split(';');
        for (const part of propertyParts) {
          const trimmedPart = part.trim();
          if (trimmedPart) {
            // Check if this part looks like a property assignment
            const propMatch = trimmedPart.match(/^\s*([a-zA-Z0-9_[\]]+)\s*=\s*(.+)$/i);
            if (propMatch) {
              let prop = propMatch[1].toLowerCase().trim();
              // Remove square brackets to normalize property names like "specular[]" to "specular"
              prop = prop.replace(/\[\s*\]/g, '');
              const value = propMatch[2].trim();

              if (state.insideStage) {
                if (prop === 'texture') {
                  state.hasTexture = true;
                }
                if (prop === 'uvsource') {
                  state.hasUvSourceInStage = true; // на всякий случай, если regex пропустил
                }
                if (prop === 'texgen') {
                  const m = value.match(/"?(\d+)"?/);
                  if (m) {
                    const ref = parseInt(m[1], 10);
                    if (!isNaN(ref) && ref >= 0) {
                      state.texGenReferences.add(ref);
                      state.hasTexGenRef = true;
                      // Предварительная отметка — если texGen уже известен и валиден
                      if (state.texGenHasUvSource.get(ref) === true) {
                        state.hasUvSourceInStage = true;
                      }
                    } else {
                      addDiagnostic(
                        diagnostics,
                        document,
                        i,
                        'invalid-texgen-ref',
                        `Invalid texGen reference: "${value}"`,
                        vscode.DiagnosticSeverity.Warning
                      );
                    }
                  }
                }

                await validateProperty(prop, value, i, line, document, diagnostics, state, collection);
              } else if (state.insideTexGen && state.currentTexGen !== null) {
                // Обработка свойств внутри TexGen
                if (prop === 'uvsource') {
                  const uvValue = value.replace(/["';]/g, '').toLowerCase();
                  const isValidUv = uvValue !== 'none' && uvValue !== '' && uvValue !== '""';
                  state.texGenHasUvSource.set(state.currentTexGen, isValidUv);
                  if (isValidUv) {
                    state.hasAnyTexGenWithUvSource = true;
                  }
                }

                await validateProperty(prop, value, i, line, document, diagnostics, state, collection);
              } else if (!state.insideStage && !state.insideTexGen) {
                // Check if this is a property that should be validated globally (not just in Stage)
                const globalProps = ['ambient', 'diffuse', 'specular', 'emissive', 'emmisive', 'forceddiffuse', 'specularpower'];
                if (globalProps.includes(prop)) {
                  await validateProperty(prop, value, i, line, document, diagnostics, state, collection);
                }
              }
            }
          }
        }
      }
    }

    // ─── Более надёжное обнаружение uvSource ─────────────
    const uvMatch = line.match(/^\s*uvSource\s*=\s*["']?([^"';]+)["']?\s*;?/i);
    if (uvMatch) {
      const uvValue = uvMatch[1].trim().toLowerCase();
      const isValidUv = uvValue !== 'none' && uvValue !== '' && uvValue !== '""';

      // Check if uvValue is in the valid list
      if (uvValue && !VALID_UV_SOURCES.includes(uvValue)) {
        addDiagnostic(diagnostics, document, i, 'bad-uvsource', `Invalid uvSource value: "${uvValue}" (expected: ${VALID_UV_SOURCES.join(', ')})`, vscode.DiagnosticSeverity.Error);
      }

      if (state.insideTexGen && state.currentTexGen !== null) {
        state.texGenHasUvSource.set(state.currentTexGen, isValidUv);
        if (isValidUv) {
          state.hasAnyTexGenWithUvSource = true;
        }
      }
      else if (state.insideStage) {
        state.hasUvSourceInStage = isValidUv;
      }
    }

    // ─── Properties inside Stage ────────────────────────
    if (state.insideStage) {
      const propMatch = line.match(/^\s*([a-zA-Z0-9_[\]]+)\s*=\s*([^;]*)/i);
      if (propMatch) {
        let prop = propMatch[1].toLowerCase().trim();
        // Remove square brackets to normalize property names like "specular[]" to "specular"
        prop = prop.replace(/\[\s*\]/g, '');
        const value = propMatch[2].trim();

        if (prop === 'texture') {
          state.hasTexture = true;
        }
        if (prop === 'uvsource') {
          state.hasUvSourceInStage = true; // на всякий случай, если regex пропустил
        }
        if (prop === 'texgen') {
          const m = value.match(/"?(\d+)"?/);
          if (m) {
            const ref = parseInt(m[1], 10);
            if (!isNaN(ref) && ref >= 0) {
              state.texGenReferences.add(ref);
              state.hasTexGenRef = true;
              // Предварительная отметка — если texGen уже известен и валиден
              if (state.texGenHasUvSource.get(ref) === true) {
                state.hasUvSourceInStage = true;
              }
            } else {
              addDiagnostic(
                diagnostics,
                document,
                i,
                'invalid-texgen-ref',
                `Invalid texGen reference: "${value}"`,
                vscode.DiagnosticSeverity.Warning
              );
            }
          }
        }

        await validateProperty(prop, value, i, line, document, diagnostics, state, collection);
      }
    }

    // ─── Properties outside Stage (for global properties like ambient, diffuse, etc.) ────────────────────────
    if (!state.insideStage) {
      const propMatch = line.match(/^\s*([a-zA-Z0-9_[\]]+)\s*=\s*([^;]*)/i);
      if (propMatch) {
        let prop = propMatch[1].toLowerCase().trim();
        // Remove square brackets to normalize property names like "specular[]" to "specular"
        prop = prop.replace(/\[\s*\]/g, '');
        const value = propMatch[2].trim();

        // Check if this is a property that should be validated globally (not just in Stage)
        const globalProps = ['ambient', 'diffuse', 'specular', 'emissive', 'emmisive', 'forceddiffuse', 'specularpower'];
        if (globalProps.includes(prop)) {
          await validateProperty(prop, value, i, line, document, diagnostics, state, collection);
        }
      }
    }

    // ─── Trash after semicolon ──────────────────────────
    const lastSemi = line.lastIndexOf(';');
    if (lastSemi !== -1) {
      const after = line.substring(lastSemi + 1).trim();
      if (
        after.length > 0 &&
        !/^(\/\/.*)?$/.test(after) &&
        !/^\s*(\}|;|\})\s*(\/\/.*)?$/.test(after) &&
        !after.startsWith('class')
      ) {
        addDiagnostic(
          diagnostics,
          document,
          i,
          'trash-after-semicolon',
          `Suspicious content after semicolon: "${after}"`,
          vscode.DiagnosticSeverity.Warning
        );
      }
    }

    // ─── Closing Stage ──────────────────────────────────
    if (trimmed.includes('};') && state.insideStage) {
      if (!state.hasTexture) {
        addDiagnostic(
          diagnostics,
          document,
          i,
          'missing-texture',
          `Stage${state.currentStage} missing 'texture' property`,
          vscode.DiagnosticSeverity.Error
        );
      }

      const isMultiOrSuper = ['multi', 'super', 'superext'].some(s =>
        (state.pixelShader || '').includes(s) || (state.vertexShader || '').includes(s)
      );

      // Отладка — можно удалить позже
      console.log(`Stage${state.currentStage} refs:`, Array.from(state.texGenReferences));
      console.log(`TexGen map:`, Object.fromEntries(state.texGenHasUvSource));

      // ── Проверка UV для этой конкретной Stage ──
      let uvValid = state.hasUvSourceInStage;

      if (!uvValid && state.hasTexGenRef && state.texGenReferences.size > 0) {
        const allValid = Array.from(state.texGenReferences).every(ref =>
          state.texGenHasUvSource.get(ref) === true
        );
        uvValid = allValid;
      }

      if (!uvValid) {
        const severity = isMultiOrSuper
          ? vscode.DiagnosticSeverity.Information
          : vscode.DiagnosticSeverity.Warning;

        let msg = `Stage${state.currentStage} has no valid uvSource`;

        if (state.texGenReferences.size > 0) {
          const bad = Array.from(state.texGenReferences)
            .filter(ref => state.texGenHasUvSource.get(ref) !== true)
            .join(', ');

          msg += bad
            ? ` (problematic texGen: ${bad})`
            : ` (referenced texGen missing or invalid)`;
        }

        addDiagnostic(diagnostics, document, i, 'missing-uvsource', msg, severity);
      }

      // Сброс состояния Stage
      state.insideStage = false;
      state.currentStage = null;
      state.hasTexture = false;
      state.hasUvSourceInStage = false;
      state.hasTexGenRef = false;
      state.texGenReferences.clear();
    }

    // ─── Closing TexGen ─────────────────────────────────
    if (trimmed.includes('};') && state.insideTexGen) {
      state.insideTexGen = false;
      state.currentTexGen = null;
    }

    i++;
  }

  // ─── Unbalanced brackets ────────────────────────────
  for (const { line: l, char: c } of state.bracketStack) {
    const range = new vscode.Range(l, c, l, c + 1);
    const diag = new vscode.Diagnostic(
      range,
      'Unclosed opening brace {',
      vscode.DiagnosticSeverity.Error
    );
    diag.source = 'RVMAT Linter';
    diagnostics.push(diag);
  }

  collection.set(document.uri, diagnostics);
}