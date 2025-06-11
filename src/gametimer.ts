export class GameTimer {
    private _timerIntervalId: number | null = null;
    private _startTime: number = 0;
    private _elapsedTime: number = 0;
    private _timerRunning: boolean = false;
    private _onTick: ((elapsed: number) => void) | null = null;

    public onTick(callback: (elapsed: number) => void) {
        this._onTick = callback;
    }

    public startTimer(): void {
        if (this._timerRunning) return;
        this._startTime = Date.now() - this._elapsedTime;
        this._timerRunning = true;

        this._timerIntervalId = window.setInterval(() => {
            this._elapsedTime = Date.now() - this._startTime;
            if (this._onTick) this._onTick(this._elapsedTime);
        }, 1000);
        if (this._onTick) this._onTick(this._elapsedTime);
    }

    public stopTimer(): void {
        if (this._timerIntervalId !== null) {
            window.clearInterval(this._timerIntervalId);
            this._timerIntervalId = null;
            this._timerRunning = false;
        }
    }

    public resetTimer(): void {
        this.stopTimer();
        this._elapsedTime = 0;
        if (this._onTick) this._onTick(this._elapsedTime);
    }

    public setElapsedTime(time: number): void {
        this._elapsedTime = time;
    }

    public get elapsedTime(): number {
        return this._elapsedTime;
    }

}