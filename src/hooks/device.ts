import { TypedEventEmitter } from '@8xff/atm0s-media-js/types/lib/utils/typed-event-emitter';
import { getLogger } from '@8xff/atm0s-media-js/types/lib/utils/logger';
import { useEffect, useState } from 'react';

const logger = getLogger('DeviceHook');

interface Return {
  media?: MediaStream;
  error?: Error;
}

class StreamContainer extends TypedEventEmitter<{ changed: (data: Return) => void }> {
  count = 0;
  data: Return = {};

  constructor(private key: string) {
    super();
    logger.log('Created container for local stream', key);
  }

  setData(data: Return) {
    this.data = data;
    this.emit('changed', data);
  }

  retain() {
    this.count += 1;
    logger.log('Retain local stream', this.key, this.count);
    return this.count;
  }

  release() {
    this.count -= 1;
    logger.log('Release local stream', this.key, this.count);
    if (this.count == 0) {
      logger.log('Destroy local stream', this.key);
      this.data.media?.getTracks().map((track) => {
        track.stop();
      });
    }
    return this.count;
  }
}
const globalStore: Map<string, StreamContainer> = new Map();

export const useDevices = (
  kind: MediaDeviceKind,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): [MediaDeviceInfo[], any | null] => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [error, setError] = useState(null);
  useEffect(() => {
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        setDevices(devices.filter((d) => d.kind == kind));
      })
      .catch((error) => {
        setDevices([]);
        setError(error);
      });
  }, [kind]);

  return [devices, error];
};

function getDevicePrivate(
  kind: MediaDeviceKind,
  deviceId: string | boolean,
  callback: (data: Return) => void,
): [StreamContainer, string] {
  const key = kind + '-' + deviceId;
  let containerSlot = globalStore.get(key);
  if (containerSlot) {
    containerSlot.on('changed', callback);
    callback(containerSlot.data);
  } else {
    containerSlot = new StreamContainer(key);
    globalStore.set(key, containerSlot);
    let constraints: MediaStreamConstraints = {};
    if (kind == 'audioinput') {
      constraints = {
        audio:
          typeof deviceId == 'string'
            ? {
                deviceId: deviceId,
              }
            : true,
      };
    } else if (kind == 'videoinput') {
      constraints = {
        video:
          typeof deviceId == 'string'
            ? {
                deviceId: deviceId,
              }
            : true,
      };
    }
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        stream.cachedKey = key;
        containerSlot?.setData({ media: stream });
        callback({ media: stream });
      })
      .catch((err) => {
        containerSlot?.setData({ error: err });
        callback({ error: err });
      });
  }

  return [containerSlot, key];
}

export function getDevice(kind: MediaDeviceKind, deviceId: string | boolean): Promise<MediaStream> {
  return new Promise((resolve, reject) => {
    getDevicePrivate(kind, deviceId, (res) => {
      if (res.error) {
        reject(res.error);
      } else {
        resolve(res.media!);
      }
    });
  });
}

export function retainDevice(key: string) {
  const slot = globalStore.get(key);
  slot?.retain();
}

export function releaseDevice(key: string) {
  const slot = globalStore.get(key);
  if (slot?.release() == 0) {
    globalStore.delete(key);
  }
}

export const useDevice = (
  kind: MediaDeviceKind,
  deviceId: string | boolean,
): [MediaStream | undefined, Error | undefined] => {
  const [res, setRes] = useState({} as Return);
  useEffect(() => {
    if (deviceId != false) {
      const [containerSlot, key] = getDevicePrivate(kind, deviceId, setRes);
      containerSlot.retain();
      return () => {
        setRes({ media: undefined, error: undefined });
        if (containerSlot?.release() == 0) {
          globalStore.delete(key);
        }
      };
    }
  }, [kind, deviceId]);
  return [res.media, res.error];
};

export const useUserMedia = (
  constraints?: MediaStreamConstraints,
  active?: boolean,
): [MediaStream | undefined, Error | undefined] => {
  const [res, setRes] = useState({} as Return);
  useEffect(() => {
    if (active) {
      let gotStream: MediaStream | undefined;
      navigator.mediaDevices
        .getUserMedia(constraints)
        .then((stream) => {
          gotStream = stream;
          setRes({ media: stream });
        })
        .catch((err) => {
          gotStream = undefined;
          setRes({ error: err });
        });
      return () => {
        setRes({ media: undefined, error: undefined });
        gotStream?.getTracks().forEach((track) => {
          track.stop();
        });
      };
    }
  }, [JSON.stringify(constraints), active]);
  return [res.media, res.error];
};

export const useDisplayMedia = (
  constraints?: DisplayMediaStreamOptions,
  active?: boolean,
): [MediaStream | undefined, Error | undefined] => {
  const [res, setRes] = useState({} as Return);
  useEffect(() => {
    if (active) {
      let gotStream: MediaStream | undefined;
      navigator.mediaDevices
        .getDisplayMedia(constraints)
        .then((stream) => {
          gotStream = stream;
          setRes({ media: stream });
        })
        .catch((err) => {
          gotStream = undefined;
          setRes({ error: err });
        });
      return () => {
        setRes({ media: undefined, error: undefined });
        gotStream?.getTracks().forEach((track) => {
          track.stop();
        });
      };
    }
  }, [JSON.stringify(constraints), active]);
  return [res.media, res.error];
};
