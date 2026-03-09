import sqlite3
import urllib.request
from io import BytesIO

conn = sqlite3.connect('sqlite.db')
c = conn.cursor()
c.execute("SELECT DISTINCT photo_url FROM places WHERE photo_url IS NOT NULL")
urls = [row[0] for row in c.fetchall()]

try:
    from PIL import Image, ImageStat
except ImportError:
    print("PIL not installed")
    exit(1)

for u in urls:
    try:
        req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as resp:
            data = resp.read()
        im = Image.open(BytesIO(data)).convert('RGB')
        stat = ImageStat.Stat(im)
        avg = sum(stat.mean) / 3
        if avg < 10:
            print(f"BLACK IMAGE FOUND: {u} (avg: {avg})")
    except Exception as e:
        pass
