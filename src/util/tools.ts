import clc from 'cli-color';

export function clearStdLine() {
  process.stdout.write(clc.erase.line);
}

export const loadingAnimation = [
  '⠋',
  '⠙',
  '⠹',
  '⠸',
  '⠼',
  '⠴',
  '⠦',
  '⠧',
  '⠇',
  '⠏',
];

export function ValidationSchema(isFile: boolean): string {
  return `// JSON Validation Requirements ${
    isFile
      ? `{
      "file_type": "string (type of the file being analyzed)",
      "summary": "string (brief summary of the file)",
      "issues": ["string", "...", "..."],
      "recommendations": ["string", "...", "..."],
      "security_analysis": "string (detailed security analysis)"
    }`
      : `
    {
      "description": "string (technical explanation)",
      "possible_fixes": ["string", "...", "..."],
      "corrected_command": "string (directly executable)",
      "explanation": "string? (detailed analysis)",
    }`
  }`;
}
