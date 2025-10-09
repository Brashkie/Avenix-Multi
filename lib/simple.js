/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                   𒁈 SIMPLE.JS V7.0.0 DEFINITIVO 𒁈                          ┃
 * ┃                Librería Completa para Baileys 6.7.9+                         ┃
 * ┃                Base: Avenix V6.0.0 + Black Clover MD                         ┃
 * ┃                                                                               ┃
 * ┃  CARACTERÍSTICAS COMPLETAS:                                                  ┃
 * ┃  ✅ Sistema de newsletters (4 canales únicos)                               ┃
 * ┃  ✅ Resolver LID para grupos con caché                                      ┃
 * ┃  ✅ Menciones con validación internacional                                  ┃
 * ┃  ✅ Botones modernos nativos de Baileys                                     ┃
 * ┃  ✅ Store completo con pushMessage                                          ┃
 * ┃  ✅ Todas las funciones de Black Clover MD                                  ┃
 * ┃  ✅ Logger optimizado con zona horaria                                      ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import path from 'path'
import { fileTypeFromBuffer } from 'file-type'
import { promises as fs } from 'fs'
import { format } from 'util'
import PhoneNumber from 'awesome-phonenumber'
import fetch from 'node-fetch'
import chalk from 'chalk'
import store from './store.js'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * @type {import('@whiskeysockets/baileys')}
 */
const {
    default: _makeWaSocket,
    proto,
    jidNormalizedUser,
    extractMessageContent,
    areJidsSameUser,
    generateWAMessageFromContent,
    generateForwardMessageContent,
    downloadContentFromMessage,
    generateWAMessage,
    getContentType,
    jidDecode,
    prepareWAMessageMedia,
    WAMessageStubType
} = (await import('@whiskeysockets/baileys')).default

// ═══════════════════════════════════════════════════════════════════════════════
// │                        CONFIGURACIÓN DE NEWSLETTERS                         │
// ═══════════════════════════════════════════════════════════════════════════════

