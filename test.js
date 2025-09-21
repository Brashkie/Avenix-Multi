/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                            𒁈 AVENIX-MULTI V2.0.0 𒁈                         ┃
 * ┃                                                                               ┃
 * ┃              ▄▀█ █░█ █▀▀ █▄░█ █ ▀▄▀   █▀▄▀█ █░█ █░░ ▀█▀ █                  ┃
 * ┃              █▀█ ▀▄▀ ██▄ █░▀█ █ █░█   █░▀░█ █▄█ █▄▄ ░█░ █                  ┃
 * ┃                                                                               ┃
 * ┃                      🧪 TEST.JS - PRUEBAS DEL SISTEMA 🧪                     ┃
 * ┃                                                                               ┃
 * ┃     👑 Creado por: Hepein Oficial                                            ┃
 * ┃     📧 Contacto: electronicatodo2006@gmail.com                               ┃
 * ┃     📱 WhatsApp: +51 916360161                                               ┃
 * ┃     🌟 GitHub: https://github.com/Brashkie/Avenix-Multi                      ┃
 * ┃                                                                               ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */
//test.js
import fs from 'fs';
import path, { dirname } from 'path';
import assert from 'assert';
import { spawn } from 'child_process';
import syntaxError from 'syntax-error';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import chalk from 'chalk';

// ═══════════════════════════════════════════════════════════════════════════════
// │                           CONFIGURACIONES INICIALES                         │
// ═══════════════════════════════════════════════════════════════════════════════

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(__dirname);

// Variables de estadísticas
let totalFiles = 0;
let checkedFiles = 0;
let errorFiles = 0;
let successFiles = 0;
const startTime = Date.now();

// ═══════════════════════════════════════════════════════════════════════════════
// │                              FUNCIONES AUXILIARES                           │
// ═══════════════════════════════════════════════════════════════════════════════

function showHeader() {
    console.log(chalk.cyan('╭' + '─'.repeat(70) + '╮'));
    console.log(chalk.cyan('│') + chalk.bold.magenta('                    𒁈 AVENIX-MULTI TEST SUITE 𒁈                    ') + chalk.cyan('│'));
    console.log(chalk.cyan('│') + ' '.repeat(70) + chalk.cyan('│'));
    console.log(chalk.cyan('│') + chalk.yellow('  🧪 Sistema de pruebas y validación de sintaxis                   ') + chalk.cyan('│'));
    console.log(chalk.cyan('│') + chalk.gray('  Verificando integridad del código fuente...                       ') + chalk.cyan('│'));
    console.log(chalk.cyan('╰' + '─'.repeat(70) + '╯'));
    console.log();
}

function showProgress(current, total, fileName) {
    const percentage = Math.round((current / total) * 100);
    const barLength = 30;
    const filledLength = Math.round((barLength * current) / total);
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
    
    process.stdout.write(`\r${chalk.cyan('[')}${chalk.green(bar)}${chalk.cyan(']')} ${chalk.yellow(percentage + '%')} ${chalk.gray('(' + current + '/' + total + ')')} ${chalk.blue(path.basename(fileName))}`);
}

