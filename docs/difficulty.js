export const difficultyBombRange = {
    easy: [0.08, 0.12],
    medium: [0.13, 0.17],
    hard: [0.20, 0.25],
    brutal: [0.30, 0.35],
    impossible: [0.40, 0.50],
};
export function getBombCount(rows, cols, difficulty) {
    const [min, max] = difficultyBombRange[difficulty];
    const percentage = Math.random() * (max - min) + min;
    return Math.floor(rows * cols * percentage);
}
