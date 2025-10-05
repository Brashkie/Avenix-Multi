/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                            𒁈 AVENIX-MULTI V2.0.0 𒁈                         ┃
 * ┃                                                                               ┃
 * ┃              ▄▀█ █░█ █▀▀ █▄░█ █ ▀▄▀   █▀▄▀█ █░█ █░░ ▀█▀ █                  ┃
 * ┃              █▀█ ▀▄▀ ██▄ █░▀█ █ █░█   █░▀░█ █▄█ █▄▄ ░█░ █                  ┃
 * ┃                                                                               ┃
 * ┃                      🚀 INDEX.JS - PUNTO DE ENTRADA 🚀                       ┃
 * ┃                                                                               ┃
 * ┃     👑 Creado por: Hepein Oficial                                            ┃
 * ┃     📧 Contacto: electronicatudo2006@gmail.com                               ┃
 * ┃     📱 WhatsApp: +51 916360161                                               ┃
 * ┃     🌟 GitHub: https://github.com/Brashkie/Avenix-Multi                      ┃
 * ┃                                                                               ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */
//index.js
import cluster from 'cluster'
const { setupPrimary, fork } = cluster
import { join, dirname } from 'path'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { watchFile, unwatchFile, existsSync, writeFileSync } from 'fs'
import cfonts from 'cfonts'
import { createInterface } from 'readline'
import yargs from 'yargs'
import chalk from 'chalk'

console.log(chalk.cyan('\n𒁈 Iniciando Avenix-Multi v6.0.0...'))

const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(__dirname)
const { name, author, version } = require(join(__dirname, './package.json'))
const rl = createInterface(process.stdin, process.stdout)

// ═══════════════════════════════════════════════════
// ANIMACIONES PERSONALIZADAS AVENIX
// ═══════════════════════════════════════════════════

async function textoAnimado(texto, velocidad = 45, brillo = true) {
  const efectos = '◆◇◈⬡⬢⬣▓▒░█║╔╗╚╝⌬'
  let resultado = ''
  for (let i = 0; i < texto.length; i++) {
    resultado += texto[i]
    let salida = resultado
    if (brillo && Math.random() > 0.65) {
      const efecto = efectos[Math.floor(Math.random() * efectos.length)]
      salida += chalk.cyan.dim(efecto)
    }
    process.stdout.write('\r' + chalk.cyan.bold(salida))
    await new Promise(res => setTimeout(res, velocidad))
  }
  console.log()
}

async function barraAvenix() {
  const fases = [
    '𒁈 [▓░░░░░░░░░] 15%  ⟡ Cargando núcleo...',
    '𒁈 [▓▓▓░░░░░░░] 35%  ⟡ Inicializando módulos...',
    '𒁈 [▓▓▓▓▓░░░░░] 55%  ⟡ Conectando servicios...',
    '𒁈 [▓▓▓▓▓▓▓░░░] 75%  ⟡ Cargando plugins...',
    '𒁈 [▓▓▓▓▓▓▓▓▓░] 95%  ⟡ Finalizando inicio...',
    '𒁈 [▓▓▓▓▓▓▓▓▓▓] 100% ✓ Sistema operativo'
  ]
  for (let fase of fases) {
    process.stdout.write('\r' + chalk.magenta.bold(fase))
    await new Promise(res => setTimeout(res, 280))
  }
  console.log()
}

async function logoAvenix() {
  const cuadros = [
    `
    ╔════════════════════════════╗
    ║    𒁈  A V E N I X  𒁈     ║
    ║       ◆━━━━━━━◆           ║
    ║     MULTI-DEVICE BOT      ║
    ╚════════════════════════════╝`,
    `
    ╔════════════════════════════╗
    ║    𒁈  A V E N I X  𒁈     ║
    ║       ◇━━━━━━━◇           ║
    ║     MULTI-DEVICE BOT      ║
    ╚════════════════════════════╝`,
    `
    ╔════════════════════════════╗
    ║    𒁈  A V E N I X  𒁈     ║
    ║       ◈━━━━━━━◈           ║
    ║     MULTI-DEVICE BOT      ║
    ╚════════════════════════════╝`
  ]
  for (let i = 0; i < 6; i++) {
    console.clear()
    console.log(chalk.cyan.bold(cuadros[i % cuadros.length]))
    await new Promise(res => setTimeout(res, 320))
  }
}

