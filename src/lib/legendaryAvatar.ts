/**
 * Detects if an avatar URL corresponds to a legendary (achievement-unlocked) avatar.
 * Legendary avatar filenames contain "legend-" in the path.
 */
export function isLegendaryAvatar(avatarUrl: string | null | undefined): boolean {
  if (!avatarUrl) return false;
  return avatarUrl.includes('legend-');
}

/** CSS classes for the golden ring around legendary avatars */
export const LEGENDARY_RING_CLASS = 'ring-2 ring-yellow-500/80 shadow-[0_0_8px_rgba(234,179,8,0.4)]';

/** CSS classes for the legendary badge next to the username */
export const LEGENDARY_BADGE_CLASS = 'text-yellow-500';
