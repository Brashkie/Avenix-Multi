/**
 * Plugin: Convertir a Sticker
 * Archivo: plugins/converter-sticker.ts
 * Avenix-Multi Bot
 * Creado por: Hepein Oficial
 */

import stickerMaker from '../lib/sticker.js'
import type { PluginHandler } from '../types/index.js'

const COOLDOWN = 3000

const handler: PluginHandler = async (m, { conn, args, usedPrefix, command }) => {
    const user = global.db.data.users[m.sender]

    if (Date.now() - (user.laststicker || 0) < COOLDOWN) {
        throw `⏱️ Espera 3 segundos antes de crear otro sticker`
    }

    const q = m.quoted ? m.quoted : m
    const mime: string = (q.msg || q).mimetype || q.mediaType || ''

    if (!/webp|image|video/.test(mime)) {
        throw `⚠️ *Responde a una imagen, video o GIF*\n\n*Formatos soportados:*\n• Imagen: JPG, PNG, WEBP\n• Video: MP4, GIF (máximo 10 segundos)\n• Sticker: WEBP\n\n*Ejemplo:* ${usedPrefix + command}`
    }
    if (/video/.test(mime) && ((q.msg || q).seconds || 0) > 10) {
        throw '⚠️ *El video no puede durar más de 10 segundos*\n\nIntenta con un video más corto o córtalo antes de enviarlo.'
    }

    const media = await q.download()
    if (!Buffer.isBuffer(media) || !media.length) {
        throw '⚠️ *No se pudo descargar el archivo*\n\nIntenta enviar el archivo nuevamente o verifica que no esté dañado.'
    }

    user.laststicker = Date.now()
    await m.reply('🎭 *Creando sticker...*\n\nEsto puede tomar unos segundos.')

    const noCrop = ['no-crop', 'nocrop', 'full'].includes(args[0])
    let sticker: Buffer
    try {
        sticker = await stickerMaker.create(media, {
            pack: global.packname || 'Avenix-Multi',
            author: global.author || 'Hepein Oficial',
            fit: noCrop ? 'contain' : 'cover'
        })
    } catch (e) {
        const text = String(e?.message || e)
        if (text.includes('size')) throw '⚠️ *Archivo demasiado grande*\n\nIntenta con una imagen o video más pequeño.'
        if (text.includes('format') || text.includes('mime')) throw '⚠️ *Formato no soportado*\n\nEnvía una imagen JPG/PNG o video MP4/GIF.'
        throw `⚠️ *Error al convertir a sticker*\n\n*Tips:*\n• Usa \`${usedPrefix + command} nocrop\` para sticker completo\n• Verifica que el archivo no esté dañado\n• Intenta con un archivo más pequeño`
    }

    await conn.sendMessage(m.chat, {
        sticker,
        contextInfo: {
            externalAdReply: {
                title: 'Sticker Creado ✅',
                body: `Por ${global.author}`,
                sourceUrl: global.github || 'https://github.com/Brashkie/Avenix-Multi',
                mediaType: 1
            }
        }
    }, { quoted: m as any })
}

handler.help = ['sticker', 's', 'stiker']
handler.tags = ['converter']
handler.command = /^(s|sticker|stiker)$/i
handler.limit = 1
handler.register = true

export default handler
