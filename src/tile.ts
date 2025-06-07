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

    public setStatus(status: TileStatus): void {
        this.status = status;
    }

    public setAdjacentBombCount(count: number): void {
        this.adjacentBombCount = count;
    }

    public setBomb(): void {
        this.isBomb = true;
    }

    public reveal(): boolean {
        if (this.status !== "hidden") return false;
        this.status = "revealed";
        return true;
    }
}