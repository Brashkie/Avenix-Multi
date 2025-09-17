/**
 * Plugin: Menu Principal
 * Archivo: plugins/main-menu.js
 * Avenix-Multi Bot
 * Creado por: Hepein Oficial
 */

import { promises } from 'fs';
import { join } from 'path';
import moment from 'moment-timezone';
import os from 'os';

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
    'ai': '🤖 Inteligencia Artificial',
    'owner': '👨‍💻 Owner',
    'economy': '💰 Economía',
    'converter': '🔄 Conversores',
    'maker': '🎨 Maker',
    'database': '🗄️ Base de Datos'
};

const defaultMenu = {
    before: `
╭─ 〔 *AVENIX-MULTI* 〕 ─
├ 🤖 *Bot:* %me
├ 👤 *Usuario:* %name
├ 📅 *Fecha:* %date
├ ⏰ *Tiempo:* %time
├ ⏳ *Tiempo Activo:* %muptime
├ 📊 *Nivel:* %level (%exp / %maxexp)
├ 💰 *Dinero:* $%money
├ 💎 *Límites:* %limit
├ 📈 *XP Total:* %totalexp XP
├ 📊 *Usuarios:* %rtotalreg de %totalreg
├ 🏛️ *Plataforma:* %platform
├ 📺 *Canales:* %newsletters
╰────────────⳹

%readmore`.trimStart(),
    header: '╭─ 〔 *%category* 〕 ─',
    body: '├ %cmd %islimit %isPremium',
    footer: '╰────────────⳹\n',
    after: `
*🎯 INFORMACIÓN DEL BOT*
┌─⊷ *AVENIX-MULTI*
▢ Creado por: *Hepein Oficial*
▢ Versión: *2.0.0*
▢ Prefijo: *[ %p ]*
▢ Fecha: *%date*
▢ Tiempo Activo: *%muptime*
▢ Repositorio: *%github*
└───────────

*💡 INFORMACIÓN*
▢ Comando con *ⓛ* = Requiere límites
▢ Comando con *ⓟ* = Solo premium
▢ Para reportar errores: *.report [texto]*
▢ Para solicitar funciones: *.request [texto]*

*🔗 ENLACES IMPORTANTES*
▢ YouTube: https://youtube.com/@hepeinoficial
▢ GitHub: https://github.com/hepeinoficial
▢ Instagram: https://instagram.com/hepein.oficial
▢ WhatsApp: https://wa.me/5219992095479

*📺 NUESTROS CANALES*
${global.NEWSLETTERS ? global.NEWSLETTERS.nombres.map((nombre, i) => `▢ ${nombre}`).join('\n') : '▢ Canales disponibles'}

© *Hepein Oficial* - 2024
*"Haciendo WhatsApp más inteligente"*
`,
};

let handler = async (m, { conn, usedPrefix: _p, __dirname, args, command }) => {
    let { exp, limit, level, money, role } = global.db.data.users[m.sender];
    let name = await conn.getName(m.sender);
    let d = new Date(new Date + 3600000);
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
    
    let _uptime = process.uptime() * 1000;
    let _muptime;
    if (process.send) {
        process.send('uptime');
        _muptime = await new Promise(resolve => {
            process.once('message', resolve);
            setTimeout(resolve, 1000);
        }) * 1000;
    }
    let muptime = clockString(_muptime || _uptime);
    let uptime = clockString(_uptime);
    let totalreg = Object.keys(global.db.data.users).length;
    let rtotalreg = Object.values(global.db.data.users).filter(user => user.registered == true).length;
    
    // Obtener ayuda de plugins
    let help = Object.values(global.plugins).filter(plugin => !plugin.disabled).map(plugin => {
        return {
            help: Array.isArray(plugin.help) ? plugin.help : [plugin.help],
            tags: Array.isArray(plugin.tags) ? plugin.tags : [plugin.tags],
            prefix: 'customPrefix' in plugin,
            limit: plugin.limit,
            premium: plugin.premium,
            enabled: !plugin.disabled,
        };
    });
    
    for (let plugin of help)
        if (plugin && 'tags' in plugin)
            for (let tag of plugin.tags)
                if (!(tag in tags) && tag) tags[tag] = tag;
    
    conn.menu = conn.menu ? conn.menu : {};
    let before = conn.menu.before || defaultMenu.before;
    let header = conn.menu.header || defaultMenu.header;
    let body = conn.menu.body || defaultMenu.body;
    let footer = conn.menu.footer || defaultMenu.footer;
    let after = conn.menu.after || defaultMenu.after;
    
    let _text = [
        before,
        ...Object.keys(tags).map(tag => {
            return header.replace(/%category/g, tags[tag]) + '\n' + [
                ...help.filter(menu => menu.tags && menu.tags.includes(tag) && menu.help).map(menu => {
                    return menu.help.map(help => {
                        return body.replace(/%cmd/g, menu.prefix ? help : '%p' + help)
                            .replace(/%islimit/g, menu.limit ? ' ⓛ' : '')
                            .replace(/%isPremium/g, menu.premium ? ' ⓟ' : '')
                            .trim();
                    }).join('\n');
                }),
                footer
            ].join('\n');
        }),
        after
    ].join('\n');
    
    let text = typeof conn.menu == 'string' ? conn.menu : typeof conn.menu == 'object' ? _text : '';
    
    // Calcular nivel
    let min = 0;
    let xp = exp;
    let max = 200 * Math.pow(level, 2) + 200 * level + 200;
    
    let replace = {
        '%': '%',
        p: _p, 
        uptime, 
        muptime,
        me: conn.getName(conn.user.jid),
        npmname: global.npmname || 'Avenix-Multi',
        version: global.version || '2.0.0',
        github: global.github || 'https://github.com/hepeinoficial/avenix-multi',
        exp: exp - min,
        maxexp: xp,
        totalexp: exp,
        xp4levelup: max - exp,
        level, 
        limit, 
        name, 
        date, 
        time, 
        totalreg, 
        rtotalreg, 
        role,
        readmore: readMore,
        money: money.toLocaleString('es-ES'),
        platform: os.platform(),
        newsletters: '4 Canales Activos'
    };
    
    text = text.replace(new RegExp(`%(${Object.keys(replace).sort((a, b) => b.length - a.length).join`|`})`, 'g'), 
        (_, name) => '' + replace[name]);

    let pp = './media/menu.jpg';
    try {
        pp = await conn.profilePictureUrl(conn.user.jid, 'image');
    } catch (e) {
        console.log('Error obteniendo foto de perfil:', e);
    } finally {
        // Si es texto plano
        if (args[0] == 'txt') {
            return conn.reply(m.chat, text.replace(/\*/g, '_'), m);
        }
        
        // Enviar con imagen y botones
        let contextInfo = {
            mentionedJid: [m.sender],
            externalAdReply: {
                title: '『 AVENIX-MULTI 』',
                body: 'Bot de WhatsApp Multifuncional',
                thumbnailUrl: pp,
                sourceUrl: global.github || 'https://github.com/hepeinoficial/avenix-multi',
                mediaType: 1,
                renderLargerThumbnail: true
            }
        };
        
        // Botones del menú
        let buttons = [
            ['📊 Estado', '.ping'],
            ['👤 Perfil', '.profile'],
            ['ℹ️ Info', '.info']
        ];
        
        let urls = [
            ['🌐 GitHub', global.github || 'https://github.com/hepeinoficial/avenix-multi'],
            ['📱 WhatsApp', 'https://wa.me/5219992095479']
        ];
        
        return conn.sendButton(m.chat, text.trim(), 
            `© Hepein Oficial - ${new Date().getFullYear()}`, 
            pp, buttons, null, urls, m, { contextInfo });
    }
};

handler.help = ['menu', 'help', '?'];
handler.tags = ['main'];
handler.command = /^(menu|help|\?|commands?)$/i;
handler.register = false;

export default handler;

const more = String.fromCharCode(8206);
const readMore = more.repeat(4001);

function clockString(ms) {
    let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000);
    let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60;
    let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60;
    return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':');
}
