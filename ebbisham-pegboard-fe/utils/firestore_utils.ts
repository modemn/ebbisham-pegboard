import { doc, updateDoc, setDoc, collection } from 'firebase/firestore';
import { EPlayStatus, TPlayer } from './types';
import { db } from '@ebb-firebase/clientApp';

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
