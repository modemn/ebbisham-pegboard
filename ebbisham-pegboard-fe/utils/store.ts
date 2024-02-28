import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { TPlayer, TToastVariant } from './types';
import { updatePlayerPlayStatus } from './firestore_utils';
import { mountStoreDevtool } from 'simple-zustand-devtools';
import { enableMapSet } from 'immer';

enableMapSet();

type State = {
    players: Map<string, TPlayer>;
    playersInQueue: Map<string, TPlayer>;
    pausedPlayers: Map<string, TPlayer>;

    isStopPlayerModalOpen: TPlayer | null;
    isAddNewPlayerModalOpen: boolean;

    toastNotification: {
        isOpen: boolean;
        title: string;
        message: string;
        variant: TToastVariant | undefined;
    };

    gamePreferences: {
        inViewNumber: number;
    };
};

type Action = {
    setPlayers: (players: TPlayer[]) => void;
    addNewPlayerToStore: (player: TPlayer) => void;
    setPlayersInQueue: (players: TPlayer[]) => void;
    addPlayerToQueue: (player: TPlayer) => void;
    setPausedPlayers: (players: TPlayer[]) => void;
    removePlayerFromQueue: (player: TPlayer) => void;
    togglePausePlayer: (player: TPlayer) => void;

    setIsStopPlayerModalOpen: (player: TPlayer | null) => void;
    setIsAddNewPlayerModalOpen: (isOpen: boolean) => void;

    setToastNotification: (isOpen: boolean, message?: string, title?: string, variant?: TToastVariant) => void;

    setInViewNumber: (inViewNumber: number) => void;
};

export const useGlobalStore = create<State & Action>()(
    immer((set, get) => ({
        players: new Map(),
        setPlayers: (players) =>
            set((state) => {
                state.players = new Map(players.map((p) => [p.id, p]));
            }),
        addNewPlayerToStore: (player) =>
            set((state) => {
                state.players = new Map(state.players).set(player.id, player);
            }),

        playersInQueue: new Map(),
        setPlayersInQueue: (players) =>
            set((state) => {
                players.sort((a, b) => {
                    return Number(a.playStatus) - Number(b.playStatus);
                });
                state.playersInQueue = new Map(players.map((p) => [p.id, p]));
            }),

        pausedPlayers: new Map(),
        setPausedPlayers: (players) =>
            set((state) => {
                state.pausedPlayers = new Map(players.map((p) => [p.id, p]));
            }),

        addPlayerToQueue: (player) => {
            set((state) => {
                state.playersInQueue.set(player.id, player);
                state.players.delete(player.id);
            });
            updatePlayerPlayStatus(player.id, Date.now().toString());
        },

        removePlayerFromQueue: (player) => {
            set((state) => {
                state.playersInQueue.delete(player.id);
                state.players.set(player.id, player);
            });
            updatePlayerPlayStatus(player.id, '-1');
        },

        togglePausePlayer: (player) => {
            // Unpause player
            if (get().pausedPlayers.get(player.id)) {
                set((state) => {
                    state.pausedPlayers.delete(player.id);
                    state.playersInQueue.set(player.id, player);
                });
                updatePlayerPlayStatus(player.id, Date.now().toString());
            } else {
                // Pause player
                set((state) => {
                    state.pausedPlayers.set(player.id, player);
                    state.playersInQueue.delete(player.id);
                });
                updatePlayerPlayStatus(player.id, '0');
            }
        },

        isStopPlayerModalOpen: null,
        setIsStopPlayerModalOpen: (player) =>
            set((state) => {
                state.isStopPlayerModalOpen = player;
            }),

        isAddNewPlayerModalOpen: false,
        setIsAddNewPlayerModalOpen: (isOpen) =>
            set((state) => {
                state.isAddNewPlayerModalOpen = isOpen;
            }),

        toastNotification: {
            isOpen: false,
            title: '',
            message: '',
            variant: undefined,
        },
        setToastNotification: (isOpen, message, title, variant) =>
            set((state) => {
                state.toastNotification.isOpen = isOpen;
                if (message) {
                    state.toastNotification.message = message;
                }
                if (title) {
                    state.toastNotification.title = title;
                }
                if (variant) {
                    state.toastNotification.variant = variant;
                }
            }),

        gamePreferences: {
            inViewNumber: 8,
        },
        setInViewNumber: (inViewNumber) =>
            set((state) => {
                state.gamePreferences.inViewNumber = inViewNumber;
            }),
    }))
);

if (process.env.NODE_ENV === 'development') {
    mountStoreDevtool('Store', useGlobalStore);
}
