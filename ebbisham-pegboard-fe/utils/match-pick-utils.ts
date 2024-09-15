import { predictDraw } from 'openskill';

import { useGlobalStore } from './store';
import { TMatch, TPlayer } from './types';
import { pickRandomWeightedChoice, shuffle } from './utils';
import { FUNNY_FEMALE_RATING_CHANGE, GOOD_GAME_SEARCH_LIMIT, MIN_NUM_TO_CLUSTER } from './constants';
import skmeans from 'skmeans';
import { getMatchById } from './firestore_utils';

export const canPick: () => { pickable: boolean; reason: string } = () => {
    if (useGlobalStore.getState().playersInQueue.size < 4) {
        return { pickable: false, reason: 'Not enough players in queue' };
    } else {
        return { pickable: true, reason: '' };
    }
};

export const pickNextGame = async (): Promise<Map<number, TPlayer>> => {
    const inViewNumber = useGlobalStore.getState().gamePreferences.inViewNumber;
    const mixedPreference = useGlobalStore.getState().gamePreferences.mixedPreference;
    const playersInQueue = useGlobalStore.getState().playersInQueue;

    console.debug('Number of players set to be in view:', inViewNumber);
    console.debug('Mixed preference set to:', mixedPreference);

    if (playersInQueue.size == 4) {
        console.debug('There are only 4 players in the queue, no need to do any fancy picking');
        return new Map<number, TPlayer>(
            Array.from(playersInQueue.values()).map((pl, i) => {
                return [i, pl];
            })
        );
    }

    const chairPlayer = Array.from(playersInQueue.values())[0];
    let playersToPickFrom = Array.from(playersInQueue.values()).slice(1, Math.min(inViewNumber, playersInQueue.size)); // players that are in view, minus the chair player.

    console.debug('The chair player:', chairPlayer.name);
    console.debug('The players to pick from:', playersToPickFrom);

    let goodGameFound = false;
    let goodGameSearchAttempts = 0;

    let gameType: 'Level' | 'Mixed' | 'Funny' = 'Level';
    let nextMatchPlayers: Map<number, TPlayer> = new Map();

    let playerClusters: TPlayer[][] = [[], [], []];
    if (playersToPickFrom.length > MIN_NUM_TO_CLUSTER) {
        console.debug('Starting clustering');

        const waitTimes: number[] = [];
        playersToPickFrom.forEach((player) => {
            waitTimes.push(Date.now() - Number(player.playStatus));
        });
        console.debug('Wait times:', waitTimes);

        const clusters = skmeans(waitTimes, 3, 'kmpp'); // splitting into 3 clusters
        clusters.idxs.forEach((clusterIdx, i) => {
            playerClusters[clusterIdx].push(playersToPickFrom[i]);
        });
        console.debug('Clusters:', playerClusters);
    } else {
        console.debug('Not enough people in the queue to cluster');
    }

    console.debug('~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
    console.debug('~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
    console.debug('STARTING SELECTION ALGORITHM');
    console.debug();
    while (!goodGameFound || goodGameSearchAttempts < GOOD_GAME_SEARCH_LIMIT) {
        goodGameSearchAttempts++;

        // #########################################################################################
        //                                      PICK A GAME TYPE
        // #########################################################################################
        console.debug('===================');
        console.debug('Picking a game type');
        console.debug('Attempt', goodGameSearchAttempts, 'out of', GOOD_GAME_SEARCH_LIMIT);
        console.debug('===================');

        // Get the players in view with the same gender as the chair
        const playersInViewMatchingChairGender = playersToPickFrom.filter((player) => player.id !== chairPlayer.id && player.gender === chairPlayer.gender);
        console.debug('Players in view with the same gender as the chair', playersInViewMatchingChairGender);

        // Get the players in view with the opposite gender as the chair
        const playersInViewNotMatchingChairGender = playersToPickFrom.filter((player) => player.id !== chairPlayer.id && player.gender !== chairPlayer.gender);
        console.debug('Players in view with the opposite gender as the chair', playersInViewNotMatchingChairGender);

        // Weight the players depending on how close they are to the front of the queue
        const matchingGenderWeighting = playersInViewMatchingChairGender.reduce((sum, player) => {
            return sum + (playersToPickFrom.length - playersToPickFrom.indexOf(player) - 1);
        }, 0);
        console.debug('Matching gender weighting', matchingGenderWeighting);
        const notMatchingGenderWeighting = playersInViewNotMatchingChairGender.reduce((sum, player) => {
            return sum + (playersToPickFrom.length - playersToPickFrom.indexOf(player) - 1);
        }, 0);
        console.debug('Not matching gender weighting', notMatchingGenderWeighting);

        // Level Doubles is possible if the number of players in view with the same gender as the chair is >=3
        let levelDoublesPossible = false;
        if (playersInViewMatchingChairGender.length >= 3) {
            levelDoublesPossible = true;
        }
        console.debug('Level doubles possible?', levelDoublesPossible);

        // Mixed Doubles is possible if the number of players in view with the same gender as the chair is >=1 and with the opposite gender is >=2
        let mixedDoublesPossible = false;
        if (playersInViewMatchingChairGender.length >= 1 && playersInViewNotMatchingChairGender.length >= 2) {
            mixedDoublesPossible = true;
        }
        console.debug('Mixed double possible?', mixedDoublesPossible);

        // Funny Doubles is possible if both Level and Mixed Doubles are not possible
        let funnyDoublesPossible = false;
        if (!levelDoublesPossible && !mixedDoublesPossible) {
            funnyDoublesPossible = true;
        }
        console.debug('Funny doubles possible?', funnyDoublesPossible);

        const LevelDoublesWeight = +levelDoublesPossible * (matchingGenderWeighting / (matchingGenderWeighting + notMatchingGenderWeighting)) * (1 - mixedPreference);
        console.debug('Level doubles weighting', LevelDoublesWeight);

        const MixedDoublesWeight = +mixedDoublesPossible * (1 - LevelDoublesWeight);
        console.debug('Mixed doubles weighting', MixedDoublesWeight);

        const funnyDoublesWeight = +funnyDoublesPossible;
        console.debug('Funny doubles weighting', funnyDoublesWeight);

        // Pick game type randomly with weighting
        gameType = pickRandomWeightedChoice(['Level', 'Mixed', 'Funny'], [LevelDoublesWeight, MixedDoublesWeight, funnyDoublesWeight]);
        console.debug('Game type picked:', gameType);

        // #########################################################################################
        //                          EXTRACT THE PLAYERS FOR THE CHOSEN GAME TYPE
        // #########################################################################################
        console.debug('===================');
        console.debug('Extracting players for game type');
        console.debug('===================');
        nextMatchPlayers = new Map<number, TPlayer>([[0, chairPlayer]]);
        if (gameType === 'Level') {
            [...playersInViewMatchingChairGender.slice(0, 3)].forEach((pl, i) => {
                nextMatchPlayers.set(i + 1, pl);
            });
        } else if (gameType === 'Mixed') {
            nextMatchPlayers.set(1, [...playersInViewNotMatchingChairGender.slice(0, 1)][0]);
            nextMatchPlayers.set(2, [...playersInViewMatchingChairGender.slice(0, 1)][0]);
            nextMatchPlayers.set(3, [...playersInViewNotMatchingChairGender.slice(1, 2)][0]);
        } else if (gameType === 'Funny') {
            [...playersToPickFrom.slice(1, 4)].forEach((pl, i) => {
                nextMatchPlayers.set(i + 1, pl);
            });
        }

        console.debug('Picked players, not necessarily in this order', new Map(nextMatchPlayers));

        // #########################################################################################
        //                                    SHUFFING QUEUE IF NEEDED
        // #########################################################################################
        if (playersToPickFrom.length > MIN_NUM_TO_CLUSTER) {
            console.debug('===================');
            console.debug('Shuffling queue if needed');
            console.debug('===================');
            // Find the number of overlaps between this match and the previous couple of matches for each of the players selected
            const overlappingCounts = await findOverlappingCounts(nextMatchPlayers);

            console.debug('Overlapping counts:', overlappingCounts);

            const maxOverlap = Math.max(...overlappingCounts);
            console.debug('Max overlap', maxOverlap);

            // There is at least one players with too many overlapping players with their previous matches, lets mix up players to try and get a better selection in the next iteration
            if (maxOverlap > useGlobalStore.getState().gamePreferences.mixItUpNumber) {
                if (goodGameSearchAttempts > 2) {
                    console.debug('Tried 2 times already, going to merge clusters');
                    const firstCluster = [...playerClusters[0], ...playerClusters[1]]; // merge the first two clusters
                    const secondCluster = [...playerClusters[2]]; // move whatever is in the third cluster to the second ready for if we need to merge again. This could be empty.
                    const thirdCluster: TPlayer[] = [];
                    playerClusters = [firstCluster, secondCluster, thirdCluster];
                    console.debug('New clusters after merging:', playerClusters);
                }

                console.debug('Shuffling player clusters');
                for (let index = 0; index < playerClusters.length; index++) {
                    let shuffleAttempts = 0;
                    while (shuffleAttempts < 10) {
                        if (playerClusters[index].length > 0) {
                            const shuffledCluster = shuffle(playerClusters[index]);
                            if (JSON.stringify(shuffledCluster) === JSON.stringify(playerClusters[index])) {
                                playerClusters[index] = shuffledCluster;
                                break;
                            }
                        }
                    }
                }
                console.debug('New clusters after shuffling:', playerClusters);

                playersToPickFrom = playerClusters.flat();
            } else {
                console.debug('The number of overlaps is below the mix it up number, this is a good game!');
                goodGameFound = true;
                break;
            }
        } else {
            console.debug('Not enough players to try and mix it up, have to settle for what was picked');
            goodGameFound = true;
            break;
        }
    }

    // #########################################################################################
    //                                  SELECT PAIRING WITH RATING
    // #########################################################################################
    console.debug('===================');
    console.debug('Selecting pairing with rating');
    console.debug('===================');
    if (gameType === 'Funny') {
        console.debug('Lowering females ratings to get best pairing');
        nextMatchPlayers.forEach((pl, i) => {
            if (pl.gender === 'F') {
                nextMatchPlayers.set(i, { ...pl, rating: { mu: pl.rating.mu - FUNNY_FEMALE_RATING_CHANGE, sigma: pl.rating.sigma } });
            }
        });
    }

    // Extract the possible combinations of pairings depending on the type of gameType that was chosen
    let possiblePairs: TPlayer[][];
    if (gameType === 'Level' || gameType === 'Funny') {
        possiblePairs = [Array.from(nextMatchPlayers.values()), [nextMatchPlayers.get(0) as TPlayer, nextMatchPlayers.get(2) as TPlayer, nextMatchPlayers.get(1) as TPlayer, nextMatchPlayers.get(3) as TPlayer], [nextMatchPlayers.get(0) as TPlayer, nextMatchPlayers.get(3) as TPlayer, nextMatchPlayers.get(2) as TPlayer, nextMatchPlayers.get(1) as TPlayer]];
    } else {
        possiblePairs = [Array.from(nextMatchPlayers.values()), [nextMatchPlayers.get(0) as TPlayer, nextMatchPlayers.get(3) as TPlayer, nextMatchPlayers.get(2) as TPlayer, nextMatchPlayers.get(1) as TPlayer]];
    }
    console.debug('Possible pairs to test ratings with', possiblePairs);

    // ? Iterate possiblePairs, if pair played together in last or penultimate match, remove entry from possiblePairs

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
    console.debug('Possible match qualities weighting', possibleMatchQualitiesWeighting);

    const pickedPairs = pickRandomWeightedChoice(possiblePairs, possibleMatchQualitiesWeighting);
    pickedPairs.forEach((player, i) => {
        nextMatchPlayers.set(i, player);
    });
    console.debug('Picked next match:', nextMatchPlayers);

    console.debug();
    console.debug('~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
    console.debug('~~~~~~~~~~~~~~~~~~~~~~~~~~~~');

    return nextMatchPlayers;
};

async function findOverlappingCounts(nextMatchPlayers: Map<number, TPlayer>) {
    const overlappingCounts: number[] = [];
    for (const pl of Array.from(nextMatchPlayers.values())) {
        console.debug('Player:', pl.name);

        const lastMatch = await getMatchById(pl.matchHistory[pl.matchHistory.length - 1]);
        const penultimateMatch = await getMatchById(pl.matchHistory[pl.matchHistory.length - 2]);

        console.debug('Last match:', lastMatch);
        console.debug('Penultimate match:', penultimateMatch);

        if (!lastMatch && !penultimateMatch) {
            console.debug('No previous matched so no overlap');
            overlappingCounts.push(0);
        } else if (lastMatch && !penultimateMatch) {
            console.debug('Only one previous match');
            const previousPlayersSet = new Set([...Object.values(lastMatch.players)]);
            const nextPlayersSet = new Set(Array.from(nextMatchPlayers.values()).map((player) => player.id));
            console.debug('Previous players:', previousPlayersSet);
            console.debug('Next players:', nextPlayersSet);
            console.debug('Overlapping players', previousPlayersSet.intersection(nextPlayersSet));
            overlappingCounts.push(previousPlayersSet.intersection(nextPlayersSet).size);
        } else if (lastMatch && penultimateMatch) {
            const previousPlayersSet = new Set([...Object.values(lastMatch.players), ...Object.values(penultimateMatch.players)]);
            const nextPlayersSet = new Set(Array.from(nextMatchPlayers.values()).map((player) => player.id));
            console.debug('Previous players:', previousPlayersSet);
            console.debug('Next players:', nextPlayersSet);
            console.debug('Overlapping players', previousPlayersSet.intersection(nextPlayersSet));
            overlappingCounts.push(previousPlayersSet.intersection(nextPlayersSet).size);
        }
    }

    return overlappingCounts;
}
