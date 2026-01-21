// ──────────────────────────────────────────────
// Types and Interfaces - keeping our code organized (somehow)
// ──────────────────────────────────────────────

export interface ValidationState {
  pixelShader: string | null;
  vertexShader: string | null;
  currentStage: number | null;
  currentTexGen: number | null;
  insideStage: boolean;
  insideTexGen: boolean;
  hasTexture: boolean;
  hasUvSourceInStage: boolean;
  hasTexGenRef: boolean;
  texGenReferences: Set<number>;
  texGenHasUvSource: Map<number, boolean>;
  hasAnyValidTexGen: boolean;
  hasAnyTexGenWithUvSource: boolean;
  bracketStack: { line: number; char: number }[];  // ← изменено с string[] на объект для точной диагностики
}

export type DiagnosticCode =
  | 'suspicious-class'
  | 'invalid-texgen-value'
  | 'trash-after-semicolon'
  | 'missing-texture'
  | 'missing-uvsource'
  | 'unknown-pixel'
  | 'unknown-vertex'
  | 'bad-uvsource'
  | 'bad-flag'
  | 'bad-texture-ext'
  | 'bad-filter'
  | 'bad-bool'
  | 'bad-rgba'
  | 'rgba-range'
  | 'bad-specpower'
  | 'missing-texture-file'
  | 'unbalanced-brackets'
  | 'extra-closing-brace'
  | 'invalid-texgen-ref';