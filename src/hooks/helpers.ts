import { useEffect, useMemo } from 'react';
import { DataContainer, useReactionData } from './reaction';

interface Slot<T> {
  data: DataContainer<T>;
  refCount: number;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalStore = new Map<string, Slot<any>>();

export function useSharedData<T>(key: string, init: T | (() => T)): [T, (value: T) => void] {
  const slot: Slot<T> = useMemo(() => {
    let slot = globalStore.get(key);
    if (!slot) {
      slot = { data: new DataContainer<T>(init), refCount: 0 };
      globalStore.set(key, slot);
    }
    return slot;
  }, [key]);
  useEffect(() => {
    slot.refCount += 1;
    return () => {
      slot.refCount -= 1;
      if (slot.refCount === 0) {
        globalStore.delete(key);
      }
    };
  }, [slot]);

  const value = useReactionData(slot.data);
  return [value, slot.data.change];
}
