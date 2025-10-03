/**
 * ╔═══════════════════════════════════════════════════╗
 * ║    AVENIX-MULTI v6.0.0 - START.JS                 ║
 * ║    Conexión Principal del Bot                     ║
 * ║    Creado por: Hepein Oficial                     ║
 * ║    WhatsApp: +51916360161                         ║
 * ╚═══════════════════════════════════════════════════╝
 */

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1'

import './config.js'
// ✅ CORRECCIÓN: Importar cluster como default
import cluster from 'cluster'
const { setupMaster, fork } = cluster
import {watchFile, unwatchFile, existsSync, mkdirSync, readdirSync, statSync, unlinkSync, readFileSync} from 'fs'
import {fileURLToPath, pathToFileURL} from 'url'
import {platform} from 'process'
import * as ws from 'ws'
import {createRequire} from 'module'
import path, {join, dirname} from 'path'
import yargs from 'yargs'
import {spawn} from 'child_process'
import lodash from 'lodash'
import chalk from 'chalk'
import syntaxerror from 'syntax-error'
import {format} from 'util'
import pino from 'pino'
import {Boom} from '@hapi/boom'
import {makeWASocket, protoType, serialize} from './lib/simple.js'
import {Low, JSONFile} from 'lowdb'
import store from './lib/store.js'
import readline from 'readline'
import NodeCache from 'node-cache'
import pkg from 'google-libphonenumber'

const {PhoneNumberUtil} = pkg
const phoneUtil = PhoneNumberUtil.getInstance()
const {proto} = (await import('@whiskeysockets/baileys')).default
const {DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, jidNormalizedUser} = await import('@whiskeysockets/baileys')
const {CONNECTING} = ws
const {chain} = lodash

// ═══════════════════════════════════════════════════
// CONFIGURACIÓN GLOBAL
// ═══════════════════════════════════════════════════
protoType()
serialize()

global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
  return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString()
}

global.__dirname = function dirname(pathURL) {
  return path.dirname(global.__filename(pathURL, true))
}

global.__require = function require(dir = import.meta.url) {
  return createRequire(dir)
}

global.API = (name, path = '/', query = {}, apikeyqueryname) =>
  (name in global.APIs ? global.APIs[name] : name) +
  path +
  (query || apikeyqueryname ? '?' + new URLSearchParams(Object.entries({...query, ...(apikeyqueryname ? {[apikeyqueryname]: global.APIKeys[name in global.APIs ? global.APIs[name] : name]} : {})})) : '')

global.timestamp = {start: new Date()}

const __dirname = global.__dirname(import.meta.url)

global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
global.prefix = new RegExp('^[' + (opts['prefix'] || '‎xzXZ/i!#$%+£¢€¥^°=¶∆×÷π√✓©®:;?&.\\-.@').replace(/[|\\{}()[\]^$+*?.\-\^]/g, '\\$&') + ']')

// ═══════════════════════════════════════════════════
// ✅ ASEGURAR QUE EXISTAN DIRECTORIOS CRÍTICOS
// ═══════════════════════════════════════════════════
const directoriosCriticos = ['./storage/database', './sessions', './tmp']
directoriosCriticos.forEach(dir => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
    console.log(chalk.green(`✓ Directorio creado: ${dir}`))
  }
})

// ═══════════════════════════════════════════════════
// BASE DE DATOS
// ═══════════════════════════════════════════════════
global.db = new Low(new JSONFile('./storage/database/database.json'))

global.DATABASE = global.db
global.loadDatabase = async function loadDatabase() {
  if (global.db.READ) {
    return new Promise((resolve) =>
      setInterval(async function() {
        if (!global.db.READ) {
          clearInterval(this)
          resolve(global.db.data == null ? global.loadDatabase() : global.db.data)
        }
      }, 1000)
    )
  }
  if (global.db.data !== null) return
  global.db.READ = true
  await global.db.read().catch(console.error)
  global.db.READ = null
  global.db.data = {
    users: {},
    chats: {},
    stats: {},
    msgs: {},
    sticker: {},
    settings: {},
    ...(global.db.data || {})
  }
  global.db.chain = chain(global.db.data)
}

