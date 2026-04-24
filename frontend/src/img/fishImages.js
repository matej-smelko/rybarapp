export const FISH_IMAGES = {
  'amur-bily': require('./amur-bily.png'),
  'bolen-dravy': require('./bolen-dravy.png'),
  'candat-obecny': require('./candat-obecny.png'),
  'kapr-obecny': require('./kapr-obecny.png'),
  'stika-obecna': require('./stika-obecna.png'),
  'okoun-ricni': require('./okoun-ricni.png'),
  // ... sem postupně dopiš další podle potřeby
  'default': require('./kapr-obecny.png'), 
};

export const getFishImageKey = (speciesName) => {
  if (!speciesName) return 'default';
  
  return speciesName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, '-');
};