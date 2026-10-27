// plugins/mod-clearwarns.ts — generado a partir de dev-tests (comandos de ejemplo por rol)
import type { PluginHandler } from '../types/index.js'

const handler: PluginHandler = async (m, { conn }) => {
  let target = m.mentionedJid && m.mentionedJid[0]
  
  if (!target) {
    return m.reply(`❌ Menciona al usuario.\n\n💡 Uso: .clearwarn @usuario`)
  }
  
  let user = global.db.data.users[target]
  
  if (!user) {
    return m.reply(`❌ Usuario no registrado.`)
  }
  
  if (user.warn === 0) {
    return m.reply(`⚠️ @${target.split('@')[0]} no tiene warns.`, null, { mentions: [target] })
  }
  
  let oldWarn = user.warn
  user.warn = 0
  
  let text = `✅ *WARNS LIMPIADOS* 𒁈\n\n`
  text += `👤 Usuario: @${target.split('@')[0]}\n`
  text += `⚠️ Warns removidos: ${oldWarn}\n`
  text += `👮 Moderador: @${m.sender.split('@')[0]}`
  
  conn.sendMessage(m.chat, { text, mentions: [target, m.sender] }, { quoted: m })
  
  // Notificar al usuario
  conn.sendMessage(target, { 
    text: `✅ Tus ${oldWarn} warn${oldWarn > 1 ? 's han' : ' ha'} sido limpiado${oldWarn > 1 ? 's' : ''} por un moderador.` 
  })
}

handler.help = ['clearwarn']
handler.tags = ['mod']
handler.command = /^clearwarns?$/i
handler.mods = true  // Solo moderadores

export default handler
