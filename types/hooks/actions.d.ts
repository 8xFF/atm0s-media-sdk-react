import type { ISessionConfig } from '@8xff/atm0s-media-js';
interface Actions {
    connect: (url: string, config: ISessionConfig) => void;
    disconnect: () => void;
    playAudioMix: () => void;
}
export declare const useActions: () => Actions;
export {};
//# sourceMappingURL=actions.d.ts.map