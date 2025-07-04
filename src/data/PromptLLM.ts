import { detectShellEnvironment } from '../util/tools';

function buildBasePrompt(
  engineType: 'command-line validation' | 'file analysis',
  analysisContext: string,
  validationSchema: string,
  userPrompt?: string,
): string {
  let basePrompt = `You are a mission-critical ${engineType} engine. Analyze and respond EXCLUSIVELY with a JSON object wrapped in \`\`\`json code block following these rules:

${validationSchema}

${analysisContext}

Response Requirements:
- Start response with \`\`\`json and end with \`\`\`
${
  engineType === 'command-line validation'
    ? '- corrected_command must pass `shellcheck` and `shfmt` validation'
    : ''
}
Failure Consequences:
- Automated validation failure
- Security lockdown
- Incident reporting`;

  if (userPrompt) {
    basePrompt += `

User Context:
${userPrompt}

ADAPTATION RULES:
- Maintain JSON code block structure
- Preserve schema format
- Sanitize user input`;
  }

  return basePrompt;
}

export function defaultPrompt(
  commandWithArguments: string,
  output: string,
  error: string,
  userPrompt?: string,
): string {
  const validationSchema = `// VALIDATION RULES - STRICTLY ENFORCED
1. JSON response MUST be wrapped in \`\`\`json code block and EXACTLY match this structure:
\`\`\`json
{
  "description": "string (50-200 characters, technical details)",
  "possible_fixes": ["string (concrete steps)", "string", "string"],
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
- No ambiguous suggestions`;

  const analysisContext = `Analysis Context:
\`\`\`
- COMMAND: ${commandWithArguments}
- OUTPUT: ${output}
- ERROR: ${error}
- ENV: ${detectShellEnvironment(error)}
- CWD: ${process.cwd()}
- USER: ${process.env.USER}
- OS: ${process.platform}
- UTC TIMESTAMP: ${new Date().toISOString()}
\`\`\``;

  return buildBasePrompt(
    'command-line validation',
    analysisContext,
    validationSchema,
    userPrompt,
  );
}

export function filePrompt(
  fileContent: string,
  filePath: string,
  userPrompt?: string,
): string {
  const validationSchema = `// VALIDATION RULES - STRICTLY ENFORCED
1. JSON response MUST be wrapped in \`\`\`json code block and EXACTLY match this structure:
\`\`\`json
{
  "file_type": "string (derive from the file path = ${filePath} )",
  "summary": "string (50-200 characters, technical overview of file content)",
  "issues": ["string (specific issues or improvements found)", "string", "string"],
  "recommendations": ["string (concrete improvement steps)", "string", "string"],
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

  const analysisContext = `Analysis Context:
\`\`\`
- FILE CONTENT: ${fileContent}
- FILE PATH: ${filePath}
- ENCODING: UTF-8
- OS: ${process.platform}
- UTC TIMESTAMP: ${new Date().toISOString()}
\`\`\``;

  return buildBasePrompt(
    'file analysis',
    analysisContext,
    validationSchema,
    userPrompt,
  );
}