const NEWSLETTERS = {
    canales: [
        '120363197223158904@newsletter',
        '120363420749165706@newsletter', 
        '120363418424557294@newsletter',
        '120363402823922168@newsletter'
    ],
    nombres: [
        '🎯 Avenix Canal 1',
        '🔥 Avenix Canal 2', 
        '⚡ Avenix Canal 3',
        '💎 Avenix Canal 4'
    ]
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                         MAKE WA SOCKET COMPLETO                             │
// ═══════════════════════════════════════════════════════════════════════════════

export function makeWASocket(connectionOptions, options = {}) {
    let conn = (global.opts['legacy'] ? makeWALegacySocket : _makeWaSocket)(connectionOptions)

    let sock = Object.defineProperties(conn, {
        chats: {
            value: { ...(options.chats || {}) },
            writable: true
        },
        
        // ═══════════════════════════════════════════════════════════════════════════════
        // │                            DECODE JID                                       │
        // ═══════════════════════════════════════════════════════════════════════════════
        
        decodeJid: {
            value(jid) {
                if (!jid || typeof jid !== 'string') return jid
                return jid.decodeJid()
            }
        },
        
        // ═══════════════════════════════════════════════════════════════════════════════
        // │                        LOGGER CON COLORES Y ZONA HORARIA                    │
        // ═══════════════════════════════════════════════════════════════════════════════
        
        logger: {
            get() {
                return {
                    info(...args) {
                        console.log(
                            chalk.bold.bgRgb(51, 204, 51)(' INFO '),
                            `[${chalk.rgb(255, 255, 255)(new Date().toLocaleString('es-PE'))}]:`,
                            chalk.cyan(format(...args))
                        )
                    },
                    error(...args) {
                        console.log(
                            chalk.bold.bgRgb(247, 38, 33)(' ERROR '),
                            `[${chalk.rgb(255, 255, 255)(new Date().toLocaleString('es-PE'))}]:`,
                            chalk.rgb(255, 38, 0)(format(...args))
                        )
                    },
                    warn(...args) {
                        console.log(
                            chalk.bold.bgRgb(255, 153, 0)(' WARN '),
                            `[${chalk.rgb(255, 255, 255)(new Date().toLocaleString('es-PE'))}]:`,
                            chalk.redBright(format(...args))
                        )
                    },
                    debug(...args) {
                        console.log(
                            chalk.bold.bgRgb(66, 167, 245)(' DEBUG '),
                            `[${chalk.rgb(255, 255, 255)(new Date().toLocaleString('es-PE'))}]:`,
                            chalk.white(format(...args))
                        )
                    }
                }
            },
            enumerable: true
        },

        // ═══════════════════════════════════════════════════════════════════════════════
        // │                      GET NAME ULTRA MEJORADO                                │
        // ═══════════════════════════════════════════════════════════════════════════════
        
        getName: {
            async value(jid = '', withoutContact = false) {
                try {
                    if (!jid || typeof jid !== 'string' || jid.includes('No SenderKeyRecord')) return ''
                    
                    jid = sock.decodeJid(jid)
                    withoutContact = sock.withoutContact || withoutContact
                    
                    let v
                    
                    // Grupos
                    if (jid.endsWith('@g.us')) {
                        return new Promise(async (resolve) => {
                            try {
                                v = sock.chats[jid] || {}
                                if (!(v.name || v.subject)) {
                                    v = await sock.groupMetadata(jid).catch(() => ({}))
                                }
                                resolve(v.name || v.subject || PhoneNumber('+' + jid.replace('@g.us', '')).getNumber('international'))
                            } catch {
                                resolve('')
                            }
                        })
                    }
                    
                    // Newsletters/Canales
                    if (jid.endsWith('@newsletter')) {
                        const canalIndex = NEWSLETTERS.canales.indexOf(jid)
                        if (canalIndex !== -1) {
                            return NEWSLETTERS.nombres[canalIndex]
                        }
                        try {
                            const newsletterInfo = await sock.newsletterMetadata?.(jid)
                            return newsletterInfo?.name || 'Canal Newsletter'
                        } catch {
                            return 'Canal Newsletter'
                        }
                    }
                    
                    // WhatsApp oficial
                    if (jid === '0@s.whatsapp.net') return 'WhatsApp'
                    
                    // Bot mismo
                    if (areJidsSameUser(jid, sock.user?.id)) return sock.user?.name || 'Bot'
                    
                    // Usuario normal
                    v = sock.chats[jid] || {}
                    
                    return (withoutContact ? '' : v.name) || 
                           v.subject || 
                           v.vname || 
                           v.notify || 
                           v.verifiedName || 
                           PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
                } catch {
                    return ''
                }
            }
        },

        // ═══════════════════════════════════════════════════════════════════════════════
        // │                    PARSE MENTION MEJORADO (CON VALIDACIÓN)                 │
        // ═══════════════════════════════════════════════════════════════════════════════
        
        parseMention: {
            value(text = '') {
                try {
                    const esNumeroValido = (numero) => {
                        const len = numero.length
                        if (len < 8 || len > 13) return false
                        if (len > 10 && numero.startsWith('9')) return false
                        
                        const codigosValidos = ['1','7','20','27','30','31','32','33','34','36','39','40','41','43','44','45','46','47','48','49','51','52','53','54','55','56','57','58','60','61','62','63','64','65','66','81','82','84','86','90','91','92','93','94','95','98','211','212','213','216','218','220','221','222','223','224','225','226','227','228','229','230','231','232','233','234','235','236','237','238','239','240','241','242','243','244','245','246','248','249','250','251','252','253','254','255','256','257','258','260','261','262','263','264','265','266','267','268','269','290','291','297','298','299','350','351','352','353','354','355','356','357','358','359','370','371','372','373','374','375','376','377','378','379','380','381','382','383','385','386','387','389','420','421','423','500','501','502','503','504','505','506','507','508','509','590','591','592','593','594','595','596','597','598','599','670','672','673','674','675','676','677','678','679','680','681','682','683','685','686','687','688','689','690','691','692','850','852','853','855','856','880','886','960','961','962','963','964','965','966','967','968','970','971','972','973','974','975','976','977','978','979','992','993','994','995','996','998']
                        
                        return codigosValidos.some(codigo => numero.startsWith(codigo))
                    }
                    
                    return (text.match(/@(\d{5,20})/g) || [])
                        .map(m => m.substring(1))
                        .map(numero => esNumeroValido(numero) ? `${numero}@s.whatsapp.net` : `${numero}@lid`)
                } catch {
                    return []
                }
            },
            enumerable: true
        },

        // ═══════════════════════════════════════════════════════════════════════════════
        // │                      REPLY MEJORADO CON NEWSLETTERS                         │
        // ═══════════════════════════════════════════════════════════════════════════════
        
        reply: {
            async value(jid, text = '', quoted, options = {}) {
                if (Buffer.isBuffer(text)) {
                    return sock.sendFile(jid, text, 'file', '', quoted, false, options)
                }
                
                function getRandomNewsletter() {
                    const randomIndex = Math.floor(Math.random() * NEWSLETTERS.canales.length)
                    return {
                        id: NEWSLETTERS.canales[randomIndex],
                        nombre: NEWSLETTERS.nombres[randomIndex]
                    }
                }
                
                const randomNewsletter = getRandomNewsletter()
                
                const contextInfo = {
                    mentionedJid: sock.parseMention(text),
                    isForwarded: true,
                    forwardingScore: 1,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: randomNewsletter.id,
                        newsletterName: randomNewsletter.nombre,
                        serverMessageId: Math.floor(Math.random() * 1000) + 100
                    }
                }
                
                const messageOptions = { 
                    ...options, 
                    text, 
                    contextInfo: {
                        ...contextInfo,
                        ...(options.contextInfo || {})
                    }
                }
                
                return sock.sendMessage(jid, messageOptions, { quoted, ...options })
            }
        },

        // ═══════════════════════════════════════════════════════════════════════════════
        // │                           GET FILE                                          │
        // ═══════════════════════════════════════════════════════════════════════════════
        
        getFile: {
            async value(PATH, saveToFile = false) {
                let res, filename
                const data = Buffer.isBuffer(PATH) ? PATH : 
                           PATH instanceof ArrayBuffer ? PATH.toBuffer() : 
                           /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], 'base64') : 
                           /^https?:\/\//.test(PATH) ? await (res = await fetch(PATH)).buffer() : 
                           fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : 
                           typeof PATH === 'string' ? PATH : Buffer.alloc(0)
                           
                if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer')
                
                const type = await fileTypeFromBuffer(data) || {
                    mime: 'application/octet-stream',
                    ext: '.bin'
                }
                
                if (data && saveToFile && !filename) {
                    filename = path.join(__dirname, '../tmp/' + new Date * 1 + '.' + type.ext)
                    await fs.promises.writeFile(filename, data)
                }
                
                return {
                    res,
                    filename,
                    ...type,
                    data,
                    deleteFile() {
                        return filename && fs.promises.unlink(filename)
                    }
                }
            },
            enumerable: true
        },

        // ═══════════════════════════════════════════════════════════════════════════════
        // │                          SEND FILE MEJORADO                                 │
        // ═══════════════════════════════════════════════════════════════════════════════
        
        sendFile: {
            async value(jid, path, filename = '', caption = '', quoted, ptt = false, options = {}) {
                let type = await sock.getFile(path, true)
                let { res, data: file, filename: pathFile } = type
                
                if (res && res.status !== 200 || file.length <= 65536) {
                    try { throw { json: JSON.parse(file.toString()) } } 
                    catch (e) { if (e.json) throw e.json }
                }
                
                let opt = { filename }
                if (quoted) opt.quoted = quoted
                if (!type) options.asDocument = true
                
                let mtype = '', mimetype = options.mimetype || type.mime
                
                if (/webp/.test(type.mime) || (/image/.test(type.mime) && options.asSticker)) {
                    mtype = 'sticker'
                } else if (/image/.test(type.mime) || (/webp/.test(type.mime) && options.asImage)) {
                    mtype = 'image'
                } else if (/video/.test(type.mime)) {
                    mtype = 'video'
                } else if (/audio/.test(type.mime)) {
                    mtype = 'audio'
                    if (ptt) {
                        options.ptt = true
                        mimetype = 'audio/ogg; codecs=opus'
                    }
                } else {
                    mtype = 'document'
                }
                
                if (options.asDocument) mtype = 'document'
                
                let message = { 
                    ...options, 
                    caption, 
                    ptt, 
                    [mtype]: { url: pathFile }, 
                    mimetype,
                    fileName: filename || pathFile.split('/').pop()
                }
                
                let m
                try {
                    m = await sock.sendMessage(jid, message, { ...opt, ...options })
                } catch (e) {
                    console.error(e)
                    m = null
                } finally {
                    if (!m) {
                        m = await sock.sendMessage(jid, { ...message, [mtype]: file }, { ...opt, ...options })
                    }
                    file = null
                    return m
                }
            },
            enumerable: true
        },

        // ═══════════════════════════════════════════════════════════════════════════════
        // │                        SEND BUTTON MODERNO                                  │
        // ═══════════════════════════════════════════════════════════════════════════════
        
        sendButton: {
            async value(jid, text = '', footer = '', buffer, buttons, copy, urls, quoted, options) {
                let img, video
                
                if (/^https?:\/\//i.test(buffer)) {
                    try {
                        const response = await fetch(buffer)
                        const contentType = response.headers.get('content-type')
                        if (/^image\//i.test(contentType)) {
                            img = await prepareWAMessageMedia({ image: { url: buffer } }, { upload: sock.waUploadToServer })
                        } else if (/^video\//i.test(contentType)) {
                            video = await prepareWAMessageMedia({ video: { url: buffer } }, { upload: sock.waUploadToServer })
                        }
                    } catch (error) {
                        console.error('Error al obtener tipo MIME:', error)
                    }
                } else if (buffer) {
                    try {
                        const type = await sock.getFile(buffer)
                        if (/^image\//i.test(type.mime)) {
                            img = await prepareWAMessageMedia({ image: buffer }, { upload: sock.waUploadToServer })
                        } else if (/^video\//i.test(type.mime)) {
                            video = await prepareWAMessageMedia({ video: buffer }, { upload: sock.waUploadToServer })
                        }
                    } catch (error) {
                        console.error('Error al procesar archivo:', error)
                    }
                }
                
                const dynamicButtons = buttons.map(btn => ({
                    name: 'quick_reply',
                    buttonParamsJson: JSON.stringify({
                        display_text: btn[0],
                        id: btn[1]
                    })
                }))
                
                if (copy && (typeof copy === 'string' || typeof copy === 'number')) {
                    dynamicButtons.push({
                        name: 'cta_copy',
                        buttonParamsJson: JSON.stringify({
                            display_text: 'Copiar',
                            copy_code: copy
                        })
                    })
                }
                
                if (urls && Array.isArray(urls)) {
                    urls.forEach(url => {
                        dynamicButtons.push({
                            name: 'cta_url',
                            buttonParamsJson: JSON.stringify({
                                display_text: url[0],
                                url: url[1],
                                merchant_url: url[1]
                            })
                        })
                    })
                }
                
                const interactiveMessage = {
                    body: { text: text },
                    footer: { text: footer },
                    header: {
                        hasMediaAttachment: !!(img || video),
                        imageMessage: img?.imageMessage || null,
                        videoMessage: video?.videoMessage || null
                    },
                    nativeFlowMessage: {
                        buttons: dynamicButtons,
                        messageParamsJson: ''
                    }
                }
                
                let msgL = generateWAMessageFromContent(jid, {
                    viewOnceMessage: {
                        message: { interactiveMessage }
                    }
                }, { userJid: sock.user.jid, quoted })
                
                return sock.relayMessage(jid, msgL.message, { messageId: msgL.key.id, ...options })
            }
        },

        // ═══════════════════════════════════════════════════════════════════════════════
        // │                        SEND LIST MODERNA                                    │
        // ═══════════════════════════════════════════════════════════════════════════════
        
        sendList: {
            async value(jid, title, text, buttonText, listSections, quoted, options = {}) {
                const sections = [...listSections]
                
                const message = {
                    interactiveMessage: {
                        header: { title: title },
                        body: { text: text }, 
                        nativeFlowMessage: {
                            buttons: [
                                {
                                    name: 'single_select',
                                    buttonParamsJson: JSON.stringify({
                                        title: buttonText,
                                        sections
                                    })
                                }
                            ],
                            messageParamsJson: ''
                        }
                    }
                }
                
                let msgL = generateWAMessageFromContent(jid, {
                    viewOnceMessage: { message }
                }, { userJid: sock.user.jid, quoted })
                
                return sock.relayMessage(jid, msgL.message, { messageId: msgL.key.id })
            }
        },

        // ═══════════════════════════════════════════════════════════════════════════════
        // │                   SEND LIST B (CON IMAGEN/VIDEO)                           │
        // ═══════════════════════════════════════════════════════════════════════════════
        
        sendListB: {
            async value(jid, title, text, buttonText, buffer, listSections, quoted, options = {}) {
                let img, video

                if (/^https?:\/\//i.test(buffer)) {
                    try {
                        const response = await fetch(buffer)
                        const contentType = response.headers.get('content-type')
                        if (/^image\//i.test(contentType)) {
                            img = await prepareWAMessageMedia({ image: { url: buffer } }, { upload: sock.waUploadToServer })
                        } else if (/^video\//i.test(contentType)) {
                            video = await prepareWAMessageMedia({ video: { url: buffer } }, { upload: sock.waUploadToServer })
                        }
                    } catch (error) {
                        sock.logger.error('Error al obtener tipo MIME:', error)
                    }
                } else if (buffer) {
                    try {
                        const type = await sock.getFile(buffer)
                        if (/^image\//i.test(type.mime)) {
                            img = await prepareWAMessageMedia({ image: buffer }, { upload: sock.waUploadToServer })
                        } else if (/^video\//i.test(type.mime)) {
                            video = await prepareWAMessageMedia({ video: buffer }, { upload: sock.waUploadToServer })
                        }
                    } catch (error) {
                        sock.logger.error('Error al procesar archivo:', error)
                    }
                }

                const sections = [...listSections]

                const message = {
                    interactiveMessage: {
                        header: {
                            title: title,
                            hasMediaAttachment: !!(img || video),
                            imageMessage: img?.imageMessage || null,
                            videoMessage: video?.videoMessage || null
                        },
                        body: { text: text },
                        nativeFlowMessage: {
                            buttons: [{
                                name: 'single_select',
                                buttonParamsJson: JSON.stringify({
                                    title: buttonText,
                                    sections
                                })
                            }],
                            messageParamsJson: ''
                        }
                    }
                }

                let msgL = generateWAMessageFromContent(jid, {
                    viewOnceMessage: { message }
                }, { userJid: sock.user.jid, quoted })

                return sock.relayMessage(jid, msgL.message, { messageId: msgL.key.id, ...options })
            }
        },

        // ═══════════════════════════════════════════════════════════════════════════════
        // │                       SEND SYLPH (EXTERNAL AD REPLY)                        │
        // ═══════════════════════════════════════════════════════════════════════════════
        
        sendSylph: {
            async value(jid, text = '', buffer, title, body, url, quoted, options) {
                if (buffer) {
                    try {
                        const type = await sock.getFile(buffer)
                        buffer = type.data
                    } catch {
                        buffer = buffer
                    }
                }
                
                let prep = generateWAMessageFromContent(jid, {
                    extendedTextMessage: {
                        text: text,
                        contextInfo: {
                            externalAdReply: {
                                title: title,
                                body: body,
                                thumbnail: buffer,
                                sourceUrl: url
                            },
                            mentionedJid: await sock.parseMention(text)
                        }
                    }
                }, { quoted: quoted })
                
                return sock.relayMessage(jid, prep.message, { messageId: prep.key.id })
            }
        },

        // ═══════════════════════════════════════════════════════════════════════════════
        // │                     SEND SYLPHY (ÁLBUMES DE MEDIOS)                         │
        // ═══════════════════════════════════════════════════════════════════════════════
        
        sendSylphy: {
            async value(jid, medias, options = {}) {
                if (typeof jid !== 'string') {
                    throw new TypeError(`jid must be string, received: ${jid}`)
                }
                
                for (const media of medias) {
                    if (!media.type || (media.type !== 'image' && media.type !== 'video')) {
                        throw new TypeError(`media.type must be "image" or "video"`)
                    }
                    if (!media.data || (!media.data.url && !Buffer.isBuffer(media.data))) {
                        throw new TypeError(`media.data must be object with url or buffer`)
                    }
                }
                
                if (medias.length < 2) {
                    throw new RangeError('Minimum 2 media required')
                }
                
                const delay = !isNaN(options.delay) ? options.delay : 500
                delete options.delay
                
                const album = generateWAMessageFromContent(jid, {
                    messageContextInfo: {},
                    albumMessage: {
                        expectedImageCount: medias.filter(m => m.type === 'image').length,
                        expectedVideoCount: medias.filter(m => m.type === 'video').length,
                        ...(options.quoted ? {
                            contextInfo: {
                                remoteJid: options.quoted.key.remoteJid,
                                fromMe: options.quoted.key.fromMe,
                                stanzaId: options.quoted.key.id,
                                participant: options.quoted.key.participant || options.quoted.key.remoteJid,
                                quotedMessage: options.quoted.message
                            }
                        } : {})
                    }
                }, {})
                
                await sock.relayMessage(album.key.remoteJid, album.message, {
                    messageId: album.key.id
                })
                
                for (let i = 0; i < medias.length; i++) {
                    const { type, data, caption } = medias[i]
                    
                    const message = await generateWAMessage(
                        album.key.remoteJid,
                        { [type]: data, caption: caption || '' },
                        { upload: sock.waUploadToServer }
                    )
                    
                    message.message.messageContextInfo = {
                        messageAssociation: {
                            associationType: 1,
                            parentMessageKey: album.key
                        }
                    }
                    
                    await sock.relayMessage(
                        message.key.remoteJid,
                        message.message,
                        { messageId: message.key.id }
                    )
                    
                    await new Promise(resolve => setTimeout(resolve, delay))
                }
                
                return album
            }
        },

        // ═══════════════════════════════════════════════════════════════════════════════
        // │                       SEND PAYMENT (MENSAJES DE PAGO)                       │
        // ═══════════════════════════════════════════════════════════════════════════════
        
        sendPayment: {
            async value(jid, amount, text, quoted, options) {
                return sock.relayMessage(jid, {
                    requestPaymentMessage: {
                        currencyCodeIso4217: 'PEN',
                        amount1000: amount,
                        requestFrom: null,
                        noteMessage: {
                            extendedTextMessage: {
                                text: text,
                                contextInfo: {
                                    externalAdReply: {
                                        showAdAttribution: true
                                    },
                                    mentionedJid: sock.parseMention(text)
                                }
                            }
                        }
                    }
                }, {})
            }
        },

        // ═══════════════════════════════════════════════════════════════════════════════
        // │                       SEND EVENT (EVENTOS)                                  │
        // ═══════════════════════════════════════════════════════════════════════════════
        
        sendEvent: {
            async value(jid, text, des, loc, link) {
                let msg = generateWAMessageFromContent(jid, {
                    messageContextInfo: {
                        messageSecret: crypto.randomBytes(32)
                    },
                    eventMessage: {
                        isCanceled: false,
                        name: text,
                        description: des,
                        location: {
                            degreesLatitude: 0,
                            degreesLongitude: 0,
                            name: loc
                        },
                        joinLink: link,
                        startTime: 'm.messageTimestamp'
                    }
                }, {})
                
                return sock.relayMessage(jid, msg.message, { messageId: msg.key.id })
            },
            enumerable: true
        },

        // ═══════════════════════════════════════════════════════════════════════════════
        // │                       SEND POLL (ENCUESTAS)                                 │
        // ═══════════════════════════════════════════════════════════════════════════════
        
        sendPoll: {
            async value(jid, name = '', optiPoll, options) {
                if (!Array.isArray(optiPoll[0]) && typeof optiPoll[0] === 'string') optiPoll = [optiPoll]
                if (!options) options = {}
                
                const pollMessage = {
                    name: name,
                    options: optiPoll.map(btn => ({
                        optionName: (!nullish(btn[0]) && btn[0]) || ''
                    })),
                    selectableOptionsCount: 1
                }
                
                return sock.relayMessage(jid, { pollCreationMessage: pollMessage }, { ...options })
            }
        },

        // ═══════════════════════════════════════════════════════════════════════════════
        // │                          SEND CONTACT                                       │
        // ═══════════════════════════════════════════════════════════════════════════════
        
        sendContact: {
            async value(jid, data, quoted, options) {
                if (!Array.isArray(data[0]) && typeof data[0] === 'string') data = [data]
                
                let contacts = []
                for (let [number, name] of data) {
                    number = number.replace(/[^0-9]/g, '')
                    let njid = number + '@s.whatsapp.net'
                    let biz = await sock.getBusinessProfile(njid).catch(_ => null) || {}
                    
                    let vcard = `
BEGIN:VCARD
VERSION:3.0
N:;${name.replace(/\n/g, '\\n')};;;
FN:${name.replace(/\n/g, '\\n')}
TEL;type=CELL;type=VOICE;waid=${number}:${PhoneNumber('+' + number).getNumber('international')}${biz.description ? `
X-WA-BIZ-NAME:${(sock.chats[njid]?.vname || sock.getName(njid) || name).replace(/\n/, '\\n')}
X-WA-BIZ-DESCRIPTION:${biz.description.replace(/\n/g, '\\n')}
`.trim() : ''}
END:VCARD`.trim()
                    
                    contacts.push({ vcard, displayName: name })
                }
                
                return await sock.sendMessage(jid, {
                    ...options,
                    contacts: {
                        ...options,
                        displayName: (contacts.length >= 2 ? `${contacts.length} contactos` : contacts[0].displayName) || null,
                        contacts
                    }
                }, { quoted, ...options })
            },
            enumerable: true
        },

        // ═══════════════════════════════════════════════════════════════════════════════
        // │                    SEND CONTACT ARRAY (MEJORADO)                            │
        // ═══════════════════════════════════════════════════════════════════════════════
        
        sendContactArray: {
            async value(jid, data, quoted, options) {
                if (!Array.isArray(data[0]) && typeof data[0] === 'string') data = [data]
                
                let contacts = []
                for (let [number, name, org, label1, email, region, website, extra] of data) {
                    number = number.replace(/[^0-9]/g, '')
                    let njid = number + '@s.whatsapp.net'
                    
                    let vcard = `
BEGIN:VCARD
VERSION:3.0
N:Sy;Bot;;;
FN:${name.replace(/\n/g, '\\n')}
item.ORG:${org || ''}
item1.TEL;waid=${number}:${PhoneNumber('+' + number).getNumber('international')}
item1.X-ABLabel:${label1 || 'Móvil'}
item2.EMAIL;type=INTERNET:${email || ''}
item2.X-ABLabel:📧 Email
item3.ADR:;;${region || ''};;;;
item3.X-ABADR:ac
item3.X-ABLabel:📍 Region
item4.URL:${website || ''}
item4.X-ABLabel:Website
item5.X-ABLabel:${extra || ''}
END:VCARD`.trim()
                    
                    contacts.push({ vcard, displayName: name })
                }
                
                return await sock.sendMessage(jid, {
                    contacts: {
                        displayName: (contacts.length > 1 ? `${contacts.length} contactos` : contacts[0].displayName) || null,
                        contacts
                    }
                }, { quoted, ...options })
            }
        },

        // ═══════════════════════════════════════════════════════════════════════════════
        // │                         DOWNLOAD MEDIA                                      │
        // ═══════════════════════════════════════════════════════════════════════════════
        
        downloadM: {
            async value(m, type, saveToFile) {
                let filename
                if (!m || !(m.url || m.directPath)) return Buffer.alloc(0)
                
                const stream = await downloadContentFromMessage(m, type)
                let buffer = Buffer.from([])
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk])
                }
                
                if (saveToFile) ({ filename } = await sock.getFile(buffer, true))
                return saveToFile && fs.existsSync(filename) ? filename : buffer
            },
            enumerable: true
        },

        // ═══════════════════════════════════════════════════════════════════════════════
        // │                         COPY N FORWARD                                      │
        // ═══════════════════════════════════════════════════════════════════════════════
        
        copyNForward: {
            async value(jid, message, forceForward = false, options = {}) {
                let vtype
                if (options.readViewOnce && message.message.viewOnceMessage?.message) {
                    vtype = Object.keys(message.message.viewOnceMessage.message)[0]
                    delete message.message.viewOnceMessage.message[vtype].viewOnce
                    message.message = proto.Message.fromObject(
                        JSON.parse(JSON.stringify(message.message.viewOnceMessage.message))
                    )
                    message.message[vtype].contextInfo = message.message.viewOnceMessage.contextInfo
                }
                
                const mtype = Object.keys(message.message)[0]
                let m = generateForwardMessageContent(message, !!forceForward)
                const ctype = Object.keys(m)[0]
                
                if (forceForward && typeof forceForward === 'number' && forceForward > 1) {
                    m[ctype].contextInfo.forwardingScore += forceForward
                }
                
                m[ctype].contextInfo = {
                    ...(message.message[mtype].contextInfo || {}),
                    ...(m[ctype].contextInfo || {})
                }
                
                m = generateWAMessageFromContent(jid, m, {
                    ...options,
                    userJid: sock.user.jid
                })
                
                await sock.relayMessage(jid, m.message, {
                    messageId: m.key.id,
                    additionalAttributes: { ...options }
                })
                
                return m
            },
            enumerable: true
        },

        // ═══════════════════════════════════════════════════════════════════════════════
        // │                              cMod                                           │
        // ═══════════════════════════════════════════════════════════════════════════════
        
        cMod: {
            value(jid, message, text = '', sender = sock.user.jid, options = {}) {
                if (options.mentions && !Array.isArray(options.mentions)) {
                    options.mentions = [options.mentions]
                }
                
                const copy = message.toJSON()
                delete copy.message.messageContextInfo
                delete copy.message.senderKeyDistributionMessage
                
                const mtype = Object.keys(copy.message)[0]
                const msg = copy.message
                const content = msg[mtype]
                
                if (typeof content === 'string') {
                    msg[mtype] = text || content
                } else if (content.caption) {
                    content.caption = text || content.caption
                } else if (content.text) {
                    content.text = text || content.text
                }
                
                if (typeof content !== 'string') {
                    msg[mtype] = { ...content, ...options }
                    msg[mtype].contextInfo = {
                        ...(content.contextInfo || {}),
                        mentionedJid: options.mentions || content.contextInfo?.mentionedJid || []
                    }
                }
                
                if (copy.participant) {
                    sender = copy.participant = sender || copy.participant
                } else if (copy.key.participant) {
                    sender = copy.key.participant = sender || copy.key.participant
                }
                
                if (copy.key.remoteJid.includes('@s.whatsapp.net')) {
                    sender = sender || copy.key.remoteJid
                } else if (copy.key.remoteJid.includes('@broadcast')) {
                    sender = sender || copy.key.remoteJid
                }
                
                copy.key.remoteJid = jid
                copy.key.fromMe = areJidsSameUser(sender, sock.user.id) || false
                
                return proto.WebMessageInfo.fromObject(copy)
            },
            enumerable: true
        },

        // ═══════════════════════════════════════════════════════════════════════════════
        // │                           FAKE REPLY                                        │
        // ═══════════════════════════════════════════════════════════════════════════════
        
        fakeReply: {
            value(jid, text = '', fakeJid = sock.user.jid, fakeText = '', fakeGroupJid, options) {
                return sock.reply(jid, text, {
                    key: {
                        fromMe: areJidsSameUser(fakeJid, sock.user.id),
                        participant: fakeJid,
                        ...(fakeGroupJid ? { remoteJid: fakeGroupJid } : {})
                    },
                    message: { conversation: fakeText },
                    ...options
                })
            }
        },

        // ═══════════════════════════════════════════════════════════════════════════════
        // │                         LOAD MESSAGE                                        │
        // ═══════════════════════════════════════════════════════════════════════════════
        
        loadMessage: {
            value(messageID) {
                return Object.entries(sock.chats)
                    .filter(([_, { messages }]) => typeof messages === 'object')
                    .find(([_, { messages }]) =>
                        Object.entries(messages).find(
                            ([k, v]) => k === messageID || v.key?.id === messageID
                        )
                    )?.[1].messages?.[messageID]
            },
            enumerable: true
        },

        // ═══════════════════════════════════════════════════════════════════════════════
        // │                   PROCESS MESSAGE STUB TYPE                                 │
        // ═══════════════════════════════════════════════════════════════════════════════
        
        processMessageStubType: {
            async value(m) {
                if (!m.messageStubType) return
                
                const chat = sock.decodeJid(
                    m.key.remoteJid ||
                    m.message?.senderKeyDistributionMessage?.groupId ||
                    ''
                )
                
                if (!chat || chat === 'status@broadcast') return
                
                const emitGroupUpdate = (update) => {
                    sock.ev.emit('groups.update', [{ id: chat, ...update }])
                }
                
                switch (m.messageStubType) {
                    case WAMessageStubType.REVOKE:
                    case WAMessageStubType.GROUP_CHANGE_INVITE_LINK:
                        emitGroupUpdate({ revoke: m.messageStubParameters[0] })
                        break
                    case WAMessageStubType.GROUP_CHANGE_ICON:
                        emitGroupUpdate({ icon: m.messageStubParameters[0] })
                        break
                    default: {
                        console.log({
                            messageStubType: m.messageStubType,
                            messageStubParameters: m.messageStubParameters,
                            type: WAMessageStubType[m.messageStubType]
                        })
                        break
                    }
                }
                
                const isGroup = chat.endsWith('@g.us')
                if (!isGroup) return
                
                let chats = sock.chats[chat]
                if (!chats) chats = sock.chats[chat] = { id: chat }
                chats.isChats = true
                
                const metadata = await sock.groupMetadata(chat).catch(_ => null)
                if (!metadata) return
                
                chats.subject = metadata.subject
                chats.metadata = metadata
            }
        },

        // ═══════════════════════════════════════════════════════════════════════════════
        // │                        INSERT ALL GROUP                                     │
        // ═══════════════════════════════════════════════════════════════════════════════
        
        insertAllGroup: {
            async value() {
                const groups = await sock.groupFetchAllParticipating().catch(_ => null) || {}
                
                for (const group in groups) {
                    sock.chats[group] = {
                        ...(sock.chats[group] || {}),
                        id: group,
                        subject: groups[group].subject,
                        isChats: true,
                        metadata: groups[group]
                    }
                }
                
                return sock.chats
            }
        },

        // ═══════════════════════════════════════════════════════════════════════════════
        // │                    PUSH MESSAGE (CRÍTICO PARA STORE)                        │
        // ═══════════════════════════════════════════════════════════════════════════════
        
        pushMessage: {
            async value(m) {
                if (!m) return
                if (!Array.isArray(m)) m = [m]
                
                for (const message of m) {
                    try {
                        if (!message) continue
                        
                        if (message.messageStubType && 
                            message.messageStubType != WAMessageStubType.CIPHERTEXT) {
                            sock.processMessageStubType(message).catch(console.error)
                        }
                        
                        const _mtype = Object.keys(message.message || {})
                        const mtype = (!['senderKeyDistributionMessage', 'messageContextInfo'].includes(_mtype[0]) && _mtype[0]) ||
                            (_mtype.length >= 3 && _mtype[1] !== 'messageContextInfo' && _mtype[1]) ||
                            _mtype[_mtype.length - 1]
                        
                        const chat = sock.decodeJid(
                            message.key.remoteJid ||
                            message.message?.senderKeyDistributionMessage?.groupId ||
                            ''
                        )
                        
                        if (message.message?.[mtype]?.contextInfo?.quotedMessage) {
                            const context = message.message[mtype].contextInfo
                            let participant = sock.decodeJid(context.participant)
                            const remoteJid = sock.decodeJid(context.remoteJid || participant)
                            const quoted = message.message[mtype].contextInfo.quotedMessage
                            
                            if (remoteJid && remoteJid !== 'status@broadcast' && quoted) {
                                let qMtype = Object.keys(quoted)[0]
                                
                                if (qMtype == 'conversation') {
                                    quoted.extendedTextMessage = { text: quoted[qMtype] }
                                    delete quoted.conversation
                                    qMtype = 'extendedTextMessage'
                                }
                                
                                if (!quoted[qMtype].contextInfo) {
                                    quoted[qMtype].contextInfo = {}
                                }
                                
                                quoted[qMtype].contextInfo.mentionedJid = 
                                    context.mentionedJid ||
                                    quoted[qMtype].contextInfo.mentionedJid ||
                                    []
                                
                                const isGroup = remoteJid.endsWith('g.us')
                                if (isGroup && !participant) participant = remoteJid
                                
                                const qM = {
                                    key: {
                                        remoteJid,
                                        fromMe: areJidsSameUser(sock.user.jid, remoteJid),
                                        id: context.stanzaId,
                                        participant
                                    },
                                    message: JSON.parse(JSON.stringify(quoted)),
                                    ...(isGroup ? { participant } : {})
                                }
                                
                                let qChats = sock.chats[participant]
                                if (!qChats) {
                                    qChats = sock.chats[participant] = {
                                        id: participant,
                                        isChats: !isGroup
                                    }
                                }
                                
                                if (!qChats.messages) qChats.messages = {}
                                
                                if (!qChats.messages[context.stanzaId] && !qM.key.fromMe) {
                                    qChats.messages[context.stanzaId] = qM
                                }
                                
                                let qChatsMessages
                                if ((qChatsMessages = Object.entries(qChats.messages)).length > 40) {
                                    qChats.messages = Object.fromEntries(
                                        qChatsMessages.slice(30, qChatsMessages.length)
                                    )
                                }
                            }
                        }
                        
                        if (!chat || chat === 'status@broadcast') continue
                        
                        const isGroup = chat.endsWith('@g.us')
                        let chats = sock.chats[chat]
                        
                        if (!chats) {
                            if (isGroup) await sock.insertAllGroup().catch(console.error)
                            chats = sock.chats[chat] = {
                                id: chat,
                                isChats: true,
                                ...(sock.chats[chat] || {})
                            }
                        }
                        
                        let metadata
                        let sender
                        
                        if (isGroup) {
                            if (!chats.subject || !chats.metadata) {
                                metadata = await sock.groupMetadata(chat).catch(_ => ({})) || {}
                                if (!chats.subject) chats.subject = metadata.subject || ''
                                if (!chats.metadata) chats.metadata = metadata
                            }
                            
                            sender = sock.decodeJid(
                                (message.key?.fromMe && sock.user.id) ||
                                message.participant ||
                                message.key?.participant ||
                                chat ||
                                ''
                            )
                            
                            if (sender !== chat) {
                                let chats = sock.chats[sender]
                                if (!chats) chats = sock.chats[sender] = { id: sender }
                                if (!chats.name) chats.name = message.pushName || chats.name || ''
                            }
                        } else if (!chats.name) {
                            chats.name = message.pushName || chats.name || ''
                        }
                        
                        if (['senderKeyDistributionMessage', 'messageContextInfo'].includes(mtype)) {
                            continue
                        }
                        
                        chats.isChats = true
                        if (!chats.messages) chats.messages = {}
                        
                        const fromMe = message.key.fromMe ||
                            areJidsSameUser(sender || chat, sock.user.id)
                        
                        if (!['protocolMessage'].includes(mtype) &&
                            !fromMe &&
                            message.messageStubType != WAMessageStubType.CIPHERTEXT &&
                            message.message) {
                            
                            delete message.message.messageContextInfo
                            delete message.message.senderKeyDistributionMessage
                            
                            chats.messages[message.key.id] = JSON.parse(
                                JSON.stringify(message, null, 2)
                            )
                            
                            let chatsMessages
                            if ((chatsMessages = Object.entries(chats.messages)).length > 40) {
                                chats.messages = Object.fromEntries(
                                    chatsMessages.slice(30, chatsMessages.length)
                                )
                            }
                        }
                    } catch (e) {
                        console.error(e)
                    }
                }
            }
        },

        // ═══════════════════════════════════════════════════════════════════════════════
        // │                      SEND GROUP V4 INVITE                                   │
        // ═══════════════════════════════════════════════════════════════════════════════
        
        sendGroupV4Invite: {
            async value(
                jid,
                participant,
                inviteCode,
                inviteExpiration,
                groupName = 'unknown subject',
                caption = 'Invitation to join my WhatsApp group',
                jpegThumbnail,
                options = {}
            ) {
                const msg = proto.Message.fromObject({
                    groupInviteMessage: proto.GroupInviteMessage.fromObject({
                        inviteCode,
                        inviteExpiration: parseInt(inviteExpiration) || 
                            +new Date(new Date() + 3 * 86400000),
                        groupJid: jid,
                        groupName: (groupName ? groupName : await sock.getName(jid)) || null,
                        jpegThumbnail: Buffer.isBuffer(jpegThumbnail) ? jpegThumbnail : null,
                        caption
                    })
                })
                
                const message = generateWAMessageFromContent(participant, msg, options)
                
                await sock.relayMessage(participant, message.message, {
                    messageId: message.key.id,
                    additionalAttributes: { ...options }
                })
                
                return message
            },
            enumerable: true
        },

        // ═══════════════════════════════════════════════════════════════════════════════
        // │                           WAIT EVENT                                        │
        // ═══════════════════════════════════════════════════════════════════════════════
        
        waitEvent: {
            value(eventName, is = () => true, maxTries = 25) {
                return new Promise((resolve, reject) => {
                    let tries = 0
                    let on = (...args) => {
                        if (++tries > maxTries) {
                            reject('Max tries reached')
                        } else if (is()) {
                            sock.ev.off(eventName, on)
                            resolve(...args)
                        }
                    }
                    sock.ev.on(eventName, on)
                })
            }
        },

        // ═══════════════════════════════════════════════════════════════════════════════
        // │                         SERIALIZE M                                         │
        // ═══════════════════════════════════════════════════════════════════════════════
        
        serializeM: {
            value(m) {
                return smsg(sock, m)
            }
        },

        // ═══════════════════════════════════════════════════════════════════════════════
        // │                         CHAT READ                                           │
        // ═══════════════════════════════════════════════════════════════════════════════
        
        ...(typeof conn.chatRead !== 'function' ? {
            chatRead: {
                value(jid, participant = sock.user.jid, messageID) {
                    return sock.sendReadReceipt(jid, participant, [messageID])
                },
                enumerable: true
            }
        } : {}),

        // ═══════════════════════════════════════════════════════════════════════════════
        // │                         SET STATUS                                          │
        // ═══════════════════════════════════════════════════════════════════════════════
        
        setStatus: {
            value(status) {
                return sock.query({
                    tag: 'iq',
                    attrs: {
                        to: jidNormalizedUser(sock.user.id),
                        type: 'set',
                        xmlns: 'status'
                    },
                    content: [{
                        tag: 'status',
                        attrs: {},
                        content: Buffer.from(status, 'utf-8')
                    }]
                })
            }
        }
    })

    if (sock.user?.id) sock.user.jid = sock.decodeJid(sock.user.id)
    store.bind(sock)
    return sock
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                         SMSG - SERIALIZAR MENSAJE                           │
// ═══════════════════════════════════════════════════════════════════════════════

