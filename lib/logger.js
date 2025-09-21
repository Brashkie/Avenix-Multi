/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                     𒁈 AVENIX-MULTI V2.0.0 - LOGGER.JS 𒁈                 ┃
 * ┃                        Sistema de Logs Avanzado                            ┃
 * ┃                         Creado por: Hepein Oficial                         ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import chalk from 'chalk';
import moment from 'moment-timezone';
import { createWriteStream } from 'fs';
import { promisify } from 'util';

// ═══════════════════════════════════════════════════════════════════════════════
// │                        CLASE PRINCIPAL DE LOGGING                          │
// ═══════════════════════════════════════════════════════════════════════════════

export class Logger extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Configuración general
            level: config.level || 'info',
            timezone: config.timezone || 'America/Lima',
            dateFormat: config.dateFormat || 'YYYY-MM-DD HH:mm:ss',
            
            // Configuración de archivos
            logDir: config.logDir || './logs',
            enableFileLogging: config.enableFileLogging !== false,
            enableConsoleLogging: config.enableConsoleLogging !== false,
            
            // Rotación de logs
            enableRotation: config.enableRotation !== false,
            maxFileSize: config.maxFileSize || 10 * 1024 * 1024, // 10MB
            maxFiles: config.maxFiles || 10,
            rotationInterval: config.rotationInterval || 'daily', // daily, hourly, weekly
            
            // Filtros
            enableFilters: config.enableFilters !== false,
            sensitiveFields: config.sensitiveFields || ['password', 'token', 'key', 'secret'],
            
            // Formato
            enableJson: config.enableJson || false,
            enableColors: config.enableColors !== false,
            enableTimestamp: config.enableTimestamp !== false,
            
            // Webhooks
            enableWebhooks: config.enableWebhooks || false,
            webhookUrl: config.webhookUrl || '',
            webhookLevels: config.webhookLevels || ['error', 'critical'],
            
            ...config
        };
        
        // Niveles de log
        this.levels = {
            silent: 0,
            error: 1,
            warn: 2,
            info: 3,
            debug: 4,
            trace: 5
        };
        
        // Colores para cada nivel
        this.colors = {
            error: 'red',
            warn: 'yellow',
            info: 'cyan',
            debug: 'blue',
            trace: 'gray'
        };
        
        // Streams de archivo
        this.fileStreams = new Map();
        this.currentLogFiles = new Map();
        
        // Estadísticas
        this.stats = {
            total: 0,
            byLevel: {},
            errors: 0,
            lastLog: null
        };
        
        // Buffer para logs en caso de error
        this.logBuffer = [];
        this.maxBufferSize = 1000;
        
        this.init();
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                            INICIALIZACIÓN                              │
    // ═══════════════════════════════════════════════════════════════════════════
    
    async init() {
        try {
            await this.createLogDirectory();
            this.setupFileStreams();
            this.setupRotationSchedule();
            this.initializeStats();
            
            console.log(chalk.green('𒁈 Logger inicializado correctamente'));
            this.info('Logger system initialized', { 
                config: this.sanitizeConfig(),
                timestamp: moment().tz(this.config.timezone).format()
            });
            
        } catch (error) {
            console.error(chalk.red('𒁈 Error inicializando Logger:'), error.message);
            this.emit('error', error);
        }
    }
    
    async createLogDirectory() {
        if (this.config.enableFileLogging && !fs.existsSync(this.config.logDir)) {
            fs.mkdirSync(this.config.logDir, { recursive: true });
        }
    }
    
    setupFileStreams() {
        if (!this.config.enableFileLogging) return;
        
        const logTypes = ['combined', 'error', 'access', 'debug'];
        
        for (const type of logTypes) {
            const filename = this.generateLogFilename(type);
            const filepath = path.join(this.config.logDir, filename);
            
            const stream = createWriteStream(filepath, { flags: 'a' });
            this.fileStreams.set(type, stream);
            this.currentLogFiles.set(type, filepath);
            
            stream.on('error', (error) => {
                console.error(chalk.red(`𒁈 Error en stream de log ${type}:`), error.message);
                this.stats.errors++;
            });
        }
    }
    
    setupRotationSchedule() {
        if (!this.config.enableRotation) return;
        
        let interval;
        switch (this.config.rotationInterval) {
            case 'hourly':
                interval = 60 * 60 * 1000; // 1 hora
                break;
            case 'daily':
                interval = 24 * 60 * 60 * 1000; // 1 día
                break;
            case 'weekly':
                interval = 7 * 24 * 60 * 60 * 1000; // 1 semana
                break;
            default:
                interval = 24 * 60 * 60 * 1000; // Por defecto diario
        }
        
        setInterval(() => {
            this.rotateLogFiles().catch(console.error);
        }, interval);
        
        // También verificar tamaño de archivos cada 10 minutos
        setInterval(() => {
            this.checkFileSizes().catch(console.error);
        }, 10 * 60 * 1000);
    }
    
    initializeStats() {
        for (const level of Object.keys(this.levels)) {
            this.stats.byLevel[level] = 0;
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                         MÉTODOS DE LOGGING                             │
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Log de nivel ERROR
     */
    error(message, meta = {}) {
        this.log('error', message, meta);
        
        // Enviar a webhook si está configurado
        if (this.config.enableWebhooks && this.config.webhookLevels.includes('error')) {
            this.sendToWebhook('error', message, meta).catch(console.error);
        }
    }
    
    /**
     * Log de nivel WARN
     */
    warn(message, meta = {}) {
        this.log('warn', message, meta);
    }
    
    /**
     * Log de nivel INFO
     */
    info(message, meta = {}) {
        this.log('info', message, meta);
    }
    
    /**
     * Log de nivel DEBUG
     */
    debug(message, meta = {}) {
        this.log('debug', message, meta);
    }
    
    /**
     * Log de nivel TRACE
     */
    trace(message, meta = {}) {
        this.log('trace', message, meta);
    }
    
    /**
     * Log de acceso (para requests HTTP, comandos, etc.)
     */
    access(message, meta = {}) {
        const accessMeta = {
            ...meta,
            type: 'access',
            timestamp: moment().tz(this.config.timezone).format()
        };
        
        this.log('info', message, accessMeta);
        
        // Escribir específicamente al log de acceso
        if (this.config.enableFileLogging) {
            this.writeToFile('access', 'info', message, accessMeta);
        }
    }
    
    /**
     * Log de auditoría (para acciones importantes)
     */
    audit(action, user, details = {}) {
        const auditMeta = {
            type: 'audit',
            action,
            user,
            details,
            timestamp: moment().tz(this.config.timezone).format(),
            ip: details.ip || 'unknown'
        };
        
        this.info(`Audit: ${action}`, auditMeta);
        
        // Emitir evento de auditoría
        this.emit('audit', auditMeta);
    }
    
    /**
     * Log principal
     */
    log(level, message, meta = {}) {
        try {
            // Verificar nivel de log
            if (this.levels[level] > this.levels[this.config.level]) {
                return;
            }
            
            // Preparar datos del log
            const logData = this.prepareLogData(level, message, meta);
            
            // Actualizar estadísticas
            this.updateStats(level);
            
            // Escribir a consola
            if (this.config.enableConsoleLogging) {
                this.writeToConsole(logData);
            }
            
            // Escribir a archivo
            if (this.config.enableFileLogging) {
                this.writeToFile('combined', level, message, logData.meta);
                
                // Log de errores a archivo separado
                if (level === 'error') {
                    this.writeToFile('error', level, message, logData.meta);
                }
                
                // Log de debug a archivo separado
                if (level === 'debug' || level === 'trace') {
                    this.writeToFile('debug', level, message, logData.meta);
                }
            }
            
            // Emitir evento
            this.emit('log', logData);
            
            // Agregar a buffer por si acaso
            this.addToBuffer(logData);
            
        } catch (error) {
            this.handleLoggingError(error, level, message, meta);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                         PREPARACIÓN DE DATOS                           │
    // ═══════════════════════════════════════════════════════════════════════════
    
    prepareLogData(level, message, meta) {
        const timestamp = moment().tz(this.config.timezone).format(this.config.dateFormat);
        
        // Sanitizar metadata sensible
        const sanitizedMeta = this.config.enableFilters ? 
            this.sanitizeSensitiveData(meta) : meta;
        
        // Agregar información del contexto
        const contextInfo = this.getContextInfo();
        
        const logData = {
            timestamp,
            level,
            message,
            meta: {
                ...sanitizedMeta,
                ...contextInfo
            }
        };
        
        return logData;
    }
    
    sanitizeSensitiveData(data) {
        if (!data || typeof data !== 'object') return data;
        
        const sanitized = { ...data };
        
        for (const field of this.config.sensitiveFields) {
            if (field in sanitized) {
                sanitized[field] = '***REDACTED***';
            }
        }
        
        // Sanitizar objetos anidados
        for (const [key, value] of Object.entries(sanitized)) {
            if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeSensitiveData(value);
            }
        }
        
        return sanitized;
    }
    
    getContextInfo() {
        return {
            pid: process.pid,
            memory: process.memoryUsage(),
            uptime: process.uptime(),
            nodeVersion: process.version,
            platform: process.platform
        };
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                           ESCRITURA DE LOGS                            │
    // ═══════════════════════════════════════════════════════════════════════════
    
    writeToConsole(logData) {
        const { timestamp, level, message, meta } = logData;
        
        let formattedMessage;
        
        if (this.config.enableColors) {
            const colorFunc = chalk[this.colors[level]] || chalk.white;
            const timestampStr = this.config.enableTimestamp ? 
                chalk.gray(`[${timestamp}]`) : '';
            const levelStr = colorFunc(`[${level.toUpperCase()}]`);
            const messageStr = colorFunc(message);
            
            formattedMessage = `${timestampStr} ${levelStr} ${messageStr}`;
            
            // Agregar metadata si existe
            if (Object.keys(meta).length > 0 && level === 'debug') {
                formattedMessage += chalk.gray(` ${JSON.stringify(meta, null, 2)}`);
            }
        } else {
            const timestampStr = this.config.enableTimestamp ? `[${timestamp}] ` : '';
            formattedMessage = `${timestampStr}[${level.toUpperCase()}] ${message}`;
        }
        
        console.log(formattedMessage);
    }
    
    writeToFile(fileType, level, message, meta) {
        try {
            const stream = this.fileStreams.get(fileType);
            if (!stream) return;
            
            let logLine;
            
            if (this.config.enableJson) {
                logLine = JSON.stringify({
                    timestamp: moment().tz(this.config.timezone).format(),
                    level,
                    message,
                    meta
                }) + '\n';
            } else {
                const timestamp = moment().tz(this.config.timezone).format(this.config.dateFormat);
                const metaStr = Object.keys(meta).length > 0 ? 
                    ` ${JSON.stringify(meta)}` : '';
                logLine = `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}\n`;
            }
            
            stream.write(logLine);
            
        } catch (error) {
            console.error(chalk.red('𒁈 Error escribiendo a archivo de log:'), error.message);
            this.stats.errors++;
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                          ROTACIÓN DE LOGS                              │
    // ═══════════════════════════════════════════════════════════════════════════
    
    async rotateLogFiles() {
        console.log(chalk.blue('𒁈 Iniciando rotación de logs...'));
        
        try {
            for (const [type, stream] of this.fileStreams.entries()) {
                // Cerrar stream actual
                stream.end();
                
                // Renombrar archivo actual
                const currentFile = this.currentLogFiles.get(type);
                const rotatedFile = this.generateRotatedFilename(currentFile);
                
                if (fs.existsSync(currentFile)) {
                    fs.renameSync(currentFile, rotatedFile);
                }
                
                // Crear nuevo stream
                const newFilename = this.generateLogFilename(type);
                const newFilepath = path.join(this.config.logDir, newFilename);
                
                const newStream = createWriteStream(newFilepath, { flags: 'a' });
                this.fileStreams.set(type, newStream);
                this.currentLogFiles.set(type, newFilepath);
                
                newStream.on('error', (error) => {
                    console.error(chalk.red(`𒁈 Error en nuevo stream de log ${type}:`), error.message);
                });
            }
            
            // Limpiar archivos antiguos
            await this.cleanOldLogFiles();
            
            console.log(chalk.green('𒁈 Rotación de logs completada'));
            
        } catch (error) {
            console.error(chalk.red('𒁈 Error en rotación de logs:'), error.message);
        }
    }
    
    async checkFileSizes() {
        try {
            for (const [type, filepath] of this.currentLogFiles.entries()) {
                if (fs.existsSync(filepath)) {
                    const stats = fs.statSync(filepath);
                    
                    if (stats.size > this.config.maxFileSize) {
                        console.log(chalk.yellow(`𒁈 Archivo ${type} excede tamaño máximo, rotando...`));
                        await this.rotateSingleFile(type);
                    }
                }
            }
        } catch (error) {
            console.error(chalk.red('𒁈 Error verificando tamaños de archivo:'), error.message);
        }
    }
    
    async rotateSingleFile(type) {
        try {
            const stream = this.fileStreams.get(type);
            const currentFile = this.currentLogFiles.get(type);
            
            // Cerrar stream
            stream.end();
            
            // Renombrar archivo
            const rotatedFile = this.generateRotatedFilename(currentFile);
            fs.renameSync(currentFile, rotatedFile);
            
            // Crear nuevo stream
            const newStream = createWriteStream(currentFile, { flags: 'a' });
            this.fileStreams.set(type, newStream);
            
        } catch (error) {
            console.error(chalk.red(`𒁈 Error rotando archivo ${type}:`), error.message);
        }
    }
    
    async cleanOldLogFiles() {
        try {
            const files = fs.readdirSync(this.config.logDir);
            const logFiles = files.filter(file => file.includes('.log'));
            
            // Agrupar por tipo
            const filesByType = {};
            
            for (const file of logFiles) {
                const type = file.split('.')[0];
                if (!filesByType[type]) {
                    filesByType[type] = [];
                }
                filesByType[type].push(file);
            }
            
            // Mantener solo los archivos más recientes
            for (const [type, typeFiles] of Object.entries(filesByType)) {
                typeFiles.sort((a, b) => {
                    const statsA = fs.statSync(path.join(this.config.logDir, a));
                    const statsB = fs.statSync(path.join(this.config.logDir, b));
                    return statsB.mtime - statsA.mtime;
                });
                
                // Eliminar archivos antiguos
                const filesToDelete = typeFiles.slice(this.config.maxFiles);
                
                for (const file of filesToDelete) {
                    const filepath = path.join(this.config.logDir, file);
                    fs.unlinkSync(filepath);
                    console.log(chalk.gray(`𒁈 Log antiguo eliminado: ${file}`));
                }
            }
            
        } catch (error) {
            console.error(chalk.red('𒁈 Error limpiando logs antiguos:'), error.message);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                         FUNCIONES AUXILIARES                           │
    // ═══════════════════════════════════════════════════════════════════════════
    
    generateLogFilename(type) {
        const date = moment().tz(this.config.timezone).format('YYYY-MM-DD');
        return `${type}.${date}.log`;
    }
    
    generateRotatedFilename(currentFile) {
        const timestamp = moment().tz(this.config.timezone).format('YYYY-MM-DD-HH-mm-ss');
        const parsed = path.parse(currentFile);
        return path.join(parsed.dir, `${parsed.name}.${timestamp}${parsed.ext}`);
    }
    
    updateStats(level) {
        this.stats.total++;
        this.stats.byLevel[level]++;
        this.stats.lastLog = moment().tz(this.config.timezone).format();
    }
    
    addToBuffer(logData) {
        this.logBuffer.push(logData);
        
        if (this.logBuffer.length > this.maxBufferSize) {
            this.logBuffer.shift(); // Remover el más antiguo
        }
    }
    
    handleLoggingError(error, level, message, meta) {
        this.stats.errors++;
        
        // Intentar log de emergencia
        try {
            console.error(chalk.red('𒁈 Error en sistema de logging:'), error.message);
            console.error(chalk.red('𒁈 Log fallido:'), { level, message, meta });
        } catch (e) {
            // Si incluso esto falla, no podemos hacer mucho más
        }
    }
    
    sanitizeConfig() {
        const config = { ...this.config };
        
        // Remover información sensible
        if (config.webhookUrl) {
            config.webhookUrl = '***REDACTED***';
        }
        
        return config;
    }
    
    async sendToWebhook(level, message, meta) {
        if (!this.config.webhookUrl) return;
        
        try {
            const payload = {
                timestamp: moment().tz(this.config.timezone).format(),
                level,
                message,
                meta,
                service: 'avenix-multi',
                version: '2.0.0'
            };
            
            const response = await fetch(this.config.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                throw new Error(`Webhook response: ${response.status}`);
            }
            
        } catch (error) {
            console.error(chalk.red('𒁈 Error enviando webhook:'), error.message);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                           MÉTODOS PÚBLICOS                             │
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Obtener estadísticas del logger
     */
    getStats() {
        return {
            ...this.stats,
            bufferSize: this.logBuffer.length,
            fileStreams: this.fileStreams.size,
            uptime: process.uptime()
        };
    }
    
    /**
     * Obtener logs del buffer
     */
    getRecentLogs(limit = 100) {
        return this.logBuffer.slice(-limit);
    }
    
    /**
     * Buscar en logs de archivo
     */
    async searchLogs(query, options = {}) {
        const {
            fileType = 'combined',
            level = null,
            startDate = null,
            endDate = null,
            limit = 100
        } = options;
        
        try {
            const filepath = this.currentLogFiles.get(fileType);
            if (!filepath || !fs.existsSync(filepath)) {
                return [];
            }
            
            const content = fs.readFileSync(filepath, 'utf8');
            const lines = content.split('\n').filter(line => line.trim());
            
            let results = lines;
            
            // Filtrar por query
            if (query) {
                results = results.filter(line => 
                    line.toLowerCase().includes(query.toLowerCase())
                );
            }
            
            // Filtrar por nivel
            if (level) {
                results = results.filter(line => 
                    line.includes(`[${level.toUpperCase()}]`)
                );
            }
            
            // Limitar resultados
            return results.slice(-limit);
            
        } catch (error) {
            this.error('Error searching logs', { error: error.message, query, options });
            return [];
        }
    }
    
    /**
     * Cambiar nivel de log en tiempo real
     */
    setLevel(level) {
        if (this.levels[level] !== undefined) {
            this.config.level = level;
            this.info('Log level changed', { newLevel: level });
            return true;
        }
        return false;
    }
    
    /**
     * Forzar rotación de logs
     */
    async forceRotation() {
        await this.rotateLogFiles();
    }
    
    /**
     * Exportar logs a formato específico
     */
    async exportLogs(format = 'json', options = {}) {
        try {
            const logs = this.getRecentLogs(options.limit || 1000);
            
            switch (format) {
                case 'json':
                    return JSON.stringify(logs, null, 2);
                    
                case 'csv':
                    const headers = 'timestamp,level,message,meta\n';
                    const rows = logs.map(log => 
                        `${log.timestamp},${log.level},"${log.message}","${JSON.stringify(log.meta)}"`
                    ).join('\n');
                    return headers + rows;
                    
                case 'txt':
                    return logs.map(log => 
                        `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}`
                    ).join('\n');
                    
                default:
                    throw new Error(`Formato no soportado: ${format}`);
            }
            
        } catch (error) {
            this.error('Error exporting logs', { error: error.message, format, options });
            throw error;
        }
    }
    
    /**
     * Cerrar logger
     */
    async close() {
        console.log(chalk.blue('𒁈 Cerrando Logger...'));
        
        // Cerrar todos los streams
        for (const [type, stream] of this.fileStreams.entries()) {
            stream.end();
        }
        
        // Limpiar timers si los hay
        this.removeAllListeners();
        
        console.log(chalk.green('𒁈 Logger cerrado correctamente'));
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                         INSTANCIA GLOBAL                                   │
// ═══════════════════════════════════════════════════════════════════════════════

export const logger = new Logger({
    level: process.env.LOG_LEVEL || 'info',
    timezone: 'America/Lima',
    logDir: './logs',
    enableFileLogging: true,
    enableConsoleLogging: true,
    enableRotation: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 10,
    enableColors: true,
    enableJson: false,
    enableWebhooks: false
});

export default logger;
