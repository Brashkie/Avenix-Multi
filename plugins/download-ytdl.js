/**
 * Plugin: YouTube Downloader
 * Archivo: plugins/download-ytdl.js
 * Avenix-Multi Bot
 * Creado por: Hepein Oficial
 */

import yts from 'yt-search';
import { youtubedl, youtubedlv2 } from '@bochilteam/scraper';

let handler = async (m, { conn, command, args, text, usedPrefix }) => {
    if (!text) {
        throw `🎵 *Ejemplo de uso:*\n${usedPrefix + command} Ozuna Criminal\n\n📌 *También puedes usar:*\n• ${usedPrefix}ytmp3 [url/búsqueda]\n• ${usedPrefix}ytmp4 [url/búsqueda]`;
    }
    
    let user = global.db.data.users[m.sender];
    let chat = global.db.data.chats[m.chat];
    
    // Cooldown de 3 segundos
    if (new Date - user.lastytdl < 3000) {
        throw `⏱️ Espera 3 segundos antes de usar este comando nuevamente`;
    }
    
    await m.reply(global.wait);
    user.lastytdl = new Date * 1;
    
    try {
        // Buscar video
        let results = await yts(text);
        let vid = results.videos[0];
        
        if (!vid) throw '❌ *Video no encontrado*\n\nIntenta con otra búsqueda o verifica el enlace.';
        
        let { title, description, thumbnail, timestamp, views, ago, url, author } = vid;
        
        // Limpiar título para nombre de archivo
        let cleanTitle = title.replace(/[^\w\s]/gi, '').substring(0, 60);
        
        let captvid = `🎵 *YOUTUBE DOWNLOADER*

📺 *Título:* ${title}
👤 *Canal:* ${author.name}
⏱️ *Duración:* ${timestamp}
👀 *Vistas:* ${views.toLocaleString('es-ES')}
📅 *Subido:* ${ago}
🔗 *Link:* ${url}

*Selecciona una opción:*
1️⃣ Audio MP3 (128kbps)
2️⃣ Video 720p
3️⃣ Video 480p
4️⃣ Video 360p

*Responde con el número (1-4)*`;

        let thumb = await (await fetch(thumbnail)).buffer();
        
        // Botones de descarga
        let buttons = [
            ['🎵 Audio', `.ytmp3 ${url}`],
            ['🎥 Video HD', `.ytmp4 ${url}`],
            ['📱 Video SD', `.ytmp4 ${url} 480`]
        ];
        
        let urls = [
            ['🔗 Ver en YouTube', url],
            ['📱 Canal', `https://youtube.com/c/${author.name.replace(/\s+/g, '')}`]
        ];
        
        await conn.sendButton(m.chat, captvid, 
            `⚡ ${global.namebot} - YouTube Downloader\n© Hepein Oficial`, 
            thumb, buttons, null, urls, m);
        
        // Sistema de respuesta por mensaje (backup)
        conn.ytdl = conn.ytdl || {};
        conn.ytdl[m.sender] = {
            chat: m.chat,
            url: url,
            title: cleanTitle,
            thumbnail: thumbnail,
            timestamp: Date.now()
        };
        
    } catch (e) {
        console.error('Error en YTDL:', e);
        let errorMsg = '❌ *Error al buscar el video*\n\n';
        
        if (e.toString().includes('Video unavailable')) {
            errorMsg += '📵 El video no está disponible en tu región o fue eliminado.';
        } else if (e.toString().includes('network')) {
            errorMsg += '🌐 Error de conexión. Intenta nuevamente.';
        } else {
            errorMsg += '⚠️ Error desconocido. Verifica el enlace o búsqueda.';
        }
        
        await m.reply(errorMsg);
    }
};

