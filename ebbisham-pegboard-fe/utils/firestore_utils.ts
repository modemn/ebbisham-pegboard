import { doc, updateDoc, setDoc, collection } from 'firebase/firestore';
import { TPlayStatus, TPlayer } from './types';
import { db } from '@ebb-firebase/clientApp';

export const updatePlayerPlayStatus = async (playerId: string, newPlayStatus: TPlayStatus) => {
    const playerRef = doc(db, 'users', playerId);
    await updateDoc(playerRef, {
        playStatus: newPlayStatus,
    });
};

export const addNewPlayer = async (newPlayer: TPlayer) => {
    const newPlayerRef = doc(collection(db, 'users'));
    await setDoc(newPlayerRef, {
        name: newPlayer.name,
        gender: newPlayer.gender,
        playStatus: newPlayer.playStatus,
    });
    return newPlayerRef.id;
};
