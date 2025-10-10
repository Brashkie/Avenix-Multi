// plugins/pet-adopt.js
import { petManager, SPECIES_CATALOG, CONFIG } from '../lib/pet-system.js';

let handler = async (m, { conn, text, usedPrefix, command }) => {
    const userId = m.sender;
    
    // Verificar si ya tiene mascota
    const userPets = petManager.getPetsByOwner(userId);
    
    if (userPets.length >= 3) {
        return m.reply('❌ Ya tienes el máximo de mascotas (3). Libera una primero.');
    }
    
    // Verificar money
    const user = global.db.data.users[userId];
    if (user.money < CONFIG.ADOPTION_COST) {
        return m.reply(`💰 Necesitas ${CONFIG.ADOPTION_COST} money para adoptar una mascota.\nTienes: ${user.money} money`);
    }
    
    // Adoptar mascota aleatoria
    const species = petManager.getRandomSpecies();
    const speciesData = SPECIES_CATALOG[species];
    const name = text || null;
    
    const result = petManager.adoptPet(userId, species, name);
    
    if (!result.success) {
        return m.reply(`❌ Error: ${result.message}`);
    }
    
    // Cobrar
    user.money -= CONFIG.ADOPTION_COST;
    
    // Guardar pet ID en usuario
    if (!user.pets) user.pets = [];
    user.pets.push(result.pet.id);
    
    const rarityEmoji = {
        common: '⚪',
        uncommon: '🟢',
        rare: '🔵',
        epic: '🟣',
        legendary: '🟡'
    };
    
    await conn.reply(m.chat, `
🎉 *¡ADOPCIÓN EXITOSA!* 🎉

${result.pet.emoji} *${result.pet.name}*
━━━━━━━━━━━━━━
📋 Especie: ${speciesData.name}
${rarityEmoji[result.pet.rarity]} Rareza: ${result.pet.rarity}
⚡ Tipo: ${result.pet.type}
━━━━━━━━━━━━━━
📊 *Estadísticas Iniciales*
❤️ HP: ${result.pet.stats.hp}
⚔️ ATK: ${result.pet.stats.atk}
🛡️ DEF: ${result.pet.stats.def}
💨 SPD: ${result.pet.stats.spd}
━━━━━━━━━━━━━━
💰 Costo: ${CONFIG.ADOPTION_COST} money

🎮 *Comandos disponibles:*
- ${usedPrefix}petinfo - Ver estado
- ${usedPrefix}petfeed - Alimentar
- ${usedPrefix}petplay - Jugar
- ${usedPrefix}petbattle - Batallar

¡Cuida bien de ${result.pet.name}! 🐾
    `.trim(), m);
};

handler.help = ['adopt', 'adoptpet'];
handler.tags = ['pet'];
handler.command = /^(adopt|adoptpet)$/i;
handler.register = true;

export default handler;
