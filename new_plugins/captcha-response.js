// plugins/captcha-response.js
import { captchaSystem } from '../lib/captcha.js';

let handler = async (m, { conn }) => {
    const userId = m.sender;
    
    // Solo si tiene CAPTCHA activo
    if (!captchaSystem.activeCaptchas.has(userId)) return;
    
    // Intentar verificar con el mensaje
    const result = captchaSystem.verifyCaptcha(userId, m.text);
    
    if (result.success) {
        // ✅ VERIFICADO
        await conn.reply(m.chat, result.message, m);
        
        // Quitar de pending
        const chat = global.db.data.chats[m.chat];
        if (chat.pendingVerification) {
            chat.pendingVerification = chat.pendingVerification.filter(u => u !== userId);
        }
        
        // Dar bienvenida
        await conn.reply(m.chat, `🎉 ¡Bienvenido al grupo @${userId.split('@')[0]}!`, m, {
            mentions: [userId]
        });
    } else {
        // ❌ INCORRECTO
        await conn.reply(m.chat, result.message, m);
        
        // Si agotó intentos, kickear
        if (result.maxAttemptsReached) {
            const chat = global.db.data.chats[m.chat];
            const isBotAdmin = // verificar si bot es admin
            
            if (isBotAdmin && chat.autoKickOnFail) {
                await conn.groupParticipantsUpdate(m.chat, [userId], 'remove');
                await conn.sendMessage(m.chat, {
                    text: `🚫 @${userId.split('@')[0]} fue removido por no verificarse.`,
                    mentions: [userId]
                });
            }
        }
    }
    
    return true; // Detener procesamiento de otros handlers
};

handler.before = true;
handler.priority = 10; // Alta prioridad

export default handler;
