import { Assets, Container } from "pixi.js";
import { TILESETS_SPRITESHEET } from "~/consts.js";
import { Tilemap } from "@pixi/tilemap";
import { rand } from "~/fw/Random.js";
import { addDebugPane } from "~/fw/debug.js";


export class Background extends Container {
  constructor({width, height, tileSize}) {
    super();

    this.targetWidth = width;
    this.targetHeight = height;
    this.tileSize = tileSize;

    this.cols = Math.ceil(this.targetWidth / this.tileSize);
    this.rows = 1 + Math.ceil(this.targetHeight / this.tileSize);

    const spriteSheet = Assets.get(TILESETS_SPRITESHEET);
    this.tileset = spriteSheet.data.tilesets.stars;
    this.tilemap = this.addChild(new Tilemap(spriteSheet.textureSource));

    this.tiles = [];
    while(this.tiles.length < this.rows) {
      this.addRow();
    }

    this.redrawTiles();

    this._tilemapOffset = 0;
    this.moveRatio = 0.04

    this.removeDebugPane = addDebugPane('Background', (pane) => {
      pane.expanded = false;
      pane.addBinding(this, '_tilemapOffset', {readonly: true});
      pane.addBinding(this, 'moveRatio', {min: 0, max: 1, step: 0.001});
    });
  }

  destroy(options) {
    this.removeDebugPane();
    super.destroy({children: true, ...options});
  }

  move(dy) {
    this._tilemapOffset += dy * this.moveRatio;
    if (this._tilemapOffset >= this.tileSize) {
      this._tilemapOffset -= this.tileSize;
      this.addRow();
      this.redrawTiles();
    }
    this.tilemap.y = Math.round(this._tilemapOffset);
  }

  addRow() {
    const row = [];
    for (let i = 0; i < this.cols; ++i) {
      row.push(pickTile(this.tileset));
    }
    this.tiles.unshift(row);
    if (this.tiles.length > this.rows) {
      this.tiles.pop();
    }
  }

  redrawTiles() {
    this.tilemap.clear();
    for (let row = 0; row < this.rows; ++row) {
      for (let col = 0; col < this.cols; ++col) {
        const t = this.tiles[row][col];
        if (t) {
          this.tilemap.tile(0, col * this.tileSize, (row - 1) * this.tileSize, {
            tileWidth: t.w,
            tileHeight: t.h,
            u: t.x,
            v: t.y})
        }
      }
    }
  }
}

function pickTile(tileset) {
  for (const tile of tileset) {
    if (rand.next() < tile.chance) {
      if (tile.rects) {
        return rand.pick(tile.rects);
      } else {
        return tile;
      }
    }
  }
  return null;
}
