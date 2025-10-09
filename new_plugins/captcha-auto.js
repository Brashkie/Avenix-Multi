// plugins/captcha-auto.js
import { captchaSystem } from '../lib/captcha.js';

let handler = async (m, { conn, participants, isAdmin, isBotAdmin }) => {
    // Solo en grupos
    if (!m.isGroup) return;
    
    const chat = global.db.data.chats[m.chat];
    
    // Verificar si el grupo tiene captcha activado
    if (!chat.autoCaptcha) return;
    
    // No aplicar a admins
    if (isAdmin) return;
    
    const userId = m.sender;
    
    // Verificar si ya está verificado
    if (captchaSystem.isVerified(userId)) return;
    
    // Verificar si ya tiene un CAPTCHA activo
    if (captchaSystem.activeCaptchas.has(userId)) return;
    
    // Crear CAPTCHA automático
    const result = captchaSystem.createCaptcha(userId, {
        type: chat.captchaType || 'math',
        difficulty: chat.captchaDifficulty || 'medium'
    });
    
    if (result.success && result.captcha) {
        await conn.sendMessage(m.chat, {
            text: `
⚠️ *VERIFICACIÓN REQUERIDA* ⚠️

@${userId.split('@')[0]}, debes verificarte para poder hablar en este grupo.

${result.captcha.question}

⏰ Tiempo límite: ${result.captcha.timeout}s
🔄 Intentos: ${result.captcha.attempts}

📝 Responde directamente con tu respuesta.
            `.trim(),
            mentions: [userId]
        });
        
        // Mutear usuario temporalmente
        if (isBotAdmin) {
            // Guardar que está en proceso de verificación
            chat.pendingVerification = chat.pendingVerification || [];
            if (!chat.pendingVerification.includes(userId)) {
                chat.pendingVerification.push(userId);
            }
        }
    }
};

handler.group = true;
handler.before = true;

export default handler;
