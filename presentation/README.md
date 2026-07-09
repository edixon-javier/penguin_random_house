# Ambiente Futbolero · Presentación dinámica

Versión web animada del *Informe de Premiación* (Philips Iluminación · Equipo GC),
convertida desde el PDF original a una presentación interactiva con transiciones y
animaciones.

## Cómo verla

Es 100% autónoma (HTML + CSS + JS, sin dependencias externas). Basta con abrir el
archivo, aunque por las imágenes conviene servirla:

```bash
cd presentation
python3 -m http.server 8099
# abre http://localhost:8099
```

O simplemente abre `index.html` en el navegador.

## Controles

| Acción | Tecla / gesto |
|---|---|
| Avanzar | `→` · `Barra espaciadora` · click `›` · swipe izquierda |
| Retroceder | `←` · click `‹` · swipe derecha |
| Ir al inicio / final | `Home` / `End` |
| Reproducción automática | botón ▶ · tecla `P` |
| Pantalla completa | botón ⬜ · tecla `F` |
| Ir a un slide | clic en los puntos inferiores |
| Enlace directo | `index.html#s5` abre en el ganador 5 |

## Animaciones incluidas

- Portada tipográfica animada con degradado de estadio.
- Transiciones entre slides con entrada direccional + **efecto Ken Burns** (zoom lento).
- **Lower-third dinámico** por ganador: número, nombre, ciudad y premio que entran animados.
- Capa de ambiente futbolero: haces de luz de estadio y balones flotantes.
- **Confeti** en cada slide de ganador.
- Barra de progreso, puntos de navegación y contador de slides.
- Respeta `prefers-reduced-motion` para accesibilidad.

## Estructura

```
presentation/
├── index.html      # marcado
├── styles.css      # estilos + animaciones
├── app.js          # motor (datos de ganadores, navegación, confeti, autoplay)
└── slides/         # slide-01..12.jpg (páginas del informe)
```

Los datos de cada ganador se editan en el arreglo `SLIDES` de `app.js`.
