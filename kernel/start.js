//start.js
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1'
import './config.js'
import cluster from 'cluster'
const { setupMaster, fork } = cluster
import { watchFile, unwatchFile } from 'fs'
import cfonts from 'cfonts'
import {createRequire} from 'module'
import {fileURLToPath, pathToFileURL} from 'url'
import {platform} from 'process'
import * as ws from 'ws'
import fs, {readdirSync, statSync, unlinkSync, existsSync, mkdirSync, readFileSync, rmSync, watch} from 'fs'
import yargs from 'yargs';
import {spawn} from 'child_process'
import lodash from 'lodash'
//import { AvenixJadiBot } from '../plugins/jadibot-serbot.js';
import chalk from 'chalk'
import syntaxerror from 'syntax-error'
import {tmpdir} from 'os'
import {format} from 'util'
import boxen from 'boxen'
import P from 'pino'
import pino from 'pino'
import Pino from 'pino'
import path, { join, dirname } from 'path'
import {Boom} from '@hapi/boom'
import {makeWASocket, protoType, serialize} from '../lib/simple.js'
import {Low, JSONFile} from 'lowdb'
import {mongoDB, mongoDBV2} from '../lib/mongoDB.js'
import store from '../lib/store.js'
const {proto} = (await import('@whiskeysockets/baileys')).default
import pkg from 'google-libphonenumber'
const { PhoneNumberUtil } = pkg
const phoneUtil = PhoneNumberUtil.getInstance()
const {DisconnectReason, useMultiFileAuthState, MessageRetryMap, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, jidNormalizedUser} = await import('@whiskeysockets/baileys')
import readline, { createInterface } from 'readline'
import NodeCache from 'node-cache'
const {CONNECTING} = ws
const {chain} = lodash
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000
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

global.timestamp = { start: new Date() }

const __dirname = global.__dirname(import.meta.url)

global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
global.prefix = new RegExp('^[' + (opts['prefix'] || '‎xzXZ/i!#$%+£¢€¥^°=¶∆×÷π√✓©®:;?&.\\-.@').replace(/[|\\{}()[\]^$+*?.\-\^]/g, '\\$&') + ']')

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
const { state, saveState, saveCreds } = await useMultiFileAuthState(global.sessionName || 'sessions')
const msgRetryCounterMap = (MessageRetryMap) => {}
const msgRetryCounterCache = new NodeCache()
const { version } = await fetchLatestBaileysVersion()
let phoneNumber = global.botNumber

const methodCodeQR = process.argv.includes('qr')
const methodCode = !!phoneNumber || process.argv.includes('code')
const MethodMobile = process.argv.includes('mobile')

