# Render Build Command (asemos-backend)

**Root Directory:** ackend (Render Dashboard → Settings)

Alembic kaldırıldı; migration migrate.py (SQLAlchemy create_all) ile yapılır. Dashboard'da eski bir **Build Command override** varsa deploy lembic upgrade head yüzünden düşer.

## Dashboard'a yapıştırılacak komutlar

### Tercih edilen (repo ile uyumlu — 
ender.yaml / uild.sh)

`ash
chmod +x build.sh && ./build.sh
`

uild.sh sırasıyla: pip install -r requirements.txt → python migrate.py

### Alternatif (satır içi, dashboard override)

`ash
python3.11 -m pip install --upgrade pip && python3.11 -m pip install -r requirements.txt && python3.11 migrate.py
`

**Kullanmayın** (eski, hatalı):

`ash
python3.11 -m pip install --upgrade pip && python3.11 -m pip install -r requirements.txt && python3.11 -m alembic upgrade head
`

## Kaynak dosyalar

| Dosya | Rol |
|-------|-----|
| uild.sh | Render build script (pip + migrate.py) |
| 
ender.yaml | uildCommand: chmod +x build.sh && ./build.sh |
| migrate.py | Production tablo oluşturma |

## Start Command (değiştirmeyin)

`ash
uvicorn main:app --host 0.0.0.0 --port 
`

Detaylı deployment: [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)
