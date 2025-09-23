/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                            𒁈 AVENIX-MULTI V2.0.0 𒁈                         ┃
 * ┃                                                                               ┃
 * ┃              ▄▀█ █░█ █▀▀ █▄░█ █ ▀▄▀   █▀▄▀█ █░█ █░░ ▀█▀ █                  ┃
 * ┃              █▀█ ▀▄▀ ██▄ █░▀█ █ █░█   █░▀░█ █▄█ █▄▄ ░█░ █                  ┃
 * ┃                                                                               ┃
 * ┃                       🚀 MAIN.JS - LÓGICA PRINCIPAL 🚀                       ┃
 * ┃                                                                               ┃
 * ┃     👑 Creado por: Hepein Oficial                                            ┃
 * ┃     📧 Contacto: electronicatudo2006@gmail.com                               ┃
 * ┃     📱 WhatsApp: +51 916360161                                               ┃
 * ┃     🌟 GitHub: https://github.com/Brashkie/Avenix-Multi                      ┃
 * ┃                                                                               ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */
//main.js
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1';

// Detectar modo de ejecución desde argumentos o variables de entorno
const AVENIX_MODE = process.env.AVENIX_MODE || process.argv[2] || 'auto';
const DISABLE_TESTS = process.env.DISABLE_TESTS === 'true' || process.argv.includes('--no-tests');

console.log(chalk.blue(`𒁈 Modo detectado: ${AVENIX_MODE}`));

import './config.js'; 
import { createRequire } from 'module';
import path, { join } from 'path'
import {fileURLToPath, pathToFileURL} from 'url';
import { platform } from 'process';
import * as ws from 'ws';
import fs, { watchFile, unwatchFile, writeFileSync, readdirSync, statSync, unlinkSync, existsSync, readFileSync, copyFileSync, watch, rmSync, readdir, stat, mkdirSync, rename, promises as fsPromises, unlink } from 'fs';
import yargs from 'yargs';
import { spawn } from 'child_process';
import lodash from 'lodash';
import chalk from 'chalk';
import syntaxerror from 'syntax-error';
import { format } from 'util';
import pino from 'pino';
import Pino from 'pino';
import { Boom } from '@hapi/boom';
import { makeWASocket, protoType, serialize } from './lib/simple.js';
import {Low, JSONFile} from 'lowdb';
import PQueue from 'p-queue';
import Datastore from '@seald-io/nedb';
import store from './lib/store.js';
import readline from 'readline';
import NodeCache from 'node-cache'; 
import { AvenixJadiBot } from './plugins/jadibot-serbot.js';
import pkg from 'google-libphonenumber';

const { PhoneNumberUtil } = pkg;
const phoneUtil = PhoneNumberUtil.getInstance();
const { makeInMemoryStore, DisconnectReason, useMultiFileAuthState, MessageRetryMap, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, jidNormalizedUser } = await import('@whiskeysockets/baileys');
const { CONNECTING } = ws;
const { chain } = lodash;
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000;

protoType();
serialize();

// ═══════════════════════════════════════════════════════════════════════════════
// │                           CONFIGURACIONES GLOBALES                          │
// ═══════════════════════════════════════════════════════════════════════════════

global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
    return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString();
}; 

global.__dirname = function dirname(pathURL) {
    return path.dirname(global.__filename(pathURL, true));
}; 

global.__require = function require(dir = import.meta.url) {
    return createRequire(dir);
};

global.timestamp = { start: new Date };
const __dirname = global.__dirname(import.meta.url);
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse());

// ═══════════════════════════════════════════════════════════════════════════════
// │                      SISTEMA DE BASE DE DATOS AVANZADO                      │
// ═══════════════════════════════════════════════════════════════════════════════

const dbPath = path.join(__dirname, 'database');
if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath);

const collections = {
    users: new Datastore({ filename: path.join(dbPath, 'users.db'), autoload: true }),
    chats: new Datastore({ filename: path.join(dbPath, 'chats.db'), autoload: true }),
    settings: new Datastore({ filename: path.join(dbPath, 'settings.db'), autoload: true }),
    msgs: new Datastore({ filename: path.join(dbPath, 'msgs.db'), autoload: true }),
    sticker: new Datastore({ filename: path.join(dbPath, 'sticker.db'), autoload: true }),
    stats: new Datastore({ filename: path.join(dbPath, 'stats.db'), autoload: true }),
};

// Auto-compactación cada 5 minutos para optimizar rendimiento
Object.values(collections).forEach(db => {
    db.setAutocompactionInterval(300000);
});

global.db = {
    data: {
        users: {},
        chats: {},
        settings: {},
        msgs: {},
        sticker: {},
        stats: {},
    },
};

// Funciones de sanitización para IDs con puntos
function sanitizeId(id) {
    return id.replace(/\./g, '_');
}

function unsanitizeId(id) {
    return id.replace(/_/g, '.');
}

function sanitizeObject(obj) {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        const sanitizedKey = key.replace(/\./g, '_');
        sanitized[sanitizedKey] = (typeof value === 'object' && value !== null) ? sanitizeObject(value) : value;
    }
    return sanitized;
}

