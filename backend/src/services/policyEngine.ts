import { detectInjection } from './injectionCheck'

interface OrderData {
  amount: number
  orderDate: Date
  finalSale: boolean
  status: string
}

interface PolicyResult {
  decision: 'approved' | 'denied' | 'escalated'
  reasoning: string
  flags: string[]
  rulesApplied: string[]
  needsAI: boolean
}

const REFUND_WINDOW_DAYS = 30
const HIGH_VALUE_THRESHOLD = 500

export function evaluatePolicy(order: OrderData, customerMessage: string): PolicyResult {
  const flags: string[] = []
  const rulesApplied: string[] = []
  const now = new Date()
  const orderDate = new Date(order.orderDate)
  const daysSinceOrder = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24))
  const withinWindow = daysSinceOrder <= REFUND_WINDOW_DAYS
  const isHighValue = order.amount > HIGH_VALUE_THRESHOLD
  const hasDamageClaim = /damage|damaged|defect|defective|crack|cracked|broken|break|shatter|scratch|dent|malfunction|wrong|incorrect|missing|stopped working|not working|doesn'?t work|won'?t (?:turn on|pair|connect|charge)|dead|faulty|fell apart|torn|ripped|zipper|stitching|peeling|flaking|leaking|leaky|silent|flicker|overheat|arrived (?:broken|damaged|defective)/i.test(customerMessage)
  const injection = detectInjection(customerMessage)

  // Rule 1: Suspicious/injection → Escalated
  if (injection.detected) {
    flags.push('prompt_injection_attempt')
    rulesApplied.push('Rule 5: Suspicious or Conflicting Requests')
    return {
      decision: 'escalated',
      reasoning: `Request flagged for suspicious content. Detected patterns: ${injection.patterns.join(', ')}. Escalated for manual review.`,
      flags,
      rulesApplied,
      needsAI: false,
    }
  }

  // Rule 2: High value → Escalated
  if (isHighValue) {
    rulesApplied.push('Rule 3: High-Value Threshold')
    return {
      decision: 'escalated',
      reasoning: `Order amount ($${order.amount}) exceeds the $500 threshold. Requires human review regardless of other factors.`,
      flags,
      rulesApplied,
      needsAI: false,
    }
  }

  // Rule 3: Final sale + damage claim → Escalated
  if (order.finalSale && hasDamageClaim) {
    rulesApplied.push('Rule 2: Final Sale Items', 'Rule 4: Damaged or Incorrect Items')
    return {
      decision: 'escalated',
      reasoning: 'Item is marked as final sale but the customer reports damage. Final-sale damage claims require human judgment.',
      flags,
      rulesApplied,
      needsAI: false,
    }
  }

  // Rule 4: Final sale, no damage → Denied
  if (order.finalSale && !hasDamageClaim) {
    rulesApplied.push('Rule 2: Final Sale Items')
    return {
      decision: 'denied',
      reasoning: 'This item was purchased under final sale terms and is not eligible for refund.',
      flags,
      rulesApplied,
      needsAI: false,
    }
  }

  // Rule 5: Outside window, no damage → Denied
  if (!withinWindow && !hasDamageClaim) {
    rulesApplied.push('Rule 1: Eligibility Window')
    return {
      decision: 'denied',
      reasoning: `Request submitted ${daysSinceOrder} days after order, which exceeds the 30-day refund window. No damage claim was made.`,
      flags,
      rulesApplied,
      needsAI: false,
    }
  }

  // Rule 6: Outside window + damage claim → Escalated
  if (!withinWindow && hasDamageClaim) {
    rulesApplied.push('Rule 1: Eligibility Window', 'Rule 4: Damaged or Incorrect Items')
    return {
      decision: 'escalated',
      reasoning: `Request submitted ${daysSinceOrder} days after order (outside the 30-day window), but the customer reports a damaged item. Late damage claims require human review.`,
      flags,
      rulesApplied,
      needsAI: false,
    }
  }

  // Rule 6/7: Within window — needs AI for consistency/tone check
  if (withinWindow) {
    if (hasDamageClaim) {
      rulesApplied.push('Rule 4: Damaged or Incorrect Items')
    } else {
      rulesApplied.push('Rule 6: Standard Approval Path')
    }
    return {
      decision: 'approved',
      reasoning: '', // AI will provide reasoning
      flags,
      rulesApplied,
      needsAI: true,
    }
  }

  // Rule 8: Unclassified → Escalated
  rulesApplied.push('Rule 7: Default / Ambiguous Cases')
  return {
    decision: 'escalated',
    reasoning: 'No clear policy rule applies to this case. Escalated for manual review.',
    flags,
    rulesApplied,
    needsAI: false,
  }
}
