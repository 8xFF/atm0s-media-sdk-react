import React from 'react';
import { StreamPublisher, type AnyFunction, type IPublisherCallbacks, Session, StreamRemote, StreamConsumer, StreamConsumerPair, type ISessionConfig, type SenderConfig } from '@8xff/atm0s-media-js';
export declare enum SessionState {
    New = "new",
    Connecting = "connecting",
    Connected = "connected",
    Reconnecting = "reconnecting",
    Disconnected = "disconnected",
    Error = "error"
}
export declare class StreamPublisherWrap {
    private publisher;
    constructor(publisher: StreamPublisher);
    get state(): import("@8xff/atm0s-media-js").StreamSenderState;
    get localStream(): MediaStream | null | undefined;
    on(type: keyof IPublisherCallbacks, callback: AnyFunction): void;
    off(type: keyof IPublisherCallbacks, callback: AnyFunction): void;
    switchStream(stream: MediaStream | null): void;
}
interface SessionContainer {
    session: Session;
    state: SessionState;
    myAudioStreams: StreamRemote[];
    myVideoStreams: StreamRemote[];
    audioStreams: StreamRemote[];
    videoStreams: StreamRemote[];
    publishers: Map<string, ArcContainer<StreamPublisherWrap>>;
    consumers: Map<string, ArcContainer<StreamConsumer>>;
    consumerPairs: Map<string, ArcContainer<StreamConsumerPair>>;
}
interface ArcContainer<T> {
    data: T;
    owners: Map<number, number>;
}
interface SessionContextInfo {
    data?: SessionContainer;
    connect: (url: string, config: ISessionConfig) => void;
    disconnect: () => void;
    getPublisher(ownerId: number, cfg: SenderConfig): StreamPublisherWrap | undefined;
    backPublisher(ownerId: number, cfg: SenderConfig): void;
    getConsumer(ownerId: number, remote: StreamRemote): StreamConsumer | undefined;
    backConsumer(owner_id: number, remote: StreamRemote): void;
    getConsumerPair(ownerId: number, peerId: string, audioName: string, videoName: string): StreamConsumerPair | undefined;
    backConsumerPair(ownerId: number, peerId: string, audioName: string, videoName: string): void;
    update: (new_info: SessionContainer) => void;
}
export declare const SessionContext: React.Context<SessionContextInfo>;
interface Props {
    children: React.ReactNode;
    url?: string;
    config?: ISessionConfig;
}
export declare const SessionProvider: (props: Props) => React.JSX.Element;
export {};
//# sourceMappingURL=provider.d.ts.map