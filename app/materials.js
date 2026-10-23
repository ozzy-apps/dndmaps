const material = (id, name, category) => ({ id, name, category });
export const WALL_MATERIALS = [
  material('stone','Dungeon stone','natural'), material('sandstone','Sandstone','natural'),
  material('brick','Old brick','crafted'), material('timber','Timber','crafted'),
  material('ruined','Ruined stone','natural'), material('marble','Dark marble','crafted'),
  material('basalt','Volcanic basalt','natural'), material('limestone','Pale limestone','natural'),
  material('redbrick','Red brick','crafted'), material('drystone','Dry stone','natural'),
  material('palisade','Log palisade','crafted'), material('hedge','Living hedge','natural'),
];
export const FLOOR_MATERIALS = [
  material('flagstone','Flagstone','natural'), material('cobble','Cobblestone','natural'),
  material('wood','Oak planks','crafted'), material('marble','Marble tile','crafted'),
  material('slate','Blue slate','natural'), material('terracotta','Terracotta','crafted'),
  material('parquet','Herringbone oak','crafted'), material('brickfloor','Brick paving','crafted'),
  material('carved','Carved sandstone','crafted'), material('mosaic','Temple mosaic','crafted'),
  material('earth','Earthen floor','natural'), material('ice','Glacial ice','natural'),
];
export const TERRAIN_MATERIALS = [
  material('grass','Meadow grass','natural'), material('drygrass','Dry grass','natural'),
  material('mud','Wet mud','natural'), material('moss','Forest moss','natural'),
  material('water','Deep water','natural'), material('dirt','Packed earth','natural'),
  material('gravel','Gravel','natural'), material('swamp','Marshland','natural'),
  material('sand','Dune sand','natural'), material('snow','Fresh snow','natural'),
  material('ash','Volcanic ash','natural'), material('leaves','Forest litter','natural'),
];
export const MATERIALS = {
  wall: WALL_MATERIALS, floor: FLOOR_MATERIALS, room: FLOOR_MATERIALS, terrain: TERRAIN_MATERIALS,
  object: [material('barrel','Barrel','crafted'),material('crate','Wooden crate','crafted'),material('table','Feast table','crafted'),material('sarcophagus','Sarcophagus','crafted'),material('bookshelf','Bookshelf','crafted'),material('pillar','Stone pillar','natural'),material('bones','Scattered bones','natural'),material('rug','Woven rug','crafted'),material('brazier','Brazier','crafted'),material('chest','Treasure chest','crafted')],
  atmosphere: ['fog','mist','smoke','darkness','rain','snowfall','embers'].map(id=>material(id,({fog:'Cloud fog',mist:'Ground mist',smoke:'Smoke',darkness:'Darkness',rain:'Rain',snowfall:'Snowfall',embers:'Floating embers'})[id],'natural')),
  light: [material('torch','Torchlight','crafted'),material('arcane','Arcane glow','natural'),material('moon','Moonlight','natural'),material('ember','Embers','crafted'),material('candle','Candle','crafted'),material('lantern','Lantern','crafted'),material('spotlight','Spotlight','crafted'),material('faerie','Faerie glow','natural')],
};
export const ASSET_COUNT = ['wall','floor','terrain','object','light','atmosphere'].reduce((count,key)=>count+MATERIALS[key].length,0);
