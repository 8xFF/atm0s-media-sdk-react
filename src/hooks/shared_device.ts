import { useEffect, useMemo } from 'react';
import { DataContainer, useReactionData } from './reaction';
import { TypedEventEmitter } from '@8xff/atm0s-media-js';
import { mediaDevices, type MediaStream2 } from '../platform/device';

export class MediaStreamArc {
  refCount = 0;
  constructor(public stream: MediaStream2) {}

  retain() {
    this.refCount += 1;
  }

  release() {
    this.refCount -= 1;
    if (this.refCount === 0) {
      this.stream.getTracks().map((t) => t.stop());
    }
    return this.refCount;
  }
}

export type MediaStreamChanger = (constraints?: MediaStreamConstraints | MediaStreamArc) => void;

interface Return {
  media?: MediaStreamArc;
  error?: Error;
}

const EVENT = 'changed';

class StreamSlot extends TypedEventEmitter<{ [EVENT]: (data: Return) => void }> {
  refCount = 0;
  data: Return = {};
  queue: (MediaStreamConstraints | MediaStreamArc | undefined)[] = [];

  constructor(
    _key: string,
    private isScreen: boolean,
  ) {
    super();
  }

  retain() {
    this.refCount += 1;
  }

  release() {
    this.refCount -= 1;
    if (this.refCount === 0) {
      this.request(undefined);
    }
    return this.refCount;
  }

  request = (constraints?: MediaStreamConstraints | MediaStreamArc) => {
    this.requestAsync(constraints);
  };

  async requestAsync(constraints?: MediaStreamConstraints | MediaStreamArc) {
    this.queue.push(constraints);
    if (this.queue.length === 1) {
      while (this.queue.length > 0) {
        const job = this.queue.shift();
        await this.processing(job);
      }
    }
  }

  async processing(constraints?: MediaStreamConstraints | MediaStreamArc) {
    if (this.data.media) {
      this.data.media.release();
      this.data = {};
      this.emit(EVENT, this.data);
    }

    if (constraints) {
      if (constraints instanceof MediaStreamArc) {
        this.data = { media: constraints };
        this.emit(EVENT, this.data);
      } else {
        try {
          let stream: MediaStream2 | undefined = undefined;
          if (this.isScreen) {
            stream = await mediaDevices.getDisplayMedia(constraints);
          } else {
            stream = await mediaDevices.getUserMedia(constraints);
          }
          const wrapper = new MediaStreamArc(stream);
          wrapper.retain();
          this.data = { media: wrapper };
          this.emit(EVENT, this.data);
        } catch (err) {
          this.data = { error: err as Error };
          this.emit(EVENT, this.data);
        }
      }
    }
  }
}

const globalStore: Map<string, StreamSlot> = new Map();

const useSharedRawMedia = (
  key: string,
  isScreen: boolean,
): [MediaStreamArc | undefined, Error | undefined, MediaStreamChanger] => {
  const data = useMemo(() => new DataContainer<Return>({}), []);
  const streamSlot = useMemo(() => {
    let slot = globalStore.get(key);
    if (!slot) {
      slot = new StreamSlot(key, isScreen);
      globalStore.set(key, slot);
    }
    data.change(slot.data);
    slot.on(EVENT, data.change);
    return slot;
  }, [key, data]);

  useEffect(() => {
    streamSlot.retain();
    return () => {
      if (streamSlot.release() === 0) {
        globalStore.delete(key);
      }
      streamSlot.off(EVENT, data.change);
    };
  }, [key, streamSlot, data]);
  const dataValue = useReactionData(data);

  return [dataValue?.media, dataValue?.error, streamSlot.request];
};

export const useSharedUserMedia = (
  key: string,
): [MediaStreamArc | undefined, Error | undefined, MediaStreamChanger] => {
  return useSharedRawMedia(key, false);
};

export const useSharedDisplayMedia = (
  key: string,
): [MediaStreamArc | undefined, Error | undefined, MediaStreamChanger] => {
  return useSharedRawMedia(key, true);
};
