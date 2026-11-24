"""Checks every table row in store/listing.md against the character limit in its Limit column, and the descriptions against 4000."""
import re, sys, pathlib
text = pathlib.Path(__file__).resolve().parent.parent.joinpath('store', 'listing.md').read_text(encoding='utf-8')
bad = 0
for line in text.splitlines():
    m = re.match(r'^\| ([^|]+) \| (\d+) \| (.+) \|$', line)
    if m:
        field, limit, value = m.group(1).strip(), int(m.group(2)), m.group(3).strip()
        n = len(value)
        flag = 'OK ' if n <= limit else 'TOO LONG'
        bad += n > limit
        print(f'{flag} {n:4}/{limit:<4} {field}')
for title in ('### Description (both stores, limit 4000)', '### Description (limit 4000)'):
    body = text.split(title, 1)[1].split('\n---', 1)[0].strip()
    print(f"{'OK ' if len(body) <= 4000 else 'TOO LONG'} {len(body):4}/4000 {title}")
    bad += len(body) > 4000
sys.exit(1 if bad else 0)
