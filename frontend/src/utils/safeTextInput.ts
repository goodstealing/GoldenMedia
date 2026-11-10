export type SafeTextProfile = "default" | "url" | "cfi";

export const UNSAFE_TEXT_MESSAGE =
  "Ввод программного кода и операторов запрещён";

export interface SafeTextValidationResult {
  ok: boolean;
  message?: string;
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

function matchesUnsafeCode(value: string, profile: SafeTextProfile): string | null {
  if (!value) {
    return null;
  }

  const injectionChecks: Array<[RegExp, string]> = [
    [METHOD_CALL_PATTERN, "вызов alert/confirm/prompt"],
    [CONSOLE_PATTERN, "вызов console.*"],
    [EVAL_PATTERN, "eval или Function"],
    [SCRIPT_PATTERN, "внедрение скрипта"],
  ];

  for (const [pattern] of injectionChecks) {
    if (pattern.test(value)) {
      return UNSAFE_TEXT_MESSAGE;
    }
  }

  if (profile === "cfi") {
    return null;
  }

  const commonChecks: Array<[RegExp, string]> = [
    [KEYWORD_PATTERN, "ключевое слово"],
    [ARROW_PATTERN, "стрелочная функция"],
    [INCREMENT_PATTERN, "инкремент/декремент"],
    [TEMPLATE_INJECTION, "шаблонная строка"],
    [BLOCK_COMMENT, "блочный комментарий"],
    [LINE_COMMENT, "строчный комментарий"],
    [SEMICOLON_STATEMENT, "оператор с точкой с запятой"],
  ];

  for (const [pattern] of commonChecks) {
    if (pattern.test(value)) {
      return UNSAFE_TEXT_MESSAGE;
    }
  }

  if (profile === "url") {
    return null;
  }

  if (COMPARISON_PATTERN.test(value)) {
    return UNSAFE_TEXT_MESSAGE;
  }

  if (ASSIGNMENT_PATTERN.test(value)) {
    return UNSAFE_TEXT_MESSAGE;
  }

  return null;
}

export function validateSafeText(
  value: string,
  profile: SafeTextProfile = "default"
): SafeTextValidationResult {
  const message = matchesUnsafeCode(value, profile);
  if (message) {
    return { ok: false, message };
  }
  return { ok: true };
}

export function isUnsafeText(
  value: string,
  profile: SafeTextProfile = "default"
): boolean {
  return !validateSafeText(value, profile).ok;
}

export function applySafeTextChange(
  nextValue: string,
  onChange: (value: string) => void,
  profile: SafeTextProfile = "default"
): boolean {
  if (isUnsafeText(nextValue, profile)) {
    return false;
  }
  onChange(nextValue);
  return true;
}

export function validateSafeTextFields(
  fields: Record<string, string | null | undefined>,
  profiles: Partial<Record<string, SafeTextProfile>> = {}
): SafeTextValidationResult {
  for (const [name, value] of Object.entries(fields)) {
    if (value == null || value === "") {
      continue;
    }
    const profile = profiles[name] ?? "default";
    const result = validateSafeText(value, profile);
    if (!result.ok) {
      return {
        ok: false,
        message: `${result.message} (поле: ${name})`,
      };
    }
  }
  return { ok: true };
}
