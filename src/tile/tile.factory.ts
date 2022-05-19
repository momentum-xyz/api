import { Tile } from './tile.entity';

export function tileFactory(items: any, uiTypeId: Buffer, spaceId: Buffer): Tile[] {
  const tiles: Tile[] = [];

  items.forEach((item) => {
    const tile = new Tile();
    tile.spaceId = spaceId;
    tile.uiTypeId = uiTypeId;
    tile.hash = item.hash;
    tile.type = item.type;
    tile.row = item.row;
    tile.content = item.content;
    tile.column = item.column;
    tile.render = item.render;
    tile.permanentType = item.permanentType;
    if (item.edited) {
      tile.edited = item.edited;
    }

    tiles.push(tile);
  });

  return tiles;
}
