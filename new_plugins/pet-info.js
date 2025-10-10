// plugins/pet-info.js
import { petManager } from '../lib/pet-system.js';

let handler = async (m, { conn }) => {
    const userId = m.sender;
    const user = global.db.data.users[userId];
    
    if (!user.pets || user.pets.length === 0) {
        return m.reply('❌ No tienes mascotas. Usa *.adopt* para adoptar una.');
    }
    
    // Obtener mascota activa (primera)
    const petId = user.pets[0];
    const pet = petManager.getPet(petId);
    
    if (!pet) {
        return m.reply('❌ Mascota no encontrada.');
    }
    
    // Renderizar estado
    const status = pet.render();
    
    await conn.reply(m.chat, status, m);
};

handler.help = ['petinfo', 'pet'];
handler.tags = ['pet'];
handler.command = /^(petinfo|pet|mypet)$/i;
handler.register = true;

export default handler;
