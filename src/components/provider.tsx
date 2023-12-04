import React, { useCallback, useMemo, useState } from 'react';
import Atm0s, { type AnyFunction, type IPublisherCallbacks } from '@8xff/atm0s-media-js';
import { releaseDevice, retainDevice } from '../hooks/device';

export enum SessionState {
  New = 'new',
  Connecting = 'connecting',
  Connected = 'connected',
  Reconnecting = 'reconnecting',
  Disconnected = 'disconnected',
  Error = 'error',
}

export class StreamPublisherWrap {
  constructor(private publisher: Atm0s.StreamPublisher) {}

  get state() {
    return this.publisher.state;
  }

  get localStream() {
    return this.publisher.localStream;
  }

  on(type: keyof IPublisherCallbacks, callback: AnyFunction) {
    this.publisher.on(type, callback);
  }

  off(type: keyof IPublisherCallbacks, callback: AnyFunction) {
    this.publisher.on(type, callback);
  }

  switchStream(stream: MediaStream | null) {
    if (stream) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cachedKey = stream.cachedKey;
      if (cachedKey) {
        retainDevice(cachedKey);
      }
    }
    if (this.publisher.localStream) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cacheKey = this.publisher.localStream.cachedKey;
      if (cacheKey) {
        releaseDevice(cacheKey);
      }
    }
    return this.publisher.switch(stream);
  }
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
  getConsumerPair(
    ownerId: number,
    peerId: string,
    audioName: string,
    videoName: string,
  ): Atm0s.StreamConsumerPair | undefined;
  backConsumerPair(ownerId: number, peerId: string, audioName: string, videoName: string): void;
  update: (new_info: SessionContainer) => void;
}

export const SessionContext = React.createContext({} as SessionContextInfo);

interface Props {
  children: React.ReactNode;
  // log_level?: Atm0s.LogLevel;
  url?: string;
  config?: Atm0s.ISessionConfig;
}

let GlobalVer = 0;

