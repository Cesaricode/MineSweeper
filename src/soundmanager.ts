export class SoundManager {
    private _tileClickSound: HTMLAudioElement = new Audio("./sounds/tileclicksound.wav");
    private _bombClickSound: HTMLAudioElement = new Audio("./sounds/bombsound.wav");
    private _victorySound: HTMLAudioElement = new Audio("./sounds/victorysound.wav");
    private _flagSound: HTMLAudioElement = new Audio("./sounds/flagsound.wav");
    private _muted: boolean = false;

    public setMuted(muted: boolean): void {
        this._muted = muted;
    }

    public get muted(): boolean {
        return this._muted;
    }

    public playTileClick(): void {
        if (this._muted) return;
        this._tileClickSound.currentTime = 0.06;
        this._tileClickSound.play().catch(() => { });
    }

    public playBomb(): void {
        if (this._muted) return;
        this._bombClickSound.currentTime = 0;
        this._bombClickSound.play().catch(() => { });
    }

    public playVictory(): void {
        if (this._muted) return;
        this._victorySound.currentTime = 0;
        this._victorySound.play().catch(() => { });
    }

    public playFlag(): void {
        if (this._muted) return;
        this._flagSound.currentTime = 0;
        this._flagSound.play().catch(() => { });
    }
}