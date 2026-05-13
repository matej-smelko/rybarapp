const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');

const csvPath = path.join(__dirname, '..', 'reviry_cr.csv');
const outputPath = path.join(__dirname, '..', 'backend', 'seed-fisheries.json');

// Mapování regionu na povodí
const REGION_BASIN = {
  'Praha': 'Vltava',
  'Středočeský': 'Vltava',
  'Jihočeský': 'Vltava',
  'Západočeský': 'Berounka',
  'Severočeský': 'Ohře',
  'Východočeský': 'Labe',
  'Severní Morava a Slezsko': 'Odra',
  'Moravský rybářský svaz': 'Morava',
  'Rada ÚS': '',
};

const raw = fs.readFileSync(csvPath, 'utf8');
const lines = raw.split('\n').filter(l => l.trim());

// Individual corrupted chars and their correct Czech equivalents.
// These arise when a win1250-encoded file was partially decoded as UTF-8.
const SIMPLE_MAP = {
  0x00A9: 0x0160, // © → Š
  0x00AE: 0x017D, // ® → Ž
  0x00AB: 0x0164, // « → Ť
  0x00BB: 0x010F, // » → ď
};
const MOJIBAKE_SET = new Set(Object.keys(SIMPLE_MAP).map(Number));

function hasMojibake(s) {
  if (!s) return false;
  for (let i = 0; i < s.length; i++) {
    if (MOJIBAKE_SET.has(s.charCodeAt(i))) return true;
  }
  return false;
}

function fixDirect(s) {
  if (!s || !hasMojibake(s)) return s;
  return Array.from(s).map(c => {
    const repl = SIMPLE_MAP[c.charCodeAt(0)];
    return repl !== undefined ? String.fromCodePoint(repl) : c;
  }).join('');
}

// Additional correction for obec/nazev fields:
// The scraper's win1250→UTF-8 pipeline had a bug where 0xC5→0xC4,
// causing š→ą (U+0161→U+0105) and ž→ľ (U+017E→U+013E).
// ť→ď (U+0165→U+010F) occurred alongside via the same mechanism.
function fixObecOrName(s) {
  if (!s) return s;
  // Step 1: fix ©®«» chars
  s = fixDirect(s);
  const hasCorruption = [...s].some(c => {
    const code = c.charCodeAt(0);
    return code === 0x0105 /* ą */ || code === 0x013E /* ľ */;
  });
  if (hasCorruption) {
    const hasEsh = [...s].some(c => c.charCodeAt(0) === 0x0105); // ą → š corruption
    s = Array.from(s).map(c => {
      const cp = c.charCodeAt(0);
      if (cp === 0x0105) return String.fromCodePoint(0x0161);   // ą → š
      if (cp === 0x013E) return String.fromCodePoint(0x017E);   // ľ → ž
      // ď → ť only when corrupted alongside ą (š corruption).
      // When ľ→ž corruption (žď sequence), ď is correct.
      if (cp === 0x010F && hasEsh) return String.fromCodePoint(0x0165);   // ď → ť
      return c;
    }).join('');
  }
  // Fix "Šď" → "Šť" and "šď" → "šť" regardless — invalid Czech digraph
  s = s.replace(/\u0160\u010F/g, '\u0160\u0165');
  s = s.replace(/\u0161\u010F/g, '\u0161\u0165');
  return s;
}

// For region field only — it was entirely corrupted by the .ps1 script encoding.
// Every non-ASCII character in it is mojibake, so a win1250→utf8 round-trip
// cleanly recovers the original Czech text without damaging anything.
function fixRegion(s) {
  if (!s) return s;
  try {
    const buf = iconv.encode(s, 'win1250');
    const fixed = iconv.decode(buf, 'utf8');
    return fixed;
  } catch { return s; }
}

const result = [];
for (let i = 1; i < lines.length; i++) {
  const parts = parseCSVLine(lines[i]);
  if (parts.length < 8) continue;

  const id = parts[0]?.replace(/"/g, '').trim();
  const cislo = parts[1]?.replace(/"/g, '').trim();
  const nazev = fixObecOrName(parts[2]?.replace(/"/g, '').trim());
  const obec = fixObecOrName(parts[3]?.replace(/"/g, '').trim());
  const km = parts[4]?.replace(/"/g, '').trim();
  const ha = parts[5]?.replace(/"/g, '').trim();
  let typ = fixDirect(parts[6]?.replace(/"/g, '').trim());
  // Typ field was corrupted by .ps1 encoding — only possible values
  if (typ.includes('Ă')) {
    if (typ.startsWith('kapr')) typ = 'kaprové';
    else if (typ.startsWith('pstruh')) typ = 'pstruhové';
    else typ = 'neurčeno';
  }
  const region_full = fixRegion(parts[7]?.replace(/"/g, '').trim());

  const basin = REGION_BASIN[region_full] || '';
  result.push({
    id: `fishery_${id}`,
    cislo,
    nazev,
    obec: obec || region_full || '',
    km: km || null,
    ha: ha || null,
    typ: typ || 'neurčeno',
    region: region_full || '',
    river_basin: basin,
  });
}

fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');
console.log(`✓ Zkonvertováno ${result.length} revírů do ${outputPath}`);

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}
