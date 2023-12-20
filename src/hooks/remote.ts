import { useContext, useEffect, useMemo, useState } from 'react';
import { StreamKinds, StreamRemote, type RemoteStreamQuality, type StreamRemoteState } from '@8xff/atm0s-media-js';
import { SessionContext } from '../components';
import { useReactionList } from './reaction';

export const useRemoteStreamState = (remote: StreamRemote): StreamRemoteState => {
  const [state, setState] = useState(remote.state);

  useEffect(() => {
    const handler = () => {
      setState(remote.state);
    };
    remote.on('state', handler);
    return () => {
      remote.off('state', handler);
    };
  }, [remote]);
  return state;
};

export const useRemoteStreamQuality = (remote: StreamRemote | undefined): RemoteStreamQuality | undefined => {
  const [quality, setQuality] = useState<RemoteStreamQuality | undefined>();

  useEffect(() => {
    if (remote) {
      const handler = (quality: RemoteStreamQuality | null) => {
        setQuality(quality || undefined);
      };
      remote.on('quality', handler);
      return () => {
        remote.off('quality', handler);
      };
    } else {
      return () => {};
    }
  }, [remote]);
  return quality;
};

export const useRemoteStreams = (kind: StreamKinds, mine?: boolean): StreamRemote[] => {
  const { data } = useContext(SessionContext);
  const source = mine === true ? data.myStreams : data.remoteStreams;
  const list = useReactionList(source);

  return useMemo(() => {
    return list.filter((s) => s.kind === kind);
  }, [list]);
};

export const useActiveRemoteStreams = (kind: StreamKinds, mine?: boolean): StreamRemote[] => {
  const [ver, setVer] = useState(0);
  const list = useRemoteStreams(kind, mine);

  useEffect(() => {
    const handler = () => {
      setVer(new Date().getTime());
    };
    list.map((item) => item.on('state', handler));
    return () => {
      list.map((item) => item.off('state', handler));
    };
  }, [list]);

  return useMemo(() => {
    return list.filter((s) => s.state.active);
  }, [list, ver]);
};

export const usePeerRemoteStreams = (peerId: string, kind?: StreamKinds): StreamRemote[] => {
  const { data } = useContext(SessionContext);
  const [list, setList] = useState<StreamRemote[]>([]);

  useEffect(() => {
    const setListWrap = kind
      ? (list: StreamRemote[]) => {
          setList(list.filter((s) => s.kind === kind));
        }
      : setList;
    setListWrap(data.peerStreams.get(peerId) || []);
    data.peerStreams.onSlotChanged(peerId, setListWrap);
    return () => {
      data.peerStreams.offSlotChanged(peerId, setListWrap);
    };
  }, [peerId, kind, setList]);
  return list;
};

export const usePeerRemoteStream = (peerId: string, name: string): StreamRemote | undefined => {
  const { data } = useContext(SessionContext);
  const [stream, setStream] = useState<StreamRemote | undefined>(undefined);

  useEffect(() => {
    const setListWrap = (list: StreamRemote[]) => {
      setStream(list.filter((s) => s.name === name)[0]);
    };
    setListWrap(data.peerStreams.get(peerId) || []);
    data.peerStreams.onSlotChanged(peerId, setListWrap);
    return () => {
      data.peerStreams.offSlotChanged(peerId, setListWrap);
    };
  }, [peerId, name, setStream]);
  return stream;
};

export const usePeerActiveRemoteStreams = (peerId: string, kind?: StreamKinds): StreamRemote[] => {
  const rawList = usePeerRemoteStreams(peerId, kind);
  const [list, setList] = useState<StreamRemote[]>(() => {
    return rawList.filter((s) => s.state.active);
  });

  useEffect(() => {
    const handler = () => {
      setList(rawList.filter((s) => s.state.active));
    };
    rawList.map((item) => item.on('state', handler));
    return () => {
      rawList.map((item) => item.off('state', handler));
    };
  }, [rawList]);
  return list;
};

export const usePeers = (): string[] => {
  const { data } = useContext(SessionContext);
  const list = useReactionList(data.peerStreams);
  return useMemo(() => {
    return list.filter((p) => p.length > 0).map((p) => p[0]!.peerId);
  }, [list]);
};
