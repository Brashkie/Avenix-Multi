// ═══════════════════════════════════════════════════════════════════════════════
// │              EJEMPLOS DE COMANDOS ESPECÍFICOS POR ROL                      │
// ═══════════════════════════════════════════════════════════════════════════════

// ═════════════════════════════════════════════════════════════════════════
// │                    1. COMANDO PARA DEVELOPERS                          │
// │                    plugins/dev-test.js                                 │
// ═════════════════════════════════════════════════════════════════════════

let devTestHandler = async (m, { conn }) => {
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

devTestHandler.help = ['devtest']
devTestHandler.tags = ['dev']
devTestHandler.command = /^devtest$/i
devTestHandler.dev = true  // Solo developers

// export default devTestHandler

// ═════════════════════════════════════════════════════════════════════════
// │                    2. COMANDO PARA MODERADORES                         │
// │                    plugins/mod-clearwarns.js                           │
// ═════════════════════════════════════════════════════════════════════════

let modClearHandler = async (m, { conn }) => {
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

modClearHandler.help = ['clearwarn']
modClearHandler.tags = ['mod']
modClearHandler.command = /^clearwarns?$/i
modClearHandler.mods = true  // Solo moderadores

// export default modClearHandler

// ═════════════════════════════════════════════════════════════════════════
// │                    3. COMANDO PARA HELPERS                             │
// │                    plugins/helper-guide.js                             │
// ═════════════════════════════════════════════════════════════════════════

let helperGuideHandler = async (m, { conn, args }) => {
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

helperGuideHandler.help = ['guia']
helperGuideHandler.tags = ['helper']
helperGuideHandler.command = /^gu[íi]as?$/i
helperGuideHandler.helper = true  // Solo helpers

// export default helperGuideHandler

// ═════════════════════════════════════════════════════════════════════════
// │                    4. COMANDO PARA CONTRIBUTORS                        │
// │                    plugins/contributor-changelog.js                    │
// ═════════════════════════════════════════════════════════════════════════

let contributorChangelogHandler = async (m, { conn, text }) => {
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

contributorChangelogHandler.help = ['changelog']
contributorChangelogHandler.tags = ['contributor']
contributorChangelogHandler.command = /^changelog$/i
contributorChangelogHandler.contributor = true  // Solo contributors

// export default contributorChangelogHandler

// ═════════════════════════════════════════════════════════════════════════
// │                    5. COMANDO PARA BETA TESTERS                        │
// │                    plugins/beta-report.js                              │
// ═════════════════════════════════════════════════════════════════════════

let betaReportHandler = async (m, { conn, text }) => {
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

betaReportHandler.help = ['reportbug']
betaReportHandler.tags = ['beta']
betaReportHandler.command = /^reportbug$/i
betaReportHandler.betaTester = true  // Solo beta testers

// export default betaReportHandler

// ═════════════════════════════════════════════════════════════════════════
// │                    6. COMANDO PARA DONATORS                            │
// │                    plugins/donator-special.js                          │
// ═════════════════════════════════════════════════════════════════════════

let donatorSpecialHandler = async (m, { conn }) => {
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

donatorSpecialHandler.help = ['donator']
donatorSpecialHandler.tags = ['donator']
donatorSpecialHandler.command = /^donat(or|e)$/i
donatorSpecialHandler.donator = true  // Solo donadores

// export default donatorSpecialHandler

// ═════════════════════════════════════════════════════════════════════════
// │                    7. COMANDO PARA PARTNERS                            │
// │                    plugins/partner-promo.js                            │
// ═════════════════════════════════════════════════════════════════════════

let partnerPromoHandler = async (m, { conn, text }) => {
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

partnerPromoHandler.help = ['promo']
partnerPromoHandler.tags = ['partner']
partnerPromoHandler.command = /^promo$/i
partnerPromoHandler.partner = true  // Solo partners

// export default partnerPromoHandler

// ═════════════════════════════════════════════════════════════════════════
// │                    8. COMANDO PARA INFLUENCERS                         │
// │                    plugins/influencer-announce.js                      │
// ═════════════════════════════════════════════════════════════════════════

let influencerAnnounceHandler = async (m, { conn, text }) => {
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

influencerAnnounceHandler.help = ['anuncio']
influencerAnnounceHandler.tags = ['influencer']
influencerAnnounceHandler.command = /^anuncios?$/i
influencerAnnounceHandler.influencer = true  // Solo influencers

// export default influencerAnnounceHandler

// ═════════════════════════════════════════════════════════════════════════
// │                    9. COMANDO PARA VIP                                 │
// │                    plugins/vip-boost.js                                │
// ═════════════════════════════════════════════════════════════════════════

let vipBoostHandler = async (m, { conn }) => {
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

vipBoostHandler.help = ['vipboost']
vipBoostHandler.tags = ['vip']
vipBoostHandler.command = /^vipboost$/i
vipBoostHandler.vip = true  // Solo VIP

// export default vipBoostHandler

// ═════════════════════════════════════════════════════════════════════════
// │                    10. COMANDO PARA VERIFIED                           │
// │                    plugins/verified-badge.js                           │
// ═════════════════════════════════════════════════════════════════════════

let verifiedBadgeHandler = async (m, { conn }) => {
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

verifiedBadgeHandler.help = ['mybadge']
verifiedBadgeHandler.tags = ['info']
verifiedBadgeHandler.command = /^mybadge$/i
verifiedBadgeHandler.verified = true  // Solo verified

// export default verifiedBadgeHandler

// ═════════════════════════════════════════════════════════════════════════
// │                    FUNCIONES AUXILIARES                                │
// ═════════════════════════════════════════════════════════════════════════

function formatUptime(seconds) {
  let days = Math.floor(seconds / 86400)
  let hours = Math.floor((seconds % 86400) / 3600)
  let minutes = Math.floor((seconds % 3600) / 60)
  let secs = Math.floor(seconds % 60)
  
  let parts = []
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

// ═════════════════════════════════════════════════════════════════════════
// │                    EXPORTAR TODOS (PARA TESTING)                       │
// ═════════════════════════════════════════════════════════════════════════

/*
Para usar estos comandos, crea archivos separados con cada uno:

1. plugins/dev-test.js          → devTestHandler
2. plugins/mod-clearwarns.js    → modClearHandler
3. plugins/helper-guide.js      → helperGuideHandler
4. plugins/contributor-changelog.js → contributorChangelogHandler
5. plugins/beta-report.js       → betaReportHandler
6. plugins/donator-special.js   → donatorSpecialHandler
7. plugins/partner-promo.js     → partnerPromoHandler
8. plugins/influencer-announce.js → influencerAnnounceHandler
9. plugins/vip-boost.js         → vipBoostHandler
10. plugins/verified-badge.js   → verifiedBadgeHandler

Cada archivo debe tener su propio export default:
export default nombreDelHandler
*/