async function bannerInfo() {
  console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════╗'))
  console.log(chalk.cyan.bold('║      𒁈 AVENIX-MULTI v6.0.0 𒁈          ║'))
  console.log(chalk.cyan.bold('╠══════════════════════════════════════════╣'))
  console.log(chalk.cyan.bold('║') + chalk.yellow('  👨‍💻 Creador: Hepein Oficial           ') + chalk.cyan.bold('║'))
  console.log(chalk.cyan.bold('║') + chalk.green('  📱 Contacto: +51916360161             ') + chalk.cyan.bold('║'))
  console.log(chalk.cyan.bold('║') + chalk.magenta('  🌐 Bot Multi-Propósito WhatsApp       ') + chalk.cyan.bold('║'))
  console.log(chalk.cyan.bold('╚══════════════════════════════════════════╝\n'))
}

async function inicioAvenix() {
  console.clear()
  
  // Logo animado
  await logoAvenix()
  
  console.clear()
  console.log(chalk.cyan.bold('\n╔═════════════════════════════════════════════════╗'))
  console.log(chalk.cyan.bold('║       𒁈 SISTEMA AVENIX-MULTI ACTIVO 𒁈        ║'))
  console.log(chalk.cyan.bold('╚═════════════════════════════════════════════════╝\n'))
  
  await textoAnimado('⟡ Estableciendo conexión con servicios...', 38, true)
  await new Promise(res => setTimeout(res, 280))
  
  await barraAvenix()
  await new Promise(res => setTimeout(res, 380))
  
  console.log(chalk.magenta.bold('\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬'))
  await textoAnimado('◆ Bot Multi-Propósito Iniciado', 42, false)
  console.log(chalk.magenta.bold('▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n'))
  
  await bannerInfo()
  
  await textoAnimado('⟡ Todos los sistemas operativos', 33, true)
  
  console.log(chalk.green.bold('\n✓ Avenix-Multi en línea'))
  console.log(chalk.yellow('⟡ Listo para recibir conexiones...\n'))
  
  await new Promise(res => setTimeout(res, 450))
  
  // ASCII Art Avenix
  console.log(chalk.cyan(`
    ░█████╗░██╗░░░██╗███████╗███╗░░██╗██╗██╗░░██╗
    ██╔══██╗██║░░░██║██╔════╝████╗░██║██║╚██╗██╔╝
    ███████║╚██╗░██╔╝█████╗░░██╔██╗██║██║░╚███╔╝░
    ██╔══██║░╚████╔╝░██╔══╝░░██║╚████║██║░██╔██╗░
    ██║░░██║░░╚██╔╝░░███████╗██║░╚███║██║██╔╝╚██╗
    ╚═╝░░╚═╝░░░╚═╝░░░╚══════╝╚═╝░░╚══╝╚═╝╚═╝░░╚═╝
           M U L T I - D E V I C E  B O T
  `))
  
  console.log(chalk.magenta(`
    ██╗  ██╗███████╗██████╗ ███████╗██╗███╗   ██╗
    ██║  ██║██╔════╝██╔══██╗██╔════╝██║████╗  ██║
    ███████║█████╗  ██████╔╝█████╗  ██║██╔██╗ ██║
    ██╔══██║██╔══╝  ██╔═══╝ ██╔══╝  ██║██║╚██╗██║
    ██║  ██║███████╗██║     ███████╗██║██║ ╚████║
    ╚═╝  ╚═╝╚══════╝╚═╝     ╚══════╝╚═╝╚═╝  ╚═══╝
  `))
  
  console.log(chalk.yellow(`
    ██████╗ ██████╗  █████╗ ███████╗██╗  ██╗██╗  ██╗██╗███████╗
    ██╔══██╗██╔══██╗██╔══██╗██╔════╝██║  ██║██║ ██╔╝██║██╔════╝
    ██████╔╝██████╔╝███████║███████╗███████║█████╔╝ ██║█████╗  
    ██╔══██╗██╔══██╗██╔══██║╚════██║██╔══██║██╔═██╗ ██║██╔══╝  
    ██████╔╝██║  ██║██║  ██║███████║██║  ██║██║  ██╗██║███████╗
    ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚══════╝
  `))
  
  console.log(chalk.gray('══════════════════════════════════════════════════'))
  await textoAnimado('𒁈 Desarrollador Principal: Hepein Oficial', 48, false)
  await textoAnimado('𒁈 Colaborador: Brashkie', 48, false)
  await textoAnimado('𒁈 WhatsApp: +51916360161', 48, false)
  await textoAnimado('𒁈 Versión: 6.0.0', 48, false)
  console.log(chalk.gray('══════════════════════════════════════════════════\n'))
}

