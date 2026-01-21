// ──────────────────────────────────────────────
// Path Utilities - because paths can be tricky little things
// ──────────────────────────────────────────────

/**
 * Resolves a texture path to its full path based on the workspace or P: drive
 * Handles the Arma 3 P: drive convention
 */
export function resolveTextureFullPath(rawPath: string): string {
  const normalizedPath = normalizeTexturePath(rawPath);

  if (normalizedPath.toLowerCase().startsWith('p:/') || normalizedPath.toLowerCase().startsWith('p:\\')) {
    return normalizedPath.replace(/\//g, '\\');
  } else {
    // If it's not a P: drive path, treat it as relative to P: drive
    return `P:\\${normalizedPath.replace(/\//g, '\\')}`;
  }
}

/**
 * Normalizes a texture path by replacing backslashes with forward slashes
 * Makes path comparison easier across different systems
 */
export function normalizeTexturePath(path: string): string {
  return path.replace(/\\/g, '/');
}