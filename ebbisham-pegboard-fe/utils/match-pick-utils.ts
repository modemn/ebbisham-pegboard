import { useGlobalStore } from './store';
import { TPlayer } from './types';

const pickRandomWeightedChoice = (items: Array<any>, weights: Array<number>) => {
    let i;
    for (i = 1; i < weights.length; i++) weights[i] += weights[i - 1];
    const random = Math.random() * weights[weights.length - 1];
    for (i = 0; i < weights.length; i++) if (weights[i] > random) break;
    return items[i];
};

export const canPick: () => { pickable: boolean; reason: string } = () => {
    if (useGlobalStore.getState().playersInQueue.size < 4) {
        return { pickable: false, reason: 'Not enough players in queue' };
    } else {
        return { pickable: true, reason: '' };
    }
};

export const pickNextGame = (): Map<number, TPlayer> => {
    const inViewNumber = useGlobalStore.getState().gamePreferences.inViewNumber;
    const mixedPreference = useGlobalStore.getState().gamePreferences.mixedPreference;
    const playersInQueue = useGlobalStore.getState().playersInQueue;
    if (playersInQueue.size == 4) {
        return new Map<number, TPlayer>(
            Array.from(playersInQueue.values()).map((pl, i) => {
                return [i, pl];
            })
        );
    }
    // Get the players in view
    const playersInView = Array.from(playersInQueue.values()).slice(0, Math.min(inViewNumber, playersInQueue.size));

    const chairPlayer = playersInView[0];

    // Get the players in view with the same gender as the chair
    const playersInViewMatchingChairGender = playersInView.filter((player) => player.id !== chairPlayer.id && player.gender === playersInView[0].gender);

    // Get the players in view with the opposite gender as the chair
    const playersInViewNotMatchingChairGender = playersInView.filter((player) => player.id !== chairPlayer.id && player.gender !== playersInView[0].gender);

    // Weight the players depending on how close they are to the front of the queue
    const matchingGenderWeighting = playersInViewMatchingChairGender.reduce((sum, player) => {
        return sum + (playersInView.length - playersInView.indexOf(player) - 1);
    }, 0);
    const notMatchingGenderWeighting = playersInViewNotMatchingChairGender.reduce((sum, player) => {
        return sum + (playersInView.length - playersInView.indexOf(player) - 1);
    }, 0);

    // Level Doubles is possible if the number of players in view with the same gender as the chair is >=3
    let levelDoublesPossible = false;
    if (playersInViewMatchingChairGender.length >= 3) {
        levelDoublesPossible = true;
    }

    // Mixed Doubles is possible if the number of players in view with the same gender as the chair is >=1 and with the opposite gender is >=2
    let mixedDoublesPossible = false;
    if (playersInViewMatchingChairGender.length >= 1 && playersInViewNotMatchingChairGender.length >= 2) {
        mixedDoublesPossible = true;
    }

    // Funny Doubles is possible if both Level and Mixed Doubles are not possible
    let funnyDoublesPossible = false;
    if (!levelDoublesPossible && !mixedDoublesPossible) {
        funnyDoublesPossible = true;
    }

    // Calculate Level Doubles weighting
    const LevelDoublesWeight = +levelDoublesPossible * (matchingGenderWeighting / (matchingGenderWeighting + notMatchingGenderWeighting)) * (1 - mixedPreference);
    // Calculate Mixed Doubles weighting
    const MixedDoublesWeight = +mixedDoublesPossible * (1 - LevelDoublesWeight);
    // Calculate Funny Doubles weighting
    const funnyDoublesWeight = +funnyDoublesPossible;

    // Pick game type randomly with weighting
    const gameType = pickRandomWeightedChoice(['Level', 'Mixed', 'Funny'], [LevelDoublesWeight, MixedDoublesWeight, funnyDoublesWeight]);

    // Extract the players
    const players = new Map<number, TPlayer>([[0, chairPlayer]]);
    if (gameType === 'Level') {
        [...playersInViewMatchingChairGender.slice(0, 3)].forEach((pl, i) => {
            players.set(i + 1, pl);
        });
    } else if (gameType === 'Mixed') {
        players.set(1, [...playersInViewNotMatchingChairGender.slice(0, 1)][0]);
        players.set(2, [...playersInViewMatchingChairGender.slice(0, 1)][0]);
        players.set(3, [...playersInViewNotMatchingChairGender.slice(1, 2)][0]);
    } else if (gameType === 'Funny') {
        [...playersInViewNotMatchingChairGender.slice(0, 3)].forEach((pl, i) => {
            players.set(i + 1, pl);
        });
    }

    return players;
};
