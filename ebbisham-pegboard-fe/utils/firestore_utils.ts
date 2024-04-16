import { doc, updateDoc, setDoc, collection } from 'firebase/firestore';
import { TPlayer } from './types';
import { db } from '@ebb-firebase/clientApp';
import { useGlobalStore } from './store';

export const updatePlayerPlayStatus = async (playerId: string, newPlayStatus: string) => {
    const sessionId = useGlobalStore.getState().sessionId;
    const playerRef = doc(db, 'sessions', sessionId, 'players', playerId);
    await updateDoc(playerRef, {
        playStatus: newPlayStatus,
    });
};

export const addNewPlayer = async (newPlayer: TPlayer) => {
    const sessionId = useGlobalStore.getState().sessionId;
    const newPlayerRef = doc(collection(db, 'sessions', sessionId, 'players'));
    await setDoc(newPlayerRef, {
        name: newPlayer.name,
        gender: newPlayer.gender,
        playStatus: newPlayer.playStatus,
    });
    return newPlayerRef.id;
};
