import { MemeGenerator, gallery } from '../lib/meme-generator.js';
import { sticker } from '../lib/sticker.js';

let handler = async (m, { conn, text, command, usedPrefix, args }) => {
    const userId = m.sender;
    
    // ═══════════════════════════════════════════════════════════════════════
    // │                      LISTAR PLANTILLAS                              │
    // ═══════════════════════════════════════════════════════════════════════
    
    if (command === 'memelist' || command === 'memetemplates') {
        const category = args[0] || 'all';
        const templates = MemeGenerator.listTemplates(category);
        
        let message = `🎨 *PLANTILLAS DE MEMES*\n\n`;
        
        if (category === 'all') {
            const categories = MemeGenerator.getCategories();
            message += `📁 *Categorías disponibles:*\n`;
            for (const [key, name] of Object.entries(categories)) {
                if (key !== 'all') {
                    message += `• ${name}\n`;
                }
            }
            message += `\n💡 Usa: ${usedPrefix}memelist [categoría]\n\n`;
        }
        
        message += `📋 *Plantillas:*\n`;
        templates.slice(0, 20).forEach(([key, template]) => {
            message += `\n*${key}* - ${template.name}\n`;
            message += `   Textos: ${template.boxes} | ${template.description}\n`;
        });
        
        message += `\n📝 *Uso:*\n`;
        message += `${usedPrefix}meme ${templates[0][0]} | texto1 | texto2\n\n`;
        message += `💡 Total: ${templates.length} plantillas`;
        
        return m.reply(message);
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // │                      BUSCAR PLANTILLAS                              │
    // ═══════════════════════════════════════════════════════════════════════
    
    if (command === 'memesearch') {
        if (!text) {
            return m.reply(`❌ Uso: ${usedPrefix}memesearch [término]\nEjemplo: ${usedPrefix}memesearch drake`);
        }
        
        const results = MemeGenerator.searchTemplates(text);
        
        if (results.length === 0) {
            return m.reply('❌ No se encontraron plantillas con ese término.');
        }
        
        let message = `🔍 *RESULTADOS: "${text}"*\n\n`;
        
        results.slice(0, 10).forEach(([key, template]) => {
            message += `*${key}* - ${template.name}\n`;
            message += `   ${template.description}\n\n`;
        });
        
        message += `📝 Usa: ${usedPrefix}meme ${results[0][0]} | texto1 | texto2`;
        
        return m.reply(message);
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // │                      GENERAR MEME                                   │
    // ═══════════════════════════════════════════════════════════════════════
    
    if (command === 'meme' || command === 'makememe') {
        if (!text) {
            return m.reply(`
❌ *Uso incorrecto*

📝 *Formato:*
${usedPrefix}meme [plantilla] | texto1 | texto2 | ...

📌 *Ejemplos:*
${usedPrefix}meme drake | Estudiar | Ver memes
${usedPrefix}meme stonks | Money
${usedPrefix}meme distracted | Yo | Dormir | Netflix

💡 Ver plantillas: ${usedPrefix}memelist
            `.trim());
        }
        
        // Parsear argumentos
        const parts = text.split('|').map(p => p.trim());
        const templateKey = parts[0].toLowerCase();
        const texts = parts.slice(1);
        
        // Verificar plantilla
        const template = MemeGenerator.getTemplate(templateKey);
        if (!template) {
            return m.reply(`❌ Plantilla "${templateKey}" no encontrada.\n\n💡 Usa ${usedPrefix}memelist para ver plantillas disponibles.`);
        }
        
        // Verificar número de textos
        if (texts.length !== template.boxes) {
            return m.reply(`❌ La plantilla "${template.name}" requiere ${template.boxes} textos.\n\n📝 Ejemplo: ${usedPrefix}meme ${templateKey}${' | texto'.repeat(template.boxes)}`);
        }
        
        // Generar
        m.reply('🎨 Generando meme...');
        
        try {
            const imageBuffer = await MemeGenerator.generate(
                templateKey,
                texts,
                userId
            );
            
            // Enviar como imagen
            await conn.sendFile(
                m.chat,
                imageBuffer,
                'meme.png',
                `✅ *Meme generado*\n\n📋 Plantilla: ${template.name}\n👤 Creado por: ${await conn.getName(userId)}`,
                m
            );
            
            // Preguntar si quiere sticker
            await m.reply(`💡 ¿Quieres convertirlo en sticker?\nUsa: ${usedPrefix}tomeme (responde al meme)`);
            
        } catch (error) {
            Logger.error('Error generating meme:', error);
            return m.reply(`❌ Error al generar meme: ${error.message}`);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // │                      MEME DESDE URL                                 │
    // ═══════════════════════════════════════════════════════════════════════
    
    if (command === 'memecustom') {
        if (!text) {
            return m.reply(`
❌ *Uso:*
${usedPrefix}memecustom [url] | texto1 | texto2

📌 *Ejemplo:*
${usedPrefix}memecustom https://i.imgur.com/abc.jpg | Arriba | Abajo
            `.trim());
        }
        
        const parts = text.split('|').map(p => p.trim());
        const imageUrl = parts[0];
        const texts = parts.slice(1);
        
        if (!imageUrl.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif)$/i)) {
            return m.reply('❌ URL de imagen inválida');
        }
        
        m.reply('🎨 Generando meme personalizado...');
        
        try {
            const imageBuffer = await MemeGenerator.generateFromUrl(
                imageUrl,
                texts,
                userId
            );
            
            await conn.sendFile(m.chat, imageBuffer, 'meme.png', '✅ Meme generado', m);
            
        } catch (error) {
            return m.reply(`❌ Error: ${error.message}`);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // │                      CONVERTIR A STICKER                            │
    // ═══════════════════════════════════════════════════════════════════════
    
    if (command === 'tomeme' || command === 'memes') {
        const q = m.quoted ? m.quoted : m;
        const mime = (q.msg || q).mimetype || '';
        
        if (!mime.startsWith('image/')) {
            return m.reply('❌ Responde a una imagen');
        }
        
        m.reply('🎨 Convirtiendo a sticker...');
        
        try {
            const img = await q.download();
            const stickerBuffer = await sticker(img, false, global.packname, global.author);
            
            await conn.sendFile(m.chat, stickerBuffer, 'sticker.webp', '', m, false, {
                asSticker: true
            });
            
        } catch (error) {
            return m.reply(`❌ Error: ${error.message}`);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // │                      GALERÍA - TOP MEMES                            │
    // ═══════════════════════════════════════════════════════════════════════
    
    if (command === 'memetop' || command === 'topmemes') {
        const limit = parseInt(args[0]) || 10;
        const topMemes = gallery.getTop(limit);
        
        if (topMemes.length === 0) {
            return m.reply('❌ No hay memes en la galería aún.');
        }
        
        let message = `🏆 *TOP ${limit} MEMES*\n\n`;
        
        topMemes.forEach((meme, index) => {
            message += `${index + 1}. *${meme.templateName}*\n`;
            message += `   👍 ${meme.votes.likes} | 👎 ${meme.votes.dislikes} | 👁️ ${meme.views}\n`;
            message += `   👤 ${meme.creator}\n`;
            message += `   🆔 \`${meme.id}\`\n\n`;
        });
        
        message += `💡 Ver meme: ${usedPrefix}memeview [id]`;
        
        return m.reply(message);
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // │                      GALERÍA - TRENDING                             │
    // ═══════════════════════════════════════════════════════════════════════
    
    if (command === 'memetrending') {
        const trending = gallery.getTrending(10);
        
        if (trending.length === 0) {
            return m.reply('❌ No hay memes trending aún.');
        }
        
        let message = `🔥 *MEMES TRENDING*\n\n`;
        
        trending.forEach((meme, index) => {
            message += `${index + 1}. ${meme.templateName}\n`;
            message += `   📈 Score: ${meme.getScore()} | 👁️ ${meme.views}\n`;
            message += `   🆔 \`${meme.id}\`\n\n`;
        });
        
        return m.reply(message);
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // │                      MIS MEMES                                      │
    // ═══════════════════════════════════════════════════════════════════════
    
    if (command === 'mymemes' || command === 'mismemes') {
        const userMemes = gallery.getByUser(userId);
        
        if (userMemes.length === 0) {
            return m.reply('❌ No has creado memes aún.');
        }
        
        let message = `🎨 *TUS MEMES* (${userMemes.length})\n\n`;
        
        userMemes.slice(0, 10).forEach((meme, index) => {
            message += `${index + 1}. ${meme.templateName}\n`;
            message += `   👍 ${meme.votes.likes} | 👎 ${meme.votes.dislikes}\n`;
            message += `   🆔 \`${meme.id}\`\n\n`;
        });
        
        return m.reply(message);
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // │                      VOTAR MEME                                     │
    // ═══════════════════════════════════════════════════════════════════════
    
    if (command === 'memelike' || command === 'memedislike') {
        const memeId = args[0];
        
        if (!memeId) {
            return m.reply(`❌ Uso: ${usedPrefix}${command} [id]`);
        }
        
        const meme = gallery.get(memeId);
        if (!meme) {
            return m.reply('❌ Meme no encontrado');
        }
        
        const voteType = command === 'memelike' ? 'like' : 'dislike';
        
        try {
            meme.vote(userId, voteType);
            gallery.save();
            
            const emoji = voteType === 'like' ? '👍' : '👎';
            return m.reply(`${emoji} Voto registrado\n\n📊 Score: ${meme.getScore()}\n👍 ${meme.votes.likes} | 👎 ${meme.votes.dislikes}`);
            
        } catch (error) {
            return m.reply(`❌ Error: ${error.message}`);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // │                      ESTADÍSTICAS                                   │
    // ═══════════════════════════════════════════════════════════════════════
    
    if (command === 'memestats') {
        const stats = gallery.getStats();
        const cacheStats = cache.getStats();
        
        let message = `📊 *ESTADÍSTICAS DE MEMES*\n\n`;
        
        message += `📚 *Galería:*\n`;
        message += `• Total memes: ${stats.total}\n`;
        message += `• Total likes: ${stats.totalLikes}\n`;
        message += `• Total dislikes: ${stats.totalDislikes}\n`;
        message += `• Total vistas: ${stats.totalViews}\n`;
        message += `• Total shares: ${stats.totalShares}\n\n`;
        
        if (stats.topMeme) {
            message += `🏆 *Top Meme:*\n`;
            message += `• ${stats.topMeme.templateName}\n`;
            message += `• Score: ${stats.topMeme.getScore()}\n`;
            message += `• ID: \`${stats.topMeme.id}\`\n\n`;
        }
        
        message += `💾 *Caché:*\n`;
        message += `• Hit rate: ${cacheStats.hitRate}\n`;
        message += `• Hits: ${cacheStats.hits}\n`;
        message += `• Misses: ${cacheStats.misses}`;
        
        return m.reply(message);
    }
};

handler.help = [
    'memelist', 'memesearch', 'meme', 'memecustom',
    'tomeme', 'memetop', 'memetrending', 'mymemes',
    'memelike', 'memedislike', 'memestats'
];
handler.tags = ['fun'];
handler.command = /^(memelist|memetemplates|memesearch|meme|makememe|memecustom|tomeme|memes|memetop|topmemes|memetrending|mymemes|mismemes|memelike|memedislike|memestats)$/i;

export default handler;
