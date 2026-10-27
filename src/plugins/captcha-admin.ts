// plugins/captcha-admin.js
import { captchaSystem, CONFIG } from '../lib/captcha.js';
import type { PluginHandler } from '../types/index.js'

const handler: PluginHandler = async (m, { conn, command, text, isAdmin, isOwner }) => {
    if (!isAdmin && !isOwner) {
        return m.reply('❌ Solo administradores pueden usar este comando.');
    }
    
    const chat = global.db.data.chats[m.chat];
    
    switch (command) {
        case 'captchaon':
            chat.autoCaptcha = true;
            chat.captchaType = text || 'math';
            await m.reply(`✅ Auto-CAPTCHA activado\nTipo: ${chat.captchaType}`);
            break;
            
        case 'captchaoff':
            chat.autoCaptcha = false;
            await m.reply('❌ Auto-CAPTCHA desactivado');
            break;
            
        case 'captchadif':
            const difficulties = ['easy', 'medium', 'hard', 'extreme'];
            if (!difficulties.includes(text)) {
                return m.reply(`❌ Dificultad inválida.\n\nDisponibles: ${difficulties.join(', ')}`);
            }
            chat.captchaDifficulty = text;
            await m.reply(`✅ Dificultad cambiada a: ${text}`);
            break;
            
        case 'whitelist':
            const target = m.mentionedJid[0];
            if (!target) return m.reply('❌ Menciona a alguien');
            
            captchaSystem.addToWhitelist(target);
            await m.reply(`⭐ @${target.split('@')[0]} agregado a whitelist`, null, {
                mentions: [target]
            });
            break;
            
        case 'blacklist':
            const banned = m.mentionedJid[0];
            if (!banned) return m.reply('❌ Menciona a alguien');
            
            captchaSystem.addToBlacklist(banned);
            await m.reply(`🚫 @${banned.split('@')[0]} agregado a blacklist`, null, {
                mentions: [banned]
            });
            break;
            
        case 'captchastats':
            const stats = captchaSystem.getStats();
            await m.reply(`
📊 *ESTADÍSTICAS DE CAPTCHA* 📊

🔢 Total: ${stats.total}
✅ Exitosos: ${stats.success}
❌ Fallidos: ${stats.failed}
⏰ Timeouts: ${stats.timeout}
📈 Tasa de éxito: ${stats.successRate}

👥 Usuarios verificados: ${stats.activeUsers}
🔐 CAPTCHAs activos: ${stats.activeCaptchas}
🚫 Usuarios baneados: ${stats.bannedUsers}

⭐ Whitelist: ${stats.whitelistSize}
🚫 Blacklist: ${stats.blacklistSize}

*Por tipo:*
${Object.entries(stats.byType as Record<string, any>).map(([type, count]) => `• ${type}: ${count}`).join('\n')}

*Por dificultad:*
${Object.entries(stats.byDifficulty as Record<string, any>).map(([diff, count]) => `• ${diff}: ${count}`).join('\n')}
            `.trim());
            break;
    }
};

handler.help = ['captchaon', 'captchaoff', 'captchadif', 'whitelist', 'blacklist', 'captchastats'];
handler.tags = ['group', 'admin'];
handler.command = /^(captchaon|captchaoff|captchadif|whitelist|blacklist|captchastats)$/i;
handler.group = true;
handler.admin = true;

export default handler;
