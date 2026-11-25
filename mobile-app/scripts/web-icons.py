"""Home-screen icons for the website (Add to Home Screen on iPhone and Android).
Run: python3 mobile-app/scripts/web-icons.py   (needs Pillow). Writes mobile-app/assets/web/."""
from pathlib import Path
from PIL import Image

assets = Path(__file__).resolve().parent.parent / 'assets'
out = assets / 'web'
out.mkdir(exist_ok=True)
full = Image.open(assets / 'icon-only.png').convert('RGB')           # full-bleed square icon
for name, size in [('apple-touch-icon.png', 180), ('icon-192.png', 192), ('icon-512.png', 512), ('favicon-32.png', 32)]:
    full.resize((size, size), Image.LANCZOS).save(out / name, optimize=True)
# Android crops "maskable" icons to a circle or squircle: use the adaptive layers, whose sheep sits in the safe zone
bg = Image.open(assets / 'icon-background.png').convert('RGBA')
fg = Image.open(assets / 'icon-foreground.png').convert('RGBA')
Image.alpha_composite(bg, fg).convert('RGB').resize((512, 512), Image.LANCZOS).save(out / 'icon-maskable-512.png', optimize=True)
print('written:', ', '.join(sorted(p.name for p in out.iterdir())))
