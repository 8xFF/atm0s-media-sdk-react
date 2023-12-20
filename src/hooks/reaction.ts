import { TypedEventEmitter } from '@8xff/atm0s-media-js';
import { useEffect, useState } from 'react';
export class DataContainer<T> extends TypedEventEmitter<{ changed: (data: T) => void }> {
  data: T;
  version: number = 0;
  constructor(init: T | (() => T)) {
    super();
    if (typeof init === 'function') {
      this.data = (init as unknown as () => T)();
    } else {
      this.data = init;
    }
  }

  get value(): T {
    return this.data;
  }

  change = (newValue: T) => {
    this.data = newValue;
    this.emit('changed', newValue);
  };

  addChangeListener = (callback: (data: T) => void) => {
    this.on('changed', callback);
  };

  removeChangeListener = (callback: (data: T) => void) => {
    this.off('changed', callback);
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class MapContainer<K, T> extends TypedEventEmitter<any> {
  map: Map<K, T> = new Map();
  list: T[] = [];

  constructor() {
    super();
  }

  set(key: K, value: T) {
    this.map.set(key, value);
    this.list = Array.from(this.map.values());
    this.emit('list', this.list);
    this.emit('map', this.map);
    this.emit('slot_' + key, value);
  }

  has(key: K): boolean {
    return this.map.has(key);
  }

  get(key: K): T | undefined {
    return this.map.get(key);
  }

  del(key: K) {
    this.map.delete(key);
    this.list = Array.from(this.map.values());
    this.emit('list', this.list);
    this.emit('map', this.map);
    this.emit('slot_' + key, undefined);
  }

  onSlotChanged = (slot: K, handler: (data: T) => void) => {
    this.on('slot_' + slot, handler);
  };

  offSlotChanged = (slot: K, handler: (data: T) => void) => {
    this.off('slot_' + slot, handler);
  };

  onMapChanged = (handler: (map: Map<K, T>) => void) => {
    this.on('map', handler);
  };

  offMapChanged = (handler: (map: Map<K, T>) => void) => {
    this.on('map', handler);
  };

  onListChanged = (handler: (map: T[]) => void) => {
    this.on('list', handler);
  };

  offListChanged = (handler: (map: T[]) => void) => {
    this.on('list', handler);
  };
}

export function useReactionData<T>(container: DataContainer<T>): T {
  const [data, setData] = useState(container.data);
  useEffect(() => {
    container.addChangeListener(setData);
    return () => {
      container.removeChangeListener(setData);
    };
  }, [container, setData]);
  return data;
}
export function useReactionList<K, T>(container: MapContainer<K, T>): T[] {
  const [list, setList] = useState<T[]>(container.list);
  useEffect(() => {
    container.onListChanged(setList);
    return () => {
      container.offListChanged(setList);
    };
  }, [container, setList]);
  return list;
}
