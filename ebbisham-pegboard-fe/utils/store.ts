import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { EPlayStatus, TPlayer, TToastVariant } from './types';
import { updatePlayerPlayStatus } from './firestore_utils';
import { mountStoreDevtool } from 'simple-zustand-devtools';
import { enableMapSet } from 'immer';

enableMapSet();

type State = {
    sessionId: string;

    players: Map<string, TPlayer>;
    playersInQueue: Map<string, TPlayer>;
    pausedPlayers: Map<string, TPlayer>;
    nextOnPlayers: Map<number, TPlayer>;

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
        mixedPreference: number; // 0 = no priority, 0.99 = always mixed if possible
    };
};

type Action = {
    setSessionId: (sessionId: string) => void;

    setPlayers: (players: TPlayer[]) => void;
    addNewPlayerToStore: (player: TPlayer) => void;
    setPlayersInQueue: (players: TPlayer[]) => void;
    addPlayerToQueue: (player: TPlayer) => void;
    setPausedPlayers: (players: TPlayer[]) => void;
    removePlayerFromQueue: (player: TPlayer) => void;
    togglePausePlayer: (player: TPlayer) => void;
    setNextOnPlayers: (players: Map<number, TPlayer>) => void;
    addPlayersToNextOn: (players: Map<number, TPlayer>) => void;

    setIsStopPlayerModalOpen: (player: TPlayer | null) => void;
    setIsAddNewPlayerModalOpen: (isOpen: boolean) => void;

    setToastNotification: (isOpen: boolean, message?: string, title?: string, variant?: TToastVariant) => void;

    setInViewNumber: (inViewNumber: number) => void;
    setMixedPreference: (mixedPreference: number) => void;
};

export const useGlobalStore = create<State & Action>()(
    immer((set, get) => ({
        sessionId: '-1',
        setSessionId: (sessionId) =>
            set((state) => {
                state.sessionId = sessionId;
            }),

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

        nextOnPlayers: new Map(),
        setNextOnPlayers: (players) => {
            set((state) => {
                state.nextOnPlayers = players;
            });
        },
        addPlayersToNextOn: (players) => {
            set((state) => {
                state.nextOnPlayers = players;
            });
            players.forEach((player) => {
                updatePlayerPlayStatus(player.id, EPlayStatus.NEXT);
            });
        },

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
            updatePlayerPlayStatus(player.id, EPlayStatus.NOT_PLAYING);
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
                updatePlayerPlayStatus(player.id, EPlayStatus.PAUSED);
            }
        },

        isStopPlayerModalOpen: null,
        setIsStopPlayerModalOpen: (player) =>
            set((state) => {
                state.isStopPlayerModalOpen = player as TPlayer;
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
            mixedPreference: 0.5,
        },
        setInViewNumber: (inViewNumber) =>
            set((state) => {
                state.gamePreferences.inViewNumber = inViewNumber;
            }),
        setMixedPreference: (mixedPreference) =>
            set((state) => {
                state.gamePreferences.mixedPreference = mixedPreference;
            }),
    }))
);

if (process.env.NODE_ENV === 'development') {
    mountStoreDevtool('Store', useGlobalStore);
}
