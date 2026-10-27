<div align="center">

# 𒁈 Avenix-Multi

**Bot multipropósito para WhatsApp escrito en TypeScript.**

[![CI](https://github.com/Brashkie/Avenix-Multi/actions/workflows/ci.yml/badge.svg)](https://github.com/Brashkie/Avenix-Multi/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/Brashkie/Avenix-Multi?color=7b2ff7)](https://github.com/Brashkie/Avenix-Multi/releases)
[![Node](https://img.shields.io/badge/node-%E2%89%A520.11-339933.svg)](https://nodejs.org/)
[![Licencia: MIT](https://img.shields.io/badge/licencia-MIT-blue.svg)](./LICENSE)

[**English**](./README.md) · [**Español**](./README.es.md) · [Changelog](./CHANGELOG.md)

</div>

---

## ✨ Características

- **TypeScript** de principio a fin, con `tsc --noEmit` sin errores.
- **Baileys 7** oficial (multi-dispositivo, LID).
- **Persistencia binaria 100 % sin JSON** con [`strenor`](https://www.npmjs.com/package/strenor): base de datos, sesión de WhatsApp y datos de los módulos.
- **Criptografía nativa en Rust** con [`@brashkie/signalis-core`](https://www.npmjs.com/package/@brashkie/signalis-core) (AES-256-GCM, Argon2id, BLAKE3).
- **Consola** con [`ansimax`](https://www.npmjs.com/package/ansimax): colores, banner y animaciones.
- **Sistema de 14 roles**, economía y RPG, juegos (póker, tres en raya, PvP, mascotas, clanes, torneos, trivia), stickers, memes, clima, calculadora, captchas y sub-bots (JadiBot).

## 📋 Requisitos

| Requisito | Uso |
|-----------|-----|
| Node.js **20.11+** | Obligatorio |
| `ffmpeg` | Stickers animados y conversiones de audio/video (opcional) |
| `yt-dlp` | Descargas de YouTube/TikTok/Instagram (opcional) |

Funciona en Windows, Linux, macOS y Android (Termux).

## 🚀 Instalación

```bash
git clone https://github.com/Brashkie/Avenix-Multi
cd Avenix-Multi
npm install
npm start
```

Al iniciar puedes elegir **código QR** o **código de 8 dígitos**. También puedes forzarlo:

```bash
npm run qr     # vincular con código QR
npm run code   # vincular con código de emparejamiento
```

En Termux puedes usar `bash avenix.sh`, que instala, actualiza y respalda la base de datos.

## ⚙️ Configuración

Todo se configura en [`src/kernel/config.ts`](./src/kernel/config.ts):

- **Roles**: `global.owner`, `devs`, `mods`, `helpers`, `contributors`, `betaTesters`, `donators`, `partners`, `influencers`, `prems`. Formato: `['51999999999', 'Nombre', true]` (el `true` en `owner` marca al creador).
- **Bot**: `botname`, `packname`, `botNumber` (si lo defines, se usa el código de emparejamiento automáticamente).
- **APIs externas**: `global.APIs` y `global.APIKeys` (o variables de entorno como `LOLHUMAN_API`).
- **Imágenes**: coloca `Avenix-1.jpg`…`Avenix-5.jpg`, `catalogo.jpg`, `avatar.png`, `logo.png` en `media/`.

## 💾 Almacenamiento

Todos los datos se guardan en logs binarios de strenor (codec V8), sin archivos JSON:

| Archivo | Contenido |
|---------|-----------|
| `storage/database.strenor` | Usuarios, chats, ajustes y estadísticas (`global.db`) |
| `storage/app.strenor` | Datos de módulos: estadísticas de chat, galería de memes, packs de stickers, tareas… |
| `storage/cache.strenor` | Caché en disco con TTL |
| `sessions/auth.strenor` | Sesión de WhatsApp |
| `AvenixJadiBot/<número>/auth.strenor` | Sesiones de sub-bots |

La base de datos solo escribe los registros que cambiaron y el log se compacta automáticamente.

**Migración desde versiones anteriores**: si existe `storage/database/database.json` o una sesión JSON en `sessions/`, se importan solos al primer inicio. La base de datos antigua queda como `database.json.migrated` y la sesión antigua en `sessions/legacy-json/`. Puedes borrarlas cuando confirmes que todo funciona.

## 🧩 Crear un plugin

Cada archivo de `src/plugins/` es un comando. Se recargan en caliente al guardar.

```ts
import type { PluginHandler } from '../types/index.js'

const handler: PluginHandler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) throw `Uso: ${usedPrefix + command} <texto>`
    await conn.reply(m.chat, `Dijiste: ${text}`, m)
}

handler.help = ['eco <texto>']
handler.tags = ['tools']
handler.command = /^(eco|echo)$/i
// Permisos opcionales: owner, mods, premium, group, admin, botAdmin, register,
// dev, helper, contributor, betaTester, donator, partner, influencer, vip, verified

export default handler
```

Un `throw` con texto se responde al usuario. Para guardar datos propios del plugin usa `loadValue`/`saveValue` de `src/lib/storage.ts`.

## 🛠️ Scripts

| Script | Descripción |
|--------|-------------|
| `npm start` | Inicia el bot con `tsx` |
| `npm run typecheck` | Verifica los tipos (`tsc --noEmit`) |
| `npm run build` | Compila a `dist/` |
| `npm run start:prod` | Inicia la versión compilada |
| `npm run test:smoke` | Carga todos los módulos y verifica que no se genere JSON |
| `npm run check` | `typecheck` + `test:smoke` |

## 📁 Estructura

```
src/
├── index.ts          Lanzador: animación de inicio y supervisor del proceso
├── kernel/
│   ├── config.ts     Configuración y variables globales
│   ├── start.ts      Conexión, base de datos, carga de plugins
│   └── handler.ts    Procesamiento de mensajes y permisos
├── lib/              Librerías (storage, auth, crypto, paint, simple, juegos…)
├── plugins/          Comandos
└── types/            Tipos compartidos y globales
scripts/smoke.ts      Prueba de humo
```

## 🔄 CI y releases

- **CI** (`.github/workflows/ci.yml`): en cada push y pull request ejecuta typecheck, build y la prueba de humo en Ubuntu y Windows con Node 20, 22 y 24.
- **Release** (`.github/workflows/release.yml`): al subir un tag `vX.Y.Z` verifica que coincida con `package.json`, vuelve a comprobar el proyecto y publica un GitHub Release con `.tar.gz`, `.zip`, checksums SHA-256 y las notas de `CHANGELOG.md`. Los tags con guion (`v6.1.0-beta.1`) se publican como prerelease.

```bash
npm version 6.1.0 --no-git-tag-version   # actualiza package.json
# añade la sección "## [6.1.0]" en CHANGELOG.md
git commit -am "release: v6.1.0"
git tag v6.1.0
git push && git push --tags
```

## 👑 Créditos

Creado por **Hepein Oficial** · Colaborador: **Brashkie**
📱 WhatsApp: +51 916360161

## 📄 Licencia

[MIT](./LICENSE)
