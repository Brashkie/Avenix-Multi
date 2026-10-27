/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                            𒁈 AVENIX-MULTI V6.0.0 𒁈                         ┃
 * ┃                      LIB/PRINT.TS - SISTEMA DE LOGGING                      ┃
 * ┃                          Creado por: Hepein Oficial                          ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import { existsSync, mkdirSync, promises as fsp } from 'fs'
import { join } from 'path'
import { WAMessageStubType } from '@whiskeysockets/baileys'
import moment from 'moment-timezone'
import urlRegexSafe from 'url-regex-safe'
import paint from './paint.js'
import { formatPhone } from './simple.js'
import type { AvenixSocket, SMessage } from '../types/index.js'

const urlRegex = urlRegexSafe({ strict: false })

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

if (!existsSync(CONFIG.logsDir)) mkdirSync(CONFIG.logsDir, { recursive: true })

let msgCount = 0

// ═══════════════════════════════════════════════════════════════════════════════
// │                          FUNCIONES DE UTILIDAD                              │
// ═══════════════════════════════════════════════════════════════════════════════

const formatTime = () => moment().tz(CONFIG.timezone).format('HH:mm:ss DD/MM/YYYY')
const formatDate = () => moment().tz(CONFIG.timezone).format('YYYY-MM-DD')

function formatFileSize(bytes: number) {
  if (!bytes) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1)
  return `${(bytes / 1024 ** i).toFixed(1)} ${sizes[i]}`
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                          ROTACIÓN DE LOGS                                   │
// ═══════════════════════════════════════════════════════════════════════════════

