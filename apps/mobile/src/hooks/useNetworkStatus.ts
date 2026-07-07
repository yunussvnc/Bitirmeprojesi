/**
 * useNetworkStatus — Ağ bağlantı durumu hook'u
 *
 * @react-native-community/netinfo ile internet bağlantısını izler.
 * Offline banner ve API koruma için kullanılır.
 *
 * Kullanım:
 *   const { isConnected, connectionType } = useNetworkStatus();
 *
 * @module hooks/useNetworkStatus
 */

import { useEffect, useState } from "react";
import NetInfo, { type NetInfoStateType } from "@react-native-community/netinfo";

export type NetworkStatus = {
  /** Cihaz internete bağlı mı? */
  isConnected: boolean;
  /** Bağlantı tipi: wifi, cellular, none, unknown */
  connectionType: NetInfoStateType | null;
};

/**
 * Ağ durumunu reaktif olarak izleyen hook.
 * Bağlantı değiştiğinde otomatik güncellenir.
 */
export function useNetworkStatus(): NetworkStatus {
  const [isConnected, setIsConnected] = useState(true);
  const [connectionType, setConnectionType] = useState<NetInfoStateType | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? true);
      setConnectionType(state.type);
    });

    return () => unsubscribe();
  }, []);

  return { isConnected, connectionType };
}
