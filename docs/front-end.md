# Front end

How the pages, styles and scripts fit together. For the contact form's
server side, see [contact-form.md](contact-form.md).

## Folders

| Path | What's there |
|---|---|
| `index.html`, `about.html` | Home and About |
| `programme/*.html` | The five programme pages (they link up with `../`) |
| `stylesheets/style.scss` | **The stylesheet you edit** |
| `stylesheets/style.css`, `style.css.map` | Built from `style.scss`. Don't edit by hand |
| `scripts/*.js` | One small script per feature (below) |
| `scripts/vendor/lenis.min.js` | The Lenis smooth-scroll library (v1.3.26) |
| `assets/icons`, `assets/images`, `assets/video` | Logos, photos, the About video |
| `api/` | The contact form endpoint (PHP) |

## Styles

Edit `style.scss`, never `style.css`. In VS Code, the **Live Sass Compiler**
extension (glenn2223.live-sass) builds `style.css` and its map each time the
SCSS is saved, adding browser prefixes. Turn it on with **Watch Sass** in the
status bar. If you save the SCSS without it running, `style.css` stays out of
date and the site won't change.

The top of `style.scss` lists its sections in order. Each section starts with
a `/* ---------- Name ---------- */` line, so search for the name to jump
there. Smaller parts inside a section use `/* ---- name ---- */`.

Shared values live in `:root` under **Settings**:

| Variable | Used for |
|---|---|
| `--btn-bg`, `--btn-bg-hover`, `--btn-ink` | The mint button colours |
| `--page-gutter` | The left/right space on every section |
| `--hairline` | The thin lines between sections |
| `--font-heading`, `--font-body` | The two font stacks |
| `--background-page` | The page colour between the hero and the footer |

Breakpoints used throughout: 1000px, 900px and 700px (tablets and phones),
420px (small phones). Every animation has a `prefers-reduced-motion` rule
that switches it off.

## Scripts

Each script is a self-contained block that looks for its own elements and
does nothing if they aren't on the page. All load with `defer` at the end of
`<body>`. Every file starts with a short header saying what it does, which
pages use it and what markup it needs.

| Script | Pages | What it does |
|---|---|---|
| `smooth-scroll.js` | all | Starts Lenis smooth scrolling; shares it as `window.siteLenis` |
| `hero-parallax.js` | all | The hero photo drifts slower than the page |
| `preloader.js` | home | The 000–100 loading counter and curtain |
| `text-reveal.js` | all | Words rise into view (`data-text-reveal`) |
| `slider.js` | home | The *What we offer* card slider |
| `menu.js` | all | The full-screen menu behind the menu button |
| `topbar.js` | all | Frosted bar on scroll; the Programmes drop-down |
| `why-choose.js` | home | The *Why choose us* accordion |
| `vision.js` | about | The auto-cycling vision and mission tabs |
| `video-player.js` | about | Custom controls for the About video |
| `reveal.js` | about | Fades elements in on scroll (`data-reveal`) |
| `contact-form.js` | all | Sends the footer form without leaving the page |

### Order matters

`lenis.min.js` must load first, then `smooth-scroll.js`; `hero-parallax.js`,
`menu.js` and `preloader.js` use the `window.siteLenis` it creates. The rest
can come in any order.

### How scripts talk to each other and to the CSS

- **`window.siteLenis`**: the Lenis instance. `menu.js` and `preloader.js`
  call `.stop()` / `.start()` on it to freeze the page.
- **`site:revealed`** event: fired by `preloader.js` as the curtain lifts.
  `text-reveal.js` waits for it so the hero headline rises after the
  curtain, not behind it.
- **Classes on `<html>`**: `js` (set in each page's `<head>`, so the CSS knows
  scripts are running), `is-preloading` / `is-loaded` (preloader).
- **State classes**: `is-open`, `is-active`, `is-in`, `is-scrolled`,
  `is-playing` and so on. Scripts only add and remove them; what they look
  like is all in the CSS.
- **CSS variables set by scripts**: `--progress` (video seek bar), `--p`
  (vision tab timer), `--i` and `--tr-step` (text reveal timing), `--d`
  (preloader digits), `--slide-dir`, `--slide-duration`, `--stagger`
  (slider).

## Adding things

- **Animate a heading's words:** add `data-text-reveal` to it, optionally
  with a number of milliseconds between words: `data-text-reveal="70"`.
- **Fade something in on scroll:** add `data-reveal`, then style
  `.your-thing.reveal-pending` (hidden) and `.your-thing.is-in` (shown).
- **A new script:** add it to `scripts/`, give it the same header as the
  others, and add a `<script src="./scripts/name.js" defer></script>` (or
  `../scripts/` on programme pages) to every page that needs it.
- **A new image:** use `.avif`, give it `width`, `height`, `loading="lazy"`
  and `decoding="async"` unless it's in the first screen.
