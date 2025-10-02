/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                            𒁈 AVENIX-MULTI V6.0.0 𒁈                         ┃
 * ┃                      LIB/PRINT.JS - SISTEMA DE LOGGING                      ┃
 * ┃                          Creado por: Hepein Oficial                          ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import { WAMessageStubType } from '@whiskeysockets/baileys'
import PhoneNumber from 'awesome-phonenumber'
import chalk from 'chalk'
import { appendFileSync, watchFile, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs'
import { join } from 'path'
import moment from 'moment-timezone'
import util from 'util'

const urlRegex = (await import('url-regex-safe')).default({ strict: false })

// ═══════════════════════════════════════════════════════════════════════════════
// │                              CONFIGURACIÓN                                  │
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  timezone: 'America/Lima',
  logsDir: join(process.cwd(), 'logs'),
  maxLogSize: 10 * 1024 * 1024, // 10MB
  maxLogFiles: 5,
  enableFileLogging: true,
  
  // Chats a ignorar
  IGNORE_CHATS: ['status@broadcast'],
  
  // Comandos a ignorar en logs
  IGNORE_COMMANDS: [/^\.ping$/i, /^\.estado$/i],
  
  // Palabras de alerta
  ALERT_WORDS: ['@admin', 'error', 'fallo', 'ayuda', 'problema', 'bug', 'crash']
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                         INICIALIZAR DIRECTORIOS                             │
// ═══════════════════════════════════════════════════════════════════════════════

if (!existsSync(CONFIG.logsDir)) {
  mkdirSync(CONFIG.logsDir, { recursive: true })
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                          FUNCIONES DE UTILIDAD                              │
// ═══════════════════════════════════════════════════════════════════════════════

function formatTime() {
  return moment().tz(CONFIG.timezone).format('HH:mm:ss DD/MM/YYYY')
}

function formatDate() {
  return moment().tz(CONFIG.timezone).format('YYYY-MM-DD')
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                          ROTACIÓN DE LOGS                                   │
// ═══════════════════════════════════════════════════════════════════════════════

async function rotateLogs() {
  try {
    const files = readdirSync(CONFIG.logsDir)
    const logFiles = files
      .filter(file => file.startsWith('avenix-') && file.endsWith('.log'))
      .map(file => ({
        name: file,
        path: join(CONFIG.logsDir, file),
        time: statSync(join(CONFIG.logsDir, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time)
    
    // Eliminar archivos antiguos
    while (logFiles.length >= CONFIG.maxLogFiles) {
      const oldFile = logFiles.pop()
      unlinkSync(oldFile.path)
    }
  } catch (error) {
    console.error('Error rotando logs:', error)
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                         LOGGING A ARCHIVO                                   │
// ═══════════════════════════════════════════════════════════════════════════════

async function writeToLogFile(message) {
  if (!CONFIG.enableFileLogging) return
  
  try {
    const logFile = join(CONFIG.logsDir, `avenix-${formatDate()}.log`)
    const timestamp = formatTime()
    const logEntry = `[${timestamp}] ${message}\n`
    
    appendFileSync(logFile, logEntry, 'utf8')
    
    // Verificar tamaño y rotar si es necesario
    const stats = statSync(logFile)
    if (stats.size > CONFIG.maxLogSize) {
      await rotateLogs()
    }
  } catch (error) {
    console.error('Error escribiendo log:', error)
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                    FORMATEAR TIPO DE MENSAJE STUB                           │
// ═══════════════════════════════════════════════════════════════════════════════

function formatMessageStubType(stubType) {
  const types = {
    'GROUP_CREATE': '📱 Grupo creado',
    'GROUP_PARTICIPANT_ADD': '➕ Usuario agregado',
    'GROUP_PARTICIPANT_REMOVE': '➖ Usuario eliminado',
    'GROUP_PARTICIPANT_PROMOTE': '⬆️ Usuario promovido a admin',
    'GROUP_PARTICIPANT_DEMOTE': '⬇️ Admin degradado',
    'GROUP_CHANGE_SUBJECT': '✏️ Nombre del grupo cambiado',
    'GROUP_CHANGE_DESCRIPTION': '📝 Descripción cambiada',
    'GROUP_CHANGE_ICON': '🖼️ Foto del grupo cambiada',
    'GROUP_CHANGE_INVITE_LINK': '🔗 Link del grupo cambiado',
    'GROUP_CHANGE_RESTRICT': '🔒 Configuración de mensajes cambiada',
    'GROUP_CHANGE_ANNOUNCE': '📢 Configuración de anuncios cambiada'
  }
  
  return types[stubType] || stubType || 'Mensaje normal'
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      PROCESAR MARKDOWN EN TEXTO                             │
// ═══════════════════════════════════════════════════════════════════════════════

function processMarkdown(text) {
  if (!text) return ''
  
  const mdRegex = /(?<=(?:^|[\s\n])\S?)(?:([*_~])(.+?)\1|```((?:.||[\n\r])+?)```)(?=\S?(?:[\s\n]|$))/g
  const mdFormat = (depth = 4) => (_, type, text, monospace) => {
    const types = { '_': 'italic', '*': 'bold', '~': 'strikethrough' }
    text = text || monospace
    return !types[type] || depth < 1 ? text : chalk[types[type]](text.replace(mdRegex, mdFormat(depth - 1)))
  }
  
  let processed = text.replace(/\u200e+/g, '')
  
  if (processed.length < 1024) {
    processed = processed.replace(urlRegex, url => chalk.blueBright(url))
  }
  
  processed = processed.replace(mdRegex, mdFormat(4))
  
  return processed
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                         FUNCIÓN PRINT PRINCIPAL                             │
// ═══════════════════════════════════════════════════════════════════════════════

export default async function print(m, conn = { user: {} }) {
  try {
    // Verificar filtros de ignorar
    if (CONFIG.IGNORE_CHATS.includes(m.chat)) return
    if (typeof m.text === 'string' && CONFIG.IGNORE_COMMANDS.some(rx => rx.test(m.text))) return
    
    // Obtener información básica
    const _name = await conn.getName(m.sender)
    const sender = PhoneNumber('+' + m.sender.replace('@s.whatsapp.net', '')).getNumber('international') + (_name ? ' ~' + _name : '')
    const chat = await conn.getName(m.chat)
    
    // Calcular tamaño del mensaje
    const filesize = (m.msg ?
      m.msg.vcard ? m.msg.vcard.length :
      m.msg.fileLength ? (m.msg.fileLength.low || m.msg.fileLength) :
      m.msg.axolotlSenderKeyDistributionMessage ? m.msg.axolotlSenderKeyDistributionMessage.length :
      m.text ? m.text.length : 0
      : m.text ? m.text.length : 0) || 0
    
    // Información del usuario
    const user = global.DATABASE?.data?.users?.[m.sender] || {}
    const me = PhoneNumber('+' + (conn.user?.jid || '').replace('@s.whatsapp.net', '')).getNumber('international')
    const isMainBot = global.conn?.user?.jid === conn.user?.jid
    
    // Tipo de chat
    const chatType = m.chat.endsWith('@g.us') ? '👥 GRUPO' : 
                     m.chat.endsWith('@newsletter') ? '📢 CANAL' : 
                     '💬 PRIVADO'
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                           CONSTRUIR HEADER                                  │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    const header = `
(つ▀¯▀)つ━━━━━━━━━━━━𖡼 𒁈 AVENIX-MULTI 𒁈 𖡼
 ❖ ${chalk.white.bold('Bot:')} ${chalk.cyan.bold(me)} ${isMainBot ? chalk.green('(Principal)') : chalk.yellow('(SubBot)')}
 ❖ ${chalk.white.bold('Horario:')} ${chalk.black.bgGreen(formatTime())}
 ❖ ${chalk.white.bold('Acción:')} ${chalk.magenta(formatMessageStubType(WAMessageStubType[m.messageStubType]))}
 ❖ ${chalk.white.bold('Usuario:')} ${chalk.white(sender)}
 ❖ ${chalk.white.bold('Rol:')} ${chalk.bgMagentaBright.bold(user?.role || 'Novato')} | Premium: ${user?.premiumTime > 0 ? '✅' : '❌'}
 ❖ ${chalk.white.bold('Recursos:')} ${chalk.yellow('Exp:')} ${user?.exp || 0} | ${chalk.green('Nivel:')} ${user?.level || 0} | ${chalk.cyan('💎:')} ${user?.diamond || 0}
 ❖ ${chalk.white.bold('Chat:')} ${chatType} ${chalk.green(m.chat.endsWith('@g.us') ? (chat || m.chat) : (chat || 'Sin nombre'))}
 ❖ ${chalk.white.bold('Peso del mensaje:')} ${chalk.red(filesize)} ${chalk.yellow('(' + formatFileSize(filesize) + ')')}
 ❖ ${chalk.white.bold('Tipo de mensaje:')} ${chalk.bgBlueBright.bold('[' + (m.mtype ? m.mtype.replace(/message$/i, '').toUpperCase() : 'TEXT') + ']')}
(つ▀¯▀)つ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
    
    console.log(header)
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                          PROCESAR CONTENIDO                                 │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    if (typeof m.text === 'string' && m.text) {
      let log = processMarkdown(m.text)
      
      // Procesar menciones
      if (m.mentionedJid && m.mentionedJid.length > 0) {
        const names = await Promise.all(m.mentionedJid.map(jid => conn.getName(jid)))
        for (let i = 0; i < m.mentionedJid.length; i++) {
          log = log.replace('@' + m.mentionedJid[i].split`@`[0], chalk.magenta('@' + names[i]))
        }
      }
      
      // Verificar palabras de alerta
      const isAlert = CONFIG.ALERT_WORDS.some(word => log.toLowerCase().includes(word.toLowerCase()))
      
      if (isAlert) {
        console.log(chalk.bgRed.white.bold(' ⚠️ ALERTA ') + ' ' + chalk.red.bold(log))
      } else if (m.isCommand) {
        console.log(chalk.bgCyan.black(' CMD ') + ' ' + chalk.cyan.bold(log))
      } else {
        console.log(chalk.white('💬 ' + log))
      }
      
      // Guardar en archivo
      await writeToLogFile(`${chatType} | ${sender} > ${m.text}`)
    }
    
    // Información de archivos multimedia
    if (/document/i.test(m.mtype)) {
      const fileName = m.msg.fileName || m.msg.displayName || 'Documento sin nombre'
      console.log(chalk.yellow(`📄 Documento: ${fileName}`))
    } else if (/ContactsArray/i.test(m.mtype)) {
      console.log(chalk.blue('👨‍👩‍👧‍👦 Contactos compartidos'))
    } else if (/contact/i.test(m.mtype)) {
      console.log(chalk.blue(`👨 Contacto: ${m.msg.displayName || 'Sin nombre'}`))
    } else if (/audio/i.test(m.mtype)) {
      const duration = m.msg.seconds || 0
      const minutes = Math.floor(duration / 60).toString().padStart(2, '0')
      const seconds = (duration % 60).toString().padStart(2, '0')
      console.log(chalk.green(`${m.msg.ptt ? '🎤 Audio de voz' : '🎵 Audio'} (${minutes}:${seconds})`))
    } else if (/video/i.test(m.mtype)) {
      console.log(chalk.magenta(`📹 Video ${m.msg.caption ? '(con caption)' : ''}`))
    } else if (/image/i.test(m.mtype)) {
      console.log(chalk.cyan(`🖼️ Imagen ${m.msg.caption ? '(con caption)' : ''}`))
    } else if (/sticker/i.test(m.mtype)) {
      console.log(chalk.yellow('🎭 Sticker'))
    }
    
    // Mensaje citado
    if (m.quoted) {
      console.log(chalk.gray('↪️ Responde a un mensaje'))
    }
    
    console.log('') // Línea en blanco
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                           ESTADÍSTICAS                                      │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    if (!global.msgCount) global.msgCount = 0
    global.msgCount++
    
    if (global.msgCount % 100 === 0) {
      const uptime = process.uptime()
      const hours = Math.floor(uptime / 3600)
      const minutes = Math.floor((uptime % 3600) / 60)
      
      console.log(chalk.bgGreen.black.bold(' 📊 ESTADÍSTICAS '))
      console.log(chalk.green(`📨 Mensajes procesados: ${global.msgCount}`))
      console.log(chalk.cyan(`⏰ Uptime: ${hours}h ${minutes}m`))
      console.log(chalk.yellow(`👥 Usuarios en DB: ${Object.keys(global.DATABASE?.data?.users || {}).length}`))
      console.log(chalk.magenta(`💬 Chats activos: ${Object.keys(global.DATABASE?.data?.chats || {}).length}\n`))
      
      await writeToLogFile(`STATS: ${global.msgCount} mensajes | Uptime: ${hours}h ${minutes}m`)
    }
    
  } catch (error) {
    console.error(chalk.red('𒁈 Error en print:'), error)
    await writeToLogFile(`ERROR en print: ${error.message}`)
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                           WATCH FILE                                        │
// ═══════════════════════════════════════════════════════════════════════════════

const file = global.__filename(import.meta.url)
watchFile(file, () => {
  console.log(chalk.cyan.bold("𒁈 Actualizado: 'lib/print.js'"))
})
