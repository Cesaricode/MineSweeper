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
        bombName: "Mines",
        colors: {
            primary: "#9e9e9e",
            flagged: "#cfd8dc",
            bomb: "#d32f2f",
        },
        icon: "💣",
    },
    turtlesweeper: {
        title: "TurtleSweeper",
        bombName: "Turtles",
        colors: {
            primary: "#66bb6a",
            flagged: "#aed581",
            bomb: "#388e3c",
        },
        icon: "🐢",
    },
    beersweeper: {
        title: "BeerSweeper",
        bombName: "Beers",
        colors: {
            primary: "#ffb74d",
            flagged: "#ffe082",
            bomb: "#6d4c41",
        },
        icon: "🍺",
    },
    lovesweeper: {
        title: "LoveSweeper",
        bombName: "Hearts",
        colors: {
            primary: "#e91e63",
            flagged: "#f06292",
            bomb: "#ad1457",
        },
        icon: "❤️",
    },
    cookiesweeper: {
        title: "CookieSweeper",
        bombName: "Cookies",
        colors: {
            primary: "#d7a86e",
            flagged: "#ffe0b2",
            bomb: "#5d4037",
        },
        icon: "🍪",
    },
    catsweeper: {
        title: "CatSweeper",
        bombName: "Cats",
        colors: {
            primary: "#6a1b9a",
            flagged: "#f8bbd0",
            bomb: "#4a148c",
        },
        icon: "🐱",
    },
    aliensweeper: {
        title: "AlienSweeper",
        bombName: "Aliens",
        colors: {
            primary: "#00e676",
            flagged: "#69f0ae",
            bomb: "#1b5e20",
        },
        icon: "👽",
    },
    frogsweeper: {
        title: "FrogSweeper",
        bombName: "Frogs",
        colors: {
            primary: "#76ff03",
            flagged: "#ccff90",
            bomb: "#33691e",
        },
        icon: "🐸",
    },
    gemsweeper: {
        title: "GemSweeper",
        bombName: "Gems",
        colors: {
            primary: "#40c4ff",
            flagged: "#81d4fa",
            bomb: "#0277bd",
        },
        icon: "💎",
    },
    cupcakesweeper: {
        title: "CupcakeSweeper",
        bombName: "Cupcakes",
        colors: {
            primary: "#ce93d8",
            flagged: "#f8bbd0",
            bomb: "#ad1457",
        },
        icon: "🧁",
    },
    icesweeper: {
        title: "IceSweeper",
        bombName: "Icecubes",
        colors: {
            primary: "#80deea",
            flagged: "#b2ebf2",
            bomb: "#006064",
        },
        icon: "🧊",
    },
    volcanosweeper: {
        title: "VolcanoSweeper",
        bombName: "Volcanoes",
        colors: {
            primary: "#ef5350",
            flagged: "#ff8a65",
            bomb: "#bf360c",
        },
        icon: "🌋",
    },
    controllersweeper: {
        title: "ControllerSweeper",
        bombName: "Controllers",
        colors: {
            primary: "#ff4081",
            flagged: "#f48fb1",
            bomb: "#880e4f",
        },
        icon: "🕹️",
    },
    dragonsweeper: {
        title: "DragonSweeper",
        bombName: "Dragons",
        colors: {
            primary: "#f44336",
            flagged: "#ff8a65",
            bomb: "#d50000",
        },
        icon: "🐲",
    },
    potionsweeper: {
        title: "PotionSweeper",
        bombName: "Potions",
        colors: {
            primary: "#ab47bc",
            flagged: "#e1bee7",
            bomb: "#4a148c",
        },
        icon: "🧪",
    },
    ghostsweeper: {
        title: "GhostSweeper",
        bombName: "Ghosts",
        colors: {
            primary: "#bdbdbd",
            flagged: "#eeeeee",
            bomb: "#616161",
        },
        icon: "👻",
    },
    scrollsweeper: {
        title: "ScrollSweeper",
        bombName: "Scrolls",
        colors: {
            primary: "#ffe082",
            flagged: "#fff9c4",
            bomb: "#8d6e63",
        },
        icon: "📜",
    },
    whiskeysweeper: {
        title: "WhiskeySweeper",
        bombName: "Glasses",
        colors: {
            primary: "#d2691e",
            flagged: "#ffcc80",
            bomb: "#5d4037",
        },
        icon: "🥃",
    },
    zombiesweeper: {
        title: "ZombieSweeper",
        bombName: "Zombies",
        colors: {
            primary: "#81d4fa",
            flagged: "#ffd54f",
            bomb: "#4caf50",
        },
        icon: "🧟",
    },
};
