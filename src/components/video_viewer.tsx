import { StreamRemote } from '@8xff/atm0s-media-js';
import React from 'react';
import { useConsumer, useLocalConsumer } from '../hooks/consumer';

export const RemoteViewer = ({
  remote,
  priority,
  ...others
}: { remote: StreamRemote; priority?: number } & React.MediaHTMLAttributes<HTMLVideoElement>) => {
  others = { autoPlay: true, playsInline: true, muted: true, ...others };
  const [ref, state] = useConsumer(remote, priority);
  return (
    <div className="w-full h-full">
      <div>{state}</div>
      <video {...others} className="w-full h-full" ref={ref}></video>
    </div>
  );
};

export const LocalViewer = ({
  stream,
  ...others
}: { stream: MediaStream } & React.MediaHTMLAttributes<HTMLVideoElement>) => {
  others = { autoPlay: true, playsInline: true, muted: true, ...others };
  const ref = useLocalConsumer(stream);
  return <video {...others} className="w-full h-full" ref={ref}></video>;
};

export const VideoViewer = ({
  stream,
  priority,
  ...others
}: { stream: MediaStream | StreamRemote; priority?: number } & React.MediaHTMLAttributes<HTMLVideoElement>) => {
  if (stream instanceof StreamRemote) {
    return <RemoteViewer {...others} remote={stream} priority={priority}></RemoteViewer>;
  } else {
    return <LocalViewer {...others} stream={stream}></LocalViewer>;
  }
};
