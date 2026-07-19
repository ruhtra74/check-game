export interface AvatarOption {
  id: string;
  emoji: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: 'renard', emoji: '🦊' },
  { id: 'chat', emoji: '🐱' },
  { id: 'panda', emoji: '🐼' },
  { id: 'lion', emoji: '🦁' },
  { id: 'koala', emoji: '🐨' },
  { id: 'pingouin', emoji: '🐧' },
  { id: 'dragon', emoji: '🐲' },
  { id: 'poulpe', emoji: '🐙' },
];

export function emojiPourAvatarId(avatarId: string | null): string | undefined {
  return AVATAR_OPTIONS.find((a) => a.id === avatarId)?.emoji;
}
