import { type Story } from '@/src/services/storyService';

export function isStoryCloseFriends(story: Story | undefined): boolean {
  return Boolean(story && (story.privacy_type === 'close_friends' || (story as any).is_close_friends));
}

export function getProgressFillColor(isCloseFriends: boolean): string {
  return isCloseFriends ? 'rgba(74,222,128,0.9)' : 'rgba(255,255,255,0.9)';
}
