import { checkExt, Logger, SavableAssetCache } from '@assetpack/core';
import { readFileSync } from 'node:fs';

export function ldtk2frames() {
  return {
    name: 'ldtk',
    folder: false,
    test(tree) {
      return checkExt(tree.path, '.ldtk');
    },
    async transform(tree, processor) {
      const dataRaw = readFileSync(tree.path, 'utf8');
      let data = null;

      try {
        const parsed = JSON.parse(dataRaw);
        data = JSON.stringify(extractSpritesheetData(parsed));
      }
      catch (e) {
        console.log(e);
        Logger.error(`[ldtk2frames] Failed to parse ldtk file: ${tree.path}`);
      }

      const output = processor.inputToOutput(tree.path, '.json');

      processor.addToTreeAndSave({
        tree,
        outputOptions: {
            outputData: data,
            outputPathOverride: output
        },
        transformOptions: {
          transformId: 'ldtk',
        }
      });

      SavableAssetCache.set(tree.path, {
        tree,
        transformData: {
          type: this.name,
          files: [{
            name: processor.trimOutputPath(output),
            paths: [output]
          }]
        }
      });
    }
  };
}

function extractSpritesheetData(ldtkFile) {

  const tilesetDef = ldtkFile.defs.tilesets[0];

  const tilesets = parseTilesets(ldtkFile);

  return {
    ...parseEntities(ldtkFile.defs.entities),
    tilesets,
    meta: {
      image: tilesetDef.relPath,
      size: {
        w: tilesetDef.pxWid,
        h: tilesetDef.pxHei
      },
      scale: 1
    }
  }
}

function parseEntities(entities) {
  const frames = {};
  const animations = {};

  for (const ent of entities) {
    const key = ent.identifier.toLowerCase().replaceAll('_', '/');
    const {width, height} = ent;
    const {x, y, w, h} = ent.tileRect;

    if (width === w && height === h) {
      frames[key] = {
        frame: { x, y, w, h },
        anchor: { x: ent.pivotX, y: ent.pivotY }
      }
    } else if (width < w || height < h) {
      const cols = w / width;
      const rows = h / height;
      if (!Number.isInteger(cols) || !Number.isInteger(rows)) {
        Logger.warn(`[ldtk2frames] Error parsing frame as animation ${ent.identifier}: tileRect size is not multiple of entity size.`);
      } else {
        let i = 0;
        const anim = [];
        for (let row = 0; row < rows; ++row) {
          for (let col = 0; col < cols; ++col) {
            const afKey = key + '/' + i;
            frames[afKey] = {
              frame: {
                x: x + col * width,
                y: y + row * height,
                w: width,
                h: height
              },
              anchor: { x: ent.pivotX, y: ent.pivotY }
            }
            anim.push(afKey);
            ++i;
          }
        }
        animations[key] = anim;
      }
    } else {
      Logger.warn(`[ldtk2frames] Error parsing frame as animation ${ent.identifier}: tileRect is smaller then entity size.`);
    }
  }

  return {frames, animations};
}

function parseTilesets(ldtkFile) {
  const intGrids = ldtkFile.defs.layers.filter(l => l.__type === 'IntGrid' && l.autoRuleGroups.length > 0);
  
  return Object.fromEntries(intGrids.map(layerDef => {
    const tilesetDef = ldtkFile.defs.tilesets.find(td => td.uid === layerDef.tilesetDefUid);
    const idToPx = tilesetIdToPxMapper(tilesetDef);
    return [
      layerDef.identifier.toLowerCase(),
      parseTilet(layerDef, idToPx)
    ];
  }));
}

function parseTilet(layerDef, idToPx) {
  const tiles = [];
  for (const ruleGroup of layerDef.autoRuleGroups) {
    for (const rule of ruleGroup.rules) {
      const tile = idToPx(rule.tileRectsIds[0][0]); // TODO handle multiple?
      tile.pattern = rule.pattern;
      if (tile.pattern.length === 1) {
        tile.pattern = [0, 0, 0, 0, tile.pattern[0], 0, 0, 0, 0];
      }
      tiles.push(tile);
    }
  }
  return tiles;
}

function tilesetIdToPxMapper(tilesetDef) {
  const {tileGridSize, __cWid, padding, spacing, customData} = tilesetDef;
  const dataMap = Object.fromEntries(customData.map(d => [d.tileId, JSON.parse(d.data)]));
  return (tileId) => {
    const cx = tileId % __cWid;
    const cy = Math.floor(tileId / __cWid);
    return {
      x: padding + cx * (tileGridSize + spacing),
      y: padding + cy * (tileGridSize + spacing),
      w: tileGridSize,
      h: tileGridSize,
      ...dataMap[tileId]
    };
  };
}
