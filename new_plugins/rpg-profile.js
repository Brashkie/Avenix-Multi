// ═══════════════════════════════════════════════════════════════════════════════
// │                       PERFIL RPG COMPLETO MEJORADO                         │
// │                      plugins/rpg-profile-full.js                            │
// ═══════════════════════════════════════════════════════════════════════════════

import moment from 'moment-timezone'

let handler = async (m, { conn, args, usedPrefix }) => {
  let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.sender
  let user = global.db.data.users[who]
  let name = conn.getName(who)
  let pp
  
  try {
    pp = await conn.profilePictureUrl(who, 'image')
  } catch {
    pp = 'https://i.ibb.co/2kXNFV5/avatar-contact.png'
  }
  
  // ═════════════════════════════════════════════════════════════════════════
  // │                      CALCULAR ROLES DEL USUARIO                        │
  // ═════════════════════════════════════════════════════════════════════════
  
  const detectwhat = who.includes('@lid') ? '@lid' : '@s.whatsapp.net'
  
  let roles = []
  
  // Owner
  const isROwner = [...global.owner.map(([number]) => number)]
    .map(v => v.replace(/\D/g, "") + detectwhat)
    .includes(who)
  if (isROwner) roles.push('👑 ROwner')
  
  const isOwner = isROwner || who === conn.user.jid
  if (isOwner && !isROwner) roles.push('🔧 Owner')
  
  // Developer
  const isDev = (global.devs || [])
    .map(v => v.replace(/[^0-9]/g, '') + detectwhat)
    .includes(who)
  if (isDev) roles.push('💻 Developer')
  
  // Moderador
  const isMods = (global.mods || [])
    .map(v => v.replace(/[^0-9]/g, '') + detectwhat)
    .includes(who)
  if (isMods) roles.push('⚙️ Moderador')
  
  // Helper
  const isHelpers = (global.helpers || [])
    .map(v => v.replace(/[^0-9]/g, '') + detectwhat)
    .includes(who)
  if (isHelpers) roles.push('🛠️ Helper')
  
  // Contributors
  if (user.contributor) roles.push('⭐ Contributor')
  
  // Beta Tester
  if (user.betaTester) roles.push('🧪 Beta Tester')
  
  // Donator
  if (user.donator) roles.push('💝 Donator')
  
  // Partner
  if (user.partner) roles.push('🤝 Partner')
  
  // Influencer
  if (user.influencer) roles.push('🌟 Influencer')
  
  // Premium
  if (user.premium && user.premiumTime > Date.now()) {
    let remaining = user.premiumTime - Date.now()
    let days = Math.floor(remaining / (1000 * 60 * 60 * 24))
    roles.push(`💎 Premium (${days}d)`)
  }
  
  // VIP
  if (user.vip && user.vipTime > Date.now()) {
    let remaining = user.vipTime - Date.now()
    let days = Math.floor(remaining / (1000 * 60 * 60 * 24))
    roles.push(`⭐ VIP (${days}d)`)
  }
  
  // Verified
  if (user.verified) roles.push('✅ Verified')
  
  // Developer badge
  if (user.developer) roles.push('💻 Dev Badge')
  
  // Si no tiene roles especiales
  if (roles.length === 0) roles.push('👤 Usuario Regular')
  
  // ═════════════════════════════════════════════════════════════════════════
  // │                      INFORMACIÓN DE CLAN                               │
  // ═════════════════════════════════════════════════════════════════════════
  
  let guildInfo = ''
  if (user.guild) {
    let guild = global.db.data.guilds[user.guild]
    if (guild) {
      guildInfo = `🏰 *Clan*
━━━━━━━━━━━━━━━━
• Nombre: ${guild.name}
• Rango: ${user.guildRank}
• Nivel: ${guild.level}
• Miembros: ${guild.members.length}/50
• Contribución: ${user.guildContribution}

`
    }
  }
  
  // ═════════════════════════════════════════════════════════════════════════
  // │                      BADGES Y LOGROS                                   │
  // ═════════════════════════════════════════════════════════════════════════
  
  let achievementsCount = user.achievements?.length || 0
  let titlesCount = user.titles?.length || 0
  let badgesCount = user.badges?.length || 0
  
  // ═════════════════════════════════════════════════════════════════════════
  // │                      CALCULAR WIN RATE                                 │
  // ═════════════════════════════════════════════════════════════════════════
  
  let totalPvP = (user.pvpWins || 0) + (user.pvpLoses || 0)
  let winRate = totalPvP > 0 ? Math.floor((user.pvpWins / totalPvP) * 100) : 0
  
  // ═════════════════════════════════════════════════════════════════════════
  // │                      TIEMPO REGISTRADO                                 │
  // ═════════════════════════════════════════════════════════════════════════
  
  let registered = user.regTime !== -1 ? moment(user.regTime).format('DD/MM/YYYY') : 'No registrado'
  let registeredDays = user.regTime !== -1 ? Math.floor((Date.now() - user.regTime) / (1000 * 60 * 60 * 24)) : 0
  
  // ═════════════════════════════════════════════════════════════════════════
  // │                      CREAR MENSAJE                                     │
  // ═════════════════════════════════════════════════════════════════════════
  
  let text = `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
┃  👤 *PERFIL COMPLETO* 𒁈
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

📋 *Información Básica*
━━━━━━━━━━━━━━━━
• Nombre: ${name}
• Registrado: ${registered}
${registeredDays > 0 ? `• Antigüedad: ${registeredDays} días\n` : ''}${user.age !== -1 ? `• Edad: ${user.age} años\n` : ''}${user.genre ? `• Género: ${user.genre}\n` : ''}${user.description ? `• Bio: ${user.description}\n` : ''}
🎖️ *Roles y Badges*
━━━━━━━━━━━━━━━━
${roles.join(' | ')}
${badgesCount > 0 ? `\n🏅 Badges especiales: ${badgesCount}` : ''}

📊 *Nivel y Experiencia*
━━━━━━━━━━━━━━━━
• Nivel: ${user.level}
• EXP: ${user.exp}
• Rol: ${user.role}
${user.class !== 'Novato' ? `• Clase: ${user.class} (Nv.${user.classLevel})\n` : ''}
💰 *Economía*
━━━━━━━━━━━━━━━━
• Money: ${user.money.toLocaleString()}
• Banco: ${user.bank.toLocaleString()}/${user.bankLimit.toLocaleString()}
• Diamantes: ${user.diamond}
• Oro: ${user.gold || 0}
• Gemas: ${user.gems || 0}

⚔️ *Estadísticas de Combate*
━━━━━━━━━━━━━━━━
• ❤️ HP: ${user.health}/${user.maxHealth}
• 💙 MP: ${user.mana}/${user.maxMana}
• ⚡ Stamina: ${user.stamina}/${user.maxStamina}
• ⚔️ Ataque: ${user.attack}
• 🛡️ Defensa: ${user.defense}
• 🔮 Atq. Mágico: ${user.magicAttack}
• 🌟 Def. Mágica: ${user.magicDefense}
• 💨 Velocidad: ${user.speed}
• 🍀 Suerte: ${user.luck}
• 💥 Crítico: ${user.critRate}%

🏆 *PvP Arena*
━━━━━━━━━━━━━━━━
• Victorias: ${user.pvpWins || 0}
• Derrotas: ${user.pvpLoses || 0}
• Win Rate: ${winRate}%
• Rating: ${user.pvpRating || 1000}
• Rango: ${user.pvpRank || 'Bronce'}
• Mejor Racha: ${user.bestArenaStreak || 0}

${guildInfo}⭐ *Reputación*
━━━━━━━━━━━━━━━━
• Puntos: ${user.reputation || 0}
• Rango: ${user.reputationRank || 'Desconocido'}

🎖️ *Títulos y Logros*
━━━━━━━━━━━━━━━━
• Título Activo: ${user.activeTitle ? '✨ ' + user.activeTitle : 'Ninguno'}
• Títulos: ${titlesCount}
• Logros: ${achievementsCount}
• Puntos de Logros: ${user.achievementPoints || 0}

🎮 *Progreso RPG*
━━━━━━━━━━━━━━━━
• Dungeons: ${user.dungeonsCleared || 0}
• Boss Kills: ${user.totalBossKills || 0}
• Misiones: ${user.completedQuests?.length || 0}
• Crafting Nv.: ${user.craftingLevel || 1}

🐾 *Mascota Activa*
━━━━━━━━━━━━━━━━
${user.activePet ? `• ${user.activePet} (Nv.${user.petLevel || 1})` : '• Sin mascota activa'}

📊 *Estadísticas Generales*
━━━━━━━━━━━━━━━━
• Comandos usados: ${user.commandsUsed || 0}
• Mensajes enviados: ${user.messagesCount || 0}
${user.warn > 0 ? `\n⚠️ Warns: ${user.warn}/${global.maxwarn}` : ''}
${user.banned ? `\n🚫 BANEADO: ${user.bannedReason || 'Sin razón'}` : ''}

𒁈 *Avenix-Multi v6.5.0* 𒁈`

  // ═════════════════════════════════════════════════════════════════════════
  // │                      ENVIAR MENSAJE CON IMAGEN                         │
  // ═════════════════════════════════════════════════════════════════════════
  
  await conn.sendMessage(m.chat, {
    image: { url: pp },
    caption: text,
    mentions: [who]
  }, { quoted: m })
}

handler.help = ['perfil', 'profile', 'me']
handler.tags = ['rpg']
handler.command = /^(perfil|profile|me|yo)$/i
handler.register = true

export default handler
