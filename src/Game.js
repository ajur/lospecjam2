import { GameScene } from "~/game/GameScene.js";
import { MainMenu } from "~/ui/MainMenu.js";
import { addDebugPane } from "~/fw/debug.js";
import { localStoredData } from "~/fw/store.js";

const DEFAULT_SETTINGS = {
  friendlyFire: true,
  friendlyCollisions: true,
  freeMovement: false,
  randomMap: true
  // TODO volume etc
};

export class Game {
  constructor(app) {
    this.app = app;
    this.currentScene = null;

    this.player1controller = null;
    this.player2controller = null;

    this.settings = localStoredData("gameSettings", DEFAULT_SETTINGS);
    addDebugPane("Settings", (pane) => {
      pane.expanded = false;
      for (const k of Object.keys(this.settings)) {
        pane.addBinding(this.settings, k);
      }
      pane.addButton({ title: "reset defaults" }).on("click", () => {
        Object.assign(this.settings, DEFAULT_SETTINGS);
        pane.refresh();
      });
    });
  }

  addPlayerController(controller) {
    if (this.player1controller === controller) {
      this.player1controller = null;
    } else if (this.player2controller === controller) {
      this.player2controller = null;
    } else if (!this.player1controller) {
      this.player1controller = controller;
    } else if (!this.player2controller) {
      this.player2controller = controller;
    }
  }

  setScene(scene) {
    const prevScene = this.currentScene;
    this.currentScene = scene;
    this.app.stage.addChild(scene);
    if (prevScene) prevScene.destroy({ children: true });
  }

  mainMenu() {
    this.setScene(new MainMenu(this));
  }

  newGame() {
    this.setScene(new GameScene(this, this.player1controller, this.player2controller));
  }

}
