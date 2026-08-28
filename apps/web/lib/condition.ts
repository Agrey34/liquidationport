/**
 * Standardized Liquidation Condition Formatters & Badge Styles
 */

export const STANDARD_CONDITIONS = [
  'Brand New',
  'Open Box',
  'Untested Returns',
  'Overstock',
  'Shelf Pulls',
  'Good',
  'Fair',
  'Scratch & Dent',
  'Salvage / Parts',
] as const;

export const DEFAULT_CONDITION = 'Untested Returns';

export function formatConditionLabel(condition: string | null | undefined): string {
  if (!condition) return 'Returns';
  const c = condition.trim().toLowerCase();

  if (c.includes('untested') || c.includes('returns') || c.includes('customer return')) {
    return 'Untested Returns';
  }
  if (c.includes('brand new')) {
    return 'Brand New';
  }
  if (c === 'new') {
    return 'New';
  }
  if (c.includes('open box') || c.includes('like new')) {
    return 'Open Box';
  }
  if (c.includes('shelf pull')) {
    return 'Shelf Pulls';
  }
  if (c.includes('overstock')) {
    return 'Overstock';
  }
  if (c.includes('good')) {
    return 'Good';
  }
  if (c.includes('fair')) {
    return 'Fair';
  }
  if (c.includes('scratch') || c.includes('dent')) {
    return 'Scratch & Dent';
  }
  if (c.includes('salvage') || c.includes('parts')) {
    return 'Salvage / Parts';
  }
  if (c.includes('tested')) {
    return 'Tested Working';
  }

  // If already short (<= 15 chars), preserve capital words
  if (condition.length <= 15) return condition;

  // Fallback: trim long strings
  return condition.split('/')[0].trim();
}

/**
 * Clean short condition for small card badges (Max ~12-14 chars)
 */
export function formatCardConditionBadge(condition: string | null | undefined): string {
  const formatted = formatConditionLabel(condition);
  if (formatted === 'Untested Returns') return 'Returns';
  if (formatted === 'Salvage / Parts') return 'Salvage';
  if (formatted === 'Like New / Open Box') return 'Open Box';
  return formatted;
}

/**
 * Returns distinct badge styling colors based on condition grade
 */
export function getConditionBadgeClass(condition: string | null | undefined): string {
  const label = formatConditionLabel(condition).toLowerCase();

  if (label.includes('brand new') || label === 'new') {
    return 'bg-emerald-500/90 text-white border-emerald-400';
  }
  if (label.includes('open box') || label.includes('like new')) {
    return 'bg-blue-500/90 text-white border-blue-400';
  }
  if (label.includes('good')) {
    return 'bg-indigo-500/90 text-white border-indigo-400';
  }
  if (label.includes('fair')) {
    return 'bg-amber-500/90 text-white border-amber-400';
  }
  if (label.includes('scratch') || label.includes('dent')) {
    return 'bg-orange-500/90 text-white border-orange-400';
  }
  if (label.includes('salvage') || label.includes('parts')) {
    return 'bg-rose-500/90 text-white border-rose-400';
  }
  if (label.includes('overstock') || label.includes('shelf pull')) {
    return 'bg-cyan-600/90 text-white border-cyan-500';
  }
  if (label.includes('returns') || label.includes('untested')) {
    return 'bg-purple-600/90 text-white border-purple-500';
  }

  return 'bg-neutral-800/90 text-white border-neutral-700';
}