loadDatabase()

// ═══════════════════════════════════════════════════
// AUTENTICACIÓN
// ═══════════════════════════════════════════════════
const {state, saveCreds} = await useMultiFileAuthState(global.sessionName || 'sessions')
const msgRetryCounterCache = new NodeCache()
const {version} = await fetchLatestBaileysVersion()

let phoneNumber = global.botNumber

const methodCodeQR = process.argv.includes('qr')
const methodCode = !!phoneNumber || process.argv.includes('code')
const MethodMobile = process.argv.includes('mobile')

const rl = readline.createInterface({input: process.stdin, output: process.stdout})
const question = (texto) => new Promise((resolver) => rl.question(texto, resolver))

let opcion
if (methodCodeQR) opcion = '1'

const credsExist = existsSync('./sessions/creds.json')

if (!methodCodeQR && !methodCode && !credsExist) {
  do {
    opcion = await question(
      chalk.cyan.bold('𒁈 Elige un método de conexión:\n') +
      chalk.white('1. Código QR\n') +
      chalk.white('2. Código de 8 dígitos\n') +
      chalk.magenta('➜ Opción: ')
    )

    if (!/^[1-2]$/.test(opcion)) {
      console.log(chalk.red('❌ Solo números 1 o 2 son válidos'))
    }
  } while ((opcion !== '1' && opcion !== '2') || credsExist)
}

console.info = () => {}
console.debug = () => {}

const printQR = opcion === '1' || methodCodeQR
const connectionOptions = {
  logger: pino({level: 'silent'}),
  printQRInTerminal: printQR,
  mobile: MethodMobile,
  browser: ['Avenix-Multi', 'Chrome', '6.0.0'],
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(state.keys, pino({level: 'fatal'}).child({level: 'fatal'}))
  },
  markOnlineOnConnect: true,
  generateHighQualityLinkPreview: true,
  getMessage: async (clave) => {
    const jid = jidNormalizedUser(clave.remoteJid)
    const msg = await store.loadMessage(jid, clave.id)
    return msg?.message || ''
  },
  msgRetryCounterCache,
  defaultQueryTimeoutMs: undefined,
  version
}

global.conn = makeWASocket(connectionOptions)

// ═══════════════════════════════════════════════════
// MÉTODO DE CÓDIGO DE EMPAREJAMIENTO
// ═══════════════════════════════════════════════════
if (!credsExist) {
  if (opcion === '2' || methodCode) {
    opcion = '2'
    if (!conn.authState.creds.registered) {
      let addNumber
      if (!!phoneNumber) {
        addNumber = phoneNumber.replace(/[^0-9]/g, '')
      } else {
        do {
          phoneNumber = await question(chalk.cyan('𒁈 Ingresa tu número de WhatsApp:\n➜ '))
          phoneNumber = phoneNumber.replace(/\D/g, '')
          if (!phoneNumber.startsWith('+')) phoneNumber = `+${phoneNumber}`
        } while (!(await isValidPhoneNumber(phoneNumber)))
        rl.close()
        addNumber = phoneNumber.replace(/\D/g, '')
        setTimeout(async () => {
          let codeBot = await conn.requestPairingCode(addNumber)
          codeBot = codeBot?.match(/.{1,4}/g)?.join('-') || codeBot
          console.log(chalk.cyan.bold('\n𒁈 Tu código de emparejamiento:'))
          console.log(chalk.white.bold(`   ${codeBot}\n`))
        }, 3000)
      }
    }
  }
}

conn.isInit = false
conn.well = false

// ═══════════════════════════════════════════════════
// AUTO-GUARDAR BASE DE DATOS
// ═══════════════════════════════════════════════════
if (!opts['test']) {
  if (global.db) {
    setInterval(async () => {
      if (global.db.data) await global.db.write().catch(console.error)
      if (opts['autocleartmp']) {
        clearTmp()
      }
    }, 30000)
  }
}

