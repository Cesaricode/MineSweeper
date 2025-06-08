export type ThemeConfig = {
    title: string;
    bombName: string;
    colors: {
        primary: string;
        flagged: string;
        bomb: string;
        [key: string]: string;
    };
    icon: string;
};

export type ThemeKey = keyof typeof themes;

export const themes: Record<string, ThemeConfig> = {
    minesweeper: {
        title: "MineSweeper",
        bombName: "Mine",
        colors: {
            primary: "#9e9e9e",
            flagged: "#cfd8dc",
            bomb: "#d32f2f",
        },
        icon: "💣",
    },
    turtlesweeper: {
        title: "TurtleSweeper",
        bombName: "Turtle",
        colors: {
            primary: "#66bb6a",
            flagged: "#aed581",
            bomb: "#388e3c",
        },
        icon: "🐢",
    },
    beersweeper: {
        title: "BeerSweeper",
        bombName: "Beer",
        colors: {
            primary: "#ffb74d",
            flagged: "#ffe082",
            bomb: "#6d4c41",
        },
        icon: "🍺",
    },
    lovesweeper: {
        title: "LoveSweeper",
        bombName: "Heart",
        colors: {
            primary: "#e91e63",
            flagged: "#f06292",
            bomb: "#ad1457",
        },
        icon: "❤️",
    },
    cookiesweeper: {
        title: "CookieSweeper",
        bombName: "Cookie",
        colors: {
            primary: "#d7a86e",
            flagged: "#ffe0b2",
            bomb: "#5d4037",
        },
        icon: "🍪",
    },
    catsweeper: {
        title: "CatSweeper",
        bombName: "Cat",
        colors: {
            primary: "#6a1b9a",
            flagged: "#f8bbd0",
            bomb: "#4a148c",
        },
        icon: "🐱",
    },
    aliensweeper: {
        title: "AlienSweeper",
        bombName: "Alien",
        colors: {
            primary: "#00e676",
            flagged: "#69f0ae",
            bomb: "#1b5e20",
        },
        icon: "👽",
    },
    frogsweeper: {
        title: "FrogSweeper",
        bombName: "Frog",
        colors: {
            primary: "#76ff03",
            flagged: "#ccff90",
            bomb: "#33691e",
        },
        icon: "🐸",
    },
    gemsweeper: {
        title: "GemSweeper",
        bombName: "Gem",
        colors: {
            primary: "#40c4ff",
            flagged: "#81d4fa",
            bomb: "#0277bd",
        },
        icon: "💎",
    },
    bonesweeper: {
        title: "BoneSweeper",
        bombName: "Bone",
        colors: {
            primary: "#5d4037",
            flagged: "#fceabb",
            bomb: "#3e2723",
        },
        icon: "🦴",
    },
    cupcakesweeper: {
        title: "CupcakeSweeper",
        bombName: "Cupcake",
        colors: {
            primary: "#ce93d8",
            flagged: "#f8bbd0",
            bomb: "#ad1457",
        },
        icon: "🧁",
    },
    icesweeper: {
        title: "IceSweeper",
        bombName: "Icecube",
        colors: {
            primary: "#80deea",
            flagged: "#b2ebf2",
            bomb: "#006064",
        },
        icon: "🧊",
    },
    volcanosweeper: {
        title: "VolcanoSweeper",
        bombName: "Volcano",
        colors: {
            primary: "#ef5350",
            flagged: "#ff8a65",
            bomb: "#bf360c",
        },
        icon: "🌋",
    },
    controllersweeper: {
        title: "ControllerSweeper",
        bombName: "Controller",
        colors: {
            primary: "#ff4081",
            flagged: "#f48fb1",
            bomb: "#880e4f",
        },
        icon: "🕹️",
    },
    dragonsweeper: {
        title: "DragonSweeper",
        bombName: "Dragon",
        colors: {
            primary: "#f44336",
            flagged: "#ff8a65",
            bomb: "#d50000",
        },
        icon: "🐲",
    },
    potionsweeper: {
        title: "PotionSweeper",
        bombName: "Potion",
        colors: {
            primary: "#ab47bc",
            flagged: "#e1bee7",
            bomb: "#4a148c",
        },
        icon: "🧪",
    },
    ghostsweeper: {
        title: "GhostSweeper",
        bombName: "Ghost",
        colors: {
            primary: "#bdbdbd",
            flagged: "#eeeeee",
            bomb: "#616161",
        },
        icon: "👻",
    },
    scrollsweeper: {
        title: "ScrollSweeper",
        bombName: "Scroll",
        colors: {
            primary: "#ffe082",
            flagged: "#fff9c4",
            bomb: "#8d6e63",
        },
        icon: "📜",
    },
    whiskeysweeper: {
        title: "WhiskeySweeper",
        bombName: "Whiskey",
        colors: {
            primary: "#d2691e",
            flagged: "#ffcc80",
            bomb: "#5d4037",
        },
        icon: "🥃",
    },
};
