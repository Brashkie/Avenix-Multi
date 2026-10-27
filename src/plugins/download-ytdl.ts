/**
 * Plugin: YouTube Downloader
 * Archivo: plugins/download-ytdl.js
 * Avenix-Multi Bot
 * Creado por: Hepein Oficial
 */

import yts from 'yt-search';
import downloader from '../lib/download.js';
import type { PluginHandler } from '../types/index.js'

const handler: PluginHandler = async (m, { conn, command, args, text, usedPrefix }) => {
    if (!text) {
        throw `🎵 *Ejemplo de uso:*\n${usedPrefix + command} Ozuna Criminal\n\n📌 *También puedes usar:*\n• ${usedPrefix}ytmp3 [url/búsqueda]\n• ${usedPrefix}ytmp4 [url/búsqueda]`;
    }
    
    let user = global.db.data.users[m.sender];
    let chat = global.db.data.chats[m.chat];
    
    // Cooldown de 3 segundos
    if (Date.now() - (user.lastytdl || 0) < 3000) {
        throw `⏱️ Espera 3 segundos antes de usar este comando nuevamente`;
    }
    
    await m.reply(global.wait);
    user.lastytdl = Date.now();
    
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

        let thumb = thumbnail ? Buffer.from(await (await fetch(thumbnail)).arrayBuffer()) : null;
        
        // Botones de descarga
        let buttons: [string, string][] = [
            ['🎵 Audio', `.ytmp3 ${url}`],
            ['🎥 Video HD', `.ytmp4 ${url}`],
            ['📱 Video SD', `.ytmp4 ${url} 480`]
        ];
        
        let urls: [string, string][] = [
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

// Respuestas numéricas (1-4) al menú de descarga. Devuelve true solo si consumió el mensaje.
const QUALITY_CHOICES = {
    '1': { audioOnly: true, quality: 'medium', label: '128kbps' },
    '2': { audioOnly: false, quality: 'medium', label: '720p' },
    '3': { audioOnly: false, quality: '480', label: '480p' },
    '4': { audioOnly: false, quality: 'low', label: '360p' }
} as const;

handler.before = async function (m, { conn }) {
    const data = conn.ytdl?.[m.sender];
    if (!data || m.fromMe || !m.text) return false;

    if (Date.now() - data.timestamp > 120000) {
        delete conn.ytdl![m.sender];
        return false;
    }

    const choice = QUALITY_CHOICES[m.text.trim() as keyof typeof QUALITY_CHOICES];
    if (!choice) return false;
    delete conn.ytdl![m.sender];

    await m.reply('⏳ *Descargando...*\n\nEsto puede tomar unos momentos dependiendo de la duración del video.');

    const result = await downloader.downloadYouTube(data.url, { audioOnly: choice.audioOnly, quality: choice.quality });
    if (!result.success) {
        const error = String(result.error || '');
        let errorMsg = '❌ *Error al descargar*\n\n';
        if (error.includes('muy grande')) errorMsg += '📁 El archivo es demasiado grande. Intenta con menor calidad.';
        else if (error.includes('muy largo')) errorMsg += '⏱️ El video es demasiado largo (máximo 10 minutos).';
        else if (error.includes('yt-dlp')) errorMsg += '⚙️ yt-dlp no está instalado en el servidor.';
        else errorMsg += '⚠️ Error en el servidor. Intenta más tarde o con otro video.';
        await m.reply(errorMsg);
        return true;
    }

    const caption = `${choice.audioOnly ? '🎵 *AUDIO DESCARGADO*' : '🎥 *VIDEO DESCARGADO*'}

📝 *Título:* ${data.title}
🎚️ *Calidad:* ${choice.label}
📁 *Formato:* ${result.format.toUpperCase()}
📊 *Tamaño:* ${(result.size / 1024 / 1024).toFixed(1)} MB
⚡ *Bot:* ${global.namebot}
👨‍💻 *Creador:* ${global.author}`;

    if (choice.audioOnly) {
        await conn.sendMessage(m.chat, { audio: result.buffer, fileName: `${data.title}.mp3`, mimetype: 'audio/mpeg' }, { quoted: m as any });
        await m.reply(caption);
    } else {
        await conn.sendMessage(m.chat, { video: result.buffer, fileName: `${data.title}.mp4`, mimetype: 'video/mp4', caption }, { quoted: m as any });
    }
    return true;
};

handler.help = ['ytdl', 'youtube', 'yt'];
handler.tags = ['downloader'];
handler.command = /^(ytdl|youtube|yt)$/i;
handler.limit = 2;
handler.register = true;

export default handler;