export const SessionProvider = (props: Props) => {
  // if (props.log_level != undefined) {
  //   Atm0s.setLogLevel(props.log_level);
  // }
  const [, setVer] = useState(0);
  const storage = useMemo<{ data: SessionContainer | undefined }>(() => {
    return { data: undefined };
  }, []);
  const update = useCallback(
    (data: SessionContainer | undefined) => {
      storage.data = data;
      setVer(GlobalVer++);
    },
    [storage, setVer],
  );
  const connect = useCallback(
    (url: string, config: Atm0s.ISessionConfig) => {
      if (storage.data?.session) {
        return () => {
          storage.data?.session.disconnect();
        };
      }
      const session = Atm0s.createSession(url, config);
      const myAudioStreams = new Map<string, Atm0s.StreamRemote>();
      const myVideoStreams = new Map<string, Atm0s.StreamRemote>();
      const audioStreams = new Map<string, Atm0s.StreamRemote>();
      const videoStreams = new Map<string, Atm0s.StreamRemote>();

      const publishers: Map<string, ArcContainer<StreamPublisherWrap>> = new Map();
      const consumers: Map<string, ArcContainer<Atm0s.StreamConsumer>> = new Map();
      const consumerPairs: Map<string, ArcContainer<Atm0s.StreamConsumerPair>> = new Map();

      config?.senders?.map((sender) => {
        if (sender.stream) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const cachedKey = sender.stream.cachedKey;
          if (cachedKey) {
            retainDevice(cachedKey);
          }
        }
      });

      session.on('connected', () => {
        if (storage.data?.session != session) return;
        update({
          session,
          state: SessionState.Connected,
          myAudioStreams: Array.from(myAudioStreams.values()),
          myVideoStreams: Array.from(myVideoStreams.values()),
          audioStreams: Array.from(audioStreams.values()),
          videoStreams: Array.from(videoStreams.values()),
          publishers,
          consumers,
          consumerPairs,
        });
      });

      session.on('mystream_added', (stream: Atm0s.StreamRemote) => {
        if (storage.data?.session != session) return;
        const key = stream.peerId + '-' + stream.name;
        if (stream.kind === Atm0s.StreamKinds.AUDIO) {
          myAudioStreams.set(key, stream);
        } else {
          myVideoStreams.set(key, stream);
        }
        update({
          session,
          state: SessionState.Connected,
          myAudioStreams: Array.from(myAudioStreams.values()),
          myVideoStreams: Array.from(myVideoStreams.values()),
          audioStreams: Array.from(audioStreams.values()),
          videoStreams: Array.from(videoStreams.values()),
          publishers,
          consumers,
          consumerPairs,
        });
      });

      session.on('mystream_updated', (stream: Atm0s.StreamRemote) => {
        if (storage.data?.session != session) return;
        const key = stream.peerId + '-' + stream.name;
        if (stream.kind === Atm0s.StreamKinds.AUDIO) {
          myAudioStreams.set(key, stream);
        } else {
          myVideoStreams.set(key, stream);
        }
        update({
          session,
          state: SessionState.Connected,
          myAudioStreams: Array.from(myAudioStreams.values()),
          myVideoStreams: Array.from(myVideoStreams.values()),
          audioStreams: Array.from(audioStreams.values()),
          videoStreams: Array.from(videoStreams.values()),
          publishers,
          consumers,
          consumerPairs,
        });
      });

      session.on('mystream_removed', (stream: Atm0s.StreamRemote) => {
        if (storage.data?.session != session) return;
        const key = stream.peerId + '-' + stream.name;
        if (stream.kind === Atm0s.StreamKinds.AUDIO) {
          myAudioStreams.delete(key);
        } else {
          myVideoStreams.delete(key);
        }
        update({
          session,
          state: SessionState.Connected,
          myAudioStreams: Array.from(myAudioStreams.values()),
          myVideoStreams: Array.from(myVideoStreams.values()),
          audioStreams: Array.from(audioStreams.values()),
          videoStreams: Array.from(videoStreams.values()),
          publishers,
          consumers,
          consumerPairs,
        });
      });

      session.on('stream_added', (stream: Atm0s.StreamRemote) => {
        if (storage.data?.session != session) return;
        const key = stream.peerId + '-' + stream.name;
        if (stream.kind === Atm0s.StreamKinds.AUDIO) {
          audioStreams.set(key, stream);
        } else {
          videoStreams.set(key, stream);
        }
        update({
          session,
          state: SessionState.Connected,
          myAudioStreams: Array.from(myAudioStreams.values()),
          myVideoStreams: Array.from(myVideoStreams.values()),
          audioStreams: Array.from(audioStreams.values()),
          videoStreams: Array.from(videoStreams.values()),
          publishers,
          consumers,
          consumerPairs: consumerPairs,
        });
      });

      session.on('stream_updated', (stream: Atm0s.StreamRemote) => {
        if (storage.data?.session != session) return;
        const key = stream.peerId + '-' + stream.name;
        if (stream.kind === Atm0s.StreamKinds.AUDIO) {
          audioStreams.set(key, stream);
        } else {
          videoStreams.set(key, stream);
        }
        update({
          session,
          state: SessionState.Connected,
          myAudioStreams: Array.from(myAudioStreams.values()),
          myVideoStreams: Array.from(myVideoStreams.values()),
          audioStreams: Array.from(audioStreams.values()),
          videoStreams: Array.from(videoStreams.values()),
          publishers,
          consumers,
          consumerPairs,
        });
      });

      session.on('stream_removed', (stream: Atm0s.StreamRemote) => {
        if (storage.data?.session != session) return;
        const key = stream.peerId + '-' + stream.name;
        if (stream.kind === Atm0s.StreamKinds.AUDIO) {
          audioStreams.delete(key);
        } else {
          videoStreams.delete(key);
        }
        update({
          session,
          state: SessionState.Connected,
          myAudioStreams: Array.from(myAudioStreams.values()),
          myVideoStreams: Array.from(myVideoStreams.values()),
          audioStreams: Array.from(audioStreams.values()),
          videoStreams: Array.from(videoStreams.values()),
          publishers,
          consumers,
          consumerPairs,
        });
      });

      session.on('disconnected', () => {
        if (storage.data?.session != session) return;
        update({
          session,
          state: SessionState.Disconnected,
          myAudioStreams: Array.from(myAudioStreams.values()),
          myVideoStreams: Array.from(myVideoStreams.values()),
          audioStreams: Array.from(audioStreams.values()),
          videoStreams: Array.from(videoStreams.values()),
          publishers,
          consumers,
          consumerPairs,
        });
      });
      session.connect().catch((err) => {
        if (storage.data?.session != session) return;
        console.error(err);
        update({
          session,
          state: SessionState.Error,
          myAudioStreams: Array.from(myAudioStreams.values()),
          myVideoStreams: Array.from(myVideoStreams.values()),
          audioStreams: Array.from(audioStreams.values()),
          videoStreams: Array.from(videoStreams.values()),
          publishers,
          consumers,
          consumerPairs,
        });
      });
      update({
        session,
        state: SessionState.Connecting,
        myAudioStreams: [],
        myVideoStreams: [],
        audioStreams: [],
        videoStreams: [],
        publishers,
        consumers,
        consumerPairs,
      });
      return;
    },
    [storage, update],
  );

  const disconnect = useCallback(() => {
    if (storage.data?.session) {
      storage.data.session.disconnect();
      update(undefined);
    }
  }, [storage, update]);

  const getPublisher = useCallback(
    (ownerId: number, cfg: Atm0s.SenderConfig) => {
      const data = storage.data;
      if (data?.session) {
        let publisher = data.publishers.get(cfg.name);
        if (!publisher) {
          publisher = {
            data: new StreamPublisherWrap(
              data.session.createPublisher({
                stream: cfg.stream,
                name: cfg.name,
                kind: cfg.kind,
                preferredCodecs: cfg.preferredCodecs,
                simulcast: cfg.simulcast,
                maxBitrate: cfg.maxBitrate,
                contentHint: cfg.contentHint,
                screen: cfg.screen,
              }),
            ),
            owners: new Map(),
          };
          data.publishers.set(cfg.name, publisher);
        }
        data.publishers.get(cfg.name)?.owners.set(ownerId, new Date().getTime());
        return publisher.data;
      }
      return undefined;
    },
    [storage],
  );

  const backPublisher = useCallback(
    (ownerId: number, cfg: Atm0s.SenderConfig) => {
      const data = storage.data;
      if (data?.session) {
        const publisher = data.publishers.get(cfg.name);
        if (publisher) {
          publisher.owners.delete(ownerId);
          if (publisher.owners.size == 0) {
            publisher.data.switchStream(null);
            data.publishers.delete(cfg.name);
          }
        }
      }
      return undefined;
    },
    [storage],
  );

  const getConsumer = useCallback(
    (ownerId: number, stream: Atm0s.StreamRemote) => {
      const data = storage.data;
      if (data?.session) {
        const key = stream.peerId + '-' + stream.name;
        let consumer = data.consumers.get(key);
        if (!consumer) {
          consumer = {
            data: data.session.createConsumer(stream),
            owners: new Map(),
          };
          data.consumers.set(key, consumer);
        }
        data.consumers.get(key)?.owners.set(ownerId, new Date().getTime());
        return consumer.data;
      }
      return undefined;
    },
    [storage],
  );

  const backConsumer = useCallback(
    (ownerId: number, stream: Atm0s.StreamRemote) => {
      const data = storage.data;
      if (data?.session) {
        const key = stream.peerId + '-' + stream.name;
        const consumer = data.consumers.get(key);
        if (consumer) {
          consumer.owners.delete(ownerId);
          if (consumer.owners.size == 0) {
            data.consumers.delete(key);
          }
        }
      }
      return undefined;
    },
    [storage],
  );

  const getConsumerPair = useCallback(
    (ownerId: number, peerId: string, audioName: string, videoName: string) => {
      const data = storage.data;
      if (data?.session) {
        const key = peerId + '-' + audioName + '-' + videoName;
        let consumer = data.consumerPairs.get(key);
        if (!consumer) {
          consumer = {
            data: data.session.createConsumerPair(peerId, audioName, videoName),
            owners: new Map(),
          };
          data.consumerPairs.set(key, consumer);
        }
        data.consumerPairs.get(key)?.owners.set(ownerId, new Date().getTime());
        return consumer.data;
      }
      return undefined;
    },
    [storage],
  );

  const backConsumerPair = useCallback(
    (ownerId: number, peerId: string, audioName: string, videoName: string) => {
      const data = storage.data;
      if (data?.session) {
        const key = peerId + '-' + audioName + '-' + videoName;
        const consumer = data.consumerPairs.get(key);
        if (consumer) {
          consumer.owners.delete(ownerId);
          if (consumer.owners.size == 0) {
            data.consumerPairs.delete(key);
          }
        }
      }
      return undefined;
    },
    [storage],
  );

  React.useEffect(() => {
    if (props.url && props.config) {
      connect(props.url, props.config);
      return () => {
        disconnect();
      };
    }
  }, [props.url, props.config, connect, disconnect]);

  return (
    <SessionContext.Provider
      value={{
        data: storage.data,
        connect,
        disconnect,
        getPublisher: getPublisher,
        backPublisher: backPublisher,
        getConsumer: getConsumer,
        backConsumer: backConsumer,
        getConsumerPair: getConsumerPair,
        backConsumerPair: backConsumerPair,
        update,
      }}>
      {props.children}
    </SessionContext.Provider>
  );
};
