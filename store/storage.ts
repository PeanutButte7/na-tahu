import { Platform } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import { StateStorage } from 'zustand/middleware';

export const storage = Platform.OS !== 'web' ? new MMKV() : null;

export const zustandStorage: StateStorage = {
  setItem: (name: string, value: string) => {
    if (storage) {
      storage.set(name, value);
    } else if (Platform.OS === 'web') {
      localStorage.setItem(name, value);
    }
  },
  getItem: (name: string) => {
    if (storage) {
      return storage.getString(name) ?? null;
    } else if (Platform.OS === 'web') {
      return localStorage.getItem(name);
    }
    return null;
  },
  removeItem: (name: string) => {
    if (storage) {
      storage.delete(name);
    } else if (Platform.OS === 'web') {
      localStorage.removeItem(name);
    }
  },
};
