/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                     𒁈 AVENIX-MULTI - LIB/AUTH.TS 𒁈                           ┃
 * ┃        Estado de autenticación de Baileys sobre strenor (sin JSON)           ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 *
 * Reemplaza `useMultiFileAuthState` (un JSON por clave) por un único log binario
 * `<carpeta>/auth.strenor`. Si la carpeta contiene una sesión JSON antigua, se migra
 * automáticamente la primera vez y los JSON se mueven a `<carpeta>/legacy-json/`.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync } from 'fs'
import path from 'path'
import { BufferJSON, initAuthCreds, proto } from '@whiskeysockets/baileys'
import type { AuthenticationCreds, AuthenticationState, SignalDataTypeMap } from '@whiskeysockets/baileys'
import type { Strenor } from 'strenor'
import { openStore } from './storage.js'

type KeyType = keyof SignalDataTypeMap

const AUTH_FILE = 'auth.strenor'
const LEGACY_DIR = 'legacy-json'
const CREDS_KEY = 'creds'

// Ordenados de mayor a menor longitud: 'sender-key-memory' debe probarse antes que 'sender-key'
const KEY_TYPES: KeyType[] = ([
    'pre-key', 'session', 'sender-key', 'sender-key-memory', 'app-state-sync-key',
    'app-state-sync-version', 'lid-mapping', 'device-list', 'tctoken', 'identity-key'
] satisfies KeyType[]).sort((a, b) => b.length - a.length)

/** Mismo nombre de archivo que generaba `useMultiFileAuthState` de Baileys. */
const legacyFileName = (file: string) => file.replace(/\//g, '__').replace(/:/g, '-')

const readLegacy = (file: string) => JSON.parse(readFileSync(file, 'utf-8'), BufferJSON.reviver)

/** Revierte el nombre de archivo a `[tipo, id]`. Devuelve null si no es una clave conocida. */
function parseLegacyName(fileName: string): [KeyType, string] | null {
    const base = fileName.replace(/\.json$/, '')
    const type = KEY_TYPES.find(t => base.startsWith(`${t}-`))
    if (!type) return null
    let id = base.slice(type.length + 1).replace(/__/g, '/')
    // Los ids de sender-key llevan '::' (convertido a '--' al guardar)
    if (type === 'sender-key') id = id.replace(/--/g, '::')
    return [type, id]
}

/** Importa una sesión JSON de Baileys al almacén strenor. */
function migrateLegacySession(folder: string, store: Strenor): number {
    const files = readdirSync(folder).filter(f => f.endsWith('.json'))
    if (!files.length) return 0

    let migrated = 0
    store.transaction(() => {
        for (const file of files) {
            const full = path.join(folder, file)
            if (file === 'creds.json') {
                store.set(CREDS_KEY, readLegacy(full))
                migrated++
                continue
            }
            const parsed = parseLegacyName(file)
            if (!parsed) continue
            store.hset(parsed[0], parsed[1], readLegacy(full))
            migrated++
        }
    })

    const legacyDir = path.join(folder, LEGACY_DIR)
    mkdirSync(legacyDir, { recursive: true })
    for (const file of files) renameSync(path.join(folder, file), path.join(legacyDir, file))
    console.log(`🔄 [auth] Sesión migrada de JSON a strenor: ${migrated} registros (respaldo en ${legacyDir})`)
    return migrated
}

/** Indica si la carpeta tiene una sesión guardada (strenor o JSON antigua). */
export function hasSession(folder: string): boolean {
    if (existsSync(path.join(folder, 'creds.json'))) return true
    const file = path.resolve(folder, AUTH_FILE)
    return existsSync(file) && openStore(file).exists(CREDS_KEY)
}

/** Guarda credenciales importadas (p. ej. desde un código base64 de JadiBot). */
export function importCreds(folder: string, creds: AuthenticationCreds): void {
    mkdirSync(folder, { recursive: true })
    openStore(path.resolve(folder, AUTH_FILE)).set(CREDS_KEY, creds)
}

/** Estado de autenticación de Baileys persistido en strenor. */
export async function useStrenorAuthState(folder: string): Promise<{
    state: AuthenticationState
    saveCreds: () => Promise<void>
    store: Strenor
}> {
    mkdirSync(folder, { recursive: true })
    const store = openStore(path.resolve(folder, AUTH_FILE))
    migrateLegacySession(folder, store)

    const legacyDir = path.join(folder, LEGACY_DIR)
    const hasLegacy = existsSync(legacyDir)

    const creds: AuthenticationCreds = store.get<AuthenticationCreds>(CREDS_KEY) || initAuthCreds()

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const result: Record<string, any> = {}
                    for (const id of ids) {
                        let value = store.hget<any>(type, id)
                        // Red de seguridad: clave que no se pudo mapear en la migración
                        if (value == null && hasLegacy) {
                            const legacyFile = path.join(legacyDir, legacyFileName(`${type}-${id}.json`))
                            if (existsSync(legacyFile)) {
                                value = readLegacy(legacyFile)
                                store.hset(type, id, value)
                            }
                        }
                        if (value == null) continue
                        if (type === 'app-state-sync-key') value = proto.Message.AppStateSyncKeyData.fromObject(value)
                        result[id] = value
                    }
                    return result
                },
                set: async (data) => {
                    store.batch(() => {
                        for (const type in data) {
                            const entries = data[type as KeyType] || {}
                            for (const [id, value] of Object.entries(entries)) {
                                if (value) store.hset(type, id, value)
                                else store.hdel(type, id)
                            }
                        }
                    })
                }
            }
        },
        saveCreds: async () => {
            store.set(CREDS_KEY, creds)
        },
        store
    }
}
