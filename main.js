/**
 * Avenix-Multi - Core Engine
 * Creado por: Hepein Oficial 
 * Marca: 𒁈
 * 
 * Motor principal optimizado para Baileys 6.7.5+
 * Sistema robusto con manejo avanzado de errores
 */

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1';
import './config.js';
import { createRequire } from 'module';
import path, { join } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { platform } from 'process';
import * as ws from 'ws';
import fs, { 
  watchFile, unwatchFile, writeFileSync, readdirSync, statSync, 
  unlinkSync, existsSync, readFileSync, copyFileSync, watch, 
  rmSync, readdir, stat, mkdirSync, rename, writeFile 
} from 'fs';
import yargs from 'yargs';
import { spawn } from 'child_process';
import lodash from 'lodash';
import chalk from 'chalk';
import syntaxerror from 'syntax-error';
import { tmpdir } from 'os';
import { format } from 'util';
import P from 'pino';
import pino from 'pino';
import Pino from 'pino';
import { Boom } from '@hapi/boom';
import { makeWASocket, protoType, serialize } from './lib/simple.js';
import { Low, JSONFile } from 'lowdb';
import { mongoDB, mongoDBV2 } from './lib/mongoDB.js';
import store from './lib/store.js';
import readline from 'readline';
import NodeCache from 'node-cache';
import pkg from 'google-libphonenumber';

const { PhoneNumberUtil } = pkg;
const phoneUtil = PhoneNumberUtil.getInstance();

const { 
  makeInMemoryStore, DisconnectReason, useMultiFileAuthState, 
  MessageRetryMap, fetchLatestBaileysVersion, makeCacheableSignalKeyStore 
} = await import('@whiskeysockets/baileys');

const { CONNECTING } = ws;
const { chain } = lodash;
const PORT = process.env.PORT || process.env.SERVER_PORT || 8080;

protoType();
serialize();

//*──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ*

// Configuración de funciones globales
global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
  return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString();
};

global.__dirname = function dirname(pathURL) {
  return path.dirname(global.__filename(pathURL, true));
};

global.__require = function require(dir = import.meta.url) {
  return createRequire(dir);
};

global.API = (name, path = '/', query = {}, apikeyqueryname) => 
  (name in global.APIs ? global.APIs[name] : name) + path + 
  (query || apikeyqueryname ? '?' + new URLSearchParams(Object.entries({
    ...query, 
    ...(apikeyqueryname ? { [apikeyqueryname]: global.APIKeys[name in global.APIs ? global.APIs[name] : name] } : {})
  })) : '');

global.timestamp = { start: new Date };
global.videoList = [];
global.videoListXXX = [];

const __dirname = global.__dirname(import.meta.url);

//*──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ*

// Configuración de argumentos y prefijo
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse());
global.prefix = global.prefijo ? 
  new RegExp('^' + global.prefijo) : 
  new RegExp('^[' + (opts['prefix'] || '𒁈*/i!#$%+£¢€¥^°=¶∆×÷π√✓©®:;?&.\\-.@').replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + ']');

// Configuración de base de datos
global.db = new Low(/https?:\/\//.test(opts['db'] || '') ? 
  new cloudDBAdapter(opts['db']) : 
  new JSONFile(`${opts._[0] ? opts._[0] + '_' : ''}${global.dbname}`)
);

global.DATABASE = global.db;

//*──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ*

/**
 * Función de carga de base de datos principal
 */
global.loadDatabase = async function loadDatabase() {
  if (global.db.READ) {
    return new Promise((resolve) => setInterval(async function() {
      if (!global.db.READ) {
        clearInterval(this);
        resolve(global.db.data == null ? global.loadDatabase() : global.db.data);
      }
    }, 1 * 1000));
  }
  if (global.db.data !== null) return;
  global.db.READ = true;
  await global.db.read().catch(console.error);
  global.db.READ = null;
  global.db.data = {
    users: {},
    chats: {},
    stats: {},
    msgs: {},
    sticker: {},
    settings: {},
    ...(global.db.data || {}),
  };
  global.db.chain = chain(global.db.data);
};

await loadDatabase();

/**
 * Base de datos ChatGPT
 */
