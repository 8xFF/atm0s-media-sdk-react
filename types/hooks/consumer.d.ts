import { type LegacyRef } from 'react';
import { StreamRemote, StreamReceiverState, StreamConsumer, StreamConsumerPair } from '@8xff/atm0s-media-js';
export declare const useConsumer: (remote?: StreamRemote, priority?: number, maxSpatial?: number, maxTemporal?: number) => [LegacyRef<HTMLVideoElement> | undefined, StreamReceiverState, StreamConsumer | undefined];
export declare const useConsumerPair: (peerId: string, audioName: string, videoName: string, priority?: number, maxSpatial?: number, maxTemporal?: number) => [LegacyRef<HTMLVideoElement> | undefined, StreamReceiverState, StreamConsumerPair | undefined];
export declare const useLocalConsumer: (stream?: MediaStream) => (instance: HTMLVideoElement | null) => void;
//# sourceMappingURL=consumer.d.ts.map