import { watchFile, unwatchFile, readFileSync } from 'fs'
import paint from '../lib/paint.js'
import { fileURLToPath, pathToFileURL } from 'url'
import moment from 'moment-timezone'

/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                    𒁈 AVENIX-MULTI V6.5.0 CONFIG 𒁈                          ┃
 * ┃                       Optimizado para Handler Hepein                         ┃
 * ┃              Compatible con 14 Roles + Sistema RPG Completo                 ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

// ═══════════════════════════════════════════════════════════════════════════════
// │                    SISTEMA DE ROLES COMPLETO (14 ROLES)                     │
// ═══════════════════════════════════════════════════════════════════════════════

// ═════════════════════ NIVEL 1: ADMINISTRACIÓN ═════════════════════
global.owner = [
  ['51916360161', '𒁈 Hepein Oficial - Creator 𒁈', true]
]

// ═════════════════════ NIVEL 2: DESARROLLO ═════════════════════════
global.devs = [
  ['51916360161', 'dev']
]

// ═════════════════════ NIVEL 3: MODERACIÓN ═════════════════════════
global.mods = [
  ['51913063157', '🌄❣️Luis_RD_1298❣️🌄', true],
  ['595975378656', '~♥︎┏𝕷𝖊𝖘𝖘_𝕾𝖝𝖚𝖑𝖑┓♥︎', true]
]

// ═════════════════════ NIVEL 4: ASISTENCIA ═════════════════════════
global.helpers = []

// ═════════════════════ NIVEL 5: COMUNIDAD ═════════════════════════
global.contributors = []

global.betaTesters = []

global.donators = []

global.partners = []

global.influencers = []

// ═════════════════════ NIVEL 6: PREMIUM ═════════════════════════
global.prems = []

// ═══════════════════════════════════════════════════════════════════════════════
// │                           CONFIGURACIÓN DE CONEXIÓN                         │
// ═══════════════════════════════════════════════════════════════════════════════

// Sistema de SubBots
global.AvenixJadibts = true // Activar/desactivar SubBots

// Número del bot para código de 8 dígitos (opcional)
global.botNumberCode = "" // Ejemplo: "+51916360161"
global.confirmCode = ""

// Configuraciones de hosting
global.obtenerQrWeb = 0 // QR por web (0 = desactivado, 1 = activado)
global.keepAliveRender = 0 // Keep alive para Render.com


global.sessionName = 'sessions'  // Nombre de carpeta de sesión (REQUERIDO)
global.sessions = 'sessions'
global.nameqr = 'Avenix-Multi'
global.botNumber = ''
global.conns = []                           // Array de conexiones de subbots
global.rutaJadiBot = './kernel/jadibot'    // Ruta donde se guardan los subbots
// ═══════════════════════════════════════════════════════════════════════════════
// │                           INFORMACIÓN DEL BOT                               │
// ═══════════════════════════════════════════════════════════════════════════════

global.botname = '𒁈 𝗔𝘃𝗲𝗻𝗶𝘅-𝗠𝘂𝗹𝘁𝗶 V6.5.0 𒁈'
global.namebot = '𒁈 Avenix-Multi 𒁈'
global.textbot = 'Avenix-Multi | Bot Multi-Propósito Avanzado'
global.wm = '𒁈 Avenix-Multi V6.5.0 - Powered by Hepein 𒁈'
global.author = 'Hepein Oficial'
global.dev = '© Powered by Hepein Oficial 𒁈'
global.vs = '6.5.0'
global.vsJB = '1.5 (Stable)'

// Stickers y paquetes
global.packname = '𒁈 Avenix-Multi V6.5.0'
global.stickpack = '𒁈 Avenix-Multi'
global.stickauth = `𒁈 Bot creado por Hepein Oficial\n📅 Fecha: ${moment.tz('America/Lima').format('DD/MM/YYYY')}\n⏰ Hora: ${moment.tz('America/Lima').format('HH:mm:ss')}`

// Mensajes del sistema
global.wait = '⏳ *Procesando...*\n\n𒁈 Avenix-Multi está trabajando en tu solicitud'
global.listo = '✅ *¡Listo!*\n\nAquí está tu resultado'
global.error = '❌ *Error*\n\nOcurrió un problema, intenta nuevamente'
global.loading = '⏳ *Cargando...*\n\nEspera un momento'
global.success = '✅ *Éxito*\n\nOperación completada'

