export class Tile {
    constructor(row, col) {
        this._status = "hidden";
        this._isBomb = false;
        this._adjacentBombCount = 0;
        this.row = row;
        this.col = col;
    }
    setStatus(status) {
        this._status = status;
    }
    get status() {
        return this._status;
    }
    setAdjacentBombCount(count) {
        this._adjacentBombCount = count;
    }
    get adjacentBombCount() {
        return this._adjacentBombCount;
    }
    setBomb() {
        this._isBomb = true;
    }
    isBomb() {
        return this._isBomb ? true : false;
    }
    reveal() {
        if (this._status !== "hidden")
            return false;
        this._status = "revealed";
        return true;
    }
    isFlagged() {
        return (this._status === "flagged") ? true : false;
    }
}
