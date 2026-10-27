/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                            𒁈 AVENIX-MULTI V6.0.0 𒁈                         ┃
 * ┃                                                                               ┃
 * ┃                     🚀 INDEX.TS - PUNTO DE ENTRADA 🚀                        ┃
 * ┃                                                                               ┃
 * ┃     👑 Creado por: Hepein Oficial                                            ┃
 * ┃     📧 Contacto: electronicatudo2006@gmail.com                               ┃
 * ┃     📱 WhatsApp: +51 916360161                                               ┃
 * ┃     🌟 GitHub: https://github.com/Brashkie/Avenix-Multi                      ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import cluster, { type Worker } from 'cluster'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { dirname, extname, join } from 'path'
import { fileURLToPath } from 'url'
import { animate, ascii, canAnimate, gradient, loader, sleep } from 'ansimax'
import paint from './lib/paint.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const EXT = extname(fileURLToPath(import.meta.url)) // '.ts' con tsx, '.js' compilado
const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8')) as {
  version: string
  author: { name: string }
}

const BRAND = ['#00f5ff', '#7b2ff7', '#f107a3']
const brand = (text: string) => gradient(text, BRAND)

// ═══════════════════════════════════════════════════
// ANIMACIÓN DE INICIO (ansimax)
// ═══════════════════════════════════════════════════

async function inicioAvenix() {
  console.clear()
  console.log(ascii.banner('AVENIX', { font: 'big', colorFn: brand, align: 'center' }))
  console.log(paint.dim('                M U L T I - D E V I C E   B O T\n'))

  await animate.glitch('⟡ Estableciendo conexión con servicios...', { duration: 700 })

  const fases = ['Cargando núcleo', 'Inicializando módulos', 'Conectando servicios', 'Cargando plugins', 'Finalizando inicio']
  for (let i = 0; i < fases.length; i++) {
    loader.progress(((i + 1) / fases.length) * 100, `𒁈 ${fases[i]}...`, { width: 30 })
    await sleep(220)
  }
  console.log()

  console.log(ascii.box(
    [
      `👨‍💻 Creador:   ${pkg.author.name}`,
      '🤝 Colaborador: Brashkie',
      '📱 Contacto:  +51916360161',
      '🌐 Bot Multi-Propósito WhatsApp',
      `⚙️  Versión:   ${pkg.version}`
    ].join('\n'),
    { padding: 1, borderStyle: 'rounded', title: `𒁈 AVENIX-MULTI v${pkg.version} 𒁈` }
  ))

  await animate.typewriter('⟡ Todos los sistemas operativos', { speed: 25, colorFn: paint.cyan })
  console.log(paint.green.bold('\n✓ Avenix-Multi en línea'))
  console.log(paint.yellow('⟡ Listo para recibir conexiones...\n'))
}

// ═══════════════════════════════════════════════════
// MENSAJES DE REINICIO
// ═══════════════════════════════════════════════════

const reinicioMsg = [
  '𒁈 Sistema Avenix reiniciado ⚡ Todos los módulos activos',
  '𒁈 Reinicio completado ✓ Bot operativo nuevamente',
  '𒁈 Avenix-Multi recargado ⟡ Sistema estable',
  '𒁈 Bot restaurado desde el núcleo 🔄 Listo',
  `𒁈 Avenix v${pkg.version} ⟡ Reiniciado exitosamente`
]

// ═══════════════════════════════════════════════════
// SUPERVISOR DEL PROCESO DEL BOT
// ═══════════════════════════════════════════════════

const MAX_FAST_RESTARTS = 5
let worker: Worker | null = null
let restarts: number[] = []

function start(file: string) {
  if (worker) return
  const exec = join(__dirname, 'kernel', file)
  cluster.setupPrimary({ exec, args: process.argv.slice(2) })
  worker = cluster.fork()

  worker.on('message', (data: unknown) => {
    switch (data) {
      case 'reset':
        worker?.process.kill()
        break
      case 'uptime':
        worker?.send(process.uptime())
        break
    }
  })

  worker.on('exit', (code, signal) => {
    worker = null
    if (code === 0 && !signal) {
      console.log(paint.yellow('👋 El bot finalizó correctamente'))
      process.exit(0)
    }

    // Evita bucles infinitos si el bot falla al iniciar
    const now = Date.now()
    restarts = [...restarts.filter(t => now - t < 60_000), now]
    if (restarts.length > MAX_FAST_RESTARTS) {
      console.error(paint.red(`⚠️ El bot se detuvo ${restarts.length} veces en 1 minuto. Revisa los errores anteriores.`))
      process.exit(1)
    }

    console.error(paint.red(`⚠️ El bot se detuvo (código ${code ?? signal}). Reiniciando...`))
    setTimeout(() => start(file), 2000)
  })
}

// ═══════════════════════════════════════════════════
// MANEJO DE ERRORES Y ADVERTENCIAS
// ═══════════════════════════════════════════════════

process.on('warning', warning => {
  if (warning.name === 'MaxListenersExceededWarning') {
    console.warn(paint.yellow('⚠️ Límite de listeners excedido'))
    console.warn(paint.dim(warning.stack))
  }
})

process.on('unhandledRejection', reason => {
  console.log(paint.red('⚠️ Promesa rechazada sin manejar:'), reason)
})

process.on('uncaughtException', error => {
  console.log(paint.red('⚠️ Excepción no capturada:'), error)
})

process.on('SIGINT', () => {
  console.log(paint.yellow('\n\n👋 Avenix-Multi detenido por el usuario'))
  worker?.process.kill()
  process.exit(0)
})

// ═══════════════════════════════════════════════════
// INICIALIZACIÓN DEL SISTEMA
// ═══════════════════════════════════════════════════

const archivoControl = './.avenix-started'

if (!existsSync(archivoControl) && canAnimate()) {
  await inicioAvenix()
  writeFileSync(archivoControl, `𒁈 AVENIX-MULTI v${pkg.version}\nIniciado: ${new Date().toLocaleString()}\nCreado por: ${pkg.author.name}`)
} else {
  console.log(paint.cyan.bold(`\n${reinicioMsg[Math.floor(Math.random() * reinicioMsg.length)]}\n`))
}

start(`start${EXT}`)