// ═══════════════════════════════════════════════════════════════════════════════
// │                              REDES SOCIALES                                │
// ═══════════════════════════════════════════════════════════════════════════════

global.yt = 'https://youtube.com/@HepeinOficial'
global.ig = 'https://instagram.com/hepein.oficial'
global.fb = 'https://facebook.com/hepein.oficial'
global.tk = 'https://tiktok.com/@hepein.oficial'
global.github = 'https://github.com/Brashkie/Avenix-Multi'
global.md = 'https://github.com/Brashkie/Avenix-Multi'
global.web = 'https://avenix-multi.com' // Sitio web oficial (opcional)

// Grupos y canales oficiales
global.group = 'https://chat.whatsapp.com/CBuLXuVZcg9FEfCSHiY6b0'
global.group2 = '' // Grupo secundario (opcional)
global.canal = 'https://whatsapp.com/channel/0029Va8t5DZ9cDDU8ntWVJ2n'
global.asistencia = 'https://chat.whatsapp.com/CnBH1Cdi1pG9jWjmAeUVGW'
global.comunidad = '' // Comunidad oficial (opcional)

// ═══════════════════════════════════════════════════════════════════════════════
// │                              APIS EXTERNAS                                  │
// ═══════════════════════════════════════════════════════════════════════════════

global.APIs = {
  // APIs principales (funcionales y mantenidas)
  lolhuman: 'https://api.lolhuman.xyz',
  neoxr: 'https://api.neoxr.eu',
  popcat: 'https://api.popcat.xyz',
  fgmods: 'https://api.fgmods.xyz',
  
  // APIs de respaldo
  ryzendesu: 'https://api.ryzendesu.vip',
  alyachan: 'https://api.alyachan.dev',
  violetics: 'https://violetics.pw',
  
  // API personalizada (si tienes)
  avenix: 'https://api.avenix-multi.com'
}

