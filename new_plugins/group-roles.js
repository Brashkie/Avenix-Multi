// ═══════════════════════════════════════════════════════════════════════════════
// │                    PLUGIN DE GESTIÓN DE ROLES                              │
// │                      plugins/owner-roles.js                                 │
// ═══════════════════════════════════════════════════════════════════════════════

let handler = async (m, { conn, args, usedPrefix, command, isROwner }) => {
  
  const subcommands = {
    agregar: 'add',
    add: 'add',
    añadir: 'add',
    remover: 'remove',
    remove: 'remove',
    quitar: 'remove',
    lista: 'list',
    list: 'list',
    ver: 'list',
    info: 'info'
  }
  
  let subcommand = subcommands[args[0]?.toLowerCase()] || 'info'
  
  // Lista de roles disponibles
  const ROLES = {
    vip: {
      name: '⭐ VIP',
      description: 'Usuario VIP con beneficios especiales',
      dbField: 'vip',
      timeField: 'vipTime',
      color: '🟢'
    },
    premium: {
      name: '💎 Premium',
      description: 'Usuario Premium con todos los beneficios',
      dbField: 'premium',
      timeField: 'premiumTime',
      color: '🟣'
    },
    verified: {
      name: '✅ Verified',
      description: 'Usuario verificado con badge',
      dbField: 'verified',
      timeField: null,
      color: '🔵'
    },
    contributor: {
      name: '⭐ Contributor',
      description: 'Colaborador del proyecto',
      dbField: 'contributor',
      timeField: null,
      color: '🟠'
    },
    betaTester: {
      name: '🧪 Beta Tester',
      description: 'Probador de funciones beta',
      dbField: 'betaTester',
      timeField: null,
      color: '🟡'
    },
    donator: {
      name: '💝 Donator',
      description: 'Donador que apoya el proyecto',
      dbField: 'donator',
      timeField: null,
      color: '🔴'
    },
    partner: {
      name: '🤝 Partner',
      description: 'Socio oficial del bot',
      dbField: 'partner',
      timeField: null,
      color: '🟢'
    },
    influencer: {
      name: '🌟 Influencer',
      description: 'Influencer verificado',
      dbField: 'influencer',
      timeField: null,
      color: '⭐'
    },
    developer: {
      name: '💻 Developer',
      description: 'Badge de desarrollador',
      dbField: 'developer',
      timeField: null,
      color: '🔵'
    }
  }
  
  // ═════════════════════════════════════════════════════════════════════════
  // │                         INFO DE ROLES                                  │
  // ═════════════════════════════════════════════════════════════════════════
  
  if (subcommand === 'info') {
    let text = `╭━━━━━━━━━━━━━━━━━━━━╮
┃ 👥 *GESTIÓN DE ROLES* 𒁈
╰━━━━━━━━━━━━━━━━━━━━╯

📋 *Roles Disponibles*
━━━━━━━━━━━━━━━━\n\n`
    
    for (let [key, role] of Object.entries(ROLES)) {
      text += `${role.color} *${role.name}*\n`
      text += `   📖 ${role.description}\n`
      text += `   🔑 ID: \`${key}\`\n\n`
    }
    
    text += `💡 *Comandos*\n━━━━━━━━━━━━━━━━\n`
    text += `• ${usedPrefix}roles agregar <rol> @usuario [días]\n`
    text += `• ${usedPrefix}roles remover <rol> @usuario\n`
    text += `• ${usedPrefix}roles lista <rol>\n\n`
    
    text += `📌 *Ejemplos*\n━━━━━━━━━━━━━━━━\n`
    text += `${usedPrefix}roles agregar vip @user 30\n`
    text += `${usedPrefix}roles agregar verified @user\n`
    text += `${usedPrefix}roles remover premium @user\n`
    text += `${usedPrefix}roles lista vip`
    
    return m.reply(text)
  }
  
  // ═════════════════════════════════════════════════════════════════════════
  // │                         AGREGAR ROL                                    │
  // ═════════════════════════════════════════════════════════════════════════
  
  if (subcommand === 'add') {
    let roleName = args[1]?.toLowerCase()
    let target = m.mentionedJid && m.mentionedJid[0]
    let days = parseInt(args[2]) || null
    
    if (!roleName || !ROLES[roleName]) {
      return m.reply(`❌ *ROL INVÁLIDO* 𒁈\n\n💡 Roles disponibles:\n${Object.keys(ROLES).join(', ')}\n\n📌 Uso: ${usedPrefix}roles agregar <rol> @usuario [días]`)
    }
    
    if (!target) {
      return m.reply(`❌ Menciona al usuario.\n\n💡 Uso: ${usedPrefix}roles agregar ${roleName} @usuario ${days ? days : '[días]'}`)
    }
    
    let role = ROLES[roleName]
    let user = global.db.data.users[target]
    
    if (!user) {
      return m.reply(`❌ Usuario no registrado en la base de datos.`)
    }
    
    // Verificar si ya tiene el rol
    if (user[role.dbField]) {
      return m.reply(`⚠️ @${target.split('@')[0]} ya tiene el rol ${role.name}`, null, { mentions: [target] })
    }
    
    // Agregar rol
    user[role.dbField] = true
    
    // Si el rol tiene tiempo, agregarlo
    if (role.timeField && days) {
      user[role.timeField] = Date.now() + (days * 24 * 60 * 60 * 1000)
    }
    
    let text = `✨ *ROL ASIGNADO* 𒁈\n\n`
    text += `${role.color} *${role.name}*\n`
    text += `👤 Usuario: @${target.split('@')[0]}\n`
    text += `📖 ${role.description}\n`
    
    if (role.timeField && days) {
      text += `⏰ Duración: ${days} días\n`
      text += `📅 Expira: ${new Date(user[role.timeField]).toLocaleDateString('es-ES')}\n`
    } else {
      text += `⏰ Duración: Permanente\n`
    }
    
    text += `\n👮 Asignado por: @${m.sender.split('@')[0]}`
    
    conn.sendMessage(m.chat, { text, mentions: [target, m.sender] }, { quoted: m })
    
    // Notificar al usuario
    conn.sendMessage(target, { 
      text: `🎉 ¡Felicitaciones!\n\n${role.color} Te han asignado el rol *${role.name}*\n\n📖 ${role.description}${role.timeField && days ? `\n⏰ Duración: ${days} días` : ''}` 
    })
    
    // Si es premium/vip, dar bienvenida especial
    if (roleName === 'premium' || roleName === 'vip') {
      let benefits = roleName === 'premium' 
        ? '✨ Sin cooldowns\n✨ Comandos exclusivos\n✨ Recompensas x5\n✨ Prioridad en soporte'
        : '⭐ Cooldowns -50%\n⭐ Algunos comandos exclusivos\n⭐ Recompensas x2\n⭐ Badge especial'
      
      conn.sendMessage(target, { 
        text: `🎁 *Beneficios de ${role.name}*\n\n${benefits}\n\n💡 Usa: ${usedPrefix}menu para ver comandos exclusivos` 
      })
    }
  }
  
  // ═════════════════════════════════════════════════════════════════════════
  // │                         REMOVER ROL                                    │
  // ═════════════════════════════════════════════════════════════════════════
  
  if (subcommand === 'remove') {
    let roleName = args[1]?.toLowerCase()
    let target = m.mentionedJid && m.mentionedJid[0]
    
    if (!roleName || !ROLES[roleName]) {
      return m.reply(`❌ *ROL INVÁLIDO* 𒁈\n\n💡 Roles disponibles:\n${Object.keys(ROLES).join(', ')}\n\n📌 Uso: ${usedPrefix}roles remover <rol> @usuario`)
    }
    
    if (!target) {
      return m.reply(`❌ Menciona al usuario.\n\n💡 Uso: ${usedPrefix}roles remover ${roleName} @usuario`)
    }
    
    let role = ROLES[roleName]
    let user = global.db.data.users[target]
    
    if (!user) {
      return m.reply(`❌ Usuario no registrado.`)
    }
    
    if (!user[role.dbField]) {
      return m.reply(`⚠️ @${target.split('@')[0]} no tiene el rol ${role.name}`, null, { mentions: [target] })
    }
    
    // Remover rol
    user[role.dbField] = false
    if (role.timeField) {
      user[role.timeField] = 0
    }
    
    let text = `🗑️ *ROL REMOVIDO* 𒁈\n\n`
    text += `${role.color} *${role.name}*\n`
    text += `👤 Usuario: @${target.split('@')[0]}\n\n`
    text += `👮 Removido por: @${m.sender.split('@')[0]}`
    
    conn.sendMessage(m.chat, { text, mentions: [target, m.sender] }, { quoted: m })
    
    // Notificar al usuario
    conn.sendMessage(target, { 
      text: `⚠️ Se te ha removido el rol ${role.name}\n\n📋 Si crees que es un error, contacta al owner.` 
    })
  }
  
  // ═════════════════════════════════════════════════════════════════════════
  // │                         LISTAR USUARIOS CON ROL                        │
  // ═════════════════════════════════════════════════════════════════════════
  
  if (subcommand === 'list') {
    let roleName = args[1]?.toLowerCase()
    
    if (!roleName) {
      // Listar todos los roles con cantidad de usuarios
      let text = `╭━━━━━━━━━━━━━━━━━━━━╮
┃ 📊 *ESTADÍSTICAS DE ROLES* 𒁈
╰━━━━━━━━━━━━━━━━━━━━╯\n\n`
      
      for (let [key, role] of Object.entries(ROLES)) {
        let count = Object.values(global.db.data.users)
          .filter(u => u[role.dbField] === true)
          .length
        
        text += `${role.color} *${role.name}*\n`
        text += `   👥 Usuarios: ${count}\n\n`
      }
      
      text += `💡 Ver usuarios de un rol:\n${usedPrefix}roles lista <rol>`
      
      return m.reply(text)
    }
    
    if (!ROLES[roleName]) {
      return m.reply(`❌ Rol inválido: ${roleName}\n\n💡 Roles disponibles:\n${Object.keys(ROLES).join(', ')}`)
    }
    
    let role = ROLES[roleName]
    
    // Obtener usuarios con el rol
    let usersWithRole = Object.entries(global.db.data.users)
      .filter(([_, u]) => u[role.dbField] === true)
      .slice(0, 50) // Máximo 50
    
    if (usersWithRole.length === 0) {
      return m.reply(`📋 No hay usuarios con el rol ${role.name}`)
    }
    
    let text = `╭━━━━━━━━━━━━━━━━━━━━╮
┃ ${role.color} *${role.name.toUpperCase()}* 𒁈
╰━━━━━━━━━━━━━━━━━━━━╯

👥 Total: ${usersWithRole.length} usuario${usersWithRole.length > 1 ? 's' : ''}\n\n`
    
    usersWithRole.forEach(([jid, user], i) => {
      text += `${i + 1}. @${jid.split('@')[0]}\n`
      
      if (role.timeField && user[role.timeField]) {
        let remaining = user[role.timeField] - Date.now()
        if (remaining > 0) {
          let days = Math.floor(remaining / (1000 * 60 * 60 * 24))
          text += `   ⏰ Expira en: ${days} días\n`
        } else {
          text += `   ⚠️ Expirado\n`
        }
      }
      text += `\n`
    })
    
    if (usersWithRole.length === 50) {
      text += `⚠️ Se muestran solo los primeros 50 usuarios.`
    }
    
    conn.sendMessage(m.chat, { 
      text, 
      mentions: usersWithRole.map(([jid]) => jid) 
    }, { quoted: m })
  }
}

handler.help = ['roles']
handler.tags = ['owner']
handler.command = /^roles?$/i
handler.rowner = true

export default handler
