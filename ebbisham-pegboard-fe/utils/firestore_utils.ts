import { doc, updateDoc, setDoc, collection, deleteDoc } from 'firebase/firestore';
import { EPlayStatus, TCourt, TPlayer } from './types';
import { db } from '@ebb-firebase/clientApp';
import { useGlobalStore } from './store';

export const updatePlayerPlayStatus = async (playerId: string, newPlayStatus: string) => {
    const playerRef = doc(db, 'players', playerId);
    await updateDoc(playerRef, {
        playStatus: newPlayStatus,
    });
};

export const addNewPlayer = async (newPlayer: TPlayer) => {
    const newPlayerRef = doc(collection(db, 'players'));
    await setDoc(newPlayerRef, {
        name: newPlayer.name,
        gender: newPlayer.gender,
        playStatus: EPlayStatus.NOT_PLAYING,
        rating: { mu: 25, sigma: 8.333333333333334 },
        matchResultHistory: '',
        matchHistory: [],
    });
    return newPlayerRef.id;
};

export const updatePlayer = async (playerId: string, player: TPlayer) => {
    const playerRef = doc(db, 'players', playerId);
    await updateDoc(playerRef, { ...player });
};

export const addPlayersToNextOn = async (players: Map<number, TPlayer>) => {
    const sessionId = useGlobalStore.getState().sessionId;
    players.forEach(async (player, key) => {
        const nextOnRef = doc(db, 'sessions', sessionId, 'nextOn', String(key));
        await updateDoc(nextOnRef, {
            playerId: player.id,
        });
    });
};

export const resetNextOnPlayers = async () => {
    const sessionId = useGlobalStore.getState().sessionId;
    for (const i in [0, 1, 2, 3]) {
        const nextOnRef = doc(db, 'sessions', sessionId, 'nextOn', i);
        await updateDoc(nextOnRef, {
            playerId: '',
        });
    }
};

export const addNewCourt = async (newCourt: TCourt) => {
    const sessionId = useGlobalStore.getState().sessionId;
    const newCourtRef = doc(collection(db, 'sessions', sessionId, 'courts'));
    await setDoc(newCourtRef, {
        courtNumber: newCourt.courtNumber,
        matchStartTime: 0,
        players: newCourt.players,
    });
};

export const removeCourt = async (courtId: string) => {
    const sessionId = useGlobalStore.getState().sessionId;
    const deleteCourtRef = doc(db, 'sessions', sessionId, 'courts', courtId);
    await deleteDoc(deleteCourtRef);
};

export const startCourt = async (court: TCourt) => {
    const sessionId = useGlobalStore.getState().sessionId;
    const startCourtRef = doc(db, 'sessions', sessionId, 'courts', court.id);
    await updateDoc(startCourtRef, {
        ...court,
    });
    resetNextOnPlayers();
};

export const resetCourt = async (courtId: string) => {
    const sessionId = useGlobalStore.getState().sessionId;
    const resetCourtRef = doc(db, 'sessions', sessionId, 'courts', courtId);
    await updateDoc(resetCourtRef, {
        matchStartTime: 0,
        players: { 0: '', 1: '', 2: '', 3: '' },
    });
};

export const recordMatch = async (court: TCourt, homeScore: number, awayScore: number, matchEndTime: number) => {
    const sessionId = useGlobalStore.getState().sessionId;
    const newMatchRef = doc(collection(db, 'sessions', sessionId, 'matches'));
    await setDoc(newMatchRef, {
        players: court.players,
        homeScore,
        awayScore,
        matchStartTime: court.matchStartTime,
        matchEndTime,
    });
    return newMatchRef.id;
};
