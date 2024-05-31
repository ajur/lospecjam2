import { GameScene } from "~/game/GameScene.js";
import { MainMenu } from "~/ui/MainMenu.js";
import { addDebugPane } from "~/fw/debug.js";
import { localStoredData } from "~/fw/store.js";
import { HEIGHT, SCOREBOARD_SIZE, WIDTH } from "~/consts.js";
import { Scoreboard } from "~/ui/Scoreboard.js";
import { Controls } from "~/ui/Controls.js";
import { About } from "~/ui/About.js";
import gsap from "gsap";


const DEFAULT_SETTINGS = {
  friendlyFire: true,
  friendlyCollisions: true,
  freeMovement: false,
  randomMap: true
  // TODO volume etc
};

const TRANSITION_DURATION = 0.5;
const FROM_TOP = {x: 0, y: 1};
const FROM_BOTTOM = {x: 0, y: -1};
const FROM_LEFT = {x: 1, y: 0};
const FROM_RIGHT = {x: -1, y: 0};

export class Game {
  constructor(app) {
    this.app = app;
    this.currentScene = null;
    this.inTransition = false;

    this.player1controller = null;
    this.player2controller = null;

    this.settings = localStoredData("gameSettings", DEFAULT_SETTINGS);
    this.scoreboard = localStoredData("scoreboard", []);

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

  setScene(scene, dir) {
    this.inTransition = true;

    scene.x = WIDTH * -dir.x;
    scene.y = HEIGHT * -dir.y;
    this.app.stage.addChild(scene);
    gsap.to(scene, {x: 0, y: 0, duration: TRANSITION_DURATION});

    if (this.currentScene) {
      gsap.to(this.currentScene, {
        x: WIDTH * dir.x,
        y: HEIGHT * dir.y,
        duration: TRANSITION_DURATION,
        onComplete: () => {
          this.currentScene.destroy({children: true});
          this.currentScene = scene;
          this.inTransition = false;
        }});
    } else {
      this.currentScene = scene;
      this.inTransition = false;
    }
  }

  gotoMainMenu(backFromSubMenu = false) {
    if (this.inTransition) return;
    this.setScene(new MainMenu(this), backFromSubMenu ? FROM_LEFT : FROM_BOTTOM);
  }

  gotoNewGame() {
    if (this.inTransition) return;
    this.setScene(new GameScene(this), FROM_TOP);
  }

  gotoScoreboard() {
    if (this.inTransition) return;
    this.setScene(new Scoreboard(this), FROM_RIGHT)
  }

  gotoControls() {
    if (this.inTransition) return;
    this.setScene(new Controls(this), FROM_RIGHT)
  }

  gotoAbout() {
    if (this.inTransition) return;
    this.setScene(new About(this), FROM_RIGHT)
  }

  addScore(score) {
    if (this.scoreboard.length < SCOREBOARD_SIZE || score.score > this.scoreboard[SCOREBOARD_SIZE - 1].score) {
      this.scoreboard.push(score);
      this.scoreboard.sort((a, b) => b.score - a.score);
      if (this.scoreboard.length > SCOREBOARD_SIZE) {
        this.scoreboard.length = SCOREBOARD_SIZE;
      }
    }
  }

}
