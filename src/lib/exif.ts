/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                     𒁈 AVENIX-MULTI - LIB/EXIF.TS 𒁈                           ┃
 * ┃        Conversión a WebP (sharp) y metadatos de stickers de WhatsApp         ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import sharp from 'sharp'
import webpmux from 'node-webpmux'
import { randomHex } from './crypto.js'

export interface StickerMetadata {
    pack?: string
    author?: string
    categories?: string[]
    id?: string
}

export type StickerFit = 'full' | 'crop' | 'contain'

const STICKER_SIZE = 512

/** Convierte una imagen estática a WebP de 512x512 para sticker. */
export async function imageToWebp(buffer: Buffer, { quality = 80, fit = 'contain' as StickerFit, background = 'transparent' } = {}) {
    const bg = background === 'transparent' ? { r: 0, g: 0, b: 0, alpha: 0 } : background
    return sharp(buffer, { animated: false })
        .resize(STICKER_SIZE, STICKER_SIZE, {
            fit: fit === 'crop' ? 'cover' : fit === 'full' ? 'fill' : 'contain',
            background: bg
        })
        .webp({ quality })
        .toBuffer()
}

/** Construye el bloque EXIF que WhatsApp lee para nombre de pack y autor. */
function buildExif({ pack = '', author = '', categories = [''], id = randomHex(16) }: StickerMetadata): Buffer {
    const json = Buffer.from(JSON.stringify({
        'sticker-pack-id': id,
        'sticker-pack-name': pack,
        'sticker-pack-publisher': author,
        'emojis': categories
    }), 'utf8')
    const header = Buffer.from([0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00])
    const exif = Buffer.concat([header, json])
    exif.writeUIntLE(json.length, 14, 4)
    return exif
}

/** Inserta los metadatos de sticker en un WebP (estático o animado). */
export async function writeExif(webp: Buffer, metadata: StickerMetadata): Promise<Buffer> {
    const img = new webpmux.Image()
    await img.load(webp)
    img.exif = buildExif(metadata)
    return img.save(null)
}
