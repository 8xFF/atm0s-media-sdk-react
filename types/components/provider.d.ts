import React from 'react';
import Atm0s, { type AnyFunction, type IPublisherCallbacks } from '@8xff/atm0s-media-js';
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
    constructor(publisher: Atm0s.StreamPublisher);
    get state(): Atm0s.StreamSenderState;
    get localStream(): MediaStream | null | undefined;
    on(type: keyof IPublisherCallbacks, callback: AnyFunction): void;
    off(type: keyof IPublisherCallbacks, callback: AnyFunction): void;
    switchStream(stream: MediaStream | null): void;
}
interface SessionContainer {
    session: Atm0s.Session;
    state: SessionState;
    myAudioStreams: Atm0s.StreamRemote[];
    myVideoStreams: Atm0s.StreamRemote[];
    audioStreams: Atm0s.StreamRemote[];
    videoStreams: Atm0s.StreamRemote[];
    publishers: Map<string, ArcContainer<StreamPublisherWrap>>;
    consumers: Map<string, ArcContainer<Atm0s.StreamConsumer>>;
    consumerPairs: Map<string, ArcContainer<Atm0s.StreamConsumerPair>>;
}
interface ArcContainer<T> {
    data: T;
    owners: Map<number, number>;
}
interface SessionContextInfo {
    data?: SessionContainer;
    connect: (url: string, config: Atm0s.ISessionConfig) => void;
    disconnect: () => void;
    getPublisher(ownerId: number, cfg: Atm0s.SenderConfig): StreamPublisherWrap | undefined;
    backPublisher(ownerId: number, cfg: Atm0s.SenderConfig): void;
    getConsumer(ownerId: number, remote: Atm0s.StreamRemote): Atm0s.StreamConsumer | undefined;
    backConsumer(owner_id: number, remote: Atm0s.StreamRemote): void;
    getConsumerPair(ownerId: number, peerId: string, audioName: string, videoName: string): Atm0s.StreamConsumerPair | undefined;
    backConsumerPair(ownerId: number, peerId: string, audioName: string, videoName: string): void;
    update: (new_info: SessionContainer) => void;
}
export declare const SessionContext: React.Context<SessionContextInfo>;
interface Props {
    children: React.ReactNode;
    url?: string;
    config?: Atm0s.ISessionConfig;
}
export declare const SessionProvider: (props: Props) => React.JSX.Element;
export {};
//# sourceMappingURL=provider.d.ts.map