import { Menu } from "~/ui/Menu.js";
import { COLOR_STEEL_BLUE, FONT_HEADER, WIDTH } from "~/consts.js";
import { BitmapText, Container } from "pixi.js";


export class Scoreboard extends Container {
  constructor(game) {
    super();
    this.game = game;

    this.createMenu();
  }

  createMenu() {

    const scores = Array.from({length: 10}, () => 0)
      .sort((a,b) => b - a)
      .join('\n');

    const menu = new Menu({
      title: "Scoreboard",
      game: this.game,
      innerText: new BitmapText({
        text: scores,
        style: {
          ...FONT_HEADER,
          fill: COLOR_STEEL_BLUE,
          align: "center"
        }
      }),
    });
    menu.x = Math.floor(WIDTH / 2);
    menu.y = 48;
    return this.addChild(menu);
  }
}