global.chatgpt = new Low(new JSONFile(path.join(__dirname, '/database/chatgpt.json')));
global.loadChatgptDB = async function loadChatgptDB() {
  if (global.chatgpt.READ) {
    return new Promise((resolve) =>
      setInterval(async function() {
        if (!global.chatgpt.READ) {
          clearInterval(this);
          resolve(global.chatgpt.data === null ? global.loadChatgptDB() : global.chatgpt.data);
        }
      }, 1 * 1000));
  }
  if (global.chatgpt.data !== null) return;
  global.chatgpt.READ = true;
  await global.chatgpt.read().catch(console.error);
  global.chatgpt.READ = null;
  global.chatgpt.data = {
    users: {},
    ...(global.chatgpt.data || {}),
  };
  global.chatgpt.chain = lodash.chain(global.chatgpt.data);
};

await loadChatgptDB();

//*──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ*

// Configuración de autenticación
global.authFile = global.sessionName || 'sessions';
const { state, saveState, saveCreds } = await useMultiFileAuthState(global.authFile);
const msgRetryCounterMap = (MessageRetryMap) => { };
const msgRetryCounterCache = new NodeCache();
const { version } = await fetchLatestBaileysVersion();

let phoneNumber = global.botNumberCode;
const methodCodeQR = process.argv.includes("qr");
const methodCode = !!phoneNumber || process.argv.includes("code");
const MethodMobile = process.argv.includes("mobile");

let rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true,
});

const question = (texto) => {
  rl.clearLine(rl.input, 0);
  return new Promise((resolver) => {
    rl.question(texto, (respuesta) => {
      rl.clearLine(rl.input, 0);
      resolver(respuesta.trim());
    });
  });
};

//*──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ*

let opcion;
if (methodCodeQR) {
  opcion = '1';
}

if (!methodCodeQR && !methodCode && !fs.existsSync(`./${authFile}/creds.json`)) {
  do {
    let lineM = '──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ';
    console.log(chalk.cyan(`
    ╭${lineM}╮
    │     𒁈 AVENIX-MULTI CONEXIÓN 𒁈       │
    ├${lineM}┤
    │ Seleccione método de conexión:      │
    │                                     │
    │ 1. Código QR (recomendado)          │
    │ 2. Código de 8 dígitos              │
    │                                     │
    ╰${lineM}╯`));
    
    opcion = await question(chalk.blue('𒁈 Ingrese su opción (1 o 2): '));
    if (!/^[1-2]$/.test(opcion)) {
      console.log(chalk.red('𒁈 Por favor, seleccione solo 1 o 2\n'));
    }
  } while (opcion !== '1' && opcion !== '2' || fs.existsSync(`./${authFile}/creds.json`));
}

//*──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ*

// Filtros de consola para limpiar logs innecesarios
const filterStrings = [
  "Q2xvc2luZyBzdGFsZSBvcGVu",
  "Q2xvc2luZyBvcGVuIHNlc3Npb24=", 
  "RmFpbGVkIHRvIGRlY3J5cHQ=",
  "U2Vzc2lvbiBlcnJvcg==",
  "RXJyb3I6IEJhZCBNQUM=",
  "RGVjcnlwdGVkIG1lc3NhZ2U="
];

// Redefinir métodos de consola
console.info = () => { };
console.debug = () => { };
['log', 'warn', 'error'].forEach(methodName => redefineConsoleMethod(methodName, filterStrings));

//*──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ*

// Configuración de conexión optimizada
const connectionOptions = {
  logger: pino({ level: 'silent' }),
  printQRInTerminal: opcion == '1' ? true : methodCodeQR ? true : false,
  mobile: MethodMobile,
  browser: opcion == '1' ? 
    ['Avenix-Multi', 'Chrome', '115.0.0'] : 
    methodCodeQR ? 
      ['Avenix-Multi', 'Chrome', '115.0.0'] : 
      ["Avenix-Multi", "Desktop", "115.0.0"],
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(state.keys, Pino({ level: "fatal" }).child({ level: "fatal" })),
  },
  markOnlineOnConnect: true,
  generateHighQualityLinkPreview: true,
  syncFullHistory: false,
  getMessage: async (clave) => {
    let jid = jidNormalizedUser(clave.remoteJid);
    let msg = await store.loadMessage(jid, clave.id);
    return msg?.message || "";
  },
  msgRetryCounterCache,
  msgRetryCounterMap,
  defaultQueryTimeoutMs: undefined,
  version: [2, 3000, 1015901307],
};

global.conn = makeWASocket(connectionOptions);

//*──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ*

