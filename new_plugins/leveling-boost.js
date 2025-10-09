// plugins/leveling-boost.js
import { multiplierManager } from '../lib/leveling-advanced.js';

let handler = async (m, { conn, args }) => {
    let user = global.db.data.users[m.sender];
    
    const duration = parseInt(args[0]) || 1; // horas
    const cost = 1000 * duration; // 1000 money por hora
    
    if (user.money < cost) {
        return m.reply(`❌ Necesitas ${cost.toLocaleString()} money\n💰 Tienes: ${user.money.toLocaleString()}`);
    }
    
    // Activar boost
    multiplierManager.activateBoost(
        m.sender,
        1.5, // x1.5 XP
        duration * 60 * 60 * 1000 // convertir horas a ms
    );
    
    // Cobrar
    user.money -= cost;
    
    let message = `🚀 *BOOST ACTIVADO* 🚀\n\n`;
    message += `⚡ Multiplicador: x1.5 XP\n`;
    message += `⏰ Duración: ${duration}h\n`;
    message += `💰 Costo: ${cost.toLocaleString()} money\n\n`;
    message += `✨ ¡Gana más XP durante las próximas ${duration} horas!`;
    
    await conn.reply(m.chat, message, m);
};

handler.help = ['boost [horas]'];
handler.tags = ['xp'];
handler.command = /^boost$/i;

export default handler;
