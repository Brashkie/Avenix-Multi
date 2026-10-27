// plugins/vip-boost.ts — generado a partir de dev-tests (comandos de ejemplo por rol)
import type { PluginHandler } from '../types/index.js'

const handler: PluginHandler = async (m, { conn }) => {
  let user = global.db.data.users[m.sender]
  
  // Boost de 1 hora (1 vez al día)
  let cooldown = 86400000 // 24 horas
  let lastBoost = user.lastVipBoost || 0
  
  if (Date.now() - lastBoost < cooldown) {
    let remaining = cooldown - (Date.now() - lastBoost)
    let hours = Math.floor(remaining / 3600000)
    return m.reply(`⏱️ Ya usaste tu boost VIP.\n\n⏳ Vuelve en: ${hours} horas`)
  }
  
  // Aplicar boost temporal
  user.boostActive = true
  user.boostExpires = Date.now() + 3600000 // 1 hora
  user.lastVipBoost = Date.now()
  
  let text = `⭐ *VIP BOOST ACTIVADO* 𒁈\n\n`
  text += `Beneficios por 1 hora:\n\n`
  text += `✨ EXP x2\n`
  text += `✨ Money x2\n`
  text += `✨ Drop rates x1.5\n\n`
  text += `⏰ Duración: 1 hora\n`
  text += `📅 Expira: ${new Date(user.boostExpires).toLocaleTimeString('es-ES')}`
  
  m.reply(text)
}

handler.help = ['vipboost']
handler.tags = ['vip']
handler.command = /^vipboost$/i
handler.vip = true  // Solo VIP

export default handler
