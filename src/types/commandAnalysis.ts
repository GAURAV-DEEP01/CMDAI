export interface CommandAnalysis {
  description: string;
  possible_fixes: string[];
  corrected_command: string;
  explanation?: string;
}
