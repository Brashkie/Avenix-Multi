<div align="center">

# 𒁈 Avenix-Multi

**Multi-purpose WhatsApp bot written in TypeScript.**

[![CI](https://github.com/Brashkie/Avenix-Multi/actions/workflows/ci.yml/badge.svg)](https://github.com/Brashkie/Avenix-Multi/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/Brashkie/Avenix-Multi?color=7b2ff7)](https://github.com/Brashkie/Avenix-Multi/releases)
[![Node](https://img.shields.io/badge/node-%E2%89%A520.11-339933.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

[**English**](./README.md) · [**Español**](./README.es.md) · [Changelog](./CHANGELOG.md)

</div>

---

## ✨ Features

- **TypeScript** end to end, with `tsc --noEmit` passing cleanly.
- Official **Baileys 7** (multi-device, LID).
- **100% JSON-free binary persistence** with [`strenor`](https://www.npmjs.com/package/strenor): database, WhatsApp session and module data.
- **Native Rust cryptography** with [`@brashkie/signalis-core`](https://www.npmjs.com/package/@brashkie/signalis-core) (AES-256-GCM, Argon2id, BLAKE3).
- **Terminal UI** with [`ansimax`](https://www.npmjs.com/package/ansimax): colors, banner and animations.
- **14-role permission system**, economy and RPG, games (poker, tic-tac-toe, PvP, pets, clans, tournaments, quiz), stickers, memes, weather, calculator, captchas and sub-bots (JadiBot).

## 📋 Requirements

| Requirement | Used for |
|-------------|----------|
| Node.js **20.11+** | Required |
| `ffmpeg` | Animated stickers and audio/video conversion (optional) |
| `yt-dlp` | YouTube/TikTok/Instagram downloads (optional) |

Runs on Windows, Linux, macOS and Android (Termux).

## 🚀 Installation

```bash
git clone https://github.com/Brashkie/Avenix-Multi
cd Avenix-Multi
npm install
npm start
```

On startup you choose between a **QR code** and an **8-digit pairing code**. You can also force one:

```bash
npm run qr     # link with a QR code
npm run code   # link with a pairing code
```

On Termux, `bash avenix.sh` installs, updates and backs up the database for you.

## ⚙️ Configuration

Everything lives in [`src/kernel/config.ts`](./src/kernel/config.ts):

- **Roles**: `global.owner`, `devs`, `mods`, `helpers`, `contributors`, `betaTesters`, `donators`, `partners`, `influencers`, `prems`. Format: `['51999999999', 'Name', true]` (`true` in `owner` marks the creator).
- **Bot**: `botname`, `packname`, `botNumber` (when set, the pairing code is used automatically).
- **External APIs**: `global.APIs` and `global.APIKeys` (or environment variables such as `LOLHUMAN_API`).
- **Images**: put `Avenix-1.jpg`…`Avenix-5.jpg`, `catalogo.jpg`, `avatar.png`, `logo.png` in `media/`.

## 💾 Storage

All data is stored in strenor binary logs (V8 codec), with no JSON files:

| File | Contents |
|------|----------|
| `storage/database.strenor` | Users, chats, settings and stats (`global.db`) |
| `storage/app.strenor` | Module data: chat stats, meme gallery, sticker packs, scheduled tasks… |
| `storage/cache.strenor` | Disk cache with TTL |
| `sessions/auth.strenor` | WhatsApp session |
| `AvenixJadiBot/<number>/auth.strenor` | Sub-bot sessions |

The database only writes records that changed, and logs are compacted automatically.

**Upgrading from older versions**: an existing `storage/database/database.json` or JSON session in `sessions/` is imported automatically on first start. The old database is kept as `database.json.migrated` and the old session in `sessions/legacy-json/`; delete them once you have confirmed everything works.

## 🧩 Writing a plugin

Each file in `src/plugins/` is a command and is hot-reloaded on save.

```ts
import type { PluginHandler } from '../types/index.js'

const handler: PluginHandler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) throw `Usage: ${usedPrefix + command} <text>`
    await conn.reply(m.chat, `You said: ${text}`, m)
}

handler.help = ['echo <text>']
handler.tags = ['tools']
handler.command = /^(eco|echo)$/i
// Optional permissions: owner, mods, premium, group, admin, botAdmin, register,
// dev, helper, contributor, betaTester, donator, partner, influencer, vip, verified

export default handler
```

Throwing a string replies it to the user. To persist plugin data, use `loadValue`/`saveValue` from `src/lib/storage.ts`.

## 🛠️ Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start the bot with `tsx` |
| `npm run typecheck` | Type-check (`tsc --noEmit`) |
| `npm run build` | Compile to `dist/` |
| `npm run start:prod` | Start the compiled build |
| `npm run test:smoke` | Load every module and verify no JSON is written |
| `npm run check` | `typecheck` + `test:smoke` |

## 📁 Structure

```
src/
├── index.ts          Launcher: startup animation and process supervisor
├── kernel/
│   ├── config.ts     Configuration and globals
│   ├── start.ts      Connection, database, plugin loading
│   └── handler.ts    Message processing and permissions
├── lib/              Libraries (storage, auth, crypto, paint, simple, games…)
├── plugins/          Commands
└── types/            Shared and global types
scripts/smoke.ts      Smoke test
```

## 🔄 CI and releases

- **CI** (`.github/workflows/ci.yml`): on every push and pull request, runs typecheck, build and the smoke test on Ubuntu and Windows with Node 20, 22 and 24.
- **Release** (`.github/workflows/release.yml`): pushing a `vX.Y.Z` tag checks it matches `package.json`, re-verifies the project and publishes a GitHub Release with `.tar.gz`, `.zip`, SHA-256 checksums and the notes from `CHANGELOG.md`. Tags with a hyphen (`v6.1.0-beta.1`) are published as prereleases.

```bash
npm version 6.1.0 --no-git-tag-version   # bump package.json
# add a "## [6.1.0]" section to CHANGELOG.md
git commit -am "release: v6.1.0"
git tag v6.1.0
git push && git push --tags
```

## 👑 Credits

Created by **Hepein Oficial** · Contributor: **Brashkie**
📱 WhatsApp: +51 916360161

## 📄 License

[MIT](./LICENSE)
