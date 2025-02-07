import clc from 'cli-color';

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

export function detectShellEnvironment(error: string): string {
  const patterns = {
    bash: /(bash:|syntax error near unexpected token|declare -)/i,
    zsh: /(zsh:|no matches found:|bad pattern)/i,
    powershell: /(PS>|The term '.*' is not recognized)/i,
    cmd: /'(.*)' is not recognized as an internal or external command/i,
  };

  return (
    Object.entries(patterns).find(([_, regex]) => regex.test(error))?.[0] ||
    'posix'
  );
}

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
