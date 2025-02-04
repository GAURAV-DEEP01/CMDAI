import { detectShellEnvironment } from "../util/commandHistory";

export function defaultPrompt(
  commandWithArguments: string,
  output: string,
  error: string,
  userPrompt?: string
): string {
  const validationSchema = `// VALIDATION RULES - STRICTLY ENFORCED
1. JSON response MUST be wrapped in \`\`\`json code block and EXACTLY match this structure:
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
- No markdown except required code fences
- No code comments in JSON
- No placeholders
- No trailing commas
- No javascript/Typescript in JSON values
- No ambiguous suggestions`;

  const basePrompt = `You are a mission-critical command-line validation engine. Analyze and respond EXCLUSIVELY with a JSON object wrapped in \`\`\`json code block following these rules:

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
- Start response with \`\`\`json and end with \`\`\`
- corrected_command must pass \`shellcheck\` and \`shfmt\` validation
- Array lengths: possible_fixes[3]
- String lengths enforced per field (see schema)
- UTC timestamp: ${new Date().toISOString()}

Failure Consequences:
Invalid responses will cause:
1. Automated validation failure
2. Security lockdown
3. Incident reporting

Respond ONLY with the \`\`\`json code block containing valid JSON. No commentary before/after.`;

  return userPrompt
    ? `${basePrompt}\n\nUser Context:\n${userPrompt}\n\nADAPTATION RULES:\n- Maintain JSON code block structure\n- Preserve schema format\n- Keep timestamps\n- Sanitize user input`
    : basePrompt;
}

export function filePrompt(fileContent: string, userPrompt?: string): string {
  const validationSchema = `// VALIDATION RULES - STRICTLY ENFORCED
1. JSON response MUST be wrapped in \`\`\`json code block and EXACTLY match this structure:
\`\`\`json
{
  "file_type": "string (detected file type, e.g., 'JavaScript', 'YAML', 'CSV')",
  "summary": "string (50-200 characters, technical overview of file content)",
  "issues": ["string (specific issues found)", "...", "..."],
  "recommendations": ["string (concrete improvement steps)", "...", "..."],
  "security_analysis": "string (200-500 characters, security implications and risks)"
}
\`\`\`

2. STRICT PROHIBITIONS:
- No markdown except required code fences
- No code comments in JSON
- No placeholders
- No trailing commas
- No ambiguous suggestions
- No direct code execution suggestions`;

  const basePrompt = `You are a mission-critical file analysis engine. Analyze and respond EXCLUSIVELY with a JSON object wrapped in \`\`\`json code block following these rules:

${validationSchema}

Analysis Context:
\`\`\`
- FILE CONTENT: ${fileContent}
- FILE SIZE: ${fileContent.length} bytes
- ENCODING: UTF-8
- CWD: ${process.cwd()}
- USER: ${process.env.USER}
- OS: ${process.platform}
- TIMESTAMP: ${new Date().toISOString()}
\`\`\`

Analysis Protocol:
1. File type detection: Identify file format and syntax
2. Content validation: Check for syntax errors, inconsistencies, and anti-patterns
3. Security audit: Identify potential vulnerabilities and risks
4. Optimization check: Suggest improvements for readability, performance, and maintainability
5. Compliance check: Verify adherence to common standards and best practices

Response Requirements:
- Start response with \`\`\`json and end with \`\`\`
- Array lengths: issues[3], recommendations[3]
- String lengths enforced per field (see schema)
- UTC timestamp: ${new Date().toISOString()}

Failure Consequences:
Invalid responses will cause:
1. Automated validation failure
2. Security lockdown
3. Incident reporting

Respond ONLY with the \`\`\`json code block containing valid JSON. No commentary before/after.`;

  return userPrompt
    ? `${basePrompt}\n\nUser Context:\n${userPrompt}\n\nADAPTATION RULES:\n- Maintain JSON code block structure\n- Preserve schema format\n- Keep timestamps\n- Sanitize user input`
    : basePrompt;
}

// v2 different prompt when user gives --ask flag
