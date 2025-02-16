import type { Configuration } from "webpack";
import { rules } from "./webpack.rules";
import { plugins } from "./webpack.plugins";

export const mainConfig: Configuration = {
    resolve: {
        extensions: [".ts", ".js"],
    },
    entry: "./src/electron/main.ts",
    module: {
        rules,
    },
    externals: {
        "better-sqlite3": "commonjs better-sqlite3",
    },
    plugins,
};
