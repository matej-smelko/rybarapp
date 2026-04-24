import ast
import re
from pathlib import Path

root = Path('c:/Users/pc/OneDrive/Plocha/fishapp')
app_html = root / 'app.html'
fish_js = root / 'frontend/src/data/fish.js'
text = app_html.read_text(encoding='utf-8')
match = re.search(r'const FISH_DB = \[(.*?)\]\s*// MOCK DATA', text, re.S)
if not match:
    raise RuntimeError('FISH_DB block not found in app.html')
block = match.group(1)
raw = '[' + block + ']'
raw = raw.replace('true', 'True').replace('false', 'False').replace('null', 'None')
raw = re.sub(r"([\s,{])(\w+)(\s*):", r"\1'\2'\3:", raw)
raw = re.sub(r',\s*([}\]])', r'\1', raw)
fish_data = ast.literal_eval(raw)

import json

lines = ['export default [\n']
for fish in fish_data:
    image_name = Path(fish['image']).name
    record = fish.get('zaznam', '')
    record_text = f"♥️ {record}" if record else ''
    tip = fish.get('tip', '')
    lines.append('  {\n')
    lines.append(f"    id: {json.dumps(fish['id'], ensure_ascii=False)},\n")
    lines.append(f"    name: {json.dumps(fish['name'], ensure_ascii=False)},\n")
    lines.append(f"    latin: {json.dumps(fish['latin'], ensure_ascii=False)},\n")
    lines.append(f"    mir: {json.dumps(str(fish.get('mira', '0')) + ' cm', ensure_ascii=False)},\n")
    lines.append(f"    maxSize: {json.dumps('až ' + str(fish.get('maxKg', '0')) + ' kg', ensure_ascii=False)},\n")
    lines.append(f"    maxLength: {json.dumps('až ' + str(fish.get('maxCm', '0')) + ' cm', ensure_ascii=False)},\n")
    lines.append(f"    depth: {json.dumps(fish.get('hloubka', ''), ensure_ascii=False)},\n")
    lines.append(f"    habitat: {json.dumps(fish.get('habitat', ''), ensure_ascii=False)},\n")
    lines.append(f"    difficulty: {json.dumps(fish.get('difficulty', 0), ensure_ascii=False)},\n")
    season_json = json.dumps(fish.get('sezona', []), ensure_ascii=False)
    lines.append(f"    season: {season_json},\n")
    lines.append(f"    image: require('../img/{image_name}'),\n")
    bait_json = json.dumps(fish.get('nastrahy', []), ensure_ascii=False)
    lines.append(f"    bait: {bait_json},\n")
    lines.append(f"    description: {json.dumps(fish.get('popis', ''), ensure_ascii=False)},\n")
    lines.append(f"    tips: {json.dumps(tip, ensure_ascii=False)},\n")
    lines.append(f"    record: {json.dumps(record_text, ensure_ascii=False)},\n")
    lines.append('  },\n')
lines.append('];\n')
fish_js.write_text(''.join(lines), encoding='utf-8')
print(f'Wrote {len(fish_data)} fish entries to {fish_js}')
