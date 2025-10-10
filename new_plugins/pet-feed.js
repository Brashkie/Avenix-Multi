// plugins/pet-feed.js
import { petManager, ITEMS, CONFIG } from '../lib/pet-system.js';

let handler = async (m, { conn, text }) => {
    const userId = m.sender;
    const user = global.db.data.users[userId];
    
    if (!user.pets || user.pets.length === 0) {
        return m.reply('❌ No tienes mascotas.');
    }
    
    if (!text) {
        const foodList = Object.entries(ITEMS)
            .filter(([id, item]) => item.type === 'food')
            .map(([id, item]) => `• ${item.emoji} ${item.name} - ${item.cost} money (+${item.hunger} hambre)`)
            .join('\n');
        
        return m.reply(`🍖 *COMIDA DISPONIBLE*\n\n${foodList}\n\n📝 Uso: *.petfeed [comida]*\nEjemplo: *.petfeed meat*`);
    }
    
    const itemId = text.toLowerCase();
    const item = ITEMS[itemId];
    
    if (!item || item.type !== 'food') {
        return m.reply('❌ Comida inválida. Usa *.petfeed* para ver opciones.');
    }
    
    // Verificar money
    if (user.money < item.cost) {
        return m.reply(`💰 Necesitas ${item.cost} money.\nTienes: ${user.money} money`);
    }
    
    const petId = user.pets[0];
    const pet = petManager.getPet(petId);
    
    const result = pet.feed(itemId);
    
    if (!result.success) {
        return m.reply(`❌ ${result.message}`);
    }
    
    // Cobrar
    user.money -= item.cost;
    
    await conn.reply(m.chat, `
${result.message}

📊 *Estado Actual:*
🍖 Hambre: ${result.stats.hunger}%
😊 Felicidad: ${result.stats.happiness}%
💰 Pagaste: ${item.cost} money
    `.trim(), m);
};

handler.help = ['petfeed [comida]'];
handler.tags = ['pet'];
handler.command = /^(petfeed|feed)$/i;
handler.register = true;

export default handler;
