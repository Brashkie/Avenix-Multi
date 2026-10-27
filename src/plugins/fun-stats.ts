/**
 * Plugin: Estadísticas del Chat
 * Comando: .stats, .estadisticas
 * Categoría: info
 */

import chatStats from '../lib/chat-stats.js';
import type { PluginHandler } from '../types/index.js'

const handler: PluginHandler = async (m, { conn, text, command, usedPrefix, isAdmin }) => {
    try {
        const args = text.trim().split(/\s+/);
        const subcommand = args[0]?.toLowerCase();
        
        // ═════════════════════════════════════════════════════════════════════
        // │                      ESTADÍSTICAS GLOBALES                        │
        // ═════════════════════════════════════════════════════════════════════
        
        if (!subcommand || subcommand === 'global') {
            const stats = chatStats.getGlobalStats();
            const topUsers = chatStats.getTopUsers(10);
            const topChats = chatStats.getTopChats(5);
            
            let message = `╭━━━━━━━━━━━━━━━━━━━━╮
┃ 📊 *ESTADÍSTICAS GLOBALES* 
╰━━━━━━━━━━━━━━━━━━━━╯

*📈 GENERAL*
▢ Total mensajes: ${stats.totalMessages.toLocaleString()}
▢ Total usuarios: ${stats.totalUsers.toLocaleString()}
▢ Total chats: ${stats.totalChats.toLocaleString()}
▢ Comandos ejecutados: ${stats.totalCommands.toLocaleString()}
▢ Mensajes multimedia: ${stats.totalMediaMessages.toLocaleString()}

*📊 PROMEDIOS*
▢ Mensajes/día: ${stats.averageMessagesPerDay}
▢ Palabras únicas: ${stats.totalUniqueWords.toLocaleString()}
▢ Emojis únicos: ${stats.totalUniqueEmojis}

*🏆 TOP USUARIOS*
${topUsers.slice(0, 5).map((user, i) => 
    `${i + 1}. @${user.id.split('@')[0]} - ${user.totalMessages} msg`
).join('\n')}

*💬 TOP CHATS*
${topChats.map((chat, i) => 
    `${i + 1}. ${chat.name || 'Chat'} - ${chat.totalMessages} msg`
).join('\n')}

*⏱️ UPTIME*
▢ Desde: ${new Date(stats.startDate).toLocaleDateString('es-ES')}
▢ Tiempo: ${formatDuration(stats.uptime)}

𒁈 *Avenix-Multi Stats* 𒁈`;

            const mentions = topUsers.slice(0, 5).map(u => u.id);
            return conn.reply(m.chat, message, m, { mentions });
        }
        
        // ═════════════════════════════════════════════════════════════════════
        // │                      ESTADÍSTICAS DEL CHAT                        │
        // ═════════════════════════════════════════════════════════════════════
        
        if (subcommand === 'chat' || subcommand === 'grupo') {
            if (!m.isGroup) {
                return m.reply('⚠️ Este comando solo funciona en grupos');
            }
            
            const stats = chatStats.getChatStats(m.chat);
            
            if (!stats) {
                return m.reply('⚠️ No hay estadísticas disponibles para este chat');
            }
            
            let message = `╭━━━━━━━━━━━━━━━━━━━━╮
┃ 📊 *ESTADÍSTICAS DEL GRUPO* 
╰━━━━━━━━━━━━━━━━━━━━╯

*📝 GRUPO: ${stats.name}*

*📈 ACTIVIDAD*
▢ Total mensajes: ${stats.totalMessages.toLocaleString()}
▢ Usuarios activos: ${stats.uniqueUsers}
▢ Promedio longitud: ${Math.round(stats.averageMessageLength)} caracteres
▢ Última semana: ${stats.messagesLastWeek} mensajes
▢ Último mes: ${stats.messagesLastMonth} mensajes
▢ Crecimiento: ${stats.growthRate}%

*⏰ PICOS DE ACTIVIDAD*
▢ Hora más activa: ${stats.activityPeakHour.hour}:00 (${stats.activityPeakHour.messages} msg)
▢ Día más activo: ${stats.activityPeakDay.day} (${stats.activityPeakDay.messages} msg)

*🏆 TOP 5 USUARIOS MÁS ACTIVOS*
${stats.topUsers.slice(0, 5).map((user, i) => 
    `${i + 1}. @${user.id.split('@')[0]} - ${user.messages} msg`
).join('\n')}

*💬 TOP 5 PALABRAS*
${stats.topWords.slice(0, 5).map((w, i) => 
    `${i + 1}. ${w.item} (${w.count}x)`
).join('\n')}

*😀 TOP 5 EMOJIS*
${stats.topEmojis.slice(0, 5).map((e, i) => 
    `${i + 1}. ${e.item} (${e.count}x)`
).join('\n')}

*⚙️ TOP 5 COMANDOS*
${stats.topCommands.slice(0, 5).map((c, i) => 
    `${i + 1}. ${c.item} (${c.count}x)`
).join('\n')}

*📱 MULTIMEDIA*
▢ Imágenes: ${stats.mediaTypes.images}
▢ Videos: ${stats.mediaTypes.videos}
▢ Audios: ${stats.mediaTypes.audios}
▢ Stickers: ${stats.mediaTypes.stickers}
▢ Documentos: ${stats.mediaTypes.documents}

*📅 FECHAS*
▢ Primer mensaje: ${new Date(stats.firstMessageDate).toLocaleDateString('es-ES')}
▢ Último mensaje: ${new Date(stats.lastMessageDate).toLocaleDateString('es-ES')}

𒁈 *Usa ${usedPrefix}stats graph para ver gráficos* 𒁈`;

            const mentions = stats.topUsers.slice(0, 5).map(u => u.id);
            return conn.reply(m.chat, message, m, { mentions });
        }
        
        // ═════════════════════════════════════════════════════════════════════
        // │                      GRÁFICOS DE ACTIVIDAD                        │
        // ═════════════════════════════════════════════════════════════════════
        
        if (subcommand === 'graph' || subcommand === 'grafico') {
            if (!m.isGroup) {
                return m.reply('⚠️ Este comando solo funciona en grupos');
            }
            
            const stats = chatStats.getChatStats(m.chat);
            
            if (!stats) {
                return m.reply('⚠️ No hay estadísticas disponibles');
            }
            
            const hourlyGraph = chatStats.generateActivityGraph(
                stats.hourlyActivity, 
                '📊 ACTIVIDAD POR HORA'
            );
            
            const dailyGraph = chatStats.generateActivityGraph(
                stats.dailyActivity, 
                '📊 ACTIVIDAD POR DÍA'
            );
            
            let message = `╭━━━━━━━━━━━━━━━━━━━━╮
┃ 📈 *GRÁFICOS DE ACTIVIDAD* 
╰━━━━━━━━━━━━━━━━━━━━╯

\`\`\`${hourlyGraph}\`\`\`

\`\`\`${dailyGraph}\`\`\`

*📊 Interpretación:*
▢ Cada █ representa mensajes
▢ Más alto = más actividad
▢ D=Domingo, L=Lunes, etc.

𒁈 *Avenix-Multi Stats* 𒁈`;

            return m.reply(message);
        }
        
        // ═════════════════════════════════════════════════════════════════════
        // │                      ESTADÍSTICAS PERSONALES                      │
        // ═════════════════════════════════════════════════════════════════════
        
        if (subcommand === 'yo' || subcommand === 'me' || subcommand === 'perfil') {
            const stats = chatStats.getUserStats(m.sender);
            
            if (!stats) {
                return m.reply('⚠️ No tienes estadísticas todavía. ¡Empieza a chatear!');
            }
            
            let message = `╭━━━━━━━━━━━━━━━━━━━━╮
┃ 👤 *TUS ESTADÍSTICAS* 
╰━━━━━━━━━━━━━━━━━━━━╯

*📊 ACTIVIDAD*
▢ Total mensajes: ${stats.totalMessages.toLocaleString()}
▢ Comandos ejecutados: ${stats.totalCommands.toLocaleString()}
▢ Chats participados: ${stats.chatsParticipated}
▢ Promedio longitud: ${Math.round(stats.averageMessageLength)} caracteres
▢ Total caracteres: ${stats.totalCharacters.toLocaleString()}

*📈 PROMEDIO*
▢ Mensajes/día: ${stats.averageMessagesPerDay}
▢ Última semana: ${stats.messagesLastWeek} mensajes
▢ Último mes: ${stats.messagesLastMonth} mensajes

*⏰ ACTIVIDAD*
▢ Hora favorita: ${stats.activityPeakHour.hour}:00
▢ Día favorito: ${stats.activityPeakDay.day}

*💬 TU TOP 10 PALABRAS*
${stats.topWords.slice(0, 10).map((w, i) => 
    `${i + 1}. ${w.item} (${w.count}x)`
).join('\n')}

*😀 TUS EMOJIS FAVORITOS*
${stats.topEmojis.slice(0, 10).map((e, i) => 
    `${i + 1}. ${e.item} (${e.count}x)`
).join('\n')}

*📅 FECHAS*
▢ Primer mensaje: ${new Date(stats.firstMessageDate).toLocaleDateString('es-ES')}
▢ Último mensaje: ${new Date(stats.lastMessageDate).toLocaleDateString('es-ES')}

${stats.mostActiveChat ? `*🏆 CHAT MÁS ACTIVO*\n▢ ${stats.mostActiveChat.name} (${stats.mostActiveChat.messages} msg)` : ''}

𒁈 *Avenix-Multi Stats* 𒁈`;

            return m.reply(message);
        }
        
        // ═════════════════════════════════════════════════════════════════════
        // │                      EXPORTAR ESTADÍSTICAS                        │
        // ═════════════════════════════════════════════════════════════════════
        
        if (subcommand === 'export' || subcommand === 'exportar') {
            if (!isAdmin && !m.isGroup) {
                return m.reply('⚠️ Solo admins pueden exportar estadísticas del grupo');
            }
            
            await m.reply('⏳ Exportando estadísticas...');
            
            const report = m.isGroup
                ? chatStats.exportReport(m.chat)
                : chatStats.exportReport(null, m.sender);

            await conn.sendMessage(m.chat, {
                document: report.buffer,
                fileName: report.fileName,
                mimetype: 'text/plain'
            }, { quoted: m as any });
            
            return m.reply('✅ Estadísticas exportadas exitosamente');
        }
        
        // ═════════════════════════════════════════════════════════════════════
        // │                      RANKING GLOBAL                               │
        // ═════════════════════════════════════════════════════════════════════
        
        if (subcommand === 'top' || subcommand === 'ranking') {
            const topUsers = chatStats.getTopUsers(20);
            
            let message = `╭━━━━━━━━━━━━━━━━━━━━╮
┃ 🏆 *TOP 20 USUARIOS GLOBALES* 
╰━━━━━━━━━━━━━━━━━━━━╯

${topUsers.map((user, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
    return `${medal} @${user.id.split('@')[0]}
   📊 ${user.totalMessages} mensajes
   ⚙️ ${user.totalCommands} comandos
   💬 ${user.chatsParticipated} chats`;
}).join('\n\n')}

𒁈 *Avenix-Multi Stats* 𒁈`;

            const mentions = topUsers.map(u => u.id);
            return conn.reply(m.chat, message, m, { mentions });
        }
        
        // ═════════════════════════════════════════════════════════════════════
        // │                      AYUDA                                        │
        // ═════════════════════════════════════════════════════════════════════
        
        let helpMessage = `╭━━━━━━━━━━━━━━━━━━━━╮
┃ 📊 *COMANDOS DE ESTADÍSTICAS* 
╰━━━━━━━━━━━━━━━━━━━━╯

*📈 DISPONIBLES:*

▢ \`${usedPrefix}stats\` o \`${usedPrefix}stats global\`
   Ver estadísticas globales del bot

▢ \`${usedPrefix}stats chat\`
   Ver estadísticas del grupo actual

▢ \`${usedPrefix}stats graph\`
   Ver gráficos de actividad del grupo

▢ \`${usedPrefix}stats yo\`
   Ver tus estadísticas personales

▢ \`${usedPrefix}stats top\`
   Ver ranking global de usuarios

▢ \`${usedPrefix}stats export\`
   Exportar estadísticas (solo admin)

*💡 EJEMPLOS:*
▢ ${usedPrefix}stats
▢ ${usedPrefix}stats chat
▢ ${usedPrefix}stats yo

𒁈 *Avenix-Multi Stats* 𒁈`;

        return m.reply(helpMessage);
        
    } catch (error) {
        console.error('Error en stats:', error);
        return m.reply(`❌ Error: ${error.message}`);
    }
};

handler.help = ['stats', 'estadisticas', 'est'];
handler.tags = ['info'];
handler.command = /^(stats|estadisticas|est)$/i;
handler.register = false;

export default handler;

// Función auxiliar para formatear duración
function formatDuration(ms) {
    const days = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    
    const parts: any[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    
    return parts.join(' ') || '0m';
}
