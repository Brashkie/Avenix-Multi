# Changelog

Todos los cambios notables de este proyecto se documentan aquí.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto usa [SemVer](https://semver.org/lang/es/).

## [6.0.0] - 2026-10-26

Reescritura completa en TypeScript.

### Añadido
- Código fuente en TypeScript (`src/`), ejecutado con `tsx` y compilable a `dist/` con `tsc`.
- Persistencia 100 % binaria con [`strenor`](https://www.npmjs.com/package/strenor): base de datos, sesión de WhatsApp y datos de las librerías se guardan en logs `*.strenor` con codec V8 (sin archivos JSON).
- Estado de autenticación de Baileys propio (`src/lib/auth.ts`) sobre strenor, con migración automática de sesiones JSON existentes.
- Migración automática de `storage/database/database.json` a strenor.
- Consola con [`ansimax`](https://www.npmjs.com/package/ansimax) (colores, banner, animaciones).
- Criptografía con [`@brashkie/signalis-core`](https://www.npmjs.com/package/@brashkie/signalis-core): AES-256-GCM, Argon2id, SHA-256, BLAKE3, aleatoriedad segura.
- Sistema de 14 roles aplicado por el handler (`dev`, `helper`, `contributor`, `betaTester`, `donator`, `partner`, `influencer`, `vip`, `verified`).
- 10 plugins de ejemplo por rol (antes en `dev-tests`, que no exportaba nada).
- CI (typecheck, build y prueba de humo en Linux/Windows, Node 20/22/24) y release automático por tag.

### Cambiado
- Baileys oficial `@whiskeysockets/baileys@7.0.0-rc14` en lugar del fork no oficial.
- Stickers con `sharp` + `node-webpmux` (sin `wa-sticker-formatter` ni `exiftool`); las imágenes ya no requieren ffmpeg.
- Descargas de YouTube con `yt-dlp` (sin `@bochilteam/scraper`).
- `@napi-rs/canvas` en lugar de `canvas` (sin compilación nativa).
- `fetch` nativo en lugar de `node-fetch`/`got`.
- La exportación de estadísticas genera un reporte `.txt` en lugar de `.json`.

### Corregido
- `crypto.createCipher` (eliminado en Node 22+) en `security`.
- `const eval` en `tictactoe` (error de sintaxis en módulos ES).
- `global.self` pisaba el objeto global `self`.
- Dos llamadas de red por mensaje para resolver LID; ahora usa el mapeo nativo de Baileys.
- Eventos de bienvenida, anti-delete y anti-call nunca registrados.
- Código de emparejamiento no solicitado cuando `botNumber` estaba configurado.
- `store.loadMessage` siempre devolvía `null`.
- `poker`: el campo `bet` pisaba el método `bet()`.
- `.yt`: promesa sin `await` y menú de calidad nunca conectado.
- Captchas, `.pinterest`, `.sticker` y `.menu`.
- `avenix.sh` usaba una ruta errónea para respaldar la base de datos.

### Eliminado
- `lowdb`, `@seald-io/nedb` y `lib/database.ts` (sustituidos por strenor).
- Purga periódica de archivos de sesión (rompía el descifrado de mensajes).
