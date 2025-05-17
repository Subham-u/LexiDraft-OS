declare module 'simple-peer' {
  interface Options {
    initiator?: boolean;
    channelConfig?: object;
    channelName?: string;
    config?: object;
    offerOptions?: object;
    answerOptions?: object;
    reconnectTimer?: number;
    sdpTransform?: (sdp: string) => string;
    stream?: MediaStream;
    streams?: MediaStream[];
    trickle?: boolean;
    allowHalfTrickle?: boolean;
    wrtc?: object;
    objectMode?: boolean;
  }

  interface Instance extends NodeJS.EventEmitter {
    signal(data: any): void;
    send(data: string | Uint8Array | ArrayBuffer | Blob): void;
    addStream(stream: MediaStream): void;
    removeStream(stream: MediaStream): void;
    addTrack(track: MediaStreamTrack, stream: MediaStream): void;
    removeTrack(track: MediaStreamTrack, stream: MediaStream): void;
    replaceTrack(oldTrack: MediaStreamTrack, newTrack: MediaStreamTrack, stream: MediaStream): void;
    destroy(err?: Error): void;
    readonly connected: boolean;
    readonly destroyed: boolean;
    readonly remoteAddress: string;
    readonly remoteFamily: string;
    readonly remotePort: number;
  }

  interface SimplePeer {
    (opts?: Options): Instance;
    new (opts?: Options): Instance;
  }

  const SimplePeer: SimplePeer;
  export = SimplePeer;
}