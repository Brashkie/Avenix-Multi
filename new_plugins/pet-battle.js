// plugins/pet-battle.js
import { petManager } from '../lib/pet-system.js';

let handler = async (m, { conn, text }) => {
    const userId = m.sender;
    const user = global.db.data.users[userId];
    
    if (!user.pets || user.pets.length === 0) {
        return m.reply('❌ No tienes mascotas.');
    }
    
    const opponent = m.mentionedJid[0];
    
    if (!opponent) {
        return m.reply('❌ Menciona a tu oponente.\nEjemplo: *.petbattle @usuario*');
    }
    
    const opponentUser = global.db.data.users[opponent];
    
    if (!opponentUser.pets || opponentUser.pets.length === 0) {
        return m.reply('❌ El oponente no tiene mascotas.');
    }
    
    const petId1 = user.pets[0];
    const petId2 = opponentUser.pets[0];
    
    const pet1 = petManager.getPet(petId1);
    const pet2 = petManager.getPet(petId2);
    
    // Iniciar batalla
    const battleResult = petManager.startBattle(petId1, petId2);
    
    if (!battleResult.success) {
        return m.reply(`❌ ${battleResult.message}`);
    }
    
    await conn.reply(m.chat, `
⚔️ *BATALLA INICIADA* ⚔️

${pet1.emoji} **${pet1.name}** (Lv.${pet1.level})
VS
${pet2.emoji} **${pet2.name}** (Lv.${pet2.level})

🎮 Iniciando combate automático...
    `.trim(), m);
    
    // Auto-batalla
    const battle = petManager.getActiveBattle(battleResult.battleId);
    const result = battle.autoPlay();
    
    // Mostrar resultado
    const winnerEmoji = result.winner === pet1.name ? pet1.emoji : pet2.emoji;
    
    await conn.reply(m.chat, `
━━━━━━━━━━━━━━
${result.log.join('\n')}
━━━━━━━━━━━━━━

🏆 *RESULTADO FINAL*
Ganador: ${winnerEmoji} ${result.winner}
Turnos: ${result.turns}

📊 *Estadísticas Post-Batalla:*
${pet1.emoji} ${pet1.name}: ${result.pet1Stats.wins}W-${result.pet1Stats.losses}L
${pet2.emoji} ${pet2.name}: ${result.pet2Stats.wins}W-${result.pet2Stats.losses}L
    `.trim(), m);
};

handler.help = ['petbattle @user'];
handler.tags = ['pet'];
handler.command = /^(petbattle|battle)$/i;
handler.register = true;

export default handler;
