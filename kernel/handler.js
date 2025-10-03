/**
 * Handler Principal de Eventos - Avenix Multi V2.0.0
 * Creado por: Hepein Oficial
 * Marca: 𒁈
 * 
 * Handler ultra optimizado para Baileys 6.7.5
 * Con sistema anti-errores robusto y funciones avanzadas
 * 
 * Nuevas características agregadas:
 * ✅ Sistema anti-lag optimizado
 * ✅ Detección de comandos similares
 * ✅ Sistema de cumpleaños automático
 * ✅ Optimizaciones de memoria
 * ✅ Subbots premium mejorado
 */
//handler.js
import { smsg } from '../lib/simple.js';
import { format } from 'util';
import { fileURLToPath } from 'url';
import path, { join } from 'path';
import { unwatchFile, watchFile } from 'fs';
import chalk from 'chalk';
import moment from 'moment-timezone';
import cron from 'node-cron';

const { proto } = (await import('@whiskeysockets/baileys')).default;
const isNumber = x => typeof x === 'number' && !isNaN(x);
const delay = ms => isNumber(ms) && new Promise(resolve => setTimeout(function () {
    clearTimeout(this);
    resolve();
}, ms));

// ═══════════════════════════════════════════════════════════════════════════════
// │                        OPTIMIZACIONES DE MEMORIA                           │
// ═══════════════════════════════════════════════════════════════════════════════

// Pool de objetos reutilizables para optimizar memoria
const objectPool = {
    tempObjects: [],
    getObject() {
        return this.tempObjects.pop() || {};
    },
    returnObject(obj) {
        if (Object.keys(obj).length < 50) { // Solo guardar objetos pequeños
            Object.keys(obj).forEach(key => delete obj[key]);
            this.tempObjects.push(obj);
        }
    }
};

// Limpieza automática de memoria cada 10 minutos
setInterval(() => {
    if (global.gc) {
        global.gc();
        console.log(chalk.green('🧹 Limpieza de memoria ejecutada'));
    }
    // Limpiar pool de objetos si está muy grande
    if (objectPool.tempObjects.length > 100) {
        objectPool.tempObjects = objectPool.tempObjects.slice(0, 50);
    }
}, 600000);

// ═══════════════════════════════════════════════════════════════════════════════
// │                        SISTEMA DE CUMPLEAÑOS AUTOMÁTICO                    │
// ═══════════════════════════════════════════════════════════════════════════════

let lastBirthdayCheck = null;