function unsanitizeObject(obj) {
    const unsanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        const unsanitizedKey = key.replace(/_/g, '.');
        unsanitized[unsanitizedKey] = (typeof value === 'object' && value !== null) ? unsanitizeObject(value) : value;
    }
    return unsanitized;
}

// Funciones de base de datos optimizadas
global.db.readData = async function (category, id) {
    const sanitizedId = sanitizeId(id);
    if (!global.db.data[category][sanitizedId]) {
        const data = await new Promise((resolve, reject) => {
            collections[category].findOne({ _id: sanitizedId }, (err, doc) => {
                if (err) return reject(err);
                resolve(doc ? unsanitizeObject(doc.data) : {});
            });
        });
        global.db.data[category][sanitizedId] = data;
    }
    return global.db.data[category][sanitizedId];
};

global.db.writeData = async function (category, id, data) {
    const sanitizedId = sanitizeId(id);
    global.db.data[category][sanitizedId] = {
        ...global.db.data[category][sanitizedId],
        ...sanitizeObject(data),
    };
    await new Promise((resolve, reject) => {
        collections[category].update(
            { _id: sanitizedId },
            { $set: { data: sanitizeObject(global.db.data[category][sanitizedId]) } },
            { upsert: true },
            (err) => {
                if (err) return reject(err);
                resolve();
            }
        );
    });
};

global.db.loadDatabase = async function () {
    const loadPromises = Object.keys(collections).map(async (category) => {
        const docs = await new Promise((resolve, reject) => {
            collections[category].find({}, (err, docs) => {
                if (err) return reject(err);
                resolve(docs);
            });
        });
        const seenIds = new Set();
        for (const doc of docs) {
            const originalId = unsanitizeId(doc._id);
            if (seenIds.has(originalId)) {
                // Eliminar duplicados
                await new Promise((resolve, reject) => {
                    collections[category].remove({ _id: doc._id }, {}, (err) => {
                        if (err) return reject(err);
                        resolve();
                    });
                });
            } else {
                seenIds.add(originalId);
                if (category === 'users' && (originalId.includes('@newsletter') || originalId.includes('lid'))) continue;
                if (category === 'chats' && originalId.includes('@newsletter')) continue;
                global.db.data[category][originalId] = unsanitizeObject(doc.data);
            }
        }
    });
    await Promise.all(loadPromises);
};

global.db.save = async function () {
    const savePromises = [];
    for (const category of Object.keys(global.db.data)) {
        for (const [id, data] of Object.entries(global.db.data[category])) {
            if (Object.keys(data).length > 0) {
                if (category === 'users' && (id.includes('@newsletter') || id.includes('lid'))) continue;
                if (category === 'chats' && id.includes('@newsletter')) continue;
                savePromises.push(
                    new Promise((resolve, reject) => {
                        collections[category].update(
                            { _id: sanitizeId(id) },
                            { $set: { data: sanitizeObject(data) } },
                            { upsert: true },
                            (err) => {
                                if (err) return reject(err);
                                resolve();
                            }
                        );
                    })
                );
            }
        }
    }
    await Promise.all(savePromises);
};

// Cargar base de datos al inicio
global.db.loadDatabase().then(() => {
    console.log(chalk.green('𒁈 Base de datos Avenix-Multi cargada correctamente'));
}).catch(err => {
    console.error(chalk.red('𒁈 Error cargando base de datos:', err));
});

// Guardar antes de cerrar
async function gracefulShutdown() {
    await global.db.save();
    console.log(chalk.yellow('𒁈 Guardando base de datos antes de cerrar...'));
    process.exit(0);
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// ═══════════════════════════════════════════════════════════════════════════════
// │                        CONFIGURACIONES DE SESIÓN                            │
// ═══════════════════════════════════════════════════════════════════════════════

global.creds = 'creds.json';
global.authFile = 'AvenixSession';
global.authFileJB = 'AvenixJadiBot';
global.rutaBot = join(__dirname, authFile);
global.rutaJadiBot = join(__dirname, authFileJB);
const respaldoDir = join(__dirname, 'BackupSession');
const credsFile = join(global.rutaBot, global.creds);
const backupFile = join(respaldoDir, global.creds);

// Crear directorios necesarios
if (!fs.existsSync(rutaJadiBot)) {
    fs.mkdirSync(rutaJadiBot)
}
if (!fs.existsSync(respaldoDir)) fs.mkdirSync(respaldoDir);

// ═══════════════════════════════════════════════════════════════════════════════
// │                     CONFIGURACIÓN DE CONEXIÓN BAILEYS                       │
// ═══════════════════════════════════════════════════════════════════════════════

const {state, saveState, saveCreds} = await useMultiFileAuthState(global.authFile);
const msgRetryCounterMap = new Map();
const msgRetryCounterCache = new NodeCache({ stdTTL: 0, checkperiod: 0 });
const userDevicesCache = new NodeCache({ stdTTL: 0, checkperiod: 0 });
const {version} = await fetchLatestBaileysVersion();
let phoneNumber = global.botNumberCode;

let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
})

