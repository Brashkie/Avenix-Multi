// plugins/leveling-rank.js
import { levelingSystem } from '../lib/leveling-advanced.js';

let handler = async (m, { conn, usedPrefix }) => {
    let user = global.db.data.users[m.sender];
    
    // Generar tarjeta de perfil
    const profileCard = levelingSystem.generateProfileCard(user);
    
    await conn.reply(m.chat, profileCard, m);
};

handler.help = ['rank', 'nivel', 'level'];
handler.tags = ['xp'];
handler.command = /^(rank|nivel|level)$/i;

export default handler;