// Handler para respuestas numéricas
export const before = async function (m, { conn }) {
    if (m.isBaileys && m.fromMe) return true;
    if (!m.text) return true;
    
    if (conn.ytdl && conn.ytdl[m.sender]) {
        let data = conn.ytdl[m.sender];
        
        // Verificar timeout (2 minutos)
        if (Date.now() - data.timestamp > 120000) {
            delete conn.ytdl[m.sender];
            return true;
        }
        
        let choice = m.text.trim();
        if (!['1', '2', '3', '4'].includes(choice)) return true;
        
        await m.reply('⏳ *Descargando...*\n\nEsto puede tomar unos momentos dependiendo de la duración del video.');
        
        try {
            let quality, format, mimeType;
            
            switch(choice) {
                case '1':
                    quality = 'audio';
                    format = 'mp3';
                    mimeType = 'audio/mp4';
                    break;
                case '2':
                    quality = '720';
                    format = 'mp4';
                    mimeType = 'video/mp4';
                    break;
                case '3':
                    quality = '480';
                    format = 'mp4';
                    mimeType = 'video/mp4';
                    break;
                case '4':
                    quality = '360';
                    format = 'mp4';
                    mimeType = 'video/mp4';
                    break;
            }
            
            if (quality === 'audio') {
                // Descargar audio
                let yt = await youtubedl(data.url).catch(async () => await youtubedlv2(data.url));
                let dl_url = yt.audio['128kbps']?.download();
                
                if (!dl_url) throw 'No se pudo obtener el enlace de descarga de audio';
                
                let caption = `🎵 *AUDIO DESCARGADO*

📝 *Título:* ${data.title}
🎵 *Calidad:* 128kbps
📁 *Formato:* MP3
📊 *Tamaño:* ${yt.audio['128kbps']?.fileSize || 'Desconocido'}
⚡ *Bot:* ${global.namebot}
👨‍💻 *Creador:* ${global.author}`;

                await conn.sendMessage(m.chat, {
                    audio: { url: dl_url },
                    fileName: `${data.title}.mp3`,
                    mimetype: mimeType,
                    caption: caption
                }, { quoted: m });
                
            } else {
                // Descargar video
                let yt = await youtubedl(data.url).catch(async () => await youtubedlv2(data.url));
                let dl_url = yt.video[quality + 'p']?.download();
                
                if (!dl_url) {
                    // Intentar con calidad más baja si no está disponible
                    dl_url = yt.video['480p']?.download() || yt.video['360p']?.download();
                    quality = dl_url ? (yt.video['480p'] ? '480' : '360') : null;
                }
                
                if (!dl_url) throw 'No se pudo obtener el enlace de descarga de video';
                
                let caption = `🎥 *VIDEO DESCARGADO*

📝 *Título:* ${data.title}
🎥 *Calidad:* ${quality}p
📁 *Formato:* MP4
📊 *Tamaño:* ${yt.video[quality + 'p']?.fileSize || 'Desconocido'}
⚡ *Bot:* ${global.namebot}
👨‍💻 *Creador:* ${global.author}`;

                await conn.sendMessage(m.chat, {
                    video: { url: dl_url },
                    fileName: `${data.title}.mp4`,
                    mimetype: mimeType,
                    caption: caption
                }, { quoted: m });
            }
            
            delete conn.ytdl[m.sender];
            
        } catch (e) {
            console.error('Error descargando:', e);
            let errorMsg = '❌ *Error al descargar*\n\n';
            
            if (e.toString().includes('File too large')) {
                errorMsg += '📁 El archivo es demasiado grande. Intenta con menor calidad.';
            } else if (e.toString().includes('unavailable')) {
                errorMsg += '📵 Contenido no disponible para descarga.';
            } else {
                errorMsg += '⚠️ Error en el servidor. Intenta más tarde o con otro video.';
            }
            
            await m.reply(errorMsg);
            delete conn.ytdl[m.sender];
        }
        
        return true;
    }
    
    return true;
};

handler.help = ['ytdl', 'youtube', 'yt'];
handler.tags = ['downloader'];
handler.command = /^(ytdl|youtube|yt)$/i;
handler.limit = 2;
handler.register = true;

export default handler;
