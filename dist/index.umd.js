/*!
 * @8xff/atm0s-media-react v0.0.0
 * (c) Luong Ngoc Minh
 * Released under the MIT License.
 */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('react'), require('@8xff/atm0s-media-js'), require('@8xff/atm0s-media-js/types/lib/utils/typed-event-emitter'), require('@8xff/atm0s-media-js/types/lib/utils/logger')) :
    typeof define === 'function' && define.amd ? define(['exports', 'react', '@8xff/atm0s-media-js', '@8xff/atm0s-media-js/types/lib/utils/typed-event-emitter', '@8xff/atm0s-media-js/types/lib/utils/logger'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.Atm0s = {}, global.React, global.Atm0s, global.typedEventEmitter, global.logger$1));
})(this, (function (exports, React, Atm0s, typedEventEmitter, logger$1) { 'use strict';

    /******************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise, SuppressedError, Symbol */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
        var e = new Error(message);
        return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
    };

    var logger = logger$1.getLogger('DeviceHook');
    var StreamContainer = /** @class */ (function (_super) {
        __extends(StreamContainer, _super);
        function StreamContainer(key) {
            var _this = _super.call(this) || this;
            _this.key = key;
            _this.count = 0;
            _this.data = {};
            logger.log('Created container for local stream', key);
            return _this;
        }
        StreamContainer.prototype.setData = function (data) {
            this.data = data;
            this.emit('changed', data);
        };
        StreamContainer.prototype.retain = function () {
            this.count += 1;
            logger.log('Retain local stream', this.key, this.count);
            return this.count;
        };
        StreamContainer.prototype.release = function () {
            var _a;
            this.count -= 1;
            logger.log('Release local stream', this.key, this.count);
            if (this.count == 0) {
                logger.log('Destroy local stream', this.key);
                (_a = this.data.media) === null || _a === void 0 ? void 0 : _a.getTracks().map(function (track) {
                    track.stop();
                });
            }
            return this.count;
        };
        return StreamContainer;
    }(typedEventEmitter.TypedEventEmitter));
    var globalStore = new Map();
    var useDevices = function (kind) {
        var _a = React.useState([]), devices = _a[0], setDevices = _a[1];
        var _b = React.useState(null), error = _b[0], setError = _b[1];
        React.useEffect(function () {
            navigator.mediaDevices
                .enumerateDevices()
                .then(function (devices) {
                setDevices(devices.filter(function (d) { return d.kind == kind; }));
            })
                .catch(function (error) {
                setDevices([]);
                setError(error);
            });
        }, [kind]);
        return [devices, error];
    };
    function getDevicePrivate(kind, deviceId, callback) {
        var key = kind + '-' + deviceId;
        var containerSlot = globalStore.get(key);
        if (containerSlot) {
            containerSlot.on('changed', callback);
            callback(containerSlot.data);
        }
        else {
            containerSlot = new StreamContainer(key);
            globalStore.set(key, containerSlot);
            var constraints = {};
            if (kind == 'audioinput') {
                constraints = {
                    audio: typeof deviceId == 'string'
                        ? {
                            deviceId: deviceId,
                        }
                        : true,
                };
            }
            else if (kind == 'videoinput') {
                constraints = {
                    video: typeof deviceId == 'string'
                        ? {
                            deviceId: deviceId,
                        }
                        : true,
                };
            }
            navigator.mediaDevices
                .getUserMedia(constraints)
                .then(function (stream) {
                stream.cachedKey = key;
                containerSlot === null || containerSlot === void 0 ? void 0 : containerSlot.setData({ media: stream });
                callback({ media: stream });
            })
                .catch(function (err) {
                containerSlot === null || containerSlot === void 0 ? void 0 : containerSlot.setData({ error: err });
                callback({ error: err });
            });
        }
        return [containerSlot, key];
    }
    function getDevice(kind, deviceId) {
        return new Promise(function (resolve, reject) {
            getDevicePrivate(kind, deviceId, function (res) {
                if (res.error) {
                    reject(res.error);
                }
                else {
                    resolve(res.media);
                }
            });
        });
    }
    function retainDevice(key) {
        var slot = globalStore.get(key);
        slot === null || slot === void 0 ? void 0 : slot.retain();
    }
    function releaseDevice(key) {
        var slot = globalStore.get(key);
        if ((slot === null || slot === void 0 ? void 0 : slot.release()) == 0) {
            globalStore.delete(key);
        }
    }
    var useDevice = function (kind, deviceId) {
        var _a = React.useState({}), res = _a[0], setRes = _a[1];
        React.useEffect(function () {
            if (deviceId != false) {
                var _a = getDevicePrivate(kind, deviceId, setRes), containerSlot_1 = _a[0], key_1 = _a[1];
                containerSlot_1.retain();
                return function () {
                    setRes({ media: undefined, error: undefined });
                    if ((containerSlot_1 === null || containerSlot_1 === void 0 ? void 0 : containerSlot_1.release()) == 0) {
                        globalStore.delete(key_1);
                    }
                };
            }
        }, [kind, deviceId]);
        return [res.media, res.error];
    };
    var useUserMedia = function (constraints, active) {
        var _a = React.useState({}), res = _a[0], setRes = _a[1];
        React.useEffect(function () {
            if (active) {
                var gotStream_1;
                navigator.mediaDevices
                    .getUserMedia(constraints)
                    .then(function (stream) {
                    gotStream_1 = stream;
                    setRes({ media: stream });
                })
                    .catch(function (err) {
                    gotStream_1 = undefined;
                    setRes({ error: err });
                });
                return function () {
                    setRes({ media: undefined, error: undefined });
                    gotStream_1 === null || gotStream_1 === void 0 ? void 0 : gotStream_1.getTracks().forEach(function (track) {
                        track.stop();
                    });
                };
            }
        }, [JSON.stringify(constraints), active]);
        return [res.media, res.error];
    };
    var useDisplayMedia = function (constraints, active) {
        var _a = React.useState({}), res = _a[0], setRes = _a[1];
        React.useEffect(function () {
            if (active) {
                var gotStream_2;
                navigator.mediaDevices
                    .getDisplayMedia(constraints)
                    .then(function (stream) {
                    gotStream_2 = stream;
                    setRes({ media: stream });
                })
                    .catch(function (err) {
                    gotStream_2 = undefined;
                    setRes({ error: err });
                });
                return function () {
                    setRes({ media: undefined, error: undefined });
                    gotStream_2 === null || gotStream_2 === void 0 ? void 0 : gotStream_2.getTracks().forEach(function (track) {
                        track.stop();
                    });
                };
            }
        }, [JSON.stringify(constraints), active]);
        return [res.media, res.error];
    };

    exports.SessionState = void 0;
    (function (SessionState) {
        SessionState["New"] = "new";
        SessionState["Connecting"] = "connecting";
        SessionState["Connected"] = "connected";
        SessionState["Reconnecting"] = "reconnecting";
        SessionState["Disconnected"] = "disconnected";
        SessionState["Error"] = "error";
    })(exports.SessionState || (exports.SessionState = {}));
    var StreamPublisherWrap = /** @class */ (function () {
        function StreamPublisherWrap(publisher) {
            this.publisher = publisher;
        }
        Object.defineProperty(StreamPublisherWrap.prototype, "state", {
            get: function () {
                return this.publisher.state;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(StreamPublisherWrap.prototype, "localStream", {
            get: function () {
                return this.publisher.localStream;
            },
            enumerable: false,
            configurable: true
        });
        StreamPublisherWrap.prototype.on = function (type, callback) {
            this.publisher.on(type, callback);
        };
        StreamPublisherWrap.prototype.off = function (type, callback) {
            this.publisher.on(type, callback);
        };
        StreamPublisherWrap.prototype.switchStream = function (stream) {
            if (stream) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                var cachedKey = stream.cachedKey;
                if (cachedKey) {
                    retainDevice(cachedKey);
                }
            }
            if (this.publisher.localStream) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                var cacheKey = this.publisher.localStream.cachedKey;
                if (cacheKey) {
                    releaseDevice(cacheKey);
                }
            }
            return this.publisher.switch(stream);
        };
        return StreamPublisherWrap;
    }());
    var SessionContext = React.createContext({});
    var GlobalVer = 0;
    var SessionProvider = function (props) {
        // if (props.log_level != undefined) {
        //   Atm0s.setLogLevel(props.log_level);
        // }
        var _a = React.useState(0), setVer = _a[1];
        var storage = React.useMemo(function () {
            return { data: undefined };
        }, []);
        var update = React.useCallback(function (data) {
            storage.data = data;
            setVer(GlobalVer++);
        }, [storage, setVer]);
        var connect = React.useCallback(function (url, config) {
            var _a, _b;
            if ((_a = storage.data) === null || _a === void 0 ? void 0 : _a.session) {
                return function () {
                    var _a;
                    (_a = storage.data) === null || _a === void 0 ? void 0 : _a.session.disconnect();
                };
            }
            var session = Atm0s.createSession(url, config);
            var myAudioStreams = new Map();
            var myVideoStreams = new Map();
            var audioStreams = new Map();
            var videoStreams = new Map();
            var publishers = new Map();
            var consumers = new Map();
            var consumerPairs = new Map();
            (_b = config === null || config === void 0 ? void 0 : config.senders) === null || _b === void 0 ? void 0 : _b.map(function (sender) {
                if (sender.stream) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    var cachedKey = sender.stream.cachedKey;
                    if (cachedKey) {
                        retainDevice(cachedKey);
                    }
                }
            });
            session.on('connected', function () {
                var _a;
                if (((_a = storage.data) === null || _a === void 0 ? void 0 : _a.session) != session)
                    return;
                update({
                    session: session,
                    state: exports.SessionState.Connected,
                    myAudioStreams: Array.from(myAudioStreams.values()),
                    myVideoStreams: Array.from(myVideoStreams.values()),
                    audioStreams: Array.from(audioStreams.values()),
                    videoStreams: Array.from(videoStreams.values()),
                    publishers: publishers,
                    consumers: consumers,
                    consumerPairs: consumerPairs,
                });
            });
            session.on('mystream_added', function (stream) {
                var _a;
                if (((_a = storage.data) === null || _a === void 0 ? void 0 : _a.session) != session)
                    return;
                var key = stream.peerId + '-' + stream.name;
                if (stream.kind === Atm0s.StreamKinds.AUDIO) {
                    myAudioStreams.set(key, stream);
                }
                else {
                    myVideoStreams.set(key, stream);
                }
                update({
                    session: session,
                    state: exports.SessionState.Connected,
                    myAudioStreams: Array.from(myAudioStreams.values()),
                    myVideoStreams: Array.from(myVideoStreams.values()),
                    audioStreams: Array.from(audioStreams.values()),
                    videoStreams: Array.from(videoStreams.values()),
                    publishers: publishers,
                    consumers: consumers,
                    consumerPairs: consumerPairs,
                });
            });
            session.on('mystream_updated', function (stream) {
                var _a;
                if (((_a = storage.data) === null || _a === void 0 ? void 0 : _a.session) != session)
                    return;
                var key = stream.peerId + '-' + stream.name;
                if (stream.kind === Atm0s.StreamKinds.AUDIO) {
                    myAudioStreams.set(key, stream);
                }
                else {
                    myVideoStreams.set(key, stream);
                }
                update({
                    session: session,
                    state: exports.SessionState.Connected,
                    myAudioStreams: Array.from(myAudioStreams.values()),
                    myVideoStreams: Array.from(myVideoStreams.values()),
                    audioStreams: Array.from(audioStreams.values()),
                    videoStreams: Array.from(videoStreams.values()),
                    publishers: publishers,
                    consumers: consumers,
                    consumerPairs: consumerPairs,
                });
            });
            session.on('mystream_removed', function (stream) {
                var _a;
                if (((_a = storage.data) === null || _a === void 0 ? void 0 : _a.session) != session)
                    return;
                var key = stream.peerId + '-' + stream.name;
                if (stream.kind === Atm0s.StreamKinds.AUDIO) {
                    myAudioStreams.delete(key);
                }
                else {
                    myVideoStreams.delete(key);
                }
                update({
                    session: session,
                    state: exports.SessionState.Connected,
                    myAudioStreams: Array.from(myAudioStreams.values()),
                    myVideoStreams: Array.from(myVideoStreams.values()),
                    audioStreams: Array.from(audioStreams.values()),
                    videoStreams: Array.from(videoStreams.values()),
                    publishers: publishers,
                    consumers: consumers,
                    consumerPairs: consumerPairs,
                });
            });
            session.on('stream_added', function (stream) {
                var _a;
                if (((_a = storage.data) === null || _a === void 0 ? void 0 : _a.session) != session)
                    return;
                var key = stream.peerId + '-' + stream.name;
                if (stream.kind === Atm0s.StreamKinds.AUDIO) {
                    audioStreams.set(key, stream);
                }
                else {
                    videoStreams.set(key, stream);
                }
                update({
                    session: session,
                    state: exports.SessionState.Connected,
                    myAudioStreams: Array.from(myAudioStreams.values()),
                    myVideoStreams: Array.from(myVideoStreams.values()),
                    audioStreams: Array.from(audioStreams.values()),
                    videoStreams: Array.from(videoStreams.values()),
                    publishers: publishers,
                    consumers: consumers,
                    consumerPairs: consumerPairs,
                });
            });
            session.on('stream_updated', function (stream) {
                var _a;
                if (((_a = storage.data) === null || _a === void 0 ? void 0 : _a.session) != session)
                    return;
                var key = stream.peerId + '-' + stream.name;
                if (stream.kind === Atm0s.StreamKinds.AUDIO) {
                    audioStreams.set(key, stream);
                }
                else {
                    videoStreams.set(key, stream);
                }
                update({
                    session: session,
                    state: exports.SessionState.Connected,
                    myAudioStreams: Array.from(myAudioStreams.values()),
                    myVideoStreams: Array.from(myVideoStreams.values()),
                    audioStreams: Array.from(audioStreams.values()),
                    videoStreams: Array.from(videoStreams.values()),
                    publishers: publishers,
                    consumers: consumers,
                    consumerPairs: consumerPairs,
                });
            });
            session.on('stream_removed', function (stream) {
                var _a;
                if (((_a = storage.data) === null || _a === void 0 ? void 0 : _a.session) != session)
                    return;
                var key = stream.peerId + '-' + stream.name;
                if (stream.kind === Atm0s.StreamKinds.AUDIO) {
                    audioStreams.delete(key);
                }
                else {
                    videoStreams.delete(key);
                }
                update({
                    session: session,
                    state: exports.SessionState.Connected,
                    myAudioStreams: Array.from(myAudioStreams.values()),
                    myVideoStreams: Array.from(myVideoStreams.values()),
                    audioStreams: Array.from(audioStreams.values()),
                    videoStreams: Array.from(videoStreams.values()),
                    publishers: publishers,
                    consumers: consumers,
                    consumerPairs: consumerPairs,
                });
            });
            session.on('disconnected', function () {
                var _a;
                if (((_a = storage.data) === null || _a === void 0 ? void 0 : _a.session) != session)
                    return;
                update({
                    session: session,
                    state: exports.SessionState.Disconnected,
                    myAudioStreams: Array.from(myAudioStreams.values()),
                    myVideoStreams: Array.from(myVideoStreams.values()),
                    audioStreams: Array.from(audioStreams.values()),
                    videoStreams: Array.from(videoStreams.values()),
                    publishers: publishers,
                    consumers: consumers,
                    consumerPairs: consumerPairs,
                });
            });
            session.connect().catch(function (err) {
                var _a;
                if (((_a = storage.data) === null || _a === void 0 ? void 0 : _a.session) != session)
                    return;
                console.error(err);
                update({
                    session: session,
                    state: exports.SessionState.Error,
                    myAudioStreams: Array.from(myAudioStreams.values()),
                    myVideoStreams: Array.from(myVideoStreams.values()),
                    audioStreams: Array.from(audioStreams.values()),
                    videoStreams: Array.from(videoStreams.values()),
                    publishers: publishers,
                    consumers: consumers,
                    consumerPairs: consumerPairs,
                });
            });
            update({
                session: session,
                state: exports.SessionState.Connecting,
                myAudioStreams: [],
                myVideoStreams: [],
                audioStreams: [],
                videoStreams: [],
                publishers: publishers,
                consumers: consumers,
                consumerPairs: consumerPairs,
            });
            return;
        }, [storage, update]);
        var disconnect = React.useCallback(function () {
            var _a;
            if ((_a = storage.data) === null || _a === void 0 ? void 0 : _a.session) {
                storage.data.session.disconnect();
                update(undefined);
            }
        }, [storage, update]);
        var getPublisher = React.useCallback(function (ownerId, cfg) {
            var _a;
            var data = storage.data;
            if (data === null || data === void 0 ? void 0 : data.session) {
                var publisher = data.publishers.get(cfg.name);
                if (!publisher) {
                    publisher = {
                        data: new StreamPublisherWrap(data.session.createPublisher({
                            stream: cfg.stream,
                            name: cfg.name,
                            kind: cfg.kind,
                            preferredCodecs: cfg.preferredCodecs,
                            simulcast: cfg.simulcast,
                            maxBitrate: cfg.maxBitrate,
                            contentHint: cfg.contentHint,
                            screen: cfg.screen,
                        })),
                        owners: new Map(),
                    };
                    data.publishers.set(cfg.name, publisher);
                }
                (_a = data.publishers.get(cfg.name)) === null || _a === void 0 ? void 0 : _a.owners.set(ownerId, new Date().getTime());
                return publisher.data;
            }
            return undefined;
        }, [storage]);
        var backPublisher = React.useCallback(function (ownerId, cfg) {
            var data = storage.data;
            if (data === null || data === void 0 ? void 0 : data.session) {
                var publisher = data.publishers.get(cfg.name);
                if (publisher) {
                    publisher.owners.delete(ownerId);
                    if (publisher.owners.size == 0) {
                        publisher.data.switchStream(null);
                        data.publishers.delete(cfg.name);
                    }
                }
            }
            return undefined;
        }, [storage]);
        var getConsumer = React.useCallback(function (ownerId, stream) {
            var _a;
            var data = storage.data;
            if (data === null || data === void 0 ? void 0 : data.session) {
                var key = stream.peerId + '-' + stream.name;
                var consumer = data.consumers.get(key);
                if (!consumer) {
                    consumer = {
                        data: data.session.createConsumer(stream),
                        owners: new Map(),
                    };
                    data.consumers.set(key, consumer);
                }
                (_a = data.consumers.get(key)) === null || _a === void 0 ? void 0 : _a.owners.set(ownerId, new Date().getTime());
                return consumer.data;
            }
            return undefined;
        }, [storage]);
        var backConsumer = React.useCallback(function (ownerId, stream) {
            var data = storage.data;
            if (data === null || data === void 0 ? void 0 : data.session) {
                var key = stream.peerId + '-' + stream.name;
                var consumer = data.consumers.get(key);
                if (consumer) {
                    consumer.owners.delete(ownerId);
                    if (consumer.owners.size == 0) {
                        data.consumers.delete(key);
                    }
                }
            }
            return undefined;
        }, [storage]);
        var getConsumerPair = React.useCallback(function (ownerId, peerId, audioName, videoName) {
            var _a;
            var data = storage.data;
            if (data === null || data === void 0 ? void 0 : data.session) {
                var key = peerId + '-' + audioName + '-' + videoName;
                var consumer = data.consumerPairs.get(key);
                if (!consumer) {
                    consumer = {
                        data: data.session.createConsumerPair(peerId, audioName, videoName),
                        owners: new Map(),
                    };
                    data.consumerPairs.set(key, consumer);
                }
                (_a = data.consumerPairs.get(key)) === null || _a === void 0 ? void 0 : _a.owners.set(ownerId, new Date().getTime());
                return consumer.data;
            }
            return undefined;
        }, [storage]);
        var backConsumerPair = React.useCallback(function (ownerId, peerId, audioName, videoName) {
            var data = storage.data;
            if (data === null || data === void 0 ? void 0 : data.session) {
                var key = peerId + '-' + audioName + '-' + videoName;
                var consumer = data.consumerPairs.get(key);
                if (consumer) {
                    consumer.owners.delete(ownerId);
                    if (consumer.owners.size == 0) {
                        data.consumerPairs.delete(key);
                    }
                }
            }
            return undefined;
        }, [storage]);
        React.useEffect(function () {
            if (props.url && props.config) {
                connect(props.url, props.config);
                return function () {
                    disconnect();
                };
            }
        }, [props.url, props.config, connect, disconnect]);
        return (React.createElement(SessionContext.Provider, { value: {
                data: storage.data,
                connect: connect,
                disconnect: disconnect,
                getPublisher: getPublisher,
                backPublisher: backPublisher,
                getConsumer: getConsumer,
                backConsumer: backConsumer,
                getConsumerPair: getConsumerPair,
                backConsumerPair: backConsumerPair,
                update: update,
            } }, props.children));
    };

    var useRemoteStreams = function (kind, isMine) {
        var data = React.useContext(SessionContext).data;
        if (kind == Atm0s.StreamKinds.AUDIO) {
            if (isMine === true) {
                return (data === null || data === void 0 ? void 0 : data.myAudioStreams) || [];
            }
            else {
                return (data === null || data === void 0 ? void 0 : data.audioStreams) || [];
            }
        }
        else {
            if (isMine === true) {
                return (data === null || data === void 0 ? void 0 : data.myVideoStreams) || [];
            }
            else {
                return (data === null || data === void 0 ? void 0 : data.videoStreams) || [];
            }
        }
    };

    var useSession = function () {
        var data = React.useContext(SessionContext).data;
        return data === null || data === void 0 ? void 0 : data.session;
    };

    var useSessionState = function () {
        var data = React.useContext(SessionContext).data;
        return (data === null || data === void 0 ? void 0 : data.state) || exports.SessionState.New;
    };

    var useActions = function () {
        var _a = React.useContext(SessionContext), connect = _a.connect, disconnect = _a.disconnect;
        return {
            connect: connect,
            disconnect: disconnect,
            playAudioMix: function () {
                // data?.session.getMixMinusAudio()?.play();
            },
        };
    };

    var idSeed$1 = 0;
    var useConsumer = function (remote, priority, maxSpatial, maxTemporal) {
        var consumerId = React.useMemo(function () { return idSeed$1++; }, []);
        var sessionState = useSessionState();
        var _a = React.useState(), consumer = _a[0], setConsumer = _a[1];
        var _b = React.useState(Atm0s.StreamReceiverState.NoSource), state = _b[0], setState = _b[1];
        var _c = React.useState(), element = _c[0], setElement = _c[1];
        var _d = React.useContext(SessionContext), data = _d.data, getConsumer = _d.getConsumer, backConsumer = _d.backConsumer;
        var isConnectionEstablished = [exports.SessionState.Connected, exports.SessionState.Reconnecting].indexOf(sessionState) >= 0;
        React.useEffect(function () {
            if ((data === null || data === void 0 ? void 0 : data.session) && remote) {
                var consumer_1 = getConsumer(consumerId, remote);
                if (consumer_1) {
                    consumer_1.on('state', setState);
                    setState(consumer_1.state);
                    setConsumer(consumer_1);
                    return function () {
                        consumer_1 === null || consumer_1 === void 0 ? void 0 : consumer_1.unview('use-consumer-' + consumerId);
                        consumer_1 === null || consumer_1 === void 0 ? void 0 : consumer_1.off('state', setState);
                        backConsumer(consumerId, remote);
                    };
                }
            }
        }, [data === null || data === void 0 ? void 0 : data.session, remote]);
        React.useEffect(function () {
            if (element && consumer && isConnectionEstablished) {
                element.srcObject = consumer.view('use-consumer-' + consumerId, priority, maxSpatial, maxTemporal);
                return function () {
                    element.srcObject = null;
                    consumer.unview('use-consumer-' + consumerId);
                };
            }
        }, [element, consumer, isConnectionEstablished]);
        React.useEffect(function () {
            if (element && consumer && isConnectionEstablished) {
                consumer.limit('use-consumer-' + consumerId, priority, maxSpatial, maxTemporal);
            }
        }, [element, consumer, isConnectionEstablished, priority, maxSpatial, maxTemporal]);
        var ref = function (instance) {
            setElement(instance || undefined);
        };
        return [ref, state, consumer];
    };
    var useConsumerPair = function (peerId, audioName, videoName, priority, maxSpatial, maxTemporal) {
        var consumerId = React.useMemo(function () { return idSeed$1++; }, []);
        var sessionState = useSessionState();
        var _a = React.useState(), consumer = _a[0], setConsumer = _a[1];
        var _b = React.useState(Atm0s.StreamReceiverState.NoSource), state = _b[0], setState = _b[1];
        var _c = React.useState(), element = _c[0], setElement = _c[1];
        var _d = React.useContext(SessionContext), data = _d.data, getConsumerPair = _d.getConsumerPair, backConsumerPair = _d.backConsumerPair;
        var isConnectionEstablished = [exports.SessionState.Connected, exports.SessionState.Reconnecting].indexOf(sessionState) >= 0;
        React.useEffect(function () {
            if (data === null || data === void 0 ? void 0 : data.session) {
                var consumer_2 = getConsumerPair(consumerId, peerId, audioName, videoName);
                if (consumer_2) {
                    consumer_2.on('state', setState);
                    setState(consumer_2.state);
                    setConsumer(consumer_2);
                    return function () {
                        consumer_2 === null || consumer_2 === void 0 ? void 0 : consumer_2.off('state', setState);
                        backConsumerPair(consumerId, peerId, audioName, videoName);
                    };
                }
            }
        }, [data === null || data === void 0 ? void 0 : data.session, peerId, audioName, videoName]);
        React.useEffect(function () {
            if (element && consumer && isConnectionEstablished) {
                element.srcObject = consumer.view('use-consumer-' + consumerId, priority, maxSpatial, maxTemporal);
                return function () {
                    element.srcObject = null;
                    consumer.unview('use-consumer-' + consumerId);
                };
            }
        }, [element, consumer, isConnectionEstablished]);
        React.useEffect(function () {
            if (element && consumer && isConnectionEstablished) {
                consumer.limit('use-consumer-' + consumerId, priority, maxSpatial, maxTemporal);
            }
        }, [element, consumer, isConnectionEstablished, priority, maxSpatial, maxTemporal]);
        var ref = function (instance) {
            setElement(instance || undefined);
        };
        return [ref, state, consumer];
    };
    var useLocalConsumer = function (stream) {
        var _a = React.useState(), element = _a[0], setElement = _a[1];
        React.useEffect(function () {
            if (element && stream) {
                element.srcObject = stream;
                return function () {
                    element.srcObject = null;
                };
            }
        }, [element, stream]);
        return function (instance) {
            setElement(instance || undefined);
        };
    };

    var idSeed = 0;
    var usePublisher = function (cfg) {
        var publisherId = React.useMemo(function () { return idSeed++; }, []);
        var _a = React.useState(Atm0s.StreamSenderState.Created), state = _a[0], setState = _a[1];
        var _b = React.useState(), producer = _b[0], setProducer = _b[1];
        var _c = React.useContext(SessionContext), data = _c.data, getPublisher = _c.getPublisher, backPublisher = _c.backPublisher;
        React.useEffect(function () {
            if (data === null || data === void 0 ? void 0 : data.session) {
                var newProducer_1 = getPublisher(publisherId, cfg);
                if (newProducer_1) {
                    var onUpdateState_1 = function (state) {
                        setState(state);
                    };
                    newProducer_1.on('state', onUpdateState_1);
                    setProducer(newProducer_1);
                    setState(newProducer_1.state);
                    return function () {
                        newProducer_1 === null || newProducer_1 === void 0 ? void 0 : newProducer_1.off('state', onUpdateState_1);
                        backPublisher(publisherId, cfg);
                    };
                }
            }
        }, [data === null || data === void 0 ? void 0 : data.session, cfg.kind + cfg.name]);
        return [state, producer === null || producer === void 0 ? void 0 : producer.localStream, producer];
    };

    var useAudioLevelConsumer = function (consumer) {
        var _a = React.useState(undefined), audioLevel = _a[0], setAudioLevel = _a[1];
        React.useEffect(function () {
            if (consumer) {
                var handler_1 = function (level) {
                    setAudioLevel(level);
                };
                consumer.on('audio_level', handler_1);
                return function () {
                    consumer.off('audio_level', handler_1);
                };
            }
            else {
                setAudioLevel(undefined);
            }
        }, [consumer]);
        return audioLevel;
    };
    var useAudioLevelProducer = function (producer) {
        var _a = React.useState(undefined), audioLevel = _a[0], setAudioLevel = _a[1];
        React.useEffect(function () {
            if (producer) {
                var handler_2 = function (level) {
                    setAudioLevel(level);
                };
                producer.on('audio_level', handler_2);
                return function () {
                    producer.off('audio_level', handler_2);
                };
            }
            else {
                setAudioLevel(undefined);
            }
        }, [producer]);
        return audioLevel;
    };
    var useAudioSlotMix = function (slotIndex) {
        var _a = React.useState(undefined), slot = _a[0], setSlot = _a[1];
        var data = React.useContext(SessionContext).data;
        React.useEffect(function () {
            var mixMinus = data === null || data === void 0 ? void 0 : data.session.getMixMinusAudio();
            if (mixMinus) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                var handler_3 = function (info) {
                    if (info) {
                        var sourceId = info[0].split(':');
                        setSlot({
                            peerId: sourceId[0],
                            streamName: sourceId[1],
                            audioLevel: info[1],
                        });
                    }
                    else {
                        setSlot(undefined);
                    }
                };
                mixMinus.on("slot_".concat(slotIndex), handler_3);
                return function () {
                    mixMinus === null || mixMinus === void 0 ? void 0 : mixMinus.off("slot_".concat(slotIndex), handler_3);
                };
            }
        }, [slotIndex, data === null || data === void 0 ? void 0 : data.session.getMixMinusAudio()]);
        return slot;
    };
    var useAudioLevelMix = function (peerId, streamName) {
        var _a = React.useState(undefined), audioLevel = _a[0], setAudioLevel = _a[1];
        var data = React.useContext(SessionContext).data;
        React.useEffect(function () {
            var mixMinus = data === null || data === void 0 ? void 0 : data.session.getMixMinusAudio();
            if (mixMinus) {
                var handler_4 = function (level) {
                    setAudioLevel(level || undefined);
                };
                mixMinus.on("source_".concat(peerId, ":").concat(streamName), handler_4);
                return function () {
                    mixMinus === null || mixMinus === void 0 ? void 0 : mixMinus.off("source_".concat(peerId, ":").concat(streamName), handler_4);
                };
            }
        }, [peerId, streamName, data === null || data === void 0 ? void 0 : data.session.getMixMinusAudio()]);
        return audioLevel;
    };

    var RemoteViewer = function (props) {
        var _a = useConsumer(props.remote, props.priority), ref = _a[0], state = _a[1];
        return (React.createElement("div", { className: "w-full h-full" },
            React.createElement("div", null, state),
            React.createElement("video", { muted: true, autoPlay: true, className: "w-full h-full", ref: ref })));
    };
    var LocalViewer = function (props) {
        var ref = useLocalConsumer(props.stream);
        return React.createElement("video", { muted: true, autoPlay: true, className: "w-full h-full", ref: ref });
    };
    var VideoViewer = function (props) {
        if (props.stream instanceof Atm0s.StreamRemote) {
            return React.createElement(RemoteViewer, { remote: props.stream, priority: props.priority });
        }
        else {
            return React.createElement(LocalViewer, { stream: props.stream });
        }
    };

    exports.BlueseaSessionContext = SessionContext;
    exports.LocalViewer = LocalViewer;
    exports.RemoteViewer = RemoteViewer;
    exports.SessionProvider = SessionProvider;
    exports.StreamPublisherWrap = StreamPublisherWrap;
    exports.VideoViewer = VideoViewer;
    exports.getDevice = getDevice;
    exports.useActions = useActions;
    exports.useAudioLevelConsumer = useAudioLevelConsumer;
    exports.useAudioLevelMix = useAudioLevelMix;
    exports.useAudioLevelProducer = useAudioLevelProducer;
    exports.useAudioSlotMix = useAudioSlotMix;
    exports.useConsumer = useConsumer;
    exports.useConsumerPair = useConsumerPair;
    exports.useDevice = useDevice;
    exports.useDevices = useDevices;
    exports.useDisplayMedia = useDisplayMedia;
    exports.useLocalConsumer = useLocalConsumer;
    exports.usePublisher = usePublisher;
    exports.useRemoteStreams = useRemoteStreams;
    exports.useSession = useSession;
    exports.useSessionState = useSessionState;
    exports.useUserMedia = useUserMedia;

}));
//# sourceMappingURL=index.umd.js.map
