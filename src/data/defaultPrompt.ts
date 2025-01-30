export const defaultPrompt = (
  commandWithArguments: string,
  output: string,
  error: string,
  userPrompt?: string
): string => {
  const validationSchema = `// VALIDATION RULES - STRICTLY ENFORCED
1. JSON response MUST EXACTLY match this structure:
\`\`\`json
{
  "description": "string (50-200 characters, technical details)",
  "possible_fixes": ["string (concrete steps)", "...", "..."],
  "corrected_command": "string (directly executable verification-ready command)",
  "explanation": "string (200-500 characters, cause-and-effect analysis)"
}
\`\`\`

2. corrected_command MUST be:
- Executable as-is in detected shell
- Include necessary environment context
- Properly escaped for JSON and target shell
- Validated against common security risks

3. STRICT PROHIBITIONS:
- No markdown formatting
- No code comments
- No placeholders
- No trailing commas
- No javascript/Typescript inside JSON for formatting
- No ambiguous suggestions`;

  const basePrompt = `You are a mission-critical command-line validation engine. Analyze and respond EXCLUSIVELY with valid JSON following these rules:

${validationSchema}

Analysis Context:
\`\`\`
- COMMAND: ${commandWithArguments}
- OUTPUT: ${output}
- ERROR: ${error}
- ENV: ${detectShellEnvironment(error)}
- CWD: ${process.cwd()}
- USER: ${process.env.USER}
- OS: ${process.platform}
\`\`\`

Validation Protocol:
1. Command autopsy: Line-by-line shell interpretation
2. Error pattern matching: Cross-reference with 10k+ known issue database
3. Path resolution: Verify absolute vs relative paths
4. Permissions check: User/group/file mode analysis
5. Shell-specific syntax validation: Strict POSIX compliance check
6. Security audit: Flag potential harmful patterns
7. Escape sequence verification: Validate quoting/escaping

Response Requirements:
- corrected_command must pass \`shellcheck\` and \`shfmt\` validation
- Array lengths: possible_fixes[3]
- String lengths enforced per field (see schema)
- UTC timestamp: ${new Date().toISOString()}

Failure Consequences:
Invalid responses will cause:
1. Automated validation failure
2. Security lockdown
3. Incident reporting

Response MUST be valid JSON with NO extra formatting or explanations outside the JSON structure.
`;

  return userPrompt
    ? `${basePrompt}\n\nUser Context:\n${userPrompt}\n\nADAPTATION RULES:\n- Maintain JSON validity\n- Preserve schema structure\n- Keep timestamps\n- Sanitize user input`
    : basePrompt;
};

// Helper function to detect shell environment
const detectShellEnvironment = (error: string): string => {
  const patterns = {
    bash: /(bash:|syntax error near unexpected token|declare -)/i,
    zsh: /(zsh:|no matches found:|bad pattern)/i,
    powershell: /(PS>|The term '.*' is not recognized)/i,
    cmd: /'(.*)' is not recognized as an internal or external command/i,
  };

  return (
    Object.entries(patterns).find(([_, regex]) => regex.test(error))?.[0] ||
    "posix"
  );
};
