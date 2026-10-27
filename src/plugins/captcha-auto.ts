// plugins/captcha-auto.ts
// Lanza un CAPTCHA automático a los miembros no verificados de grupos con `autoCaptcha` activo.
import { captchaSystem } from '../lib/captcha.js'
import type { PluginMeta } from '../types/index.js'

const plugin: PluginMeta = {
    async before(m, { conn, isAdmin, isBotAdmin }) {
        if (!m.isGroup || m.fromMe || isAdmin) return false

        const chat = global.db.data.chats[m.chat]
        if (!chat?.autoCaptcha) return false

        const userId = m.sender
        if (captchaSystem.isVerified(userId) || captchaSystem.activeCaptchas.has(userId)) return false

        const result = captchaSystem.createCaptcha(userId, {
            type: chat.captchaType || 'math',
            difficulty: chat.captchaDifficulty || 'medium'
        })
        if (!result.success || !result.captcha) return false

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
        })

        if (isBotAdmin) {
            chat.pendingVerification ||= []
            if (!chat.pendingVerification.includes(userId)) chat.pendingVerification.push(userId)
        }

        // El mensaje que disparó el CAPTCHA no es una respuesta: no debe evaluarse como intento.
        m.text = ''
        return true
    }
}

export default plugin
