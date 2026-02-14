# Guida Modifiche Design - Grest PSG

Tutto il design system è gestito tramite **CSS Variables** in `frontend/styles/design-tokens.css`. Non serve ricompilare nulla, basta salvare il file e aggiornare la pagina.

## 🎨 Colori Principali

Apri `frontend/styles/design-tokens.css` e cerca la sezione `:root`.

| Variabile | Descrizione | Default |
|-----------|-------------|---------|
| `--color-primary` | Colore principale (bottoni, header) | `#FFB84D` (Arancio) |
| `--color-bg-main` | Sfondo pagina | `#FFF8E7` (Crema) |
| `--color-text-dark` | Testo principale | `#2C2C2C` (Grigio Scuro) |

### Esempio: Cambiare il tema in "Blu"
```css
:root {
  --color-primary: #3498BD;
  --color-primary-medium: #2980B9;
  --color-bg-main: #F0F8FF;
}
```



## ✍️ Font e Testi
- **Font Size Hero**: `--font-size-hero` (Titolo Homepage)
- **Font Family**: `--font-family` (Default: Inter system stack)

## 📐 Spaziature e Bordi
- **Arrotondamento schede**: `--radius-md` (Default: 12px)
- **Spaziatura interna**: `--spacing-md` (Default: 1.5rem)