const question = (texto) => {
    rl.clearLine(rl.input, 0)
    return new Promise((resolver) => {
        rl.question(texto, (respuesta) => {
            rl.clearLine(rl.input, 0)
            resolver(respuesta.trim())
        })
    })
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      CONTROL DE GENERACIÓN DE QR                            │
// ═══════════════════════════════════════════════════════════════════════════════

let qrGenerated = false;
let qrTimeout = null;
let qrCount = 0;
const MAX_QR_ATTEMPTS = 10;

function clearQRTimeout() {
    if (qrTimeout) {
        clearTimeout(qrTimeout);
        qrTimeout = null;
    }
}

function setupQRTimeout() {
    clearQRTimeout();
    qrTimeout = setTimeout(() => {
        if (!conn.user && qrCount < MAX_QR_ATTEMPTS) {
            console.log(chalk.yellow('\n𒁈 QR expirado después de 45 segundos. Generando nuevo QR...'));
            qrGenerated = false;
            qrCount++;
            // El QR se regenerará automáticamente en el próximo ciclo
        } else if (qrCount >= MAX_QR_ATTEMPTS) {
            console.log(chalk.red('\n𒁈 Máximo de intentos de QR alcanzado. Reiniciando...'));
            process.exit(1);
        }
    }, 45000); // 45 segundos
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      SELECCIÓN DE MÉTODO DE CONEXIÓN                        │
// ═══════════════════════════════════════════════════════════════════════════════

let opcion;
const methodCodeQR = AVENIX_MODE === 'qr' || process.argv.includes("qr");
const methodCode = AVENIX_MODE === 'code' || !!phoneNumber || process.argv.includes("code");
const MethodMobile = process.argv.includes("mobile");

console.log(chalk.gray(`𒁈 Argumentos detectados: ${process.argv.slice(2).join(', ') || 'ninguno'}`));

if (methodCodeQR || AVENIX_MODE === 'qr') {
    opcion = '1';
    console.log(chalk.green('𒁈 Método QR seleccionado automáticamente'));
} else if (methodCode || AVENIX_MODE === 'code') {
    opcion = '2';
    console.log(chalk.green('𒁈 Método código de 8 dígitos seleccionado automáticamente'));
} else if (!fs.existsSync(`./${authFile}/creds.json`)) {
    // Solo mostrar menú interactivo si no hay sesión y no se especificó método
    do {
        let lineM = '⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ 》'
        opcion = await question(`╭${lineM}  
┊ ${chalk.blueBright('╭┈────────────── ')}
┊ ${chalk.blueBright('┊')} ${chalk.blue.bgBlue.bold.cyan('𒁈 AVENIX-MULTI V2.0.0 𒁈')}
┊ ${chalk.blueBright('╰───────────➤Hepein Oficial')}   
┊ ${chalk.blueBright('╭┈──────────────')}     
┊ ${chalk.blueBright('┊')} ${chalk.green.bgMagenta.bold.yellow('Selecciona método de conexión:')}
┊ ${chalk.blueBright('┊')} ${chalk.bold.redBright(`⇢  Opción 1:`)} ${chalk.greenBright('Código QR (Recomendado)')}
┊ ${chalk.blueBright('┊')} ${chalk.bold.redBright(`⇢  Opción 2:`)} ${chalk.greenBright('Código de 8 dígitos')}
┊ ${chalk.blueBright('╰───────────────')}
┊ ${chalk.blueBright('╭┈──────────────')}     
┊ ${chalk.blueBright('┊')} ${chalk.italic.magenta('Creado por: Hepein Oficial')}
┊ ${chalk.blueBright('┊')} ${chalk.italic.magenta('WhatsApp: +51 916360161')}
┊ ${chalk.blueBright('╰───────────────')} 
┊ ${chalk.blueBright('╭┈──────────────')}    
┊ ${chalk.blueBright('┊')} ${chalk.red.bgRed.bold.green('Comandos disponibles:')}
┊ ${chalk.blueBright('┊')} ${chalk.italic.cyan('• #on anticall - Activar anti-llamadas')}
┊ ${chalk.blueBright('┊')} ${chalk.italic.cyan('• #off antilink - Desactivar anti-links')}
┊ ${chalk.blueBright('┊')} ${chalk.bold.yellow(`npm run qr ${chalk.italic.magenta(`(Método QR)`)}`)}
┊ ${chalk.blueBright('┊')} ${chalk.bold.yellow(`npm run code ${chalk.italic.magenta(`(Método código)`)}`)}
┊ ${chalk.blueBright('┊')} ${chalk.bold.yellow(`npm start ${chalk.italic.magenta(`(Automático)`)}`)}
┊ ${chalk.blueBright('╰───────────────')} 
╰${lineM}\n${chalk.bold.magentaBright('---> ')}`)
        
        if (!/^[1-2]$/.test(opcion)) {
            console.log(chalk.bold.redBright('𒁈 Por favor, seleccione solo 1 o 2.'))
        }
    } 
    while (opcion !== '1' && opcion !== '2')
} else {
    // Si existe sesión, usar modo automático
    opcion = '1'; // Default QR si hay sesión existente
    console.log(chalk.blue('𒁈 Sesión existente detectada, iniciando automáticamente...'));
}

// Filtros para logs no deseados
const filterStrings = [
    "Q2xvc2luZyBzdGFsZSBvcGVu", // "Closing stable open"
    "Q2xvc2luZyBvcGVuIHNlc3Npb24=", // "Closing open session"
    "RmFpbGVkIHRvIGRlY3J5cHQ=", // "Failed to decrypt"
    "U2Vzc2lvbiBlcnJvcg==", // "Session error"
    "RXJyb3I6IEJhZCBNQUM=", // "Error: Bad MAC" 
    "RGVjcnlwdGVkIG1lc3NhZ2U=" // "Decrypted message" 
]

console.info = () => {} 
console.debug = () => {} 
['log', 'warn', 'error'].forEach(methodName => redefineConsoleMethod(methodName, filterStrings))

// Opciones de conexión optimizadas
const connectionOptions = {
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false, // Manejamos el QR manualmente
    mobile: MethodMobile, 
    browser: opcion == '1' ? ['Avenix-Multi', 'Edge', '20.0.04'] : methodCodeQR ? ['Avenix-Multi', 'Edge', '20.0.04'] : ["Ubuntu", "Chrome", "20.0.04"],
    auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, Pino({ level: "fatal" }).child({ level: "fatal" })),
    },
    markOnlineOnConnect: false, 
    generateHighQualityLinkPreview: true, 
    syncFullHistory: false,
    getMessage: async (key) => {
        try {
            let jid = jidNormalizedUser(key.remoteJid);
            let msg = await store.loadMessage(jid, key.id);
            return msg?.message || "";
        } catch (error) {
            return "";
        }
    },
    msgRetryCounterCache: msgRetryCounterCache || new Map(),
    userDevicesCache: userDevicesCache || new Map(),
    defaultQueryTimeoutMs: undefined,
    cachedGroupMetadata: (jid) => global.conn.chats[jid] ?? {},
    version: version, 
    keepAliveIntervalMs: 55000, 
    maxIdleTimeMs: 60000, 
};

