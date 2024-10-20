import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { EPlayStatus, TCourt, TPlayer, TToastVariant } from './types';
import { addPlayersToNextOn, recordMatch, resetCourt, resetNextOnPlayers, startCourt, updatePlayerPlayStatus, updatePlayer, updatePlayerNextOn } from './firestore_utils';
import { mountStoreDevtool } from 'simple-zustand-devtools';
import { enableMapSet } from 'immer';
import { getUpdatedMatchResultHistory, shuffle } from './utils';
import { rate } from 'openskill';

enableMapSet();

type State = {
    sessionId: string;

    players: Map<string, TPlayer>;
    playersInQueue: Map<string, TPlayer>;
    pausedPlayers: Map<string, TPlayer>;
    nextOnPlayers: Map<number, TPlayer>;

    courts: TCourt[];

    isStopPlayerModalOpen: TPlayer | null;
    isAddNewPlayerModalOpen: boolean;
    isEndMatchModalOpen: TCourt | null;
    isSwapPlayerModalOpen: TPlayer | null;

    toastNotification: {
        isOpen: boolean;
        title: string;
        message: string;
        variant: TToastVariant | undefined;
    };

    gamePreferences: {
        inViewNumber: number; // minimum of 4 since we need at least 4 players
        mixedPreference: number; // 0 = no priority, 0.99 = always mixed if possible
        maxCourts: number;
        pairChoicePreference: 0 | 0.5 | 1 | 2 | 10; // 0 = Random, 0.5 = random weighted, 1 = as weighted, 2 = best weighted, 10 = best
        returnOrder: 0 | 1 | 2; // 0 = random, 1 = winners returned first, 2 = interleave pairs
        mixItUpNumber: 1 | 2 | 3 | 4;
    };
};