global.APIKeys = {
  'https://api.lolhuman.xyz': process.env.LOLHUMAN_API || 'AvenixMulti',
  'https://api.neoxr.eu': process.env.NEOXR_API || 'AvenixMulti',
  'https://api.fgmods.xyz': process.env.FGMODS_API || 'AvenixMulti',
  'https://api.ryzendesu.vip': process.env.RYZEN_API || 'free',
  'https://api.alyachan.dev': process.env.ALYA_API || 'AvenixMulti'
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      CONFIGURACIÓN RPG COMPLETA                             │
// ═══════════════════════════════════════════════════════════════════════════════

// ═════════════════════ SISTEMA DE NIVELES ═════════════════════════
global.multiplier = 75 // Dificultad para subir de nivel (menor = más fácil)
global.maxLevel = 100 // Nivel máximo alcanzable
global.maxwarn = 3 // Máximo de advertencias

// ═════════════════════ SISTEMA DE ECONOMÍA MÚLTIPLE ═════════════════════════
global.monedas = 'AvenixCoins' // Nombre de la moneda
global.moneda = '🪙' // Emoji de moneda
global.diamond_emoji = '💎' // Emoji de diamantes
global.gold_emoji = '🏆' // Emoji de oro
global.gem_emoji = '💠' // Emoji de gemas

// Límites y valores por defecto
global.limitDefault = 25 // Límite diario gratis
global.expDefault = 100 // Experiencia inicial
global.moneyDefault = 1000 // Money inicial
global.diamondDefault = 5 // Diamantes iniciales
global.goldDefault = 0 // Oro inicial
global.gemDefault = 0 // Gemas iniciales

// Límites de banco
global.bankLimitDefault = 10000 // Límite de banco inicial
global.maxBankLimit = 1000000 // Límite máximo de banco

// ═════════════════════ SISTEMA DE CLASES ═════════════════════════
global.classes = {
  Novato: {
    name: 'Novato',
    bonusHealth: 0,
    bonusAttack: 0,
    bonusDefense: 0,
    requiredLevel: 0
  },
  Guerrero: {
    name: 'Guerrero',
    bonusHealth: 50,
    bonusAttack: 15,
    bonusDefense: 10,
    requiredLevel: 10
  },
  Mago: {
    name: 'Mago',
    bonusHealth: 30,
    bonusMagicAttack: 20,
    bonusMana: 50,
    requiredLevel: 10
  },
  Arquero: {
    name: 'Arquero',
    bonusHealth: 35,
    bonusAttack: 12,
    bonusSpeed: 10,
    requiredLevel: 10
  },
  Asesino: {
    name: 'Asesino',
    bonusHealth: 25,
    bonusAttack: 18,
    bonusCritRate: 10,
    requiredLevel: 15
  },
  Paladín: {
    name: 'Paladín',
    bonusHealth: 70,
    bonusDefense: 20,
    bonusAttack: 10,
    requiredLevel: 20
  }
}

// ═════════════════════ SISTEMA DE GUILD/CLAN ═════════════════════════
global.guildConfig = {
  createCost: 50000, // Costo para crear un clan
  maxMembers: 50, // Máximo de miembros por clan
  minLevel: 10, // Nivel mínimo para crear clan
  maxNameLength: 20 // Longitud máxima del nombre
}

// ═════════════════════ SISTEMA PVP ═════════════════════════
global.pvpConfig = {
  minLevel: 5, // Nivel mínimo para PvP
  rewardWin: 500, // Recompensa por victoria
  rewardDraw: 100, // Recompensa por empate
  cooldown: 300000, // Cooldown entre duelos (5 min)
  arenaPointsPerWin: 10, // Puntos de arena por victoria
  streakBonus: 1.5 // Multiplicador de racha
}

// Rangos PvP por rating
global.pvpRanks = {
  0: 'Bronce',
  1000: 'Plata',
  1500: 'Oro',
  2000: 'Platino',
  2500: 'Diamante',
  3000: 'Maestro',
  3500: 'Gran Maestro',
  4000: 'Leyenda'
}

// ═════════════════════ SISTEMA DE LOGROS ═════════════════════════
global.achievements = {
  first_command: {
    name: 'Primer Comando',
    description: 'Usa tu primer comando',
    points: 10,
    reward: { money: 500 }
  },
  level_10: {
    name: 'Novato Experimentado',
    description: 'Alcanza el nivel 10',
    points: 25,
    reward: { money: 2000, diamond: 1 }
  },
  level_50: {
    name: 'Veterano',
    description: 'Alcanza el nivel 50',
    points: 100,
    reward: { money: 10000, diamond: 5 }
  },
  pvp_win_10: {
    name: 'Gladiador',
    description: 'Gana 10 duelos PvP',
    points: 50,
    reward: { arenaPoints: 100 }
  },
  boss_slayer: {
    name: 'Cazador de Jefes',
    description: 'Derrota 5 jefes',
    points: 75,
    reward: { gold: 1000 }
  },
  guild_master: {
    name: 'Maestro de Guild',
    description: 'Crea tu propio clan',
    points: 100,
    reward: { money: 5000 }
  },
  rich: {
    name: 'Millonario',
    description: 'Acumula 1,000,000 de money',
    points: 150,
    reward: { diamond: 10 }
  }
}

// ═════════════════════ SISTEMA DE BADGES ═════════════════════════
global.badges = {
  verified: { emoji: '✅', name: 'Verificado' },
  premium: { emoji: '💎', name: 'Premium' },
  vip: { emoji: '⭐', name: 'VIP' },
  developer: { emoji: '💻', name: 'Developer' },
  contributor: { emoji: '⭐', name: 'Contributor' },
  betaTester: { emoji: '🧪', name: 'Beta Tester' },
  donator: { emoji: '💝', name: 'Donador' },
  partner: { emoji: '🤝', name: 'Partner' },
  influencer: { emoji: '🌟', name: 'Influencer' },
  champion: { emoji: '🏆', name: 'Campeón PvP' },
  legendary: { emoji: '👑', name: 'Legendario' }
}

// ═════════════════════ COOLDOWNS DE COMANDOS RPG ═════════════════════════
global.cooldowns = {
  adventure: 3600000, // 1 hora
  daily: 86400000, // 24 horas
  weekly: 604800000, // 7 días
  monthly: 2592000000, // 30 días
  yearly: 31536000000, // 365 días
  mining: 600000, // 10 minutos
  fishing: 300000, // 5 minutos
  hunting: 900000, // 15 minutos
  dungeon: 7200000, // 2 horas
  boss: 14400000, // 4 horas
  pvp: 300000, // 5 minutos
  rob: 7200000, // 2 horas
  crime: 3600000 // 1 hora
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                             RECURSOS Y MEDIA                                │
// ═══════════════════════════════════════════════════════════════════════════════

// Imágenes (crear carpeta media/ con estas imágenes). Cada una se carga por separado:
// si falta una, las demás siguen disponibles.
const missingMedia: string[] = []
const loadMedia = (file: string): Buffer | null => {
  try {
    return readFileSync(`./media/${file}`)
  } catch {
    missingMedia.push(file)
    return null
  }
}

global.imagen1 = loadMedia('Avenix-1.jpg')
global.imagen2 = loadMedia('Avenix-2.jpg')
global.imagen3 = loadMedia('Avenix-3.jpg')
global.imagen4 = loadMedia('Avenix-4.jpg')
global.imagen5 = loadMedia('Avenix-5.jpg')
global.catalogo = loadMedia('catalogo.jpg')
global.miniurl = loadMedia('miniurl.jpg')
global.avatar = loadMedia('avatar.png')
global.logo = loadMedia('logo.png')

if (missingMedia.length) {
  console.log(paint.yellow(`⚠️ Imágenes no encontradas en ./media/: ${missingMedia.join(', ')}`))
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                              CANALES OFICIALES                              │
// ═══════════════════════════════════════════════════════════════════════════════

global.ch = {
  ch1: '120363197223158904@newsletter', // Canal principal
  ch2: '120363197223158904@newsletter', // Canal de actualizaciones
  ch3: '120363197223158904@newsletter', // Canal de soporte
  ch4: '120363197223158904@newsletter', // Canal de noticias
  ch5: '120363197223158904@newsletter', // Canal VIP
  ch6: '120363197223158904@newsletter'  // Canal de colaboraciones
}

// Nombres de canales
global.channelNames = {
  ch1: '📢 Canal Principal',
  ch2: '🔄 Actualizaciones',
  ch3: '🆘 Soporte',
  ch4: '📰 Noticias',
  ch5: '⭐ VIP',
  ch6: '🤝 Colaboraciones'
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                           MENSAJES PERSONALIZADOS                           │
// ═══════════════════════════════════════════════════════════════════════════════

// Mensajes de estado
global.resultado = '╰〘✅〙 *RESULTADO* 〘✅〙╮\n\n'
global.advertencia = '╰〘⚠️〙 *ADVERTENCIA* 〘⚠️〙╮\n\n'
global.informacion = '╰〘ℹ️〙 *INFORMACIÓN* 〘ℹ️〙╮\n\n'
global.error_msg = '╰〘❌〙 *ERROR* 〘❌〙╮\n\n'
global.exito = '╰〘✅〙 *ÉXITO* 〘✅〙╮\n\n'
global.proceso = '╰〘⏳〙 *PROCESANDO* 〘⏳〙╮\n\n'

// Mensajes de grupo
global.bienvenida = `╭━═▣ 𒁈 𝗔𝘃𝗲𝗻𝗶𝘅-𝗠𝘂𝗹𝘁𝗶 𒁈 ▣═━╮
┃ 
┃ 👋 *¡Bienvenido @user!*
┃ 
┃ 🏷️ *Grupo:* @subject
┃ 📝 *Descripción:* @desc
┃ 
┃ 📋 *Reglas del grupo:*
┃ • Respeta a todos los miembros
┃ • No spam excesivo
┃ • Usa los comandos con moderación
┃ • Diviértete y aprende
┃ 
┃ 🤖 Escribe *.menu* para ver comandos
┃ 💎 Escribe *.perfil* para ver tu progreso
┃ 
╰━═▣ 𒁈 *Hepein Oficial* 𒁈 ▣═━╯`

global.despedida = `╭━═▣ 𒁈 𝗔𝘃𝗲𝗻𝗶𝘅-𝗠𝘂𝗹𝘁𝗶 𒁈 ▣═━╮
┃ 
┃ 👋 *¡Hasta pronto @user!*
┃ 
┃ 😢 Lamentamos que te vayas
┃ 🚪 Las puertas siempre están abiertas
┃ 💚 *¡Esperamos verte pronto!*
┃ 
╰━═▣ 𒁈 *Avenix-Multi* 𒁈 ▣═━╯`

global.promote = `╭━═▣ 𒁈 𝗔𝘃𝗲𝗻𝗶𝘅-𝗠𝘂𝗹𝘁𝗶 𒁈 ▣═━╮
┃ 
┃ 👑 *¡NUEVO ADMINISTRADOR!*
┃ 
┃ 🎉 Felicidades *@user*
┃ 💪 Ahora eres administrador del grupo
┃ 🛡️ *Usa tu poder sabiamente*
┃ 
╰━═▣ 𒁈 *Avenix-Multi* 𒁈 ▣═━╯`

global.demote = `╭━═▣ 𒁈 𝗔𝘃𝗲𝗻𝗶𝘅-𝗠𝘂𝗹𝘁𝗶 𒁈 ▣═━╮
┃ 
┃ 📉 *Administrador removido*
┃ 
┃ 👤 *@user* ya no es administrador
┃ 
╰━═▣ 𒁈 *Avenix-Multi* 𒁈 ▣═━╯`

// Mensajes de detección
global.sDesc = '✏️ *Se modificó la descripción del grupo*\n\n📝 Nueva descripción:\n@desc'
global.sSubject = '🏷️ *Se modificó el nombre del grupo*\n\n📝 Nuevo nombre:\n@subject'
global.sIcon = '🖼️ *Se cambió el icono del grupo*'
global.sRevoke = '🔗 *Se restableció el enlace del grupo*\n\n🔗 Nuevo enlace:\n@revoke'

// ═══════════════════════════════════════════════════════════════════════════════
// │                           SISTEMA DE TIEMPO                                 │
// ═══════════════════════════════════════════════════════════════════════════════

// Zona horaria (ajustar según tu ubicación)
global.timezone = 'America/Lima' // Perú (UTC-5)

// Funciones de tiempo
global.botdate = () => moment.tz(global.timezone).format('DD/MM/YYYY')
global.bottime = () => moment.tz(global.timezone).format('HH:mm:ss')
global.botDateTime = () => moment.tz(global.timezone).format('DD/MM/YYYY HH:mm:ss')

// Formato de fecha personalizado
global.formatDate = (date) => moment(date).tz(global.timezone).format('DD/MM/YYYY')
global.formatTime = (date) => moment(date).tz(global.timezone).format('HH:mm:ss')
global.formatDateTime = (date) => moment(date).tz(global.timezone).format('DD/MM/YYYY HH:mm:ss')

// ═══════════════════════════════════════════════════════════════════════════════
// │                              CONFIGURACIONES                                │
// ═══════════════════════════════════════════════════════════════════════════════

// Archivos y directorios
global.authFile = 'AvenixSession'
global.authFileJB = 'AvenixJadiBot'
global.dbFile = 'database'
global.sessionFolder = './sessions'
global.tempFolder = './tmp'
global.mediaFolder = './media'

// Tipos de documentos permitidos
global.pdoc = [
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/msword',
  'application/pdf',
  'text/rtf'
]

// Configuraciones de rendimiento
global.usePairingCode = true // Usar código de emparejamiento
global.useQR = false // Usar QR tradicional (si usePairingCode es false)
global.maxSessions = 50 // Máximo de sesiones de jadibot
global.autoRead = false // Leer mensajes automáticamente
global.selfMode = false // Modo self (solo responde al owner). No usar `global.self`: pisa el objeto global `self`
global.gconly = false // Solo funciona en grupos
global.pconly = false // Solo funciona en privado

// ═══════════════════════════════════════════════════════════════════════════════
// │                          CONFIGURACIÓN DE COMANDOS                          │
// ═══════════════════════════════════════════════════════════════════════════════

// Límites de uso
global.limitDaily = 100 // Límite diario de comandos para usuarios gratuitos
global.limitPremium = 1000 // Límite diario para premium
global.limitVIP = 99999 // Límite diario para VIP (casi ilimitado)

// Anti-spam
global.antiSpam = {
  enabled: true,
  maxCommands: 5, // Máximo de comandos en el tiempo especificado
  timeWindow: 10000, // Ventana de tiempo (10 segundos)
  banTime: 60000 // Tiempo de baneo temporal (1 minuto)
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                          SISTEMA DE NOTIFICACIONES                          │
// ═══════════════════════════════════════════════════════════════════════════════

global.notifications = {
  levelUp: true, // Notificar al subir de nivel
  achievements: true, // Notificar al desbloquear logros
  rankUp: true, // Notificar al subir de rango PvP
  guildInvite: true, // Notificar invitaciones a guild
  premiumExpire: true, // Notificar cuando expire premium
  warnExpire: true // Notificar cuando expire una advertencia
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                               FUNCIONES ÚTILES                              │
// ═══════════════════════════════════════════════════════════════════════════════

// Función para generar mensaje con estilo
global.estilo = (texto) => {
  return {
    key: {
      fromMe: false,
      participant: '0@s.whatsapp.net'
    },
    message: {
      orderMessage: {
        itemCount: -999999,
        status: 1,
        surface: 1,
        message: texto,
        orderTitle: '𒁈 Avenix-Multi',
        thumbnail: global.catalogo,
        sellerJid: '0@s.whatsapp.net'
      }
    }
  }
}

// Función para formatear números
global.formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// Función para obtener rango PvP por rating
global.getPvPRank = (rating) => {
  const ranks = Object.keys(global.pvpRanks)
    .map(Number)
    .sort((a, b) => b - a)
  
  for (const minRating of ranks) {
    if (rating >= minRating) {
      return global.pvpRanks[minRating]
    }
  }
  return 'Sin Rango'
}

// Función para calcular nivel requerido para experiencia
global.xpToLevel = (xp) => {
  return Math.floor(Math.sqrt(xp / global.multiplier))
}

// Función para calcular experiencia requerida para nivel
global.levelToXp = (level) => {
  return Math.floor(Math.pow(level, 2) * global.multiplier)
}

// Función para generar ID único
global.generateId = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15)
}

// Función para verificar si un usuario tiene un badge
global.hasBadge = (user, badgeName) => {
  return user.badges?.includes(badgeName) || false
}

// Función para añadir badge a usuario
global.addBadge = (user, badgeName) => {
  if (!user.badges) user.badges = []
  if (!user.badges.includes(badgeName)) {
    user.badges.push(badgeName)
    return true
  }
  return false
}

// Función para remover badge de usuario
global.removeBadge = (user, badgeName) => {
  if (!user.badges) return false
  const index = user.badges.indexOf(badgeName)
  if (index > -1) {
    user.badges.splice(index, 1)
    return true
  }
  return false
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                             MENSAJES DE ROLES                               │
// ═══════════════════════════════════════════════════════════════════════════════

global.roleMessages = {
  rowner: '👑 Creador Supremo',
  owner: '🔱 Propietario',
  dev: '💻 Desarrollador',
  mod: '⚙️ Moderador',
  helper: '🛠️ Helper',
  contributor: '⭐ Contributor',
  betaTester: '🧪 Beta Tester',
  donator: '💝 Donador',
  partner: '🤝 Partner',
  influencer: '🌟 Influencer',
  premium: '💎 Premium',
  vip: '⭐ VIP',
  verified: '✅ Verificado',
  user: '👤 Usuario'
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                             AUTO-RELOAD                                     │
// ═══════════════════════════════════════════════════════════════════════════════

const file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(paint.greenBright("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"))
  console.log(paint.greenBright("📁 Config actualizado: 'config.ts'"))
  console.log(paint.cyan("🔄 Reiniciando configuración..."))
  console.log(paint.greenBright("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"))
  import(`${pathToFileURL(file).href}?update=${Date.now()}`).catch(console.error)
})

// ═══════════════════════════════════════════════════════════════════════════════
// │                             MENSAJE DE INICIO                               │
// ═══════════════════════════════════════════════════════════════════════════════

console.log(paint.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
console.log(paint.cyan('         𒁈 AVENIX-MULTI V6.5.0 𒁈'))
console.log(paint.cyan('     Configuración Completa Cargada'))
console.log(paint.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
console.log(paint.green('✅ Sistema de 14 roles configurado'))
console.log(paint.green('✅ Sistema RPG completo habilitado'))
console.log(paint.green('✅ Sistema de Guild/Clan listo'))
console.log(paint.green('✅ Sistema PvP con ELO configurado'))
console.log(paint.green('✅ Sistema de logros activado'))
console.log(paint.green('✅ Sistema de badges configurado'))
console.log(paint.green('✅ Economía múltiple habilitada'))
console.log(paint.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
console.log(paint.yellow('💡 Recuerda configurar los roles en:'))
console.log(paint.yellow('   global.owner, global.devs, global.mods, etc.'))
console.log(paint.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
console.log(paint.magenta('🚀 Bot listo para iniciar'))
console.log(paint.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))
