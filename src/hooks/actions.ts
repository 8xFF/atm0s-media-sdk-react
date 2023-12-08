import { useContext } from 'react';
import { SessionContext } from '../components/provider';
import type { ISessionConfig } from '@8xff/atm0s-media-js';

interface Actions {
  connect: (url: string, config: ISessionConfig) => void;
  disconnect: () => void;
  playAudioMix: () => void;
}

export const useActions = (): Actions => {
  const { data, connect, disconnect } = useContext(SessionContext);
  return {
    connect,
    disconnect,
    playAudioMix: () => {
      data?.session.getMixMinusAudio()?.play();
    },
  };
};
