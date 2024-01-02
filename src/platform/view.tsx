import { useCallback, useEffect, useMemo } from 'react';
import React, { type MediaHTMLAttributes } from 'react';
import { StreamRemote, StreamConsumer, StreamConsumerPair, type StreamLimit } from '@8xff/atm0s-media-js';
import { DataContainer } from '../hooks/reaction';
import { MediaStreamArc } from '../hooks/shared_device';
import type { MediaStream2 } from './device';
import { useConsumer } from '../hooks/consumer';

export const useConsumerConnectHTMLElement = (consumer: StreamConsumerPair | StreamConsumer) => {
  const element = useMemo(() => new DataContainer<HTMLVideoElement | null>(null), []);
  useEffect(() => {
    if (consumer.stream && element.value) {
      element.value.srcObject = consumer.stream;
    }
    const handler = () => {
      if (element.value) {
        if (consumer.stream && element.value.srcObject !== consumer.stream) {
          element.value.srcObject = consumer.stream || null;
        }
      }
    };
    consumer.on('state', handler);
    element.addChangeListener(handler);

    return () => {
      consumer.off('state', handler);
      element.removeChangeListener(handler);
      if (element.data) {
        element.data.srcObject = null;
      }
    };
  }, [element, consumer]);

  return useCallback(
    (instance: HTMLVideoElement | null) => {
      if (instance && consumer.stream) {
        instance.srcObject = consumer.stream;
      }
      element.change(instance);
    },
    [element],
  );
};

export const useStreamConnectHTMLElement = (stream?: MediaStream2) => {
  const element = useMemo(() => new DataContainer<HTMLVideoElement | null>(null), []);
  useEffect(() => {
    if (stream) {
      const handler = () => {
        if (element.value) {
          if (element.value.srcObject !== stream) {
            element.value.srcObject = stream || null;
          }
        }
      };
      element.addChangeListener(handler);
      return () => {
        element.removeChangeListener(handler);
        if (element.data) {
          element.data.srcObject = null;
        }
      };
    }
  }, [element, stream]);

  return useCallback(
    (instance: HTMLVideoElement | null) => {
      if (instance && stream) {
        instance.srcObject = stream;
      }
      element.change(instance);
    },
    [element, stream],
  );
};

export const RemoteViewer = (
  props: MediaHTMLAttributes<HTMLVideoElement> & {
    stream: StreamRemote;
    limit?: StreamLimit;
  },
) => {
  const consumer = useConsumer(props.stream, props.limit);
  const ref = useConsumerConnectHTMLElement(consumer);
  return (
    <video muted autoPlay ref={ref} {...props}>
      {' '}
    </video>
  );
};

export const ConsumerViewer = (
  props: MediaHTMLAttributes<HTMLVideoElement> & { consumer: StreamConsumerPair | StreamConsumer },
) => {
  const ref = useConsumerConnectHTMLElement(props.consumer);
  return (
    <video muted autoPlay ref={ref} {...props}>
      {' '}
    </video>
  );
};

export const LocalViewer = (
  props: MediaHTMLAttributes<HTMLVideoElement> & { stream: MediaStream2 | MediaStreamArc },
) => {
  const ref = useStreamConnectHTMLElement(props.stream instanceof MediaStreamArc ? props.stream.stream : props.stream);
  return (
    <video muted autoPlay ref={ref} {...props}>
      {' '}
    </video>
  );
};

export const VideoViewer = (
  props: MediaHTMLAttributes<HTMLVideoElement> & {
    stream: MediaStream2 | MediaStreamArc | StreamRemote | StreamConsumerPair | StreamConsumer;
    priority?: number;
    min_spatial?: number;
    max_spatial?: number;
    min_temporal?: number;
    max_temporal?: number;
  },
) => {
  if (props.stream instanceof StreamRemote) {
    return <RemoteViewer {...props} stream={props.stream} />;
  } else if (props.stream instanceof StreamConsumerPair || props.stream instanceof StreamConsumer) {
    return <ConsumerViewer {...props} consumer={props.stream} />;
  } else {
    return <LocalViewer {...props} stream={props.stream} />;
  }
};