const theme = {
  banner: chalk.bgCyan.black,
  accent: chalk.bold.yellowBright,
  highlight: chalk.bold.cyanBright,
  text: chalk.bold.white,
  prompt: chalk.bold.magentaBright
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (texto) => new Promise((resolver) => rl.question(texto, resolver))

let opcion
if (methodCodeQR) opcion = '1'

const credsExist = fs.existsSync(`./${global.sessionName || 'sessions'}/creds.json`)

if (!methodCodeQR && !methodCode && !credsExist) {
  do {
    opcion = await question(
      theme.banner('𒁈 Elige un método de conexión:\n') +
      theme.highlight('1. Código QR\n') +
      theme.text('2. Código de 8 dígitos\n') +
      theme.prompt('➜ Opción: ')
    )

    if (!/^[1-2]$/.test(opcion)) {
      console.log(chalk.red('❌ Solo números 1 o 2 son válidos'))
    }
  } while ((opcion !== '1' && opcion !== '2') || credsExist)
}

console.info = () => {}
console.debug = () => {}

const printQR = opcion === '1' || methodCodeQR
const browserName = printQR ? `${global.nameqr || 'Avenix-Multi'}` : 'Ubuntu'
const browserProduct = 'Edge'
const browserVersion = printQR ? '20.0.04' : '110.0.1587.56'

const connectionOptions = {
  logger: pino({ level: 'silent' }),
  printQRInTerminal: printQR,
  mobile: MethodMobile,
  browser: [browserName, browserProduct, browserVersion],
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(state.keys, Pino({ level: 'fatal' }).child({ level: 'fatal' }))
  },
  markOnlineOnConnect: true,
  generateHighQualityLinkPreview: true,
  getMessage: async (clave) => {
    const jid = jidNormalizedUser(clave.remoteJid)
    const msg = await store.loadMessage(jid, clave.id)
    return msg?.message || ''
  },
  msgRetryCounterCache,
  msgRetryCounterMap,
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
          phoneNumber = await question(theme.prompt('𒁈 Ingresa tu número de WhatsApp:\n➜ '))
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

conn.logger.info(` 𒁈 Avenix-Multi inicializado\n`)

// ═══════════════════════════════════════════════════
// AUTO-GUARDAR BASE DE DATOS
// ═══════════════════════════════════════════════════
if (!opts['test']) {
  if (global.db) {
    setInterval(async () => {
      try {
        if (global.db.data) await global.db.write()
        if (opts['autocleartmp']) {
          clearTmp()
        }
      } catch (e) {
        console.error(e)
      }
    }, 30000)
  }
}

// ═══════════════════════════════════════════════════
// EVENTO: ACTUALIZACIÓN DE CONEXIÓN
// ═══════════════════════════════════════════════════
async function connectionUpdate(update) {
  const { connection, lastDisconnect, isNewLogin, qr } = update
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
        console.log(chalk.red(`\n❌ Sesión inválida. Elimina la carpeta "${global.sessionName || 'sessions'}" y reconecta\n`))
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
    global.conn = makeWASocket(connectionOptions, { chats: oldChats })
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
  
  const currentDateTime = new Date()
  const messageDateTime = new Date(conn.ev)
  if (currentDateTime >= messageDateTime) {
    const chats = Object.entries(conn.chats).filter(([jid, chat]) => !jid.endsWith('@g.us') && chat.isChats).map((v) => v[0])
  } else {
    const chats = Object.entries(conn.chats).filter(([jid, chat]) => !jid.endsWith('@g.us') && chat.isChats).map((v) => v[0])
  }
  
  conn.ev.on('messages.upsert', conn.handler)
  conn.ev.on('connection.update', conn.connectionUpdate)
  conn.ev.on('creds.update', conn.credsUpdate)
  
  isInit = false
  return true
}

// ═══════════════════════════════════════════════════
// JADIBOT - SUB-BOTS
// ═══════════════════════════════════════════════════
global.rutaJadiBot = join(__dirname, './jadibot')

if (global.conns instanceof Array) {
  // Soporte para JadiBot activado
  if (!existsSync(global.rutaJadiBot)) {
    mkdirSync(global.rutaJadiBot, { recursive: true })
    console.log(chalk.bold.cyan(`📁 Carpeta JadiBot creada: ${global.rutaJadiBot}`))
  } else {
    console.log(chalk.bold.cyan(`📁 Carpeta JadiBot ya existe`))
  }

  const readRutaJadiBot = readdirSync(global.rutaJadiBot)
  if (readRutaJadiBot.length > 0) {
    const creds = 'creds.json'
    for (const sessionFolder of readRutaJadiBot) {
      const botPath = join(global.rutaJadiBot, sessionFolder)
      const readBotPath = readdirSync(botPath)
      if (readBotPath.includes(creds)) {
        console.log(chalk.cyan(`🤖 Restaurando JadiBot: ${sessionFolder}`))
        // Aquí cargarías la función de tu plugin jadibot
        // Ejemplo: await loadJadiBot(botPath)
      }
    }
  }
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
watch(pluginFolder, global.reload)
await global.reloadHandler()

// ═══════════════════════════════════════════════════
// FUNCIONES DE LIMPIEZA
// ═══════════════════════════════════════════════════
function clearTmp() {
  const tmpDir = join(__dirname, './tmp')
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
  const sessionDir = `./${global.sessionName || 'sessions'}`
  if (existsSync(sessionDir)) {
    const files = readdirSync(sessionDir).filter(file => file.startsWith('pre-key-'))
    files.forEach(file => {
      try {
        unlinkSync(`${sessionDir}/${file}`)
      } catch {}
    })
  }
}

function purgeSessionSB() {
  try {
    if (!existsSync(global.rutaJadiBot)) return
    
    const listaDirectorios = readdirSync(global.rutaJadiBot)
    let SBprekey = []
    
    listaDirectorios.forEach(directorio => {
      const dirPath = join(global.rutaJadiBot, directorio)
      if (statSync(dirPath).isDirectory()) {
        const DSBPreKeys = readdirSync(dirPath).filter(fileInDir => {
          return fileInDir.startsWith('pre-key-')
        })
        SBprekey = [...SBprekey, ...DSBPreKeys]
        DSBPreKeys.forEach(fileInDir => {
          if (fileInDir !== 'creds.json') {
            unlinkSync(join(dirPath, fileInDir))
          }
        })
      }
    })
    
    if (SBprekey.length === 0) {
      console.log(chalk.bold.green(`\n╭» 𒁈 JADIBOT 𒁈\n│→ NADA POR ELIMINAR\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━ ♻︎`))
    } else {
      console.log(chalk.bold.cyanBright(`\n╭» 𒁈 JADIBOT 𒁈\n│→ ARCHIVOS NO ESENCIALES ELIMINADOS\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━ ♻︎`))
    }
  } catch (err) {
    console.log(chalk.bold.red(`\n╭» 𒁈 JADIBOT 𒁈\n│→ ERROR: ${err}\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━ ✘`))
  }
}

function purgeOldFiles() {
  const directories = [`./${global.sessionName || 'sessions'}/`, global.rutaJadiBot]
  directories.forEach(dir => {
    if (!existsSync(dir)) return
    try {
      const files = readdirSync(dir)
      files.forEach(file => {
        if (file !== 'creds.json') {
          const filePath = path.join(dir, file)
          try {
            unlinkSync(filePath)
            console.log(chalk.bold.green(`\n╭» 𒁈 ARCHIVO 𒁈\n│→ ${file} BORRADO\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━ ♻`))
          } catch (err) {
            console.log(chalk.bold.red(`\n╭» 𒁈 ARCHIVO 𒁈\n│→ ${file} NO SE PUDO BORRAR\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━ ✘`))
          }
        }
      })
    } catch {}
  })
}

// ═══════════════════════════════════════════════════
// INTERVALOS DE LIMPIEZA
// ═══════════════════════════════════════════════════
setInterval(async () => {
  if (global.stopped === 'close' || !conn || !conn.user) return
  await clearTmp()
  console.log(chalk.cyan('\n🧹 Archivos temporales eliminados'))
}, 1000 * 60 * 4) // Cada 4 minutos

setInterval(async () => {
  if (global.stopped === 'close' || !conn || !conn.user) return
  await purgeSession()
  console.log(chalk.cyan(`\n🧹 Sesiones no esenciales de ${global.sessionName || 'sessions'} eliminadas`))
}, 1000 * 60 * 10) // Cada 10 minutos

setInterval(async () => {
  if (global.stopped === 'close' || !conn || !conn.user) return
  await purgeSessionSB()
}, 1000 * 60 * 10) // Cada 10 minutos

setInterval(async () => {
  if (global.stopped === 'close' || !conn || !conn.user) return
  await purgeOldFiles()
  console.log(chalk.cyan('\n🧹 Archivos residuales eliminados'))
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
    spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-filter_complex', 'color', '-frames:v', '1', '-f', 'webp', '-']),
    spawn('convert'),
    spawn('magick'),
    spawn('gm'),
    spawn('find', ['--version'])
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
  
  const [ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find] = test
  const s = global.support = { ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find }
  Object.freeze(global.support)
}

_quickTest()
  .then(() => console.log(chalk.green('✓ Herramientas verificadas')))
  .catch(console.error)
