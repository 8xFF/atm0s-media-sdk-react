import { useContext } from 'react';
import { SessionContext } from '../components/provider';
import Atm0s from '@8xff/atm0s-media-js';

export const useRemoteStreams = (kind: Atm0s.StreamKinds, isMine?: boolean): Atm0s.StreamRemote[] => {
  const { data } = useContext(SessionContext);
  if (kind == Atm0s.StreamKinds.AUDIO) {
    if (isMine === true) {
      return data?.myAudioStreams || [];
    } else {
      return data?.audioStreams || [];
    }
  } else {
    if (isMine === true) {
      return data?.myVideoStreams || [];
    } else {
      return data?.videoStreams || [];
    }
  }
};

export const usePeerRemoteStreams = (peerId: string, kind: Atm0s.StreamKinds): Atm0s.StreamRemote[] => {
  const { data } = useContext(SessionContext);
  if (kind == Atm0s.StreamKinds.AUDIO) {
    return data?.audioStreams.filter((a) => a.peerId === peerId) || [];
  } else {
    return data?.videoStreams.filter((a) => a.peerId === peerId) || [];
  }
};
