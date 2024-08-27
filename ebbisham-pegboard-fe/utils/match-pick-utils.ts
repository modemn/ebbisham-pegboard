import { predictDraw } from 'openskill';

import { useGlobalStore } from './store';
import { TPlayer } from './types';
import { pickRandomWeightedChoice } from './utils';

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
        [...playersInView.slice(1, 4)].forEach((pl, i) => {
            players.set(i + 1, pl);
        });
    }

    // TODO: check the last matches of all the players and mix it up in clusters if the number of people playing in this match and their last match exceeds the mixItUpNumber

    if (gameType === 'Funny') {
        players.forEach((pl, i) => {
            if (pl.gender === 'F') {
                players.set(i, { ...pl, rating: { mu: pl.rating.mu - 10, sigma: pl.rating.sigma } });
            }
        });
    }

    // Extract the possible combinations of pairings depending on the type of gameType that was chosen
    let possiblePairs: TPlayer[][];
    if (gameType === 'Level' || gameType === 'Funny') {
        possiblePairs = [Array.from(players.values()), [players.get(0) as TPlayer, players.get(2) as TPlayer, players.get(1) as TPlayer, players.get(3) as TPlayer], [players.get(0) as TPlayer, players.get(3) as TPlayer, players.get(2) as TPlayer, players.get(1) as TPlayer]];
    } else {
        possiblePairs = [Array.from(players.values()), [players.get(0) as TPlayer, players.get(3) as TPlayer, players.get(2) as TPlayer, players.get(1) as TPlayer]];
    }

    // Extract the weighting of the matches depending on the quality and pairChoicePreference for all the combinations of pairings
    const possibleMatchQualitiesWeighting: number[] = [];
    possiblePairs.forEach((possiblePair) => {
        const matchQuality = predictDraw([
            [
                { mu: possiblePair[0].rating.mu, sigma: possiblePair[0].rating.sigma },
                { mu: possiblePair[1].rating.mu, sigma: possiblePair[1].rating.sigma },
            ],
            [
                { mu: possiblePair[2].rating.mu, sigma: possiblePair[2].rating.sigma },
                { mu: possiblePair[3].rating.mu, sigma: possiblePair[3].rating.sigma },
            ],
        ]);
        possibleMatchQualitiesWeighting.push((10 * (matchQuality as number)) ** useGlobalStore.getState().gamePreferences.pairChoicePreference);
    });

    // Pick the pairing with the pairs and weightings calculated above
    const pickedPairs = pickRandomWeightedChoice(possiblePairs, possibleMatchQualitiesWeighting);
    pickedPairs.forEach((player, i) => {
        players.set(i, player);
    });

    // TODO: making sure this is a 'good' choice of pairing by looking at previous matches and switching up the pairings so people play with someone new

    return players;
};