// Manejo de código de emparejamiento
if (!fs.existsSync(`./${authFile}/creds.json`)) {
  if (opcion === '2' || methodCode) {
    opcion = '2';
    if (!conn.authState.creds.registered) {
      let addNumber;
      if (!!phoneNumber) {
        addNumber = phoneNumber.replace(/[^0-9]/g, '');
      } else {
        do {
          phoneNumber = await question(chalk.bgBlack(chalk.bold.cyan(`
          ╭──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ╮
          │  Ingrese su número de WhatsApp con código de país │
          │  Ejemplo: +521234567890                           │
          ╰──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ╯
          
          ${chalk.bold.magenta('𒁈 Número: ')}`)));
          
          phoneNumber = phoneNumber.replace(/\D/g, '');
          if (!phoneNumber.startsWith('+')) {
            phoneNumber = `+${phoneNumber}`;
          }
        } while (!await isValidPhoneNumber(phoneNumber));
        
        rl.close();
        addNumber = phoneNumber.replace(/\D/g, '');
        
        setTimeout(async () => {
          let codeBot = await conn.requestPairingCode(addNumber);
          codeBot = codeBot?.match(/.{1,4}/g)?.join("-") || codeBot;
          
          console.log(chalk.cyan(`
          ╭──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ╮
          │           CÓDIGO DE EMPAREJAMIENTO            │
          ├──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ┤
          │                                               │
          │  ${chalk.bold.green(codeBot)}                            │
          │                                               │
          │  Ingresa este código en WhatsApp              │
          │  Dispositivos vinculados > Vincular dispositivo│
          │                                               │
          ╰──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ╯
          `));
        }, 2000);
      }
    }
  }
}

//*──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ*

conn.isInit = false;
conn.well = false;
conn.logger.info(chalk.blue(`𒁈 Iniciando Avenix-Multi...`));

// Auto-guardado de base de datos
if (!opts['test']) {
  if (global.db) {
    setInterval(async () => {
      if (global.db.data) await global.db.write();
      if (opts['autocleartmp'] && (global.support || {}).find) {
        let tmp = [tmpdir(), 'tmp'];
        tmp.forEach((filename) => 
          spawn('find', [filename, '-amin', '10', '-type', 'f', '-delete']).catch(() => {})
        );
      }
    }, 60 * 1000); // Cada minuto
  }
}

// Servidor HTTP opcional
if (opts['server']) {
  try {
    (await import('./server.js')).default(global.conn, PORT);
  } catch (e) {
    console.log(chalk.yellow('𒁈 Servidor HTTP no disponible'));
  }
}

//*──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ*

/**
 * Limpiar archivos temporales
 */
function clearTmp() {
  const tmp = [join(__dirname, './tmp')];
  const filename = [];
  tmp.forEach((dirname) => {
    if (existsSync(dirname)) {
      readdirSync(dirname).forEach((file) => filename.push(join(dirname, file)));
    }
  });
  return filename.map((file) => {
    try {
      const stats = statSync(file);
      if (stats.isFile() && (Date.now() - stats.mtimeMs >= 1000 * 60 * 10)) {
        unlinkSync(file);
        return true;
      }
    } catch (e) {
      // Archivo ya no existe
    }
    return false;
  });
}

/**
 * Eliminar archivos core automáticamente
 */
const dirToWatch = path.join(__dirname, './');
function deleteCoreFiles(filePath) {
  const coreFilePattern = /^core\.\d+$/i;
  const filename = path.basename(filePath);
  if (coreFilePattern.test(filename)) {
    fs.unlink(filePath, (err) => {
      if (!err) {
        console.log(chalk.gray(`𒁈 Archivo core eliminado: ${filename}`));
      }
    });
  }
}

fs.watch(dirToWatch, (eventType, filename) => {
  if (eventType === 'rename' && filename) {
    const filePath = path.join(dirToWatch, filename);
    fs.stat(filePath, (err, stats) => {
      if (!err && stats.isFile()) {
        deleteCoreFiles(filePath);
      }
    });
  }
});

//*──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ*

/**
 * Manejador de actualización de conexión
 */
