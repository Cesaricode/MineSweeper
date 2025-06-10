export class SoundManager {
    constructor() {
        this._tileClickSound = new Audio("./sounds/tileclicksound.flac");
        this._bombClickSound = new Audio("./sounds/bombsound.wav");
        this._victorySound = new Audio("./sounds/victorysound.wav");
        this._flagSound = new Audio("./sounds/flagsound.wav");
        this._muted = false;
    }
    setMuted(muted) {
        this._muted = muted;
    }
    get muted() {
        return this._muted;
    }
    playTileClick() {
        if (this._muted)
            return;
        this._tileClickSound.currentTime = 0;
        this._tileClickSound.play().catch(() => { });
    }
    playBomb() {
        if (this._muted)
            return;
        this._bombClickSound.currentTime = 0;
        this._bombClickSound.play().catch(() => { });
    }
    playVictory() {
        if (this._muted)
            return;
        this._victorySound.currentTime = 0;
        this._victorySound.play().catch(() => { });
    }
    playFlag() {
        if (this._muted)
            return;
        this._flagSound.currentTime = 0;
        this._flagSound.play().catch(() => { });
    }
}
