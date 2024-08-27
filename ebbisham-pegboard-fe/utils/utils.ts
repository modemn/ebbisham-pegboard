// Randomly shuffles elements in an array
export const shuffle = (array: Array<any>) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

export function pickRandomWeightedChoice<T>(items: Array<T>, weights: Array<number>): T {
    let i;
    for (i = 1; i < weights.length; i++) weights[i] += weights[i - 1];
    const random = Math.random() * weights[weights.length - 1];
    for (i = 0; i < weights.length; i++) if (weights[i] > random) break;
    return items[i];
}

export const getUpdatedMatchResultHistory = (currentMatchHistory: string, newMatchResult: 'W' | 'L'): string => {
    if (currentMatchHistory.length >= 5) {
        currentMatchHistory = currentMatchHistory.slice(1);
    }
    return currentMatchHistory + newMatchResult;
};

export const getUpdatedMatchHistory = (currentMatchHistory: string[], newMatchId: string): string[] => {
    if (currentMatchHistory.length >= 5) {
        currentMatchHistory.shift();
    }
    currentMatchHistory.push(newMatchId);
    return currentMatchHistory;
};
