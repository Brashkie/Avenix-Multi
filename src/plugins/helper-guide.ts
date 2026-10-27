// plugins/helper-guide.ts — generado a partir de dev-tests (comandos de ejemplo por rol)
import type { PluginHandler } from '../types/index.js'

const handler: PluginHandler = async (m, { conn, args }) => {
  const guides = {
    registro: {
      title: '📝 Guía de Registro',
      content: `Para registrarte en el bot:

1️⃣ Usa el comando:
.reg nombre.edad

2️⃣ Ejemplo:
.reg Juan.25

3️⃣ Beneficios:
• Acceso a todos los comandos
• Sistema RPG completo
• Economía y recompensas
• Perfil personalizado

⚠️ Solo puedes registrarte una vez.`
    },
    comandos: {
      title: '🎮 Comandos Básicos',
      content: `Comandos más usados:

💰 Economía:
.daily - Recompensa diaria
.work - Trabajar por money
.bal - Ver balance

🎲 RPG:
.perfil - Ver perfil
.adventure - Aventura
.dungeon - Explorar dungeon
.duel @user - Duelo PvP

🏰 Clan:
.guild crear <nombre>
.guild unirse <nombre>

📋 Usa .menu para ver todos`
    },
    premium: {
      title: '💎 Premium',
      content: `Beneficios Premium:

✨ Sin cooldowns
✨ Comandos exclusivos
✨ Recompensas x5
✨ Prioridad en soporte
✨ Badge premium

💰 Precio: Consulta al owner
📞 Contacto: .owner`
    },
    errores: {
      title: '❌ Solución de Errores',
      content: `Errores comunes:

1️⃣ "No estás registrado"
→ Usa: .reg nombre.edad

2️⃣ "Cooldown activo"
→ Espera el tiempo indicado

3️⃣ "Money insuficiente"
→ Usa: .work, .daily

4️⃣ "Comando no existe"
→ Verifica con: .menu

❓ Más ayuda: Contacta helpers`
    }
  }
  
  let topic = args[0]?.toLowerCase()
  
  if (!topic || !guides[topic]) {
    let text = `📚 *GUÍAS DISPONIBLES* 𒁈\n\n`
    text += `💡 Temas disponibles:\n\n`
    
    for (let [key, guide] of Object.entries(guides)) {
      text += `• ${key} - ${guide.title}\n`
    }
    
    text += `\n📋 Uso: .guia <tema>\n`
    text += `📌 Ejemplo: .guia registro`
    
    return m.reply(text)
  }
  
  let guide = guides[topic]
  
  let text = `${guide.title}\n${'━'.repeat(30)}\n\n${guide.content}\n\n🛠️ Helper: @${m.sender.split('@')[0]}`
  
  conn.sendMessage(m.chat, { text, mentions: [m.sender] }, { quoted: m })
}

handler.help = ['guia']
handler.tags = ['helper']
handler.command = /^gu[íi]as?$/i
handler.helper = true  // Solo helpers

export default handler
