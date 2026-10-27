// start.ts — proceso del bot (lanzado por index.ts)
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1'
import './config.js'
import { spawn } from 'child_process'
import { existsSync, mkdirSync, promises as fsp, readFileSync, readdirSync, renameSync, watch } from 'fs'
import path, { join } from 'path'
import { createInterface } from 'readline'
import { fileURLToPath, pathToFileURL } from 'url'
import { format, parseArgs } from 'util'
import { Boom } from '@hapi/boom'
import {
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  jidNormalizedUser,
  makeCacheableSignalKeyStore
} from '@whiskeysockets/baileys'
import type { BaileysEventMap, UserFacingSocketConfig } from '@whiskeysockets/baileys'
import { parsePhoneNumber } from 'awesome-phonenumber'
import NodeCache from 'node-cache'
import pino from 'pino'
import qrcode from 'qrcode'
import { hasSession, useStrenorAuthState } from '../lib/auth.js'
import paint from '../lib/paint.js'
import { StrenorDatabase, closeAll } from '../lib/storage.js'
import { makeWASocket, protoType, serialize } from '../lib/simple.js'
import type { AvenixSocket, DatabaseSchema, Plugin } from '../types/index.js'
import * as handlerModule from './handler.js'

type HandlerModule = typeof handlerModule

// ═══════════════════════════════════════════════════
// CONFIGURACIÓN GLOBAL
// ═══════════════════════════════════════════════════
protoType()
serialize()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const EXT = path.extname(fileURLToPath(import.meta.url)) // '.ts' con tsx, '.js' compilado

global.filenameOf = (pathURL = import.meta.url, rmPrefix = process.platform !== 'win32') =>
  rmPrefix ? (pathURL.startsWith('file://') ? fileURLToPath(pathURL) : pathURL) : pathToFileURL(pathURL).toString()
global.dirnameOf = (pathURL: string) => path.dirname(global.filenameOf(pathURL, true))

global.API = (name, apiPath = '/', query = {}, apikeyqueryname) => {
  const base = global.APIs[name] ?? name
  const params = { ...query, ...(apikeyqueryname ? { [apikeyqueryname]: global.APIKeys[base] } : {}) }
  return base + apiPath + (Object.keys(params).length ? '?' + new URLSearchParams(params) : '')
}

global.timestamp = { start: new Date() }

// Argumentos: `--flag`, `--key=valor` o palabras sueltas (`qr`, `code`)
const { values: cliOpts, positionals } = parseArgs({ args: process.argv.slice(2), strict: false, allowPositionals: true })
global.opts = { ...cliOpts, _: positionals }
global.prefix = /^[#.!/]/

// ═══════════════════════════════════════════════════
// BASE DE DATOS (strenor, binaria)
// ═══════════════════════════════════════════════════
const DEFAULT_DATA: DatabaseSchema = { users: {}, chats: {}, stats: {}, msgs: {}, sticker: {}, settings: {} }
const LEGACY_DB_PATH = './storage/database/database.json'

global.db = new StrenorDatabase<DatabaseSchema>('database', DEFAULT_DATA)
let dbLoading: Promise<DatabaseSchema> | null = null

global.loadDatabase = function loadDatabase() {
  dbLoading ||= (async () => {
    await global.db.read()
    await migrateLegacyDatabase()
    return global.db.data
  })()
  return dbLoading
}

/** Importa una única vez la base de datos JSON de versiones anteriores. */
async function migrateLegacyDatabase() {
  if (!existsSync(LEGACY_DB_PATH)) return
  try {
    const legacy = JSON.parse(readFileSync(LEGACY_DB_PATH, 'utf8')) as Partial<DatabaseSchema>
    const changes = await global.db.import(legacy)
    renameSync(LEGACY_DB_PATH, `${LEGACY_DB_PATH}.migrated`)
    console.log(paint.cyan(`🔄 Base de datos JSON migrada a strenor (${changes} registros). Respaldo: ${LEGACY_DB_PATH}.migrated`))
  } catch (e) {
    console.error(paint.red('❌ No se pudo migrar la base de datos JSON antigua:'), e)
  }
}

await global.loadDatabase()

// ═══════════════════════════════════════════════════
// AUTENTICACIÓN (strenor, binaria)
// ═══════════════════════════════════════════════════
const sessionDir = global.sessionName || 'sessions'
const credsExist = hasSession(sessionDir)
const { state, saveCreds } = await useStrenorAuthState(sessionDir)
const msgRetryCounterCache = new NodeCache()
const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: undefined }))