async function connectionUpdate(update) {
  const { connection, lastDisconnect, isNewLogin, qr } = update;
  global.stopped = connection;
  
  if (isNewLogin) conn.isInit = true;
  
  const code = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode;
  
  if (code && code !== DisconnectReason.loggedOut && conn?.ws.socket == null) {
    await global.reloadHandler(true).catch(console.error);
    global.timestamp.connect = new Date;
  }
  
  if (global.db.data == null) loadDatabase();
  
  if (update.qr != 0 && update.qr != undefined || methodCodeQR) {
    if (opcion == '1' || methodCodeQR) {
      console.log(chalk.yellow('𒁈 Escanea el código QR con WhatsApp Web'));
    }
  }
  
  if (connection == 'open') {
    console.log(chalk.green(`
    ╭──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ╮
    │            ✅ CONECTADO EXITOSAMENTE           │
    ├──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ┤
    │ Bot: ${(conn.user.name || 'Avenix-Multi').padEnd(36)} │
    │ Número: ${(conn.user.id.split(':')[0]).padEnd(30)} │
    │ Versión: ${global.version?.padEnd(31) || 'N/A'.padEnd(31)} │
    │ Estado: Activo                               │
    ╰──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ╯
    `));

    // Importar auto-post si existe
    try {
      const autopost = await import('./plugins/tools-auto.js');
      autopost.default?.(conn);
    } catch (e) {
      // Auto-post no disponible
    }
  }
  
  let reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
  
  if (reason == 405) {
    await fs.unlinkSync(authFile + "/creds.json");
    console.log(chalk.bold.red(`𒁈 Conexión reemplazada. Reiniciando...`));
    process.send('reset');
  }
  
  if (connection === 'close') {
    const reconnectMessages = {
      [DisconnectReason.badSession]: `𒁈 Sesión incorrecta. Elimina la carpeta ${global.authFile} y reconecta.`,
      [DisconnectReason.connectionClosed]: `𒁈 Conexión cerrada, reconectando...`,
      [DisconnectReason.connectionLost]: `𒁈 Conexión perdida, reconectando...`,
      [DisconnectReason.connectionReplaced]: `𒁈 Conexión reemplazada. Cierra otras sesiones.`,
      [DisconnectReason.loggedOut]: `𒁈 Sesión cerrada. Elimina ${global.authFile} y reconecta.`,
      [DisconnectReason.restartRequired]: `𒁈 Reinicio necesario...`,
      [DisconnectReason.timedOut]: `𒁈 Tiempo de conexión agotado, reconectando...`
    };
    
    const message = reconnectMessages[reason] || `𒁈 Desconexión: ${reason || 'desconocida'}`;
    
    if (reason === DisconnectReason.loggedOut || reason === DisconnectReason.badSession) {
      conn.logger.error(message);
    } else {
      conn.logger.warn(message);
      await global.reloadHandler(true).catch(console.error);
    }
  }
}

//*──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ*

process.on('uncaughtException', (error) => {
  console.error(chalk.red('𒁈 Error no capturado:'), error);
  if (error.code === 'ENOSPC') {
    console.log(chalk.yellow('𒁈 Reiniciando por límite del sistema...'));
    process.exit(1);
  }
});

let isInit = true;
let handler = await import('./handler.js');

/**
 * Función de recarga del handler
 */
