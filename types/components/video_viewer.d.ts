import { StreamRemote } from '@8xff/atm0s-media-js';
import React from 'react';
export declare const RemoteViewer: (props: {
    remote: StreamRemote;
    priority?: number;
}) => React.JSX.Element;
export declare const LocalViewer: (props: {
    stream: MediaStream;
}) => React.JSX.Element;
export declare const VideoViewer: (props: {
    stream: MediaStream | StreamRemote;
    priority?: number;
}) => React.JSX.Element;
//# sourceMappingURL=video_viewer.d.ts.map