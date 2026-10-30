"""Refresh locally hosted fonts from Google Fonts; retain their OFL licenses."""
import pathlib, re, urllib.request
root = pathlib.Path(__file__).resolve().parents[1] / 'public' / 'fonts'
root.mkdir(parents=True, exist_ok=True)
url = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 Chrome/130.0.0.0 Safari/537.36'})
css = urllib.request.urlopen(req, timeout=30).read().decode()
for i, remote in enumerate(dict.fromkeys(re.findall(r'url\((https://[^)]+)\)', css))):
    name = f'font-{i}.woff2'
    (root / name).write_bytes(urllib.request.urlopen(remote, timeout=30).read())
    css = css.replace(remote, '/drink-rate-a56/fonts/' + name)
(root / 'fonts.css').write_text(css, encoding='utf-8')
for family in ['plusjakartasans', 'jetbrainsmono']:
    remote = f'https://raw.githubusercontent.com/google/fonts/main/ofl/{family}/OFL.txt'
    (root / (family + '-OFL.txt')).write_bytes(urllib.request.urlopen(remote, timeout=30).read())
print('Local fonts and licenses saved.')