type Action = {
    setSessionId: (sessionId: string) => void;

    setPlayers: (players: TPlayer[]) => void;
    addNewPlayerToStore: (player: TPlayer) => void;

    setPlayersInQueue: (players: TPlayer[]) => void;
    addPlayerToQueue: (player: TPlayer) => void;
    removePlayerFromQueue: (player: TPlayer) => void;

    setPausedPlayers: (players: TPlayer[]) => void;
    togglePausePlayer: (player: TPlayer) => void;

    setNextOnPlayers: (players: Map<number, TPlayer>) => void;
    addPlayersToNextOn: (players: Map<number, TPlayer>) => void;
    swapPlayers: (playerInNextOn: TPlayer, playerInQueue: TPlayer) => void;
    returnNextOnPlayersToQueue: () => void;

    setCourts: (courts: TCourt[]) => void;
    movePlayersToCourt: (court: TCourt) => void;
    endMatchOnCourt: (court: TCourt, homeScore: number, awayScore: number, matchEndTime: number) => void;

    setIsStopPlayerModalOpen: (player: TPlayer | null) => void;
    setIsAddNewPlayerModalOpen: (isOpen: boolean) => void;
    setIsEndMatchModalOpen: (court: TCourt | null) => void;
    setIsSwapPlayerModalOpen: (court: TPlayer | null) => void;

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
            addPlayersToNextOn(players);
        },
        swapPlayers: (playerInNextOn, playerInQueue) => {
            set((state) => {
                const queuePosition = playerInQueue.playStatus;

                let nextOnKey = -1;
                for (const [key, player] of Array.from(state.nextOnPlayers)) {
                    if (player.id === playerInNextOn.id) {
                        nextOnKey = key;
                        break;
                    }
                }

                if (nextOnKey > -1) {
                    state.nextOnPlayers.delete(nextOnKey);
                    state.nextOnPlayers.set(nextOnKey, playerInQueue);

                    state.playersInQueue.delete(playerInQueue.id);
                    state.playersInQueue.set(playerInNextOn.id, playerInNextOn);

                    updatePlayerNextOn(playerInQueue.id, nextOnKey);
                    updatePlayerPlayStatus(playerInNextOn.id, queuePosition);
                    updatePlayerPlayStatus(playerInQueue.id, EPlayStatus.NEXT);
                }
            });
        },
        returnNextOnPlayersToQueue: () => {
            set((state) => {
                state.nextOnPlayers.forEach((player) => {
                    updatePlayerPlayStatus(player.id, Date.now().toString());
                    state.playersInQueue.set(player.id, player);
                });
                resetNextOnPlayers();
                state.nextOnPlayers = new Map();
            });
        },
        movePlayersToCourt: (court: TCourt) =>
            set((state) => {
                Object.values(court.players).forEach((playerId) => {
                    updatePlayerPlayStatus(playerId, EPlayStatus.PLAYING);
                });
                startCourt(court);
                resetNextOnPlayers();
                state.nextOnPlayers = new Map();
            }),
        endMatchOnCourt: async (court: TCourt, homeScore: number, awayScore: number, matchEndTime: number) => {
            // Record the match in the database
            const matchId = await recordMatch(court, homeScore, awayScore, matchEndTime);

            set((state) => {
                const homePair = [state.players.get(court.players[0]) as TPlayer, state.players.get(court.players[1]) as TPlayer];
                const awayPair = [state.players.get(court.players[2]) as TPlayer, state.players.get(court.players[3]) as TPlayer];

                homePair[0].matchHistory.push(matchId);
                homePair[1].matchHistory.push(matchId);
                awayPair[0].matchHistory.push(matchId);
                awayPair[1].matchHistory.push(matchId);

                // Get new ratings for the players depending on the result of the match
                let newHomePair0Rating: { mu: number; sigma: number };
                let newHomePair1Rating: { mu: number; sigma: number };
                let newAwayPair0Rating: { mu: number; sigma: number };
                let newAwayPair1Rating: { mu: number; sigma: number };

                // Get the genders of the players, if there is a ratio of 1:4 then do not update the ratings
                const genderCounts: { [key: string]: number } = {
                    M: 0,
                    F: 0,
                };

                const allPlayers = [...homePair, ...awayPair];
                allPlayers.forEach((player) => {
                    genderCounts[player.gender] += 1;
                });

                if (genderCounts.M > 1 && genderCounts.F > 1) {
                    if (homeScore > awayScore) {
                        [[newHomePair0Rating, newHomePair1Rating], [newAwayPair0Rating, newAwayPair1Rating]] = rate([
                            [homePair[0].rating, homePair[1].rating],
                            [awayPair[0].rating, awayPair[1].rating],
                        ]);
                        homePair[0].matchResultHistory = getUpdatedMatchResultHistory(homePair[0].matchResultHistory, 'W');
                        homePair[1].matchResultHistory = getUpdatedMatchResultHistory(homePair[1].matchResultHistory, 'W');
                        awayPair[0].matchResultHistory = getUpdatedMatchResultHistory(awayPair[0].matchResultHistory, 'L');
                        awayPair[1].matchResultHistory = getUpdatedMatchResultHistory(awayPair[1].matchResultHistory, 'L');
                    } else {
                        [[newHomePair0Rating, newHomePair1Rating], [newAwayPair0Rating, newAwayPair1Rating]] = rate([
                            [awayPair[0].rating, awayPair[1].rating],
                            [homePair[0].rating, homePair[1].rating],
                        ]);
                        awayPair[0].matchResultHistory = getUpdatedMatchResultHistory(awayPair[0].matchResultHistory, 'W');
                        awayPair[1].matchResultHistory = getUpdatedMatchResultHistory(awayPair[1].matchResultHistory, 'W');
                        homePair[0].matchResultHistory = getUpdatedMatchResultHistory(homePair[0].matchResultHistory, 'L');
                        homePair[1].matchResultHistory = getUpdatedMatchResultHistory(homePair[1].matchResultHistory, 'L');
                    }
                    homePair[0].rating = newHomePair0Rating;
                    homePair[1].rating = newHomePair1Rating;
                    awayPair[0].rating = newAwayPair0Rating;
                    awayPair[1].rating = newAwayPair1Rating;
                }

                // Work out the order to return the players to the queue in
                let playersInReturnOrder: TPlayer[] = [];
                if (state.gamePreferences.returnOrder === 0) {
                    // random order
                    let returnToQueueIndex = [0, 1, 2, 3];
                    let players = [...homePair, ...awayPair];
                    returnToQueueIndex = shuffle(returnToQueueIndex);
                    playersInReturnOrder = returnToQueueIndex.map((i) => players[i]);
                } else if (state.gamePreferences.returnOrder === 1) {
                    // winners returned first
                    if (homeScore > awayScore) {
                        playersInReturnOrder = [...homePair, ...awayPair];
                    } else {
                        playersInReturnOrder = [...awayPair, ...homePair];
                    }
                } else if (state.gamePreferences.returnOrder === 2) {
                    // interleaving pairs
                    playersInReturnOrder = [homePair[0], awayPair[0], homePair[1], awayPair[1]];
                }

                // Return the players and update their stats
                playersInReturnOrder.forEach((player, i) => {
                    player.playStatus = (Date.now() + i * 10).toString();
                    state.players.set(player.id, player);
                    updatePlayer(player.id, player);
                    state.addPlayerToQueue(player);
                });

                state.courts = [];

                resetCourt(court.id);
            });
        },

        courts: [] as TCourt[],
        setCourts: (courts) =>
            set((state) => {
                state.courts = courts;
            }),

        addPlayerToQueue: (player) => {
            set((state) => {
                state.playersInQueue.set(player.id, player);
                state.players.delete(player.id);
            });
            if (Number(player.playStatus) > 2) {
                // If the playStatus was manually set to a time, then use it
                updatePlayerPlayStatus(player.id, player.playStatus);
            } else {
                updatePlayerPlayStatus(player.id, Date.now().toString());
            }
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

        isEndMatchModalOpen: null,
        setIsEndMatchModalOpen: (court: TCourt | null) =>
            set((state) => {
                state.isEndMatchModalOpen = court;
            }),

        isSwapPlayerModalOpen: null,
        setIsSwapPlayerModalOpen: (player: TPlayer | null) =>
            set((state) => {
                state.isSwapPlayerModalOpen = player;
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
            maxCourts: 3,
            pairChoicePreference: 0.5,
            returnOrder: 2,
            mixItUpNumber: 2,
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
