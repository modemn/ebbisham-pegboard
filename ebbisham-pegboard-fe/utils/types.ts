export type TPlayer = {
    id: string;
    name: string;
    gender: string;
    playStatus: EPlayStatus; // -1 is not playing. Timestamp is in queue. 0 is paused. 1 is next on. 2 is playing.
};

export type TToastVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';

export enum EPlayStatus {
    NOT_PLAYING = '-1',
    PAUSED = '0',
    NEXT = '1',
    PLAYING = '2',
}
