import { watchFile, unwatchFile, readFileSync } from 'fs'
import chalk from 'chalk'
import { fileURLToPath } from 'url'
import fs from 'fs'
import cheerio from 'cheerio'
import fetch from 'node-fetch'
import axios from 'axios'
import moment from 'moment-timezone'

// ═══════════════════════════════════════════════════════════════════════════════
// │                       𒁈 AVENIX-MULTI V2.0.0 CONFIG 𒁈                       │
// │                         Creado por: Hepein Oficial                           │
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// │                           PROPIETARIOS Y MODERADORES                        │
// ═══════════════════════════════════════════════════════════════════════════════

global.owner = [
  ['51916360161', '𒁈 Hepein Oficial - Creator 𒁈', true],
  [''], // Agregar números adicionales aquí
]

global.mods = [] // Moderadores
global.prems = [] // Usuarios premium

// Sistema de SubBots
global.AvenixJadibts = true // Activar/desactivar SubBots

// ═══════════════════════════════════════════════════════════════════════════════
// │                           CONFIGURACIÓN DE CONEXIÓN                         │
// ═══════════════════════════════════════════════════════════════════════════════

// Número del bot para código de 8 dígitos (opcional)
global.botNumberCode = "" // Ejemplo: "+51916360161"
global.confirmCode = "" // No modificar

// Configuraciones de hosting
global.obtenerQrWeb = 0 // QR por web (0 = desactivado, 1 = activado)
global.keepAliveRender = 0 // Keep alive para Render.com

// ═══════════════════════════════════════════════════════════════════════════════
// │                           INFORMACIÓN DEL BOT                               │
// ═══════════════════════════════════════════════════════════════════════════════

global.botname = '𒁈 𝗔𝘃𝗲𝗻𝗶𝘅-𝗠𝘂𝗹𝘁𝗶 V2.0.0 𒁈'
global.namebot = '𒁈 Avenix-Multi 𒁈'
global.textbot = 'Avenix-Multi | Bot Multi-Propósito'
global.wm = '𒁈 Avenix-Multi V2.0.0 - Hepein Oficial 𒁈'
global.author = 'Hepein Oficial'
global.dev = '© Powered by Hepein Oficial 𒁈'
global.vs = '2.0.0'
global.vsJB = '1.0 (Beta)'

// Stickers y paquetes
global.packname = '𒁈 Avenix-Multi V2.0.0'
global.stickpack = '𒁈 Avenix-Multi'
global.stickauth = `𒁈 Bot creado por Hepein Oficial\n📅 Fecha: ${moment.tz('America/Lima').format('DD/MM/YYYY')}\n⏰ Hora: ${moment.tz('America/Lima').format('HH:mm:ss')}`

// Mensajes del sistema
global.wait = '⏳ Procesando solicitud, por favor espera...\n\n𒁈 *Avenix-Multi* está trabajando 𒁈'
global.listo = '✅ ¡Listo! Aquí tienes el resultado'
global.error = '❌ Ocurrió un error, intenta nuevamente'

// ═══════════════════════════════════════════════════════════════════════════════
// │                              REDES SOCIALES                                │
// ═══════════════════════════════════════════════════════════════════════════════

global.yt = 'https://youtube.com/@HepeinOficial'
global.ig = 'https://instagram.com/hepein.oficial'
global.fb = 'https://facebook.com/hepein.oficial'
global.tk = 'https://tiktok.com/@hepein.oficial'
global.github = 'https://github.com/Brashkie/Avenix-Multi'
global.md = 'https://github.com/Brashkie/Avenix-Multi'

// Grupos y canales oficiales
global.group = 'https://chat.whatsapp.com/CBuLXuVZcg9FEfCSHiY6b0'
global.canal = 'https://whatsapp.com/channel/0029Va8t5DZ9cDDU8ntWVJ2n'
global.asistencia = 'https://chat.whatsapp.com/CnBH1Cdi1pG9jWjmAeUVGW'

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
  
  // API personalizada (si tienes)
  avenix: 'https://api.avenix-multi.com'
}

