import React, { useCallback, useEffect, useMemo } from 'react';
import {
  StreamPublisher,
  type AnyFunction,
  type IPublisherCallbacks,
  Session,
  StreamRemote,
  StreamConsumer,
  StreamConsumerPair,
  createSession,
  type SenderConfig,
  LogLevel,
  setLogLevel,
  type RoomStats,
  MixMinusMode,
  Codecs,
  BitrateControlMode,
  LatencyMode,
} from '@8xff/atm0s-media-js';
import { DataContainer, MapContainer } from '../hooks/reaction';
import { MediaStreamArc } from '../hooks/shared_device';
import type { MediaStream2 } from '../platform';

export enum SessionState {
  New = 'new',
  Connecting = 'connecting',
  Connected = 'connected',
  Reconnecting = 'reconnecting',
  Disconnected = 'disconnected',
  Error = 'error',
}

export class StreamPublisherWrap {
  stream: MediaStreamArc | MediaStream2 | null = null;

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
  switchStream(stream: MediaStreamArc | MediaStream2 | undefined | null, label?: string) {
    if (!!stream && stream instanceof MediaStreamArc) {
      stream.retain();
    }
    if (!!this.stream && this.stream instanceof MediaStreamArc) {
      this.stream.release();
    }
    this.stream = stream || null;
    return this.publisher.switchStream(
      (!!stream && stream instanceof MediaStreamArc ? stream?.stream : stream) || null,
      label,
    );
  }
}

interface SessionContainer {
  session: Session;
  state: DataContainer<SessionState>;
  roomStats: DataContainer<RoomStats>;
  myStreams: MapContainer<string, StreamRemote>;
  remoteStreams: MapContainer<string, StreamRemote>;
  peerStreams: MapContainer<string, StreamRemote[]>;
  publishers: MapContainer<string, ArcContainer<StreamPublisherWrap>>;
  consumers: MapContainer<string, ArcContainer<StreamConsumer>>;
  consumerPairs: MapContainer<string, ArcContainer<StreamConsumerPair>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sharedData: MapContainer<string, any>;
  connect: (onError?: (err: unknown) => void) => Promise<void>;
  restartIce: () => Promise<void>;
  disconnect: () => void;
  destroy: () => void;
}

interface ArcContainer<T> {
  data: T;
  owners: Map<number, number>;
}

interface SessionContextInfo {
  data: SessionContainer;
  getPublisher(ownerId: number, cfg: SenderConfig): StreamPublisherWrap;
  backPublisher(ownerId: number, cfg: SenderConfig): void;
  getConsumer(ownerId: number, remote: StreamRemote): StreamConsumer;
  backConsumer(ownerId: number, remote: StreamRemote): void;
  getConsumerPair(ownerId: number, peerId: string, audioName: string, videoName: string): StreamConsumerPair;
  backConsumerPair(ownerId: number, peerId: string, audioName: string, videoName: string): void;
}

export const SessionContext = React.createContext({} as SessionContextInfo);

const StreamKey = (stream: StreamRemote) => {
  return stream.peerId + '-' + stream.name;
};
interface Props {
  children: React.ReactNode;
  logLevel?: LogLevel;
  autoConnect?: boolean;
  onConnectError?: (err: unknown) => void;
  gateways: string | string[];
  room: string;
  peer: string;
  token: string;
  mixMinusAudio?: {
    elements?: [HTMLAudioElement, HTMLAudioElement, HTMLAudioElement];
    mode: MixMinusMode;
  };
  latencyMode?: LatencyMode;
  iceServers?: [
    {
      urls: string;
      username?: string;
      credential?: string;
    },
  ];
  codecs?: Codecs[];
  senders?: SenderConfig[];
  receivers?: {
    audio?: number;
    video?: number;
  };
  bitrateControlMode?: BitrateControlMode;
}

