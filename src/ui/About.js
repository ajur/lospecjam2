import { PPPContainer } from "~/fw/pixiTools.js";
import { Menu } from "~/ui/Menu.js";
import { COLOR_STEEL_BLUE, FONT_SMALL, WIDTH } from "~/consts.js";
import { BitmapText } from "pixi.js";


const ABOUT_TEXT = `
This game is quite obvious clone and homage
to the timeless classic "River Ride".
${" "}
This game was prepared for Lospec Jam 2.
I tried my best to hold to jam limitations,
i.e. resolution, tile size, sprite count, etc.
It is also my first attempt at pixel art.
${" "}
I hope you had fun playing it!
                                       -- Adam
`

const WWW_LOSPEC_JAM = "https://itch.io/jam/lospec-jam-2";
const WWW_LOSPEC = "https://lospec.com/";


export class About extends PPPContainer {
  constructor(game) {
    super();
    this.game = game;

    this.createMenu();
  }

  createMenu() {
    const menu = new Menu({
      title: "About Space Raid",
      game: this.game,
      innerText: new BitmapText({
        text: ABOUT_TEXT,
        style: {
          ...FONT_SMALL,
          fill: COLOR_STEEL_BLUE
        }
      }),
      entriesSpec: [
        {label: "Lospec Jam 2 webpage", action: () => window.open(WWW_LOSPEC_JAM, '_blank')},
        {label: "Lospec webpage", action: () => window.open(WWW_LOSPEC, '_blank')},
      ]
    });
    menu.x = Math.floor(WIDTH / 2);
    menu.y = 64;
    return this.addChild(menu);
  }
}
