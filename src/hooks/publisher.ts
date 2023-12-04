import { useContext, useEffect, useMemo, useState } from 'react';
import { SessionContext, StreamPublisherWrap } from '../components/provider';
import Atm0s from '@8xff/atm0s-media-js';

let idSeed = 0;

export const usePublisher = (
  cfg: Atm0s.SenderConfig,
): [Atm0s.StreamSenderState, MediaStream | undefined | null, StreamPublisherWrap | undefined] => {
  const publisherId = useMemo(() => idSeed++, []);
  const [state, setState] = useState<Atm0s.StreamSenderState>(Atm0s.StreamSenderState.Created);
  const [producer, setProducer] = useState<StreamPublisherWrap>();
  const { data, getPublisher: getPublisher, backPublisher: backPublisher } = useContext(SessionContext);
  useEffect(() => {
    if (data?.session) {
      const newProducer = getPublisher(publisherId, cfg);
      if (newProducer) {
        const onUpdateState = (state: Atm0s.StreamSenderState) => {
          setState(state);
        };
        newProducer.on('state', onUpdateState);
        setProducer(newProducer);
        setState(newProducer.state);
        return () => {
          newProducer?.off('state', onUpdateState);
          backPublisher(publisherId, cfg);
        };
      }
    }
  }, [data?.session, cfg.kind + cfg.name]);

  return [state, producer?.localStream, producer];
};
