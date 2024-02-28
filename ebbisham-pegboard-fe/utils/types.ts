export type TPlayer = {
    id: string;
    name: string;
    gender: string;
    playStatus: string; // -1 is not playing. 0 is paused. 1 is playing. timestamp is in queue.
};

export type TToastVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';
