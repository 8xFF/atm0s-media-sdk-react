import { useContext } from 'react';
import { SessionContext } from '../components/provider';

interface Actions {
  connect: () => Promise<void>;
  restartIce: () => Promise<void>;
  disconnect: () => void;
  playAudioMix: () => void;
}

export const useActions = (): Actions => {
  const { data } = useContext(SessionContext);
  return {
    playAudioMix: () => {
      data.session.getMixMinusAudio()?.play();
    },
    connect: data.connect,
    restartIce: data.restartIce,
    disconnect: data.disconnect,
  };
};
