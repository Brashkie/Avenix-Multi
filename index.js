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
 * ┃     📧 Contacto: electronicatodo2006@gmail.com                               ┃
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
import { promises as fsPromises } from 'fs';

// ═══════════════════════════════════════════════════════════════════════════════
// │                           CONFIGURACIONES INICIALES                         │
// ═══════════════════════════════════════════════════════════════════════════════

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(__dirname);
const { name, description, author, version } = require(join(__dirname, './package.json'));
const { say } = cfonts;
const rl = createInterface(process.stdin, process.stdout);

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
        } else {
            console.warn(chalk.yellow(`  ⚠️  Ruta inválida: ${dir}`));
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

let isRunning = false;
let child;

function start(file) {
    if (isRunning) return;
    isRunning = true;
    
    console.log(chalk.cyan(`\n𒁈 Iniciando ${file}...\n`));
    
    const args = [join(__dirname, file), ...process.argv.slice(2)];
    
    child = spawn('node', args, { 
        stdio: ['inherit', 'inherit', 'inherit', 'ipc'] 
    });

    child.on('message', data => {
        switch (data) {
            case 'reset':
                console.log(chalk.yellow('𒁈 Reiniciando bot...'));
                child.kill();
                isRunning = false;
                setTimeout(() => start(file), 2000);
                break;
            case 'uptime':
                child.send(process.uptime());
                break;
        }
    });

    child.on('exit', (code, signal) => {
        isRunning = false;
        
        if (code === null && signal) {
            console.log(chalk.red(`𒁈 Proceso terminado por señal: ${signal}`));
        } else if (code === 0) {
            console.log(chalk.green('𒁈 Proceso terminado correctamente'));
        } else {
            console.log(chalk.red(`𒁈 Proceso terminado con código: ${code}`));
            console.log(chalk.yellow('𒁈 Reiniciando en 3 segundos...'));
            setTimeout(() => start(file), 3000);
        }
    });

    child.on('error', (error) => {
        console.error(chalk.red('𒁈 Error en el proceso:'), error);
        isRunning = false;
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

    watchFile(args[0], () => {
        unwatchFile(args[0]);
        console.log(chalk.cyan(`𒁈 Detectados cambios en ${file}, reiniciando...`));
        if (child) {
            child.kill();
        }
        isRunning = false;
        setTimeout(() => start(file), 1000);
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                           MANEJO DE ADVERTENCIAS Y ERRORES                  │
// ═══════════════════════════════════════════════════════════════════════════════

process.on('warning', (warning) => {
    if (warning.name === 'MaxListenersExceededWarning') {
        console.warn(chalk.yellow('𒁈 Advertencia: Se excedió el límite de listeners'));
        console.warn(chalk.gray(warning.stack));
    }
});

process.on('uncaughtException', (error) => {
    if (error.code === 'ENOSPC') {
        console.error(chalk.red('𒁈 Error: Sin espacio o límite de watchers alcanzado'));
        console.error(chalk.yellow('𒁈 Reiniciando sistema...'));
    } else {
        console.error(chalk.red('𒁈 Error no capturado:'), error);
    }
    
    // Intentar limpiar el proceso hijo antes de salir
    if (child) {
        child.kill('SIGTERM');
    }
    
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error(chalk.red('𒁈 Promesa rechazada no manejada:'), reason);
    console.error(chalk.gray('Promesa:'), promise);
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
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Iniciar el bot
    start('main.js');
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                              MANEJO DE CIERRE                               │
// ═══════════════════════════════════════════════════════════════════════════════

process.on('SIGINT', () => {
    console.log(chalk.yellow('\n𒁈 Recibida señal SIGINT, cerrando aplicación...'));
    if (child) {
        child.kill('SIGTERM');
    }
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log(chalk.yellow('\n𒁈 Recibida señal SIGTERM, cerrando aplicación...'));
    if (child) {
        child.kill('SIGTERM');
    }
    process.exit(0);
});

// ═══════════════════════════════════════════════════════════════════════════════
// │                                EJECUTAR INICIO                              │
// ═══════════════════════════════════════════════════════════════════════════════

init().catch(error => {
    console.error(chalk.red('𒁈 Error durante la inicialización:'), error);
    process.exit(1);
});
