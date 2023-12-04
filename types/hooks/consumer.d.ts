import { type LegacyRef } from 'react';
import Atm0s from '@8xff/atm0s-media-js';
export declare const useConsumer: (remote?: Atm0s.StreamRemote, priority?: number, maxSpatial?: number, maxTemporal?: number) => [LegacyRef<HTMLVideoElement> | undefined, Atm0s.StreamReceiverState, Atm0s.StreamConsumer | undefined];
export declare const useConsumerPair: (peerId: string, audioName: string, videoName: string, priority?: number, maxSpatial?: number, maxTemporal?: number) => [LegacyRef<HTMLVideoElement> | undefined, Atm0s.StreamReceiverState, Atm0s.StreamConsumerPair | undefined];
export declare const useLocalConsumer: (stream?: MediaStream) => (instance: HTMLVideoElement | null) => void;
//# sourceMappingURL=consumer.d.ts.map