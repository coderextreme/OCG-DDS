# Editor de Grafos Distribuidos Accesible con Capacidades de Objeto (Español)

**Proyecto:** Lattice · **Repositorio:** <https://github.com/coderextreme/OCG-DDS> · **Contacto:** `yottzumm@gmail.com`

Esta aplicación fue creada rápidamente con ayuda de inteligencia artificial. Gracias a todas las comunidades cuyo trabajo lo hizo posible. El autor aún no lee Braille ni SignWriting y solicita la colaboración de personas ciegas, sordociegas y sordas para probar, corregir o codirigir el proyecto.

## Accesibilidad para Comunidades Ciegas, Sordociegas y Sordas
- **Lectores de pantalla y teclado:** Navegación por hitos (`Alt+1`–`Alt+4`), foco en consola (`Alt+E`), recorrido lineal del grafo/anillo/Merkle (`ArrowLeft`/`ArrowRight`, `Home`/`End`), guía de teclado (`?`) y regiones activas `aria-live`.
- **Braille (entrada y salida):** Canal **Braille** de 40 celdas con botón **Show Dots** (Braille Unicode `⠁`–`⠿`) y editor Perkins de 6 puntos (`F D S` / `J K L`, `Espacio`, `Retroceso`, `Enter`).
- **Protactile (PT) para personas sordociegas:** Cero dependencia de audio, modo **High Contrast**, zonas espaciales de contacto (`Zone A/B/C`), trazos topográficos y patrones hápticos (`Pulse Haptics`).
- **Lengua de Señas y SignWriting:** Canal **ASL** (glosa Tema-Comentario y tarjetas paso a paso) y canal **SignWriting** (`FSW`, `Unicode SWU` y cuadros 2D SVG) compatible con `LSE`, `LSM`, `ASL`, `BSL`, `LSF`, `DGS`, `LIBRAS`, `JSL`, `Auslan`, `IS` o cualquier lengua de señas personalizada.

## Instalación y Uso
Requisitos: Node.js con `npm` (<https://nodejs.org/>) y Git.
```bash
git clone https://github.com/coderextreme/OCG-DDS
cd OCG-DDS
npm install --package-lock-only --allow-remote=all
npm ci
npm run dev
```
Producción:
```bash
npm run build
npm run preview
```

## Advertencias
Actualmente el estado del grafo y las réplicas se ejecuta en memoria del navegador durante la sesión (aún sin almacenamiento remoto persistente). El código necesita revisión de seguridad por parte de la comunidad.
