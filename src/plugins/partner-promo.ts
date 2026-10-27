// plugins/partner-promo.ts — generado a partir de dev-tests (comandos de ejemplo por rol)
import type { PluginHandler } from '../types/index.js'

const handler: PluginHandler = async (m, { conn, text }) => {
  if (!text) {
    return m.reply(`🤝 *PROMOCIÓN DE PARTNER* 𒁈\n\n💡 Uso: .promo <mensaje>\n📌 Ejemplo: .promo Únete a nuestro servidor!`)
  }
  
  let promoText = `╭━━━━━━━━━━━━━━━━━━━━╮
┃ 🤝 *PARTNER OFICIAL* 𒁈
╰━━━━━━━━━━━━━━━━━━━━╯

${text}

━━━━━━━━━━━━━━━━
👤 Partner: @${m.sender.split('@')[0]}
✨ Este es un partner oficial verificado`

  // Enviar a grupos donde el bot es admin (opcional)
  conn.sendMessage(m.chat, { text: promoText, mentions: [m.sender] }, { quoted: m })
  
  m.reply(`✅ Promoción enviada exitosamente!`)
}

handler.help = ['promo']
handler.tags = ['partner']
handler.command = /^promo$/i
handler.partner = true  // Solo partners

export default handler
