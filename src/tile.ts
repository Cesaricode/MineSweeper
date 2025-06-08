export type TileStatus = "hidden" | "flagged" | "revealed" | "wrong-flag";

export class Tile {
    readonly row: number;
    readonly col: number;
    private _status: TileStatus = "hidden";
    private _isBomb: boolean = false;
    private _adjacentBombCount: number = 0;

    constructor(row: number, col: number) {
        this.row = row;
        this.col = col;
    }

    public setStatus(status: TileStatus): void {
        this._status = status;
    }

    public get status(): TileStatus {
        return this._status;
    }

    public setAdjacentBombCount(count: number): void {
        this._adjacentBombCount = count;
    }

    public get adjacentBombCount(): number {
        return this._adjacentBombCount;
    }

    public setBomb(): void {
        this._isBomb = true;
    }

    public isBomb(): boolean {
        return this._isBomb ? true : false;
    }

    public reveal(): boolean {
        if (this._status !== "hidden") return false;
        this._status = "revealed";
        return true;
    }

    public isFlagged(): boolean {
        return (this._status === "flagged") ? true : false;
    }
}