export async function checkBirthdays() {
    if (!this || !global.db?.data?.chats || !global.db?.data?.users) return;
    
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1;
    const todayString = `${currentDay}/${currentMonth}`;
    
    // Evitar verificaciones múltiples el mismo día
    if (lastBirthdayCheck === todayString) return;
    lastBirthdayCheck = todayString;
    
    console.log(chalk.blue(`🎂 Verificando cumpleaños para el ${todayString}...`));
    
    // Verificar en todos los chats que tengan cumpleaños activados
    for (const chatId in global.db.data.chats) {
        const chat = global.db.data.chats[chatId];
        if (!chat.birthdayAllowed) continue;
        
        try {
            if (!chatId.endsWith('@g.us')) continue;
            
            const groupMetadata = await this.groupMetadata(chatId).catch(() => null);
            if (!groupMetadata) continue;
            
            const participants = groupMetadata.participants.map(p => p.id);
            
            for (const participant of participants) {
                const user = global.db.data.users[participant];
                if (!user?.birthday?.date) continue;
                
                const [day, month, year] = user.birthday.date.split('/');
                const birthDay = parseInt(day);
                const birthMonth = parseInt(month);
                const birthYear = parseInt(year);
                
                if (!birthDay || !birthMonth || !birthYear) continue;
                
                if (birthDay === currentDay && birthMonth === currentMonth && user.birthday.announce !== false) {
                    const age = today.getFullYear() - birthYear;
                    const name = user.name || participant.split('@')[0];
                    
                    const birthdayMessage = `🎉 *¡FELIZ CUMPLEAÑOS!* 🎉

🎂 *${name}* cumple *${age} años* hoy
🎊 ¡Que tengas un día increíble!
🎁 ¡Todo el grupo te desea lo mejor!

𒁈 *Avenix-Multi* 𒁈`;

                    await this.sendMessage(chatId, {
                        text: birthdayMessage,
                        mentions: [participant]
                    });
                    
                    console.log(chalk.green(`🎂 Cumpleaños enviado para ${name} (${age} años)`));
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            }
        } catch (error) {
            console.error('Error verificando cumpleaños:', error);
        }
    }
}

// Programar verificación diaria a las 9:00 AM
cron.schedule('0 9 * * *', async () => {
    console.log(chalk.blue('📅 Verificando cumpleaños automáticamente...'));
    try {
        if (global.conn) {
            await checkBirthdays.call(global.conn);
        }
    } catch (error) {
        console.error('Error en verificación automática de cumpleaños:', error);
    }
}, {
    scheduled: true,
    timezone: "America/Mexico_City"
});

// ═══════════════════════════════════════════════════════════════════════════════
// │                        HANDLER PRINCIPAL DE MENSAJES                       │
// ═══════════════════════════════════════════════════════════════════════════════

export async function handler(chatUpdate) {
    this.msgqueque = this.msgqueque || [];
    if (!chatUpdate) return;
    
    this.pushMessage(chatUpdate.messages).catch(console.error);
    let m = chatUpdate.messages[chatUpdate.messages.length - 1];
    if (!m) return;
    
    if (global.db.data == null) await global.loadDatabase();
    
    try {
        m = smsg(this, m) || m;
        if (!m) return;
        
        m.exp = 0;
        m.limit = false;
        
        try {
            // ═══════════════════════════════════════════════════════════════════
            // │                    SISTEMA ANTI-LAG OPTIMIZADO                  │ 
            // ═══════════════════════════════════════════════════════════════════
            
            const mainBot = global?.conn?.user?.jid;
            const chat = global.db.data.chats[m.chat] || {};
            const isAntiLagActive = chat.antiLag === true;
            const allowedBots = chat.per || [];
            
            // Asegurar que el bot principal esté en la lista de permitidos
            if (mainBot && !allowedBots.includes(mainBot)) {
                allowedBots.push(mainBot);
                chat.per = allowedBots;
            }
            
            const isAllowedBot = allowedBots.includes(this?.user?.jid);
            
            // Si anti-lag está activo y este bot no está permitido, cancelar procesamiento
            if (isAntiLagActive && !isAllowedBot) {
                return;
            }
            
            // ═══════════════════════════════════════════════════════════════════
            // │                    SUBBOTS PREMIUM MEJORADO                     │
            // ═══════════════════════════════════════════════════════════════════
            
            const sendNum = m?.sender?.replace(/[^0-9]/g, '');
            const dbSubsPrems = global.db.data.settings[this.user.jid] || {};
            const subsActivos = dbSubsPrems.actives || [];
            
            const botIds = [
                this?.user?.id, 
                this?.user?.lid, 
                ...(global.owner?.map(([n]) => n) || [])
            ].map(jid => jid?.replace(/[^0-9]/g, '')).filter(Boolean);
            
            const isPremSubs = subsActivos.some(jid => jid.replace(/[^0-9]/g, '') === sendNum) || 
                              botIds.includes(sendNum) || 
                              (global.conns || []).some(conn => 
                                  conn?.user?.jid?.replace(/[^0-9]/g, '') === sendNum && 
                                  conn?.ws?.socket?.readyState !== 3
                              );
            
            // ═══════════════════════════════════════════════════════════════════
            // │                 INICIALIZACIÓN DE USUARIO OPTIMIZADA            │
            // ═══════════════════════════════════════════════════════════════════
            
            let user = global.db.data.users[m.sender];
            if (typeof user !== 'object') global.db.data.users[m.sender] = {};
            
            if (user) {
                // Estadísticas básicas
                if (!isNumber(user.healt)) user.healt = 100;
                if (!isNumber(user.level)) user.level = 0;
                if (!isNumber(user.exp)) user.exp = 0;
                if (!isNumber(user.limit)) user.limit = 25;
                if (!isNumber(user.lastclaim)) user.lastclaim = 0;
                
                // Sistema de cumpleaños mejorado
                if (!('birthday' in user)) {
                    user.birthday = {
                        date: '',
                        announce: true,
                        timezone: 'America/Mexico_City'
                    };
                }
                
                // Registro
                if (!('registered' in user)) user.registered = false;
                if (!user.registered) {
                    if (!('name' in user)) user.name = m.name;
                    if (!isNumber(user.age)) user.age = -1;
                    if (!isNumber(user.regTime)) user.regTime = -1;
                }
                
                // Estado AFK
                if (!isNumber(user.afk)) user.afk = -1;
                if (!('afkReason' in user)) user.afkReason = '';
                
                // Sistema de moderación
                if (!('banned' in user)) user.banned = false;
                if (!isNumber(user.warn)) user.warn = 0;
                
                // Sistema económico
                if (!isNumber(user.money)) user.money = 1000;
                if (!isNumber(user.bank)) user.bank = 0;
                if (!isNumber(user.atm)) user.atm = 0;
                if (!isNumber(user.fullatm)) user.fullatm = 1000000;
                if (!isNumber(user.diamond)) user.diamond = 0;
                if (!isNumber(user.joincount)) user.joincount = 1;
                
                // Sistema premium
                if (!('premium' in user)) user.premium = false;
                if (!isNumber(user.premiumTime)) user.premiumTime = 0;
                if (!('rtx' in user)) user.rtx = false;
                
                // Sistema de roles y niveles
                if (!('role' in user)) user.role = 'Novato';
                if (!('autolevelup' in user)) user.autolevelup = true;
                
                // Items del sistema RPG (optimizado - solo los esenciales)
                const rpgItems = ['pc', 'sp', 'spada', 'sword', 'legendary', 'pet', 'horse', 'fox', 'dog', 'cat', 'centaur', 'phoenix', 'dragon'];
                rpgItems.forEach(item => {
                    if (!isNumber(user[item])) user[item] = 0;
                });
                
                // Cooldowns esenciales (optimizado)
                const cooldowns = [
                    'lastdungeon', 'lastduel', 'lastmining', 'lastfishing', 'lastadventure', 'lastfight', 
                    'lasthunt', 'lastweekly', 'lastmonthly', 'lastyearly', 'lastjb', 'lastclaim', 
                    'lastcode', 'lastrob', 'lastgift', 'lastreward', 'lastbet', 'lastytdl', 
                    'laststicker', 'lastchatgpt', 'lastcommand'
                ];
                cooldowns.forEach(cooldown => {
                    if (!isNumber(user[cooldown])) user[cooldown] = 0;
                });
                
            } else {
                // Usuario nuevo - valores optimizados
                global.db.data.users[m.sender] = {
                    healt: 100, level: 0, exp: 0, limit: 25, lastclaim: 0,
                    birthday: { date: '', announce: true, timezone: 'America/Mexico_City' },
                    registered: false, name: m.name, age: -1, regTime: -1,
                    afk: -1, afkReason: '', banned: false, warn: 0,
                    money: 1000, bank: 0, atm: 0, fullatm: 1000000, diamond: 0, joincount: 1,
                    premium: false, premiumTime: 0, rtx: false, role: 'Novato', autolevelup: true,
                    pc: 0, sp: 0, spada: 0, sword: 0, legendary: 0, pet: 0, horse: 0, fox: 0, dog: 0, cat: 0, centaur: 0, phoenix: 0, dragon: 0,
                    lastdungeon: 0, lastduel: 0, lastmining: 0, lastfishing: 0, lastadventure: 0, lastfight: 0, 
                    lasthunt: 0, lastweekly: 0, lastmonthly: 0, lastyearly: 0, lastjb: 0, lastclaim: 0, 
                    lastcode: 0, lastrob: 0, lastgift: 0, lastreward: 0, lastbet: 0, lastytdl: 0, 
                    laststicker: 0, lastchatgpt: 0, lastcommand: 0
                };
            }

            // Inicialización de chat optimizada
            if (typeof chat !== 'object') global.db.data.chats[m.chat] = {};
            
            if (Object.keys(chat).length === 0) {
                // Chat nuevo - valores por defecto optimizados
                Object.assign(chat, {
                    isBanned: false, welcome: false, detect: false,
                    sWelcome: '', sBye: '', sPromote: '', sDemote: '', delete: true,
                    antiLag: false, per: [], birthdayAllowed: false,
                    antiLink: false, antiLink2: false, viewonce: false,
                    antiToxic: false, antiTraba: false, antiFake: false,
                    antiSpam: false, antiFlood: false, modoadmin: false,
                    autosticker: false, audios: true, antidelete: false,
                    reaction: false, game: true, rpg: true, nsfw: false,
                    expired: 0, modohorny: false, autosimi: false,
                    antiTelegram: false, antiDiscord: false, antiTiktok: false, antiYoutube: false
                });
                global.db.data.chats[m.chat] = chat;
            } else {
                // Verificar propiedades faltantes
                const defaultProps = {
                    antiLag: false, per: [], birthdayAllowed: false,
                    isBanned: false, welcome: false, detect: false,
                    delete: true, modoadmin: false, audios: true,
                    game: true, rpg: true, nsfw: false, expired: 0
                };
                
                Object.keys(defaultProps).forEach(prop => {
                    if (!(prop in chat)) chat[prop] = defaultProps[prop];
                });
            }

            // Configuraciones globales del bot
            let settings = global.db.data.settings[this.user.jid];
            if (typeof settings !== 'object') global.db.data.settings[this.user.jid] = {};
            
            const defaultSettings = {
                self: false, autoread: false, restrict: false,
                antiCall: false, antiPrivate: false, antiSpam: false,
                antiTraba: false, backup: false, pconly: false,
                gconly: false, swonly: false, status: 0, jadibot: false,
                actives: [] // Para subbots premium
            };
            
            Object.keys(defaultSettings).forEach(prop => {
                if (!(prop in settings)) settings[prop] = defaultSettings[prop];
            });
            
        } catch (e) {
            console.error('Error inicializando datos:', e);
        }

        // Sistema de cooldown actualizado
        if (m.sender && (m.sender in global.db.data.users)) {
            let user = global.db.data.users[m.sender];
            user.lastseen = new Date * 1;
        }

        // Verificaciones de administración y privilegios
        const isROwner = [this.decodeJid(global.conn.user.id), ...global.owner.map(([number]) => number)].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender);
        const isOwner = isROwner || m.fromMe;
        const isMods = isOwner || global.mods.map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender);
        const isPrems = isROwner || global.prems.map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender);

        // Obtener metadatos del grupo si es necesario
        let groupMetadata = {};
        let participants = [];
        let user = global.db.data.users[m.sender] || {};
        let bot = global.db.data.settings[this.user.jid] || {};
        let isAdmin = false;
        let isBotAdmin = false;

        if (m.isGroup) {
            groupMetadata = await this.groupMetadata(m.chat).catch(_ => ({}));
            participants = groupMetadata.participants || [];
            isAdmin = participants.some(p => p.id === m.sender && (p.admin === 'admin' || p.admin === 'superadmin'));
            isBotAdmin = participants.some(p => p.id === this.user.jid && (p.admin === 'admin' || p.admin === 'superadmin'));
        }

        // Sistema anti-spam global mejorado
        if (m.sender in global.db.data.users) {
            let user = global.db.data.users[m.sender];
            if (new Date - user.pc < 2000 && !isOwner && !isROwner) {
                console.log(`Anti-spam: ${m.sender} intentó usar comando muy rápido`);
                return;
            }
            user.pc = new Date * 1;
        }

        // Detección de prefijos mejorada
        let prefixRegex = new RegExp('^[' + (opts['prefix'] || '‎xzXZ/i!#$%+£¢€¥^°=¶∆×÷π√✓©®:;?&.\\-.@').replace(/[|\\{}()[\]^$+*?.\-\^]/g, '\\$&') + ']');
        let prefix = opts['prefix'];
        let isCmd = false;
        let usedPrefix = '';
        let command = '';
        let commandFound = false;

        // Sistema AFK mejorado
        if (m.mentionedJid.includes(m.sender) && user.afk > -1) {
            let afkTime = new Date - user.afk;
            let afkReason = user.afkReason || 'Sin razón';
            this.reply(m.chat, `Ya no estás AFK${afkReason ? ': ' + afkReason : ''}\nEstuviste AFK durante: ${clockString(afkTime)}`, m);
            user.afk = -1;
            user.afkReason = '';
        }

        // Detectar menciones AFK
        let mentionedJidList = [...(m.mentionedJid || [])];
        for (let jid of mentionedJidList) {
            let afkUser = global.db.data.users[jid];
            if (!afkUser) continue;
            let afkTime = afkUser.afk;
            if (afkTime > -1) {
                let afkDuration = new Date - afkTime;
                let afkReason = afkUser.afkReason || 'Sin razón especificada';
                this.reply(m.chat, `El usuario está AFK\n\nMotivo: ${afkReason}\nTiempo AFK: ${clockString(afkDuration)}`, m);
            }
        }

        // Procesamiento de plugins
        for (let name in global.plugins) {
            let plugin = global.plugins[name];
            if (!plugin) continue;
            if (plugin.disabled) continue;
            
            const __filename = global.__filename(import.meta.url);
            if (!opts['test'] && name !== __filename && `${global.__dirname(__filename)}/plugins/` !== name) continue;
            
            // Ejecutar función 'all' si existe
            if (typeof plugin.all === 'function') {
                try {
                    await plugin.all.call(this, m, {
                        chatUpdate,
                        __dirname: global.__dirname(__filename, true),
                        __filename
                    });
                } catch (e) {
                    console.error(`Error en plugin.all de ${name}:`, e);
                    if (e.name && isOwner) {
                        this.reply(m.chat, `Error en plugin.all de ${name}:\n${format(e)}`, m);
                    }
                }
            }

            if (!m.text) continue;
            
            // Detección de comandos mejorada
            let match = (m.text.match(prefixRegex) || ['', ''])[0];
            if (!match) continue;
            
            usedPrefix = match;
            let noPrefix = m.text.replace(prefixRegex, '');
            let [_command, ...args] = noPrefix.trim().split` `.filter(v => v);
            args = args || [];
            let _args = noPrefix.trim().split` `.slice(1);
            let text = _args.join` `;
            command = (_command || '').toLowerCase();
            isCmd = true;

            let fail = plugin.fail || global.dfail;
            let isAccept = plugin.command instanceof RegExp ? 
                plugin.command.test(command) : 
                Array.isArray(plugin.command) ? 
                    plugin.command.some(cmd => cmd instanceof RegExp ? cmd.test(command) : cmd === command) : 
                    typeof plugin.command === 'string' ? plugin.command === command : false;

            if (!isAccept) continue;

            // Marcar que se encontró un comando válido
            commandFound = true;

            // Asignar propiedades al mensaje
            m.plugin = name;
            m.usedPrefix = usedPrefix;
            m.args = args;
            m._args = _args;
            m.text = text;
            m.command = command;
            m.isOwner = isOwner;
            m.isROwner = isROwner;
            m.isMods = isMods;
            m.isPrems = isPrems;
            m.isPremSubs = isPremSubs;

            let extra = {
                match, usedPrefix, noPrefix, _args, args, command, text,
                conn: this, participants, groupMetadata, user, bot,
                isROwner, isOwner, isAdmin, isBotAdmin, isPrems, isPremSubs,
                chatUpdate, __dirname: global.__dirname(__filename, true), __filename
            };

            try {
                // Verificaciones antes de ejecutar comando
                if (plugin.rowner && plugin.owner && !(isROwner || isOwner)) {
                    fail('rowner', m, extra);
                    continue;
                }
                if (plugin.rowner && !isROwner) {
                    fail('rowner', m, extra);
                    continue;
                }
                if (plugin.owner && !isOwner) {
                    fail('owner', m, extra);
                    continue;
                }
                if (plugin.mods && !isMods) {
                    fail('mods', m, extra);
                    continue;
                }
                if (plugin.premium && !isPrems) {
                    fail('premium', m, extra);
                    continue;
                }
                if (plugin.premsub && !isPremSubs) {
                    fail('premsub', m, extra);
                    continue;
                }
                if (plugin.group && !m.isGroup) {
                    fail('group', m, extra);
                    continue;
                }
                if (plugin.botAdmin && !isBotAdmin) {
                    fail('botAdmin', m, extra);
                    continue;
                }
                if (plugin.admin && !isAdmin) {
                    fail('admin', m, extra);
                    continue;
                }
                if (plugin.private && m.isGroup) {
                    fail('private', m, extra);
                    continue;
                }
                if (plugin.register && !user.registered) {
                    fail('unreg', m, extra);
                    continue;
                }
                if (plugin.nsfw && !chat.nsfw) {
                    fail('nsfw', m, extra);
                    continue;
                }

                // Verificaciones de restricciones globales
                if (bot.gconly && !m.isGroup) {
                    fail('gconly', m, extra);
                    continue;
                }
                if (bot.pconly && m.isGroup) {
                    fail('pconly', m, extra);
                    continue;
                }

                // Sistema de límites y economía mejorado
                m.isCommand = true;
                let time = user.lastcommand || 0;
                if (time != 0 && (new Date - time < 3000) && !isOwner) {
                    this.reply(m.chat, `⏳ Espera 3 segundos antes de usar otro comando`, m);
                    continue;
                }
                user.lastcommand = new Date * 1;

                // Verificar límites
                if (plugin.limit && user.limit < plugin.limit * 1) {
                    this.reply(m.chat, `💎 Límites insuficientes\n\nNecesitas: ${plugin.limit * 1} límites\nTienes: ${user.limit} límites\n\nUsa *${usedPrefix}buy* para comprar límites`, m);
                    continue;
                }

                // Verificar nivel requerido
                if (plugin.level > user.level) {
                    this.reply(m.chat, `📊 Nivel insuficiente\n\nRequiere nivel: ${plugin.level}\nTu nivel actual: ${user.level}\n\nUsa comandos para ganar experiencia`, m);
                    continue;
                }

                // Verificar dinero necesario
                if (plugin.money && user.money < plugin.money * 1) {
                    this.reply(m.chat, `💰 Dinero insuficiente\n\nNecesitas: $${plugin.money * 1}\nTienes: $${user.money}\n\nUsa *${usedPrefix}work* para ganar dinero`, m);
                    continue;
                }

                let extra2 = {
                    conn: this, participants, groupMetadata, args, usedPrefix, command,
                    isOwner, isAdmin, isBotAdmin, isROwner, isPrems, isPremSubs
                };

                // Ejecutar función 'before' si existe
                if (typeof plugin.before === 'function') {
                    if (await plugin.before.call(this, m, extra2)) continue;
                }

                // Ejecutar el comando principal
                if (typeof plugin === 'function') {
                    await plugin.call(this, m, extra2);
                } else if (typeof plugin.handler === 'function') {
                    await plugin.handler.call(this, m, extra2);
                }

                // Descontar recursos
                if (plugin.limit) user.limit -= plugin.limit * 1;
                if (plugin.money) user.money -= plugin.money * 1;

                // Agregar experiencia base
                let expGain = Math.ceil(Math.random() * 15) + 5;
                user.exp += expGain;

                // Sistema de nivel automático mejorado
                let before = user.level * 1;
                let jenjang = Math.floor(user.exp / 200);
                user.level = jenjang;

                // Actualizar rol basado en nivel
                if (user.level >= 100) user.role = 'Élite';
                else if (user.level >= 75) user.role = 'Experto';
                else if (user.level >= 50) user.role = 'Avanzado';
                else if (user.level >= 25) user.role = 'Intermedio';
                else if (user.level >= 10) user.role = 'Aprendiz';
                else user.role = 'Novato';

                // Notificación de subida de nivel
                if (before !== jenjang) {
                    let levelUpMsg = `🎉 ¡NIVEL SUPERIOR! 𒁈\n\n`;
                    levelUpMsg += `👤 Usuario: ${user.name || 'Sin nombre'}\n`;
                    levelUpMsg += `📊 Nivel anterior: ${before}\n`;
                    levelUpMsg += `📈 Nivel actual: ${jenjang}\n`;
                    levelUpMsg += `🏆 Nuevo rol: ${user.role}\n`;
                    levelUpMsg += `💰 Recompensa: +$${jenjang * 100}\n\n`;
                    levelUpMsg += `*Usa .autolevelup para activar/desactivar estas notificaciones*`;
                    
                    // Dar recompensa por subir de nivel
                    user.money += jenjang * 100;
                    
                    if (user.autolevelup) {
                        this.reply(m.chat, levelUpMsg, m);
                    }
                }

            } catch (e) {
                m.error = e;
                console.error(`Error en plugin ${name}:`, e);
                
                // Reportar error a desarrolladores
                if (e.name) {
                    let text = format(e);
                    // Ocultar API keys en logs
                    for (let key of Object.values(global.APIKeys || {})) {
                        text = text.replace(new RegExp(key, 'g'), '#HIDDEN#');
                    }
                    
                    // Enviar error a owners
                    for (let [jid] of global.owner.filter(([number, _, isDeveloper]) => isDeveloper && number)) {
                        let data = (await this.onWhatsApp(jid + '@s.whatsapp.net'))[0] || {};
                        if (data.exists) {
                            this.reply(data.jid, `🚨 *Error en plugin:* ${name}\n\n\`\`\`${text}\`\`\``.trim(), null);
                        }
                    }
                }
                
                // Mensaje de error para el usuario
                this.reply(m.chat, '❌ Ocurrió un error al ejecutar el comando\n\nSi el problema persiste, contacta al propietario.', m);
                
            } finally {
                // Ejecutar función 'after' si existe
                if (typeof plugin.after === 'function') {
                    try {
                        await plugin.after.call(this, m, extra2);
                    } catch (e) {
                        console.error(`Error en plugin.after de ${name}:`, e);
                    }
                }
            }
            break;
        }

        // ═══════════════════════════════════════════════════════════════════════════════
        // │                    DETECCIÓN DE COMANDOS SIMILARES                         │
        // ═══════════════════════════════════════════════════════════════════════════════

        if (!commandFound && m.text && prefixRegex.test(m.text)) {
            let usedPrefixForCheck = m.text.match(prefixRegex)?.[0] || '';
            
            if (usedPrefixForCheck) {
                let commandAttempt = m.text.replace(usedPrefixForCheck, '').trim().split(' ')[0].toLowerCase();
                
                if (commandAttempt && commandAttempt.length > 0) {
                    // Mensaje simple y directo como solicitaste
                    let errorMessage = `❌ El comando "${usedPrefixForCheck}${commandAttempt}" no existe.\n\n📋 Usa *${usedPrefixForCheck}menu* para ver la lista de comandos disponibles.\n\n𒁈 *Avenix-Multi* 𒁈`;
                    
                    this.reply(m.chat, errorMessage, m);
                }
            }
        }
        
    } catch (e) {
        console.error('Error general en handler:', e);
    } finally {
        // Limpieza de cola de mensajes
        if (opts['queque'] && m.text) {
            const quequeIndex = this.msgqueque.indexOf(m.id || m.key.id);
            if (quequeIndex !== -1) this.msgqueque.splice(quequeIndex, 1);
        }
        
        // Actualizar estadísticas
        let user, stats = global.db.data.stats;
        if (m) {
            if (m.sender && (user = global.db.data.users[m.sender])) {
                user.exp += m.exp;
                user.limit -= m.limit * 1;
            }

            // Estadísticas de plugins
            let stat;
            if (m.plugin) {
                let now = +new Date;
                if (m.plugin in stats) {
                    stat = stats[m.plugin];
                    if (!isNumber(stat.total)) stat.total = 1;
                    if (!isNumber(stat.success)) stat.success = m.error != null ? 0 : 1;
                    if (!isNumber(stat.last)) stat.last = now;
                    if (!isNumber(stat.lastSuccess)) stat.lastSuccess = m.error != null ? 0 : now;
                } else {
                    stat = stats[m.plugin] = {
                        total: 1,
                        success: m.error != null ? 0 : 1,
                        last: now,
                        lastSuccess: m.error != null ? 0 : now
                    };
                }
                stat.total += 1;
                stat.last = now;
                if (m.error == null) {
                    stat.success += 1;
                    stat.lastSuccess = now;
                }
            }
        }

        // Imprimir logs si está habilitado
        try {
            if (!opts['noprint']) {
                const { default: print } = await import('./lib/print.js');
                await print(m, this);
            }
        } catch (e) {
            console.log('Error en print:', m, m.quoted, e);
        }
        
        // Auto-read si está habilitado
        if (opts['autoread']) await this.readMessages([m.key]);
        
        // Optimización de memoria - limpiar variables grandes
        if (groupMetadata && Object.keys(groupMetadata).length > 0) {
            objectPool.returnObject(groupMetadata);
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                    HANDLERS ADICIONALES                                      │
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Handler para actualización de participantes
 */
export async function participantsUpdate({ id, participants, action }) {
    if (opts['self']) return;
    if (this.isInit) return;
    if (global.db.data == null) await loadDatabase();
    
    let chat = global.db.data.chats[id] || {};
    let text = '';
    let users = participants.map(u => this.decodeJid(u));
    
    switch (action) {
        case 'add':
        case 'remove':
            if (chat.welcome) {
                for (let user of users) {
                    let pp = './src/avatar_contact.png';
                    try {
                        pp = await this.profilePictureUrl(user, 'image');
                    } catch (e) {
                        console.log('Error obteniendo avatar:', e);
                    } finally {
                        let welcomeText = action === 'add' ? 
                            (chat.sWelcome || this.welcome || global.bienvenida || 'Bienvenido @user al grupo @subject') :
                            (chat.sBye || this.bye || global.despedida || 'Adiós @user, esperamos verte pronto');
                        
                        text = welcomeText
                            .replace(/@subject/g, await this.getName(id))
                            .replace(/@desc/g, (await this.groupMetadata(id)).desc?.toString() || 'Sin descripción')
                            .replace(/@user/g, '@' + user.split('@')[0]);
                        
                        // Enviar bienvenida con imagen
                        await this.sendFile(id, pp, 'pp.jpg', text, null, false, {
                            mentions: [user],
                            contextInfo: {
                                externalAdReply: {
                                    title: action === 'add' ? '¡Bienvenido! 👋' : '¡Hasta pronto! 👋',
                                    body: `𒁈 ${global.namebot || 'Avenix-Multi'}`,
                                    thumbnailUrl: pp,
                                    sourceUrl: global.github || 'https://github.com/Brashkie/Avenix-Multi',
                                    mediaType: 1,
                                    renderLargerThumbnail: true
                                }
                            }
                        });
                    }
                }
            }
            break;
            
        case 'promote':
            if (chat.detect) {
                text = (chat.sPromote || this.spromote || global.promote || '@user ahora es administrador')
                    .replace('@user', '@' + participants[0].split('@')[0]);
                
                this.sendMessage(id, { 
                    text, 
                    mentions: [participants[0]],
                    contextInfo: {
                        externalAdReply: {
                            title: '👑 Nuevo Administrador',
                            body: `𒁈 ${global.namebot || 'Avenix-Multi'}`,
                            thumbnailUrl: global.imagen1 || './media/promote.jpg',
                            sourceUrl: global.github || 'https://github.com/Brashkie/Avenix-Multi',
                            mediaType: 1
                        }
                    }
                });
            }
            break;
            
        case 'demote':
            if (chat.detect) {
                text = (chat.sDemote || this.sdemote || global.demote || '@user ya no es administrador')
                    .replace('@user', '@' + participants[0].split('@')[0]);
                    
                this.sendMessage(id, { 
                    text, 
                    mentions: [participants[0]],
                    contextInfo: {
                        externalAdReply: {
                            title: '📉 Administrador Removido',
                            body: `𒁈 ${global.namebot || 'Avenix-Multi'}`,
                            thumbnailUrl: global.imagen2 || './media/demote.jpg',
                            sourceUrl: global.github || 'https://github.com/Brashkie/Avenix-Multi',
                            mediaType: 1
                        }
                    }
                });
            }
            break;
    }
}

/**
 * Handler para actualización de grupos
 */
export async function groupsUpdate(updates) {
    if (opts['self']) return;
    
    for (const update of updates) {
        const id = update.id;
        if (!id) continue;
        
        let chat = global.db.data.chats[id];
        if (!chat?.detect) continue;
        
        if (update.desc) {
            await this.sendMessage(id, { 
                text: (chat.sDesc || this.sDesc || global.sDesc || 'Descripción del grupo actualizada:\n@desc')
                    .replace('@desc', update.desc.toString()),
                contextInfo: {
                    externalAdReply: {
                        title: '📝 Descripción Actualizada',
                        body: `𒁈 ${global.namebot || 'Avenix-Multi'}`,
                        thumbnailUrl: global.imagen3 || './media/thumbnail.jpg',
                        sourceUrl: global.github || 'https://github.com/Brashkie/Avenix-Multi',
                        mediaType: 1
                    }
                }
            });
        }
        
        if (update.subject) {
            await this.sendMessage(id, { 
                text: (chat.sSubject || this.sSubject || global.sSubject || 'Nombre del grupo actualizado:\n@subject')
                    .replace('@subject', update.subject),
                contextInfo: {
                    externalAdReply: {
                        title: '🏷️ Nombre Actualizado',
                        body: `𒁈 ${global.namebot || 'Avenix-Multi'}`,
                        thumbnailUrl: global.imagen3 || './media/thumbnail.jpg',
                        sourceUrl: global.github || 'https://github.com/Brashkie/Avenix-Multi',
                        mediaType: 1
                    }
                }
            });
        }
        
        if (update.revoke) {
            await this.sendMessage(id, { 
                text: (chat.sRevoke || this.sRevoke || global.sRevoke || 'Link del grupo restablecido:\n@revoke')
                    .replace('@revoke', update.revoke),
                contextInfo: {
                    externalAdReply: {
                        title: '🔗 Link Actualizado',
                        body: `𒁈 ${global.namebot || 'Avenix-Multi'}`,
                        thumbnailUrl: global.imagen3 || './media/thumbnail.jpg',
                        sourceUrl: global.github || 'https://Brashkie/Avenix-Multi',
                        mediaType: 1
                    }
                }
            });
        }
    }
}

/**
 * Handler para mensajes eliminados
 */
export async function deleteUpdate(message) {
    try {
        const { fromMe, id, participant } = message;
        if (fromMe) return;
        
        let msg = this.serializeM(this.loadMessage(id));
        if (!msg) return;
        
        let chat = global.db.data.chats[msg.chat] || {};
        if (!chat.antidelete) return;
        
        let deleteMsg = `🗑️ *MENSAJE ELIMINADO DETECTADO* 𒁈\n\n`;
        deleteMsg += `👤 *Usuario:* @${participant.split('@')[0]}\n`;
        deleteMsg += `📱 *Chat:* ${msg.isGroup ? (await this.getName(msg.chat)) : 'Chat Privado'}\n`;
        deleteMsg += `🕐 *Hora:* ${moment().tz('America/Mexico_City').format('HH:mm:ss DD/MM/YYYY')}\n\n`;
        
        if (msg.text) {
            deleteMsg += `💬 *Texto:*\n${msg.text}\n\n`;
        }
        
        if (msg.mtype !== 'conversation') {
            deleteMsg += `📎 *Tipo:* ${msg.mtype.replace('Message', '')}\n`;
        }
        
        deleteMsg += `⚠️ *Nota:* Este mensaje fue eliminado por el usuario`;
        
        await this.reply(msg.chat, deleteMsg, null, {
            mentions: [participant],
            contextInfo: {
                externalAdReply: {
                    title: '🗑️ Anti-Delete Activado',
                    body: `𒁈 ${global.namebot || 'Avenix-Multi'}`,
                    thumbnailUrl: global.imagen4 || './media/thumbnail.jpg',
                    sourceUrl: global.github || 'https://github.com/Brashkie/Avenix-Multi',
                    mediaType: 1
                }
            }
        });
        
    } catch (e) {
        console.error('Error en deleteUpdate:', e);
    }
}

/**
 * Handler para llamadas
 */
export async function callUpdate(json) {
    let { content, participants } = json;
    if (json.content[0].tag == 'offer') {
        let object = content[0].attrs['call-creator'];
        let settings = global.db.data.settings[this.user.jid] || {};
        
        if (settings.antiCall) {
            await this.updateBlockStatus(object, 'block');
            
            let callMsg = `📞 *LLAMADA BLOQUEADA* 𒁈\n\n`;
            callMsg += `👤 *Usuario:* @${object.split('@')[0]}\n`;
            callMsg += `🚫 *Acción:* Usuario bloqueado automáticamente\n`;
            callMsg += `⚠️ *Razón:* Anti-llamadas activado\n\n`;
            callMsg += `*Nota:* Para desactivar esta función, usa *.anticall off*`;
            
            // Notificar a owners
            for (let [jid] of global.owner.filter(([number, _, isDeveloper]) => isDeveloper && number)) {
                let data = (await this.onWhatsApp(jid + '@s.whatsapp.net'))[0] || {};
                if (data.exists) {
                    this.reply(data.jid, callMsg, null, { mentions: [object] });
                }
            }
        }
    }
}

/**
 * Función para formatear tiempo
 */
function clockString(ms) {
    let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000);
    let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60;
    let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60;
    return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':');
}

