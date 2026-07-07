/**
 * MMKV Storage Adapter
 * 
 * AsyncStorage yerine C++ tabanlı MMKV kullanarak
 * uygulama açılış hızını ~30x artırır.
 * Zustand persist middleware ile uyumlu adapter.
 * 
 * @module utils/mmkvStorage
 */

import { createMMKV } from 'react-native-mmkv';
import { StateStorage } from 'zustand/middleware';

// Tek bir MMKV instance tüm store'lar için yeterli
export const mmkv = createMMKV({ id: 'asemos-app-storage' });

/**
 * Zustand persist middleware için MMKV storage adapter.
 * `createJSONStorage(() => mmkvStorage)` şeklinde kullanılır.
 */
export const mmkvStorage: StateStorage = {
  getItem: (name: string) => {
    const value = mmkv.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string) => {
    mmkv.set(name, value);
  },
  removeItem: (name: string) => {
    mmkv.remove(name);
  },
};