global.reloadHandler = async function(restatConn) {
  try {
    const Handler = await import(`./handler.js?update=${Date.now()}`).catch(console.error);
    if (Object.keys(Handler || {}).length) handler = Handler;
  } catch (e) {
    console.error('Error recargando handler:', e);
  }
  
  if (restatConn) {
    const oldChats = global.conn.chats;
    try {
      global.conn.ws.close();
    } catch { }
    conn.ev.removeAllListeners();
    global.conn = makeWASocket(connectionOptions, { chats: oldChats });
    isInit = true;
  }
  
  if (!isInit) {
    conn.ev.off('messages.upsert', conn.handler);
    conn.ev.off('group-participants.update', conn.participantsUpdate);
    conn.ev.off('groups.update', conn.groupsUpdate);
    conn.ev.off('message.delete', conn.onDelete);
    conn.ev.off('call', conn.onCall);
    conn.ev.off('connection.update', conn.connectionUpdate);
    conn.ev.off('creds.update', conn.credsUpdate);
  }

  // Mensajes predeterminados del bot
  conn.welcome = `
  ╭──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ╮
  │            🎉 BIENVENIDO 🎉               │
  ├──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ┤
  │ Usuario: @user                           │
  │ Grupo: @group                            │
  │                                          │
  │ 📋 Lee las reglas del grupo              │
  │ 🤖 Usa .menu para ver comandos          │
  │ 💎 ¡Disfruta tu estadía!                │
  ╰──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ╯
  
  @desc`;

  conn.bye = `
  ╭──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ╮
  │           👋 HASTA PRONTO 👋             │
  ├──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ┤
  │ @user se despide del grupo              │
  │                                          │
  │ 🌟 Esperamos verte pronto de vuelta     │
  │ 💜 El grupo no será lo mismo sin ti     │
  ╰──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ╯`;

  conn.spromote = `
  ╭──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ╮
  │            👑 NUEVO ADMIN 👑             │
  ├──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ┤
  │ @user ahora es administrador            │
  │ ¡Felicidades por el ascenso!            │
  ╰──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ╯`;

  conn.sdemote = `
  ╭──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ╮
  │           📉 ADMIN REMOVIDO 📉           │
  ├──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ┤
  │ @user ya no es administrador            │
  │ Gracias por tu servicio                 │
  ╰──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ╯`;

  conn.sDesc = `
  ╭──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ╮
  │        📝 DESCRIPCIÓN ACTUALIZADA        │
  ├──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ┤
  │ La descripción del grupo ha cambiado    │
  ╰──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ╯`;

  conn.sSubject = `
  ╭──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ╮
  │         🏷️ NOMBRE ACTUALIZADO           │
  ├──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ┤
  │ El nombre del grupo ha sido modificado  │
  ╰──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ╯`;

  conn.sIcon = `
  ╭──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ╮
  │          🖼️ FOTO ACTUALIZADA           │
  ├──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ┤
  │ La foto del grupo ha sido cambiada      │
  ╰──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ╯`;

  conn.sRevoke = `
  ╭──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ╮
  │          🔗 ENLACE RESTABLECIDO         │
  ├──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ┤
  │ El enlace de invitación ha sido         │
  │ restablecido por seguridad              │
  ╰──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ╯`;

  // Vincular eventos
  conn.handler = handler.handler.bind(global.conn);
  conn.participantsUpdate = handler.participantsUpdate?.bind(global.conn);
  conn.groupsUpdate = handler.groupsUpdate?.bind(global.conn);
  conn.onDelete = handler.deleteUpdate?.bind(global.conn);
  conn.callUpdate = handler.callUpdate?.bind(global.conn);
  conn.connectionUpdate = connectionUpdate.bind(global.conn);
  conn.credsUpdate = saveCreds.bind(global.conn, true);

  // Configurar eventos
  conn.ev.on('messages.upsert', conn.handler);
  conn.ev.on('group-participants.update', conn.participantsUpdate);
  conn.ev.on('groups.update', conn.groupsUpdate);
  conn.ev.on('message.delete', conn.onDelete);
  conn.ev.on('call', conn.callUpdate);
  conn.ev.on('connection.update', conn.connectionUpdate);
  conn.ev.on('creds.update', conn.credsUpdate);
  
  isInit = false;
  return true;
};

//*──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ*

// Cargar plugins
const pluginFolder = global.__dirname(join(__dirname, './plugins'));
const pluginFilter = (filename) => /\.js$/.test(filename);
global.plugins = {};

async function filesInit() {
  if (!existsSync(pluginFolder)) {
    mkdirSync(pluginFolder, { recursive: true });
    console.log(chalk.yellow('𒁈 Carpeta plugins creada'));
    return;
  }

  const files = readdirSync(pluginFolder).filter(pluginFilter);
  let loadedCount = 0;
  let errorCount = 0;

  for (const filename of files) {
    try {
      const file = global.__filename(join(pluginFolder, filename));
      const module = await import(file);
      global.plugins[filename] = module.default || module;
      loadedCount++;
    } catch (e) {
      console.error(chalk.red(`𒁈 Error cargando ${filename}:`), e.message);
      errorCount++;
    }
  }

  console.log(chalk.green(`𒁈 Plugins cargados: ${loadedCount} exitosos, ${errorCount} errores`));
}

await filesInit();

/**
 * Sistema de recarga de plugins
 */
global.reload = async (_ev, filename) => {
  if (pluginFilter(filename)) {
    const dir = global.__filename(join(pluginFolder, filename), true);
    
    if (filename in global.plugins) {
      if (existsSync(dir)) {
        console.log(chalk.blue(`𒁈 Plugin actualizado: ${filename}`));
      } else {
        console.log(chalk.yellow(`𒁈 Plugin eliminado: ${filename}`));
        return delete global.plugins[filename];
      }
    } else {
      console.log(chalk.green(`𒁈 Nuevo plugin: ${filename}`));
    }

    const err = syntaxerror(readFileSync(dir), filename, {
      sourceType: 'module',
      allowAwaitOutsideFunction: true,
    });
    
    if (err) {
      console.error(chalk.red(`𒁈 Error de sintaxis en ${filename}:`));
      console.error(format(err));
    } else {
      try {
        const module = await import(`${global.__filename(dir)}?update=${Date.now()}`);
        global.plugins[filename] = module.default || module;
      } catch (e) {
        console.error(chalk.red(`𒁈 Error cargando plugin ${filename}:`), e.message);
      } finally {
        global.plugins = Object.fromEntries(
          Object.entries(global.plugins).sort(([a], [b]) => a.localeCompare(b))
        );
      }
    }
  }
};

