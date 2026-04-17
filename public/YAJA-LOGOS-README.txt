Por favor añade los siguientes archivos de imagen en la carpeta `public/` para que los favicons y icons funcionen correctamente:

- favicon.ico           (32x32 .ico)
- android-chrome-192x192.png  (192x192 PNG)
- android-chrome-512x512.png  (512x512 PNG)
- apple-touch-icon.png  (180x180 PNG)
- YAJA-logo.png         (SVG o PNG de alta resolución, p.ej. 1024x1024)

Notas:
- En `app/layout.tsx` ya se actualizó la metadata para apuntar a estas rutas con query param `?v=2` (evita caché).
- Si subes solo un SVG de alta resolución, puedo generar automáticamente los PNG e ICO por ti.
- Sube los archivos aqui en la conversación o colócalos en `public/` y haré commit.
