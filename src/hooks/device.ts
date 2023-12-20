import { useEffect, useState } from 'react';
import { mediaDevices } from '../platform';

interface Return {
  media?: MediaStream;
  error?: Error;
}

export const useDevices = (kind: MediaDeviceKind): [MediaDeviceInfo[], Error | null] => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [error, setError] = useState(null);
  useEffect(() => {
    mediaDevices
      .enumerateDevices()
      .then((devices) => {
        setDevices(
          devices
            .filter((d: MediaDeviceInfo) => d.kind === kind)
            .map((d: MediaDeviceInfo) => {
              if (d.deviceId === '') {
                return {
                  deviceId: 'default',
                  label: 'Default',
                  groupId: d.groupId,
                  kind: d.kind,
                } as unknown as MediaDeviceInfo;
              } else {
                return d;
              }
            }),
        );
      })
      .catch((error) => {
        setDevices([]);
        setError(error);
      });
  }, [kind]);

  return [devices, error];
};

export const useUserMedia = (
  constraints?: MediaStreamConstraints,
  active?: boolean,
): [MediaStream | undefined, Error | undefined] => {
  const [res, setRes] = useState({} as Return);
  useEffect(() => {
    if (active) {
      let gotStream: MediaStream | undefined;
      mediaDevices
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
    } else {
      return () => {};
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
      mediaDevices
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
    } else {
      return () => {};
    }
  }, [JSON.stringify(constraints), active]);
  return [res.media, res.error];
};
