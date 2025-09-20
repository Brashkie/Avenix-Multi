/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                            𒁈 AVENIX-MULTI V2.0.0 𒁈                         ┃
 * ┃                      LIB/PRINT.JS - SISTEMA DE LOGGING                      ┃
 * ┃                          Creado por: Hepein Oficial                          ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import { fileURLToPath } from 'url'
import { promises as fs } from 'fs'
import path from 'path'
import chalk from 'chalk'
import moment from 'moment-timezone'
import util from 'util'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ═══════════════════════════════════════════════════════════════════════════════
// │                        CONFIGURACIÓN DE LOGGING                             │
// ═══════════════════════════════════════════════════════════════════════════════

class AvenixLogger {
    constructor() {
        this.config = {
            timezone: 'America/Lima',
            logDir: path.join(__dirname, '../logs'),
            maxLogSize: 10 * 1024 * 1024, // 10MB
            maxLogFiles: 5,
            enableFileLogging: true,
            enableConsoleLogging: true,
            logLevel: 'info' // debug, info, warn, error
        }
        
        this.logLevels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3
        }
        
        this.init()
    }
    
    async init() {
        try {
            // Crear directorio de logs
            if (!await this.dirExists(this.config.logDir)) {
                await fs.mkdir(this.config.logDir, { recursive: true })
            }
            
            // Configurar rotación de logs
            await this.rotateLogs()
        } catch (error) {
            console.error('Error inicializando logger:', error)
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                           FUNCIONES DE UTILIDAD                             │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async dirExists(dir) {
        try {
            await fs.access(dir)
            return true
        } catch {
            return false
        }
    }
    
    formatTime() {
        return moment().tz(this.config.timezone).format('YYYY-MM-DD HH:mm:ss')
    }
    
    formatDate() {
        return moment().tz(this.config.timezone).format('YYYY-MM-DD')
    }
    
    shouldLog(level) {
        return this.logLevels[level] >= this.logLevels[this.config.logLevel]
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                            LOGGING A ARCHIVO                                │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async writeToFile(level, message) {
        if (!this.config.enableFileLogging) return
        
        try {
            const logFile = path.join(this.config.logDir, `avenix-${this.formatDate()}.log`)
            const timestamp = this.formatTime()
            const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`
            
            await fs.appendFile(logFile, logEntry, 'utf8')
            
            // Verificar tamaño del archivo
            const stats = await fs.stat(logFile)
            if (stats.size > this.config.maxLogSize) {
                await this.rotateLogs()
            }
        } catch (error) {
            console.error('Error escribiendo log:', error)
        }
    }
    
    async rotateLogs() {
        try {
            const files = await fs.readdir(this.config.logDir)
            const logFiles = files
                .filter(file => file.startsWith('avenix-') && file.endsWith('.log'))
                .sort()
            
            // Eliminar archivos antiguos si exceden el límite
            while (logFiles.length >= this.config.maxLogFiles) {
                const oldestFile = logFiles.shift()
                await fs.unlink(path.join(this.config.logDir, oldestFile))
            }
        } catch (error) {
            console.error('Error rotando logs:', error)
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                           MÉTODOS DE LOGGING                                │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    debug(...args) {
        if (!this.shouldLog('debug')) return
        
        const message = util.format(...args)
        
        if (this.config.enableConsoleLogging) {
            console.log(
                chalk.bold.bgBlue(' DEBUG '),
                chalk.gray(`[${this.formatTime()}]:`),
                chalk.white(message)
            )
        }
        
        this.writeToFile('debug', message)
    }
    
    info(...args) {
        if (!this.shouldLog('info')) return
        
        const message = util.format(...args)
        
        if (this.config.enableConsoleLogging) {
            console.log(
                chalk.bold.bgGreen(' INFO '),
                chalk.gray(`[${this.formatTime()}]:`),
                chalk.cyan(message)
            )
        }
        
        this.writeToFile('info', message)
    }
    
    warn(...args) {
        if (!this.shouldLog('warn')) return
        
        const message = util.format(...args)
        
        if (this.config.enableConsoleLogging) {
            console.log(
                chalk.bold.bgYellow(' WARN '),
                chalk.gray(`[${this.formatTime()}]:`),
                chalk.yellow(message)
            )
        }
        
        this.writeToFile('warn', message)
    }
    
    error(...args) {
        if (!this.shouldLog('error')) return
        
        const message = util.format(...args)
        
        if (this.config.enableConsoleLogging) {
            console.log(
                chalk.bold.bgRed(' ERROR '),
                chalk.gray(`[${this.formatTime()}]:`),
                chalk.red(message)
            )
        }
        
        this.writeToFile('error', message)
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                        FUNCIÓN PRINT PARA MENSAJES                          │
// ═══════════════════════════════════════════════════════════════════════════════

const logger = new AvenixLogger()

export default async function print(m, conn) {
    try {
        if (!m || !conn) return
        
        let name = await conn.getName(m.sender)
        let chat = await conn.getName(m.chat)
        let ansi = '\x1b[1;35m'
        let reset = '\x1b[0m'
        
        // Información básica del mensaje
        let messageInfo = []
        
        // Tipo de chat
        if (m.isGroup) {
            messageInfo.push(chalk.blueBright('GROUP'))
        } else if (m.isNewsletter) {
            messageInfo.push(chalk.magentaBright('NEWSLETTER'))
        } else {
            messageInfo.push(chalk.greenBright('PRIVATE'))
        }
        
        // Tipo de mensaje
        if (m.mtype) {
            messageInfo.push(chalk.yellowBright(m.mtype.toUpperCase()))
        }
        
        // Comando si es que lo tiene
        if (m.command) {
            messageInfo.push(chalk.cyanBright(`CMD: ${m.command}`))
        }
        
        // Construir log del mensaje
        let logParts = [
            chalk.bold.bgMagenta(' 𒁈 AVENIX '),
            chalk.gray(`[${moment().tz('America/Lima').format('HH:mm:ss')}]`),
            `[${messageInfo.join(' | ')}]`,
            chalk.bold.blueBright(`📱 ${chat}`),
            chalk.bold.greenBright(`👤 ${name}`),
        ]
        
        // Contenido del mensaje (limitado)
        if (m.text && m.text.length > 0) {
            let content = m.text.length > 50 ? 
                m.text.substring(0, 50) + '...' : 
                m.text
            
            logParts.push(chalk.white(`💬 "${content}"`))
        }
        
        // Media info
        if (m.msg && (m.msg.url || m.msg.caption)) {
            if (m.msg.caption) {
                let caption = m.msg.caption.length > 30 ? 
                    m.msg.caption.substring(0, 30) + '...' : 
                    m.msg.caption
                logParts.push(chalk.yellowBright(`📝 "${caption}"`))
            } else {
                logParts.push(chalk.magentaBright('📎 Media'))
            }
        }
        
        // Mensaje citado
        if (m.quoted) {
            logParts.push(chalk.grayBright('↪️ Reply'))
        }
        
        // Menciones
        if (m.mentionedJid && m.mentionedJid.length > 0) {
            logParts.push(chalk.cyanBright(`@${m.mentionedJid.length}`))
        }
        
        console.log(logParts.join(' '))
        
        // Log adicional para archivos
        await logger.info(`[${m.isGroup ? 'GROUP' : 'PRIVATE'}] ${name} -> ${m.text || m.mtype || 'Media'}`)
        
        // Log de errores si los hay
        if (m.error) {
            logger.error(`Error en mensaje de ${name}:`, m.error)
        }
        
        // Estadísticas cada 100 mensajes
        if (global.msgCount) {
            global.msgCount++
        } else {
            global.msgCount = 1
        }
        
        if (global.msgCount % 100 === 0) {
            const uptime = process.uptime()
            const hours = Math.floor(uptime / 3600)
            const minutes = Math.floor((uptime % 3600) / 60)
            
            console.log(
                chalk.bold.bgCyan(' STATS '),
                chalk.gray(`[${moment().tz('America/Lima').format('HH:mm:ss')}]:`),
                chalk.white(`📊 ${global.msgCount} mensajes procesados`),
                chalk.green(`⏰ Uptime: ${hours}h ${minutes}m`)
            )
            
            logger.info(`Estadísticas: ${global.msgCount} mensajes, Uptime: ${hours}h ${minutes}m`)
        }
        
    } catch (error) {
        logger.error('Error en función print:', error)
        console.error(chalk.red('𒁈 Error en print:'), error)
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                           EXPORTAR LOGGER                                   │
// ═══════════════════════════════════════════════════════════════════════════════

export { logger }
