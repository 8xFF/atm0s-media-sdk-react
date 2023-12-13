import { useContext } from 'react';
import { SessionContext } from '../components/provider';
import { StreamKinds, StreamRemote } from '@8xff/atm0s-media-js';

export const useRemoteStreams = (kind: StreamKinds, isMine?: boolean): StreamRemote[] => {
  const { data } = useContext(SessionContext);
  if (kind == StreamKinds.AUDIO) {
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

export const usePeerRemoteStreams = (peerId: string, kind: StreamKinds): StreamRemote[] => {
  const { data } = useContext(SessionContext);
  if (kind == StreamKinds.AUDIO) {
    return data?.audioStreams.filter((a) => a.peerId === peerId) || [];
  } else {
    return data?.videoStreams.filter((a) => a.peerId === peerId) || [];
  }
};