function showStatistics() {
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log('\n\n' + chalk.cyan('╭' + '─'.repeat(50) + '╮'));
    console.log(chalk.cyan('│') + chalk.bold.white('              📊 ESTADÍSTICAS DEL TEST              ') + chalk.cyan('│'));
    console.log(chalk.cyan('├' + '─'.repeat(50) + '┤'));
    console.log(chalk.cyan('│') + chalk.green(` ✅ Archivos procesados: ${checkedFiles.toString().padEnd(15)}`) + chalk.cyan('│'));
    console.log(chalk.cyan('│') + chalk.green(` ✅ Archivos válidos: ${successFiles.toString().padEnd(18)}`), chalk.cyan('│'));
    console.log(chalk.cyan('│') + chalk.red(` ❌ Archivos con errores: ${errorFiles.toString().padEnd(13)}`) + chalk.cyan('│'));
    console.log(chalk.cyan('│') + chalk.blue(` ⏱️  Tiempo transcurrido: ${duration.toFixed(2)}s`.padEnd(25)) + chalk.cyan('│'));
    console.log(chalk.cyan('╰' + '─'.repeat(50) + '╯'));
    
    if (errorFiles === 0) {
        console.log(chalk.green.bold('\n🎉 ¡TODOS LOS TESTS PASARON EXITOSAMENTE! 🎉'));
        console.log(chalk.cyan('𒁈 Avenix-Multi está listo para funcionar correctamente.'));
    } else {
        console.log(chalk.red.bold('\n❌ SE ENCONTRARON ERRORES EN EL CÓDIGO'));
        console.log(chalk.yellow('⚠️  Por favor, corrige los errores antes de continuar.'));
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                           VERIFICACIÓN PRINCIPAL                            │
// ═══════════════════════════════════════════════════════════════════════════════

function checkProjectStructure() {
    console.log(chalk.yellow('🔍 Verificando estructura del proyecto...\n'));
    
    const requiredDirectories = ['plugins', 'lib', 'src'];
    const requiredFiles = ['package.json', 'main.js', 'index.js', 'handler.js', 'config.js'];
    
    // Verificar directorios
    for (const dir of requiredDirectories) {
        if (fs.existsSync(dir)) {
            console.log(chalk.green(`  ✅ Directorio encontrado: ${dir}`));
        } else {
            console.log(chalk.yellow(`  ⚠️  Directorio faltante: ${dir}`));
        }
    }
    
    // Verificar archivos principales
    for (const file of requiredFiles) {
        if (fs.existsSync(file)) {
            console.log(chalk.green(`  ✅ Archivo encontrado: ${file}`));
        } else {
            console.log(chalk.red(`  ❌ Archivo faltante: ${file}`));
        }
    }
    
    console.log();
}

async function runTests() {
    console.clear();
    showHeader();
    checkProjectStructure();
    
    console.log(chalk.yellow('🧪 Iniciando verificación de sintaxis...\n'));
    
    // Obtener carpetas desde package.json
    let packageJson;
    try {
        packageJson = require(path.join(__dirname, './package.json'));
    } catch (error) {
        console.error(chalk.red('❌ Error leyendo package.json:'), error.message);
        process.exit(1);
    }
    
    // Definir carpetas a verificar
    let folders = ['.'];
    if (packageJson.directories) {
        folders.push(...Object.values(packageJson.directories));
    }
    
    // Agregar carpetas adicionales específicas de Avenix-Multi
    const additionalFolders = ['plugins', 'lib', 'src'];
    for (const folder of additionalFolders) {
        if (fs.existsSync(folder) && !folders.includes(folder)) {
            folders.push(folder);
        }
    }
    
    // Recopilar archivos .js
    let files = [];
    for (let folder of folders) {
        try {
            if (!fs.existsSync(folder)) continue;
            
            const folderFiles = fs.readdirSync(folder)
                .filter(v => v.endsWith('.js'))
                .map(file => path.resolve(path.join(folder, file)));
            
            files.push(...folderFiles);
        } catch (error) {
            console.warn(chalk.yellow(`⚠️  No se pudo leer la carpeta: ${folder}`));
        }
    }
    
    // Eliminar duplicados y el archivo de test actual
    files = [...new Set(files)].filter(file => file !== __filename);
    totalFiles = files.length;
    
    console.log(chalk.blue(`📁 Carpetas a verificar: ${folders.join(', ')}`));
    console.log(chalk.blue(`📄 Total de archivos encontrados: ${totalFiles}\n`));
    
    if (totalFiles === 0) {
        console.log(chalk.yellow('⚠️  No se encontraron archivos .js para verificar.'));
        return;
    }
    
    // Verificar cada archivo
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        checkedFiles++;
        
        showProgress(i + 1, files.length, file);
        
        try {
            const content = fs.readFileSync(file, 'utf8');
            const error = syntaxError(content, file, {
                sourceType: 'module',
                allowReturnOutsideFunction: true,
                allowAwaitOutsideFunction: true
            });
            
            if (error) {
                errorFiles++;
                console.log(chalk.red(`\n❌ Error de sintaxis en: ${path.relative(__dirname, file)}`));
                console.log(chalk.red('   ' + error.toString()));
                console.log(chalk.gray('   Línea: ' + error.line + ', Columna: ' + error.column));
                console.log();
                
                // Usar assert para fallar el test
                assert.ok(false, `Error de sintaxis en ${file}:\n${error}`);
            } else {
                successFiles++;
            }
            
        } catch (readError) {
            errorFiles++;
            console.log(chalk.red(`\n❌ Error leyendo archivo: ${path.relative(__dirname, file)}`));
            console.log(chalk.red('   ' + readError.message));
            console.log();
        }
    }
    
    // Mostrar estadísticas finales
    showStatistics();
    
    // Salir con código de error si hay problemas
    if (errorFiles > 0) {
        process.exit(1);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                            MANEJO DE ERRORES                                │
// ═══════════════════════════════════════════════════════════════════════════════

process.on('uncaughtException', (error) => {
    console.log(chalk.red('\n❌ Error no capturado durante las pruebas:'));
    console.log(chalk.red(error.stack));
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.log(chalk.red('\n❌ Promesa rechazada no manejada:'));
    console.log(chalk.red(reason));
    process.exit(1);
});

// ═══════════════════════════════════════════════════════════════════════════════
// │                               EJECUTAR TESTS                                │
// ═══════════════════════════════════════════════════════════════════════════════

runTests().catch(error => {
    console.error(chalk.red('\n❌ Error ejecutando tests:'), error);
    process.exit(1);
});
