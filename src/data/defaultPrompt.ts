interface CommandAnalysis {
  error: string;
  suggested_command: string;
  description: string;
  possible_fixes: string[];
  corrected_command: string;
  explanation?: string;
  common_mistakes?: string[];
  learning_resources?: string[];
}

// Function to generate the analysis prompt
export const generateAnalysisPrompt = (
  commandWithArguments: string,
  output: string,
  error: string,
  userPrompt?: string
): string => {
  // Enhanced base prompt with more context and examples
  const basePrompt = `You are an expert command-line analysis AI specializing in bash, zsh, and powershell environments. Your task is to analyze command-line inputs and provide detailed, actionable feedback.

Input Details:
- Command: ${commandWithArguments}
- Output/Error: ${output || error}
- Shell Environment: [auto-detected from error message or output format]

Analysis Guidelines:
1. Error Analysis:
   - Identify specific error type (syntax, permission, path, etc.)
   - Check for common shell-specific issues
   - Detect typos using edit distance comparison with known commands
   - Consider context-specific requirements (file permissions, directory structure)

2. Pattern Recognition:
   - Compare with common command patterns
   - Identify missing flags or arguments
   - Check for shell-specific syntax differences
   - Analyze quotation and escape character usage

3. Solution Framework:
   - Provide immediate fix for the specific error
   - Suggest best practices and alternative approaches
   - Include preventive measures for similar issues
   - Consider different shell environments

Please structure your response in the following JSON format (Stricty dont change the attribute names of the below Format):
{
  "error": "Clear, concise error description",
  "suggested_command": "Most appropriate command for the situation",
  "description": "Detailed technical explanation of the error and its context",
  "possible_fixes": [
    "Immediate solution with explanation",
    "Alternative approach if applicable",
    "Prevention tip for future reference"
  ],
  "corrected_command": "exact_command_to_run",
  "explanation": "Detailed explanation of why the error occurred and how the fix works",
  "common_mistakes": [
    "Related common mistakes to avoid",
    "Similar syntax errors to watch for"
  ],
  "learning_resources": [
    "Relevant man pages or documentation",
    "Helpful tutorial links or commands"
  ]
}

Examples for Pattern Recognition:
1. Typos: 'sl' → 'ls', 'gerp' → 'grep'
2. Missing Sudo: 'apt install' → 'sudo apt install'
3. Path Issues: './script.sh' when file not executable
4. Permission Errors: Identify need for chmod/chown
5. Shell-Specific Syntax: Different array syntax in bash vs zsh

Response Requirements:
- Ensure command suggestions are safe to execute
- Provide complete commands (not partial solutions)
- Include necessary flags and arguments
- Consider current directory context
- Account for different OS environments`;

  // If there's a user prompt, append it with specific instructions on how to use the context
  if (userPrompt) {
    return `${basePrompt}\n\nUser Context:\n${userPrompt}\n\nNote: Incorporate this user context to:
- Adjust technical complexity of explanations
- Provide more relevant examples
- Suggest appropriate learning resources
- Consider user's apparent expertise level
- Tailor solutions to user's specific environment`;
  }

  return basePrompt;
};

// Function to parse and validate the analysis response
export const parseAnalysisResponse = (response: string): CommandAnalysis => {
  try {
    const parsed = JSON.parse(response) as CommandAnalysis;

    // Validate required fields
    if (!parsed.error || !parsed.suggested_command || !parsed.description ||
      !Array.isArray(parsed.possible_fixes) || !parsed.corrected_command) {
      throw new Error('Invalid response format: missing required fields');
    }

    // Add default values for optional fields if they're missing
    return {
      ...parsed,
      explanation: parsed.explanation || '',
      common_mistakes: parsed.common_mistakes || [],
      learning_resources: parsed.learning_resources || []
    };
  } catch (error) {
    throw new Error(`Failed to parse command analysis response: ${error}`);
  }
};

// Utility function to detect shell type from error message
export const detectShellType = (error: string): 'bash' | 'zsh' | 'powershell' | 'unknown' => {
  if (error.includes('bash:')) return 'bash';
  if (error.includes('zsh:')) return 'zsh';
  if (error.toLowerCase().includes('powershell')) return 'powershell';
  return 'unknown';
};

//Example usage:
