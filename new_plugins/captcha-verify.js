// plugins/captcha-verify.js
import { captchaSystem } from '../lib/captcha.js';

let handler = async (m, { conn, command, text }) => {
    const userId = m.sender;
    
    if (command === 'verificar' || command === 'captcha') {
        // Crear CAPTCHA
        const result = captchaSystem.createCaptcha(userId, {
            type: 'math',  // o 'text', 'emoji', 'pattern', 'order', 'quiz'
            difficulty: 'medium'  // o 'easy', 'hard', 'extreme'
        });
        
        if (!result.success) {
            return m.reply(result.message);
        }
        
        if (result.autoVerified || result.alreadyVerified) {
            return m.reply(result.message);
        }
        
        const captcha = result.captcha;
        
        await m.reply(`
🔐 *VERIFICACIÓN REQUERIDA* 🔐

${captcha.question}

⏰ Tiempo límite: ${captcha.timeout}s
🔄 Intentos disponibles: ${captcha.attempts}

📝 *Responde con:* .responder [tu respuesta]
📌 *Ejemplo:* .responder 42
        `.trim());
    }
    
    if (command === 'responder' || command === 'resp') {
        if (!text) {
            return m.reply('❌ Debes proporcionar una respuesta.\n\n*Ejemplo:* .responder 42');
        }
        
        const result = captchaSystem.verifyCaptcha(userId, text);
        
        if (result.verified) {
            await conn.reply(m.chat, result.message, m);
            
            // Dar rol de verificado, etc
            // ...
        } else {
            await conn.reply(m.chat, result.message, m);
        }
    }
};

handler.help = ['verificar', 'captcha', 'responder'];
handler.tags = ['main'];
handler.command = /^(verificar|captcha|responder|resp)$/i;

export default handler;
