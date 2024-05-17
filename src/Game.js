import { GameScene } from "~/game/GameScene.js";
import { MainMenu } from "~/ui/MainMenu.js";
import { addDebugPane } from "~/fw/debug.js";


const DEFAULT_SETTINGS = {
  friendlyFire: true,
  friendlyCollisions: true,
  freeMovement: false,
  // TODO volume etc
};


export class Game {
  constructor(app) {
    this.app = app;
    this.currentScene = null;
  }

  setScene(scene) {
    const prevScene = this.currentScene;
    this.currentScene = scene;
    this.app.stage.addChild(scene);
    if (prevScene) prevScene.destroy({children: true});
  }

  mainMenu() {
    this.setScene(new MainMenu(this))
  }

  newGame() {
    this.setScene(new GameScene(this));
  }

  pause() {

  }
}

