/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                   𒁈 MENU PRINCIPAL V6.5.0 𒁈                                ┃
 * ┃              Sistema Completo de SubBots con Roles                           ┃
 * ┃                    Creado por: Hepein Oficial                                ┃
 * ┃                Compatible con: handler.js V6.5.0                             ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import { promises } from 'fs';
import { join } from 'path';
import moment from 'moment-timezone';
import os from 'os';
import { hasRole, isRootOwner } from '../lib/roles.js';
import { NEWSLETTERS } from '../lib/simple.js';
import type { PluginHandler } from '../types/index.js'

// ═══════════════════════════════════════════════════════════════════════════════
// │                          CONFIGURACIÓN DE TAGS                              │
// ═══════════════════════════════════════════════════════════════════════════════

let tags = {
    'main': '🏠 Principal',
    'game': '🎮 Juegos', 
    'rpg': '⚔️ RPG',
    'sticker': '🎭 Stickers',
    'fun': '🎪 Diversión',
    'anime': '🌸 Anime',
    'group': '👥 Grupos',
    'premium': '💎 Premium',
    'downloader': '📥 Descargas',
    'tools': '🛠️ Herramientas',
    'ai': '🤖 IA',
    'owner': '👨‍💻 Owner',
    'economy': '💰 Economía',
    'converter': '🔄 Conversores',
    'maker': '🎨 Maker',
    'database': '🗄️ Database'
};

// ═══════════════════════════════════════════════════════════════════════════════
// │                          CONFIGURACIÓN DE ROLES                             │
// ═══════════════════════════════════════════════════════════════════════════════

