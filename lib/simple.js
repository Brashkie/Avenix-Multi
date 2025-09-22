/**
 * Librería Simple Ultra Moderna - Avenix Multi
 * Versión optimizada para @whiskeysockets/baileys@6.7.5
 * Creado por: Hepein Oficial
 * 
 * SOLUCIONES IMPLEMENTADAS:
 * ✅ Menciones correctas en sendMessage
 * ✅ Nombres de usuario mejorados con getName
 * ✅ Integración de newsletters/canales
 * ✅ Sistema de reply avanzado con canales
 * ✅ Compatibilidad con Baileys 6.7.5
 */

import { 
    jidNormalizedUser, 
    extractMessageContent, 
    areJidsSameUser, 
    generateWAMessageFromContent,
    generateForwardMessageContent,
    downloadContentFromMessage,
    generateWAMessage,
    generateWAMessageContent,
    proto,
    getContentType,
    jidDecode,
    prepareWAMessageMedia,
    getBinaryNodeChildren,
    getBinaryNodeChild,
    makeWASocket as _makeWaSocket 
} from '@whiskeysockets/baileys';
import { fileTypeFromBuffer } from 'file-type';
import { promises as fs } from 'fs';
import { join } from 'path';
import { format } from 'util';
import jimp from 'jimp';
import PhoneNumber from 'awesome-phonenumber';
import path from 'path';
import fetch from 'node-fetch';
import chalk from 'chalk';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

// TUS CANALES DE NEWSLETTER
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
};

/**
 * Crear socket WASocket mejorado
 */
