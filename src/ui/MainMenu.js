import { BitmapText, Container } from "pixi.js";
import { COLOR_GREEN, COLOR_ORANGE, COLOR_RED, COLOR_YELLOW, FONT_SMALL, HEIGHT, WIDTH } from "~/consts.js";
import { addDebugPane } from "~/fw/debug.js";
import msg from "~/fw/msg.js";
import { Menu } from "~/ui/Menu.js";


export class MainMenu extends Container {
  constructor(game) {
    super();

    this.game = game;

    this.createMenu();
    this.createControllerIndicators();

    msg.on("keydown", this.keyDown, this);

    this.removeDebugPane = addDebugPane("MainMenu", (pane) => {
      pane.expanded = false;
      pane.addBinding(this, "p1", { readonly: true });
      pane.addBinding(this, "p2", { readonly: true });
    });
  }

  get p1() {
    return this.game.player1controller?.id || "";
  }
  get p2() {
    return this.game.player2controller?.id || "";
  }

  keyDown(key, controller) {
    if (this.game.inTransition) return;
    if (key === "select") {
      this.game.addPlayerController(controller);
      this.createControllerIndicators();
    }
  }

  createControllerIndicators() {
    if (this.indicators) this.indicators.destroy({children: true});
    this.indicators = this.addChild(new Container());
    this.indicators.addChild(indicatorText(1, this.game.player1controller));
    this.indicators.addChild(indicatorText(2, this.game.player2controller));
  }

  destroy(options) {
    msg.off("keydown", this.keyDown, this);
    this.removeDebugPane();
    super.destroy(options);
  }

  createMenu() {
    const menu = new Menu({
      title: "Space Raid",
      game: this.game,
      isSubMenu: false,
      entriesSpec: [
        {
          label: "New Game",
          action: () => {
            if (this.game.player1controller || this.game.player2controller) this.game.gotoNewGame();
          },
        },
        { label: "Scoreboard", action: () => this.game.gotoScoreboard() },
        { label: "Controls", action: () => this.game.gotoControls() },
        { label: "About", action: () => this.game.gotoAbout() },
    ]});
    menu.x = Math.floor(WIDTH / 2);
    menu.y = 96;
    return this.addChild(menu);
  }
}


function indicatorText(pn, controller) {
  const text = controller ?
    `Player ${pn} ready\nusing ${controller.name}` :
    `Pick player ${pn} controls\nSelect / Backspace / Q`;
  const bt = new BitmapText({
    text,
    style: {
      ...FONT_SMALL,
      align: pn === 1 ? "left" : "right",
      fill: pn === 1 ? COLOR_RED : COLOR_GREEN
    },
    anchor: {
      x: pn - 1, y: 1
    },
    x: WIDTH * (pn - 1) + (pn === 1 ? 2 : -2),
    y: HEIGHT - 2
  });
  if (!controller) {
    const C1 = COLOR_YELLOW;
    const C2 = COLOR_ORANGE;
    let df = 0;
    bt.onRender = () => {
      if (--df <= 0) {
        df = 60;
        bt.style.fill = bt.style.fill === C1 ? C2 : C1;
      }
    }
  }
  return bt;
}