global.APIKeys = {
  'https://api.lolhuman.xyz': process.env.LOLHUMAN_API || 'AvenixMulti',
  'https://api.neoxr.eu': process.env.NEOXR_API || 'AvenixMulti',
  'https://api.fgmods.xyz': process.env.FGMODS_API || 'AvenixMulti'
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                            CONFIGURACIÓN RPG                                │
// ═══════════════════════════════════════════════════════════════════════════════

global.multiplier = 75 // Dificultad para subir de nivel
global.maxwarn = 3 // Máximo de advertencias

// Sistema de economía
global.monedas = 'AvenixCoins'
global.moneda = '🪙'

// Límites y experiencia por defecto
global.limitDefault = 25
global.expDefault = 100
global.moneyDefault = 1000

// ═══════════════════════════════════════════════════════════════════════════════
// │                             RECURSOS Y MEDIA                                │
// ═══════════════════════════════════════════════════════════════════════════════

// Imágenes (crear carpeta media/ con estas imágenes)
try {
  global.imagen1 = fs.readFileSync('./media/Avenix-1.jpg')
  global.imagen2 = fs.readFileSync('./media/Avenix-2.jpg')
  global.imagen3 = fs.readFileSync('./media/Avenix-3.jpg')
  global.catalogo = fs.readFileSync('./media/catalogo.jpg')
  global.miniurl = fs.readFileSync('./media/miniurl.jpg')
} catch (e) {
  console.log(chalk.yellow('⚠️ Algunas imágenes no se encontraron en ./media/'))
  // Usar imagen por defecto si no existe
  global.imagen1 = global.imagen2 = global.imagen3 = global.catalogo = global.miniurl = null
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

// ═══════════════════════════════════════════════════════════════════════════════
// │                           MENSAJES PERSONALIZADOS                           │
// ═══════════════════════════════════════════════════════════════════════════════

// Mensajes de estado
global.resultado = '╰〘✅〙 *RESULTADO* 〘✅〙╮\n\n'
global.advertencia = '╰〘⚠️〙 *ADVERTENCIA* 〘⚠️〙╮\n\n'
global.informacion = '╰〘ℹ️〙 *INFORMACIÓN* 〘ℹ️〙╮\n\n'
global.error_msg = '╰〘❌〙 *ERROR* 〘❌〙╮\n\n'
global.exito = '╰〘✅〙 *ÉXITO* 〘✅〙╮\n\n'

// Mensajes de grupo
global.bienvenida = `╭━═▣ 𒁈 𝗔𝘃𝗲𝗻𝗶𝘅-𝗠𝘂𝗹𝘁𝗶 𒁈 ▣═━╮
┃ 👋 *¡Bienvenido @user!*
┃ 
┃ 🏷️ *Grupo:* @subject
┃ 📝 *Descripción:* @desc
┃ 
┃ 📋 *Reglas del grupo:*
┃ • Respeta a todos los miembros
┃ • No spam excesivo
┃ • Usa los comandos con moderación
┃ 
┃ 🤖 *Usa .menu para ver comandos*
╰━═▣ 𒁈 *Hepein Oficial* 𒁈 ▣═━╯`

global.despedida = `╭━═▣ 𒁈 𝗔𝘃𝗲𝗻𝗶𝘅-𝗠𝘂𝗹𝘁𝗶 𒁈 ▣═━╮
┃ 👋 *¡Hasta pronto @user!*
┃ 
┃ 😢 Lamentamos que te vayas
┃ 🚪 Las puertas siempre están abiertas
┃ 
┃ 🤖 *¡Esperamos verte pronto!*
╰━═▣ 𒁈 *Avenix-Multi* 𒁈 ▣═━╯`

global.promote = `╭━═▣ 𒁈 𝗔𝘃𝗲𝗻𝗶𝘅-𝗠𝘂𝗹𝘁𝗶 𒁈 ▣═━╮
┃ 👑 *¡Nuevo Administrador!*
┃ 
┃ 🎉 *@user* ahora es admin
┃ 💪 ¡Usa tu poder sabiamente!
╰━═▣ 𒁈 *Avenix-Multi* 𒁈 ▣═━╯`

global.demote = `╭━═▣ 𒁈 𝗔𝘃𝗲𝗻𝗶𝘅-𝗠𝘂𝗹𝘁𝗶 𒁈 ▣═━╮
┃ 📉 *Administrador removido*
┃ 
┃ 👤 *@user* ya no es admin
╰━═▣ 𒁈 *Avenix-Multi* 𒁈 ▣═━╯`

// ═══════════════════════════════════════════════════════════════════════════════
// │                           SISTEMA DE TIEMPO                                 │
// ═══════════════════════════════════════════════════════════════════════════════

// Zona horaria (ajustar según tu ubicación)
global.timezone = 'America/Lima' // Perú (UTC-5)
global.botdate = () => moment.tz(global.timezone).format('DD/MM/YYYY')
global.bottime = () => moment.tz(global.timezone).format('HH:mm:ss')

// ═══════════════════════════════════════════════════════════════════════════════
// │                           BIBLIOTECAS GLOBALES                              │
// ═══════════════════════════════════════════════════════════════════════════════

global.cheerio = cheerio
global.fs = fs
global.fetch = fetch
global.axios = axios
global.moment = moment

// ═══════════════════════════════════════════════════════════════════════════════
// │                              CONFIGURACIONES                                │
// ═══════════════════════════════════════════════════════════════════════════════

// Archivos y directorios
global.authFile = 'AvenixSession'
global.authFileJB = 'AvenixJadiBot'
global.dbFile = 'database'

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

// ═══════════════════════════════════════════════════════════════════════════════
// │                               FUNCIONES                                     │
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

// ═══════════════════════════════════════════════════════════════════════════════
// │                             AUTO-RELOAD                                     │
// ═══════════════════════════════════════════════════════════════════════════════

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.greenBright("📁 Config actualizado: 'config.js'"))
  import(`${file}?update=${Date.now()}`)
})

console.log(chalk.cyan('𒁈 Configuración de Avenix-Multi V2.0.0 cargada exitosamente'))
