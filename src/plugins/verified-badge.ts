// plugins/verified-badge.ts — generado a partir de dev-tests (comandos de ejemplo por rol)
import type { PluginHandler } from '../types/index.js'

const handler: PluginHandler = async (m, { conn }) => {
  let user = global.db.data.users[m.sender]
  
  let text = `✅ *BADGE DE VERIFICACIÓN* 𒁈\n\n`
  text += `Eres un usuario verificado!\n\n`
  text += `🎯 Beneficios:\n`
  text += `• Badge ✅ en perfil\n`
  text += `• Mayor confianza en trades\n`
  text += `• Menos restricciones anti-spam\n`
  text += `• Acceso a comandos especiales\n`
  text += `• +35 límite de comandos diarios\n\n`
  text += `📊 Tu estado:\n`
  text += `• Verificado desde: ${new Date(user.verifiedSince || Date.now()).toLocaleDateString('es-ES')}\n`
  text += `• Reputación: ${user.reputation || 0}\n`
  text += `• Nivel: ${user.level}`
  
  m.reply(text)
}

handler.help = ['mybadge']
handler.tags = ['info']
handler.command = /^mybadge$/i
handler.verified = true  // Solo verified

export default handler
