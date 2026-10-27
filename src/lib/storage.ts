/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                    𒁈 AVENIX-MULTI - LIB/STORAGE.TS 𒁈                         ┃
 * ┃      Persistencia 100% binaria sobre strenor (sin archivos JSON)             ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 *
 * Cada almacén es un log append-only de strenor (`*.strenor`). Los valores se
 * codifican con el serializador binario de V8 (conserva Buffer, Uint8Array, Date,
 * Map y Set), en lugar del codec JSON que strenor usa por defecto.
 */

import { mkdirSync } from 'fs'
import path from 'path'
import v8 from 'v8'
import { Strenor, type Codec } from 'strenor'
import { fastHash } from './crypto.js'

export const STORAGE_DIR = path.resolve('storage')

/** Codec binario de V8. Tag 0x20 = primer tag libre para codecs propios. */
export const binaryCodec: Codec = {
    tag: 0x20,
    encode: value => v8.serialize(value),
    decode: bytes => v8.deserialize(bytes)
}

const COMPACT_THRESHOLD = 8 * 1024 * 1024 // compacta el log cuando supera 8 MB
const stores = new Map<string, Strenor>()

/**
 * Abre (o reutiliza) un almacén persistente.
 * `name` relativo se guarda en `./storage/<name>.strenor`; una ruta absoluta se usa tal cual.
 */
export function openStore(name: string): Strenor {
    const file = path.isAbsolute(name) ? name : path.join(STORAGE_DIR, `${name}.strenor`)
    let store = stores.get(file)
    if (!store) {
        mkdirSync(path.dirname(file), { recursive: true })
        store = new Strenor({ codec: binaryCodec, aof: file, sweepInterval: 60_000 })
        stores.set(file, store)
        if (store.recovery?.truncated) {
            console.warn(`⚠️ [storage] ${path.basename(file)}: se descartó una escritura incompleta (cierre inesperado)`)
        }
    }
    return store
}

/** Almacén compartido para los datos de las librerías (stats, galerías, tareas...). */
export const appStore = () => openStore('app')

/** Lee un valor del almacén de la app o devuelve `fallback`. */
export function loadValue<T>(key: string, fallback: T): T {
    return appStore().get<T>(key) ?? fallback
}

/** Guarda un valor en el almacén de la app. */
export function saveValue(key: string, value: unknown, ttl?: number): void {
    appStore().set(key, value, ttl ? { ttl } : undefined)
}

export function deleteValue(key: string): boolean {
    return appStore().del(key)
}

/** Claves del almacén de la app que empiezan por `prefix`. */
export function keysWithPrefix(prefix: string): string[] {
    return appStore().keys().filter(k => k.startsWith(prefix))
}

/** Compacta los logs grandes (un log append-only crece con cada reescritura). */
export function compactAll(threshold = COMPACT_THRESHOLD): void {
    for (const store of stores.values()) {
        try {
            if (store.aofSize() > threshold) store.compact()
        } catch (e) {
            console.error('⚠️ [storage] Error compactando:', e)
        }
    }
}

/** Cierra todos los almacenes (vacía y libera los archivos de log). */
export function closeAll(): void {
    for (const [file, store] of stores) {
        try { store.close() } catch {}
        stores.delete(file)
    }
}

setInterval(compactAll, 10 * 60_000).unref()
process.once('exit', closeAll)

// ═══════════════════════════════════════════════════════════════════════════════
// │                    BASE DE DATOS PRINCIPAL (global.db)                      │
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Base de datos con la misma forma que lowdb (`data`, `read()`, `write()`) para que
 * todo el código existente (`global.db.data.users[jid]...`) siga funcionando.
 *
 * Cada colección de primer nivel (`users`, `chats`, ...) es un hash de strenor; cada
 * registro es un campo. `write()` solo persiste los registros que cambiaron.
 */
export class StrenorDatabase<T extends Record<string, any>> {
    data: T
    private readonly store: Strenor
    private readonly fingerprints = new Map<string, string>()

    constructor(name: string, private readonly defaults: T) {
        this.store = openStore(name)
        this.data = structuredClone(defaults)
    }

    /** Carga todas las colecciones desde el log. */
    async read(): Promise<T> {
        const data: Record<string, any> = structuredClone(this.defaults)
        this.fingerprints.clear()
        for (const key of this.store.keys()) {
            if (key.startsWith('$')) {
                data[key.slice(1)] = this.store.get(key)
                continue
            }
            const collection = this.store.hgetall<Record<string, unknown>>(key)
            data[key] = collection
            for (const [id, value] of Object.entries(collection)) {
                this.fingerprints.set(`${key}\u0000${id}`, fingerprint(value))
            }
        }
        this.data = data as T
        return this.data
    }

    /** Persiste solo los registros nuevos, modificados o eliminados. */
    async write(): Promise<number> {
        let changes = 0
        const seen = new Set<string>()
        this.store.batch(() => {
            for (const [key, value] of Object.entries(this.data)) {
                if (!isPlainObject(value)) {
                    this.store.set(`$${key}`, value)
                    continue
                }
                for (const [id, record] of Object.entries(value)) {
                    const ref = `${key}\u0000${id}`
                    seen.add(ref)
                    const fp = fingerprint(record)
                    if (this.fingerprints.get(ref) === fp) continue
                    this.store.hset(key, id, record)
                    this.fingerprints.set(ref, fp)
                    changes++
                }
            }
            for (const ref of [...this.fingerprints.keys()]) {
                if (seen.has(ref)) continue
                const [key, id] = ref.split('\u0000')
                this.store.hdel(key, id)
                this.fingerprints.delete(ref)
                changes++
            }
        })
        return changes
    }

    /** Importa datos existentes (p. ej. una base de datos JSON antigua). */
    async import(data: Partial<T>): Promise<number> {
        this.data = { ...structuredClone(this.defaults), ...this.data, ...data }
        return this.write()
    }
}

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
    !!v && typeof v === 'object' && !Array.isArray(v) && !Buffer.isBuffer(v) && !(v instanceof Map) && !(v instanceof Date)

const fingerprint = (value: unknown) => fastHash(v8.serialize(value))
