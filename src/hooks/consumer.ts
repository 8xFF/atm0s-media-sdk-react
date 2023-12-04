import { useContext, useEffect, useMemo, useState, type LegacyRef } from 'react';
import { SessionContext, SessionState } from '../components/provider';
import Atm0s from '@8xff/atm0s-media-js';
import { useSessionState } from './state';

let idSeed = 0;
export const useConsumer = (
  remote?: Atm0s.StreamRemote,
  priority?: number,
  maxSpatial?: number,
  maxTemporal?: number,
): [LegacyRef<HTMLVideoElement> | undefined, Atm0s.StreamReceiverState, Atm0s.StreamConsumer | undefined] => {
  const consumerId = useMemo(() => idSeed++, []);
  const sessionState = useSessionState();
  const [consumer, setConsumer] = useState<Atm0s.StreamConsumer>();
  const [state, setState] = useState<Atm0s.StreamReceiverState>(Atm0s.StreamReceiverState.NoSource);
  const [element, setElement] = useState<HTMLVideoElement>();
  const { data, getConsumer, backConsumer } = useContext(SessionContext);

  const isConnectionEstablished = [SessionState.Connected, SessionState.Reconnecting].indexOf(sessionState) >= 0;

  useEffect(() => {
    if (data?.session && remote) {
      const consumer = getConsumer(consumerId, remote);
      if (consumer) {
        consumer.on('state', setState);
        setState(consumer.state);
        setConsumer(consumer);
        return () => {
          consumer?.unview('use-consumer-' + consumerId);
          consumer?.off('state', setState);
          backConsumer(consumerId, remote);
        };
      }
    }
  }, [data?.session, remote]);

  useEffect(() => {
    if (element && consumer && isConnectionEstablished) {
      element.srcObject = consumer.view('use-consumer-' + consumerId, priority, maxSpatial, maxTemporal);
      return () => {
        element.srcObject = null;
        consumer.unview('use-consumer-' + consumerId);
      };
    }
  }, [element, consumer, isConnectionEstablished]);

  useEffect(() => {
    if (element && consumer && isConnectionEstablished) {
      consumer.limit('use-consumer-' + consumerId, priority, maxSpatial, maxTemporal);
    }
  }, [element, consumer, isConnectionEstablished, priority, maxSpatial, maxTemporal]);

  const ref = (instance: HTMLVideoElement | null) => {
    setElement(instance || undefined);
  };

  return [ref, state, consumer];
};

export const useConsumerPair = (
  peerId: string,
  audioName: string,
  videoName: string,
  priority?: number,
  maxSpatial?: number,
  maxTemporal?: number,
): [LegacyRef<HTMLVideoElement> | undefined, Atm0s.StreamReceiverState, Atm0s.StreamConsumerPair | undefined] => {
  const consumerId = useMemo(() => idSeed++, []);
  const sessionState = useSessionState();
  const [consumer, setConsumer] = useState<Atm0s.StreamConsumerPair>();
  const [state, setState] = useState<Atm0s.StreamReceiverState>(Atm0s.StreamReceiverState.NoSource);
  const [element, setElement] = useState<HTMLVideoElement>();
  const { data, getConsumerPair: getConsumerPair, backConsumerPair: backConsumerPair } = useContext(SessionContext);

  const isConnectionEstablished = [SessionState.Connected, SessionState.Reconnecting].indexOf(sessionState) >= 0;

  useEffect(() => {
    if (data?.session) {
      const consumer = getConsumerPair(consumerId, peerId, audioName, videoName);
      if (consumer) {
        consumer.on('state', setState);
        setState(consumer.state);
        setConsumer(consumer);
        return () => {
          consumer?.off('state', setState);
          backConsumerPair(consumerId, peerId, audioName, videoName);
        };
      }
    }
  }, [data?.session, peerId, audioName, videoName]);

  useEffect(() => {
    if (element && consumer && isConnectionEstablished) {
      element.srcObject = consumer.view('use-consumer-' + consumerId, priority, maxSpatial, maxTemporal);
      return () => {
        element.srcObject = null;
        consumer.unview('use-consumer-' + consumerId);
      };
    }
  }, [element, consumer, isConnectionEstablished]);

  useEffect(() => {
    if (element && consumer && isConnectionEstablished) {
      consumer.limit('use-consumer-' + consumerId, priority, maxSpatial, maxTemporal);
    }
  }, [element, consumer, isConnectionEstablished, priority, maxSpatial, maxTemporal]);

  const ref = (instance: HTMLVideoElement | null) => {
    setElement(instance || undefined);
  };

  return [ref, state, consumer];
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
