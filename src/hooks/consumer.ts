import { useContext, useEffect, useMemo, useState } from 'react';
import { SessionContext } from '../components/provider';
import {
  StreamRemote,
  StreamReceiverState,
  StreamConsumer,
  StreamKinds,
  StreamConsumerPair,
  type RemoteStreamQuality,
} from '@8xff/atm0s-media-js';
import type { MediaStream2 } from '../platform';

let idSeed = 0;
export const useConsumer = (
  remote: StreamRemote,
  priority?: number,
  minSpatial?: number,
  maxSpatial?: number,
  minTemporal?: number,
  maxTemporal?: number,
) => {
  const consumerId = useMemo(() => idSeed++, []);
  const { getConsumer, backConsumer } = useContext(SessionContext);
  const consumer = useMemo(() => {
    return getConsumer(consumerId, remote);
  }, [remote?.peerId, remote?.name]);

  useEffect(() => {
    consumer.view('use-consumer-' + consumerId, priority, minSpatial, maxSpatial, minTemporal, maxTemporal);
    return () => {
      consumer.unview('use-consumer-' + consumerId);
      backConsumer(consumerId, remote);
    };
  }, [remote.peerId, remote.name]);

  useEffect(() => {
    const handler = (state: StreamReceiverState) => {
      switch (state) {
        case StreamReceiverState.Connecting:
          break;
        default:
          consumer.limit('use-consumer-' + consumerId, priority, minSpatial, maxSpatial, minTemporal, maxTemporal);
      }
    };
    handler(consumer.state);
    consumer.on('state', handler);

    return () => {
      consumer.off('state', handler);
    };
  }, [consumer, priority, minSpatial, maxSpatial, minTemporal, maxTemporal]);

  return consumer;
};

export const useConsumerSingle = (
  peerId: string,
  stream: string,
  kind: StreamKinds,
  priority?: number,
  minSpatial?: number,
  maxSpatial?: number,
  minTemporal?: number,
  maxTemporal?: number,
): StreamConsumer => {
  return useConsumer(
    new StreamRemote(kind, peerId, '0', stream),
    priority,
    minSpatial,
    maxSpatial,
    minTemporal,
    maxTemporal,
  );
};

export const useConsumerPair = (
  peerId: string,
  audioName: string,
  videoName: string,
  priority?: number,
  minSpatial?: number,
  maxSpatial?: number,
  minTemporal?: number,
  maxTemporal?: number,
) => {
  const consumerId = useMemo(() => idSeed++, []);
  const { getConsumerPair, backConsumerPair } = useContext(SessionContext);
  const consumer = useMemo(() => {
    return getConsumerPair(consumerId, peerId, audioName, videoName);
  }, [peerId, audioName, videoName]);

  useEffect(() => {
    consumer.view('use-consumer-' + consumerId, priority, minSpatial, maxSpatial, minTemporal, maxTemporal);
    return () => {
      consumer.unview('use-consumer-' + consumerId);
      backConsumerPair(consumerId, peerId, audioName, videoName);
    };
  }, [peerId, audioName, videoName]);

  useEffect(() => {
    const handler = (state: StreamReceiverState) => {
      switch (state) {
        case StreamReceiverState.Connecting:
          break;
        default:
          consumer.limit('use-consumer-' + consumerId, priority, minSpatial, maxSpatial, minTemporal, maxTemporal);
      }
    };
    handler(consumer.state);
    consumer.on('state', handler);

    return () => {
      consumer.off('state', handler);
    };
  }, [consumer, priority, minSpatial, maxSpatial, minTemporal, maxTemporal]);

  return consumer;
};

export const useLocalConsumer = (stream?: MediaStream) => {
  const [element, setElement] = useState<HTMLVideoElement>();
  useEffect(() => {
    if (element && stream) {
      element.srcObject = stream;
      return () => {
        element.srcObject = null;
      };
    }
  }, [element, stream]);

  return (instance: HTMLVideoElement | null) => {
    setElement(instance || undefined);
  };
};

export const useConsumerState = (
  consumer: StreamConsumerPair | StreamConsumer,
): [StreamReceiverState, MediaStream2 | undefined] => {
  const [state, setState] = useState(consumer.state);
  const [, setHasTrack] = useState(() => !!consumer.stream && consumer.stream.getTracks().length > 0);

  //Checking for ensure stream ready
  useEffect(() => {
    const stream = consumer.stream;
    if (stream && stream.getTracks().length === 0) {
      const checkTrack = () => {
        if (stream.getTracks().length > 0) {
          setHasTrack(true);
        }
      };
      consumer.on('track_added', checkTrack);
      return () => {
        consumer.off('track_added', checkTrack);
      };
    } else {
      return () => {};
    }
  }, [consumer.stream]);

  useEffect(() => {
    consumer.on('state', setState);
    return () => {
      consumer.off('state', setState);
    };
  }, [consumer]);

  return [state, consumer.stream];
};

export const useConsumerQuality = (consumer: StreamConsumerPair | StreamConsumer): RemoteStreamQuality | undefined => {
  const [quality, setQuality] = useState<RemoteStreamQuality | undefined>();

  useEffect(() => {
    const handler = (quality: RemoteStreamQuality | undefined) => {
      setQuality(quality || undefined);
    };
    consumer.on('quality', handler);
    return () => {
      consumer.off('quality', handler);
    };
  }, [consumer]);
  return quality;
};
