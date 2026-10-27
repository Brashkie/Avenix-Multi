// plugins/leveling-prestige.js
import { levelingSystem } from '../lib/leveling-advanced.js';
import type { PluginHandler } from '../types/index.js'

const handler: PluginHandler = async (m, { conn, usedPrefix }) => {
    let user = global.db.data.users[m.sender];
    
    const result = levelingSystem.prestige(user);
    
    if (!result.success) {
        return m.reply(`❌ ${result.message}`);
    }
    
    let message = `⭐ *¡PRESTIGIO ALCANZADO!* ⭐\n\n`;
    message += `🎖️ Prestigio: ${result.newPrestige}\n`;
    message += `📊 Nivel anterior: ${result.oldLevel}\n`;
    message += `✨ XP anterior: ${result.oldXP.toLocaleString()}\n\n`;
    message += `🎁 *BONIFICACIONES:*\n`;
    message += `⚡ Multiplicador XP: x${result.bonus.xpMultiplier.toFixed(2)}\n`;
    message += `💰 ${result.bonus.money.toLocaleString()} money\n`;
    message += `💎 ${result.bonus.diamond} diamantes\n\n`;
    message += `🔄 ¡Empieza desde nivel 0 con ventajas!`;
    
    // Actualizar dinero y diamantes
    user.money = (user.money || 0) + result.bonus.money;
    user.diamond = (user.diamond || 0) + result.bonus.diamond;
    
    await conn.reply(m.chat, message, m);
};

handler.help = ['prestige', 'prestigio'];
handler.tags = ['xp'];
handler.command = /^(prestige|prestigio)$/i;

export default handler;