const methodCodeQR = positionals.includes('qr')
const methodCode = !!global.botNumber || positionals.includes('code')

const theme = {
  banner: paint.bgCyan.black,
  highlight: paint.bold.cyanBright,
  text: paint.bold.white,
  prompt: paint.bold.magentaBright
}

const rl = createInterface({ input: process.stdin, output: process.stdout })
const question = (texto: string) => new Promise<string>(resolve => rl.question(texto, resolve))

let opcion = methodCodeQR ? '1' : methodCode ? '2' : ''
if (!opcion && !credsExist) {
  do {
    opcion = (await question(
      theme.banner('𒁈 Elige un método de conexión:\n') +
      theme.highlight('1. Código QR\n') +
      theme.text('2. Código de 8 dígitos\n') +
      theme.prompt('➜ Opción: ')
    )).trim()
    if (!/^[12]$/.test(opcion)) console.log(paint.red('❌ Solo números 1 o 2 son válidos'))
  } while (opcion !== '1' && opcion !== '2')
}

const usePairingCode = opcion === '2'
let phoneNumber = ''
if (usePairingCode && !credsExist) {
  phoneNumber = (global.botNumber || '').replace(/\D/g, '')
  while (!isValidPhoneNumber(phoneNumber)) {
    phoneNumber = (await question(theme.prompt('𒁈 Ingresa tu número de WhatsApp (con código de país):\n➜ '))).replace(/\D/g, '')
    if (!isValidPhoneNumber(phoneNumber)) console.log(paint.red('❌ Número no válido'))
  }
}
rl.close()

console.info = () => {}
console.debug = () => {}

const silentLogger = pino({ level: 'silent' })

const connectionOptions: UserFacingSocketConfig = {
  logger: silentLogger,
  browser: usePairingCode ? Browsers.ubuntu('Edge') : [global.nameqr || 'Avenix-Multi', 'Edge', '20.0.04'],
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(state.keys, silentLogger)
  },
  markOnlineOnConnect: true,
  generateHighQualityLinkPreview: true,
  getMessage: async key => {
    const jid = jidNormalizedUser(key.remoteJid || '')
    const msg = global.conn?.chats[jid]?.messages?.[key.id || ''] || global.conn?.loadMessage(key.id || '')
    return msg?.message || undefined
  },
  msgRetryCounterCache,
  ...(version ? { version } : {})
}

global.conn = makeWASocket(connectionOptions)
global.conn.isInit = false
global.conn.well = false

if (usePairingCode && !global.conn.authState.creds.registered) {
  setTimeout(async () => {
    try {
      const code = await global.conn.requestPairingCode(phoneNumber)
      console.log(paint.cyan.bold('\n𒁈 Tu código de emparejamiento:'))
      console.log(paint.white.bold(`   ${code.match(/.{1,4}/g)?.join('-') || code}\n`))
    } catch (e) {
      console.error(paint.red('❌ No se pudo generar el código de emparejamiento:'), e)
    }
  }, 3000)
}

global.conn.logger.info('𒁈 Avenix-Multi inicializado')

// ═══════════════════════════════════════════════════
// AUTO-GUARDAR BASE DE DATOS
// ═══════════════════════════════════════════════════
if (!global.opts['test']) {
  setInterval(async () => {
    try {
      await global.db.write()
      if (global.opts['autocleartmp']) await clearTmp()
    } catch (e) {
      console.error(e)
    }
  }, 30_000)
}

// Guardado final y cierre limpio de los logs de strenor
let shuttingDown = false
async function shutdown(code = 0) {
  if (shuttingDown) return
  shuttingDown = true
  try { await global.db.write() } catch (e) { console.error(e) }
  closeAll()
  process.exit(code)
}
process.once('SIGINT', () => void shutdown(0))
process.once('SIGTERM', () => void shutdown(0))

