// plugins/gift-send.js
import { giftManager, GIFT_CATALOG } from '../lib/gift-system.js';
import type { PluginHandler } from '../types/index.js'

const handler: PluginHandler = async (m, { conn, text, usedPrefix, command }) => {
    const sender = m.sender;
    const mentioned = m.mentionedJid[0];
    
    if (!mentioned) {
        return m.reply(`❌ Debes mencionar a alguien\n\nUso: ${usedPrefix}${command} @usuario [item] [mensaje]`);
    }
    
    const args = text.split(' ').slice(1);
    const itemId = args[0];
    const message = args.slice(1).join(' ');
    
    if (!itemId) {
        return m.reply(`❌ Debes especificar un item\n\nUsa: ${usedPrefix}giftlist para ver items disponibles`);
    }
    
    // Verificar si el usuario tiene suficiente dinero
    const user = global.db.data.users[sender];
    const item = GIFT_CATALOG[itemId];
    
    if (!item) {
        return m.reply(`❌ Item no encontrado: ${itemId}`);
    }
    
    if (user.money < item.value) {
        return m.reply(`❌ No tienes suficiente dinero\n\nNecesitas: $${item.value}\nTienes: $${user.money}`);
    }
    
    // Enviar regalo
    const result = giftManager.sendGift(itemId, sender, mentioned, {
        message: message || '',
        wrap: 'basic'
    });
    
    if (result.success) {
        // Descontar dinero
        user.money -= item.value;
        
        // Notificar
        const giftEmoji = result.gift.renderWrapped();
        await m.reply(`✅ Regalo enviado!\n\n${giftEmoji} ${item.name}\n💰 Costo: $${item.value}\n📬 Para: @${mentioned.split('@')[0]}\n💬 Mensaje: ${message || 'Sin mensaje'}`, null, {
            mentions: [mentioned]
        });
        
        // Notificar al receptor
        await conn.reply(mentioned, `🎁 ¡Tienes un nuevo regalo!\n\nUsa *${usedPrefix}myregalos* para ver tus regalos`, null);
    } else {
        m.reply(result.message);
    }
};

handler.help = ['gift', 'regalo'].map(v => v + ' @usuario [item] [mensaje]');
handler.tags = ['fun'];
handler.command = /^(gift|regalo|enviaregalo)$/i;
handler.group = true;
handler.register = true;

export default handler;
