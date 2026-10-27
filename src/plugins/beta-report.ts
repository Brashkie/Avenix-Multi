// plugins/beta-report.ts — generado a partir de dev-tests (comandos de ejemplo por rol)
import type { PluginHandler } from '../types/index.js'

const handler: PluginHandler = async (m, { conn, text }) => {
  if (!text) {
    return m.reply(`🧪 *REPORTAR BUG BETA* 𒁈\n\n💡 Uso: .reportbug <descripción>\n📌 Ejemplo: .reportbug El comando .duel no funciona en grupos`)
  }
  
  // Guardar en base de datos de bugs
  global.db.data.bugs = global.db.data.bugs || []
  
  let bug = {
    id: Date.now(),
    reporter: m.sender,
    reporterName: conn.getName(m.sender),
    description: text,
    timestamp: Date.now(),
    status: 'open',
    priority: 'normal'
  }
  
  global.db.data.bugs.push(bug)
  
  let bugText = `🐛 *BUG REPORTADO* 𒁈\n\n`
  bugText += `🆔 ID: #${bug.id}\n`
  bugText += `👤 Reporter: @${m.sender.split('@')[0]}\n`
  bugText += `📅 Fecha: ${new Date().toLocaleDateString('es-ES')}\n`
  bugText += `📊 Estado: Abierto\n\n`
  bugText += `📋 Descripción:\n${text}\n\n`
  bugText += `✅ Bug reportado. Los developers lo revisarán pronto.\n`
  bugText += `🎁 Recompensa: +50 money`
  
  // Dar recompensa por reportar
  global.db.data.users[m.sender].money += 50
  
  conn.sendMessage(m.chat, { text: bugText, mentions: [m.sender] }, { quoted: m })
  
  // Notificar a developers
  for (let dev of (global.devs || [])) {
    let devJid = dev + '@s.whatsapp.net'
    conn.sendMessage(devJid, { 
      text: `🐛 Nuevo bug reportado:\n\n${text}\n\n👤 Por: @${m.sender.split('@')[0]}\n🆔 Bug ID: #${bug.id}`,
      mentions: [m.sender]
    })
  }
}

handler.help = ['reportbug']
handler.tags = ['beta']
handler.command = /^reportbug$/i
handler.betaTester = true  // Solo beta testers

export default handler