// ═══════════════════════════════════════════════════
// EVENTO: ACTUALIZACIÓN DE CONEXIÓN
// ═══════════════════════════════════════════════════
async function connectionUpdate(this: AvenixSocket, update: BaileysEventMap['connection.update']) {
  const { connection, lastDisconnect, isNewLogin, qr } = update
  global.stopped = connection

  if (isNewLogin) this.isInit = true

  if (qr && !usePairingCode) {
    console.log(paint.yellow('\n📱 Escanea el código QR - Expira en 45 segundos\n'))
    console.log(await qrcode.toString(qr, { type: 'terminal', small: true }))
  }

  if (connection === 'open') {
    console.log(paint.green.bold('\n✓ 𒁈 AVENIX-MULTI CONECTADO EXITOSAMENTE 𒁈\n'))
    global.timestamp.connect = new Date()
  }

  if (connection !== 'close') return

  const reason = new Boom(lastDisconnect?.error).output.statusCode
  let reconnect = true
  switch (reason) {
    case DisconnectReason.badSession:
    case DisconnectReason.loggedOut:
      console.log(paint.red(`\n❌ Sesión inválida. Elimina la carpeta "${sessionDir}" y reconecta\n`))
      reconnect = false
      break
    case DisconnectReason.connectionReplaced:
      console.log(paint.yellow('\n⚠️ Conexión reemplazada por otra sesión\n'))
      reconnect = false
      break
    case DisconnectReason.connectionClosed:
      console.log(paint.magenta('\n⚠️ Conexión cerrada, reiniciando...\n'))
      break
    case DisconnectReason.connectionLost:
      console.log(paint.blue('\n⚠️ Conexión perdida, reconectando...\n'))
      break
    case DisconnectReason.restartRequired:
      console.log(paint.cyan('\n🔄 Reinicio requerido...\n'))
      break
    case DisconnectReason.timedOut:
      console.log(paint.yellow('\n⏱️ Tiempo agotado, reintentando...\n'))
      break
    default:
      console.log(paint.red(`\n⚠️ Desconexión desconocida (${reason || 'Sin razón'})\n`))
  }

  if (reconnect) await global.reloadHandler(true).catch(console.error)
}

process.on('uncaughtException', console.error)

// ═══════════════════════════════════════════════════
// RELOAD HANDLER
// ═══════════════════════════════════════════════════
let isInit = true
let handler: HandlerModule = handlerModule

const EVENTS = {
  'messages.upsert': 'handler',
  'connection.update': 'connectionUpdate',
  'creds.update': 'credsUpdate',
  'group-participants.update': 'participantsUpdate',
  'groups.update': 'groupsUpdate',
  'messages.delete': 'onDelete',
  'call': 'onCall'
} as const

global.reloadHandler = async function reloadHandler(restartConn = false) {
  try {
    const url = pathToFileURL(join(__dirname, `handler${EXT}`)).href
    const updated: HandlerModule = await import(`${url}?update=${Date.now()}`)
    if (typeof updated?.handler === 'function') handler = updated
  } catch (e) {
    console.error(e)
  }

  const conn = global.conn
  if (restartConn) {
    const oldChats = conn.chats
    try { conn.ws.close() } catch {}
    conn.ev.removeAllListeners(undefined as never)
    global.conn = makeWASocket(connectionOptions, { chats: oldChats })
    isInit = true
  }

  const current = global.conn
  if (!isInit) {
    for (const [event, key] of Object.entries(EVENTS)) {
      const listener = current[key]
      if (listener) current.ev.off(event as keyof BaileysEventMap, listener as never)
    }
  }

  current.handler = handler.handler.bind(current)
  current.connectionUpdate = connectionUpdate.bind(current)
  current.credsUpdate = saveCreds
  current.participantsUpdate = handler.participantsUpdate.bind(current)
  current.groupsUpdate = handler.groupsUpdate.bind(current)
  current.onDelete = handler.deleteUpdate.bind(current) as never
  current.onCall = handler.callUpdate.bind(current)

  for (const [event, key] of Object.entries(EVENTS)) {
    current.ev.on(event as keyof BaileysEventMap, current[key] as never)
  }

  isInit = false
  return true
}

// ═══════════════════════════════════════════════════
// JADIBOT - SUB-BOTS
// ═══════════════════════════════════════════════════
global.rutaJadiBot = path.resolve(global.authFileJB || 'AvenixJadiBot')
if (Array.isArray(global.conns)) {
  mkdirSync(global.rutaJadiBot, { recursive: true })
  const sesiones = readdirSync(global.rutaJadiBot).filter(dir => hasSession(join(global.rutaJadiBot, dir)))
  for (const sessionFolder of sesiones) console.log(paint.cyan(`🤖 Sesión de JadiBot encontrada: ${sessionFolder}`))
}

