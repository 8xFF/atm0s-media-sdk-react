import React, { useCallback, useMemo, useState } from 'react';
import {
  StreamPublisher,
  type AnyFunction,
  type IPublisherCallbacks,
  Session,
  StreamRemote,
  StreamConsumer,
  StreamConsumerPair,
  StreamKinds,
  createSession,
  type ISessionConfig,
  type SenderConfig,
} from '@8xff/atm0s-media-js';
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
  constructor(private publisher: StreamPublisher) {}

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
      const cachedKey = stream.cachedKey;
      if (cachedKey) {
        retainDevice(cachedKey);
      }
    }
    if (this.publisher.localStream) {
      const cacheKey = this.publisher.localStream.cachedKey;
      if (cacheKey) {
        releaseDevice(cacheKey);
      }
    }
    return this.publisher.switch(stream);
  }
}

interface SessionContainer {
  session: Session;
  state: SessionState;
  myAudioStreams: StreamRemote[];
  myVideoStreams: StreamRemote[];
  audioStreams: StreamRemote[];
  videoStreams: StreamRemote[];
  publishers: Map<string, ArcContainer<StreamPublisherWrap>>;
  consumers: Map<string, ArcContainer<StreamConsumer>>;
  consumerPairs: Map<string, ArcContainer<StreamConsumerPair>>;
}

interface ArcContainer<T> {
  data: T;
  owners: Map<number, number>;
}

interface SessionContextInfo {
  data?: SessionContainer;
  connect: (url: string, config: ISessionConfig) => void;
  disconnect: () => void;
  getPublisher(ownerId: number, cfg: SenderConfig): StreamPublisherWrap | undefined;
  backPublisher(ownerId: number, cfg: SenderConfig): void;
  getConsumer(ownerId: number, remote: StreamRemote): StreamConsumer | undefined;
  backConsumer(owner_id: number, remote: StreamRemote): void;
  getConsumerPair(
    ownerId: number,
    peerId: string,
    audioName: string,
    videoName: string,
  ): StreamConsumerPair | undefined;
  backConsumerPair(ownerId: number, peerId: string, audioName: string, videoName: string): void;
  update: (new_info: SessionContainer) => void;
}

export const SessionContext = React.createContext({} as SessionContextInfo);

interface Props {
  children: React.ReactNode;
  // log_level?: LogLevel;
  url?: string;
  config?: ISessionConfig;
}

let GlobalVer = 0;

export const SessionProvider = (props: Props) => {
  // if (props.log_level != undefined) {
  //   setLogLevel(props.log_level);
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
    (url: string, config: ISessionConfig) => {
      if (storage.data?.session) {
        return () => {
          storage.data?.session.disconnect();
        };
      }
      const session = createSession(url, config);
      const myAudioStreams = new Map<string, StreamRemote>();
      const myVideoStreams = new Map<string, StreamRemote>();
      const audioStreams = new Map<string, StreamRemote>();
      const videoStreams = new Map<string, StreamRemote>();

      const publishers: Map<string, ArcContainer<StreamPublisherWrap>> = new Map();
      const consumers: Map<string, ArcContainer<StreamConsumer>> = new Map();
      const consumerPairs: Map<string, ArcContainer<StreamConsumerPair>> = new Map();

      config?.senders?.map((sender) => {
        if (sender.stream) {
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

      session.on('mystream_added', (stream: StreamRemote) => {
        if (storage.data?.session != session) return;
        const key = stream.peerId + '-' + stream.name;
        if (stream.kind === StreamKinds.AUDIO) {
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

      session.on('mystream_updated', (stream: StreamRemote) => {
        if (storage.data?.session != session) return;
        const key = stream.peerId + '-' + stream.name;
        if (stream.kind === StreamKinds.AUDIO) {
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

      session.on('mystream_removed', (stream: StreamRemote) => {
        if (storage.data?.session != session) return;
        const key = stream.peerId + '-' + stream.name;
        if (stream.kind === StreamKinds.AUDIO) {
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

      session.on('stream_added', (stream: StreamRemote) => {
        if (storage.data?.session != session) return;
        const key = stream.peerId + '-' + stream.name;
        if (stream.kind === StreamKinds.AUDIO) {
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

      session.on('stream_updated', (stream: StreamRemote) => {
        if (storage.data?.session != session) return;
        const key = stream.peerId + '-' + stream.name;
        if (stream.kind === StreamKinds.AUDIO) {
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

      session.on('stream_removed', (stream: StreamRemote) => {
        if (storage.data?.session != session) return;
        const key = stream.peerId + '-' + stream.name;
        if (stream.kind === StreamKinds.AUDIO) {
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
    (ownerId: number, cfg: SenderConfig) => {
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
                label: cfg.label,
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
    (ownerId: number, cfg: SenderConfig) => {
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
    (ownerId: number, stream: StreamRemote) => {
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
    (ownerId: number, stream: StreamRemote) => {
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
        getPublisher,
        backPublisher,
        getConsumer,
        backConsumer,
        getConsumerPair,
        backConsumerPair,
        update,
      }}>
      {props.children}
    </SessionContext.Provider>
  );
};
