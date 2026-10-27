// plugins/contributor-changelog.ts — generado a partir de dev-tests (comandos de ejemplo por rol)
import type { PluginHandler } from '../types/index.js'

const handler: PluginHandler = async (m, { conn, text }) => {
  if (!text) {
    return m.reply(`📝 *CREAR CHANGELOG* 𒁈\n\n💡 Uso: .changelog <descripción>\n📌 Ejemplo: .changelog Agregado sistema de clanes mejorado`)
  }
  
  // Guardar en base de datos de changelogs
  global.db.data.changelogs = global.db.data.changelogs || []
  
  let changelog = {
    id: Date.now(),
    author: m.sender,
    authorName: conn.getName(m.sender),
    description: text,
    timestamp: Date.now(),
    version: global.version || '6.5.0'
  }
  
  global.db.data.changelogs.push(changelog)
  
  let changelogText = `📝 *CHANGELOG AGREGADO* 𒁈\n\n`
  changelogText += `🆔 ID: ${changelog.id}\n`
  changelogText += `✍️ Autor: @${m.sender.split('@')[0]}\n`
  changelogText += `📅 Fecha: ${new Date().toLocaleDateString('es-ES')}\n`
  changelogText += `🔖 Versión: ${changelog.version}\n\n`
  changelogText += `📋 Descripción:\n${text}\n\n`
  changelogText += `✅ Changelog guardado exitosamente`
  
  conn.sendMessage(m.chat, { text: changelogText, mentions: [m.sender] }, { quoted: m })
  
  // Notificar a owners
  for (let [jid] of global.owner.filter(([_, __, isDev]) => isDev)) {
    let ownerJid = jid + '@s.whatsapp.net'
    conn.sendMessage(ownerJid, { 
      text: `📝 Nuevo changelog por contributor:\n\n${text}\n\n👤 Por: @${m.sender.split('@')[0]}`,
      mentions: [m.sender]
    })
  }
}

handler.help = ['changelog']
handler.tags = ['contributor']
handler.command = /^changelog$/i
handler.contributor = true  // Solo contributors

export default handler