export const SessionProvider = (props: Props) => {
  if (props.logLevel) {
    setLogLevel(props.logLevel);
  }
  const sessionContainer = useMemo<SessionContainer>(() => {
    // logger.info("creating  session", props);
    const session = createSession(props.gateways, {
      roomId: props.room,
      peerId: props.peer,
      token: props.token,
      senders: props.senders || [],
      receivers: props.receivers || { audio: 1, video: 1 },
      mixMinusAudio: props.mixMinusAudio,
      latencyMode: props.latencyMode,
      iceServers: props.iceServers,
      bitrateControlMode: props.bitrateControlMode,
      codecs: props.codecs,
    });
    const state = new DataContainer<SessionState>(SessionState.New);
    const roomStats = new DataContainer<RoomStats>({ peers: 0 });
    const myStreams = new MapContainer<string, StreamRemote>();
    const remoteStreams = new MapContainer<string, StreamRemote>();
    const peerStreams = new MapContainer<string, StreamRemote[]>();
    const publishers = new MapContainer<string, ArcContainer<StreamPublisherWrap>>();
    const consumers = new MapContainer<string, ArcContainer<StreamConsumer>>();
    const consumerPairs = new MapContainer<string, ArcContainer<StreamConsumerPair>>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sharedData = new MapContainer<string, any>();

    const onConnected = () => {
      state.change(SessionState.Connected);
    };

    const onReconnecting = () => {
      state.change(SessionState.Reconnecting);
    };

    const onReconnected = () => {
      state.change(SessionState.Connected);
    };

    const onRoomStats = (_roomStats: RoomStats) => {
      roomStats.change(_roomStats);
    };

    const onMyStreamAdded = (stream: StreamRemote) => {
      myStreams.set(StreamKey(stream), stream);
      const list = (peerStreams.get(stream.peerId) || []).filter((s) => s.name !== stream.name);
      peerStreams.set(stream.peerId, list.concat(stream));
    };

    const onMyStreamRemoved = (stream: StreamRemote) => {
      myStreams.del(StreamKey(stream));
      const list = (peerStreams.get(stream.peerId) || []).filter((s) => s.name !== stream.name);
      peerStreams.set(stream.peerId, list);
    };

    const onStreamAdded = (stream: StreamRemote) => {
      remoteStreams.set(StreamKey(stream), stream);
      const list = (peerStreams.get(stream.peerId) || []).filter((s) => s.name !== stream.name);
      peerStreams.set(stream.peerId, list.concat(stream));
    };

    const onStreamRemoved = (stream: StreamRemote) => {
      remoteStreams.del(StreamKey(stream));
      const list = (peerStreams.get(stream.peerId) || []).filter((s) => s.name !== stream.name);
      peerStreams.set(stream.peerId, list);
    };

    const onDisconnected = () => {
      state.change(SessionState.Disconnected);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const connect = async (onError?: (err: any) => void) => {
      session.connect().catch((err) => {
        state.change(SessionState.Error);
        if (onError) {
          onError(err);
        }
      });

      state.change(SessionState.Connecting);
    };

    const restartIce = () => {
      return session.restartIce();
    };

    const disconnect = () => {
      switch (state.value) {
        case SessionState.Connecting:
        case SessionState.Connected:
          session.disconnect();
          break;
      }
    };

    const destroy = () => {
      session.off('connected', onConnected);
      session.off('reconnecting', onReconnecting);
      session.off('reconnected', onReconnected);
      session.off('room_stats', onRoomStats);
      session.off('mystream_added', onMyStreamAdded);
      session.off('mystream_removed', onMyStreamRemoved);
      session.off('stream_added', onStreamAdded);
      session.off('stream_removed', onStreamRemoved);
      session.off('disconnected', onDisconnected);
      sessionContainer.state.change(SessionState.Disconnected);
    };
    session.on('connected', onConnected);
    session.on('reconnecting', onReconnecting);
    session.on('reconnected', onReconnected);
    session.on('room_stats', onRoomStats);
    session.on('mystream_added', onMyStreamAdded);
    session.on('mystream_removed', onMyStreamRemoved);
    session.on('stream_added', onStreamAdded);
    session.on('stream_removed', onStreamRemoved);
    session.on('disconnected', onDisconnected);

    if (typeof props.autoConnect === 'undefined' || props.autoConnect === true) {
      connect(props.onConnectError);
    }

    return {
      session,
      state,
      roomStats,
      myStreams,
      remoteStreams,
      peerStreams,
      publishers,
      consumers,
      consumerPairs,
      sharedData,
      connect,
      restartIce,
      disconnect,
      destroy,
    };
  }, [props.gateways, props.room, props.peer]);

  useEffect(() => {
    return sessionContainer.destroy;
  }, [sessionContainer]);

  const getPublisher = useCallback(
    (ownerId: number, cfg: SenderConfig) => {
      let publisher = sessionContainer.publishers.get(cfg.name);
      if (!publisher) {
        publisher = {
          data: new StreamPublisherWrap(
            sessionContainer.session.createPublisher({
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
        sessionContainer.publishers.set(cfg.name, publisher);
      }
      publisher.owners.set(ownerId, new Date().getTime());
      return publisher.data;
    },
    [sessionContainer],
  );

  const backPublisher = useCallback(
    (ownerId: number, cfg: SenderConfig) => {
      const publisher = sessionContainer.publishers.get(cfg.name);
      if (publisher) {
        publisher.owners.delete(ownerId);
        if (publisher.owners.size === 0) {
          publisher.data.switchStream(null);
          sessionContainer.publishers.del(cfg.name);
        }
      }
    },
    [sessionContainer],
  );

  const getConsumer = useCallback(
    (ownerId: number, stream: StreamRemote) => {
      const key = StreamKey(stream);
      let consumer = sessionContainer.consumers.get(key);
      if (!consumer) {
        consumer = {
          data: sessionContainer.session.createConsumer(stream),
          owners: new Map(),
        };
        sessionContainer.consumers.set(key, consumer);
      }
      consumer.owners.set(ownerId, new Date().getTime());
      return consumer.data;
    },
    [sessionContainer],
  );

  const backConsumer = useCallback(
    (ownerId: number, stream: StreamRemote) => {
      const key = StreamKey(stream);
      const consumer = sessionContainer.consumers.get(key);
      if (consumer) {
        consumer.owners.delete(ownerId);
        if (consumer.owners.size === 0) {
          sessionContainer.consumers.del(key);
        }
      }
    },
    [sessionContainer],
  );

  const getConsumerPair = useCallback(
    (ownerId: number, peerId: string, audioName: string, videoName: string) => {
      const key = peerId + '-' + audioName + '-' + videoName;
      let consumer = sessionContainer.consumerPairs.get(key);
      if (!consumer) {
        consumer = {
          data: sessionContainer.session.createConsumerPair(peerId, audioName, videoName),
          owners: new Map(),
        };
        sessionContainer.consumerPairs.set(key, consumer);
      }
      consumer.owners.set(ownerId, new Date().getTime());
      return consumer.data;
    },
    [sessionContainer],
  );

  const backConsumerPair = useCallback(
    (ownerId: number, peerId: string, audioName: string, videoName: string) => {
      const key = peerId + '-' + audioName + '-' + videoName;
      const consumer = sessionContainer.consumerPairs.get(key);
      if (consumer) {
        consumer.owners.delete(ownerId);
        if (consumer.owners.size === 0) {
          sessionContainer.consumerPairs.del(key);
        }
      }
    },
    [sessionContainer],
  );

  return (
    <SessionContext.Provider
      value={{
        data: sessionContainer,
        getPublisher,
        backPublisher,
        getConsumer,
        backConsumer,
        getConsumerPair,
        backConsumerPair,
      }}>
      {props.children}
    </SessionContext.Provider>
  );
};
