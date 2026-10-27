/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                   𒁈 SIMPLE.TS V6.0.0 - AVENIX-MULTI 𒁈                       ┃
 * ┃                  Capa de utilidades sobre Baileys 7 (tipada)                 ┃
 * ┃                                                                               ┃
 * ┃  ✅ Sistema de newsletters (4 canales únicos)                               ┃
 * ┃  ✅ Resolución LID → número usando el mapeo nativo de Baileys               ┃
 * ┃  ✅ Menciones con validación internacional                                  ┃
 * ┃  ✅ Botones modernos nativos                                                ┃
 * ┃  ✅ Store en memoria con pushMessage                                        ┃
 * ┃  ✅ Logger con colores (ansimax)                                            ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import path from 'path'
import { existsSync, promises as fsp, readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { format } from 'util'
import { fileTypeFromBuffer } from 'file-type'
import { parsePhoneNumber } from 'awesome-phonenumber'
import _makeWaSocket, {
    WAMessageStubType,
    areJidsSameUser,
    downloadContentFromMessage,
    extractMessageContent,
    generateForwardMessageContent,
    generateWAMessage,
    generateWAMessageFromContent,
    isLidUser,
    isPnUser,
    jidDecode,
    jidNormalizedUser,
    prepareWAMessageMedia,
    proto
} from '@whiskeysockets/baileys'
import type { MediaType, UserFacingSocketConfig, WAMessage } from '@whiskeysockets/baileys'
import paint from './paint.js'
import { randomBytes } from './crypto.js'
import store from './store.js'
import type { AvenixSocket, BotLogger, ChatStore, ConnExtras, FileInfo, QuotedMessage, SMessage } from '../types/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TMP_DIR = path.join(__dirname, '../../tmp')

// ═══════════════════════════════════════════════════════════════════════════════
// │                        CONFIGURACIÓN DE NEWSLETTERS                         │
// ═══════════════════════════════════════════════════════════════════════════════

export const NEWSLETTERS = {
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
} as const

const COUNTRY_CODES = new Set(['1', '7', '20', '27', '30', '31', '32', '33', '34', '36', '39', '40', '41', '43', '44', '45', '46', '47', '48', '49', '51', '52', '53', '54', '55', '56', '57', '58', '60', '61', '62', '63', '64', '65', '66', '81', '82', '84', '86', '90', '91', '92', '93', '94', '95', '98', '211', '212', '213', '216', '218', '220', '221', '222', '223', '224', '225', '226', '227', '228', '229', '230', '231', '232', '233', '234', '235', '236', '237', '238', '239', '240', '241', '242', '243', '244', '245', '246', '248', '249', '250', '251', '252', '253', '254', '255', '256', '257', '258', '260', '261', '262', '263', '264', '265', '266', '267', '268', '269', '290', '291', '297', '298', '299', '350', '351', '352', '353', '354', '355', '356', '357', '358', '359', '370', '371', '372', '373', '374', '375', '376', '377', '378', '379', '380', '381', '382', '383', '385', '386', '387', '389', '420', '421', '423', '500', '501', '502', '503', '504', '505', '506', '507', '508', '509', '590', '591', '592', '593', '594', '595', '596', '597', '598', '599', '670', '672', '673', '674', '675', '676', '677', '678', '679', '680', '681', '682', '683', '685', '686', '687', '688', '689', '690', '691', '692', '850', '852', '853', '855', '856', '880', '886', '960', '961', '962', '963', '964', '965', '966', '967', '968', '970', '971', '972', '973', '974', '975', '976', '977', '978', '979', '992', '993', '994', '995', '996', '998'])

const MEDIA_TYPES = ['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage', 'documentMessage']
const IGNORED_TYPES = ['senderKeyDistributionMessage', 'messageContextInfo']

// ═══════════════════════════════════════════════════════════════════════════════
// │                            FUNCIONES AUXILIARES                             │
// ═══════════════════════════════════════════════════════════════════════════════

export function decodeJid(jid: string): string {
    if (/:\d+@/i.test(jid)) {
        const decoded = jidDecode(jid)
        return decoded?.user && decoded.server ? `${decoded.user}@${decoded.server}` : jid
    }
    return jid.trim()
}

export function formatPhone(number: string): string {
    const digits = number.replace(/\D/g, '')
    return parsePhoneNumber(`+${digits}`).number?.international ?? `+${digits}`
}

const hasCountryCode = (numero: string) => {
    for (let len = 1; len <= 3; len++) if (COUNTRY_CODES.has(numero.slice(0, len))) return true
    return false
}

function isValidPhone(numero: string): boolean {
    const len = numero.length
    if (len < 8 || len > 13) return false
    if (len > 10 && numero.startsWith('9')) return false
    return hasCountryCode(numero)
}

function getMessageType(message: proto.IMessage | null | undefined): string {
    if (!message) return ''
    const types = Object.keys(message)
    return (!IGNORED_TYPES.includes(types[0]) && types[0]) ||
        (types.length >= 3 && types[1] !== 'messageContextInfo' && types[1]) ||
        types[types.length - 1]
}

function getMediaMessage(message: proto.IMessage, inner: any): proto.IMessage | null {
    const content = (inner?.url || inner?.directPath) ? { ...message } : extractMessageContent(message)
    if (!content) return null
    return MEDIA_TYPES.includes(Object.keys(content)[0]) ? content : null
}

const isBaileysId = (id: string | undefined) =>
    !!id && id.startsWith('3EB0') && (id.length === 20 || id.length === 22 || id.length === 12)

const timestamp = () => paint.rgb(255, 255, 255)(new Date().toLocaleString('es-PE'))

const createLogger = (): BotLogger => ({
    info: (...args) => console.log(paint.bold.bgRgb(51, 204, 51)(' INFO '), `[${timestamp()}]:`, paint.cyan(format(...args))),
    error: (...args) => console.log(paint.bold.bgRgb(247, 38, 33)(' ERROR '), `[${timestamp()}]:`, paint.rgb(255, 38, 0)(format(...args))),
    warn: (...args) => console.log(paint.bold.bgRgb(255, 153, 0)(' WARN '), `[${timestamp()}]:`, paint.redBright(format(...args))),
    debug: (...args) => console.log(paint.bold.bgRgb(66, 167, 245)(' DEBUG '), `[${timestamp()}]:`, paint.white(format(...args)))
})

async function toMediaPayload(sock: AvenixSocket, buffer: string | Buffer | null | undefined) {
    let img: proto.Message.IImageMessage | undefined
    let video: proto.Message.IVideoMessage | undefined
    if (!buffer) return { img, video }
    try {
        let mime: string | null = null
        let media: Buffer | { url: string } = typeof buffer === 'string' ? { url: buffer } : buffer
        if (typeof buffer === 'string' && /^https?:\/\//i.test(buffer)) {
            const head = await fetch(buffer, { method: 'HEAD' })
            mime = head.headers.get('content-type')
        } else {
            const file = await sock.getFile(buffer)
            mime = file.mime
            media = file.data
        }
        if (mime && /^image\//i.test(mime)) {
            img = (await prepareWAMessageMedia({ image: media }, { upload: sock.waUploadToServer })).imageMessage ?? undefined
        } else if (mime && /^video\//i.test(mime)) {
            video = (await prepareWAMessageMedia({ video: media }, { upload: sock.waUploadToServer })).videoMessage ?? undefined
        }
    } catch (error) {
        sock.logger.error('Error al preparar media:', error)
    }
    return { img, video }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                         MAKE WA SOCKET COMPLETO                             │
// ═══════════════════════════════════════════════════════════════════════════════

export function makeWASocket(connectionOptions: UserFacingSocketConfig, options: { chats?: Record<string, ChatStore> } = {}): AvenixSocket {
    const sock = _makeWaSocket(connectionOptions) as unknown as AvenixSocket
    const logger = createLogger()

    const extras: Omit<ConnExtras, 'user' | 'logger' | 'chats'> = {
        decodeJid: ((jid: string | null | undefined) => (!jid || typeof jid !== 'string' ? jid : decodeJid(jid))) as ConnExtras['decodeJid'],

        async getName(jid = '', withoutContact = false) {
            try {
                if (!jid || jid.includes('No SenderKeyRecord')) return ''
                jid = sock.decodeJid(jid)
                withoutContact = sock.withoutContact || withoutContact

                if (jid.endsWith('@g.us')) {
                    let v: Partial<ChatStore> = sock.chats[jid] || {}
                    if (!(v.name || v.subject)) v = await sock.groupMetadata(jid).catch(() => ({}))
                    return v.name || v.subject || formatPhone(jid.replace('@g.us', ''))
                }

                if (jid.endsWith('@newsletter')) {
                    const idx = NEWSLETTERS.canales.indexOf(jid as (typeof NEWSLETTERS.canales)[number])
                    if (idx !== -1) return NEWSLETTERS.nombres[idx]
                    const info = await sock.newsletterMetadata('jid', jid).catch(() => null)
                    return info?.name || 'Canal Newsletter'
                }

                if (jid === '0@s.whatsapp.net') return 'WhatsApp'
                if (areJidsSameUser(jid, sock.user?.id)) return sock.user?.name || 'Bot'

                const v = sock.chats[jid] || {}
                return (withoutContact ? '' : v.name) || v.subject || v.vname || v.notify || v.verifiedName ||
                    formatPhone(jid.split('@')[0])
            } catch {
                return ''
            }
        },

        parseMention(text = '') {
            return [...text.matchAll(/@(\d{5,20})/g)].map(([, numero]) =>
                isValidPhone(numero) ? `${numero}@s.whatsapp.net` : `${numero}@lid`
            )
        },

        async reply(jid, text = '', quoted, options = {}) {
            if (Buffer.isBuffer(text)) return sock.sendFile(jid, text, 'file', '', quoted, false, options)

            const idx = Math.floor(Math.random() * NEWSLETTERS.canales.length)
            const contextInfo = {
                mentionedJid: sock.parseMention(text),
                isForwarded: true,
                forwardingScore: 1,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: NEWSLETTERS.canales[idx],
                    newsletterName: NEWSLETTERS.nombres[idx],
                    serverMessageId: Math.floor(Math.random() * 1000) + 100
                },
                ...(options.contextInfo || {})
            }
            const { contextInfo: _ignored, ...rest } = options
            return sock.sendMessage(jid, { ...rest, text, contextInfo } as any, { quoted: quoted as WAMessage, ...rest })
        },

        async getFile(PATH, saveToFile = false): Promise<FileInfo> {
            let res: Response | undefined
            let filename: string | undefined
            let data: Buffer
            if (Buffer.isBuffer(PATH)) data = PATH
            else if (PATH instanceof ArrayBuffer) data = Buffer.from(PATH)
            else if (/^data:.*?\/.*?;base64,/i.test(PATH)) data = Buffer.from(PATH.split(',')[1], 'base64')
            else if (/^https?:\/\//.test(PATH)) {
                res = await fetch(PATH)
                data = Buffer.from(await res.arrayBuffer())
            } else if (existsSync(PATH)) {
                filename = PATH
                data = readFileSync(PATH)
            } else throw new TypeError(`Archivo no encontrado o formato no soportado: ${String(PATH).slice(0, 80)}`)

            const type = await fileTypeFromBuffer(data) || { mime: 'application/octet-stream', ext: 'bin' }
            if (saveToFile && !filename) {
                await fsp.mkdir(TMP_DIR, { recursive: true })
                filename = path.join(TMP_DIR, `${Date.now()}.${type.ext}`)
                await fsp.writeFile(filename, data)
            }
            return {
                res,
                filename,
                mime: type.mime,
                ext: type.ext,
                data,
                deleteFile() {
                    return filename ? fsp.unlink(filename) : undefined
                }
            }
        },

        async sendFile(jid, filePath, filename = '', caption = '', quoted, ptt = false, options = {}) {
            const type = await sock.getFile(filePath)
            const { res, data: file } = type
            if (res && res.status !== 200) throw new Error(`Error HTTP ${res.status} al descargar el archivo`)
            if (/json|text\//.test(type.mime) && file.length <= 65536) {
                try { throw JSON.parse(file.toString()) } catch (e) { if (typeof e === 'object' && !(e instanceof SyntaxError)) throw e }
            }

            let mtype: 'sticker' | 'image' | 'video' | 'audio' | 'document' = 'document'
            let mimetype = options.mimetype || type.mime
            if (/webp/.test(type.mime) || (/image/.test(type.mime) && options.asSticker)) mtype = 'sticker'
            else if (/image/.test(type.mime) || (/webp/.test(type.mime) && options.asImage)) mtype = 'image'
            else if (/video/.test(type.mime)) mtype = 'video'
            else if (/audio/.test(type.mime)) {
                mtype = 'audio'
                if (ptt) mimetype = 'audio/ogg; codecs=opus'
            }
            if (options.asDocument) mtype = 'document'

            const { asSticker, asImage, asDocument, ...rest } = options
            const message = {
                ...rest,
                caption,
                ptt,
                [mtype]: file,
                mimetype,
                fileName: filename || type.filename?.split(/[\\/]/).pop() || `file.${type.ext}`
            }
            return sock.sendMessage(jid, message as any, { quoted: quoted as WAMessage, ...rest })
        },

        async sendButton(jid, text = '', footer = '', buffer, buttons, copy, urls, quoted, options) {
            const { img, video } = await toMediaPayload(sock, buffer)
            const dynamicButtons = buttons.map(([display_text, id]) => ({
                name: 'quick_reply',
                buttonParamsJson: JSON.stringify({ display_text, id })
            }))
            if (copy !== null && copy !== undefined && copy !== '') {
                dynamicButtons.push({
                    name: 'cta_copy',
                    buttonParamsJson: JSON.stringify({ display_text: 'Copiar', copy_code: copy })
                })
            }
            for (const [display_text, url] of urls || []) {
                dynamicButtons.push({
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({ display_text, url, merchant_url: url })
                })
            }
            const interactiveMessage = {
                body: { text },
                footer: { text: footer },
                header: { hasMediaAttachment: !!(img || video), imageMessage: img || null, videoMessage: video || null },
                nativeFlowMessage: { buttons: dynamicButtons, messageParamsJson: '' }
            }
            const msg = generateWAMessageFromContent(jid, { viewOnceMessage: { message: { interactiveMessage } } },
                { userJid: sock.user.jid, quoted: quoted as WAMessage })
            return sock.relayMessage(jid, msg.message!, { messageId: msg.key.id!, ...options })
        },

        async sendList(jid, title, text, buttonText, listSections, quoted, options = {}) {
            const interactiveMessage = {
                header: { title, hasMediaAttachment: false },
                body: { text },
                nativeFlowMessage: {
                    buttons: [{ name: 'single_select', buttonParamsJson: JSON.stringify({ title: buttonText, sections: listSections }) }],
                    messageParamsJson: ''
                }
            }
            const msg = generateWAMessageFromContent(jid, { viewOnceMessage: { message: { interactiveMessage } } },
                { userJid: sock.user.jid, quoted: quoted as WAMessage })
            return sock.relayMessage(jid, msg.message!, { messageId: msg.key.id!, ...options })
        },

        async sendListB(jid, title, text, buttonText, buffer, listSections, quoted, options = {}) {
            const { img, video } = await toMediaPayload(sock, buffer)
            const interactiveMessage = {
                header: { title, hasMediaAttachment: !!(img || video), imageMessage: img || null, videoMessage: video || null },
                body: { text },
                nativeFlowMessage: {
                    buttons: [{ name: 'single_select', buttonParamsJson: JSON.stringify({ title: buttonText, sections: listSections }) }],
                    messageParamsJson: ''
                }
            }
            const msg = generateWAMessageFromContent(jid, { viewOnceMessage: { message: { interactiveMessage } } },
                { userJid: sock.user.jid, quoted: quoted as WAMessage })
            return sock.relayMessage(jid, msg.message!, { messageId: msg.key.id!, ...options })
        },

        async sendSylph(jid, text = '', buffer, title, body, url, quoted, options) {
            let thumbnail: Buffer | undefined
            if (buffer) thumbnail = await sock.getFile(buffer).then(f => f.data).catch(() => undefined)
            const msg = generateWAMessageFromContent(jid, {
                extendedTextMessage: {
                    text,
                    contextInfo: {
                        externalAdReply: { title, body, thumbnail, sourceUrl: url },
                        mentionedJid: sock.parseMention(text)
                    }
                }
            }, { userJid: sock.user.jid, quoted: quoted as WAMessage })
            return sock.relayMessage(jid, msg.message!, { messageId: msg.key.id!, ...options })
        },

        async sendSylphy(jid, medias, options = {}) {
            for (const media of medias) {
                if (media.type !== 'image' && media.type !== 'video') throw new TypeError('media.type debe ser "image" o "video"')
                if (!media.data || (!Buffer.isBuffer(media.data) && !media.data.url)) {
                    throw new TypeError('media.data debe ser un buffer o un objeto con url')
                }
            }
            if (medias.length < 2) throw new RangeError('Se requieren al menos 2 medios')

            const { delay = 500, quoted } = options
            const q = quoted as WAMessage | undefined
            const album = generateWAMessageFromContent(jid, {
                messageContextInfo: {},
                albumMessage: {
                    expectedImageCount: medias.filter(m => m.type === 'image').length,
                    expectedVideoCount: medias.filter(m => m.type === 'video').length,
                    ...(q ? {
                        contextInfo: {
                            remoteJid: q.key.remoteJid,
                            fromMe: q.key.fromMe,
                            stanzaId: q.key.id,
                            participant: q.key.participant || q.key.remoteJid,
                            quotedMessage: q.message
                        }
                    } : {})
                }
            } as any, { userJid: sock.user.jid })

            await sock.relayMessage(jid, album.message!, { messageId: album.key.id! })

            for (const { type, data, caption } of medias) {
                const message = await generateWAMessage(jid, { [type]: data, caption: caption || '' } as any,
                    { upload: sock.waUploadToServer, userJid: sock.user.jid })
                message.message!.messageContextInfo = {
                    messageAssociation: { associationType: 1, parentMessageKey: album.key }
                } as any
                await sock.relayMessage(jid, message.message!, { messageId: message.key.id! })
                await new Promise<void>(resolve => setTimeout(resolve, delay))
            }
            return album
        },

        async sendPayment(jid, amount, text, quoted, options) {
            return sock.relayMessage(jid, {
                requestPaymentMessage: {
                    currencyCodeIso4217: 'PEN',
                    amount1000: amount,
                    requestFrom: null,
                    noteMessage: {
                        extendedTextMessage: {
                            text,
                            contextInfo: { externalAdReply: { showAdAttribution: true }, mentionedJid: sock.parseMention(text) }
                        }
                    }
                }
            } as proto.IMessage, { ...options })
        },

        async sendEvent(jid, text, des, loc, link) {
            const msg = generateWAMessageFromContent(jid, {
                messageContextInfo: { messageSecret: randomBytes(32) },
                eventMessage: {
                    isCanceled: false,
                    name: text,
                    description: des,
                    location: { degreesLatitude: 0, degreesLongitude: 0, name: loc },
                    joinLink: link,
                    startTime: Math.floor(Date.now() / 1000)
                }
            }, { userJid: sock.user.jid })
            return sock.relayMessage(jid, msg.message!, { messageId: msg.key.id! })
        },

        async sendPoll(jid, name = '', optiPoll, options = {}) {
            const values = (Array.isArray(optiPoll[0]) ? (optiPoll as string[][]).map(o => o[0]) : optiPoll as string[])
                .filter(Boolean)
            return sock.sendMessage(jid, { poll: { name, values, selectableCount: 1 } }, options)
        },

        async sendContact(jid, data, quoted, options = {}) {
            const list = (typeof data[0] === 'string' ? [data] : data) as [string, string][]
            const contacts: { vcard: string; displayName: string }[] = []
            for (const [rawNumber, name] of list) {
                const number = rawNumber.replace(/\D/g, '')
                const njid = `${number}@s.whatsapp.net`
                const biz = await sock.getBusinessProfile(njid).catch(() => undefined)
                const bizName = sock.chats[njid]?.vname || name
                const vcard = [
                    'BEGIN:VCARD',
                    'VERSION:3.0',
                    `N:;${name.replace(/\n/g, '\\n')};;;`,
                    `FN:${name.replace(/\n/g, '\\n')}`,
                    `TEL;type=CELL;type=VOICE;waid=${number}:${formatPhone(number)}`,
                    ...(biz && biz.description ? [
                        `X-WA-BIZ-NAME:${bizName.replace(/\n/g, '\\n')}`,
                        `X-WA-BIZ-DESCRIPTION:${biz.description.replace(/\n/g, '\\n')}`
                    ] : []),
                    'END:VCARD'
                ].join('\n')
                contacts.push({ vcard, displayName: name })
            }
            return sock.sendMessage(jid, {
                ...options,
                contacts: {
                    displayName: contacts.length >= 2 ? `${contacts.length} contactos` : contacts[0]?.displayName,
                    contacts
                }
            } as any, { quoted: quoted as WAMessage, ...options })
        },

        async sendContactArray(jid, data, quoted, options = {}) {
            const list = (typeof data[0] === 'string' ? [data] : data) as string[][]
            const contacts = list.map(([rawNumber, name, org, label1, email, region, website, extra]) => {
                const number = rawNumber.replace(/\D/g, '')
                const vcard = [
                    'BEGIN:VCARD',
                    'VERSION:3.0',
                    'N:Sy;Bot;;;',
                    `FN:${name.replace(/\n/g, '\\n')}`,
                    `item.ORG:${org || ''}`,
                    `item1.TEL;waid=${number}:${formatPhone(number)}`,
                    `item1.X-ABLabel:${label1 || 'Móvil'}`,
                    `item2.EMAIL;type=INTERNET:${email || ''}`,
                    'item2.X-ABLabel:📧 Email',
                    `item3.ADR:;;${region || ''};;;;`,
                    'item3.X-ABADR:ac',
                    'item3.X-ABLabel:📍 Region',
                    `item4.URL:${website || ''}`,
                    'item4.X-ABLabel:Website',
                    `item5.X-ABLabel:${extra || ''}`,
                    'END:VCARD'
                ].join('\n')
                return { vcard, displayName: name }
            })
            return sock.sendMessage(jid, {
                contacts: {
                    displayName: contacts.length > 1 ? `${contacts.length} contactos` : contacts[0]?.displayName,
                    contacts
                }
            }, { quoted: quoted as WAMessage, ...options })
        },

        async downloadM(m, type, saveToFile = false) {
            if (!m || !(m.url || m.directPath)) return Buffer.alloc(0)
            const stream = await downloadContentFromMessage(m, type as MediaType)
            const chunks: Buffer[] = []
            for await (const chunk of stream) chunks.push(chunk)
            const buffer = Buffer.concat(chunks)
            if (!saveToFile) return buffer
            const { filename } = await sock.getFile(buffer, true)
            return filename && existsSync(filename) ? filename : buffer
        },

        async copyNForward(jid, message, forceForward = false, options = {}) {
            if (options.readViewOnce && message.message?.viewOnceMessage?.message) {
                const inner = message.message.viewOnceMessage.message
                const vtype = Object.keys(inner)[0]
                delete inner[vtype].viewOnce
                message.message = proto.Message.fromObject(structuredClone(inner))
                message.message[vtype].contextInfo = inner.contextInfo
            }
            const mtype = Object.keys(message.message)[0]
            const content: any = generateForwardMessageContent(message, !!forceForward)
            const ctype = Object.keys(content)[0]
            if (typeof forceForward === 'number' && forceForward > 1) content[ctype].contextInfo.forwardingScore += forceForward
            content[ctype].contextInfo = {
                ...(message.message[mtype]?.contextInfo || {}),
                ...(content[ctype].contextInfo || {})
            }
            const m = generateWAMessageFromContent(jid, content, { ...options, userJid: sock.user.jid })
            await sock.relayMessage(jid, m.message!, { messageId: m.key.id!, additionalAttributes: { ...options } })
            return m
        },

        cMod(jid, message, text = '', sender = sock.user.jid, options = {}) {
            if (options.mentions && !Array.isArray(options.mentions)) options.mentions = [options.mentions]
            const copy = typeof message.toJSON === 'function' ? message.toJSON() : structuredClone(message)
            delete copy.message.messageContextInfo
            delete copy.message.senderKeyDistributionMessage

            const mtype = Object.keys(copy.message)[0]
            const msg = copy.message
            const content = msg[mtype]
            if (typeof content === 'string') msg[mtype] = text || content
            else if (content.caption) content.caption = text || content.caption
            else if (content.text) content.text = text || content.text

            if (typeof content !== 'string') {
                msg[mtype] = { ...content, ...options }
                msg[mtype].contextInfo = {
                    ...(content.contextInfo || {}),
                    mentionedJid: options.mentions || content.contextInfo?.mentionedJid || []
                }
            }
            if (copy.participant) sender = copy.participant = sender || copy.participant
            else if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
            else sender = sender || copy.key.remoteJid

            copy.key.remoteJid = jid
            copy.key.fromMe = areJidsSameUser(sender, sock.user.id) || false
            return proto.WebMessageInfo.fromObject(copy)
        },

        fakeReply(jid, text = '', fakeJid = sock.user.jid, fakeText = '', fakeGroupJid, options) {
            return sock.reply(jid, text, {
                key: {
                    fromMe: areJidsSameUser(fakeJid, sock.user.id),
                    participant: fakeJid,
                    ...(fakeGroupJid ? { remoteJid: fakeGroupJid } : {})
                },
                message: { conversation: fakeText },
                ...options
            })
        },

        loadMessage(messageID) {
            for (const chat of Object.values(sock.chats)) {
                const found = chat.messages?.[messageID]
                if (found) return found
            }
            return undefined
        },

        async processMessageStubType(m) {
            if (!m.messageStubType) return
            const chat = sock.decodeJid(m.key.remoteJid || m.message?.senderKeyDistributionMessage?.groupId || '')
            if (!chat || chat === 'status@broadcast') return

            const params = m.messageStubParameters || []
            switch (m.messageStubType) {
                case WAMessageStubType.REVOKE:
                case WAMessageStubType.GROUP_CHANGE_INVITE_LINK:
                    sock.ev.emit('groups.update', [{ id: chat, revoke: params[0] } as any])
                    break
                case WAMessageStubType.GROUP_CHANGE_ICON:
                    sock.ev.emit('groups.update', [{ id: chat, icon: params[0] } as any])
                    break
            }

            if (!chat.endsWith('@g.us')) return
            const chats = sock.chats[chat] ||= { id: chat }
            chats.isChats = true
            const metadata = await sock.groupMetadata(chat).catch(() => null)
            if (!metadata) return
            chats.subject = metadata.subject
            chats.metadata = metadata
        },

        async insertAllGroup() {
            const groups = await sock.groupFetchAllParticipating().catch(() => null) || {}
            for (const [id, metadata] of Object.entries(groups)) {
                sock.chats[id] = { ...(sock.chats[id] || {}), id, subject: metadata.subject, isChats: true, metadata }
            }
            return sock.chats
        },

        async pushMessage(input) {
            const messages = Array.isArray(input) ? input : [input]
            for (const message of messages) {
                try {
                    if (!message) continue
                    if (message.messageStubType && message.messageStubType !== WAMessageStubType.CIPHERTEXT) {
                        sock.processMessageStubType(message).catch(console.error)
                    }

                    const mtype = getMessageType(message.message)
                    const chat = sock.decodeJid(message.key.remoteJid || message.message?.senderKeyDistributionMessage?.groupId || '')
                    const inner: any = mtype ? message.message?.[mtype as keyof proto.IMessage] : null

                    const context = inner?.contextInfo
                    if (context?.quotedMessage) {
                        let participant = sock.decodeJid(context.participant)
                        const remoteJid = sock.decodeJid(context.remoteJid || participant)
                        const quoted = context.quotedMessage
                        if (remoteJid && remoteJid !== 'status@broadcast') {
                            let qMtype = Object.keys(quoted)[0]
                            if (qMtype === 'conversation') {
                                quoted.extendedTextMessage = { text: quoted[qMtype] }
                                delete quoted.conversation
                                qMtype = 'extendedTextMessage'
                            }
                            quoted[qMtype].contextInfo ||= {}
                            quoted[qMtype].contextInfo.mentionedJid = context.mentionedJid || quoted[qMtype].contextInfo.mentionedJid || []

                            const isGroup = remoteJid.endsWith('g.us')
                            if (isGroup && !participant) participant = remoteJid
                            const qM = {
                                key: { remoteJid, fromMe: areJidsSameUser(sock.user.jid, remoteJid), id: context.stanzaId, participant },
                                message: structuredClone(quoted),
                                ...(isGroup ? { participant } : {})
                            }
                            if (participant) {
                                const qChats = sock.chats[participant] ||= { id: participant, isChats: !isGroup }
                                qChats.messages ||= {}
                                if (!qChats.messages[context.stanzaId] && !qM.key.fromMe) qChats.messages[context.stanzaId] = qM
                                const entries = Object.entries(qChats.messages)
                                if (entries.length > 40) qChats.messages = Object.fromEntries(entries.slice(30))
                            }
                        }
                    }

                    if (!chat || chat === 'status@broadcast') continue
                    const isGroup = chat.endsWith('@g.us')
                    let chats = sock.chats[chat]
                    if (!chats) {
                        if (isGroup) await sock.insertAllGroup().catch(console.error)
                        chats = sock.chats[chat] = { ...(sock.chats[chat] || {}), id: chat, isChats: true }
                    }

                    let sender: string | undefined
                    if (isGroup) {
                        if (!chats.subject || !chats.metadata) {
                            const metadata = await sock.groupMetadata(chat).catch(() => null)
                            if (metadata) {
                                chats.subject ||= metadata.subject || ''
                                chats.metadata ||= metadata
                            }
                        }
                        sender = sock.decodeJid((message.key?.fromMe && sock.user.id) || message.participant || message.key?.participant || chat)
                        if (sender !== chat) {
                            const senderChat = sock.chats[sender] ||= { id: sender }
                            senderChat.name ||= message.pushName || ''
                        }
                    } else if (!chats.name) {
                        chats.name = message.pushName || ''
                    }

                    if (IGNORED_TYPES.includes(mtype)) continue
                    chats.isChats = true
                    chats.messages ||= {}

                    const fromMe = message.key.fromMe || areJidsSameUser(sender || chat, sock.user.id)
                    if (mtype !== 'protocolMessage' && !fromMe && message.messageStubType !== WAMessageStubType.CIPHERTEXT && message.message) {
                        delete message.message.messageContextInfo
                        delete message.message.senderKeyDistributionMessage
                        chats.messages[message.key.id!] = structuredClone(message)
                        const entries = Object.entries(chats.messages)
                        if (entries.length > 40) chats.messages = Object.fromEntries(entries.slice(30))
                    }
                } catch (e) {
                    console.error(e)
                }
            }
        },

        async sendGroupV4Invite(jid, participant, inviteCode, inviteExpiration, groupName = 'unknown subject',
            caption = 'Invitation to join my WhatsApp group', jpegThumbnail, options = {}) {
            const expiration = Number(inviteExpiration) || Math.floor((Date.now() + 3 * 86_400_000) / 1000)
            const msg = proto.Message.fromObject({
                groupInviteMessage: {
                    inviteCode,
                    inviteExpiration: expiration,
                    groupJid: jid,
                    groupName: groupName || await sock.getName(jid) || null,
                    jpegThumbnail: Buffer.isBuffer(jpegThumbnail) ? jpegThumbnail : null,
                    caption
                }
            })
            const message = generateWAMessageFromContent(participant, msg, { ...options, userJid: sock.user.jid })
            await sock.relayMessage(participant, message.message!, { messageId: message.key.id!, additionalAttributes: { ...options } })
            return message
        },

        waitEvent(eventName, is = () => true, maxTries = 25) {
            return new Promise((resolve, reject) => {
                let tries = 0
                const on = (arg: any) => {
                    if (++tries > maxTries) {
                        sock.ev.off(eventName, on)
                        reject(new Error('Max tries reached'))
                    } else if (is()) {
                        sock.ev.off(eventName, on)
                        resolve(arg)
                    }
                }
                sock.ev.on(eventName, on)
            })
        },

        serializeM(m) {
            return smsg(sock, m)
        },

        setStatus(status) {
            return sock.query({
                tag: 'iq',
                attrs: { to: jidNormalizedUser(sock.user.id), type: 'set', xmlns: 'status' },
                content: [{ tag: 'status', attrs: {}, content: Buffer.from(status, 'utf-8') }]
            })
        },

        /** Convierte un JID @lid al JID de número usando el mapeo nativo de Baileys (sin consultas de red). */
        async resolveLid(jid) {
            if (!isLidUser(jid)) return jid
            const pn = await sock.signalRepository.lidMapping.getPNForLID(jid).catch(() => null)
            return pn ? jidNormalizedUser(pn) : jid
        }
    }

    Object.defineProperty(sock, 'chats', { value: { ...(options.chats || {}) }, writable: true, enumerable: true })
    Object.defineProperty(sock, 'logger', { get: () => logger, enumerable: true })
    for (const [key, value] of Object.entries(extras)) {
        Object.defineProperty(sock, key, { value, writable: true, enumerable: true, configurable: true })
    }

    // `user.jid` siempre disponible (Baileys solo expone `user.id`, que puede incluir el device)
    const syncUserJid = () => {
        const user = (sock as any).authState?.creds?.me ?? sock.user
        if (user?.id) {
            sock.user ||= user
            sock.user.jid = sock.decodeJid(sock.user.id)
        }
    }
    syncUserJid()
    sock.ev.on('connection.update', ({ connection }) => { if (connection === 'open') syncUserJid() })
    sock.ev.on('creds.update', syncUserJid)

    store.bind(sock)
    return sock
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                         SMSG - SERIALIZAR MENSAJE                           │
// ═══════════════════════════════════════════════════════════════════════════════

export function smsg(conn: AvenixSocket, raw: WAMessage | proto.IWebMessageInfo | null | undefined): SMessage | undefined {
    if (!raw) return undefined
    const m = proto.WebMessageInfo.fromObject(raw) as unknown as SMessage
    m.conn = conn
    // Baileys 7: `remoteJidAlt` / `participantAlt` traen el número cuando el JID principal es LID
    const key = raw.key as WAMessage['key']
    if (key?.participantAlt) (m.key as any).participantAlt = key.participantAlt
    if (key?.remoteJidAlt) (m.key as any).remoteJidAlt = key.remoteJidAlt

    try {
        if (m.message && m.mtype === 'protocolMessage' && m.msg?.key) {
            const pKey = m.msg.key
            if (pKey.remoteJid === 'status@broadcast') pKey.remoteJid = m.chat || ''
            if (!pKey.participant || pKey.participant === 'status_me') pKey.participant = m.sender || ''
            pKey.fromMe = conn.decodeJid(pKey.participant) === (conn.user?.jid || '')
            if (!pKey.fromMe && pKey.remoteJid === (conn.user?.jid || '')) pKey.remoteJid = m.sender || ''
            conn.ev.emit('messages.delete', { keys: [pKey] })
        }
    } catch (e) {
        console.error('Error en smsg:', e)
    }
    return m
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                         SERIALIZE - PROTOTIPOS                              │
// ═══════════════════════════════════════════════════════════════════════════════

type Self = SMessage

function buildQuoted(self: Self): QuotedMessage | null {
    const msg = self.msg
    const contextInfo = msg?.contextInfo
    const quoted = contextInfo?.quotedMessage
    if (!msg || !contextInfo || !quoted) return null

    const type = Object.keys(quoted)[0]
    const q = quoted[type]
    const text: string | undefined = typeof q === 'string' ? q : q?.text
    const base = structuredClone(typeof q === 'string' ? { text: q } : q ?? {})
    const conn = self.conn

    const quotedObj: QuotedMessage = Object.defineProperties(base, {
        mtype: { get: () => type, enumerable: true },
        mediaMessage: { get: () => getMediaMessage(quoted, q), enumerable: true },
        mediaType: {
            get() { const mm = getMediaMessage(quoted, q); return mm ? Object.keys(mm)[0] : null },
            enumerable: true
        },
        id: { get: () => contextInfo.stanzaId, enumerable: true },
        chat: { get: () => contextInfo.remoteJid || self.chat, enumerable: true },
        isBaileys: {
            get(this: QuotedMessage) { return (this.fromMe || areJidsSameUser(conn?.user?.id, this.sender)) && isBaileysId(this.id) },
            enumerable: true
        },
        sender: { get: () => decodeJid(contextInfo.participant || contextInfo.remoteJid || self.chat || ''), enumerable: true },
        fromMe: { get(this: QuotedMessage) { return areJidsSameUser(this.sender, conn?.user?.jid) }, enumerable: true },
        text: {
            get(this: QuotedMessage) { return text || this.caption || this.contentText || this.selectedDisplayText || '' },
            enumerable: true
        },
        mentionedJid: {
            get: () => q?.contextInfo?.mentionedJid || self.getQuotedObj()?.mentionedJid || [],
            enumerable: true
        },
        name: {
            get(this: QuotedMessage) { return conn?.chats[this.sender]?.name || this.sender.split('@')[0] },
            enumerable: true
        },
        vM: {
            get(this: QuotedMessage) {
                return proto.WebMessageInfo.fromObject({
                    key: { fromMe: this.fromMe, remoteJid: this.chat, id: this.id },
                    message: quoted,
                    ...(self.isGroup ? { participant: this.sender } : {})
                })
            }
        },
        fakeObj: { get(this: QuotedMessage) { return this.vM } },
        download: {
            value(this: QuotedMessage, saveToFile = false) {
                const mtype = this.mediaType
                if (!mtype || !this.mediaMessage) return Promise.resolve(Buffer.alloc(0))
                return conn.downloadM((this.mediaMessage as any)[mtype], mtype.replace(/message/i, ''), saveToFile)
            },
            enumerable: true,
            configurable: true
        },
        reply: {
            value(this: QuotedMessage, txt: string | Buffer, chatId?: string | null, options?: Record<string, any>) {
                return conn.reply(chatId || this.chat, txt, this.vM, options)
            },
            enumerable: true
        },
        copy: { value(this: QuotedMessage) { return smsg(conn, proto.WebMessageInfo.fromObject(proto.WebMessageInfo.toObject(this.vM))) }, enumerable: true },
        forward: {
            value(this: QuotedMessage, jid: string, force = false, options: Record<string, any> = {}) {
                return conn.sendMessage(jid, { forward: this.vM as WAMessage, force, ...options }, { ...options })
            },
            enumerable: true
        },
        copyNForward: {
            value(this: QuotedMessage, jid: string, forceForward: boolean | number = false, options?: Record<string, any>) {
                return conn.copyNForward(jid, this.vM, forceForward, options)
            },
            enumerable: true
        },
        cMod: {
            value(this: QuotedMessage, jid: string, txt = '', sender = this.sender, options: Record<string, any> = {}) {
                return conn.cMod(jid, this.vM, txt, sender, options)
            },
            enumerable: true
        },
        delete: { value(this: QuotedMessage) { return conn.sendMessage(this.chat, { delete: this.vM.key as WAMessage['key'] }) }, enumerable: true },
        react: {
            value(this: QuotedMessage, reaction: string) {
                return conn.sendMessage(this.chat, { react: { text: reaction, key: this.vM.key } })
            },
            enumerable: true
        }
    })
    return quotedObj
}

export function serialize() {
    return Object.defineProperties(proto.WebMessageInfo.prototype, {
        conn: { value: undefined, enumerable: false, writable: true },
        id: { get(this: Self) { return this.key?.id } },
        isBaileys: {
            get(this: Self) { return (this.fromMe || areJidsSameUser(this.conn?.user?.id, this.sender)) && isBaileysId(this.id) }
        },
        chat: {
            get(this: Self) {
                const groupId = this.message?.senderKeyDistributionMessage?.groupId
                return decodeJid(this.key?.remoteJid || (groupId && groupId !== 'status@broadcast' ? groupId : '') || '')
            }
        },
        isGroup: { get(this: Self) { return this.chat.endsWith('@g.us') }, enumerable: true },
        sender: {
            get(this: Self) {
                const key = this.key as WAMessage['key']
                if (key?.fromMe && this.conn?.user?.jid) return this.conn.user.jid
                const participant = this.participant || key?.participant
                // Preferimos el número real cuando WhatsApp entrega un LID
                const alt = participant ? key?.participantAlt : key?.remoteJidAlt
                const jid = alt && isPnUser(alt) && !isPnUser(participant || key?.remoteJid || '') ? alt : (participant || this.chat || '')
                return decodeJid(jid)
            },
            enumerable: true
        },
        fromMe: { get(this: Self) { return this.key?.fromMe || areJidsSameUser(this.conn?.user?.id, this.sender) || false } },
        mtype: { get(this: Self) { return getMessageType(this.message) }, enumerable: true },
        msg: { get(this: Self) { return this.message ? (this.message as any)[this.mtype] : null } },
        mediaMessage: { get(this: Self) { return this.message ? getMediaMessage(this.message, this.msg) : null }, enumerable: true },
        mediaType: {
            get(this: Self) { const mm = this.mediaMessage; return mm ? Object.keys(mm)[0] : null },
            enumerable: true
        },
        quoted: { get(this: Self) { return buildQuoted(this) }, enumerable: true },
        _text: { value: null, writable: true },
        text: {
            get(this: Self & { _text: string | null }) {
                if (typeof this._text === 'string') return this._text
                const msg = this.msg
                const text = (typeof msg === 'string' ? msg : msg?.text) || msg?.caption || msg?.contentText ||
                    msg?.selectedDisplayText || msg?.hydratedTemplate?.hydratedContentText || ''
                return typeof text === 'string' ? text : ''
            },
            set(this: Self & { _text: string | null }, str: string) { this._text = str },
            enumerable: true
        },
        mentionedJid: {
            get(this: Self) { return this.msg?.contextInfo?.mentionedJid?.length ? this.msg.contextInfo.mentionedJid : [] },
            enumerable: true
        },
        name: {
            get(this: Self) {
                return this.pushName || this.conn?.chats[this.sender]?.name || this.sender.split('@')[0]
            },
            enumerable: true
        },
        download: {
            value(this: Self, saveToFile = false) {
                const mtype = this.mediaType
                if (!mtype || !this.mediaMessage) return Promise.resolve(Buffer.alloc(0))
                return this.conn.downloadM((this.mediaMessage as any)[mtype], mtype.replace(/message/i, ''), saveToFile)
            },
            enumerable: true,
            configurable: true
        },
        reply: {
            value(this: Self, text: string | Buffer, chatId?: string | null, options?: Record<string, any>) {
                return this.conn.reply(chatId || this.chat, text, this, options)
            }
        },
        copy: {
            value(this: Self) { return smsg(this.conn, proto.WebMessageInfo.fromObject(proto.WebMessageInfo.toObject(this as any))) },
            enumerable: true
        },
        forward: {
            value(this: Self, jid: string, force = false, options: Record<string, any> = {}) {
                return this.conn.sendMessage(jid, { forward: this as WAMessage, force, ...options }, { ...options })
            },
            enumerable: true
        },
        copyNForward: {
            value(this: Self, jid: string, forceForward: boolean | number = false, options: Record<string, any> = {}) {
                return this.conn.copyNForward(jid, this, forceForward, options)
            },
            enumerable: true
        },
        cMod: {
            value(this: Self, jid: string, text = '', sender = this.sender, options: Record<string, any> = {}) {
                return this.conn.cMod(jid, this, text, sender, options)
            },
            enumerable: true
        },
        getQuotedObj: {
            value(this: Self) {
                const quoted = this.quoted
                if (!quoted?.id) return null
                const stored = this.conn.loadMessage(quoted.id)
                return smsg(this.conn, proto.WebMessageInfo.fromObject(stored || quoted.vM)) ?? null
            },
            enumerable: true
        },
        getQuotedMessage: { get(this: Self) { return this.getQuotedObj } },
        delete: { value(this: Self) { return this.conn.sendMessage(this.chat, { delete: this.key }) }, enumerable: true },
        react: {
            value(this: Self, text: string) { return this.conn.sendMessage(this.chat, { react: { text, key: this.key } }) },
            enumerable: true
        }
    })
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                         PROTO TYPE - EXTENSIONES                            │
// ═══════════════════════════════════════════════════════════════════════════════

declare global {
    interface String {
        decodeJid(): string
        capitalize(): string
        capitalizeV2(): string
        isNumber(): boolean
    }
    interface Number {
        toTimeString(): string
        isNumber(): boolean
    }
    interface Buffer {
        toArrayBuffer(): ArrayBuffer
        getFileType(): Promise<Awaited<ReturnType<typeof fileTypeFromBuffer>>>
    }
    interface ArrayBuffer {
        toBuffer(): Buffer
    }
}

export function protoType() {
    const define = (target: object, name: string, value: (...args: any[]) => unknown) =>
        Object.defineProperty(target, name, { value, writable: true, configurable: true, enumerable: false })

    define(Buffer.prototype, 'toArrayBuffer', function (this: Buffer) {
        return this.buffer.slice(this.byteOffset, this.byteOffset + this.byteLength)
    })
    define(ArrayBuffer.prototype, 'toBuffer', function (this: ArrayBuffer) {
        return Buffer.from(this)
    })
    define(Buffer.prototype, 'getFileType', function (this: Buffer) {
        return fileTypeFromBuffer(this)
    })
    define(String.prototype, 'isNumber', function (this: string) {
        return !isNaN(parseInt(this))
    })
    define(Number.prototype, 'isNumber', function (this: number) {
        return !isNaN(this)
    })
    define(String.prototype, 'capitalize', function (this: string) {
        return this.charAt(0).toUpperCase() + this.slice(1)
    })
    define(String.prototype, 'capitalizeV2', function (this: string) {
        return this.split(' ').map(v => v.capitalize()).join(' ')
    })
    define(String.prototype, 'decodeJid', function (this: string) {
        return decodeJid(String(this))
    })
    define(Number.prototype, 'toTimeString', function (this: number) {
        const ms = Number(this)
        const seconds = Math.floor((ms / 1000) % 60)
        const minutes = Math.floor((ms / 60_000) % 60)
        const hours = Math.floor((ms / 3_600_000) % 24)
        const days = Math.floor(ms / 86_400_000)
        return [
            days && `${days} día(s)`,
            hours && `${hours} hora(s)`,
            minutes && `${minutes} minuto(s)`,
            seconds && `${seconds} segundo(s)`
        ].filter(Boolean).join(' ')
    })
}

export default {
    makeWASocket,
    smsg,
    serialize,
    protoType,
    NEWSLETTERS
}