// ═══════════════════════════════════════════════════
// EVENTO: ACTUALIZACIÓN DE CONEXIÓN
// ═══════════════════════════════════════════════════
async function connectionUpdate(update) {
  const {connection, lastDisconnect, isNewLogin, qr} = update
  const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
  global.stopped = connection

  if (isNewLogin) conn.isInit = true
  if (!global.db.data) loadDatabase()

  if ((qr && qr !== '0') || methodCodeQR) {
    if (opcion === '1' || methodCodeQR) {
      console.log(chalk.yellow('\n📱 Escanea el código QR - Expira en 45 segundos\n'))
    }
  }

  if (connection === 'open') {
    console.log(chalk.green.bold('\n✓ 𒁈 AVENIX-MULTI CONECTADO EXITOSAMENTE 𒁈\n'))
  }

  if (connection === 'close') {
    switch (reason) {
      case DisconnectReason.badSession:
      case DisconnectReason.loggedOut:
        console.log(chalk.red(`\n❌ Sesión inválida. Elimina la carpeta "sessions" y reconecta\n`))
        break
      case DisconnectReason.connectionClosed:
        console.log(chalk.magenta('\n⚠️ Conexión cerrada, reiniciando...\n'))
        break
      case DisconnectReason.connectionLost:
        console.log(chalk.blue('\n⚠️ Conexión perdida, reconectando...\n'))
        break
      case DisconnectReason.connectionReplaced:
        console.log(chalk.yellow('\n⚠️ Conexión reemplazada por otra sesión\n'))
        return
      case DisconnectReason.restartRequired:
        console.log(chalk.cyan('\n🔄 Reinicio requerido...\n'))
        break
      case DisconnectReason.timedOut:
        console.log(chalk.yellow('\n⏱️ Tiempo agotado, reintentando...\n'))
        break
      default:
        console.log(chalk.red(`\n⚠️ Desconexión desconocida (${reason || 'Sin razón'})\n`))
        break
    }

    if (conn?.ws?.socket === null) {
      await global.reloadHandler(true).catch(console.error)
      global.timestamp.connect = new Date()
    }
  }
}

process.on('uncaughtException', console.error)

// ═══════════════════════════════════════════════════
// RELOAD HANDLER
// ═══════════════════════════════════════════════════
let isInit = true
let handler = await import('./handler.js')

global.reloadHandler = async function(restatConn) {
  try {
    const Handler = await import(`./handler.js?update=${Date.now()}`).catch(console.error)
    if (Object.keys(Handler || {}).length) handler = Handler
  } catch (e) {
    console.error(e)
  }
  
  if (restatConn) {
    const oldChats = global.conn.chats
    try {
      global.conn.ws.close()
    } catch {}
    conn.ev.removeAllListeners()
    global.conn = makeWASocket(connectionOptions, {chats: oldChats})
    isInit = true
  }
  
  if (!isInit) {
    conn.ev.off('messages.upsert', conn.handler)
    conn.ev.off('connection.update', conn.connectionUpdate)
    conn.ev.off('creds.update', conn.credsUpdate)
  }
  
  conn.handler = handler.handler.bind(global.conn)
  conn.connectionUpdate = connectionUpdate.bind(global.conn)
  conn.credsUpdate = saveCreds.bind(global.conn, true)
  
  conn.ev.on('messages.upsert', conn.handler)
  conn.ev.on('connection.update', conn.connectionUpdate)
  conn.ev.on('creds.update', conn.credsUpdate)
  
  isInit = false
  return true
}

// ═══════════════════════════════════════════════════
// CARGAR PLUGINS
// ═══════════════════════════════════════════════════
const pluginFolder = global.__dirname(join(__dirname, './plugins'))
const pluginFilter = (filename) => /\.js$/.test(filename)
global.plugins = {}

async function filesInit() {
  for (const filename of readdirSync(pluginFolder).filter(pluginFilter)) {
    try {
      const file = global.__filename(join(pluginFolder, filename))
      const module = await import(file)
      global.plugins[filename] = module.default || module
    } catch (e) {
      conn.logger.error(e)
      delete global.plugins[filename]
    }
  }
}

filesInit()
  .then((_) => console.log(chalk.green(`✓ ${Object.keys(global.plugins).length} plugins cargados`)))
  .catch(console.error)

