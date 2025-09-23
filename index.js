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
import { join, dirname } from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { watchFile, unwatchFile, existsSync, mkdirSync } from 'fs';
import cfonts from 'cfonts';
import { createInterface } from 'readline';
import yargs from 'yargs';
import chalk from 'chalk';
import { spawn } from 'child_process';
import os from 'os';

// ═══════════════════════════════════════════════════════════════════════════════
// │                           CONFIGURACIONES INICIALES                         │
// ═══════════════════════════════════════════════════════════════════════════════

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(__dirname);
const { name, description, author, version } = require(join(__dirname, './package.json'));
const { say } = cfonts;
const rl = createInterface(process.stdin, process.stdout);

// Variables de control
let isRunning = false;
let child;
let isShuttingDown = false;
let restartCount = 0;
const MAX_RESTARTS = 3;

// ═══════════════════════════════════════════════════════════════════════════════
// │                       VERIFICACIÓN DE DIRECTORIOS                           │
// ═══════════════════════════════════════════════════════════════════════════════

function verifyDirectories() {
    const dirs = [
        'tmp',
        'database', 
        'AvenixSession',
        'AvenixJadiBot',
        'BackupSession',
        'plugins',
        'lib',
        'src',
        'media',
        'logs'
    ];

    console.log(chalk.cyan('𒁈 Verificando directorios necesarios...'));
    
    for (const dir of dirs) {
        if (typeof dir === 'string' && dir.trim() !== '') {
            if (!existsSync(dir)) {
                mkdirSync(dir, { recursive: true });
                console.log(chalk.green(`  ✅ Directorio creado: ${dir}`));
            } else {
                console.log(chalk.gray(`  📁 Directorio existe: ${dir}`));
            }
        }
    }
    console.log(chalk.cyan('𒁈 Verificación completada.\n'));
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                              BANNER PRINCIPAL                               │
// ═══════════════════════════════════════════════════════════════════════════════

function showBanner() {
    // Banner principal con diseño personalizado
    say('AVENIX', {
        font: 'block',
        align: 'center',
        colors: ['cyan', 'blue'],
        background: 'transparent'
    });

    say('MULTI', {
        font: 'block', 
        align: 'center',
        colors: ['magenta', 'red'],
        background: 'transparent'
    });

    say('V2.0.0', {
        font: 'console',
        align: 'center',
        colors: ['yellow']
    });

    say(`𒁈 Creado por Hepein Oficial 𒁈`, {
        font: 'console',
        align: 'center',
        colors: ['green']
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                         INFORMACIÓN DEL SISTEMA                             │
// ═══════════════════════════════════════════════════════════════════════════════

async function showSystemInfo() {
    const ramInGB = os.totalmem() / (1024 * 1024 * 1024);
    const freeRamInGB = os.freemem() / (1024 * 1024 * 1024);
    const currentTime = new Date().toLocaleString('es-ES', {
        timeZone: 'America/Lima',
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    let lineM = '⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ 》';
    
    console.log(chalk.yellow(`╭${lineM}
┊${chalk.blueBright('╭┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')}
┊${chalk.blueBright('┊')} ${chalk.cyan.bold('🖥️  INFORMACIÓN DEL SISTEMA')}
┊${chalk.blueBright('┊')}${chalk.yellow(` 💻 Sistema: ${os.type()} ${os.release()} (${os.arch()})`)}
┊${chalk.blueBright('┊')}${chalk.yellow(` 🧠 RAM Total: ${ramInGB.toFixed(2)} GB`)}
┊${chalk.blueBright('┊')}${chalk.yellow(` 💾 RAM Libre: ${freeRamInGB.toFixed(2)} GB`)}
┊${chalk.blueBright('┊')}${chalk.yellow(` ⚡ Node.js: ${process.version}`)}
┊${chalk.blueBright('╰┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')}
┊${chalk.blueBright('╭┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')}
┊${chalk.blueBright('┊')} ${chalk.magenta.bold('𒁈 INFORMACIÓN DEL BOT')}
┊${chalk.blueBright('┊')}${chalk.cyan(` 🏷️  Nombre: ${name}`)}
┊${chalk.blueBright('┊')}${chalk.cyan(` 📦 Versión: ${version}`)}
┊${chalk.blueBright('┊')}${chalk.cyan(` 📄 Descripción: ${description}`)}
┊${chalk.blueBright('┊')}${chalk.cyan(` 👑 Autor: ${author?.name || 'Hepein Oficial'}`)}
┊${chalk.blueBright('╰┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')}
┊${chalk.blueBright('╭┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')}
┊${chalk.blueBright('┊')} ${chalk.green.bold('⏰ TIEMPO Y ESTADO')}
┊${chalk.blueBright('┊')}${chalk.cyan(` 🕐 Hora actual: ${currentTime}`)}
┊${chalk.blueBright('┊')}${chalk.cyan(` 🌎 Zona horaria: America/Lima (Perú)`)}
┊${chalk.blueBright('┊')}${chalk.cyan(` 🚀 Estado: Iniciando sistema...`)}
┊${chalk.blueBright('╰┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')}
┊${chalk.blueBright('╭┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')}
┊${chalk.blueBright('┊')} ${chalk.red.bold('📋 COMANDOS PRINCIPALES')}
┊${chalk.blueBright('┊')}${chalk.yellow(` • #on anticall    - Activar anti-llamadas`)}
┊${chalk.blueBright('┊')}${chalk.yellow(` • #off antilink   - Desactivar anti-links`)}
┊${chalk.blueBright('┊')}${chalk.yellow(` • #on antispam    - Activar anti-spam`)}
┊${chalk.blueBright('┊')}${chalk.yellow(` • #menu           - Ver lista completa`)}
┊${chalk.blueBright('╰┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')}
┊${chalk.blueBright('╭┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')}
┊${chalk.blueBright('┊')} ${chalk.blue.bold('🔧 COMANDOS DE INICIO')}
┊${chalk.blueBright('┊')}${chalk.gray(` npm run qr       - Iniciar con código QR`)}
┊${chalk.blueBright('┊')}${chalk.gray(` npm run code     - Iniciar con código 8 dígitos`)}
┊${chalk.blueBright('┊')}${chalk.gray(` npm start        - Inicio automático`)}
┊${chalk.blueBright('╰┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')}
╰${lineM}`));
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                           FUNCIÓN DE INICIO PRINCIPAL                       │
// ═══════════════════════════════════════════════════════════════════════════════

function start(file) {
    if (isRunning || isShuttingDown) {
        console.log(chalk.yellow('𒁈 Proceso ya en ejecución o cerrando...'));
        return;
    }
    
    isRunning = true;
    console.log(chalk.cyan(`\n𒁈 Iniciando ${file}...\n`));
    
    // Detectar modo desde argumentos
    const mode = process.argv[2]; // 'qr', 'code', etc.
    const args = [join(__dirname, file), ...process.argv.slice(2)];
    
    // Configurar variables de entorno según el modo
    const env = { 
        ...process.env, 
        DISABLE_TESTS: 'true', // Siempre deshabilitar tests desde index.js
        AVENIX_MODE: mode || 'auto' // Pasar el modo a main.js
    };
    
    child = spawn('node', args, { 
        stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
        env: env
    });

    child.on('message', data => {
        switch (data) {
            case 'reset':
                if (restartCount < MAX_RESTARTS) {
                    console.log(chalk.yellow('𒁈 Reiniciando bot...'));
                    child.kill();
                    isRunning = false;
                    restartCount++;
                    setTimeout(() => start(file), 3000);
                } else {
                    console.log(chalk.red('𒁈 Máximo de reinicios alcanzado. Deteniendo...'));
                    gracefulShutdown();
                }
                break;
            case 'uptime':
                child.send(process.uptime());
                break;
        }
    });

    child.on('exit', (code, signal) => {
        isRunning = false;
        
        if (isShuttingDown) {
            console.log(chalk.green('𒁈 Proceso cerrado correctamente'));
            return;
        }
        
        if (code === null && signal) {
            console.log(chalk.red(`𒁈 Proceso terminado por señal: ${signal}`));
        } else if (code === 0) {
            console.log(chalk.green('𒁈 Proceso terminado correctamente'));
            // No reiniciar si terminó correctamente
            return;
        } else {
            console.log(chalk.red(`𒁈 Proceso terminado con código: ${code}`));
            
            if (restartCount < MAX_RESTARTS) {
                console.log(chalk.yellow(`𒁈 Reiniciando en 5 segundos... (${restartCount + 1}/${MAX_RESTARTS})`));
                restartCount++;
                setTimeout(() => {
                    if (!isShuttingDown) {
                        start(file);
                    }
                }, 5000);
            } else {
                console.log(chalk.red('𒁈 Máximo de reinicios alcanzado. Deteniendo...'));
                gracefulShutdown();
            }
        }
    });

    child.on('error', (error) => {
        console.error(chalk.red('𒁈 Error en el proceso:'), error);
        isRunning = false;
        
        if (restartCount < MAX_RESTARTS) {
            console.log(chalk.yellow('𒁈 Reintentando en 5 segundos...'));
            restartCount++;
            setTimeout(() => {
                if (!isShuttingDown) {
                    start(file);
                }
            }, 5000);
        }
    });

    const opts = yargs(process.argv.slice(2)).exitProcess(false).parse();
    
    if (!opts['test']) {
        if (!rl.listenerCount('line')) {
            rl.on('line', line => {
                if (child && child.connected) {
                    child.send(line.trim());
                }
            });
        }
    }

    // WATCHER OPTIMIZADO - Solo para cambios importantes
    const watchedFile = join(__dirname, file);
    let watchTimeout;
    
    watchFile(watchedFile, { interval: 5000 }, () => {
        // Debounce para evitar múltiples reinicios
        clearTimeout(watchTimeout);
        watchTimeout = setTimeout(() => {
            if (!isShuttingDown && isRunning) {
                unwatchFile(watchedFile);
                console.log(chalk.cyan(`𒁈 Detectados cambios en ${file}, reiniciando...`));
                if (child) {
                    child.kill('SIGTERM');
                }
                isRunning = false;
                setTimeout(() => {
                    if (!isShuttingDown) {
                        start(file);
                    }
                }, 2000);
            }
        }, 1000);
    });

    // Resetear contador de reinicios después de 2 minutos de funcionamiento estable
    setTimeout(() => {
        if (isRunning && !isShuttingDown) {
            restartCount = 0;
            console.log(chalk.green('𒁈 Bot funcionando establemente'));
        }
    }, 120000);
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                        MANEJO DE CIERRE GRACEFUL                            │
// ═══════════════════════════════════════════════════════════════════════════════

function gracefulShutdown() {
    if (isShuttingDown) return;
    
    isShuttingDown = true;
    console.log(chalk.yellow('\n𒁈 Cerrando aplicación...'));
    
    if (child) {
        child.kill('SIGTERM');
        
        // Forzar cierre después de 10 segundos
        setTimeout(() => {
            if (child && !child.killed) {
                console.log(chalk.red('𒁈 Forzando cierre del proceso...'));
                child.kill('SIGKILL');
            }
        }, 10000);
    }
    
    // Cerrar readline
    if (rl) {
        rl.close();
    }
    
    setTimeout(() => {
        process.exit(0);
    }, 1000);
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                       MANEJO DE ADVERTENCIAS Y ERRORES                      │
// ═══════════════════════════════════════════════════════════════════════════════

process.on('warning', (warning) => {
    if (warning.name === 'MaxListenersExceededWarning') {
        console.warn(chalk.yellow('𒁈 Advertencia: Se excedió el límite de listeners'));
    }
});

process.on('uncaughtException', (error) => {
    console.error(chalk.red('𒁈 Error no capturado:'), error.message);
    gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
    console.error(chalk.red('𒁈 Promesa rechazada no manejada:'), reason);
});

// ═══════════════════════════════════════════════════════════════════════════════
// │                              INICIO DEL SISTEMA                             │
// ═══════════════════════════════════════════════════════════════════════════════

async function init() {
    console.clear();
    
    // Mostrar banner
    showBanner();
    
    // Verificar directorios
    verifyDirectories();
    
    // Mostrar información del sistema
    await showSystemInfo();
    
    // Pequeña pausa para mejor experiencia visual
    console.log(chalk.cyan('\n𒁈 Preparando inicio del sistema...\n'));
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Iniciar el bot
    start('main.js');
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                              MANEJO DE SEÑALES                              │
// ═══════════════════════════════════════════════════════════════════════════════

process.on('SIGINT', () => {
    console.log(chalk.yellow('\n𒁈 Recibida señal SIGINT...'));
    gracefulShutdown();
});

process.on('SIGTERM', () => {
    console.log(chalk.yellow('\n𒁈 Recibida señal SIGTERM...'));
    gracefulShutdown();
});

// ═══════════════════════════════════════════════════════════════════════════════
// │                                EJECUTAR INICIO                              │
// ═══════════════════════════════════════════════════════════════════════════════

init().catch(error => {
    console.error(chalk.red('𒁈 Error durante la inicialización:'), error);
    gracefulShutdown();
});
