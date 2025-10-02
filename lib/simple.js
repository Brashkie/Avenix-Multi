/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                      𒁈 AVENIX-MULTI V6.0.0 - SIMPLE.JS 𒁈                    ┃
 * ┃                    Librería Ultra Moderna para Baileys 6.7.9                  ┃
 * ┃                          Creado por: Hepein Oficial                           ┃
 * ┃                                                                                ┃
 * ┃  CARACTERÍSTICAS HÍBRIDAS:                                                    ┃
 * ┃  ✅ Base limpia de Avenix + Funciones esenciales de Black Clover            ┃
 * ┃  ✅ Sistema completo de newsletters                                          ┃
 * ┃  ✅ Resolver LID para grupos                                                 ┃
 * ┃  ✅ Menciones mejoradas con validación internacional                         ┃
 * ┃  ✅ Botones modernos nativos de Baileys                                      ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import { 
    jidNormalizedUser, 
    extractMessageContent, 
    areJidsSameUser, 
    generateWAMessageFromContent,
    generateForwardMessageContent,
    downloadContentFromMessage,
    generateWAMessage,
    proto,
    getContentType,
    jidDecode,
    prepareWAMessageMedia,
    WAMessageStubType
} from '@whiskeysockets/baileys'
import { fileTypeFromBuffer } from 'file-type'
import { promises as fs } from 'fs'
import { join } from 'path'
import { format } from 'util'
import PhoneNumber from 'awesome-phonenumber'
import path from 'path'
import fetch from 'node-fetch'
import chalk from 'chalk'
import store from './store.js'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

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
// │                         MAKE WA SOCKET MEJORADO                             │
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
        // │                        LOGGER CON COLORES                                   │
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
                    // Validar códigos de país internacionales
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
                
                // Seleccionar canal aleatorio
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
                
                // Botón de copiar
                if (copy && (typeof copy === 'string' || typeof copy === 'number')) {
                    dynamicButtons.push({
                        name: 'cta_copy',
                        buttonParamsJson: JSON.stringify({
                            display_text: 'Copiar',
                            copy_code: copy
                        })
                    })
                }
                
                // Botones de URL
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
        // │                       SEND PAYMENT (DE BLACK CLOVER)                        │
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
        // │                       SEND EVENT (DE BLACK CLOVER)                          │
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
        // │                       SEND POLL (DE BLACK CLOVER)                           │
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
