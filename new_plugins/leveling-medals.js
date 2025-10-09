// plugins/leveling-medals.js
import { MEDALS } from '../lib/leveling-advanced.js';

let handler = async (m, { conn }) => {
    let user = global.db.data.users[m.sender];
    
    const userMedals = user.medals || [];
    
    let message = `🏅 *TUS MEDALLAS* 🏅\n\n`;
    message += `Total: ${userMedals.length}/${Object.keys(MEDALS).length}\n\n`;
    
    // Medallas obtenidas
    if (userMedals.length > 0) {
        message += `✅ *OBTENIDAS:*\n`;
        userMedals.forEach(medalId => {
            const medal = MEDALS[medalId];
            if (medal) {
                message += `${medal.emoji} ${medal.name}\n   ${medal.description}\n\n`;
            }
        });
    }
    
    // Medallas bloqueadas
    const locked = Object.entries(MEDALS)
        .filter(([id]) => !userMedals.includes(id))
        .slice(0, 5);
    
    if (locked.length > 0) {
        message += `🔒 *BLOQUEADAS (Próximas):*\n`;
        locked.forEach(([id, medal]) => {
            message += `🔒 ${medal.name}\n   ${medal.description}\n\n`;
        });
    }
    
    await conn.reply(m.chat, message, m);
};

handler.help = ['medals', 'medallas', 'logros'];
handler.tags = ['xp'];
handler.command = /^(medals|medallas|logros)$/i;

export default handler;