// Observar cambios en el archivo
const file = global.__filename(import.meta.url, true);
watchFile(file, async () => {
    unwatchFile(file);
    console.log(chalk.greenBright("📁 Handler actualizado: 'handler.js'"));
    if (global.reloadHandler) console.log(await global.reloadHandler());
});

/**
 * Función de manejo de fallos por defecto
 */
global.dfail = (type, m, extra) => {
    let msg = {
        rowner: '🚫 Solo mi *Desarrollador Principal* puede usar este comando',
        owner: '🚫 Solo mi *Propietario* puede usar este comando', 
        mods: '🚫 Solo los *Moderadores* pueden usar este comando',
        premium: '💎 Este comando es solo para usuarios *Premium*\n\n📝 Para ser usuario premium contacta a mi propietario\n*.owner*',
        premsub: '⭐ Esta función solo puede ser usada por *SubBots Premium*\n\nContacta al propietario para más información',
        group: '📱 Este comando solo se puede usar en *Grupos*',
        private: '👤 Este comando solo se puede usar en *Chat Privado*',
        admin: '👑 Este comando es solo para *Administradores* del grupo',
        botAdmin: '🤖 Necesito ser *Administrador* para usar este comando',
        unreg: '📝 Necesitas estar *Registrado* para usar este comando\n\n📋 Escribe: *.reg nombre.edad*\nEjemplo: *.reg Juan.25*',
        restrict: '🚫 Esta función está *Deshabilitada* por el propietario',
        nsfw: '🔞 Los comandos *NSFW* están deshabilitados en este grupo\n\n🔓 Para activar escribe: *.enable nsfw*',
        gconly: '📱 Este bot está configurado solo para *Grupos*\n\nContacta al propietario para más información',
        pconly: '👤 Este bot está configurado solo para *Chat Privado*\n\nContacta al propietario para más información'
    }[type];
    
    if (msg) {
        return m.reply(`${msg}\n\n𒁈 *${global.namebot || 'Avenix-Multi'}*\nCreado por: *${global.author || 'Hepein Oficial'}*`);
    }
};
