import { TILESETS_SPRITESHEET } from '~/consts';
import { Assets, Container, Graphics, Rectangle } from 'pixi.js';
import { Tilemap } from '@pixi/tilemap';
import { Random } from '~/fw/Random.js';
import { addDebugPane } from '~/fw/debug';


export class Map extends Container {
  constructor({width, height, tileSize, randomize = true}) {
    super();

    this.targetWidth = width;
    this.targetHeight = height;
    this.tileSize = tileSize;

    this.cols = Math.ceil(this.targetWidth / this.tileSize);
    this.rows = Math.ceil(this.targetHeight / this.tileSize);

    this.rng = randomize ? new Random() : Random.from(42);

    this.noiseY = 0;
    this.noiseDy = 0.1;
    this.noiseLX = 0;
    this.rightRX = this.noiseDy * 10;

    this.intGridOffset = this.rows;
    this.intGridRows = this.rows + this.intGridOffset + 1;
    this.intGrid = [];
    while(this.intGrid.length < this.intGridRows) {
      this.addRow();
    }

    this.rowsGenerated = 0;

    const spriteSheet = Assets.get(TILESETS_SPRITESHEET);
    this.tileset = spriteSheet.data.tilesets.walls;
    this.tilemap = this.addChild(new Tilemap(spriteSheet.textureSource));
    this.redrawTiles();

    this._tilemapOffset = 0;


    this.intGridViz = this.addChild(new Graphics());
    this.intGridViz.visible = false;

    this.removeDebugPane = addDebugPane('Map', (pane) => {
      pane.expanded = false;
      pane.addBinding(this, 'noiseY', {readonly: true});
      pane.addBinding(this, 'noiseDy', {min: 0.01, max: 0.25, step: 0.001});
      pane.addBinding(this, 'rowsGenerated', {readonly: true, step: 1});
      pane.addBinding(this.intGridViz, 'visible', {label: 'showIntGrid'});
    });
  }

  destroy(options) {
    this.removeDebugPane();
    super.destroy(options);
  }

  getCollidersForBounds(bounds) {
    const outBounds = [];
    const shipFirstRow = Math.floor((bounds.top - this._tilemapOffset) / this.tileSize);
    for (let i = 0; i < 2; ++i) {
      const rowIdx = shipFirstRow + i;
      const {nLeft, nRight} = this.intGrid[rowIdx + this.intGridOffset];
      const rowPos = rowIdx * this.tileSize + this._tilemapOffset;

      const rectLeft = new Rectangle(0, rowPos, nLeft * this.tileSize, this.tileSize);
      if (rectLeft.intersects(bounds)) outBounds.push(rectLeft.pad(-1));
      const rectRight = new Rectangle(this.width - nRight * this.tileSize, rowPos, nRight * this.tileSize, this.tileSize);
      if (rectRight.intersects(bounds)) outBounds.push(rectRight.pad(-1));
    }
    return outBounds;
  }

  getCurrentSpawnRange(offset = -2) {
    const row = this.intGrid[this.intGridOffset + offset];
    const rowY = this.tileSize * offset + this._tilemapOffset;
    return {
      y: rowY,
      xMin: row.nLeft * this.tileSize,
      xMax: (this.cols - row.nRight) * this.tileSize
    };
  }

  move(dy) {
    this._tilemapOffset += dy;
    if (this._tilemapOffset >= this.tileSize) {
      this._tilemapOffset -= this.tileSize;
      this.addRow();
      this.redrawTiles();
      this.redrawIntGridViz();
      ++this.rowsGenerated;
    }
    this.tilemap.y = Math.round(this._tilemapOffset);
  }

  addRow() {
    this.noiseY += this.noiseDy;

    const row = [];
    row.nLeft = 1 + Math.floor(this.rng.noise2DNorm(this.noiseLX, this.noiseY) * (this.cols / 2 - 1));
    row.nRight = 1 + Math.floor(this.rng.noise2DNorm(this.rightRX, this.noiseY) * (this.cols / 2 - 1));
    const wl = row.nLeft;
    const wr = this.cols - row.nRight;

    for (let col = 0; col < this.cols; ++col) {
      row.push((col < wl || col >= wr) ? 1 : 0);
    }
    this.intGrid.unshift(row);
    if (this.intGrid.length > this.intGridRows) {
      this.intGrid.pop();
    }
  }

  redrawTiles() {
    this.tilemap.clear();
    for (let row = -2; row < this.rows; ++row) {
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

  redrawIntGridViz() {
    if (!this.intGridViz.visible) return;
    const colors = [0x2d006e, 0x3c80db];
    const size = 3;
    this.intGridViz.clear();
    for (let row = 0; row < this.intGridRows; ++row) {
      for (let col = 0; col < this.cols; ++col) {
        const igv = this.intGrid[row][col];
        this.intGridViz.rect(col * size, row * size, size, size).fill(colors[igv]);
      }
    }
    this.intGridViz.rect(0, size * this.intGridOffset, size * this.cols, size * this.rows).fill({color: 0xffffff, alpha: 0.1})
  }
}


function pickTile(tileset, intGrid, cx, cy) {
  if (!intGrid[cy - 1] || !intGrid[cy] || !intGrid[cy + 1]) {
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
