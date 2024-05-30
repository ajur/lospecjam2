import { PPPContainer } from "~/fw/pixiTools.js";
import { Menu } from "~/ui/Menu.js";
import { COLOR_STEEL_BLUE, FONT_SMALL, WIDTH } from "~/consts.js";
import { BitmapText, Sprite } from "pixi.js";

const CONTROLS_TEXT = `
Controls in this game imitate 8 button gamepad.
${" "}
To play, you can use actual gamepad, or keyboard.
${" "}
As this game supports local two player gameplay,
you need to first pick controls for each player,
by pressing "select" button on controller.
${" "}
If you don't have controller, use this mappings:
${" "}
${" "}
${" "}
${" "}
${" "}
${" "}
${" "}
`


export class Controls extends PPPContainer {
  constructor(game) {
    super();
    this.game = game;

    this.createMenu();

    const spr = this.addChild(Sprite.from("ui/keymap"));
    spr.x = Math.floor(WIDTH / 2);
    spr.y = 146;
  }

  createMenu() {
    const menu = new Menu({
      title: "Controls",
      game: this.game,
      innerText: new BitmapText({
        text: CONTROLS_TEXT,
        style: {
          ...FONT_SMALL,
          fill: COLOR_STEEL_BLUE
        }
      }),
    });
    menu.x = Math.floor(WIDTH / 2);
    menu.y = 40;
    return this.addChild(menu);
  }
}
