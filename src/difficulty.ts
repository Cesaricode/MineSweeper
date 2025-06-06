export const difficultyBombRange: Record<string, [number, number]> = {
    easy: [0.08, 0.12],
    medium: [0.13, 0.17],
    hard: [0.20, 0.25],
};

export type Difficulty = keyof typeof difficultyBombRange;

export function getBombCount(rows: number, cols: number, difficulty: Difficulty): number {
    const [min, max] = difficultyBombRange[difficulty];
    const percentage = Math.random() * (max - min) + min;
    return Math.floor(rows * cols * percentage);
}