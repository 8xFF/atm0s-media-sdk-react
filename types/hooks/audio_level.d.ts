import * as Bluesea from '@8xff/atm0s-media-js';
import { StreamPublisherWrap } from '../components';
export declare const useAudioLevelConsumer: (consumer?: Bluesea.StreamConsumer | Bluesea.StreamConsumerPair) => number | undefined;
export declare const useAudioLevelProducer: (producer?: StreamPublisherWrap) => number | undefined;
export interface AudioMixSlotInfo {
    peerId: string;
    streamName: string;
    audioLevel: number;
}
export declare const useAudioSlotMix: (slotIndex: number) => AudioMixSlotInfo | undefined;
export declare const useAudioLevelMix: (peerId: string, streamName: string) => number | undefined;
//# sourceMappingURL=audio_level.d.ts.map