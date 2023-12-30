export type TPlayer = {
    id: string;
    name: string;
    gender: string;
    playStatus: TPlayStatus;
};

export type TPlayStatus = 'playing' | 'paused' | 'stopped';
