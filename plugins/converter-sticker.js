/**
 * Plugin: Convertir a Sticker
 * Archivo: plugins/converter-sticker.js
 * Avenix-Multi Bot
 * Creado por: Hepein Oficial
 */

import { sticker } from '../lib/sticker.js';
import uploadFile from '../lib/uploadFile.js';
import uploadImage from '../lib/uploadImage.js';
import { webp2png } from '../lib/webp2mp4.js';

let handler = async (m, { conn, args, usedPrefix, command }) => {
    let stiker = false;
    let user = global.db.data.users[m.sender];
    
    // Cooldown de 3 segundos
    if (new Date - user.laststicker < 3000) {
        throw `⏱️ Espera 3 segundos antes de crear otro sticker`;
    }
    
    try {
        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || q.mediaType || '';
        
        // Verificar si es media válida
        if (!(/webp|image|video/g.test(mime))) {
            throw `⚠️ *Responde a una imagen, video o GIF*\n\n*Formatos soportados:*\n• Imagen: JPG, PNG, WEBP\n• Video: MP4, GIF (máximo 10 segundos)\n• Sticker: WEBP\n\n*Ejemplo:* ${usedPrefix + command}`;
        }
        
        // Verificar duración del video
        if (/video/g.test(mime)) {
            if ((q.msg || q).seconds > 10) {
                throw '⚠️ *El video no puede durar más de 10 segundos*\n\nIntenta con un video más corto o córtalo antes de enviarlo.';
            }
        }
        
        let img = await q.download?.();
        if (!img) {
            throw '⚠️ *No se pudo descargar el archivo*\n\nIntenta enviar el archivo nuevamente o verifica que no esté dañado.';
        }
        
        user.laststicker = new Date * 1;
        await m.reply('🎭 *Creando sticker...*\n\nEsto puede tomar unos segundos.');
        
        let out;
        try {
            // Verificar argumentos para crop
            if (args[0] && (args[0] === 'no-crop' || args[0] === 'nocrop' || args[0] === 'full')) {
                stiker = await sticker(img, false, global.packname, global.author);
            } else {
                // Con crop por defecto
                stiker = await sticker(img, false, global.packname, global.author);
            }
        } catch (stickerError) {
            console.log('Error creando sticker, intentando métodos alternativos:', stickerError);
            
            // Método alternativo
            try {
                if (/webp/g.test(mime)) {
                    out = await webp2png(img);
                } else if (/image/g.test(mime)) {
                    out = await uploadImage(img);
                } else if (/video/g.test(mime)) {
                    out = await uploadFile(img);
                }
                
                if (typeof out !== 'string') out = await uploadFile(img);
                stiker = await sticker(false, out, global.packname, global.author);
            } catch (altError) {
                console.error('Error en método alternativo:', altError);
                throw '❌ Error al procesar el archivo para sticker';
            }
        }
        
    } catch (e) {
        console.error('Error en handler sticker:', e);
        if (!stiker) {
            let errorMsg = '';
            
            if (e.toString().includes('seconds')) {
                errorMsg = '⚠️ *Video demasiado largo*\n\nLos videos deben durar máximo 10 segundos.';
            } else if (e.toString().includes('size')) {
                errorMsg = '⚠️ *Archivo demasiado grande*\n\nIntenta con una imagen o video más pequeño.';
            } else if (e.toString().includes('format') || e.toString().includes('mime')) {
                errorMsg = '⚠️ *Formato no soportado*\n\nEnvía una imagen JPG/PNG o video MP4/GIF.';
            } else if (typeof e === 'string') {
                errorMsg = e;
            } else {
                errorMsg = '⚠️ *Error al convertir a sticker*\n\n*Asegúrate de responder a:*\n• Una imagen (JPG, PNG, WEBP)\n• Un video corto (MP4, GIF - máximo 10 segundos)\n• Un sticker existente\n\n*Tips:*\n• Usa `' + usedPrefix + command + ' nocrop` para sticker completo\n• Verifica que el archivo no esté dañado\n• Intenta con un archivo más pequeño';
            }
            
            throw errorMsg;
        }
    }
    
    if (stiker) {
        // Información del sticker
        let stickerInfo = {
            packname: global.packname || 'Avenix-Multi',
            author: global.author || 'Hepein Oficial',
            type: /video/g.test(mime) ? 'Animado' : 'Estático',
            size: Buffer.byteLength(stiker)
        };
        
        let caption = `🎭 *STICKER CREADO*

📦 *Pack:* ${stickerInfo.packname}
👨‍💻 *Autor:* ${stickerInfo.author}
🎬 *Tipo:* ${stickerInfo.type}
📊 *Tamaño:* ${(stickerInfo.size / 1024).toFixed(1)} KB

✨ *Tip:* Usa \`${usedPrefix + command} nocrop\` para sticker sin recorte`;
        
        await conn.sendFile(m.chat, stiker, 'sticker.webp', '', m, null, { 
            asSticker: true,
            contextInfo: {
                externalAdReply: {
                    title: 'Sticker Creado ✅',
                    body: `Por ${global.author}`,
                    thumbnailUrl: global.imagen1 || './media/thumbnail.jpg',
                    sourceUrl: global.github || 'https://github.com/hepeinoficial/avenix-multi',
                    mediaType: 1
                }
            }
        });
        
        // Enviar información (opcional, descomenta si quieres)
        // await conn.reply(m.chat, caption, m);
        
    } else {
        throw '⚠️ *Error al procesar el archivo*\n\nEl archivo podría estar dañado o en un formato no compatible.';
    }
};

handler.help = ['sticker', 's', 'stiker'];
handler.tags = ['converter'];
handler.command = /^(s|sticker|stiker)$/i;
handler.limit = 1;
handler.register = true;

export default handler;