// ═══════════════════════════════════════════════════
// CARGAR PLUGINS
// ═══════════════════════════════════════════════════
const pluginFolder = join(__dirname, '../plugins')
const pluginFilter = (filename: string) => filename.endsWith(EXT) && !filename.endsWith('.d.ts')
global.plugins = {}

const sortPlugins = () => {
  global.plugins = Object.fromEntries(Object.entries(global.plugins).sort(([a], [b]) => a.localeCompare(b)))
}

async function importPlugin(filename: string, bust = false): Promise<Plugin> {
  const url = pathToFileURL(join(pluginFolder, filename)).href
  const module = await import(bust ? `${url}?update=${Date.now()}` : url)
  return module.default || module
}

async function filesInit() {
  const files = readdirSync(pluginFolder).filter(pluginFilter)
  const results = await Promise.allSettled(files.map(file => importPlugin(file)))
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') global.plugins[files[i]] = result.value
    else global.conn.logger.error(`Error al cargar plugin '${files[i]}'\n${format(result.reason)}`)
  })
  sortPlugins()
}

await filesInit()
console.log(paint.green(`✓ ${Object.keys(global.plugins).length} plugins cargados`))

global.reload = async (_ev, filename) => {
  if (!filename || !pluginFilter(filename)) return
  const dir = join(pluginFolder, filename)
  const logger = global.conn.logger

  if (!existsSync(dir)) {
    logger.warn(`Plugin eliminado: '${filename}'`)
    delete global.plugins[filename]
    return
  }
  logger.info(filename in global.plugins ? `Plugin actualizado: '${filename}'` : `Nuevo plugin: '${filename}'`)

  try {
    global.plugins[filename] = await importPlugin(filename, true)
  } catch (e) {
    logger.error(`Error al cargar plugin '${filename}'\n${format(e)}`)
  } finally {
    sortPlugins()
  }
}

Object.freeze(global.reload)
watch(pluginFolder, (event, filename) => void global.reload(event, filename))
await global.reloadHandler()

// ═══════════════════════════════════════════════════
// LIMPIEZA DE TEMPORALES
// ═══════════════════════════════════════════════════
const TMP_DIR = join(__dirname, '../../tmp')

async function clearTmp() {
  if (!existsSync(TMP_DIR)) return 0
  const files = await fsp.readdir(TMP_DIR)
  await Promise.all(files.map(file => fsp.rm(join(TMP_DIR, file), { force: true, recursive: true }).catch(() => null)))
  return files.length
}

setInterval(async () => {
  if (global.stopped === 'close' || !global.conn?.user) return
  const removed = await clearTmp()
  if (removed) console.log(paint.cyan(`\n🧹 ${removed} archivos temporales eliminados`))
}, 4 * 60_000)

// ═══════════════════════════════════════════════════
// VERIFICACIÓN DE NÚMERO DE TELÉFONO
// ═══════════════════════════════════════════════════
function isValidPhoneNumber(number: string) {
  if (!number) return false
  try {
    return parsePhoneNumber(`+${number.replace(/\D/g, '')}`).valid
  } catch {
    return false
  }
}

// ═══════════════════════════════════════════════════
// VERIFICAR HERRAMIENTAS EXTERNAS
// ═══════════════════════════════════════════════════
async function quickTest() {
  const probe = (cmd: string, args: string[] = []) => new Promise<boolean>(resolve => {
    const p = spawn(cmd, args)
    p.on('close', code => resolve(code !== 127))
    p.on('error', () => resolve(false))
    p.stdin?.end()
  })

  const [ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find] = await Promise.all([
    probe('ffmpeg', ['-version']),
    probe('ffprobe', ['-version']),
    probe('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-filter_complex', 'color', '-frames:v', '1', '-f', 'webp', '-']),
    probe('convert', ['-version']),
    probe('magick', ['-version']),
    probe('gm', ['version']),
    probe('find', ['--version'])
  ])
  global.support = Object.freeze({ ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find })
}

quickTest()
  .then(() => console.log(paint.green(`✓ Herramientas verificadas${global.support?.ffmpeg ? '' : paint.yellow(' (ffmpeg no encontrado: stickers y conversiones no funcionarán)')}`)))
  .catch(console.error)
