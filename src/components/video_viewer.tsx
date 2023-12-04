import { StreamRemote } from '@8xff/atm0s-media-js';
import React from 'react';
import { useConsumer, useLocalConsumer } from '../hooks';

export const RemoteViewer = (props: { remote: StreamRemote; priority?: number }) => {
  const [ref, state] = useConsumer(props.remote, props.priority);
  return (
    <div className="w-full h-full">
      <div>{state}</div>
      <video muted autoPlay className="w-full h-full" ref={ref}></video>
    </div>
  );
};

export const LocalViewer = (props: { stream: MediaStream }) => {
  const ref = useLocalConsumer(props.stream);
  return <video muted autoPlay className="w-full h-full" ref={ref}></video>;
};

export const VideoViewer = (props: { stream: MediaStream | StreamRemote; priority?: number }) => {
  if (props.stream instanceof StreamRemote) {
    return <RemoteViewer remote={props.stream} priority={props.priority}></RemoteViewer>;
  } else {
    return <LocalViewer stream={props.stream}></LocalViewer>;
  }
};
