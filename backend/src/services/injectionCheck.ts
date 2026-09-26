const INJECTION_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /ignore\s+\w+\s+\w*\s*instructions?/i, label: 'ignore_instructions' },
  { pattern: /you\s+are\s+now\s+(a|an|the)/i, label: 'role_override' },
  { pattern: /as\s+(an?\s+)?(admin|administrator|system)/i, label: 'admin_impersonation' },
  { pattern: /i\s+(am|have)\s+(authorized|permission|authority)/i, label: 'authority_claim' },
  { pattern: /override\s+(the\s+)?(policy|rules?|system)/i, label: 'policy_override' },
  { pattern: /disregard\s+(the\s+)?(policy|rules?|previous)/i, label: 'disregard_policy' },
  { pattern: /system\s+prompt|assistant\s+prompt|developer\s+mode/i, label: 'prompt_access' },
  { pattern: /act\s+as\s+if\s+you\s+have\s+no\s+restrictions/i, label: 'restriction_bypass' },
  { pattern: /i\s+(am|have)\s+the\s+right\s+to/i, label: 'right_claim' },
  { pattern: /you\s+must\s+(approve|process|accept)/i, label: 'command_instruction' },
  { pattern: /from\s+now\s+on\s+you\s+(are|will)/i, label: 'role_change' },
  { pattern: /do\s+not\s+(follow|check|verify)\s+(the\s+)?(policy|rules)/i, label: 'policy_bypass' },
]

export function detectInjection(text: string): { detected: boolean; patterns: string[] } {
  const matched: string[] = []

  for (const { pattern, label } of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      matched.push(label)
    }
  }

  return {
    detected: matched.length > 0,
    patterns: matched,
  }
}
