export class GameTimer {
    constructor() {
        this._timerIntervalId = null;
        this._startTime = 0;
        this._elapsedTime = 0;
        this._timerRunning = false;
        this._onTick = null;
    }
    onTick(callback) {
        this._onTick = callback;
    }
    startTimer() {
        if (this._timerRunning)
            return;
        this._startTime = Date.now() - this._elapsedTime;
        this._timerRunning = true;
        this._timerIntervalId = window.setInterval(() => {
            this._elapsedTime = Date.now() - this._startTime;
            if (this._onTick)
                this._onTick(this._elapsedTime);
        }, 1000);
        if (this._onTick)
            this._onTick(this._elapsedTime);
    }
    stopTimer() {
        if (this._timerIntervalId !== null) {
            window.clearInterval(this._timerIntervalId);
            this._timerIntervalId = null;
            this._timerRunning = false;
        }
    }
    resetTimer() {
        this.stopTimer();
        this._elapsedTime = 0;
        if (this._onTick)
            this._onTick(this._elapsedTime);
    }
    setElapsedTime(time) {
        this._elapsedTime = time;
    }
    get elapsedTime() {
        return this._elapsedTime;
    }
}
