export declare const useDevices: (kind: MediaDeviceKind) => [MediaDeviceInfo[], any | null];
export declare function getDevice(kind: MediaDeviceKind, deviceId: string | boolean): Promise<MediaStream>;
export declare function retainDevice(key: string): void;
export declare function releaseDevice(key: string): void;
export declare const useDevice: (kind: MediaDeviceKind, deviceId: string | boolean) => [MediaStream | undefined, Error | undefined];
export declare const useUserMedia: (constraints?: MediaStreamConstraints, active?: boolean) => [MediaStream | undefined, Error | undefined];
export declare const useDisplayMedia: (constraints?: DisplayMediaStreamOptions, active?: boolean) => [MediaStream | undefined, Error | undefined];
//# sourceMappingURL=device.d.ts.map