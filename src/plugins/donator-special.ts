// plugins/donator-special.ts — generado a partir de dev-tests (comandos de ejemplo por rol)
import type { PluginHandler } from '../types/index.js'

const handler: PluginHandler = async (m, { conn }) => {
  let user = global.db.data.users[m.sender]
  
  // Recompensa especial para donadores (1 vez al día)
  let cooldown = 86400000 // 24 horas
  let lastClaim = user.lastDonatorClaim || 0
  
  if (Date.now() - lastClaim < cooldown) {
    let remaining = cooldown - (Date.now() - lastClaim)
    let hours = Math.floor(remaining / 3600000)
    let minutes = Math.floor((remaining % 3600000) / 60000)
    return m.reply(`⏱️ Ya reclamaste tu recompensa de donador.\n\n⏳ Vuelve en: ${hours}h ${minutes}m`)
  }
  
  // Recompensa especial
  let reward = {
    money: 5000,
    diamond: 10,
    exp: 1000
  }
  
  user.money += reward.money
  user.diamond += reward.diamond
  user.exp += reward.exp
  user.lastDonatorClaim = Date.now()
  
  let text = `💝 *RECOMPENSA DE DONADOR* 𒁈\n\n`
  text += `Gracias por apoyar el proyecto!\n\n`
  text += `🎁 Recompensas:\n`
  text += `• 💰 Money: +${reward.money}\n`
  text += `• 💎 Diamantes: +${reward.diamond}\n`
  text += `• ⭐ EXP: +${reward.exp}\n\n`
  text += `❤️ Tu apoyo mantiene el bot funcionando!`
  
  m.reply(text)
}

handler.help = ['donator']
handler.tags = ['donator']
handler.command = /^donat(or|e)$/i
handler.donator = true  // Solo donadores

export default handler