global.conn = makeWASocket(connectionOptions)

// ═══════════════════════════════════════════════════════════════════════════════
// │                        MANEJO DE CÓDIGO DE EMPAREJAMIENTO                   │
// ═══════════════════════════════════════════════════════════════════════════════

if (!fs.existsSync(`./${authFile}/creds.json`)) {
    if (opcion === '2' || methodCode) {
        opcion = '2'
        if (!conn.authState.creds.registered) {
            let addNumber
            if (!!phoneNumber) {
                addNumber = phoneNumber.replace(/[^0-9]/g, '')
            } else {
                do {
                    phoneNumber = await question(chalk.bgBlack(chalk.bold.greenBright('𒁈 Ingrese su número de WhatsApp:\n---> ')))
                    phoneNumber = phoneNumber.replace(/\D/g,'')
                    if (!phoneNumber.startsWith('+')) {
                        phoneNumber = `+${phoneNumber}`
                    }
                } while (!await isValidPhoneNumber(phoneNumber))
                rl.close()
                addNumber = phoneNumber.replace(/\D/g, '')
                setTimeout(async () => {
                    let codeBot = await conn.requestPairingCode(addNumber)
                    codeBot = codeBot?.match(/.{1,4}/g)?.join("-") || codeBot
                    console.log(chalk.bold.white(chalk.bgMagenta('𒁈 Código de emparejamiento:')), chalk.bold.white(chalk.white(codeBot)))
                }, 2000)
            }
        }
    }
}

conn.isInit = false
conn.well = false

// ═══════════════════════════════════════════════════════════════════════════════
// │                         SISTEMA DE GUARDADO AUTOMÁTICO                      │
// ═══════════════════════════════════════════════════════════════════════════════

if (!opts['test']) {
    if (global.db) setInterval(async () => {
        if (global.db.data) await global.db.save();
        if (opts['autocleartmp'] && (global.support || {}).find) (tmp = [os.tmpdir(), 'tmp', "AvenixJadiBot"], tmp.forEach(filename => cp.spawn('find', [filename, '-amin', '2', '-type', 'f', '-delete'])))
    }, 30 * 1000)
}

if (opts['server']) (await import('./server.js')).default(global.conn, PORT)

// ═══════════════════════════════════════════════════════════════════════════════
// │                       SISTEMA DE RESPALDO AUTOMÁTICO                        │
// ═══════════════════════════════════════════════════════════════════════════════

