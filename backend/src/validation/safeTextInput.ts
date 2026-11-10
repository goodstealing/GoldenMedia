export type SafeTextProfile = "default" | "url" | "cfi";

export const UNSAFE_TEXT_MESSAGE =
  "Ввод программного кода и операторов запрещён";

export class SafeTextValidationError extends Error {
  readonly field: string;

  constructor(field: string, message: string = UNSAFE_TEXT_MESSAGE) {
    super(message);
    this.name = "SafeTextValidationError";
    this.field = field;
  }
}

const KEYWORD_PATTERN =
  /\b(let|const|var|if|else|switch|case|default|for|while|do|function|return|eval|typeof|instanceof|class|extends|import|export|await|async|try|catch|finally|throw|delete|void|with|debugger|new)\b/i;

const METHOD_CALL_PATTERN = /\b(alert|confirm|prompt)\s*\(/i;
const CONSOLE_PATTERN =
  /\bconsole\.(log|warn|error|info|debug|trace|dir|table)\s*\(/i;
const EVAL_PATTERN = /\beval\s*\(|new\s+Function\s*\(/i;
const SCRIPT_PATTERN =
  /<\s*script\b|javascript\s*:|vbscript\s*:|data\s*:\s*text\/html|on\w+\s*=/i;
const ARROW_PATTERN = /=>/;
const COMPARISON_PATTERN = /===|!==|(?<![<>!=])==(?!=)|(?<![<>])!=(?!=)|<=|>=/;
const INCREMENT_PATTERN = /\+\+|--/;
const TEMPLATE_INJECTION = /\$\{/;
const BLOCK_COMMENT = /\/\*[\s\S]*?\*\//;
const LINE_COMMENT = /(?:^|\s)\/\//m;
const ASSIGNMENT_PATTERN = /\b[a-zA-Z_$][\w$]*\s*=(?!=)/;
const SEMICOLON_STATEMENT = /;\s*(let|const|var|if|for|while|return|function)\b/i;

function matchesUnsafeCode(value: string, profile: SafeTextProfile): boolean {
  if (!value) {
    return false;
  }

  const injectionChecks = [
    METHOD_CALL_PATTERN,
    CONSOLE_PATTERN,
    EVAL_PATTERN,
    SCRIPT_PATTERN,
  ];

  if (injectionChecks.some((pattern) => pattern.test(value))) {
    return true;
  }

  if (profile === "cfi") {
    return false;
  }

  const commonChecks = [
    KEYWORD_PATTERN,
    ARROW_PATTERN,
    INCREMENT_PATTERN,
    TEMPLATE_INJECTION,
    BLOCK_COMMENT,
    LINE_COMMENT,
    SEMICOLON_STATEMENT,
  ];

  if (commonChecks.some((pattern) => pattern.test(value))) {
    return true;
  }

  if (profile === "url") {
    return false;
  }

  return COMPARISON_PATTERN.test(value) || ASSIGNMENT_PATTERN.test(value);
}

export function assertSafeText(
  value: unknown,
  field: string,
  profile: SafeTextProfile = "default"
): void {
  if (value == null || value === "") {
    return;
  }
  if (typeof value !== "string") {
    return;
  }
  if (matchesUnsafeCode(value, profile)) {
    throw new SafeTextValidationError(field);
  }
}

export function assertSafeTextFields(
  fields: Record<string, unknown>,
  profiles: Partial<Record<string, SafeTextProfile>> = {}
): void {
  for (const [name, value] of Object.entries(fields)) {
    assertSafeText(value, name, profiles[name] ?? "default");
  }
}

export function assertSafeQueryText(
  value: unknown,
  field: string,
  profile: SafeTextProfile = "default"
): void {
  if (value == null || value === "") {
    return;
  }
  assertSafeText(String(value), field, profile);
}