// ═══════════════════════════════════════════════════
// MENSAJES DE REINICIO
// ═══════════════════════════════════════════════════

const reinicioMsg = [
  '\n𒁈 Sistema Avenix reiniciado ⚡ Todos los módulos activos\n',
  '\n𒁈 Reinicio completado ✓ Bot operativo nuevamente\n',
  '\n𒁈 Avenix-Multi recargado ⟡ Sistema estable\n',
  '\n𒁈 Bot restaurado desde el núcleo 🔄 Listo\n',
  '\n𒁈 Avenix v6.0.0 ⟡ Reiniciado exitosamente\n'
]

function msgRandom() {
  return reinicioMsg[Math.floor(Math.random() * reinicioMsg.length)]
}

// ═══════════════════════════════════════════════════
// FUNCIÓN PRINCIPAL - START
// ═══════════════════════════════════════════════════

let isRunning = false

function start(file) {
  if (isRunning) return
  isRunning = true

  const args = [join(__dirname, 'kernel', file), ...process.argv.slice(2)]

  setupPrimary({
    exec: args[0],
    args: args.slice(1)
  })

  const worker = fork()

  worker.on('message', data => {
    switch (data) {
      case 'reset':
        worker.process.kill()
        isRunning = false
        start(file)
        break
      case 'uptime':
        worker.send(process.uptime())
        break
    }
  })

  worker.on('exit', (_, code) => {
    isRunning = false
    console.error(chalk.red('⚠️ Error:\n'), code)
    if (code === 0) return
    watchFile(args[0], () => {
      unwatchFile(args[0])
      start(file)
    })
  })
}

// ═══════════════════════════════════════════════════
// MANEJO DE ERRORES Y ADVERTENCIAS
// ═══════════════════════════════════════════════════

process.on('warning', warning => {
  if (warning.name === 'MaxListenersExceededWarning') {
    console.warn(chalk.yellow('⚠️ Límite de listeners excedido'))
    console.warn(chalk.dim(warning.stack))
  }
})

process.on('unhandledRejection', (reason, promise) => {
  console.log(chalk.red('⚠️ Promesa rechazada sin manejar:'))
  console.log(reason)
})

process.on('uncaughtException', (error) => {
  console.log(chalk.red('⚠️ Excepción no capturada:'))
  console.log(error)
})

process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\n👋 Avenix-Multi detenido por el usuario'))
  process.exit(0)
})

// ═══════════════════════════════════════════════════
// INICIALIZACIÓN DEL SISTEMA
// ═══════════════════════════════════════════════════

const archivoControl = './.avenix-started'

if (!existsSync(archivoControl)) {
  // Primera vez ejecutando
  await inicioAvenix()
  writeFileSync(archivoControl, `𒁈 AVENIX-MULTI v${version}\nIniciado: ${new Date().toLocaleString()}\nCreado por: ${author.name}`)
} else {
  // Reinicio
  console.log(chalk.cyan.bold(msgRandom()))
}

// ═══════════════════════════════════════════════════
// INICIAR EL BOT - Archivo start.js en la raíz
// ═══════════════════════════════════════════════════

start('start.js')
