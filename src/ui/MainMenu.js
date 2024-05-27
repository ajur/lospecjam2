import { BitmapText, Container } from "pixi.js";
import { COLORS, FONT_HEADER, WIDTH } from "~/consts.js";
import { addDebugPane } from "~/fw/debug.js";
import msg from "~/fw/msg.js";
import { Menu } from "~/ui/Menu.js";

export class MainMenu extends Container {
  constructor(game) {
    super();

    this.game = game;

    this.header = this.addChild(
      new BitmapText({
        text: "Space Raid",
        style: FONT_HEADER,
      })
    );
    this.header.x = Math.floor(WIDTH / 2 - this.header.width / 2);
    this.header.y = 64;

    this.menu = this.addChild(
      new Menu([
        {
          label: "New Game",
          action: () => {
            if (game.player1controller || game.player2controller) game.newGame();
          },
        },
        { label: "Scoreboard", action: () => {} },
        { label: "Settings", action: () => {} },
        { label: "About", action: () => {} },
      ])
    );
    this.menu.x = Math.floor(WIDTH / 2);
    this.menu.y = 96;

    msg.on("keydown", this.keyDown, this);

    this.removeDebugPane = addDebugPane("MainMenu", (pane) => {
      //   pane.expanded = false;
      pane.addBinding(this.header.style, "fill", {
        view: "list",
        options: Object.fromEntries(COLORS.map((c) => [c, c])),
      });
      pane.addBinding(this, "p1", { readonly: true });
      pane.addBinding(this, "p2", { readonly: true });
    });
  }

  get p1() {
    return this.game.player1controller?.id ?? "NOT SET";
  }
  get p2() {
    return this.game.player2controller?.id ?? "NOT SET";
  }

  keyDown(key, controller) {
    if (key === "select") {
      this.game.addPlayerController(controller);
    }
  }

  destroy(options) {
    msg.off("keydown", this.keyDown, this);
    this.removeDebugPane();
    super.destroy(options);
  }
}

