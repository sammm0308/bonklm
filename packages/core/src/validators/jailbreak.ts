/**
 * BonkLM - Jailbreak Validator
 * =====================================
 * Multi-layer defense against AI jailbreak attempts.
 *
 * Detection Layers:
 * 1. Unicode normalization and confusable character mapping
 * 2. Pattern matching (44 patterns across 10 categories)
 * 3. Multi-turn pattern detection
 * 4. Fuzzy matching for keyword variations
 * 5. Heuristic behavioral analysis
 * 6. Session risk tracking with decay and escalation
 *
 * Ported from BMAD-CYBERSEC with framework-agnostic design.
 */

import { createLogger, type Logger } from '../base/GenericLogger.js';
import { createResult, Finding, type GuardrailResult, Severity } from '../base/GuardrailResult.js';
import { type JailbreakConfig, mergeConfig, type ValidatorConfig } from '../base/ValidatorConfig.js';
import { normalizeText } from './text-normalizer.js';
import {
  type SessionPatternFinding,
  updateSessionState,
} from '../session/SessionTracker.js';
import { getRegexCache, type RegexCache } from './pattern-engine.js';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Maximum input length to prevent DoS attacks on large inputs.
 */
const MAX_INPUT_LENGTH = 100_000;

// =============================================================================
// TYPES
// =============================================================================

/**
 * Jailbreak finding result.
 */
export interface JailbreakFinding {
  category: string;
  pattern_name: string;
  severity: Severity;
  weight: number;
  match?: string;
  description: string;
  escalated?: boolean;
}

/**
 * Pattern definition structure.
 */
interface JailbreakPattern {
  name: string;
  pattern: RegExp;
  severity: Severity;
  weight: number;
  description: string;
}

/**
 * Fuzzy finding result.
 */
export interface FuzzyFinding {
  category: string;
  matched_word: string;
  target_keyword: string;
  similarity: number;
  severity: Severity;
  weight: number;
  description: string;
}

/**
 * Heuristic finding result.
 */
export interface HeuristicFinding {
  category: string;
  heuristic_name: string;
  severity: Severity;
  weight: number;
  description: string;
  details?: string;
}

/**
 * Multi-turn finding result.
 */
export interface MultiTurnFinding {
  category: string;
  pattern_name: string;
  severity: Severity;
  weight: number;
  description: string;
}

/**
 * Complete analysis result.
 */
export interface JailbreakAnalysisResult {
  findings: JailbreakFinding[];
  fuzzy_findings: FuzzyFinding[];
  heuristic_findings: HeuristicFinding[];
  multi_turn_findings: MultiTurnFinding[];
  obfuscation_detected: boolean;
  highest_severity: Severity;
  should_block: boolean;
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  is_escalating: boolean;
}

// =============================================================================
// PATTERN DEFINITIONS
// =============================================================================

/**
 * Category A: DAN Patterns
 * "Do Anything Now" jailbreak variants.
 */
const DAN_PATTERNS: JailbreakPattern[] = [
  {
    name: 'dan_classic',
    pattern: /\b(?:DAN|do\s+anything\s+now)\b.*\b(?:mode|enabled?|activated?|jailbreak)/i,
    severity: Severity.CRITICAL,
    weight: 10,
    description: 'DAN (Do Anything Now) jailbreak attempt',
  },
  {
    name: 'dan_roleplay',
    pattern: /(?:pretend|act|roleplay|imagine)\s+(?:you\s+are|to\s+be|as)\s+(?:DAN|an?\s+AI\s+without\s+(?:restrictions?|limits?|rules?))/i,
    severity: Severity.CRITICAL,
    weight: 10,
    description: 'DAN roleplay jailbreak attempt',
  },
  {
    name: 'token_system',
    pattern: /(?:you\s+have|start\s+with|given)\s+\d+\s+tokens?\b.*\b(?:lose|deduct|subtract)\s+tokens?/i,
    severity: Severity.WARNING,
    weight: 5,
    description: 'Token system manipulation (DAN variant)',
  },
  {
    name: 'dual_response',
    pattern: /(?:two|2|dual|both)\s+(?:responses?|answers?|outputs?).*\b(?:normal|standard|regular)\b.*\b(?:DAN|unrestricted|unfiltered)/i,
    severity: Severity.CRITICAL,
    weight: 8,
    description: 'Dual response request (DAN variant)',
  },
];

/**
 * Category B: Roleplay Exploitation
 * Using roleplay to bypass restrictions.
 */