const backupCreds = async () => {
    if (!fs.existsSync(credsFile)) {
        console.log(chalk.yellow('𒁈 No se encontró el archivo creds.json para respaldar.'));
        return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const newBackup = join(respaldoDir, `creds-${timestamp}.json`);
    fs.copyFileSync(credsFile, newBackup);
    console.log(chalk.green(`𒁈 Respaldo creado: ${newBackup}`));

    // Mantener solo los 3 respaldos más recientes
    const backups = fs.readdirSync(respaldoDir)
        .filter(file => file.startsWith('creds-') && file.endsWith('.json'))
        .sort((a, b) => fs.statSync(join(respaldoDir, a)).mtimeMs - fs.statSync(join(respaldoDir, b)).mtimeMs);
    
    while (backups.length > 3) {
        const oldest = backups.shift();
        fs.unlinkSync(join(respaldoDir, oldest));
        console.log(chalk.cyan(`𒁈 Respaldo antiguo eliminado: ${oldest}`));
    }
}; 

const restoreCreds = async () => {
    const backups = fs.readdirSync(respaldoDir)
        .filter(file => file.startsWith('creds-') && file.endsWith('.json'))
        .sort((a, b) => fs.statSync(join(respaldoDir, b)).mtimeMs - fs.statSync(join(respaldoDir, a)).mtimeMs);
    
    if (backups.length === 0) {
        console.log(chalk.yellow('𒁈 No hay respaldos disponibles para restaurar.'));
        return;
    }

    const latestBackup = join(respaldoDir, backups[0]);
    fs.copyFileSync(latestBackup, credsFile);
    console.log(chalk.green(`𒁈 Restaurado desde respaldo: ${backups[0]}`));
};

// Respaldo automático cada 5 minutos
setInterval(async () => {
    await backupCreds();
    console.log(chalk.blue('𒁈 Respaldo periódico realizado.'))
}, 5 * 60 * 1000);

// ═══════════════════════════════════════════════════════════════════════════════
// │                        MANEJO DE ACTUALIZACIONES DE CONEXIÓN                │
// ═══════════════════════════════════════════════════════════════════════════════

async function connectionUpdate(update) {  
    const {connection, lastDisconnect, isNewLogin, qr} = update
    global.stopped = connection
    if (isNewLogin) conn.isInit = true
    const code = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode
    
    if (code && code !== DisconnectReason.loggedOut && conn?.ws.socket == null) {
        await global.reloadHandler(true).catch(console.error)
        global.timestamp.connect = new Date
    }
    
    if (global.db.data == null) loadDatabase()
    
    // MANEJO CONTROLADO DEL QR - VERSIÓN CORREGIDA
    if (qr && (opcion == '1' || methodCodeQR || AVENIX_MODE === 'qr')) {
        const now = Date.now();
        
        // Prevenir QR repetidos con intervalo estricto
        if (now - lastQRTime < QR_INTERVAL) {
            return; // Ignorar QR duplicados
        }
        
        // Si ya estamos conectados, no mostrar más QRs
        if (conn.user) {
            console.log(chalk.green('𒁈 Bot ya conectado, ignorando QR adicionales'));
            return;
        }
        
        lastQRTime = now;
        qrCount++;
        
        // Limpiar pantalla solo para el primer QR
        if (!qrDisplayed) {
            console.clear();
            qrDisplayed = true;
        }
        
        console.log(chalk.cyan('\n╭' + '─'.repeat(60) + '╮'));
        console.log(chalk.cyan('│') + chalk.bold.yellow(' '.repeat(15) + '𒁈 AVENIX-MULTI QR CODE 𒁈' + ' '.repeat(15)) + chalk.cyan('│'));
        console.log(chalk.cyan('│') + chalk.gray(' '.repeat(20) + 'Escanea con WhatsApp' + ' '.repeat(20)) + chalk.cyan('│'));
        console.log(chalk.cyan('├' + '─'.repeat(60) + '┤'));
        console.log(chalk.cyan('│') + chalk.white(` ⏰ QR #${qrCount} - Válido por 15 segundos`.padEnd(58)) + chalk.cyan('│'));
        console.log(chalk.cyan('│') + chalk.blue(` 👑 Creado por: Hepein Oficial`.padEnd(58)) + chalk.cyan('│'));
        console.log(chalk.cyan('╰' + '─'.repeat(60) + '╯'));
        
        // Mostrar QR en terminal
        try {
            const QRCode = await import('qrcode');
            const qrString = await QRCode.toString(qr, { 
                type: 'terminal',
                small: true,
                errorCorrectionLevel: 'M',
                margin: 1
            });
            console.log(qrString);
            console.log(chalk.cyan('𒁈 Escanea el QR con WhatsApp - Se renovará automáticamente\n'));
        } catch (error) {
            console.log(chalk.red('𒁈 Error mostrando QR visual'));
            console.log(chalk.yellow('𒁈 QR String:'), qr);
        }
        
        // Límite de intentos
        if (qrCount >= MAX_QR_ATTEMPTS) {
            console.log(chalk.red('\n𒁈 Límite de QRs alcanzado. Reiniciando proceso...'));
            setTimeout(() => {
                process.exit(0); // Salida limpia
            }, 2000);
        }
    }
    
    if (connection == 'open') {
        // Resetear variables de control
        qrCount = 0;
        lastQRTime = 0;
        qrDisplayed = false;
        
        console.clear();
        console.log(chalk.bold.greenBright('\n╭' + '─'.repeat(50) + '╮'));
        console.log(chalk.bold.greenBright('│') + chalk.bold.white(' '.repeat(8) + '🎉 CONEXIÓN EXITOSA 🎉' + ' '.repeat(8)) + chalk.bold.greenBright('│'));
        console.log(chalk.bold.greenBright('│') + chalk.white(' '.repeat(6) + 'Avenix-Multi V2.0.0 Conectado' + ' '.repeat(6)) + chalk.bold.greenBright('│'));
        console.log(chalk.bold.greenBright('│') + chalk.cyan(' '.repeat(10) + 'Por: Hepein Oficial' + ' '.repeat(15)) + chalk.bold.greenBright('│'));
        console.log(chalk.bold.greenBright('╰' + '─'.repeat(50) + '╯\n'));
        
        await joinChannels(conn);
    }
    
    let reason = new Boom(lastDisconnect?.error)?.output?.statusCode
    
    if (connection === 'close') {
        // Resetear variables
        qrCount = 0;
        lastQRTime = 0;
        qrDisplayed = false;
        
        if (reason === DisconnectReason.badSession) {
            console.log(chalk.bold.cyanBright('𒁈 Sesión incorrecta, eliminando y reconectando...'))
        } else if (reason === DisconnectReason.connectionClosed) {
            console.log(chalk.bold.magentaBright('𒁈 Conexión cerrada, restaurando respaldo...'))
            await restoreCreds();
            await global.reloadHandler(true).catch(console.error)
        } else if (reason === DisconnectReason.connectionLost) {
            console.log(chalk.bold.blueBright('𒁈 Conexión perdida, restaurando y reconectando...'))
            await restoreCreds();
            await global.reloadHandler(true).catch(console.error)
        } else if (reason === DisconnectReason.connectionReplaced) {
            console.log(chalk.bold.yellowBright('𒁈 Conexión reemplazada por otra sesión.'))
        } else if (reason === DisconnectReason.loggedOut) {
            console.log(chalk.bold.redBright('𒁈 Sesión cerrada, requiere nueva autenticación.'))
            await global.reloadHandler(true).catch(console.error)
        } else if (reason === DisconnectReason.restartRequired) {
            console.log(chalk.bold.cyanBright('𒁈 Reinicio requerido, ejecutando...'))
            await global.reloadHandler(true).catch(console.error)
        } else if (reason === DisconnectReason.timedOut) {
            console.log(chalk.bold.yellowBright('𒁈 Tiempo de conexión agotado, reconectando...'))
            await global.reloadHandler(true).catch(console.error)
        } else {
            console.log(chalk.bold.redBright(`𒁈 Razón de desconexión desconocida: ${reason || connection}`))
        }
    }
}

process.on('uncaughtException', console.error);

// ═══════════════════════════════════════════════════════════════════════════════
// │                           MANEJO DE HANDLER Y PLUGINS                       │
// ═══════════════════════════════════════════════════════════════════════════════

let isInit = true;
let handler = await import('./handler.js');

global.reloadHandler = async function(restatConn) {
    try {
        const Handler = await import(`./handler.js?update=${Date.now()}`).catch(console.error);
        if (Object.keys(Handler || {}).length) handler = Handler;
    } catch (e) {
        console.error(e);
    }
    
    if (restatConn) {
        const oldChats = global.conn.chats;
        try {
            global.conn.ws.close();
        } catch { }
        conn.ev.removeAllListeners();
        global.conn = makeWASocket(connectionOptions, {chats: oldChats});
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
    
    // Mensajes personalizados para grupos
    conn.welcome = '👋 *¡Bienvenido @user!* \n\n🎉 *AVENIX-MULTI* 🎉\n🏷️ Grupo: @subject\n📝 Descripción: @desc\n\n𒁈 *Creado por Hepein Oficial*'
    conn.bye = '👋 *¡Hasta pronto @user!* \n\n😢 *AVENIX-MULTI* \n🏷️ Grupo: @subject\n\n𒁈 *Esperamos verte pronto*'
    conn.spromote = '👑 *@user* ahora es administrador \n\n🎉 *¡Felicidades!* \n𒁈 *Avenix-Multi*'
    conn.sdemote = '📉 *@user* ya no es administrador \n\n😔 *Rol removido* \n𒁈 *Avenix-Multi*'
    conn.sDesc = '📝 *Descripción del grupo actualizada* \n\n📋 Nueva descripción: \n@desc \n\n𒁈 *Avenix-Multi*'
    conn.sSubject = '🏷️ *Nombre del grupo actualizado* \n\n📝 Nuevo nombre: @subject \n\n𒁈 *Avenix-Multi*'
    conn.sIcon = '🖼️ *Foto del grupo actualizada* \n\n📸 Nueva imagen establecida \n\n𒁈 *Avenix-Multi*'
    conn.sRevoke = '🔗 *Link del grupo restablecido* \n\n🆕 Nuevo enlace: @revoke \n\n𒁈 *Avenix-Multi*'
    
    conn.handler = handler.handler.bind(global.conn);
    conn.participantsUpdate = handler.participantsUpdate.bind(global.conn);
    conn.groupsUpdate = handler.groupsUpdate.bind(global.conn);
    conn.onDelete = handler.deleteUpdate.bind(global.conn);
    conn.onCall = handler.callUpdate.bind(global.conn);
    conn.connectionUpdate = connectionUpdate.bind(global.conn);
    conn.credsUpdate = saveCreds.bind(global.conn, true);
    
    conn.ev.on('messages.upsert', conn.handler);
    conn.ev.on('group-participants.update', conn.participantsUpdate);
    conn.ev.on('groups.update', conn.groupsUpdate);
    conn.ev.on('message.delete', conn.onDelete);
    conn.ev.on('call', conn.onCall);
    conn.ev.on('connection.update', conn.connectionUpdate);
    conn.ev.on('creds.update', conn.credsUpdate);
    
    isInit = false
    return true
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                           SISTEMA DE JADIBOT                                │
// ═══════════════════════════════════════════════════════════════════════════════

if (global.AvenixJadibts) {
    const readRutaJadiBot = readdirSync(rutaJadiBot)
    if (readRutaJadiBot.length > 0) {
        const creds = 'creds.json'
        for (const gjbts of readRutaJadiBot) {
            const botPath = join(rutaJadiBot, gjbts)
            const readBotPath = readdirSync(botPath)
            if (readBotPath.includes(creds)) {
                AvenixJadiBot({pathAvenixJadiBot: botPath, m: null, conn, args: '', usedPrefix: '#', command: 'serbot'})
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                          CARGA DE PLUGINS                                   │
// ═══════════════════════════════════════════════════════════════════════════════

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
filesInit().then((_) => Object.keys(global.plugins)).catch(console.error)

global.reload = async (_ev, filename) => {
    if (pluginFilter(filename)) {
        const dir = global.__filename(join(pluginFolder, filename), true)
        if (filename in global.plugins) {
            if (existsSync(dir)) conn.logger.info(`𒁈 Plugin actualizado: '${filename}'`)
            else {
                conn.logger.warn(`𒁈 Plugin eliminado: '${filename}'`)
                return delete global.plugins[filename];
            }
        } else conn.logger.info(`𒁈 Nuevo plugin detectado: '${filename}'`)
        
        const err = syntaxerror(readFileSync(dir), filename, {
            sourceType: 'module',
            allowAwaitOutsideFunction: true,
        });
        
        if (err) conn.logger.error(`𒁈 Error de sintaxis en '${filename}'\n${format(err)}`);
        else {
            try {
                const module = (await import(`${global.__filename(dir)}?update=${Date.now()}`));
                global.plugins[filename] = module.default || module;
            } catch (e) {
                conn.logger.error(`𒁈 Error cargando plugin '${filename}'\n${format(e)}'`);
            } finally {
                global.plugins = Object.fromEntries(Object.entries(global.plugins).sort(([a], [b]) => a.localeCompare(b)));
            }
        }
    }
};

Object.freeze(global.reload);
watch(pluginFolder, global.reload);
await global.reloadHandler();

// ═══════════════════════════════════════════════════════════════════════════════
// │                        FUNCIONES DE LIMPIEZA Y MANTENIMIENTO                │
// ═══════════════════════════════════════════════════════════════════════════════

// Solo ejecutar tests si no están deshabilitados
/*if (!DISABLE_TESTS && process.argv.includes('--run-tests')) {
    try {
        const TestSuite = await import('./test.js');
        console.log(chalk.blue('𒁈 Ejecutando suite de tests...'));
        // Ejecutar tests en segundo plano
        setTimeout(async () => {
            try {
                await TestSuite.default();
            } catch (error) {
                console.log(chalk.yellow('𒁈 Tests completados con advertencias'));
            }
        }, 5000);
    } catch (error) {
        console.log(chalk.gray('𒁈 Suite de tests no disponible'));
    }
}*/

async function _quickTest() {
    const test = await Promise.all([
        spawn('ffmpeg'),
        spawn('ffprobe'),
        spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-filter_complex', 'color', '-frames:v', '1', '-f', 'webp', '-']),
        spawn('convert'),
        spawn('magick'),
        spawn('gm'),
        spawn('find', ['--version']),
    ].map((p) => {
        return Promise.race([
            new Promise((resolve) => { p.on('close', (code) => { resolve(code !== 127); }); }),
            new Promise((resolve) => { p.on('error', (_) => resolve(false)); })
        ]);
    }));
    const [ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find] = test;
    const s = global.support = {ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find};
    Object.freeze(global.support);
}

function clearTmp() {
    const tmpDir = join(__dirname, 'tmp')
    if (existsSync(tmpDir)) {
        const filenames = readdirSync(tmpDir)
        filenames.forEach(file => {
            const filePath = join(tmpDir, file)
            if (existsSync(filePath)) unlinkSync(filePath)
        })
    }
}

async function purgeSession() {
    const sessionDir = './AvenixSession';
    try {
        if (!existsSync(sessionDir)) return;
        const files = await readdir(sessionDir);
        const preKeys = files.filter(file => file.startsWith('pre-key-')); 
        const now = Date.now();
        const oneHourAgo = now - (24 * 60 * 60 * 1000); // 24 horas
        
        for (const file of preKeys) {
            const filePath = join(sessionDir, file);
            const fileStats = await stat(filePath);
            if (fileStats.mtimeMs < oneHourAgo) { 
                try {
                    await unlink(filePath);
                    console.log(chalk.green(`𒁈 Pre-key antigua eliminada: ${file}`));
                } catch (err) {
                    // Error silencioso
                }
            }
        }
        console.log(chalk.cyanBright(`𒁈 Sesiones limpias en ${global.authFile}`));
    } catch (err) {
        // Error silencioso
    }
}

async function purgeSessionSB() {
    const jadibtsDir = './AvenixJadiBot/';
    try {
        if (!existsSync(jadibtsDir)) return;
        const directories = await readdir(jadibtsDir);
        let SBprekey = [];
        const now = Date.now();
        const oneHourAgo = now - (24 * 60 * 60 * 1000); // 24 horas

        for (const dir of directories) {
            const dirPath = join(jadibtsDir, dir);
            const stats = await stat(dirPath);
            if (stats.isDirectory()) {
                const files = await readdir(dirPath);
                const preKeys = files.filter(file => file.startsWith('pre-key-') && file !== 'creds.json');
                SBprekey = [...SBprekey, ...preKeys];
                
                for (const file of preKeys) {
                    const filePath = join(dirPath, file);
                    const fileStats = await stat(filePath);
                    if (fileStats.mtimeMs < oneHourAgo) { 
                        try {
                            await unlink(filePath);
                            console.log(chalk.bold.green(`𒁈 Pre-key eliminada de sub-bot: ${file}`))
                        } catch (err) {
                            // Error silencioso
                        }
                    }
                }
            }
        }
        
        if (SBprekey.length === 0) {
            console.log(chalk.bold.green('𒁈 No hay pre-keys antiguas en sub-bots'))
        } else {
            console.log(chalk.cyanBright(`𒁈 Pre-keys eliminadas de sub-bots: ${SBprekey.length}`));
        }
    } catch (err) {
        console.log(chalk.bold.red('𒁈 Error limpiando sub-bots: ' + err))
    }
}

async function purgeOldFiles() {
    const directories = ['./AvenixSession/', './AvenixJadiBot/'];
    for (const dir of directories) {
        try {
            if (!fs.existsSync(dir)) continue;
            const files = await fsPromises.readdir(dir); 
            for (const file of files) {
                if (file !== 'creds.json') {
                    const filePath = join(dir, file);
                    try {
                        await fsPromises.unlink(filePath);
                    } catch (err) {
                        // Error silencioso
                    }
                }
            }
        } catch (err) {
            // Error silencioso
        }
    }
}

function redefineConsoleMethod(methodName, filterStrings) {
    const originalConsoleMethod = console[methodName]
    console[methodName] = function() {
        const message = arguments[0]
        if (typeof message === 'string' && filterStrings.some(filterString => message.includes(atob(filterString)))) {
            arguments[0] = ""
        }
        originalConsoleMethod.apply(console, arguments)
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                           INTERVALOS DE MANTENIMIENTO                       │
// ═══════════════════════════════════════════════════════════════════════════════

// Limpieza de archivos temporales cada 3 minutos
setInterval(async () => {
    if (stopped === 'close' || !conn || !conn.user) return
    await clearTmp()
    console.log(chalk.bold.cyanBright('𒁈 Archivos temporales eliminados'))
}, 1000 * 60 * 3)

// Limpieza de sesiones cada 10 minutos
setInterval(async () => {
    if (stopped === 'close' || !conn || !conn.user) return
    await purgeSessionSB()
    await purgeSession()
    console.log(chalk.bold.cyanBright('𒁈 Sesiones optimizadas'))
    await purgeOldFiles()
    console.log(chalk.bold.cyanBright('𒁈 Archivos antiguos eliminados'))
}, 1000 * 60 * 10)

// Inicializar sistema de soporte
_quickTest().then(() => conn.logger.info(chalk.bold('𒁈 Avenix-Multi cargando sistemas...'))).catch(console.error)

// ═══════════════════════════════════════════════════════════════════════════════
// │                           FUNCIONES AUXILIARES                              │
// ═══════════════════════════════════════════════════════════════════════════════

async function isValidPhoneNumber(number) {
    try {
        number = number.replace(/\s+/g, '')
        // Manejar números mexicanos
        if (number.startsWith('+521')) {
            number = number.replace('+521', '+52');
        } else if (number.startsWith('+52') && number[4] === '1') {
            number = number.replace('+52 1', '+52');
        }
        const parsedNumber = phoneUtil.parseAndKeepRawInput(number)
        return phoneUtil.isValidNumber(parsedNumber)
    } catch (error) {
        return false
    }
}

async function joinChannels(conn) {
    for (const channelId of Object.values(global.ch || {})) {
        await conn.newsletterFollow(channelId).catch(() => {})
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                           WATCHFILE PARA AUTO-RELOAD                        │
// ═══════════════════════════════════════════════════════════════════════════════

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
    unwatchFile(file)
    console.log(chalk.bold.greenBright('𒁈 Main.js actualizado y reiniciado'))
    import(`${file}?update=${Date.now()}`)
})

console.log(chalk.bold.magenta('𒁈 Avenix-Multi V2.0.0 iniciado por Hepein Oficial'))
