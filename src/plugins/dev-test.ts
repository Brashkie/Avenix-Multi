// plugins/dev-test.ts — generado a partir de dev-tests (comandos de ejemplo por rol)
import type { PluginHandler } from '../types/index.js'

const handler: PluginHandler = async (m, { conn }) => {
  let uptime = process.uptime()
  let memory = process.memoryUsage()
  
  let text = `🔬 *TEST DE DESARROLLO* 𒁈\n\n`
  text += `⏱️ Uptime: ${formatUptime(uptime)}\n`
  text += `💾 Memoria:\n`
  text += `  • RSS: ${formatBytes(memory.rss)}\n`
  text += `  • Heap: ${formatBytes(memory.heapUsed)}/${formatBytes(memory.heapTotal)}\n`
  text += `  • External: ${formatBytes(memory.external)}\n\n`
  text += `📊 Base de Datos:\n`
  text += `  • Usuarios: ${Object.keys(global.db.data.users).length}\n`
  text += `  • Chats: ${Object.keys(global.db.data.chats).length}\n`
  text += `  • Guilds: ${Object.keys(global.db.data.guilds || {}).length}\n\n`
  text += `🔧 Node: ${process.version}\n`
  text += `🆔 PID: ${process.pid}`
  
  m.reply(text)
}

handler.help = ['devtest']
handler.tags = ['dev']
handler.command = /^devtest$/i
handler.dev = true  // Solo developers

function formatUptime(seconds) {
  let days = Math.floor(seconds / 86400)
  let hours = Math.floor((seconds % 86400) / 3600)
  let minutes = Math.floor((seconds % 3600) / 60)
  let secs = Math.floor(seconds % 60)
  
  let parts: any[] = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`)
  
  return parts.join(' ')
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default handler
