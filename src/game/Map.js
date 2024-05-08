import { TILESETS_SPRITESHEET } from '../consts';
import { Assets, Container, Graphics, Rectangle } from 'pixi.js';
import { Tilemap } from '@pixi/tilemap';
import { Random } from '../rand';
import { addDebugPane } from '../debug';


export class Walls extends Container {
  constructor(width, height, tileSize = 16) {
    super();

    this.targetWidth = width;
    this.targetHeight = height;
    this.tileSize = tileSize;

    this.cols = Math.ceil(this.targetWidth / this.tileSize);
    this.rows = Math.ceil(this.targetHeight / this.tileSize);

    this.rng = new Random();

    this.noiseY = 0;
    this.noiseDy = 0.1;
    this.noiseLX = 0;
    this.rightRX = 1;

    this.intGridRows = this.rows + 3;
    this.intGridOffset = 1;
    this.intGrid = [];
    while(this.intGrid.length < this.intGridRows) {
      this.addRow();
    }
    console.log(this.intGrid);

    const spriteSheet = Assets.get(TILESETS_SPRITESHEET);
    this.tileset = spriteSheet.data.tilesets.walls;
    this.tilemap = this.addChild(new Tilemap(spriteSheet.textureSource));
    console.log('- TM - tilemap instance');
    window.TM = this.tilemap;
    this.redrawTiles();

    this.addChild(new Graphics().rect(0, 0, width, height).stroke({ width: 1, color: 0xffffff, alignment: 1 }));
    
    this.eventMode = "static";
    this.hitArea = new Rectangle(0, 0, this.width, this.height);
    
    addDebugPane('Map', (p) => {
      p.addButton({title: 'clear tilemap - broken'}).on('click', () => {
        console.log('clear tilemap');
        this.tilemap.clear();
      })
      p.addButton({title: 'clear tilemap and add tile - working'}).on('click', () => {
        console.log('clear tilemap, add tile, update render group');
        this.tilemap.clear();
        this.tilemap.tile(0, 0, 0, {
          tileWidth: 16,
          tileHeight: 16,
          u: 16,
          v: 0})
        this.tilemap.renderGroup.onChildUpdate(this);
      })
      p.addButton({'title': 'update tilemap - broken'}).on('click', () => {
        console.log('update tilemap');
        this.addRow();
        console.log(this.intGrid);
        this.redrawTiles();
      })
      p.addButton({'title': 'update tilemap and render group - working'}).on('click', () => {
        console.log('update tilemap, update render group');
        this.addRow();
        console.log(this.intGrid);
        this.redrawTiles();
        this.tilemap.renderGroup.onChildUpdate(this);
      })
    });

  }

  addRow() {
    this.noiseY += this.noiseDy;
    const wl = this.rng.noise2DNorm(this.noiseLX, this.noiseY) * (this.cols / 2 - 1);
    const wr = this.cols - this.rng.noise2DNorm(this.rightRX, this.noiseY) * (this.cols / 2 - 1) -1;
    const row = [];
    for (let col = 0; col < this.cols; ++col) {
      row.push((col < wl || col >= wr) ? 1 : 0);
    }
    this.intGrid.push(row);
    if (this.intGrid.length > this.intGridRows) {
      this.intGrid.shift();
    }
  }

  redrawTiles() {
    this.tilemap.clear();

    for (let row = 0; row < this.rows; ++row) {
      for (let col = 0; col < this.cols; ++col) {
        const t = pickTile(this.tileset, this.intGrid, col, row + this.intGridOffset);
        if (t) {
          this.tilemap.tile(0, col * this.tileSize, row * this.tileSize, {
            tileWidth: t.w,
            tileHeight: t.h,
            u: t.x,
            v: t.y})
        }
      }
    }
  }
}

function pickTile(tileset, intGrid, cx, cy) {
  if (!intGrid[cy - 1] || !intGrid[cy] || !intGrid[cy + 1]) {
    if (intGrid[cy]?.[cx] === 1) {
      return {w: 16, h: 16, x: 16, y: 32}  // just for tests
    }
    return null;
  }
  const mask = [
    intGrid[cy - 1]?.[cx - 1] ?? 1, intGrid[cy - 1]?.[cx], intGrid[cy - 1]?.[cx + 1] ?? 1, 
    intGrid[cy]?.[cx - 1] ?? 1, intGrid[cy]?.[cx], intGrid[cy]?.[cx + 1] ?? 1, 
    intGrid[cy + 1]?.[cx - 1] ?? 1, intGrid[cy + 1]?.[cx], intGrid[cy + 1]?.[cx + 1] ?? 1
  ];

  for (const tile of tileset) {
    if (matchPattern(tile.pattern, mask)) {
      return tile;
    }
  }

  return null;
}

function matchPattern(patt, mask) {
  for (let i = 0; i < patt.length; ++i) {
    if (patt[i] < 0 && patt[i] === -mask[i]) return false;
    if (patt[i] > 0 && patt[i] !== mask[i]) return false;
  }
  return true;
}
