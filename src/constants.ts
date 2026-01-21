// ──────────────────────────────────────────────
// Constants - the definitive list of what's acceptable (according to us)
// ──────────────────────────────────────────────

//TODO: Add all ids
export const VALID_PIXEL_SHADER_IDS = [
  'super', 'superext', 'multi', 'normal', 'normalmap', 'normalmapthrough',
  'normalmapspecularmap', 'normalmapdetailspecularmap',
  'normalmapmacroasspecularmap', 'normalmapdetailmacroasspecularmap',
  'glass', 'calmwater', 'tree', 'treeadv', 'treeadvtrunk', 'skin',
  'terrain', 'road', 'shore', 'volcloud', 'simulweatherclouds',
  'refract', 'caustics', 'superhair', 'treeatoc', 'grassatoc',
  'normalmapgrass', 'normalmapdiffuse', 'detailmacroas', 'normalmapthroughsimple',
  'normalmapspecularthroughsimple', 'shorewet', 'road2pass', 'shorefoam'
].map(s => s.toLowerCase());

export const VALID_VERTEX_SHADER_IDS = [
  'super', 'superext', 'multi', 'basic', 'normalmap', 'normalmapdiffuse',
  'normalmapthrough', 'glass', 'tree', 'treeadv', 'treeadvtrunk',
  'terrain', 'road', 'water', 'calmwater', 'volcloud', 'simulweatherclouds',
  'refract', 'basicfade', 'treeadvnofade', 'treeadvmodnormals',
  'underwaterocclusion', 'spriteonsurface', 'normalmapthroughnofade',
  'normalmapspecularthroughnofade', 'shore'
].map(s => s.toLowerCase());

export const VALID_UV_SOURCES = [
  'none', 'tex', 'tex1', 'pos', 'norm', 'worldpos', 'worldnorm',
  'texshoreanim', 'texcollimator', 'texcollimatorinv'
];

export const VALID_RENDER_FLAGS = [
  'nozwrite', 'addblend', 'alphatest64', 'alphatest', 'landshadow',
  'nocull', 'fullbright', 'blend', 'alphablend', 'premultipliedalpha'
].map(f => f.toLowerCase());

export const VALID_FILTERS = ['point', 'linear', 'trilinear', 'anisotropic'];