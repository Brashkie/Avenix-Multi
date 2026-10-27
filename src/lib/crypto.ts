/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                    𒁈 AVENIX-MULTI - LIB/CRYPTO.TS 𒁈                          ┃
 * ┃      Primitivas criptográficas del bot sobre @brashkie/signalis-core         ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import {
    AES_GCM,
    Argon2id,
    BLAKE3,
    Base64,
    Hex,
    SHA256,
    constantTimeEq,
    secureRandom
} from '@brashkie/signalis-core'

type Input = string | Buffer | Uint8Array

const toBuffer = (data: Input): Buffer =>
    Buffer.isBuffer(data) ? data : typeof data === 'string' ? Buffer.from(data, 'utf8') : Buffer.from(data)

// ═══════════════════════════════════════════════════════════════════════════════
// │                              ALEATORIEDAD                                   │
// ═══════════════════════════════════════════════════════════════════════════════

export const randomBytes = (size: number): Buffer => secureRandom(size)

/** Hex aleatorio de `bytes` bytes (longitud del string = bytes * 2). */
export const randomHex = (bytes = 8): string => Hex.encode(secureRandom(bytes))

/** ID corto aleatorio de 16 caracteres hex, usado por juegos, clanes, mascotas, etc. */
export const randomId = (bytes = 8): string => randomHex(bytes)

/** UUID v4 (RFC 4122) generado con el CSPRNG nativo. */
export function uuid(): string {
    const b = secureRandom(16)
    b[6] = (b[6] & 0x0f) | 0x40
    b[8] = (b[8] & 0x3f) | 0x80
    const h = Hex.encode(b)
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

/** Entero aleatorio uniforme en [min, max] sin sesgo de módulo. */
export function randomInt(min: number, max: number): number {
    const range = max - min + 1
    if (range <= 1) return min
    const limit = Math.floor(0x1_0000_0000 / range) * range
    let n: number
    do n = secureRandom(4).readUInt32BE(0)
    while (n >= limit)
    return min + (n % range)
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                                 HASHES                                      │
// ═══════════════════════════════════════════════════════════════════════════════

export const sha256 = (data: Input): Buffer => SHA256.hash(toBuffer(data))
export const sha256Hex = (data: Input): string => Hex.encode(sha256(data))

/** Hash rápido (BLAKE3) para claves de caché y deduplicación, no para contraseñas. */
export const fastHash = (data: Input): string => Hex.encode(BLAKE3.hash(toBuffer(data)))

// ═══════════════════════════════════════════════════════════════════════════════
// │                       CIFRADO SIMÉTRICO (AES-256-GCM)                        │
// ═══════════════════════════════════════════════════════════════════════════════

const KEY_SALT = Buffer.from('avenix-multi/aes-gcm/v1', 'utf8')
const ARGON2 = { mCost: 19_456, tCost: 2, pCost: 1 } as const
const CIPHER_VERSION = 'v1'
const keyCache = new Map<string, Buffer>()

/** Deriva (y cachea) una clave AES-256 a partir de un secreto con Argon2id. */
export function deriveKey(secret: string): Buffer {
    let key = keyCache.get(secret)
    if (!key) {
        key = Argon2id.derive(toBuffer(secret), KEY_SALT, ARGON2.mCost, ARGON2.tCost, ARGON2.pCost, 32)
        keyCache.set(secret, key)
    }
    return key
}

/** Cifra texto con AES-256-GCM. Formato: `v1:<nonce b64>:<ciphertext+tag b64>`. */
export function encrypt(plaintext: Input, secret: string): string {
    const nonce = secureRandom(12)
    const sealed = AES_GCM.encrypt(deriveKey(secret), nonce, toBuffer(plaintext))
    return `${CIPHER_VERSION}:${Base64.encode(nonce)}:${Base64.encode(sealed)}`
}

/** Descifra un payload de `encrypt` a bytes. Lanza si fue alterado o la clave es incorrecta. */
export function decryptBytes(payload: string, secret: string): Buffer {
    const [version, nonce, sealed] = payload.split(':')
    if (version !== CIPHER_VERSION || !nonce || !sealed) throw new Error('Formato de cifrado no válido')
    return AES_GCM.decrypt(deriveKey(secret), Base64.decode(nonce), Base64.decode(sealed))
}

/** Descifra un payload de `encrypt` a texto UTF-8. */
export const decrypt = (payload: string, secret: string): string => decryptBytes(payload, secret).toString('utf8')

// ═══════════════════════════════════════════════════════════════════════════════
// │                       HASH DE CONTRASEÑAS (ARGON2ID)                        │
// ═══════════════════════════════════════════════════════════════════════════════

/** Hash de contraseña. Formato: `$argon2id$m,t,p$<salt b64>$<hash b64>`. */
export function hashPassword(password: string): string {
    const salt = secureRandom(16)
    const { mCost, tCost, pCost } = ARGON2
    const hash = Argon2id.derive(toBuffer(password), salt, mCost, tCost, pCost, 32)
    return `$argon2id$${mCost},${tCost},${pCost}$${Base64.encode(salt)}$${Base64.encode(hash)}`
}

export function verifyPassword(password: string, stored: string): boolean {
    const [, algo, params, salt, hash] = stored.split('$')
    if (algo !== 'argon2id' || !params || !salt || !hash) return false
    const [mCost, tCost, pCost] = params.split(',').map(Number)
    const expected = Base64.decode(hash)
    const actual = Argon2id.derive(toBuffer(password), Base64.decode(salt), mCost, tCost, pCost, expected.length)
    return constantTimeEq(actual, expected)
}

export const safeEqual = (a: Input, b: Input): boolean => constantTimeEq(toBuffer(a), toBuffer(b))
