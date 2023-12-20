import { useContext, useEffect, useMemo, useState } from 'react';
import { SessionContext, StreamPublisherWrap } from '../components/provider';
import { type SenderConfig, StreamSenderState } from '@8xff/atm0s-media-js';
import type { MediaStream2 } from '../platform';
import type { MediaStreamArc } from './shared_device';

let idSeed = 0;

export const usePublisher = (cfg: SenderConfig): StreamPublisherWrap => {
  const publisherId = useMemo(() => idSeed++, []);
  const { data, getPublisher, backPublisher } = useContext(SessionContext);
  const publisher = useMemo(() => {
    return getPublisher(publisherId, cfg);
  }, [data, getPublisher, cfg.kind + cfg.name]);

  useEffect(() => {
    return () => {
      backPublisher(publisherId, cfg);
    };
  }, [publisher]);

  return publisher;
};

export const usePublisherState = (
  publisher: StreamPublisherWrap,
): [StreamSenderState, MediaStreamArc | MediaStream2 | undefined] => {
  const [state, setState] = useState<StreamSenderState>(publisher.state);
  useEffect(() => {
    publisher.on('state', setState);
    return () => {
      publisher.off('state', setState);
    };
  }, [publisher]);

  return [state, publisher.stream || undefined];
};