async function rotateLogs() {
  try {
    const files = await fsp.readdir(CONFIG.logsDir)
    const logFiles = await Promise.all(
      files
        .filter(file => file.startsWith('avenix-') && file.endsWith('.log'))
        .map(async name => {
          const path = join(CONFIG.logsDir, name)
          return { path, time: (await fsp.stat(path)).mtimeMs }
        })
    )
    logFiles.sort((a, b) => b.time - a.time)
    for (const old of logFiles.slice(CONFIG.maxLogFiles - 1)) await fsp.unlink(old.path).catch(() => null)
  } catch (error) {
    console.error('Error rotando logs:', error)
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                         LOGGING A ARCHIVO                                   │
// ═══════════════════════════════════════════════════════════════════════════════

async function writeToLogFile(message: string) {
  if (!CONFIG.enableFileLogging) return
  try {
    const logFile = join(CONFIG.logsDir, `avenix-${formatDate()}.log`)
    await fsp.appendFile(logFile, `[${formatTime()}] ${message}\n`, 'utf8')
    const stats = await fsp.stat(logFile)
    if (stats.size > CONFIG.maxLogSize) await rotateLogs()
  } catch (error) {
    console.error('Error escribiendo log:', error)
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                    FORMATEAR TIPO DE MENSAJE STUB                           │
// ═══════════════════════════════════════════════════════════════════════════════

const STUB_LABELS: Record<string, string> = {
  GROUP_CREATE: '📱 Grupo creado',
  GROUP_PARTICIPANT_ADD: '➕ Usuario agregado',
  GROUP_PARTICIPANT_REMOVE: '➖ Usuario eliminado',
  GROUP_PARTICIPANT_PROMOTE: '⬆️ Usuario promovido a admin',
  GROUP_PARTICIPANT_DEMOTE: '⬇️ Admin degradado',
  GROUP_CHANGE_SUBJECT: '✏️ Nombre del grupo cambiado',
  GROUP_CHANGE_DESCRIPTION: '📝 Descripción cambiada',
  GROUP_CHANGE_ICON: '🖼️ Foto del grupo cambiada',
  GROUP_CHANGE_INVITE_LINK: '🔗 Link del grupo cambiado',
  GROUP_CHANGE_RESTRICT: '🔒 Configuración de mensajes cambiada',
  GROUP_CHANGE_ANNOUNCE: '📢 Configuración de anuncios cambiada'
}

function formatMessageStubType(stubType: number | null | undefined) {
  if (!stubType) return 'Mensaje normal'
  const name = WAMessageStubType[stubType]
  return STUB_LABELS[name] || name || 'Mensaje normal'
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      PROCESAR MARKDOWN EN TEXTO                             │
// ═══════════════════════════════════════════════════════════════════════════════

const MD_REGEX = /(?<=(?:^|[\s\n])\S?)(?:([*_~])(.+?)\1|```((?:.|[\n\r])+?)```)(?=\S?(?:[\s\n]|$))/g
const MD_STYLES = { '_': paint.italic, '*': paint.bold, '~': paint.strikethrough } as const

function mdFormat(depth = 4) {
  return (_: string, type: string, text: string, monospace: string): string => {
    const content = text || monospace
    const style = MD_STYLES[type as keyof typeof MD_STYLES]
    return !style || depth < 1 ? content : style(content.replace(MD_REGEX, mdFormat(depth - 1)))
  }
}

function processMarkdown(text: string) {
  if (!text) return ''
  let processed = text.replace(/‎+/g, '')
  if (processed.length < 1024) processed = processed.replace(urlRegex, url => paint.blueBright(url))
  return processed.replace(MD_REGEX, mdFormat(4))
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                         FUNCIÓN PRINT PRINCIPAL                             │
// ═══════════════════════════════════════════════════════════════════════════════

export default async function print(m: SMessage, conn: AvenixSocket) {
  try {
    if (CONFIG.IGNORE_CHATS.includes(m.chat)) return
    if (m.text && CONFIG.IGNORE_COMMANDS.some(rx => rx.test(m.text))) return

    const [senderName, chat] = await Promise.all([conn.getName(m.sender), conn.getName(m.chat)])
    const sender = formatPhone(m.sender.split('@')[0]) + (senderName ? ' ~' + senderName : '')

    const msg = m.msg
    const filesize = Number(
      msg?.vcard?.length ??
      msg?.fileLength?.low ?? msg?.fileLength ??
      m.text?.length ?? 0
    ) || 0

    const user = global.db.data?.users?.[m.sender]
    const me = formatPhone((conn.user?.jid || '').split('@')[0])
    const isMainBot = global.conn?.user?.jid === conn.user?.jid
    const chatType = m.chat.endsWith('@g.us') ? '👥 GRUPO' : m.chat.endsWith('@newsletter') ? '📢 CANAL' : '💬 PRIVADO'

    console.log(`
(つ▀¯▀)つ━━━━━━━━━━━━𖡼 𒁈 AVENIX-MULTI 𒁈 𖡼
 ❖ ${paint.white.bold('Bot:')} ${paint.cyan.bold(me)} ${isMainBot ? paint.green('(Principal)') : paint.yellow('(SubBot)')}
 ❖ ${paint.white.bold('Horario:')} ${paint.black.bgGreen(formatTime())}
 ❖ ${paint.white.bold('Acción:')} ${paint.magenta(formatMessageStubType(m.messageStubType))}
 ❖ ${paint.white.bold('Usuario:')} ${paint.white(sender)}
 ❖ ${paint.white.bold('Rol:')} ${paint.bgMagentaBright.bold(user?.role || 'Novato')} | Premium: ${(user?.premiumTime ?? 0) > 0 ? '✅' : '❌'}
 ❖ ${paint.white.bold('Recursos:')} ${paint.yellow('Exp:')} ${user?.exp || 0} | ${paint.green('Nivel:')} ${user?.level || 0} | ${paint.cyan('💎:')} ${user?.diamond || 0}
 ❖ ${paint.white.bold('Chat:')} ${chatType} ${paint.green(chat || (m.isGroup ? m.chat : 'Sin nombre'))}
 ❖ ${paint.white.bold('Peso del mensaje:')} ${paint.red(filesize)} ${paint.yellow('(' + formatFileSize(filesize) + ')')}
 ❖ ${paint.white.bold('Tipo de mensaje:')} ${paint.bgBlueBright.bold('[' + (m.mtype ? m.mtype.replace(/message$/i, '').toUpperCase() : 'TEXT') + ']')}
(つ▀¯▀)つ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)

    if (m.text) {
      let log = processMarkdown(m.text)
      if (m.mentionedJid.length) {
        const names = await Promise.all(m.mentionedJid.map(jid => conn.getName(jid)))
        m.mentionedJid.forEach((jid, i) => {
          log = log.replace('@' + jid.split('@')[0], paint.magenta('@' + names[i]))
        })
      }

      const lower = log.toLowerCase()
      if (CONFIG.ALERT_WORDS.some(word => lower.includes(word))) {
        console.log(paint.bgRed.white.bold(' ⚠️ ALERTA ') + ' ' + paint.red.bold(log))
      } else if (m.isCommand) {
        console.log(paint.bgCyan.black(' CMD ') + ' ' + paint.cyan.bold(log))
      } else {
        console.log(paint.white('💬 ' + log))
      }
      void writeToLogFile(`${chatType} | ${sender} > ${m.text}`)
    }

    if (/document/i.test(m.mtype)) {
      console.log(paint.yellow(`📄 Documento: ${msg?.fileName || msg?.displayName || 'Documento sin nombre'}`))
    } else if (/ContactsArray/i.test(m.mtype)) {
      console.log(paint.blue('👨‍👩‍👧‍👦 Contactos compartidos'))
    } else if (/contact/i.test(m.mtype)) {
      console.log(paint.blue(`👨 Contacto: ${msg?.displayName || 'Sin nombre'}`))
    } else if (/audio/i.test(m.mtype)) {
      const duration = msg?.seconds || 0
      const minutes = Math.floor(duration / 60).toString().padStart(2, '0')
      const seconds = (duration % 60).toString().padStart(2, '0')
      console.log(paint.green(`${msg?.ptt ? '🎤 Audio de voz' : '🎵 Audio'} (${minutes}:${seconds})`))
    } else if (/video/i.test(m.mtype)) {
      console.log(paint.magenta(`📹 Video ${msg?.caption ? '(con caption)' : ''}`))
    } else if (/image/i.test(m.mtype)) {
      console.log(paint.cyan(`🖼️ Imagen ${msg?.caption ? '(con caption)' : ''}`))
    } else if (/sticker/i.test(m.mtype)) {
      console.log(paint.yellow('🎭 Sticker'))
    }

    if (m.quoted) console.log(paint.gray('↪️ Responde a un mensaje'))
    console.log('')

    // ── Estadísticas cada 100 mensajes ─────────────────────────────────────────
    if (++msgCount % 100 === 0) {
      const uptime = process.uptime()
      const hours = Math.floor(uptime / 3600)
      const minutes = Math.floor((uptime % 3600) / 60)
      console.log(paint.bgGreen.black.bold(' 📊 ESTADÍSTICAS '))
      console.log(paint.green(`📨 Mensajes procesados: ${msgCount}`))
      console.log(paint.cyan(`⏰ Uptime: ${hours}h ${minutes}m`))
      console.log(paint.yellow(`👥 Usuarios en DB: ${Object.keys(global.db.data?.users || {}).length}`))
      console.log(paint.magenta(`💬 Chats activos: ${Object.keys(global.db.data?.chats || {}).length}\n`))
      void writeToLogFile(`STATS: ${msgCount} mensajes | Uptime: ${hours}h ${minutes}m`)
    }
  } catch (error) {
    console.error(paint.red('𒁈 Error en print:'), error)
    void writeToLogFile(`ERROR en print: ${error?.message}`)
  }
}
