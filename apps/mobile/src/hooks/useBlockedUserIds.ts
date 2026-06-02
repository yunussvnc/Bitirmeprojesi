import { useCallback, useEffect, useState } from 'react';
import { getBlockedUsers } from '@/src/services/moderationService';

/**
 * Loads blocked user IDs from the API and exposes a refresh helper.
 */
export function useBlockedUserIds() {
  const [blockedIds, setBlockedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await getBlockedUsers();
      setBlockedIds((data.items ?? []).map((u) => u.id));
    } catch {
      setBlockedIds([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addBlocked = useCallback((userId: number) => {
    setBlockedIds((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
  }, []);

  const isBlocked = useCallback(
    (userId: number | undefined | null) => {
      if (userId == null) return false;
      return blockedIds.includes(userId);
    },
    [blockedIds]
  );

  return { blockedIds, loading, refresh, addBlocked, isBlocked };
}
