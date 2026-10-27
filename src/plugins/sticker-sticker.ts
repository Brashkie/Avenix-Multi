// En tu plugin de stickers
import StickerMaker from '../lib/sticker-maker-advanced.js';
import type { PluginHandler } from '../types/index.js'

const handler: PluginHandler = async (m, { conn, usedPrefix, command }) => {
    const q = m.quoted ? m.quoted : m;
    const mime = (q.msg || q).mimetype || '';
    
    if (!mime) {
        return m.reply('❌ Responde a una imagen o video con el comando');
    }
    
    try {
        m.reply('🔄 Creando sticker...');
        
        // Descargar media
        const media = await q.download();
        if (!Buffer.isBuffer(media)) return m.reply('❌ No se pudo descargar el archivo');
        
        // Crear sticker maker
        const maker = new StickerMaker({
            author: global.author || 'Bot',
            packname: global.packname || 'Stickers'
        });
        
        // Opciones según comando
        const options: Record<string, any> = {};
        
        if (command === 'wm') {
            // Con marca de agua (texto)
            options.text = global.wm || 'Bot Sticker';
            options.textOptions = { y: 450 };
        } else if (command === 'blur') {
            // Con efecto blur
            options.effects = ['blur'];
        }
        
        // Crear sticker
        const sticker = await maker.create(media, options);
        
        // Enviar
        await conn.sendMessage(m.chat, {
            sticker: sticker
        }, { quoted: m });
        
    } catch (error) {
        console.error(error);
        m.reply(`❌ Error: ${error.message}`);
    }
};

handler.help = ['wm', 'blur'];
handler.tags = ['sticker'];
handler.command = /^(wm|blur)$/i;

export default handler;
