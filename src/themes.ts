export type ThemeConfig = {
    title: string;
    bombName: string;
    colors: {
        primary: string;
        flagged: string;
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
        },
        icon: "💣",
    },
    turtlesweeper: {
        title: "TurtleSweeper",
        bombName: "Turtles",
        colors: {
            primary: "#66bb6a",
            flagged: "#aed581",
        },
        icon: "🐢",
    },
    beersweeper: {
        title: "BeerSweeper",
        bombName: "Beers",
        colors: {
            primary: "#ffb74d",
            flagged: "#ffe082",
        },
        icon: "🍺",
    },
    lovesweeper: {
        title: "LoveSweeper",
        bombName: "Hearts",
        colors: {
            primary: "#e91e63",
            flagged: "#f06292",
        },
        icon: "❤️",
    },
    cookiesweeper: {
        title: "CookieSweeper",
        bombName: "Cookies",
        colors: {
            primary: "#d7a86e",
            flagged: "#ffe0b2",
        },
        icon: "🍪",
    },
    catsweeper: {
        title: "CatSweeper",
        bombName: "Cats",
        colors: {
            primary: "#a9746e",
            flagged: "#ffd9d0",
        },
        icon: "🐱",
    },
    aliensweeper: {
        title: "AlienSweeper",
        bombName: "Aliens",
        colors: {
            primary: "#00e676",
            flagged: "#69f0ae",
        },
        icon: "👽",
    },
    frogsweeper: {
        title: "FrogSweeper",
        bombName: "Frogs",
        colors: {
            primary: "#76ff03",
            flagged: "#ccff90",
        },
        icon: "🐸",
    },
    gemsweeper: {
        title: "GemSweeper",
        bombName: "Gems",
        colors: {
            primary: "#40c4ff",
            flagged: "#81d4fa",
        },
        icon: "💎",
    },
    cupcakesweeper: {
        title: "CupcakeSweeper",
        bombName: "Cupcakes",
        colors: {
            primary: "#ce93d8",
            flagged: "#f8bbd0",
        },
        icon: "🧁",
    },
    icesweeper: {
        title: "IceSweeper",
        bombName: "Icecubes",
        colors: {
            primary: "#80deea",
            flagged: "#b2ebf2",
        },
        icon: "🧊",
    },
    volcanosweeper: {
        title: "VolcanoSweeper",
        bombName: "Volcanoes",
        colors: {
            primary: "#ef5350",
            flagged: "#ff8a65",
        },
        icon: "🌋",
    },
    controllersweeper: {
        title: "ControllerSweeper",
        bombName: "Controllers",
        colors: {
            primary: "#ff4081",
            flagged: "#f48fb1",
        },
        icon: "🕹️",
    },
    dragonsweeper: {
        title: "DragonSweeper",
        bombName: "Dragons",
        colors: {
            primary: "#f44336",
            flagged: "#ff8a65",
        },
        icon: "🐲",
    },
    potionsweeper: {
        title: "PotionSweeper",
        bombName: "Potions",
        colors: {
            primary: "#ab47bc",
            flagged: "#e1bee7",
        },
        icon: "🧪",
    },
    ghostsweeper: {
        title: "GhostSweeper",
        bombName: "Ghosts",
        colors: {
            primary: "#bdbdbd",
            flagged: "#eeeeee",
        },
        icon: "👻",
    },
    scrollsweeper: {
        title: "ScrollSweeper",
        bombName: "Scrolls",
        colors: {
            primary: "#ffe082",
            flagged: "#fff9c4",
        },
        icon: "📜",
    },
    whiskysweeper: {
        title: "WhiskySweeper",
        bombName: "Glasses",
        colors: {
            primary: "#d2691e",
            flagged: "#ffcc80",
        },
        icon: "🥃",
    },
    zombiesweeper: {
        title: "ZombieSweeper",
        bombName: "Zombies",
        colors: {
            primary: "#81d4fa",
            flagged: "#ffd54f",
        },
        icon: "🧟",
    },
};
