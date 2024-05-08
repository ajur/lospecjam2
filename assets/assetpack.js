import { pixiManifest } from "@assetpack/plugin-manifest";
import { ldtk2frames } from "./ldtk2frames.js";

export default {
  entry: "./assets/raw",
  output: "./public/assets/",
  cache: false,
  // logLevel: 'verbose',
  plugins: {
    ldtk: ldtk2frames(),
    manifest: pixiManifest({
      createShortcuts: true,
      trimExtensions: true
    })
  },
};
