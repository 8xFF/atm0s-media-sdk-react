import { useContext, useEffect, useState } from 'react';
import { StreamConsumer, StreamConsumerPair } from '@8xff/atm0s-media-js';
import { StreamPublisherWrap, SessionContext } from '../components';

export const useAudioLevelConsumer = (consumer?: StreamConsumer | StreamConsumerPair): number | undefined => {
  const [audioLevel, setAudioLevel] = useState<number | undefined>(undefined);
  useEffect(() => {
    if (consumer) {
      const handler = (level: number) => {
        setAudioLevel(level);
      };
      consumer.on('audio_level', handler);

      return () => {
        consumer.off('audio_level', handler);
      };
    } else {
      setAudioLevel(undefined);
    }
  }, [consumer]);
  return audioLevel;
};

export const useAudioLevelProducer = (producer?: StreamPublisherWrap): number | undefined => {
  const [audioLevel, setAudioLevel] = useState<number | undefined>(undefined);
  useEffect(() => {
    if (producer) {
      const handler = (level: number) => {
        setAudioLevel(level);
      };
      producer.on('audio_level', handler);

      return () => {
        producer.off('audio_level', handler);
      };
    } else {
      setAudioLevel(undefined);
    }
  }, [producer]);
  return audioLevel;
};

export interface AudioMixSlotInfo {
  peerId: string;
  streamName: string;
  audioLevel: number;
}

export const useAudioSlotMix = (slotIndex: number) => {
  const [slot, setSlot] = useState<AudioMixSlotInfo | undefined>(undefined);
  const { data } = useContext(SessionContext);
  useEffect(() => {
    const mixMinus = data?.session.getMixMinusAudio();
    if (mixMinus) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handler = (info: any | null) => {
        if (info) {
          const sourceId = info[0].split(':');
          setSlot({
            peerId: sourceId[0],
            streamName: sourceId[1],
            audioLevel: info[1],
          });
        } else {
          setSlot(undefined);
        }
      };
      mixMinus.on(`slot_${slotIndex}`, handler);

      return () => {
        mixMinus?.off(`slot_${slotIndex}`, handler);
      };
    }
  }, [slotIndex, data?.session.getMixMinusAudio()]);
  return slot;
};

export const useAudioLevelMix = (peerId: string, streamName: string) => {
  const [audioLevel, setAudioLevel] = useState<number | undefined>(undefined);
  const { data } = useContext(SessionContext);
  useEffect(() => {
    const mixMinus = data?.session.getMixMinusAudio();
    if (mixMinus) {
      const handler = (level: number | null) => {
        setAudioLevel(level || undefined);
      };
      mixMinus.on(`source_${peerId}:${streamName}`, handler);

      return () => {
        mixMinus?.off(`source_${peerId}:${streamName}`, handler);
      };
    }
  }, [peerId, streamName, data?.session.getMixMinusAudio()]);
  return audioLevel;
};
