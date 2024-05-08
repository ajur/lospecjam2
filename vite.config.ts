import { defineConfig } from 'vite'
import { resolve } from "path";

export default defineConfig({
    base: '/lospecjam2/',
    resolve: {
        alias: {
            "~": resolve(__dirname, "src"),
        },
    }
});
