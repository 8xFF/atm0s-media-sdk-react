# Atm0s React SDK

[![Continuous Integrations](https://github.com/8xff/media-sdk-react/actions/workflows/continuous-integrations.yaml/badge.svg?branch=main)](https://github.com/8xff/media-sdk-react/actions/workflows/continuous-integrations.yaml)
[![License](https://badgen.net/github/license/8xff/media-sdk-react)](./LICENSE)

React SDK for interacting with Atm0s Media Server (This SDK is still in Alpha)

## Installation

This library is published in the NPM registry and can be installed using any compatible package manager.
You will need to install along side with `@8xff/atm0s-media-js`.

```sh
npm install @8xff/atm0s-media-react@alpha @8xff/atm0s-media-js@alpha --save

# For Yarn, use the command below.
yarn add @8xff/atm0s-media-react@alpha @8xff/atm0s-media-js@alpha
```

## Usage

### Create a session

```js
import { SessionProvider, StreamKinds } from '@8xff/atm0s-media-react';

function App() {
  return (
    <SessionProvider
      gateways="https://SAMPLE_GATEWAY_URL"
      room="SAMPLE_ROOM_ID"
      peer="SAMPLE_PEER_ID"
      token="SAMPLE_TOKEN"
      // The senders and receivers prop is optional
      // You can optionally initialize the session with senders and receivers so we won't have to keep
      // updating SDP every time we create a new senders and receivers
      senders={[
        { kind: StreamKinds.AUDIO, name: 'audio_main' },
        { kind: StreamKinds.VIDEO, name: 'video_main', simulcast: true },
      ]}
      receivers={{
        audio: 1,
        video: 1,
      }}>
      <div>...Do streaming here...</div>
    </SessionProvider>
  );
}
```

### Publish a stream

```js
const EchoPair = ({ peer }: { peer: string }) => {
  const [stream, , streamChanger] = useSharedUserMedia("main_stream");
  const micPublisher = usePublisher({
    kind: StreamKinds.AUDIO,
    name: "audio_main", // this will be used to identify the sender which the publisher will be using
  });
  const cameraPublisher = usePublisher({
    kind: StreamKinds.VIDEO,
    name: "video_main",
  });

  useEffect(() => {
    if (stream) {
      // add the stream to the publisher
      micPublisher.switchStream(stream);
      cameraPublisher.switchStream(stream);

      return () => {
        micPublisher.switchStream(null);
        cameraPublisher.switchStream(null);
      };
    }
  }, [stream, micPublisher, cameraPublisher]);
};
```

### Consume stream from a peer

```js
const EchoConsumer = ({ peer }: { peer: string }) => {
  const consumer = useConsumerPair(peer, "audio_main", "video_main");

  return (
    <div>
      <VideoViewer stream={consumer} />
    </div>
  );
};
```

### Put it all together

```js
function App() {
  const peer = 'SAMPLE_PEER_ID';
  return (
    <SessionProvider
      gateways="https://SAMPLE_GATEWAY_URL"
      room="SAMPLE_ROOM_ID"
      peer={peer}
      token="SAMPLE_TOKEN"
      // The senders and receivers prop is optional
      // You can optionally initialize the session with senders and receivers so we won't have to keep
      // updating SDP every time we create a new senders and receivers
      senders={[
        { kind: StreamKinds.AUDIO, name: 'audio_main' },
        { kind: StreamKinds.VIDEO, name: 'video_main', simulcast: true },
      ]}
      receivers={{
        audio: 1,
        video: 1,
      }}>
      <EchoPair peer={peer} />
      <EchoConsumer peer={peer} />
    </SessionProvider>
  );
}
```

### Documentation

For more details, go to [Documentation](https://8xff.github.io/media-docs/docs/intro) 

## License

Released under [MIT License](./LICENSE).
