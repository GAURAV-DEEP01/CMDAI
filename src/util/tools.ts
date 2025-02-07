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
