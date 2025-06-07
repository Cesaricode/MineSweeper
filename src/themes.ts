export type ThemeConfig = {
    title: string;
    bombName: string;
    colors: {
        primary: string;
        background: string;
        tileBackground: string;
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
            primary: "#757575",
            background: "#121212",
            tileBackground: "#1e1e1e",
            flagged: "#ffb300",
            bomb: "#b00020",
        },
        icon: "💣",
    },
    turtlesweeper: {
        title: "TurtleSweeper",
        bombName: "Turtle",
        colors: {
            primary: "#66bb6a",
            background: "#121212",
            tileBackground: "#1e1e1e",
            flagged: "#ffb300",
            bomb: "#b00020",
        },
        icon: "🐢",
    },
    beersweeper: {
        title: "BeerSweeper",
        bombName: "Beer",
        colors: {
            primary: "#ffb74d",
            background: "#121212",
            tileBackground: "#1e1e1e",
            flagged: "#ffb300",
            bomb: "#b00020",
        },
        icon: "🍺",
    },
    lovesweeper: {
        title: "LoveSweeper",
        bombName: "Heart",
        colors: {
            primary: "#e91e63",
            background: "#121212",
            tileBackground: "#1e1e1e",
            flagged: "#ffb300",
            bomb: "#b00020",
        },
        icon: "❤️",
    },
    cookiesweeper: {
        title: "CookieSweeper",
        bombName: "Cookie",
        colors: {
            primary: "#d7a86e",
            background: "#121212",
            tileBackground: "#1e1e1e",
            flagged: "#ffb300",
            bomb: "#b00020",
        },
        icon: "🍪",
    },
    catsweeper: {
        title: "CatSweeper",
        bombName: "Cat",
        colors: {
            primary: "#a1887f",
            background: "#121212",
            tileBackground: "#1e1e1e",
            flagged: "#ffb300",
            bomb: "#b00020",
        },
        icon: "🐱",
    },
    aliensweeper: {
        title: "AlienSweeper",
        bombName: "Alien",
        colors: {
            primary: "#00e676",
            background: "#121212",
            tileBackground: "#1e1e1e",
            flagged: "#ffb300",
            bomb: "#b00020",
        },
        icon: "👽",
    },
};
