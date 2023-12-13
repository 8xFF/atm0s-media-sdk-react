import { useContext, useEffect, useMemo, useState } from 'react';
import { SessionContext, StreamPublisherWrap } from '../components/provider';
import { type SenderConfig, StreamSenderState } from '@8xff/atm0s-media-js';

let idSeed = 0;

export const usePublisher = (
  cfg: SenderConfig,
): [StreamSenderState, MediaStream | undefined | null, StreamPublisherWrap | undefined] => {
  const publisherId = useMemo(() => idSeed++, []);
  const [state, setState] = useState<StreamSenderState>(StreamSenderState.Created);
  const [producer, setProducer] = useState<StreamPublisherWrap>();
  const { data, getPublisher, backPublisher } = useContext(SessionContext);
  useEffect(() => {
    if (data?.session) {
      const newProducer = getPublisher(publisherId, cfg);
      if (newProducer) {
        const onUpdateState = (state: StreamSenderState) => {
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
