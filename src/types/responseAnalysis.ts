export interface CommandAnalysis {
  description: string;
  possible_fixes: string[];
  corrected_command: string;
  explanation?: string;
}

export interface FileAnalysis {
  file_type: string;
  summary: string;
  issues: string[];
  recommendations: string[];
  security_analysis: string;
}

export type ResponseType = CommandAnalysis | FileAnalysis | string;
