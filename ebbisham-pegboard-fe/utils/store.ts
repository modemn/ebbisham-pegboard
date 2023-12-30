import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { TPlayer } from './types';
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
};

type Action = {
    setPlayers: (players: TPlayer[]) => void;
    addNewPlayerToStore: (player: TPlayer) => void;
    setPlayersInQueue: (players: TPlayer[]) => void;
    setPausedPlayers: (players: TPlayer[]) => void;
    addPlayerToQueue: (player: TPlayer) => void;
    removePlayerFromQueue: (player: TPlayer) => void;
    togglePausePlayer: (player: TPlayer) => void;

    setIsStopPlayerModalOpen: (player: TPlayer | null) => void;
    setIsAddNewPlayerModalOpen: (isOpen: boolean) => void;
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
            updatePlayerPlayStatus(player.id, 'playing');
        },

        removePlayerFromQueue: (player) => {
            set((state) => {
                state.playersInQueue.delete(player.id);
                state.players.set(player.id, player);
            });
            updatePlayerPlayStatus(player.id, 'stopped');
        },

        togglePausePlayer: (player) => {
            // Unpause player
            if (get().pausedPlayers.get(player.id)) {
                set((state) => {
                    state.pausedPlayers.delete(player.id);
                    const unpausedPlayer = state.players.get(player.id);
                    if (unpausedPlayer) {
                        state.players.set(player.id, { ...unpausedPlayer, playStatus: 'playing' });
                    }
                });
                updatePlayerPlayStatus(player.id, 'playing');
            } else {
                // Pause player
                set((state) => {
                    state.pausedPlayers.set(player.id, player);
                });
                updatePlayerPlayStatus(player.id, 'paused');
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
    }))
);

if (process.env.NODE_ENV === 'development') {
    mountStoreDevtool('Store', useGlobalStore);
}