export function smsg(conn, m, hasParent) {
    if (!m) return m
    
    const M = proto.WebMessageInfo
    try {
        m = M.fromObject(m)
        m.conn = conn
        
        let protocolMessageKey
        if (m.message) {
            if (m.mtype == 'protocolMessage' && m.msg?.key) {
                protocolMessageKey = m.msg.key
                if (protocolMessageKey.remoteJid === 'status@broadcast') {
                    protocolMessageKey.remoteJid = m.chat || ''
                }
                if (!protocolMessageKey.participant || protocolMessageKey.participant === 'status_me') {
                    protocolMessageKey.participant = typeof m.sender === 'string' ? m.sender : ''
                }
                const decodedParticipant = conn?.decodeJid?.(protocolMessageKey.participant) || ''
                protocolMessageKey.fromMe = decodedParticipant === (conn?.user?.id || '')
                if (!protocolMessageKey.fromMe && protocolMessageKey.remoteJid === (conn?.user?.id || '')) {
                    protocolMessageKey.remoteJid = typeof m.sender === 'string' ? m.sender : ''
                }
            }
            
            if (m.quoted && !m.quoted.mediaMessage) {
                delete m.quoted.download
            }
        }
        
        if (!m.mediaMessage) {
            delete m.download
        }
        
        if (protocolMessageKey && m.mtype == 'protocolMessage') {
            try {
                conn.ev.emit('message.delete', protocolMessageKey)
            } catch (e) {
                console.error('Error al emitir message.delete:', e)
            }
        }
        
        return m
    } catch (e) {
        console.error('Error en smsg:', e)
        return m
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                         SERIALIZE - PROTOTIPOS                              │
// ═══════════════════════════════════════════════════════════════════════════════

export function serialize() {
    const MediaType = ['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage', 'documentMessage']
    
    return Object.defineProperties(proto.WebMessageInfo.prototype, {
        conn: {
            value: undefined,
            enumerable: false,
            writable: true
        },
        id: {
            get() {
                return this.key?.id
            }
        },
        isBaileys: {
            get() {
                return (this?.fromMe || areJidsSameUser(this.conn?.user.id, this.sender)) && 
                       this.id.startsWith('3EB0') && 
                       (this.id.length === 20 || this.id.length === 22 || this.id.length === 12) || false
            }
        },
        chat: {
            get() {
                const senderKeyDistributionMessage = this.message?.senderKeyDistributionMessage?.groupId
                return (
                    this.key?.remoteJid ||
                    (senderKeyDistributionMessage && senderKeyDistributionMessage !== 'status@broadcast') || 
                    ''
                ).decodeJid()
            }
        },
        isGroup: {
            get() {
                return this.chat.endsWith('@g.us')
            },
            enumerable: true
        },
        sender: {
            get() {
                return this.conn?.decodeJid(this.key?.fromMe && this.conn?.user.id || this.participant || this.key.participant || this.chat || '')
            },
            enumerable: true
        },
        fromMe: {
            get() {
                return this.key?.fromMe || areJidsSameUser(this.conn?.user.id, this.sender) || false
            }
        },
        mtype: {
            get() {
                if (!this.message) return ''
                const type = Object.keys(this.message)
                return (!['senderKeyDistributionMessage', 'messageContextInfo'].includes(type[0]) && type[0]) ||
                       (type.length >= 3 && type[1] !== 'messageContextInfo' && type[1]) ||
                       type[type.length - 1]
            },
            enumerable: true
        },
        msg: {
            get() {
                if (!this.message) return null
                return this.message[this.mtype]
            }
        },
        mediaMessage: {
            get() {
                if (!this.message) return null
                const Message = ((this.msg?.url || this.msg?.directPath) ? { ...this.message } : extractMessageContent(this.message)) || null
                if (!Message) return null
                const mtype = Object.keys(Message)[0]
                return MediaType.includes(mtype) ? Message : null
            },
            enumerable: true
        },
        mediaType: {
            get() {
                let message
                if (!(message = this.mediaMessage)) return null
                return Object.keys(message)[0]
            },
            enumerable: true
        },
        quoted: {
            get() {
                const self = this
                const msg = self.msg
                const contextInfo = msg?.contextInfo
                const quoted = contextInfo?.quotedMessage
                if (!msg || !contextInfo || !quoted) return null
                
                const type = Object.keys(quoted)[0]
                let q = quoted[type]
                const text = typeof q === 'string' ? q : q.text
                
                return Object.defineProperties(JSON.parse(JSON.stringify(typeof q === 'string' ? { text: q } : q)), {
                    mtype: {
                        get() {
                            return type
                        },
                        enumerable: true
                    },
                    mediaMessage: {
                        get() {
                            const Message = ((q.url || q.directPath) ? { ...quoted } : extractMessageContent(quoted)) || null
                            if (!Message) return null
                            const mtype = Object.keys(Message)[0]
                            return MediaType.includes(mtype) ? Message : null
                        },
                        enumerable: true
                    },
                    mediaType: {
                        get() {
                            let message
                            if (!(message = this.mediaMessage)) return null
                            return Object.keys(message)[0]
                        },
                        enumerable: true
                    },
                    id: {
                        get() {
                            return contextInfo.stanzaId
                        },
                        enumerable: true
                    },
                    chat: {
                        get() {
                            return contextInfo.remoteJid || self.chat
                        },
                        enumerable: true
                    },
                    isBaileys: {
                        get() {
                            return (this?.fromMe || areJidsSameUser(this.conn?.user.id, this.sender)) && 
                                   this.id.startsWith('3EB0') && 
                                   (this.id.length === 20 || this.id.length === 22 || this.id.length === 12) || false
                        },
                        enumerable: true
                    },
                    sender: {
                        get() {
                            return (contextInfo.participant || this.chat || '').decodeJid()
                        },
                        enumerable: true
                    },
                    fromMe: {
                        get() {
                            return areJidsSameUser(this.sender, self.conn?.user.jid)
                        },
                        enumerable: true
                    },
                    text: {
                        get() {
                            return text || this.caption || this.contentText || this.selectedDisplayText || ''
                        },
                        enumerable: true
                    },
                    mentionedJid: {
                        get() {
                            return q.contextInfo?.mentionedJid || self.getQuotedObj()?.mentionedJid || []
                        },
                        enumerable: true
                    },
                    name: {
                        get() {
                            const sender = this.sender
                            return sender ? self.conn?.getName(sender) : null
                        },
                        enumerable: true
                    },
                    vM: {
                        get() {
                            return proto.WebMessageInfo.fromObject({
                                key: {
                                    fromMe: this.fromMe,
                                    remoteJid: this.chat,
                                    id: this.id
                                },
                                message: quoted,
                                ...(self.isGroup ? { participant: this.sender } : {})
                            })
                        }
                    },
                    fakeObj: {
                        get() {
                            return this.vM
                        }
                    },
                    download: {
                        value(saveToFile = false) {
                            const mtype = this.mediaType
                            return self.conn?.downloadM(this.mediaMessage[mtype], mtype.replace(/message/i, ''), saveToFile)
                        },
                        enumerable: true,
                        configurable: true
                    },
                    reply: {
                        value(text, chatId, options) {
                            return self.conn?.reply(chatId ? chatId : this.chat, text, this.vM, options)
                        },
                        enumerable: true
                    },
                    copy: {
                        value() {
                            const M = proto.WebMessageInfo
                            return smsg(conn, M.fromObject(M.toObject(this.vM)))
                        },
                        enumerable: true
                    },
                    forward: {
                        value(jid, force = false, options) {
                            return self.conn?.sendMessage(jid, {
                                forward: this.vM, force, ...options
                            }, { ...options })
                        },
                        enumerable: true
                    },
                    copyNForward: {
                        value(jid, forceForward = false, options) {
                            return self.conn?.copyNForward(jid, this.vM, forceForward, options)
                        },
                        enumerable: true
                    },
                    cMod: {
                        value(jid, text = '', sender = this.sender, options = {}) {
                            return self.conn?.cMod(jid, this.vM, text, sender, options)
                        },
                        enumerable: true
                    },
                    delete: {
                        value() {
                            return self.conn?.sendMessage(this.chat, { delete: this.vM.key })
                        },
                        enumerable: true
                    },
                    react: {
                        value(text) {
                            return self.conn?.sendMessage(this.chat, {
                                react: {
                                    text,
                                    key: this.vM.key
                                }
                            })
                        },
                        enumerable: true
                    }
                })
            },
            enumerable: true
        },
        _text: {
            value: null,
            writable: true
        },
        text: {
            get() {
                const msg = this.msg
                const text = (typeof msg === 'string' ? msg : msg?.text) || msg?.caption || msg?.contentText || ''
                return typeof this._text === 'string' ? this._text : '' || (typeof text === 'string' ? text : (
                    text?.selectedDisplayText ||
                    text?.hydratedTemplate?.hydratedContentText ||
                    text
                )) || ''
            },
            set(str) {
                return this._text = str
            },
            enumerable: true
        },
        mentionedJid: {
            get() {
                return this.msg?.contextInfo?.mentionedJid?.length && this.msg.contextInfo.mentionedJid || []
            },
            enumerable: true
        },
        name: {
            get() {
                return !nullish(this.pushName) && this.pushName || this.conn?.getName(this.sender)
            },
            enumerable: true
        },
        download: {
            value(saveToFile = false) {
                const mtype = this.mediaType
                return this.conn?.downloadM(this.mediaMessage[mtype], mtype.replace(/message/i, ''), saveToFile)
            },
            enumerable: true,
            configurable: true
        },
        reply: {
            value(text, chatId, options) {
                return this.conn?.reply(chatId ? chatId : this.chat, text, this, options)
            }
        },
        copy: {
            value() {
                const M = proto.WebMessageInfo
                return smsg(this.conn, M.fromObject(M.toObject(this)))
            },
            enumerable: true
        },
        forward: {
            value(jid, force = false, options = {}) {
                return this.conn?.sendMessage(jid, {
                    forward: this, force, ...options
                }, { ...options })
            },
            enumerable: true
        },
        copyNForward: {
            value(jid, forceForward = false, options = {}) {
                return this.conn?.copyNForward(jid, this, forceForward, options)
            },
            enumerable: true
        },
        cMod: {
            value(jid, text = '', sender = this.sender, options = {}) {
                return this.conn?.cMod(jid, this, text, sender, options)
            },
            enumerable: true
        },
        getQuotedObj: {
            value() {
                if (!this.quoted.id) return null
                const q = proto.WebMessageInfo.fromObject(this.conn?.loadMessage(this.quoted.id) || this.quoted.vM)
                return smsg(this.conn, q)
            },
            enumerable: true
        },
        getQuotedMessage: {
            get() {
                return this.getQuotedObj
            }
        },
        delete: {
            value() {
                return this.conn?.sendMessage(this.chat, { delete: this.key })
            },
            enumerable: true
        },
        react: {
            value(text) {
                return this.conn?.sendMessage(this.chat, {
                    react: {
                        text,
                        key: this.key
                    }
                })
            },
            enumerable: true
        }
    })
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                         PROTO TYPE - EXTENSIONES                            │
// ═══════════════════════════════════════════════════════════════════════════════

export function protoType() {
    Buffer.prototype.toArrayBuffer = function toArrayBufferV2() {
        const ab = new ArrayBuffer(this.length)
        const view = new Uint8Array(ab)
        for (let i = 0; i < this.length; ++i) {
            view[i] = this[i]
        }
        return ab
    }
    
    Buffer.prototype.toArrayBufferV2 = function toArrayBuffer() {
        return this.buffer.slice(this.byteOffset, this.byteOffset + this.byteLength)
    }
    
    ArrayBuffer.prototype.toBuffer = function toBuffer() {
        return Buffer.from(new Uint8Array(this))
    }
    
    Uint8Array.prototype.getFileType = ArrayBuffer.prototype.getFileType = Buffer.prototype.getFileType = async function getFileType() {
        return await fileTypeFromBuffer(this)
    }
    
    String.prototype.isNumber = Number.prototype.isNumber = isNumber
    
    String.prototype.capitalize = function capitalize() {
        return this.charAt(0).toUpperCase() + this.slice(1, this.length)
    }
    
    String.prototype.capitalizeV2 = function capitalizeV2() {
        const str = this.split(' ')
        return str.map(v => v.capitalize()).join(' ')
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │              RESOLVE LID TO REAL JID (CRÍTICO PARA GRUPOS)                  │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    String.prototype.resolveLidToRealJid = (function() {
        const lidCache = new Map()
        
        return async function(groupChatId, conn, maxRetries = 3, retryDelay = 60000) {
            const inputJid = this.toString()
            
            if (!inputJid.endsWith('@lid') || !groupChatId?.endsWith('@g.us')) {
                return inputJid.includes('@') ? inputJid : `${inputJid}@s.whatsapp.net`
            }
            
            if (lidCache.has(inputJid)) {
                return lidCache.get(inputJid)
            }
            
            const lidToFind = inputJid.split('@')[0]
            let attempts = 0
            
            while (attempts < maxRetries) {
                try {
                    const metadata = await conn?.groupMetadata(groupChatId)
                    if (!metadata?.participants) throw new Error('No se obtuvieron participantes')
                    
                    for (const participant of metadata.participants) {
                        try {
                            if (!participant?.jid) continue
                            const contactDetails = await conn?.onWhatsApp(participant.jid)
                            if (!contactDetails?.[0]?.lid) continue
                            
                            const possibleLid = contactDetails[0].lid.split('@')[0]
                            if (possibleLid === lidToFind) {
                                lidCache.set(inputJid, participant.jid)
                                return participant.jid
                            }
                        } catch {
                            continue
                        }
                    }
                    
                    lidCache.set(inputJid, inputJid)
                    return inputJid
                } catch (e) {
                    if (++attempts >= maxRetries) {
                        lidCache.set(inputJid, inputJid)
                        return inputJid
                    }
                    await new Promise(resolve => setTimeout(resolve, retryDelay))
                }
            }
            
            return inputJid
        }
    })()
    
    String.prototype.decodeJid = function decodeJid() {
        if (/:\d+@/gi.test(this)) {
            const decode = jidDecode(this) || {}
            return (decode.user && decode.server && decode.user + '@' + decode.server) || this
        } else return this.trim()
    }
    
    Number.prototype.toTimeString = function toTimeString() {
        const seconds = Math.floor((this / 1000) % 60)
        const minutes = Math.floor((this / (60 * 1000)) % 60)
        const hours = Math.floor((this / (60 * 60 * 1000)) % 24)
        const days = Math.floor(this / (24 * 60 * 60 * 1000))
        return (
            (days ? `${days} día(s) ` : '') +
            (hours ? `${hours} hora(s) ` : '') +
            (minutes ? `${minutes} minuto(s) ` : '') +
            (seconds ? `${seconds} segundo(s)` : '')
        ).trim()
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                         FUNCIONES AUXILIARES                                │
// ═══════════════════════════════════════════════════════════════════════════════

const isNumber = (number) => {
    const int = parseInt(number)
    return typeof int === 'number' && !isNaN(int)
}

function nullish(args) {
    return !(args !== null && args !== undefined)
}

export default {
    makeWASocket,
    smsg,
    serialize,
    protoType,
    NEWSLETTERS
}
