// plugins/influencer-announce.ts — generado a partir de dev-tests (comandos de ejemplo por rol)
import type { PluginHandler } from '../types/index.js'

const handler: PluginHandler = async (m, { conn, text }) => {
  if (!text) {
    return m.reply(`🌟 *ANUNCIO DE INFLUENCER* 𒁈\n\n💡 Uso: .anuncio <mensaje>\n📌 Ejemplo: .anuncio Nuevo video en mi canal!`)
  }
  
  let announceText = `╭━━━━━━━━━━━━━━━━━━━━╮
┃ 🌟 *INFLUENCER OFICIAL* 𒁈
╰━━━━━━━━━━━━━━━━━━━━╯

📢 *ANUNCIO*

${text}

━━━━━━━━━━━━━━━━
✨ Influencer: @${m.sender.split('@')[0]}
✅ Verificado oficialmente`

  conn.sendMessage(m.chat, { text: announceText, mentions: [m.sender] }, { quoted: m })
  
  // Dar recompensa por actividad
  let user = global.db.data.users[m.sender]
  user.money += 1000
  
  m.reply(`✅ Anuncio publicado!\n\n💰 Bonus: +1000 money por actividad`)
}

handler.help = ['anuncio']
handler.tags = ['influencer']
handler.command = /^anuncios?$/i
handler.influencer = true  // Solo influencers

export default handler
