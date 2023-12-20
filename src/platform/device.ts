export type MediaStream2 = MediaStream;
export const mediaDevices =
  typeof window !== 'undefined' && !!window.navigator ? window.navigator.mediaDevices : ({} as MediaDevices);
export type MediaDeviceKind = 'audioinput' | 'audiooutput' | 'videoinput';
export interface MediaDeviceInfo {
  readonly deviceId: string;
  readonly groupId: string;
  readonly kind: MediaDeviceKind;
  readonly label: string;
}
export interface MediaStreamConstraints {
  audio?: boolean | MediaTrackConstraints;
  video?: boolean | MediaTrackConstraints;
}