global.reload = async (_ev, filename) => {
  if (pluginFilter(filename)) {
    const dir = global.__filename(join(pluginFolder, filename), true)
    if (filename in global.plugins) {
      if (existsSync(dir)) {
        conn.logger.info(`Plugin actualizado: '${filename}'`)
      } else {
        conn.logger.warn(`Plugin eliminado: '${filename}'`)
        return delete global.plugins[filename]
      }
    } else {
      conn.logger.info(`Nuevo plugin: '${filename}'`)
    }
    
    const err = syntaxerror(readFileSync(dir), filename, {
      sourceType: 'module',
      allowAwaitOutsideFunction: true
    })
    
    if (err) {
      conn.logger.error(`Error de sintaxis en '${filename}'\n${format(err)}`)
    } else {
      try {
        const module = await import(`${global.__filename(dir)}?update=${Date.now()}`)
        global.plugins[filename] = module.default || module
      } catch (e) {
        conn.logger.error(`Error al cargar plugin '${filename}'\n${format(e)}`)
      } finally {
        global.plugins = Object.fromEntries(
          Object.entries(global.plugins).sort(([a], [b]) => a.localeCompare(b))
        )
      }
    }
  }
}

Object.freeze(global.reload)
await global.reloadHandler()

// ═══════════════════════════════════════════════════
// FUNCIONES DE LIMPIEZA
// ═══════════════════════════════════════════════════
function clearTmp() {
  const tmpDir = join(__dirname, 'tmp')
  if (existsSync(tmpDir)) {
    const filenames = readdirSync(tmpDir)
    filenames.forEach(file => {
      const filePath = join(tmpDir, file)
      try {
        unlinkSync(filePath)
      } catch {}
    })
  }
}

function purgeSession() {
  const sessionDir = './sessions'
  if (existsSync(sessionDir)) {
    const files = readdirSync(sessionDir).filter(file => file.startsWith('pre-key-'))
    files.forEach(file => {
      try {
        unlinkSync(`${sessionDir}/${file}`)
      } catch {}
    })
  }
}

// ═══════════════════════════════════════════════════
// INTERVALOS DE LIMPIEZA
// ═══════════════════════════════════════════════════
setInterval(async () => {
  if (global.stopped === 'close' || !conn || !conn.user) return
  await clearTmp()
  console.log(chalk.cyan('🧹 Archivos temporales eliminados'))
}, 1000 * 60 * 5) // Cada 5 minutos

setInterval(async () => {
  if (global.stopped === 'close' || !conn || !conn.user) return
  await purgeSession()
  console.log(chalk.cyan('🧹 Sesiones no esenciales eliminadas'))
}, 1000 * 60 * 10) // Cada 10 minutos

// ═══════════════════════════════════════════════════
// VERIFICACIÓN DE NÚMERO DE TELÉFONO
// ═══════════════════════════════════════════════════
async function isValidPhoneNumber(number) {
  try {
    number = number.replace(/\s+/g, '')
    const parsedNumber = phoneUtil.parseAndKeepRawInput(number)
    return phoneUtil.isValidNumber(parsedNumber)
  } catch (error) {
    return false
  }
}

// ═══════════════════════════════════════════════════
// QUICK TEST
// ═══════════════════════════════════════════════════
async function _quickTest() {
  const test = await Promise.all([
    spawn('ffmpeg'),
    spawn('ffprobe'),
    spawn('convert'),
    spawn('magick'),
    spawn('gm')
  ].map((p) => {
    return Promise.race([
      new Promise((resolve) => {
        p.on('close', (code) => {
          resolve(code !== 127)
        })
      }),
      new Promise((resolve) => {
        p.on('error', (_) => resolve(false))
      })
    ])
  }))
  
  const [ffmpeg, ffprobe, convert, magick, gm] = test
  const s = global.support = {ffmpeg, ffprobe, convert, magick, gm}
  Object.freeze(global.support)
}

_quickTest()
  .then(() => console.log(chalk.green('✓ Herramientas verificadas')))
  .catch(console.error)
