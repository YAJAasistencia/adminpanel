Instrucciones para generar y subir los iconos YAJA

1) Coloca la imagen fuente (SVG o PNG) en:
   public/YAJA-source.png  (recomendado PNG con fondo transparente)
   o
   public/YAJA-source.svg

2) Ejecuta el script (necesitas ImageMagick instalado):

   chmod +x scripts/generate-icons.sh
   ./scripts/generate-icons.sh

3) El script generará en `public/`:
   - android-chrome-512x512.png
   - android-chrome-192x192.png
   - apple-touch-icon.png
   - favicon.ico
   - YAJA-logo-512.png

4) Haz commit y push:

   git add public/android-chrome-*.png public/apple-touch-icon.png public/favicon.ico public/YAJA-logo-512.png
   git commit -m "chore: add YAJA icons"
   git push

Si quieres, puedo ejecutar el script aquí una vez que subas `public/YAJA-source.png` (da permiso) y haré el commit por ti.