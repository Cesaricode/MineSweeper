export type TileStatus = "hidden" | "flagged" | "revealed" | "wrong-flag";

export class Tile {
    row: number;
    col: number;
    status: TileStatus = "hidden";
    isBomb: boolean = false;
    adjacentBombCount: number = 0;

    constructor(row: number, col: number) {
        this.row = row;
        this.col = col;
    }

    setStatus(status: TileStatus): void {
        this.status = status;
    }

    setAdjacentBombCount(count: number): void {
        this.adjacentBombCount = count;
    }

    setBomb(): void {
        this.isBomb = true;
    }
}