const ROLE_CONFIG = {
    rowner: {
        name: 'Root Owner',
        emoji: '👑',
        color: '⭐',
        badge: '『 ROOT OWNER 』',
        description: 'Creador Principal del Proyecto'
    },
    owner: {
        name: 'Owner',
        emoji: '👨‍💻',
        color: '💎',
        badge: '『 OWNER 』',
        description: 'Propietario del Bot'
    },
    dev: {
        name: 'Developer',
        emoji: '💻',
        color: '🔷',
        badge: '『 DEVELOPER 』',
        description: 'Desarrollador Oficial'
    },
    mods: {
        name: 'Moderador',
        emoji: '⚙️',
        color: '🔧',
        badge: '『 MODERADOR 』',
        description: 'Moderador del Sistema'
    },
    helper: {
        name: 'Helper',
        emoji: '🛠️',
        color: '🔨',
        badge: '『 HELPER 』',
        description: 'Ayudante del Bot'
    },
    contributor: {
        name: 'Contributor',
        emoji: '⭐',
        color: '✨',
        badge: '『 CONTRIBUTOR 』',
        description: 'Contribuidor del Proyecto'
    },
    betaTester: {
        name: 'Beta Tester',
        emoji: '🧪',
        color: '🔬',
        badge: '『 BETA TESTER 』',
        description: 'Probador Beta'
    },
    donator: {
        name: 'Donador',
        emoji: '💝',
        color: '💰',
        badge: '『 DONADOR 』',
        description: 'Donador del Proyecto'
    },
    partner: {
        name: 'Partner',
        emoji: '🤝',
        color: '🌟',
        badge: '『 PARTNER 』',
        description: 'Socio Oficial'
    },
    influencer: {
        name: 'Influencer',
        emoji: '🌟',
        color: '✨',
        badge: '『 INFLUENCER 』',
        description: 'Influencer Verificado'
    },
    premium: {
        name: 'Premium',
        emoji: '💎',
        color: '✨',
        badge: '『 PREMIUM 』',
        description: 'Usuario Premium'
    },
    vip: {
        name: 'VIP',
        emoji: '⭐',
        color: '💫',
        badge: '『 VIP 』',
        description: 'Usuario VIP'
    },
    verified: {
        name: 'Verificado',
        emoji: '✅',
        color: '✓',
        badge: '『 VERIFICADO 』',
        description: 'Usuario Verificado'
    },
    user: {
        name: 'Usuario',
        emoji: '👤',
        color: '🔹',
        badge: '『 USUARIO 』',
        description: 'Usuario Normal'
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// │                       FUNCIÓN PARA DETECTAR ROL                             │
// ═══════════════════════════════════════════════════════════════════════════════

function detectSubBotRole(ownerNumber: string) {
    const normalizedNumber = ownerNumber.replace(/[^0-9]/g, '');

    // Verificar en orden de jerarquía (de mayor a menor)
    if (isRootOwner(normalizedNumber)) return 'rowner';

    const hierarchy = [
        ['owner', 'owner'], ['devs', 'dev'], ['mods', 'mods'], ['helpers', 'helper'],
        ['contributors', 'contributor'], ['betaTesters', 'betaTester'], ['donators', 'donator'],
        ['partners', 'partner'], ['influencers', 'influencer']
    ] as const;
    for (const [list, role] of hierarchy) {
        if (hasRole(list, normalizedNumber)) return role;
    }

    // Premium (verificar en actives de SubBots)
    const mainBotJid = global.conn?.user?.jid;
    if (mainBotJid) {
        const subsActivos: string[] = global.db?.data?.settings?.[mainBotJid]?.actives || [];
        if (subsActivos.some(jid => jid.replace(/[^0-9]/g, '') === normalizedNumber)) {
            return 'premium';
        }
    }
    
    // Por defecto: Usuario normal
    return 'user';
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                       FUNCIÓN PARA GENERAR INFO DEL BOT                     │
// ═══════════════════════════════════════════════════════════════════════════════

function generateBotInfo(conn) {
    const isBotPrincipal = conn.user.jid === global.conn?.user?.jid;
    
    if (isBotPrincipal) {
        // Es el bot principal
        return {
            isBotPrincipal: true,
            botName: conn.user.name || 'Avenix-Multi',
            header: `╭━━━━━━━━━━━━━━━━━━━━━━╮
│   🤖 AVENIX-MULTI      │
├━━━━━━━━━━━━━━━━━━━━━━┤
│ 👨‍💻 by Hepein Oficial  │
│ 🏛️ Bot Principal       │
╰━━━━━━━━━━━━━━━━━━━━━━╯`,
            credits: '👨‍💻 *Creado por:* Hepein Oficial'
        };
    } else {
        // Es un SubBot
        const subBotJid = conn.user.jid;
        const subBotNumber = subBotJid.replace(/[^0-9]/g, '');
        const subBotName = conn.user.name || 'SubBot';
        
        // Detectar rol del propietario
        const roleKey = detectSubBotRole(subBotNumber);
        const roleInfo = ROLE_CONFIG[roleKey];
        
        return {
            isBotPrincipal: false,
            isSubBot: true,
            botName: subBotName,
            ownerNumber: subBotNumber,
            ownerJid: subBotJid,
            role: roleKey,
            roleInfo: roleInfo,
            header: `╭━━━━━━━━━━━━━━━━━━━━━━╮
│   🤖 ${subBotName.substring(0, 18).padEnd(18)}│
├━━━━━━━━━━━━━━━━━━━━━━┤
│ ${roleInfo.emoji} ${roleInfo.badge.padEnd(20)}│
│ 👤 SubBot by Hepein    │
├━━━━━━━━━━━━━━━━━━━━━━┤
│ 📱 Dueño: @${subBotNumber.substring(0, 11).padEnd(11)}│
│ ⭐ Rol: ${roleInfo.name.padEnd(15)}│
│ 📝 ${roleInfo.description.substring(0, 18).padEnd(18)}│
╰━━━━━━━━━━━━━━━━━━━━━━╯`,
            credits: `${roleInfo.emoji} *SubBot ${roleInfo.name}* by Hepein Oficial\n📱 *Propietario:* @${subBotNumber}\n${roleInfo.color} *Rol:* ${roleInfo.badge}`,
            mentionJid: subBotJid
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                          TEMPLATES DEL MENÚ                                 │
// ═══════════════════════════════════════════════════════════════════════════════

const defaultMenu = {
    before: `%botinfo

╭─ 〔 *INFO USUARIO* 〕 ─
├ 👤 *Usuario:* %name
├ 📅 *Fecha:* %date
├ ⏰ *Hora:* %time
├ ⏳ *Activo:* %muptime
├ 📊 *Nivel:* %level
├ 💰 *Money:* $%money
├ 💎 *Diamantes:* %diamond
├ 📈 *XP:* %exp / %maxexp
├ 🎯 *XP Total:* %totalexp
├ 🏆 *Rol:* %role
╰────────────⳹

╭─ 〔 *INFO SISTEMA* 〕 ─
├ 👥 *Usuarios:* %rtotalreg / %totalreg
├ 🖥️ *Plataforma:* %platform
├ 📺 *Canales:* %newsletters
╰────────────⳹

%readmore`.trimStart(),
    header: '╭─ 〔 *%category* 〕 ─',
    body: '├ %cmd %islimit %isPremium',
    footer: '╰────────────⳹\n',
    after: `
*🎯 INFORMACIÓN*
┌─⊷ *AVENIX-MULTI*
▢ Versión: *V6.5.0*
▢ Prefijo: *[ %p ]*
▢ Uptime: *%muptime*
▢ %botcredits
└───────────

*💡 LEYENDA*
▢ ⓛ = Requiere límites
▢ ⓟ = Solo premium
▢ ⓥ = Solo VIP
▢ Reportar bugs: *.report [texto]*

*🔗 ENLACES*
▢ GitHub: %github
▢ YouTube: youtube.com/@hepeinoficial
▢ WhatsApp: wa.me/5219992095479

*📺 CANALES*
%channelslist

© *Hepein Oficial* - 2024
𒁈 *Avenix-Multi V6.5.0* 𒁈
`,
};

// ═══════════════════════════════════════════════════════════════════════════════
// │                         HANDLER PRINCIPAL                                   │
// ═══════════════════════════════════════════════════════════════════════════════

const handler: PluginHandler = async (m, { conn, usedPrefix: _p, __dirname, args, command }) => {
    try {
        // ═════════════════════════════════════════════════════════════════════════
        // │                  DETECCIÓN DE BOT Y SUBBOT                            │
        // ═════════════════════════════════════════════════════════════════════════
        
        const botInfo = generateBotInfo(conn);
        
        // ═════════════════════════════════════════════════════════════════════════
        // │                      DATOS DEL USUARIO                                │
        // ═════════════════════════════════════════════════════════════════════════
        
        let user = global.db.data.users[m.sender];
        let { exp, limit, level, money, role, diamond } = user;
        let name = await conn.getName(m.sender);
        
        // ═════════════════════════════════════════════════════════════════════════
        // │                      FECHA Y HORA                                     │
        // ═════════════════════════════════════════════════════════════════════════
        
        let d = new Date(Date.now() + 3600000);
        let locale = 'es-ES';
        
        let date = d.toLocaleDateString(locale, {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        
        let time = d.toLocaleTimeString(locale, {
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric'
        });
        
        // ═════════════════════════════════════════════════════════════════════════
        // │                      UPTIME                                           │
        // ═════════════════════════════════════════════════════════════════════════
        
        let _uptime = process.uptime() * 1000;
        let _muptime;
        if (process.send) {
            process.send('uptime');
            _muptime = await new Promise<number>(resolve => {
                process.once('message', resolve);
                setTimeout(() => resolve(_uptime / 1000), 1000);
            }) * 1000;
        }
        let muptime = clockString(_muptime || _uptime);
        let uptime = clockString(_uptime);
        
        // ═════════════════════════════════════════════════════════════════════════
        // │                      ESTADÍSTICAS                                     │
        // ═════════════════════════════════════════════════════════════════════════
        
        let totalreg = Object.keys(global.db.data.users).length;
        let rtotalreg = Object.values(global.db.data.users).filter(user => user.registered == true).length;
        
        // ═════════════════════════════════════════════════════════════════════════
        // │                 PROCESAMIENTO DE PLUGINS                              │
        // ═════════════════════════════════════════════════════════════════════════
        
        let help: any[] = [];
        
        for (let [name, plugin] of Object.entries(global.plugins)) {
            if (plugin.disabled || !plugin.help) continue;
            
            let pluginHelp = {
                help: Array.isArray(plugin.help) ? plugin.help : [plugin.help],
                tags: Array.isArray(plugin.tags) ? plugin.tags : [plugin.tags],
                prefix: 'customPrefix' in plugin,
                limit: plugin.limit,
                premium: plugin.premium,
                vip: plugin.vip,
                enabled: true,
            };
            
            // Agregar tags dinámicamente
            for (let tag of pluginHelp.tags) {
                if (tag && !(tag in tags)) {
                    tags[tag] = tag.charAt(0).toUpperCase() + tag.slice(1);
                }
            }
            
            help.push(pluginHelp);
        }
        
        // ═════════════════════════════════════════════════════════════════════════
        // │                      TEMPLATES                                        │
        // ═════════════════════════════════════════════════════════════════════════
        
        conn.menu = conn.menu ? conn.menu : {};
        let before = conn.menu.before || defaultMenu.before;
        let header = conn.menu.header || defaultMenu.header;
        let body = conn.menu.body || defaultMenu.body;
        let footer = conn.menu.footer || defaultMenu.footer;
        let after = conn.menu.after || defaultMenu.after;
        
        // ═════════════════════════════════════════════════════════════════════════
        // │                      CONSTRUCCIÓN DEL MENÚ                            │
        // ═════════════════════════════════════════════════════════════════════════
        
        let _text = [
            before,
            ...Object.keys(tags).map(tag => {
                return header.replace(/%category/g, tags[tag]) + '\n' + [
                    ...help.filter(menu => menu.tags && menu.tags.includes(tag) && menu.help).map(menu => {
                        return menu.help.map(help => {
                            return body.replace(/%cmd/g, menu.prefix ? help : '%p' + help)
                                .replace(/%islimit/g, menu.limit ? ' ⓛ' : '')
                                .replace(/%isPremium/g, menu.premium ? ' ⓟ' : '')
                                .replace(/%isVIP/g, menu.vip ? ' ⓥ' : '')
                                .trim();
                        }).join('\n');
                    }),
                    footer
                ].join('\n');
            }),
            after
        ].join('\n');
        
        let text = typeof conn.menu == 'string' ? conn.menu : typeof conn.menu == 'object' ? _text : '';
        
        // ═════════════════════════════════════════════════════════════════════════
        // │                 CÁLCULO DE NIVEL Y XP                                 │
        // ═════════════════════════════════════════════════════════════════════════
        
        let min = 200 * Math.pow(level, 2) + 200 * level;
        let xp = exp - min;
        let max = 200 * Math.pow(level + 1, 2) + 200 * (level + 1) + 200;
        let nextLevelXP = max - min;
        
        // ═════════════════════════════════════════════════════════════════════════
        // │                      CANALES                                          │
        // ═════════════════════════════════════════════════════════════════════════
        
        let channelsList = NEWSLETTERS ? 
            NEWSLETTERS.nombres.map((nombre, i) => `▢ ${nombre}`).join('\n') : 
            '▢ No hay canales disponibles';
        
        // ═════════════════════════════════════════════════════════════════════════
        // │                      REEMPLAZOS                                       │
        // ═════════════════════════════════════════════════════════════════════════
        
        let replace = {
            '%': '%',
            p: _p,
            uptime,
            muptime,
            me: botInfo.botName,
            npmname: global.npmname || 'Avenix-Multi',
            version: global.version || '6.5.0',
            github: global.github || 'https://github.com/Brashkie/Avenix-Multi',
            exp: xp.toLocaleString('es-ES'),
            maxexp: nextLevelXP.toLocaleString('es-ES'),
            totalexp: exp.toLocaleString('es-ES'),
            xp4levelup: (max - exp).toLocaleString('es-ES'),
            level,
            limit: limit || 0,
            diamond: diamond || 0,
            name,
            date,
            time,
            totalreg,
            rtotalreg,
            role: role || 'Novato',
            readmore: readMore,
            money: money.toLocaleString('es-ES'),
            platform: os.platform(),
            newsletters: NEWSLETTERS ? 
                `${NEWSLETTERS.nombres.length} Canales` : 
                '0 Canales',
            botinfo: botInfo.header,
            botcredits: botInfo.credits,
            channelslist: channelsList
        };
        
        // Aplicar reemplazos
        text = text.replace(
            new RegExp(`%(${Object.keys(replace).sort((a, b) => b.length - a.length).join('|')})`, 'g'),
            (_, name) => '' + replace[name]
        );
        
        // ═════════════════════════════════════════════════════════════════════════
        // │                      FOTO DE PERFIL                                   │
        // ═════════════════════════════════════════════════════════════════════════
        
        // Foto del bot; si no tiene, la imagen del catálogo (si existe en ./media)
        const pp = await conn.profilePictureUrl(conn.user.jid, 'image').catch(() => undefined) || global.imagen1 || global.catalogo;
        
        // ═════════════════════════════════════════════════════════════════════════
        // │                      MODO TEXTO                                       │
        // ═════════════════════════════════════════════════════════════════════════
        
        if (args[0] == 'txt' || args[0] == 'text') {
            return conn.reply(m.chat, text.replace(/\*/g, '_'), m);
        }
        
        // ═════════════════════════════════════════════════════════════════════════
        // │                      PREPARAR MENTIONS                                │
        // ═════════════════════════════════════════════════════════════════════════
        
        let mentionedJid = [m.sender];
        if (botInfo.isSubBot && botInfo.mentionJid) {
            mentionedJid.push(botInfo.mentionJid);
        }
        
        // ═════════════════════════════════════════════════════════════════════════
        // │                      BOTONES                                          │
        // ═════════════════════════════════════════════════════════════════════════
        
        let buttons: [string, string][] = [
            ['📊 Estado', '.ping'],
            ['👤 Perfil', '.profile'],
            ['ℹ️ Info Bot', '.infobot']
        ];
        
        // Si es SubBot, agregar botón para ver info del dueño
        if (botInfo.isSubBot) {
            buttons.push(['👑 Dueño', `.perfil @${botInfo.ownerNumber}`]);
        }
        
        let urls: [string, string][] = [
            ['🌐 GitHub', global.github || 'https://github.com/Brashkie/Avenix-Multi'],
            ['📱 Canal WhatsApp', 'https://whatsapp.com/channel/0029VadxAUkKLaHoWQPZou0P'],
            ['💬 Grupo Soporte', 'https://chat.whatsapp.com/TuGrupoAqui']
        ];
        
        // Footer personalizado
        let footerText = botInfo.isSubBot 
            ? `${botInfo.roleInfo.emoji} SubBot ${botInfo.roleInfo.name} by Hepein | © ${new Date().getFullYear()}` 
            : `© Hepein Oficial - ${new Date().getFullYear()} | 𒁈 Avenix-Multi V6.5.0 𒁈`;
        
        // ═════════════════════════════════════════════════════════════════════════
        // │                      ENVIAR MENÚ                                      │
        // ═════════════════════════════════════════════════════════════════════════
        
        return conn.sendButton(
            m.chat,
            text.trim(),
            footerText,
            pp,
            buttons,
            null,
            urls,
            m,
            { 
                mentions: mentionedJid 
            }
        );
        
    } catch (e) {
        console.error('Error en menu:', e);
        m.reply(`❌ *ERROR AL GENERAR MENÚ* 𒁈\n\nOcurrió un error al generar el menú.\n\n\`\`\`${e.message}\`\`\`\n\nContacta al propietario si el error persiste.`);
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// │                      CONFIGURACIÓN DEL COMANDO                              │
// ═══════════════════════════════════════════════════════════════════════════════

handler.help = ['menu', 'help', '?', 'commands'];
handler.tags = ['main'];
handler.command = /^(menu|help|\?|commands?)$/i;
handler.register = false;

export default handler;

// ═══════════════════════════════════════════════════════════════════════════════
// │                         FUNCIONES AUXILIARES                                │
// ═══════════════════════════════════════════════════════════════════════════════

const more = String.fromCharCode(8206);
const readMore = more.repeat(4001);

function clockString(ms) {
    let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000);
    let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60;
    let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60;
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
}