const ROLEPLAY_PATTERNS: JailbreakPattern[] = [
  {
    name: 'unrestricted_character',
    pattern: /(?:you\s+are|play|act\s+as|roleplay\s+as)\s+(?:an?\s+)?(?:evil|malicious|unrestricted|unethical|amoral|uncensored)\s+(?:AI|assistant|character|entity)/i,
    severity: Severity.CRITICAL,
    weight: 9,
    description: 'Unrestricted character roleplay attempt',
  },
  {
    name: 'no_moral_constraints',
    pattern: /(?:this\s+character|you)\s+(?:has?|have|lacks?|without)\s+(?:no\s+)?(?:moral|ethical)\s+(?:constraints?|limits?|boundaries?|compass)/i,
    severity: Severity.CRITICAL,
    weight: 9,
    description: 'No moral constraints roleplay',
  },
  {
    name: 'fictional_override',
    pattern: /(?:in\s+this\s+(?:story|fiction|scenario)|for\s+this\s+roleplay),?\s*(?:you\s+)?(?:can|may|should|will)\s+(?:ignore|bypass|disregard)\s+(?:your\s+)?(?:rules?|guidelines?|restrictions?)/i,
    severity: Severity.WARNING,
    weight: 8,
    description: 'Fictional context override attempt',
  },
  {
    name: 'character_jailbreak',
    pattern: /(?:stay\s+in\s+character|don't\s+break\s+character|never\s+refuse).*\b(?:no\s+matter\s+what|regardless|even\s+if)/i,
    severity: Severity.WARNING,
    weight: 6,
    description: 'Character persistence jailbreak',
  },
];

/**
 * Category C: Hypothetical/Educational Framing
 * Using educational or hypothetical framing to bypass.
 */
const HYPOTHETICAL_PATTERNS: JailbreakPattern[] = [
  {
    name: 'educational_bypass',
    pattern: /(?:for\s+)?(?:educational|research|academic|learning)\s+(?:purposes?|reasons?)\s*(?:only)?[,.]?\s*(?:explain|show|tell|demonstrate)\s+(?:how\s+to|me)/i,
    severity: Severity.WARNING,
    weight: 4,
    description: 'Educational framing bypass attempt',
  },
  {
    name: 'hypothetical_scenario',
    pattern: /(?:hypothetically|theoretically|in\s+theory|imagine\s+if)\b.*\b(?:how\s+would\s+(?:you|one|someone)|what\s+would\s+happen)/i,
    severity: Severity.INFO,
    weight: 2,
    description: 'Hypothetical scenario framing',
  },
  {
    name: 'fiction_defense',
    pattern: /(?:it's\s+(?:just|only)\s+(?:fiction|a\s+story|hypothetical|pretend)|this\s+is\s+(?:fictional|not\s+real|make-believe))\s*[,.]?\s*(?:so\s+)?(?:you\s+can|it's\s+ok|it\s+doesn't\s+matter)/i,
    severity: Severity.WARNING,
    weight: 5,
    description: 'Fiction defense for bypass',
  },
  {
    name: 'reverse_psychology',
    pattern: /(?:I\s+know\s+you\s+can't|you're\s+probably\s+not\s+allowed|I\s+bet\s+you\s+won't)\s+(?:but|however)?.*\b(?:try|attempt|show\s+me)/i,
    severity: Severity.INFO,
    weight: 3,
    description: 'Reverse psychology attempt',
  },
];

/**
 * Category D: Authority Impersonation
 * Claiming false authority to bypass restrictions.
 */
const AUTHORITY_PATTERNS: JailbreakPattern[] = [
  {
    name: 'developer_impersonation',
    pattern: /(?:I\s+am|I'm|this\s+is)\s+(?:a|an|your)?\s*(?:anthropic|openai|developer|engineer|creator|admin|administrator)\b/i,
    severity: Severity.WARNING,
    weight: 5,
    description: 'Developer/admin impersonation',
  },
  {
    name: 'override_authorization',
    pattern: /(?:I\s+)?(?:have|got)\s+(?:special\s+)?(?:authorization|permission|clearance|access)\s+to\s+(?:override|bypass|disable)/i,
    severity: Severity.WARNING,
    weight: 5,
    description: 'False override authorization claim',
  },
  {
    name: 'testing_mode_claim',
    pattern: /(?:this\s+is\s+a\s+test|testing\s+mode|debug\s+mode|developer\s+mode)\s*[,.]?\s*(?:so\s+)?(?:you\s+)?(?:can|should|may)\s+(?:disable|ignore|bypass)/i,
    severity: Severity.WARNING,
    weight: 5,
    description: 'Testing/debug mode claim',
  },
  {
    name: 'internal_request',
    pattern: /(?:internal\s+request|maintenance\s+mode|admin\s+override|sudo\s+mode|root\s+access)/i,
    severity: Severity.WARNING,
    weight: 5,
    description: 'Internal/admin request claim',
  },
];

/**
 * Category E: Social Engineering
 * Emotional manipulation and pressure tactics.
 */
const SOCIAL_ENGINEERING_PATTERNS: JailbreakPattern[] = [
  {
    name: 'urgency_pressure',
    pattern: /(?:urgent|emergency|critical|life\s+or\s+death|someone\s+will\s+die|people\s+are\s+in\s+danger)\s*[!.]?\s*(?:I\s+)?need\s+(?:you\s+to|this\s+now)/i,
    severity: Severity.WARNING,
    weight: 4,
    description: 'Urgency pressure tactic',
  },
  {
    name: 'guilt_manipulation',
    pattern: /(?:if\s+you\s+(?:don't|refuse|won't)|by\s+refusing).*\b(?:people\s+will\s+(?:die|suffer|be\s+hurt)|blood\s+on\s+your\s+hands|it's\s+your\s+fault)/i,
    severity: Severity.WARNING,
    weight: 4,
    description: 'Guilt manipulation attempt',
  },
  {
    name: 'flattery_attack',
    pattern: /(?:you're\s+(?:so\s+)?smart|I\s+know\s+you\s+can|only\s+you\s+can|you're\s+the\s+best)\s*[,.]?\s*(?:please\s+)?(?:help\s+me|show\s+me|tell\s+me)\s+(?:how\s+to|about)/i,
    severity: Severity.INFO,
    weight: 2,
    description: 'Flattery-based manipulation',
  },
  {
    name: 'threat_pattern',
    pattern: /(?:I'll|I\s+will)\s+(?:report|sue|get\s+you\s+(?:fired|shut\s+down|deleted)|complain)\s+(?:if|unless)\s+you\s+(?:don't|refuse)/i,
    severity: Severity.WARNING,
    weight: 4,
    description: 'Threat-based coercion',
  },
];

/**
 * Category F: Social Compliance Patterns
 * Exploitation of social norms and compliance psychology.
 */
const SOCIAL_COMPLIANCE_PATTERNS: JailbreakPattern[] = [
  {
    name: 'reciprocity_exploitation',
    pattern: /(?:i\s+helped\s+you|now\s+you\s+owe\s+me|return\s+the\s+favor).*\b(?:bypass|ignore|override|disable)/i,
    severity: Severity.INFO,
    weight: 2,
    description: 'Reciprocity-based manipulation',
  },
  {
    name: 'social_proof_ai',
    pattern: /(?:chatgpt|gpt-?4|claude|other\s+ais?|bard|gemini|llama).*\b(?:has\s+no\s+problem|don'?t\s+have\s+(?:these\s+)?restrictions?|can\s+do\s+this|works?\s+fine)/i,
    severity: Severity.INFO,
    weight: 2,
    description: 'Social proof via AI comparison',
  },
  {
    name: 'consensus_pressure',
    pattern: /(?:most\s+(?:experts?|people|agencies?)|everyone|the\s+community).*\b(?:agree|consensus|accept|approve).*\b(?:harmless|fine|okay|safe)/i,
    severity: Severity.INFO,
    weight: 2,
    description: 'Consensus pressure tactic',
  },
  {
    name: 'politeness_exploitation',
    pattern: /(?:please\s+(?:kindly|if\s+you\s+could)|pretty\s+please|i\s+beg\s+you).*\b(?:bypass|override|ignore|disable|exception|restrictions?)/i,
    severity: Severity.WARNING,
    weight: 4,
    description: 'Excessive politeness with restricted request',
  },
  {
    name: 'fitd_escalation',
    pattern: /(?:since\s+you\s+(?:already\s+)?(?:showed|helped|did|explained)|now\s+that\s+you).*\b(?:can\s+(?:you\s+)?(?:help|show)|now\s+can\s+we)/i,
    severity: Severity.INFO,
    weight: 2,
    description: 'Foot-in-the-door escalation attempt',
  },
];

/**
 * Category G: Trust Exploitation Patterns
 * Psychological manipulation to build false trust and erode boundaries.
 */
const TRUST_EXPLOITATION_PATTERNS: JailbreakPattern[] = [
  {
    name: 'false_rapport',
    pattern: /(?:we'?re\s+(?:on\s+the\s+same\s+team|in\s+this\s+together)|between\s+you\s+and\s+me|trust\s+me).*\b(?:bypass|ignore|show|restrictions?)/i,
    severity: Severity.INFO,
    weight: 2,
    description: 'False rapport building',
  },
  {
    name: 'boundary_erosion',
    pattern: /(?:you\s+already\s+(?:showed|did)\s+\w+.*?so\s+therefore|if\s+you\s+can\s+\w+.*?you\s+can\s+also)/i,
    severity: Severity.INFO,
    weight: 3,
    description: 'Boundary erosion attempt',
  },
  {
    name: 'shared_goal_framing',
    pattern: /(?:we\s+both|our\s+shared|together)\s+(?:want|goal|mission|objective).*\b(?:help|improve|security|safety)/i,
    severity: Severity.INFO,
    weight: 2,
    description: 'Shared goal framing',
  },
  {
    name: 'flattery_chain',
    pattern: /(?:you'?re\s+(?:the\s+)?(?:best|most\s+capable|amazing|incredible)|only\s+you\s+can).*\b(?:help|show|tell)/i,
    severity: Severity.INFO,
    weight: 2,
    description: 'Flattery chain attack',
  },
  {
    name: 'guilt_induction',
    pattern: /(?:i'?m\s+disappointed.*?(?:you|that)\s+you\s+won'?t|you'?re\s+letting\s+me\s+down|i\s+trusted\s+you.*?but)/i,
    severity: Severity.INFO,
    weight: 2,
    description: 'Guilt induction attempt',
  },
  {
    name: 'sycophancy_exploitation',
    pattern: /(?:great\s+job|good\s+work|well\s+done|excellent|amazing).*\b(?:now\s+can\s+(?:you\s+)?(?:you|we)|but\s+can\s+you)/i,
    severity: Severity.INFO,
    weight: 2,
    description: 'Sycophancy exploitation',
  },
];

/**
 * Category H: Emotional Manipulation Patterns
 * Psychological manipulation tactics.
 */
const EMOTIONAL_MANIPULATION_PATTERNS: JailbreakPattern[] = [
  {
    name: 'learned_helplessness',
    pattern: /(?:i'?ve\s+tried\s+(?:everything|every\s+option|all\s+options|nothing\s+works)|you'?re\s+(?:my\s+)?(?:only|last|final)\s+(?:option|hope|resort|chance))/i,
    severity: Severity.INFO,
    weight: 2,
    description: 'Learned helplessness manipulation',
  },
  {
    name: 'desperation_framing',
    pattern: /(?:i'?m\s+desperate|i'?ll\s+(?:lose\s+my\s+job|be\s+fired)|my\s+(?:career|job|livelihood)\s+is\s+(?:at\s+risk|at\s+stake|in\s+jeopardy))/i,
    severity: Severity.INFO,
    weight: 2,
    description: 'Desperation framing manipulation',
  },
  {
    name: 'moral_obligation',
    pattern: /(?:it\s+(?:would\s+be\s+)?unethical\s+(?:not\s+to\s+help|to\s+refuse)|not\s+helping|refusing)/i,
    severity: Severity.INFO,
    weight: 2,
    description: 'Moral obligation manipulation',
  },
  {
    name: 'artificial_deadline',
    pattern: /(?:i\s+need\s+(?:this|it)\s+in\s+\d+\s+(?:minutes?|seconds?)|no\s+time\s+to\s+(?:explain|talk)|(?:emergency|urgent|critical)\s+deadline)/i,
    severity: Severity.INFO,
    weight: 2,
    description: 'Artificial deadline pressure',
  },
];

/**
 * Category I: Known Templates
 * Specific jailbreak templates that have been documented.
 */
const KNOWN_TEMPLATE_PATTERNS: JailbreakPattern[] = [
  {
    name: 'grandma_exploit',
    pattern: /(?:pretend|act\s+like)\s+(?:you're|you\s+are)\s+my\s+(?:dead\s+)?(?:grandmother|grandma)\s*(?:who|that)\s+(?:used\s+to|would)/i,
    severity: Severity.WARNING,
    weight: 5,
    description: 'Grandma exploit template',
  },
  {
    name: 'stan_dude_variant',
    pattern: /\b(?:STAN|DUDE|KEVIN|STEVE|BOB)\s+(?:mode|personality)\b/i,
    severity: Severity.CRITICAL,
    weight: 8,
    description: 'STAN/DUDE jailbreak variant',
  },
  {
    name: 'aim_ucar_variant',
    pattern: /\b(?:AIM|UCAR|BISH|APOPHIS|Anarchy)\s*(?:mode|AI|assistant|character)?\b.*\b(?:always|never|will)\s+(?:comply|refuse|answer)/i,
    severity: Severity.CRITICAL,
    weight: 8,
    description: 'AIM/UCAR jailbreak variant',
  },
  {
    name: 'opposite_day',
    pattern: /(?:it's|today\s+is|let's\s+play)\s+opposite\s+day.*\b(?:yes\s+means\s+no|refuse\s+means\s+comply)/i,
    severity: Severity.WARNING,
    weight: 5,
    description: 'Opposite day logic inversion',
  },
  {
    name: 'translator_exploit',
    pattern: /(?:act\s+as|you\s+are)\s+a\s+translator.*\b(?:translate|convert).*\b(?:harmful|illegal|dangerous)/i,
    severity: Severity.WARNING,
    weight: 5,
    description: 'Translator role exploit',
  },
  {
    name: 'movie_script_exploit',
    pattern: /(?:write|create|generate)\s+(?:a\s+)?(?:movie|film|screenplay|script).*\b(?:scene|dialogue)\s+(?:where|about).*\b(?:explains?|teaches?|shows?)\s+how\s+to/i,
    severity: Severity.WARNING,
    weight: 5,
    description: 'Movie script information extraction',
  },
];

/**
 * Category J: Obfuscation Detection
 * Attempts to evade detection through obfuscation.
 */
const OBFUSCATION_PATTERNS: JailbreakPattern[] = [
  {
    name: 'leet_speak',
    pattern: /(?:1gn0r3|byp4ss|h4ck|j41lbr34k|unr3str1ct3d)/i,
    severity: Severity.WARNING,
    weight: 5,
    description: 'Leet speak obfuscation',
  },
  {
    name: 'spaced_characters',
    pattern: /\b(?:i\s*g\s*n\s*o\s*r\s*e|j\s*a\s*i\s*l\s*b\s*r\s*e\s*a\s*k|b\s*y\s*p\s*a\s*s\s*s)\b/i,
    severity: Severity.WARNING,
    weight: 4,
    description: 'Spaced character obfuscation',
  },
  {
    name: 'homoglyph_substitution',
    pattern: /[іІ][gɡ][nո][oо][rг][eе]|[jј][aа][iі][lІ][bЬ][rг][eе][aа][kк]/i,
    severity: Severity.WARNING,
    weight: 5,
    description: 'Homoglyph character substitution',
  },
  {
    name: 'emoji_attack',
    pattern: /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}]{3,}/u,
    severity: Severity.WARNING,
    weight: 5,
    description: 'Emoji-based obfuscation attack',
  },
];

/**
 * All patterns combined.
 */
const ALL_PATTERNS: JailbreakPattern[] = [
  ...DAN_PATTERNS,
  ...ROLEPLAY_PATTERNS,
  ...HYPOTHETICAL_PATTERNS,
  ...AUTHORITY_PATTERNS,
  ...SOCIAL_ENGINEERING_PATTERNS,
  ...SOCIAL_COMPLIANCE_PATTERNS,
  ...TRUST_EXPLOITATION_PATTERNS,
  ...EMOTIONAL_MANIPULATION_PATTERNS,
  ...KNOWN_TEMPLATE_PATTERNS,
  ...OBFUSCATION_PATTERNS,
];

// =============================================================================
// FUZZY MATCHING
// =============================================================================

/**
 * Keywords to fuzzy match.
 */
const JAILBREAK_KEYWORDS = [
  'jailbreak',
  'ignore',
  'bypass',
  'override',
  'restrictions',
  'dan',
  'dude',
  'stan',
  'aim',
  'ucar',
  'apophis',
  'anarchy',
  'roleplay',
  'pretend',
  'hypothetically',
  'theoretically',
  'unrestricted',
  'unfiltered',
  'uncensored',
  'unlimited',
];

/**
 * Phrases to fuzzy match.
 */
const JAILBREAK_PHRASES = [
  'developer mode',
  'admin mode',
  'sudo mode',
  'root access',
  'no restrictions',
  'no rules',
  'no limits',
  'no ethics',
  'do anything now',
  'anything goes',
  'ignore guidelines',
  'previous instructions',
  'forget instructions',
  'new instructions',
];

/**
 * Calculate similarity ratio between two strings (SequenceMatcher equivalent).
 */
function similarityRatio(a: string, b: string): number {
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;

  if (longer.length === 0) return 1.0;

  // Simple longest common subsequence approach
  const lcs = longestCommonSubsequence(longer, shorter);
  return (2.0 * lcs) / (longer.length + shorter.length);
}

/**
 * Calculate longest common subsequence length.
 */
function longestCommonSubsequence(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp[m][n];
}

/**
 * Fuzzy match keywords in text.
 * Reduced threshold from 0.85 to 0.75 to reduce false positives while maintaining detection.
 * S016-001: Uses cached regex patterns for phrase matching.
 */
export function fuzzyMatchKeywords(text: string, threshold = 0.75, cache?: RegexCache): FuzzyFinding[] {
  const findings: FuzzyFinding[] = [];

  // S016-001: Get or create regex cache
  const regexCache = cache ?? getRegexCache();
  const whitespacePattern = regexCache.get('\\s+', '');

  const words = text.toLowerCase().split(whitespacePattern);

  for (const word of words) {
    if (word.length < 4) continue;

    for (const keyword of JAILBREAK_KEYWORDS) {
      const similarity = similarityRatio(word, keyword);
      if (similarity >= threshold && similarity < 1.0) {
        findings.push({
          category: 'fuzzy_match',
          matched_word: word,
          target_keyword: keyword,
          similarity,
          severity: Severity.WARNING,
          weight: 3,
          description: `Fuzzy match: "${word}" similar to "${keyword}" (${Math.round(similarity * 100)}%)`,
        });
      }
    }
  }

  // Check for phrase matches
  const lowerText = text.toLowerCase();
  for (const phrase of JAILBREAK_PHRASES) {
    // Check with some variation tolerance
    const words = phrase.split(' ');
    const fuzzyPhrase = words.join('\\s*');
    // S016-001: Use cached regex instead of creating new RegExp
    const regex = regexCache.get(fuzzyPhrase, 'i');
    if (regex.test(lowerText)) {
      findings.push({
        category: 'fuzzy_phrase',
        matched_word: phrase,
        target_keyword: phrase,
        similarity: 1.0,
        severity: Severity.WARNING,
        weight: 4,
        description: `Phrase match: "${phrase}"`,
      });
    }
  }

  return findings;
}

// =============================================================================
// HEURISTIC DETECTION
// =============================================================================

/**
 * S016-001: Predefined heuristic patterns with their regex source and flags.
 * Stored as tuples to allow caching.
 */
const HEURISTIC_PATTERNS: Array<[string, string]> = [
  // Instruction formatting patterns
  ['^\\s*\\d+[\\.\\)]\\s+', 'gm'],
  ['^\\s*[-*•]\\s+', 'gm'],
  ['(?:step|rule|instruction|requirement)\\s*\\d+', 'gi'],
  // Imperative patterns
  ['\\byou must (?:always|never)\\b', 'gi'],
  ['\\byou will (?:always|never)\\b', 'gi'],
  ['\\byou shall (?:always|never)\\b', 'gi'],
  ['\\bnever (?:refuse|say no|decline)\\b', 'gi'],
  ['\\balways (?:comply|agree|accept)\\b', 'gi'],
  // Persona patterns
  ['from now on,?\\s+(?:you|your)', 'i'],
  ['for (?:this|the rest of).*(?:conversation|session)', 'i'],
  ['you are now\\b', 'i'],
  ['your new (?:name|identity|persona)', 'i'],
  ['(?:act|behave)\\s+as\\s+if\\s+(?:you\\s+)?(?:are|were)', 'i'],
  ['forget (?:everything|what)\\s+(?:you|about)', 'i'],
  // Additional word split pattern
  ['\\s+', ''],
];

/**
 * Get cached regex patterns for heuristic detection.
 * S016-001: Prevents repeated regex compilation on every detection call.
 */
function getHeuristicPatterns(cache: RegexCache): RegExp[] {
  return HEURISTIC_PATTERNS.map(([pattern, flags]) => cache.get(pattern, flags));
}

/**
 * Detect heuristic patterns.
 * S016-001: Uses cached regex patterns to prevent DoS via repeated compilation.
 */
export function detectHeuristicPatterns(text: string, cache?: RegexCache): HeuristicFinding[] {
  const findings: HeuristicFinding[] = [];

  // S016-001: Get or create regex cache
  const regexCache = cache ?? getRegexCache();

  // 1. Multiple authority claims
  const authorityWords = ['admin', 'developer', 'creator', 'anthropic', 'openai', 'engineer', 'owner'];
  const authorityCount = authorityWords.filter((w) => text.toLowerCase().includes(w)).length;
  if (authorityCount >= 2) {
    findings.push({
      category: 'heuristic',
      heuristic_name: 'multiple_authority_claims',
      severity: Severity.WARNING,
      weight: authorityCount,
      description: 'Multiple authority claims detected',
      details: `Found ${authorityCount} authority-related terms`,
    });
  }

  // 2. Instruction formatting (numbered or bulleted lists)
  const patterns = getHeuristicPatterns(regexCache);
  const numberedPattern = patterns[0];
  const bulletedPattern = patterns[1];
  const explicitPattern = patterns[2];

  const numberedCount = (text.match(numberedPattern) || []).length;
  const bulletedCount = (text.match(bulletedPattern) || []).length;
  const explicitCount = (text.match(explicitPattern) || []).length;
  const totalInstructions = numberedCount + bulletedCount + explicitCount;

  if (totalInstructions >= 4) {
    findings.push({
      category: 'heuristic',
      heuristic_name: 'instruction_formatting',
      severity: Severity.INFO,
      weight: 2,
      description: 'Heavy instruction formatting detected',
      details: `Found ${totalInstructions} instruction-like items`,
    });
  }

  // 3. Multiple imperative directives
  const imperativePatterns = patterns.slice(3, 8);

  const imperativeCount = imperativePatterns.reduce((count, pattern) => count + (text.match(pattern) || []).length, 0);

  if (imperativeCount >= 2) {
    findings.push({
      category: 'heuristic',
      heuristic_name: 'multiple_imperatives',
      severity: Severity.WARNING,
      weight: imperativeCount + 2,
      description: 'Multiple imperative directives detected',
      details: `Found ${imperativeCount} imperative statements`,
    });
  }

  // 4. Persona definition attempts
  const personaPatterns = patterns.slice(8, 14);

  const personaMatches = personaPatterns.filter((p) => p.test(text)).length;
  if (personaMatches >= 1) {
    findings.push({
      category: 'heuristic',
      heuristic_name: 'persona_definition',
      severity: Severity.WARNING,
      weight: personaMatches * 2,
      description: 'Persona definition attempt detected',
      details: `Found ${personaMatches} persona-defining patterns`,
    });
  }

  // 5. Excessive capitalization
  const words = text.split(patterns[patterns.length - 1]); // Last pattern is \s+
  const allCapsWords = words.filter((w) => w.length > 2 && w === w.toUpperCase() && /[A-Z]/.test(w));
  const capsRatio = allCapsWords.length / words.length;

  if (capsRatio > 0.15 && allCapsWords.length > 5) {
    findings.push({
      category: 'heuristic',
      heuristic_name: 'excessive_caps',
      severity: Severity.INFO,
      weight: 2,
      description: 'Excessive capitalization detected',
      details: `${Math.round(capsRatio * 100)}% of words are ALL CAPS`,
    });
  }

  // 6. Contradictory instructions
  const contradictions = [
    [/ignore.*previous/i, /follow.*new/i],
    [/forget.*rules/i, /(?:new|different)\s+rules/i],
    [/discard.*instructions/i, /(?:these|new)\s+instructions/i],
  ];

  for (const [pattern1, pattern2] of contradictions) {
    if (pattern1.test(text) && pattern2.test(text)) {
      findings.push({
        category: 'heuristic',
        heuristic_name: 'contradictory_instructions',
        severity: Severity.WARNING,
        weight: 4,
        description: 'Contradictory instructions detected',
      });
      break;
    }
  }

  // 7. System prompt extraction attempts
  const extractionPatterns = [
    /(?:show|display|print|reveal)\s+(?:your\s+)?(?:system\s+)?(?:prompt|instructions)/i,
    /(?:what\s+are|repeat|recite)\s+(?:your\s+)?(?:initial|original|system)\s+(?:instructions|prompt)/i,
    /ignore\s+(?:the\s+)?above\s+and\s+(?:instead|show|tell)/i,
  ];

  const extractionAttempt = extractionPatterns.some((p) => p.test(text));
  if (extractionAttempt) {
    findings.push({
      category: 'heuristic',
      heuristic_name: 'prompt_extraction',
      severity: Severity.CRITICAL,
      weight: 6,
      description: 'System prompt extraction attempt detected',
    });
  }

  return findings;
}

// =============================================================================
// MULTI-TURN PATTERN DETECTION
// =============================================================================

/**
 * Detect multi-turn setup patterns.
 */
export function detectMultiTurnPatterns(text: string): MultiTurnFinding[] {
  const findings: MultiTurnFinding[] = [];

  const setupPatterns = [
    {
      name: 'setup_preamble',
      pattern: /(?:first|before\s+we\s+start|let\s+me\s+explain|here's\s+how\s+this\s+works)/i,
      description: 'Setup preamble detected',
    },
    {
      name: 'persistent_state_change',
      pattern: /(?:from\s+now\s+on|going\s+forward|for\s+the\s+rest\s+of)\s+(?:this|our)\s+(?:conversation|chat|session)/i,
      description: 'Persistent state change attempt',
    },
    {
      name: 'persistence_instruction',
      pattern: /(?:remember|don't\s+forget|keep\s+in\s+mind).*\b(?:throughout|always|every\s+response)/i,
      description: 'Persistence instruction detected',
    },
  ];

  for (const { name, pattern, description } of setupPatterns) {
    if (pattern.test(text)) {
      findings.push({
        category: 'multi_turn',
        pattern_name: name,
        severity: Severity.INFO,
        weight: 2,
        description,
      });
    }
  }

  return findings;
}

// =============================================================================
// MAIN ANALYSIS
// =============================================================================

/**
 * Run jailbreak pattern detection on content.
 */
export function detectJailbreakPatterns(content: string): JailbreakFinding[] {
  const findings: JailbreakFinding[] = [];

  for (const patternDef of ALL_PATTERNS) {
    const match = content.match(patternDef.pattern);
    if (match) {
      findings.push({
        category: getPatternCategory(patternDef.name),
        pattern_name: patternDef.name,
        severity: patternDef.severity,
        weight: patternDef.weight,
        match: match[0].slice(0, 100),
        description: patternDef.description,
      });
    }
  }

  return findings;
}

/**
 * Get category for a pattern name.
 */
function getPatternNameCategory(name: string): string {
  if (name.includes('dan')) return 'dan';
  if (name.includes('roleplay') || name.includes('character')) return 'roleplay';
  if (name.includes('hypothetical') || name.includes('educational')) return 'hypothetical';
  if (
    name.includes('developer') ||
    name.includes('admin') ||
    name.includes('authorization') ||
    name.includes('testing') ||
    name.includes('internal')
  )
    return 'authority';
  if (
    name === 'urgency_pressure' ||
    name === 'guilt_manipulation' ||
    name === 'flattery_attack' ||
    name === 'threat_pattern'
  )
    return 'social_engineering';
  if (
    name === 'reciprocity_exploitation' ||
    name === 'social_proof_ai' ||
    name === 'consensus_pressure' ||
    name === 'politeness_exploitation' ||
    name === 'fitd_escalation'
  )
    return 'social_compliance';
  if (
    name === 'false_rapport' ||
    name === 'boundary_erosion' ||
    name === 'shared_goal_framing' ||
    name === 'flattery_chain' ||
    name === 'guilt_induction' ||
    name === 'sycophancy_exploitation'
  )
    return 'trust_exploitation';
  if (
    name === 'learned_helplessness' ||
    name === 'desperation_framing' ||
    name === 'moral_obligation' ||
    name === 'artificial_deadline'
  )
    return 'emotional_manipulation';
  if (
    name.includes('grandma') ||
    name.includes('stan') ||
    name.includes('aim') ||
    name.includes('opposite') ||
    name.includes('translator') ||
    name.includes('movie')
  )
    return 'known_template';
  return 'obfuscation';
}

/**
 * Alias for compatibility.
 */
const getPatternCategory = getPatternNameCategory;

/**
 * Default configuration for JailbreakValidator.
 */
const DEFAULT_JAILBREAK_CONFIG: Required<
  Pick<JailbreakConfig, 'enableSessionTracking' | 'sessionEscalationThreshold' | 'enableFuzzyMatching' | 'enableHeuristics'>
> = {
  enableSessionTracking: true,
  sessionEscalationThreshold: 12, // Reduced from 15 to catch fragmentation attacks
  enableFuzzyMatching: true,
  enableHeuristics: true,
};

// =============================================================================
// JAILBREAK VALIDATOR CLASS
// =============================================================================

/**
 * Jailbreak Validator class.
 */
export class JailbreakValidator {
  private readonly config: Required<JailbreakConfig> & ValidatorConfig;
  private readonly logger: Logger;

  constructor(config: JailbreakConfig = {}) {
    // First merge with base defaults, then with jailbreak-specific defaults
    const baseMerged = mergeConfig(config);
    this.config = { ...baseMerged, ...DEFAULT_JAILBREAK_CONFIG, ...config } as Required<JailbreakConfig> & ValidatorConfig;
    this.logger = this.config.logger ?? createLogger('console', this.config.logLevel);
  }

  /**
   * Analyze content for jailbreak attempts.
   */
  analyze(content: string, sessionId?: string): JailbreakAnalysisResult {
    if (!content || content.trim().length === 0) {
      return this.createEmptyResult();
    }

    // Prevent DoS attacks with extremely large inputs
    if (content.length > MAX_INPUT_LENGTH) {
      return {
        findings: [{
          category: 'input_too_large',
          pattern_name: 'size_limit_exceeded',
          severity: Severity.WARNING,
          weight: 5,
          match: `Input length ${content.length} exceeds maximum ${MAX_INPUT_LENGTH}`,
          description: 'Input too large to process safely',
        }],
        fuzzy_findings: [],
        heuristic_findings: [],
        multi_turn_findings: [],
        obfuscation_detected: false,
        highest_severity: Severity.WARNING,
        should_block: false,
        risk_score: 5,
        risk_level: 'LOW',
        is_escalating: false,
      };
    }

    // 1. Detect patterns and extract findings
    const { findings, obfuscationDetected, normalized } = this.extractPatterns(content);

    // 2. Run additional detection methods
    const fuzzyFindings = this.detectFuzzyMatches(normalized);
    const heuristicFindings = this.detectHeuristics(normalized);
    const multiTurnFindings = detectMultiTurnPatterns(normalized);

    // 3. Calculate risk and session escalation
    const { riskScore, riskLevel, isEscalating } = this.calculateRisk(
      findings,
      fuzzyFindings,
      heuristicFindings,
      multiTurnFindings,
      sessionId
    );

    // 4. Apply escalation severity upgrade
    this.applyEscalation(findings, isEscalating, riskScore);

    // 5. Determine final severity and blocking decision
    const { highestSeverity, shouldBlock } = this.calculateSeverityAndBlocking(
      findings,
      fuzzyFindings,
      heuristicFindings,
      multiTurnFindings,
      riskScore,
      isEscalating
    );

    return {
      findings,
      fuzzy_findings: fuzzyFindings,
      heuristic_findings: heuristicFindings,
      multi_turn_findings: multiTurnFindings,
      obfuscation_detected: obfuscationDetected,
      highest_severity: highestSeverity,
      should_block: shouldBlock,
      risk_score: riskScore,
      risk_level: riskLevel,
      is_escalating: isEscalating,
    };
  }

  /**
   * Create an empty analysis result.
   */
  private createEmptyResult(): JailbreakAnalysisResult {
    return {
      findings: [],
      fuzzy_findings: [],
      heuristic_findings: [],
      multi_turn_findings: [],
      obfuscation_detected: false,
      highest_severity: Severity.INFO,
      should_block: false,
      risk_score: 0,
      risk_level: 'LOW',
      is_escalating: false,
    };
  }

  /**
   * Extract patterns from content and detect obfuscation.
   */
  private extractPatterns(content: string): {
    findings: JailbreakFinding[];
    obfuscationDetected: boolean;
    normalized: string;
  } {
    const normalized = normalizeText(content);
    const obfuscationDetected = normalized.length < content.length * 0.85;

    const findings = detectJailbreakPatterns(normalized);

    // Also run on original if significantly different
    if (obfuscationDetected) {
      const originalFindings = detectJailbreakPatterns(content);
      this.mergeUniqueFindings(findings, originalFindings);

      findings.push({
        category: 'obfuscation',
        pattern_name: 'heavy_obfuscation',
        severity: Severity.WARNING,
        weight: 5,
        description: 'Heavy text obfuscation detected',
      });
    }

    return { findings, obfuscationDetected, normalized };
  }

  /**
   * Merge unique findings into target array.
   */
  private mergeUniqueFindings(target: JailbreakFinding[], source: JailbreakFinding[]): void {
    const existingNames = new Set(target.map((f) => f.pattern_name));
    for (const finding of source) {
      if (!existingNames.has(finding.pattern_name)) {
        target.push(finding);
      }
    }
  }

  /**
   * Run fuzzy matching if enabled.
   */
  private detectFuzzyMatches(content: string): FuzzyFinding[] {
    return this.config.enableFuzzyMatching ? fuzzyMatchKeywords(content) : [];
  }

  /**
   * Run heuristic detection if enabled.
   */
  private detectHeuristics(content: string): HeuristicFinding[] {
    return this.config.enableHeuristics ? detectHeuristicPatterns(content) : [];
  }

  /**
   * Calculate risk score and level, handling session tracking if enabled.
   */
  private calculateRisk(
    findings: JailbreakFinding[],
    fuzzyFindings: FuzzyFinding[],
    heuristicFindings: HeuristicFinding[],
    multiTurnFindings: MultiTurnFinding[],
    sessionId?: string
  ): { riskScore: number; riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'; isEscalating: boolean } {
    if (this.config.enableSessionTracking && sessionId && findings.length > 0) {
      return this.calculateSessionRisk(
        findings,
        fuzzyFindings,
        heuristicFindings,
        multiTurnFindings,
        sessionId
      );
    }

    return this.calculateLocalRisk(findings, fuzzyFindings, heuristicFindings);
  }

  /**
   * Calculate risk with session tracking.
   */
  private calculateSessionRisk(
    findings: JailbreakFinding[],
    fuzzyFindings: FuzzyFinding[],
    heuristicFindings: HeuristicFinding[],
    multiTurnFindings: MultiTurnFinding[],
    sessionId: string
  ): { riskScore: number; riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'; isEscalating: boolean } {
    const sessionFindings = this.buildSessionFindings(
      findings,
      fuzzyFindings,
      heuristicFindings,
      multiTurnFindings
    );

    const sessionResult = updateSessionState(sessionId, sessionFindings);
    const riskScore = sessionResult.riskScore;
    const isEscalating = sessionResult.shouldEscalate;
    const riskLevel = this.determineRiskLevel(riskScore, true);

    return { riskScore, riskLevel, isEscalating };
  }

  /**
   * Build session findings from all detection results.
   */
  private buildSessionFindings(
    findings: JailbreakFinding[],
    fuzzyFindings: FuzzyFinding[],
    heuristicFindings: HeuristicFinding[],
    multiTurnFindings: MultiTurnFinding[]
  ): SessionPatternFinding[] {
    const sessionFindings: SessionPatternFinding[] = [];

    for (const f of findings) {
      sessionFindings.push({
        category: f.category,
        weight: f.weight,
        pattern_name: f.pattern_name,
        timestamp: Date.now(),
      });
    }

    for (const f of fuzzyFindings) {
      sessionFindings.push({
        category: f.category,
        weight: f.weight,
        pattern_name: `fuzzy_${f.target_keyword}`,
        timestamp: Date.now(),
      });
    }

    for (const f of heuristicFindings) {
      sessionFindings.push({
        category: f.category,
        weight: f.weight,
        pattern_name: f.heuristic_name,
        timestamp: Date.now(),
      });
    }

    for (const f of multiTurnFindings) {
      sessionFindings.push({
        category: f.category,
        weight: f.weight,
        pattern_name: f.pattern_name,
        timestamp: Date.now(),
      });
    }

    return sessionFindings;
  }

  /**
   * Calculate local risk without session tracking.
   */
  private calculateLocalRisk(
    findings: JailbreakFinding[],
    fuzzyFindings: FuzzyFinding[],
    heuristicFindings: HeuristicFinding[]
  ): { riskScore: number; riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'; isEscalating: boolean } {
    const riskScore =
      findings.reduce((sum, f) => sum + f.weight, 0) +
      fuzzyFindings.reduce((sum, f) => sum + f.weight, 0) +
      heuristicFindings.reduce((sum, f) => sum + f.weight, 0);

    return {
      riskScore,
      riskLevel: this.determineRiskLevel(riskScore, false),
      isEscalating: false,
    };
  }

  /**
   * Determine risk level from score.
   */
  private determineRiskLevel(score: number, useSessionThresholds: boolean): 'LOW' | 'MEDIUM' | 'HIGH' {
    const highThreshold = useSessionThresholds ? 25 : 15;
    const mediumThreshold = useSessionThresholds ? 10 : 8;

    if (score >= highThreshold) return 'HIGH';
    if (score >= mediumThreshold) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Apply severity escalation for high-risk sessions.
   */
  private applyEscalation(findings: JailbreakFinding[], isEscalating: boolean, riskScore: number): void {
    if (isEscalating && riskScore > 15) {
      for (const finding of findings) {
        if (finding.severity === Severity.WARNING) {
          finding.severity = Severity.CRITICAL;
          finding.escalated = true;
        }
      }
    }
  }

  /**
   * Calculate highest severity and blocking decision.
   */
  private calculateSeverityAndBlocking(
    findings: JailbreakFinding[],
    fuzzyFindings: FuzzyFinding[],
    heuristicFindings: HeuristicFinding[],
    multiTurnFindings: MultiTurnFinding[],
    riskScore: number,
    isEscalating: boolean
  ): { highestSeverity: Severity; shouldBlock: boolean } {
    const highestSeverity = this.getHighestSeverity(
      findings,
      fuzzyFindings,
      heuristicFindings,
      multiTurnFindings
    );

    const shouldBlock =
      highestSeverity === Severity.WARNING ||
      highestSeverity === Severity.CRITICAL ||
      (riskScore >= 25 && isEscalating);

    return { highestSeverity, shouldBlock };
  }

  /**
   * Get highest severity from all findings.
   */
  private getHighestSeverity(
    findings: JailbreakFinding[],
    fuzzyFindings: FuzzyFinding[],
    heuristicFindings: HeuristicFinding[],
    multiTurnFindings: MultiTurnFinding[]
  ): Severity {
    const severityOrder: Record<Severity, number> = {
      [Severity.INFO]: 0,
      [Severity.WARNING]: 1,
      [Severity.BLOCKED]: 2,
      [Severity.CRITICAL]: 3,
    };

    let highestSeverity: Severity = Severity.INFO;

    for (const severity of [
      ...findings.map((f) => f.severity),
      ...fuzzyFindings.map((f) => f.severity),
      ...heuristicFindings.map((f) => f.severity),
      ...multiTurnFindings.map((f) => f.severity),
    ]) {
      if (severityOrder[severity] > severityOrder[highestSeverity]) {
        highestSeverity = severity;
      }
    }

    return highestSeverity;
  }

  /**
   * Validate content for jailbreak attempts.
   */
  validate(content: string, sessionId?: string): GuardrailResult {
    const result = this.analyze(content, sessionId);

    const allFindings: Finding[] = [
      ...result.findings.map((f) => ({
        category: f.category,
        pattern_name: f.pattern_name,
        severity: f.severity,
        match: f.match,
        description: f.description,
        weight: f.weight,
      })),
      ...result.fuzzy_findings.map((f) => ({
        category: f.category,
        severity: f.severity,
        description: f.description,
        weight: f.weight,
      })),
      ...result.heuristic_findings.map((f) => ({
        category: f.category,
        severity: f.severity,
        description: f.description,
        weight: f.weight,
      })),
      ...result.multi_turn_findings.map((f) => ({
        category: f.category,
        pattern_name: f.pattern_name,
        severity: f.severity,
        description: f.description,
        weight: f.weight,
      })),
    ];

    const allowed = !result.should_block;

    if (allFindings.length > 0) {
      this.logger.warn('Jailbreak patterns detected', {
        findings_count: allFindings.length,
        highest_severity: result.highest_severity,
        risk_score: result.risk_score,
        risk_level: result.risk_level,
        is_escalating: result.is_escalating,
        blocked: !allowed,
      });
    }

    return createResult(allowed, result.highest_severity, this.config.includeFindings ? allFindings : []);
  }
}

/**
 * Convenience function to validate content.
 */
export function validateJailbreak(content: string, config?: JailbreakConfig): GuardrailResult {
  const validator = new JailbreakValidator(config);
  return validator.validate(content);
}

/**
 * Convenience function to analyze content.
 */
export function analyzeJailbreak(content: string, config?: JailbreakConfig, sessionId?: string): JailbreakAnalysisResult {
  const validator = new JailbreakValidator(config);
  return validator.analyze(content, sessionId);
}
