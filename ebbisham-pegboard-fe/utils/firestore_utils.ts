import { doc, updateDoc, setDoc, collection } from 'firebase/firestore';
import { EPlayStatus, TPlayer } from './types';
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
        win: 0,
        loss: 0,
        playStatus: EPlayStatus.NOT_PLAYING,
    });
    return newPlayerRef.id;
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
