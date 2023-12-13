import { StreamRemote } from '@8xff/atm0s-media-js';
import React from 'react';
export declare const RemoteViewer: ({ remote, priority, ...others }: {
    remote: StreamRemote;
    priority?: number | undefined;
} & React.MediaHTMLAttributes<HTMLVideoElement>) => React.JSX.Element;
export declare const LocalViewer: ({ stream, ...others }: {
    stream: MediaStream;
} & React.MediaHTMLAttributes<HTMLVideoElement>) => React.JSX.Element;
export declare const VideoViewer: ({ stream, priority, ...others }: {
    stream: MediaStream | StreamRemote;
    priority?: number | undefined;
} & React.MediaHTMLAttributes<HTMLVideoElement>) => React.JSX.Element;
//# sourceMappingURL=video_viewer.d.ts.map