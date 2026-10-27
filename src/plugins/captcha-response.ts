// plugins/captcha-response.ts
// Evalúa la respuesta de un usuario con CAPTCHA activo.
import { captchaSystem } from '../lib/captcha.js'
import type { PluginMeta } from '../types/index.js'

const plugin: PluginMeta = {
    async before(m, { conn, isBotAdmin }) {
        const userId = m.sender
        if (!m.text || !captchaSystem.activeCaptchas.has(userId)) return false

        const result = captchaSystem.verifyCaptcha(userId, m.text)
        await conn.reply(m.chat, result.message, m)

        if (result.success) {
            const chat = global.db.data.chats[m.chat]
            if (chat?.pendingVerification) {
                chat.pendingVerification = chat.pendingVerification.filter((u: string) => u !== userId)
            }
            if (m.isGroup) {
                await conn.reply(m.chat, `🎉 ¡Bienvenido al grupo @${userId.split('@')[0]}!`, m, {
                    mentions: [userId]
                })
            }
            return true
        }

        if (result.maxAttemptsReached && m.isGroup) {
            const chat = global.db.data.chats[m.chat]
            if (isBotAdmin && chat?.autoKickOnFail) {
                await conn.groupParticipantsUpdate(m.chat, [userId], 'remove')
                await conn.sendMessage(m.chat, {
                    text: `🚫 @${userId.split('@')[0]} fue removido por no verificarse.`,
                    mentions: [userId]
                })
            }
        }

        return true
    }
}

export default plugin