export function makeWASocket(connectionOptions, options = {}) {
    import { makeWASocket as _makeWaSocket } from '@whiskeysockets/baileys';
    let conn = _makeWaSocket(connectionOptions);
    
    let sock = Object.defineProperties(conn, {
        chats: {
            value: { ...(options.chats || {}) },
            writable: true
        },
        
        // Logger mejorado con colores
        logger: {
            get() {
                return {
                    info(...args) {
                        console.log(
                            chalk.bold.bgRgb(51, 204, 51)('INFO '),
                            `[${chalk.rgb(255, 255, 255)(new Date().toLocaleString('es-ES'))}]:`,
                            chalk.cyan(format(...args))
                        );
                    },
                    error(...args) {
                        console.log(
                            chalk.bold.bgRgb(247, 38, 33)('ERROR '),
                            `[${chalk.rgb(255, 255, 255)(new Date().toLocaleString('es-ES'))}]:`,
                            chalk.rgb(255, 38, 0)(format(...args))
                        );
                    },
                    warn(...args) {
                        console.log(
                            chalk.bold.bgRgb(255, 153, 0)('WARNING '),
                            `[${chalk.rgb(255, 255, 255)(new Date().toLocaleString('es-ES'))}]:`,
                            chalk.redBright(format(...args))
                        );
                    },
                    debug(...args) {
                        console.log(
                            chalk.bold.bgRgb(66, 167, 245)('DEBUG '),
                            `[${chalk.rgb(255, 255, 255)(new Date().toLocaleString('es-ES'))}]:`,
                            chalk.white(format(...args))
                        );
                    }
                };
            },
            enumerable: true
        },

        /**
         * Decodificar JID correctamente
         */
        decodeJid: {
            value(jid) {
                if (!jid || typeof jid !== 'string') return jid;
                if (/:\d+@/gi.test(jid)) {
                    const decode = jidDecode(jid) || {};
                    return (decode.user && decode.server && decode.user + '@' + decode.server || jid).trim();
                }
                return jid.trim();
            }
        },

        /**
         * Obtener nombre MEJORADO - SOLUCION DEFINITIVA
         */
        getName: {
            async value(jid = '', withoutContact = false) {
                jid = sock.decodeJid(jid);
                withoutContact = sock.withoutContact || withoutContact;
                
                let v;
                
                // Manejar grupos
                if (jid.endsWith('@g.us')) {
                    return new Promise(async (resolve) => {
                        v = sock.chats[jid] || {};
                        if (!(v.name || v.subject)) {
                            try {
                                v = await sock.groupMetadata(jid) || {};
                            } catch (e) {
                                console.log('Error obteniendo metadata del grupo:', e);
                                v = {};
                            }
                        }
                        resolve(v.name || v.subject || jid);
                    });
                }
                
                // Manejar newsletters/canales
                if (jid.endsWith('@newsletter')) {
                    const canalIndex = NEWSLETTERS.canales.indexOf(jid);
                    if (canalIndex !== -1) {
                        return NEWSLETTERS.nombres[canalIndex];
                    }
                    try {
                        const newsletterInfo = await sock.newsletterMetadata?.(jid);
                        return newsletterInfo?.name || 'Canal Newsletter';
                    } catch (e) {
                        return 'Canal Newsletter';
                    }
                }
                
                // Casos especiales
                if (jid === '0@s.whatsapp.net') {
                    return 'WhatsApp';
                }
                
                if (areJidsSameUser(jid, sock.user?.id)) {
                    return sock.user?.name || 'Bot';
                }
                
                // Usuario normal
                v = sock.chats[jid] || {};
                
                // Buscar en base de datos si existe
                let userName = global.db?.data?.users?.[jid.replace('@s.whatsapp.net', '')]?.name;
                
                if (!userName) {
                    try {
                        const phoneNumber = '+' + jid.replace('@s.whatsapp.net', '');
                        userName = PhoneNumber(phoneNumber).getNumber('international');
                    } catch (e) {
                        userName = jid.split('@')[0];
                    }
                }
                
                return (withoutContact ? '' : v.name) || 
                       v.subject || 
                       v.vname || 
                       v.notify || 
                       v.verifiedName || 
                       userName || 
                       jid.split('@')[0];
            },
            enumerable: true
        },

        /**
         * Reply mejorado con integración de newsletters
         */
        reply: {
            async value(jid, text = '', quoted, options = {}) {
                if (Buffer.isBuffer(text)) {
                    return sock.sendFile(jid, text, 'file', '', quoted, false, options);
                }
                
                // Seleccionar canal aleatorio para contextInfo
                function getRandomNewsletter() {
                    const randomIndex = Math.floor(Math.random() * NEWSLETTERS.canales.length);
                    return {
                        id: NEWSLETTERS.canales[randomIndex],
                        nombre: NEWSLETTERS.nombres[randomIndex]
                    };
                }
                
                const randomNewsletter = getRandomNewsletter();
                
                const contextInfo = {
                    mentionedJid: sock.parseMention(text),
                    isForwarded: true,
                    forwardingScore: 1,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: randomNewsletter.id,
                        newsletterName: randomNewsletter.nombre,
                        serverMessageId: Math.floor(Math.random() * 1000) + 100
                    }
                };
                
                const messageOptions = { 
                    ...options, 
                    text, 
                    contextInfo: {
                        ...contextInfo,
                        ...(options.contextInfo || {})
                    }
                };
                
                return sock.sendMessage(jid, messageOptions, { quoted, ...options });
            }
        },

        /**
         * sendText mejorado con menciones automáticas
         */
        sendText: {
            async value(jid, text, quoted, options = {}) {
                // Detectar menciones automáticamente
                const mentions = [...text.matchAll(/@(\d{1,16})/g)].map(v => v[1] + '@s.whatsapp.net');
                
                const message = {
                    text: text,
                    ...options
                };
                
                if (mentions.length > 0) {
                    message.mentions = mentions;
                }
                
                return sock.sendMessage(jid, message, { quoted, ...options });
            }
        },

        /**
         * sendTextWithMentions - menciones específicas
         */
        sendTextWithMentions: {
            async value(jid, text, quoted, options = {}) {
                const mentions = [...text.matchAll(/@(\d{1,16})/g)].map(v => v[1] + '@s.whatsapp.net');
                return sock.sendMessage(jid, { 
                    text: text, 
                    mentions: mentions,
                    ...options 
                }, { quoted });
            }
        },

        /**
         * Enviar archivo mejorado
         */
        sendFile: {
            async value(jid, path, filename = '', caption = '', quoted, ptt = false, options = {}) {
                let type = await sock.getFile(path, true);
                let { res, data: file, filename: pathFile } = type;
                
                if (res && res.status !== 200 || file.length <= 65536) {
                    try { 
                        throw { json: JSON.parse(file.toString()) }; 
                    } catch (e) { 
                        if (e.json) throw e.json; 
                    }
                }
                
                let opt = { filename };
                if (quoted) opt.quoted = quoted;
                if (!type) options.asDocument = true;
                
                let mtype = '', mimetype = options.mimetype || type.mime;
                
                if (/webp/.test(type.mime) || (/image/.test(type.mime) && options.asSticker)) {
                    mtype = 'sticker';
                } else if (/image/.test(type.mime) || (/webp/.test(type.mime) && options.asImage)) {
                    mtype = 'image';
                } else if (/video/.test(type.mime)) {
                    mtype = 'video';
                } else if (/audio/.test(type.mime)) {
                    mtype = 'audio';
                    if (ptt) {
                        options.ptt = true;
                        mimetype = 'audio/ogg; codecs=opus';
                    }
                } else {
                    mtype = 'document';
                }
                
                if (options.asDocument) mtype = 'document';
                
                let message = { 
                    ...options, 
                    caption, 
                    ptt, 
                    [mtype]: { url: pathFile }, 
                    mimetype,
                    fileName: filename || pathFile.split('/').pop()
                };
                
                let m;
                try {
                    m = await sock.sendMessage(jid, message, { ...opt, ...options });
                } catch (e) {
                    console.error(e);
                    m = null;
                } finally {
                    if (!m) {
                        m = await sock.sendMessage(jid, { 
                            ...message, 
                            [mtype]: file 
                        }, { ...opt, ...options });
                    }
                    file = null;
                    return m;
                }
            },
            enumerable: true
        },

        /**
         * Enviar imagen
         */
        sendImage: {
            async value(jid, path, caption = '', quoted = '', options = {}) {
                let buffer = Buffer.isBuffer(path) ? path : 
                           /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split(',')[1], 'base64') : 
                           /^https?:\/\//.test(path) ? await (await fetch(path)).buffer() : 
                           await fs.readFile(path);
                           
                return await sock.sendMessage(jid, { 
                    image: buffer, 
                    caption: caption, 
                    ...options 
                }, { quoted });
            }
        },

        /**
         * Enviar video
         */
        sendVideo: {
            async value(jid, path, caption = '', quoted = '', gif = false, options = {}) {
                let buffer = Buffer.isBuffer(path) ? path : 
                           /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split(',')[1], 'base64') : 
                           /^https?:\/\//.test(path) ? await (await fetch(path)).buffer() : 
                           await fs.readFile(path);
                           
                return await sock.sendMessage(jid, { 
                    video: buffer, 
                    caption: caption, 
                    gifPlayback: gif, 
                    ...options 
                }, { quoted });
            }
        },

        /**
         * Enviar audio
         */
        sendAudio: {
            async value(jid, path, quoted = '', ptt = false, options = {}) {
                let buffer = Buffer.isBuffer(path) ? path : 
                           /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split(',')[1], 'base64') : 
                           /^https?:\/\//.test(path) ? await (await fetch(path)).buffer() : 
                           await fs.readFile(path);
                           
                return await sock.sendMessage(jid, { 
                    audio: buffer, 
                    ptt: ptt, 
                    ...options 
                }, { quoted });
            }
        },

        /**
         * Enviar botones modernos
         */
        sendButton: {
            async value(jid, text = '', footer = '', buffer, buttons = [], copy, urls, quoted, options = {}) {
                let img, video;
                
                // Procesar media
                if (buffer) {
                    if (/^https?:\/\//i.test(buffer)) {
                        try {
                            const response = await fetch(buffer);
                            const contentType = response.headers.get('content-type');
                            if (/^image\//i.test(contentType)) {
                                img = await prepareWAMessageMedia({ image: { url: buffer } }, { upload: sock.waUploadToServer });
                            } else if (/^video\//i.test(contentType)) {
                                video = await prepareWAMessageMedia({ video: { url: buffer } }, { upload: sock.waUploadToServer });
                            }
                        } catch (error) {
                            console.error("Error al obtener el tipo MIME:", error);
                        }
                    } else {
                        try {
                            const type = await sock.getFile(buffer);
                            if (/^image\//i.test(type.mime)) {
                                img = await prepareWAMessageMedia({ image: buffer }, { upload: sock.waUploadToServer });
                            } else if (/^video\//i.test(type.mime)) {
                                video = await prepareWAMessageMedia({ video: buffer }, { upload: sock.waUploadToServer });
                            }
                        } catch (error) {
                            console.error("Error al obtener el tipo de archivo:", error);
                        }
                    }
                }
                
                // Crear botones dinámicos
                const dynamicButtons = buttons.map(btn => ({
                    name: 'quick_reply',
                    buttonParamsJson: JSON.stringify({
                        display_text: btn[0],
                        id: btn[1]
                    }),
                }));
                
                // Botón de copiar
                if (copy && (typeof copy === 'string' || typeof copy === 'number')) {
                    dynamicButtons.push({
                        name: 'cta_copy',
                        buttonParamsJson: JSON.stringify({
                            display_text: 'Copiar',
                            copy_code: copy
                        })
                    });
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
                        });
                    });
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
                };
                
                let msgL = generateWAMessageFromContent(jid, {
                    viewOnceMessage: {
                        message: { interactiveMessage }
                    }
                }, { userJid: sock.user.jid, quoted });
                
                return sock.relayMessage(jid, msgL.message, { messageId: msgL.key.id, ...options });
            }
        },

        /**
         * Enviar lista mejorada
         */
        sendList: {
            async value(jid, title, text, buttonText, listSections, quoted, options = {}) {
                const sections = [...listSections];
                
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
                };
                
                let msgL = generateWAMessageFromContent(jid, {
                    viewOnceMessage: { message }
                }, { userJid: sock.user.jid, quoted });
                
                return sock.relayMessage(jid, msgL.message, { messageId: msgL.key.id });
            }
        },

        /**
         * Enviar contacto
         */
        sendContact: {
            async value(jid, contact, quoted, options = {}) {
                let list = [];
                for (let i of contact) {
                    const name = await sock.getName(i + '@s.whatsapp.net');
                    list.push({
                        displayName: name,
                        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${name}\nFN:${name}\nitem1.TEL;waid=${i}:${i}\nitem1.X-ABLabel:Móvil\nitem2.EMAIL;type=INTERNET:avenixmulti@gmail.com\nitem2.X-ABLabel:Email\nitem3.URL:${global.github || 'https://github.com/hepeinoficial'}\nitem3.X-ABLabel:GitHub\nitem4.ADR:;;México;;;;\nitem4.X-ABLabel:Región\nEND:VCARD`
                    });
                }
                
                return sock.sendMessage(jid, { 
                    contacts: { 
                        displayName: `${list.length} Contacto${list.length > 1 ? 's' : ''}`, 
                        contacts: list 
                    }, 
                    ...options 
                }, { quoted });
            }
        },

        /**
         * Obtener archivo con información completa
         */
        getFile: {
            async value(PATH, save) {
                let res;
                let data = Buffer.isBuffer(PATH) ? PATH : 
                          /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split(',')[1], 'base64') : 
                          /^https?:\/\//.test(PATH) ? await (res = await fetch(PATH)).buffer() : 
                          await fs.readFile(PATH).catch(() => PATH);
                          
                let type = await fileTypeFromBuffer(data) || {
                    mime: 'application/octet-stream',
                    ext: '.bin'
                };
                
                let filename = join(__dirname, '../temp/' + new Date() * 1 + '.' + type.ext);
                if (data && save) await fs.writeFile(filename, data);
                
                return {
                    res,
                    filename,
                    size: Buffer.byteLength(data),
                    ...type,
                    data
                };
            },
            enumerable: true
        },

        /**
         * Parsear menciones
         */
        parseMention: {
            value(text = '') {
                return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net');
            },
            enumerable: true
        },

        /**
         * Descargar mensaje multimedia
         */
        downloadMediaMessage: {
            async value(message) {
                let mime = (message.msg || message).mimetype || '';
                let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
                const stream = await downloadContentFromMessage(message, messageType);
                let buffer = Buffer.from([]);
                for await(const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }
                return buffer;
            }
        },

        /**
         * Copiar y reenviar mensaje
         */
        copyNForward: {
            async value(jid, message, forceForward = false, options = {}) {
                let vtype;
                if (options.readViewOnce) {
                    message.message = message.message && message.message.ephemeralMessage && message.message.ephemeralMessage.message ? 
                        message.message.ephemeralMessage.message : (message.message || undefined);
                    vtype = Object.keys(message.message.viewOnceMessage.message)[0];
                    delete(message.message && message.message.ignore ? message.message.ignore : (message.message || undefined));
                    delete message.message.viewOnceMessage.message[vtype].viewOnce;
                    message.message = {
                        ...message.message.viewOnceMessage.message
                    };
                }
                
                let mtype = Object.keys(message.message)[0];
                let content = await generateForwardMessageContent(message, forceForward);
                let ctype = Object.keys(content)[0];
                let context = {};
                
                if (mtype != "conversation") context = message.message[mtype].contextInfo;
                content[ctype].contextInfo = {
                    ...context,
                    ...content[ctype].contextInfo
                };
                
                const waMessage = await generateWAMessageFromContent(jid, content, options ? {
                    ...content[ctype],
                    ...options,
                    ...(options.contextInfo ? {
                        contextInfo: {
                            ...content[ctype].contextInfo,
                            ...options.contextInfo
                        }
                    } : {})
                } : {});
                
                await sock.relayMessage(jid, waMessage.message, { messageId: waMessage.key.id });
                return waMessage;
            }
        },

        /**
         * Función para manejar newsletters
         */
        handleNewsletterMessage: {
            async value(message) {
                if (message.key.remoteJid.endsWith('@newsletter')) {
                    const newsletterId = message.key.remoteJid;
                    const isOwnNewsletter = NEWSLETTERS.canales.includes(newsletterId);
                    
                    if (isOwnNewsletter) {
                        console.log(`📺 Mensaje recibido del canal: ${sock.getName(newsletterId)}`);
                        return true;
                    }
                }
                return false;
            }
        },

        /**
         * Enviar a newsletter específico
         */
        sendToNewsletter: {
            async value(newsletterId, content, options = {}) {
                try {
                    if (!NEWSLETTERS.canales.includes(newsletterId)) {
                        throw new Error('Newsletter ID no válido');
                    }
                    return await sock.sendMessage(newsletterId, content, options);
                } catch (error) {
                    console.error('Error enviando a newsletter:', error);
                    throw error;
                }
            }
        },

        /**
         * Configurar status
         */
        setStatus: {
            value(status) {
                return sock.query({
                    tag: 'iq',
                    attrs: {
                        to: jidNormalizedUser(sock.user.id),
                        type: 'set',
                        xmlns: 'status',
                    },
                    content: [{
                        tag: 'status',
                        attrs: {},
                        content: Buffer.from(status, 'utf-8')
                    }]
                });
            }
        }
    });

    if (sock.user?.id) sock.user.jid = sock.decodeJid(sock.user.id);
    return sock;
}

/**
 * Serializar mensaje de WhatsApp MEJORADO
 */
export function smsg(conn, m, hasParent) {
    if (!m) return m;
    
    let M = proto.WebMessageInfo;
    if (m.key) {
        m.id = m.key.id;
        m.isBaileys = m.id.startsWith('BAE5') && m.id.length === 16;
        m.chat = m.key.remoteJid;
        m.fromMe = m.key.fromMe;
        m.isGroup = m.chat.endsWith('@g.us');
        m.isNewsletter = m.chat.endsWith('@newsletter');
        m.sender = conn.decodeJid(m.fromMe && conn.user.id || m.participant || m.key.participant || m.chat || '');
        
        if (m.isGroup) {
            m.participant = conn.decodeJid(m.key.participant) || '';
        }
        
        // Newsletter handling
        if (m.isNewsletter) {
            m.newsletterId = m.chat;
            m.isFromNewsletter = true;
        }
    }
    
    if (m.message) {
        m.mtype = getContentType(m.message);
        m.msg = (m.mtype == 'viewOnceMessage' ? 
            m.message[m.mtype].message[getContentType(m.message[m.mtype].message)] : 
            m.message[m.mtype]);
            
        m.body = m.message.conversation || 
                 m.msg.caption || 
                 m.msg.text || 
                 (m.mtype == 'listResponseMessage') && m.msg.singleSelectReply.selectedRowId || 
                 (m.mtype == 'buttonsResponseMessage') && m.msg.selectedButtonId || 
                 (m.mtype == 'templateButtonReplyMessage') && m.msg.selectedId || 
                 '';
                 
        let quoted = m.quoted = m.msg.contextInfo ? m.msg.contextInfo.quotedMessage : null;
        
        // Menciones mejoradas
        m.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : [];
        
        if (m.quoted) {
            let type = getContentType(quoted);
            m.quoted = m.quoted[type];
            
            if (['productMessage'].includes(type)) {
                type = getContentType(m.quoted);
                m.quoted = m.quoted[type];
            }
            
            if (typeof m.quoted === 'string') {
                m.quoted = { text: m.quoted };
            }
            
            m.quoted.mtype = type;
            m.quoted.id = m.msg.contextInfo.stanzaId;
            m.quoted.chat = m.msg.contextInfo.remoteJid || m.chat;
            m.quoted.isBaileys = m.quoted.id ? m.quoted.id.startsWith('BAE5') && m.quoted.id.length === 16 : false;
            m.quoted.sender = conn.decodeJid(m.msg.contextInfo.participant || m.quoted.chat || '');
            m.quoted.fromMe = m.quoted.sender === (conn.user && conn.user.id);
            m.quoted.text = m.quoted.text || 
                            m.quoted.caption || 
                            m.quoted.conversation || 
                            m.quoted.contentText || 
                            m.quoted.selectedDisplayText || 
                            m.quoted.title || '';
                            
            m.quoted.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : [];
            
            m.getQuotedObj = m.getQuotedMessage = async () => {
                if (!m.quoted.id) return false;
                let q = await store.loadMessage(m.chat, m.quoted.id, conn);
                return smsg(conn, q, hasParent ? false : true);
            };
            
            let vM = m.quoted.fakeObj = M.fromObject({
                key: {
                    remoteJid: m.quoted.chat,
                    fromMe: m.quoted.fromMe,
                    id: m.quoted.id
                },
                message: quoted,
                ...(m.isGroup ? { participant: m.quoted.sender } : {})
            });
            
            m.quoted.delete = () => conn.sendMessage(m.quoted.chat, { delete: vM.key });
            m.quoted.copyNForward = (jid, forceForward = false, options = {}) => 
                conn.copyNForward(jid, vM, forceForward, options);
            m.quoted.download = () => conn.downloadMediaMessage(m.quoted);
        }
    }
    
    if (m.msg.url) m.download = () => conn.downloadMediaMessage(m.msg);
    
    // Texto del mensaje con todas las posibilidades
    m.text = m.msg.text || 
             m.msg.caption || 
             m.message.conversation || 
             (m.msg.contentText && m.msg.contentText.text) || 
             (m.msg.listResponseMessage && m.msg.listResponseMessage.singleSelectReply.selectedRowId) || 
             (m.msg.buttonsResponseMessage && m.msg.buttonsResponseMessage.selectedButtonId) || 
             (m.msg.templateButtonReplyMessage && m.msg.templateButtonReplyMessage.selectedId) || 
             (m.mtype == 'conversation' && m.message.conversation) ? m.message.conversation : '';
    
    // Función reply mejorada
    m.reply = async (text, chatId = m.chat, options = {}) => {
        if (Buffer.isBuffer(text)) {
            return conn.sendFile(chatId, text, 'file', '', m, false, { ...options });
        } else {
            return conn.reply(chatId, text, m, { ...options });
        }
    };
    
    // Funciones adicionales
    m.copy = () => smsg(conn, M.fromObject(M.toObject(m)));
    
    m.copyNForward = (jid = m.chat, forceForward = false, options = {}) => 
        conn.copyNForward(jid, m, forceForward, options);
        
    m.delete = () => conn.sendMessage(m.chat, { delete: m.key });
    
    // Funciones de envío mejoradas
    m.sendText = (jid, text, quoted, options) => conn.sendText(jid, text, quoted, options);
    
    m.sendMessage = async (jid, content, options = {}) => 
        conn.sendMessage(jid, content, { quoted: m, ...options });
    
    return m;
}

/**
 * Serialize prototype mejorado
 */
export function serialize() {
    const MediaType = ['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage', 'documentMessage'];
    
    return Object.defineProperties(proto.WebMessageInfo.prototype, {
        conn: {
            value: undefined,
            enumerable: false,
            writable: true
        },
        id: {
            get() {
                return this.key?.id;
            }
        },
        isBaileys: {
            get() {
                return (this?.fromMe || areJidsSameUser(this.conn?.user.id, this.sender)) && 
                       this.id.startsWith('BAE5') && 
                       (this.id.length === 20 || this.id.length === 22 || this.id.length === 16) || false;
            },
        },
        chat: {
            get() {
                const senderKeyDistributionMessage = this.message?.senderKeyDistributionMessage?.groupId;
                return (
                    this.key?.remoteJid ||
                    (senderKeyDistributionMessage &&
                        senderKeyDistributionMessage !== 'status@broadcast'
                    ) || ''
                ).decodeJid();
            }
        },
        isGroup: {
            get() {
                return this.chat.endsWith('@g.us');
            },
            enumerable: true
        },
        isNewsletter: {
            get() {
                return this.chat.endsWith('@newsletter');
            },
            enumerable: true
        },
        sender: {
            get() {
                return this.conn?.decodeJid(this.key?.fromMe && this.conn?.user.id || this.participant || this.key.participant || this.chat || '');
            },
            enumerable: true
        },
        fromMe: {
            get() {
                return this.key?.fromMe || areJidsSameUser(this.conn?.user.id, this.sender) || false;
            }
        },
        mtype: {
            get() {
                if (!this.message) return '';
                const type = Object.keys(this.message);
                return (!['senderKeyDistributionMessage', 'messageContextInfo'].includes(type[0]) && type[0]) || 
                       (type.length >= 3 && type[1] !== 'messageContextInfo' && type[1]) || 
                       type[type.length - 1];
            },
            enumerable: true
        },
        msg: {
            get() {
                if (!this.message) return null;
                return this.message[this.mtype];
            }
        },
        mediaMessage: {
            get() {
                if (!this.message) return null;
                const Message = ((this.msg?.url || this.msg?.directPath) ? { ...this.message } : extractMessageContent(this.message)) || null;
                if (!Message) return null;
                const mtype = Object.keys(Message)[0];
                return MediaType.includes(mtype) ? Message : null;
            },
            enumerable: true
        },
        mediaType: {
            get() {
                let message;
                if (!(message = this.mediaMessage)) return null;
                return Object.keys(message)[0];
            },
            enumerable: true,
        },
        quoted: {
            get() {
                const self = this;
                const msg = self.msg;
                const contextInfo = msg?.contextInfo;
                const quoted = contextInfo?.quotedMessage;
                if (!msg || !contextInfo || !quoted) return null;
                const type = Object.keys(quoted)[0];
                let q = quoted[type];
                const text = typeof q === 'string' ? q : q.text;
                return Object.defineProperties(JSON.parse(JSON.stringify(typeof q === 'string' ? { text: q } : q)), {
                    mtype: {
                        get() {
                            return type;
                        },
                        enumerable: true
                    },
                    mediaMessage: {
                        get() {
                            const Message = ((q.url || q.directPath) ? { ...quoted } : extractMessageContent(quoted)) || null;
                            if (!Message) return null;
                            const mtype = Object.keys(Message)[0];
                            return MediaType.includes(mtype) ? Message : null;
                        },
                        enumerable: true
                    },
                    mediaType: {
                        get() {
                            let message;
                            if (!(message = this.mediaMessage)) return null;
                            return Object.keys(message)[0];
                        },
                        enumerable: true,
                    },
                    id: {
                        get() {
                            return contextInfo.stanzaId;
                        },
                        enumerable: true
                    },
                    chat: {
                        get() {
                            return contextInfo.remoteJid || self.chat;
                        },
                        enumerable: true
                    },
                    isBaileys: {
                        get() {
                            return (this?.fromMe || areJidsSameUser(this.conn?.user.id, this.sender)) && 
                                   this.id.startsWith('BAE5') && 
                                   (this.id.length === 20 || this.id.length === 22 || this.id.length === 16) || false;
                        },
                        enumerable: true
                    },
                    sender: {
                        get() {
                            return (contextInfo.participant || this.chat || '').decodeJid();
                        },
                        enumerable: true
                    },
                    fromMe: {
                        get() {
                            return areJidsSameUser(this.sender, self.conn?.user.jid);
                        },
                        enumerable: true,
                    },
                    text: {
                        get() {
                            return text || this.caption || this.contentText || this.selectedDisplayText || '';
                        },
                        enumerable: true
                    },
                    mentionedJid: {
                        get() {
                            return q.contextInfo?.mentionedJid || self.getQuotedObj()?.mentionedJid || [];
                        },
                        enumerable: true
                    },
                    name: {
                        get() {
                            const sender = this.sender;
                            return sender ? self.conn?.getName(sender) : null;
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
                            });
                        }
                    },
                    fakeObj: {
                        get() {
                            return this.vM;
                        }
                    },
                    download: {
                        value(saveToFile = false) {
                            const mtype = this.mediaType;
                            return self.conn?.downloadM(this.mediaMessage[mtype], mtype.replace(/message/i, ''), saveToFile);
                        },
                        enumerable: true,
                        configurable: true,
                    },
                    reply: {
                        value(text, chatId, options) {
                            return self.conn?.reply(chatId ? chatId : this.chat, text, this.vM, options);
                        },
                        enumerable: true,
                    },
                    copy: {
                        value() {
                            const M = proto.WebMessageInfo;
                            return smsg(self.conn, M.fromObject(M.toObject(this.vM)));
                        },
                        enumerable: true,
                    },
                    forward: {
                        value(jid, force = false, options) {
                            return self.conn?.sendMessage(jid, {
                                forward: this.vM, force, ...options
                            }, { ...options });
                        },
                        enumerable: true,
                    },
                    copyNForward: {
                        value(jid, forceForward = false, options) {
                            return self.conn?.copyNForward(jid, this.vM, forceForward, options);
                        },
                        enumerable: true,
                    },
                    cMod: {
                        value(jid, text = '', sender = this.sender, options = {}) {
                            return self.conn?.cMod(jid, this.vM, text, sender, options);
                        },
                        enumerable: true,
                    },
                    delete: {
                        value() {
                            return self.conn?.sendMessage(this.chat, { delete: this.vM.key });
                        },
                        enumerable: true,
                    },
                    react: {
                        value(text) {
                            return self.conn?.sendMessage(this.chat, {
                                react: {
                                    text,
                                    key: this.vM.key
                                }
                            });
                        },
                        enumerable: true,
                    }
                });
            },
            enumerable: true
        },
        _text: {
            value: null,
            writable: true,
        },
        text: {
            get() {
                const msg = this.msg;
                const text = (typeof msg === 'string' ? msg : msg?.text) || msg?.caption || msg?.contentText || '';
                return typeof this._text === 'string' ? this._text : '' || (typeof text === 'string' ? text : (
                    text?.selectedDisplayText ||
                    text?.hydratedTemplate?.hydratedContentText ||
                    text
                )) || '';
            },
            set(str) {
                return this._text = str;
            },
            enumerable: true
        },
        mentionedJid: {
            get() {
                return this.msg?.contextInfo?.mentionedJid?.length && this.msg.contextInfo.mentionedJid || [];
            },
            enumerable: true
        },
        name: {
            get() {
                return this.pushName || this.conn?.getName(this.sender);
            },
            enumerable: true
        },
        download: {
            value(saveToFile = false) {
                const mtype = this.mediaType;
                return this.conn?.downloadM(this.mediaMessage[mtype], mtype.replace(/message/i, ''), saveToFile);
            },
            enumerable: true,
            configurable: true
        },
        reply: {
            value(text, chatId, options) {
                return this.conn?.reply(chatId ? chatId : this.chat, text, this, options);
            }
        },
        copy: {
            value() {
                const M = proto.WebMessageInfo;
                return smsg(this.conn, M.fromObject(M.toObject(this)));
            },
            enumerable: true
        },
        forward: {
            value(jid, force = false, options = {}) {
                return this.conn?.sendMessage(jid, {
                    forward: this, force, ...options
                }, { ...options });
            },
            enumerable: true
        },
        copyNForward: {
            value(jid, forceForward = false, options = {}) {
                return this.conn?.copyNForward(jid, this, forceForward, options);
            },
            enumerable: true
        },
        cMod: {
            value(jid, text = '', sender = this.sender, options = {}) {
                return this.conn?.cMod(jid, this, text, sender, options);
            },
            enumerable: true
        },
        getQuotedObj: {
            value() {
                if (!this.quoted.id) return null;
                const q = proto.WebMessageInfo.fromObject(this.conn?.loadMessage(this.quoted.id) || this.quoted.vM);
                return smsg(this.conn, q);
            },
            enumerable: true
        },
        getQuotedMessage: {
            get() {
                return this.getQuotedObj;
            }
        },
        delete: {
            value() {
                return this.conn?.sendMessage(this.chat, { delete: this.key });
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
                });
            },
            enumerable: true
        }
    });
}

/**
 * Prototype functions mejoradas
 */
export function protoType() {
    Buffer.prototype.toArrayBuffer = function toArrayBufferV2() {
        const ab = new ArrayBuffer(this.length);
        const view = new Uint8Array(ab);
        for (let i = 0; i < this.length; ++i) {
            view[i] = this[i];
        }
        return ab;
    };
    
    Buffer.prototype.toArrayBufferV2 = function toArrayBuffer() {
        return this.buffer.slice(this.byteOffset, this.byteOffset + this.byteLength);
    };
    
    ArrayBuffer.prototype.toBuffer = function toBuffer() {
        return Buffer.from(new Uint8Array(this));
    };
    
    Uint8Array.prototype.getFileType = ArrayBuffer.prototype.getFileType = Buffer.prototype.getFileType = async function getFileType() {
        return await fileTypeFromBuffer(this);
    };
    
    String.prototype.isNumber = Number.prototype.isNumber = isNumber;
    
    String.prototype.capitalize = function capitalize() {
        return this.charAt(0).toUpperCase() + this.slice(1, this.length);
    };
    
    String.prototype.capitalizeV2 = function capitalizeV2() {
        const str = this.split(' ');
        return str.map(v => v.capitalize()).join(' ');
    };
    
    String.prototype.decodeJid = function decodeJid() {
        if (/:\d+@/gi.test(this)) {
            const decode = jidDecode(this) || {};
            return (decode.user && decode.server && decode.user + '@' + decode.server || this).trim();
        } else return this.trim();
    };
    
    Number.prototype.toTimeString = function toTimeString() {
        const seconds = Math.floor((this / 1000) % 60);
        const minutes = Math.floor((this / (60 * 1000)) % 60);
        const hours = Math.floor((this / (60 * 60 * 1000)) % 24);
        const days = Math.floor((this / (24 * 60 * 60 * 1000)));
        return (
            (days ? `${days} día(s) ` : '') +
            (hours ? `${hours} hora(s) ` : '') +
            (minutes ? `${minutes} minuto(s) ` : '') +
            (seconds ? `${seconds} segundo(s)` : '')
        ).trim();
    };
}

const isNumber = (number) => {
    const int = parseInt(number);
    return typeof int === 'number' && !isNaN(int);
};

/**
 * Función para obtener buffer de URL
 */
global.getBuffer = async (url, options) => {
    try {
        options = options || {};
        const res = await fetch(url, {
            method: 'GET',
            headers: {
                'DNT': 1,
                'Upgrade-Insecure-Request': 1,
            },
            ...options
        });
        return await res.buffer();
    } catch (err) {
        return err;
    }
};

/**
 * Función para obtener tamaño de archivo
 */
export async function getSizeMedia(path) {
    return new Promise((resolve, reject) => {
        if (/http/.test(path)) {
            fetch(path).then(res => resolve(res.headers.get('content-length')));
        } else if (Buffer.isBuffer(path)) {
            resolve(path.length);
        } else {
            fs.stat(path, (err, stats) => {
                if (err) return reject(err);
                resolve(stats.size);
            });
        }
    });
}

export default {
    makeWASocket,
    smsg,
    serialize,
    protoType,
    getSizeMedia,
    NEWSLETTERS
};
