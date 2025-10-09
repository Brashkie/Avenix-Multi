// plugins/leveling-leaderboard.js
import { LeaderboardManager } from '../lib/leveling-advanced.js';

let handler = async (m, { conn, args }) => {
    const limit = parseInt(args[0]) || 10;
    const users = global.db.data.users;
    
    // Obtener top usuarios
    const leaderboard = LeaderboardManager.getLeaderboard(users, limit);
    
    // Renderizar
    const text = LeaderboardManager.renderLeaderboard(leaderboard, m.sender);
    
    await conn.reply(m.chat, text, m);
};

handler.help = ['lb [cantidad]', 'leaderboard', 'top'];
handler.tags = ['xp'];
handler.command = /^(lb|leaderboard|top)$/i;

export default handler;