Object.freeze(global.reload);
watch(pluginFolder, global.reload);

//*──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ*

// Inicializar handler
await global.reloadHandler();

/**
 * Test rápido de herramientas del sistema
 */
async function quickTest() {
  const tools = [
    { name: 'ffmpeg', cmd: ['ffmpeg', '-version'] },
    { name: 'ffprobe', cmd: ['ffprobe', '-version'] },
    { name: 'convert', cmd: ['convert', '-version'] },
    { name: 'magick', cmd: ['magick', '-version'] },
    { name: 'gm', cmd: ['gm', '-version'] },
    { name: 'find', cmd: ['find', '--version'] }
  ];

  const results = await Promise.all(
    tools.map(({ name, cmd }) => 
      new Promise((resolve) => {
        const proc = spawn(cmd[0], cmd.slice(1), { stdio: 'ignore' });
        const timeout = setTimeout(() => resolve(false), 3000);
        
        proc.on('close', (code) => {
          clearTimeout(timeout);
          resolve(code !== 127 && code !== null);
        });
        
        proc.on('error', () => {
          clearTimeout(timeout);
          resolve(false);
        });
      })
    )
  );

  const support = {};
  tools.forEach(({ name }, index) => {
    support[name] = results[index];
  });

  global.support = Object.freeze(support);
  
  const available = Object.entries(support).filter(([, available]) => available).map(([name]) => name);
  const missing = Object.entries(support).filter(([, available]) => !available).map(([name]) => name);
  
  console.log(chalk.green(`𒁈 Herramientas disponibles: ${available.join(', ') || 'ninguna'}`));
  if (missing.length) {
    console.log(chalk.yellow(`𒁈 Herramientas faltantes: ${missing.join(', ')}`));
  }
}

// Ejecutar test de herramientas
quickTest().catch(() => {});

//*──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ*

// Limpieza automática de archivos temporales
setInterval(async () => {
  if (global.stopped === 'close' || !conn || !conn.user) return;
  
  try {
    const cleared = await clearTmp();
    const count = cleared.filter(Boolean).length;
    if (count > 0) {
      console.log(chalk.gray(`𒁈 ${count} archivo(s) temporales eliminados`));
    }
  } catch (e) {
    // Error silencioso en limpieza
  }
}, 300000); // Cada 5 minutos

//*──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ*

/**
 * Funciones auxiliares
 */

function redefineConsoleMethod(methodName, filterStrings) {
  const originalConsoleMethod = console[methodName];
  console[methodName] = function() {
    const message = arguments[0];
    if (typeof message === 'string' && filterStrings.some(filterString => 
        message.includes(atob(filterString)))) {
      arguments[0] = "";
    }
    originalConsoleMethod.apply(console, arguments);
  };
}

async function isValidPhoneNumber(number) {
  try {
    number = number.replace(/\s+/g, '');
    if (number.startsWith('+521')) {
      number = number.replace('+521', '+52');
    } else if (number.startsWith('+52') && number[4] === '1') {
      number = number.replace('+52 1', '+52');
    }
    const parsedNumber = phoneUtil.parseAndKeepRawInput(number);
    return phoneUtil.isValidNumber(parsedNumber);
  } catch (error) {
    return false;
  }
}

function clockString(ms) {
  const d = isNaN(ms) ? '--' : Math.floor(ms / 86400000);
  const h = isNaN(ms) ? '--' : Math.floor(ms / 3600000) % 24;
  const m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60;
  const s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60;
  return [d, 'd ', h, 'h ', m, 'm ', s, 's '].map((v) => v.toString().padStart(2, 0)).join('');
}

// Hacer disponible la función globalmente
global.clockString = clockString;

//*──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ*

console.log(chalk.cyan(`
╭──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ╮
│              AVENIX-MULTI INICIADO           │
├──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ┤
│ 🤖 Bot listo para recibir conexiones        │
│ 📊 Base de datos cargada correctamente       │
│ 🔌 Plugins inicializados                    │
│ 🛡️ Sistemas de seguridad activos            │
│                                              │
│ 👑 Creado por: Hepein Oficial               │
│ 📱 GitHub: github.com/Brashkie/Avenix-Multi │
╰──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ╯
`));
