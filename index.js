
/**
 * Avenix-Multi - Simple Launcher
 * Creado por: Hepein Oficial
 * Marca: 𒁈
 * 
 * Lanzador simple y eficiente para el bot
 */

import { join, dirname } from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { watchFile, unwatchFile, existsSync, mkdirSync } from 'fs';
import cfonts from 'cfonts';
import { createInterface } from 'readline';
import yargs from 'yargs';
import chalk from 'chalk';
import { spawn } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(__dirname);
const { name, description, author, version } = require(join(__dirname, './package.json'));
const { say } = cfonts;
const rl = createInterface(process.stdin, process.stdout);

//*──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ*

/**
 * Verificar y crear directorios necesarios
 */
function verifyDirectories() {
  const dirs = ['tmp', 'sessions', 'database', 'storage', 'logs', 'plugins'];
  for (const dir of dirs) {
    if (typeof dir === 'string' && dir.trim() !== '') {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
        console.log(chalk.gray(`   𒁈 Directorio creado: ${dir}`));
      }
    } else {
      console.warn(chalk.yellow(`   𒁈 Ruta inválida: ${dir}`));
    }
  }
}

verifyDirectories();

//*──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ*

// Banner principal con diseño mejorado
say('AVENIX MULTI', {
  font: 'block',
  align: 'center',
  colors: ['cyan', 'blue'],
  background: 'transparent'
});

say(`𒁈 Desarrollado por Hepein Oficial 𒁈`, {
  font: 'console',
  align: 'center',
  colors: ['magenta']
});

// Información del proyecto
console.log(chalk.gray(`
   ╭──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ╮
   │ Proyecto: ${chalk.white(name || 'Avenix-Multi')}
   │ Versión:  ${chalk.green(version || '1.7.0')}
   │ Autor:    ${chalk.yellow(author?.name || 'Hepein Oficial')}
   │ GitHub:   ${chalk.blue('github.com/Brashkie/Avenix-Multi')}
   ╰──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ╯
`));

//*──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ*

let isRunning = false;
let child;

/**
 * Función principal para iniciar el bot
 */
function start(file) {
  if (isRunning) return;
  
  isRunning = true;
  console.log(chalk.blue(`   𒁈 Iniciando ${file}...`));
  
  const args = [join(__dirname, file), ...process.argv.slice(2)];
  
  child = spawn(process.execPath, args, { 
    stdio: ['inherit', 'inherit', 'inherit', 'ipc'] 
  });

  // Manejo de mensajes del proceso hijo
  child.on('message', data => {
    switch (data) {
      case 'reset':
        console.log(chalk.yellow('   𒁈 Reiniciando bot...'));
        child.kill();
        isRunning = false;
        setTimeout(() => start(file), 2000);
        break;
        
      case 'uptime':
        child.send(process.uptime());
        break;
    }
  });

  // Manejo de salida del proceso hijo
  child.on('exit', (code) => {
    isRunning = false;
    
    if (code !== 0) {
      console.error(chalk.red(`   𒁈 Error con código: ${code}`));
      console.log(chalk.blue('   𒁈 Reiniciando en 3 segundos...'));
      setTimeout(() => start(file), 3000);
    } else {
      console.log(chalk.green('   𒁈 Proceso terminado correctamente'));
      process.exit(0);
    }
  });

  // Manejo de errores del proceso hijo
  child.on('error', (error) => {
    console.error(chalk.red(`   𒁈 Error del proceso: ${error.message}`));
    isRunning = false;
  });

  // Configurar readline para comandos
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

  // Observar cambios en archivos
  watchFile(args[0], () => {
    unwatchFile(args[0]);
    console.log(chalk.green(`   𒁈 Archivo ${file} actualizado, reiniciando...`));
    if (child) child.kill();
    isRunning = false;
    setTimeout(() => start(file), 1000);
  });
}

//*──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ*

// Manejo de advertencias del sistema
process.on('warning', (warning) => {
  if (warning.name === 'MaxListenersExceededWarning') {
    console.warn(chalk.yellow('   𒁈 Se excedió el límite de listeners'));
    console.warn(chalk.gray(`      ${warning.emitter?.constructor?.name || 'Desconocido'}`));
  }
});

// Manejo de cierre del proceso
process.on('SIGINT', () => {
  console.log(chalk.cyan('\n   𒁈 Cerrando Avenix-Multi...'));
  if (child) {
    child.kill('SIGTERM');
    setTimeout(() => {
      if (child && !child.killed) {
        child.kill('SIGKILL');
      }
    }, 5000);
  }
  rl.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(chalk.cyan('\n   𒁈 Terminando proceso...'));
  if (child) child.kill();
  process.exit(0);
});

//*──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ─𒁈─ׅ──ׄ─ׅ─ׄ──ׅ──ׄ─ׅ─ׄ──ׅ*

// Iniciar el bot
start('main.js');/**
