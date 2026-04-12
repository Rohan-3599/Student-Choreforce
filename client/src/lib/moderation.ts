/**
 * Content Moderation Utility
 * Filters tasks for prohibited content such as nudity, prostitution, and spam.
 */

const BANNED_PATTERNS = [
  // Sexual / Prostitution related
  /\bsex\b/i,
  /\bnude\b/i,
  /\bnudity\b/i,
  /\bprostitution\b/i,
  /\bescort\b/i,
  /\bhookup\b/i,
  /\bnsfw\b/i,
  /\bporn\b/i,
  /\berotic\b/i,
  
  // Off-platform payment / Scams
  /\bwhatsapp\b/i,
  /\btelegram\b/i,
  /\bcash outside\b/i,
  /\bpay outside\b/i,
  /\bgift card\b/i,
  /\bcrypto\b/i,
  /\bbitcoin\b/i,
  /bit\.ly/i,
  /t\.me/i,
  
  // Specific Prohibited Services (e.g. academic honesty if needed)
  /\bwrite my essay\b/i,
  /\btake my exam\b/i,
  /\bcheat\b/i,
];

export interface ModerationResult {
  isFlagged: boolean;
  reason?: string;
}

export function moderateContent(text: string): ModerationResult {
  const normalizedText = text.toLowerCase();
  
  for (const pattern of BANNED_PATTERNS) {
    if (pattern.test(normalizedText)) {
      return {
        isFlagged: true,
        reason: "Content contains prohibited words or phrases."
      };
    }
  }

  // Check for repetitive spam characters
  if (/(.)\1{10,}/.test(normalizedText)) {
    return { isFlagged: true, reason: "Content appears to be spam." };
  }

  return { isFlagged: false };
}
