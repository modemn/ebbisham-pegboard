export type TPlayer = {
    id: string;
    name: string;
    gender: string;
    playStatus: EPlayStatus | string; // string means it is set to the timestamp
    matchResultHistory: string;
    rating: { mu: number; sigma: number };
    matchHistory: string[];
};

export type TCourt = {
    id: string;
    courtNumber: number;
    matchStartTime: number; // 0 if not started. Timestamp if started.
    players: { [key: number]: string };
};

export type TToastVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';

export enum EPlayStatus {
    NOT_PLAYING = '-1',
    PAUSED = '0',
    NEXT = '1',
    PLAYING = '2',
}
