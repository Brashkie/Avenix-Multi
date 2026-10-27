/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                   𒁈 AVENIX-MULTI V2.0.0 - SCHEDULER.JS 𒁈                 ┃
 * ┃                       Sistema de Tareas Programadas                        ┃
 * ┃                         Creado por: Hepein Oficial                         ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import paint from './paint.js'
import { loadValue, saveValue } from './storage.js'
import moment from 'moment-timezone';

// ═══════════════════════════════════════════════════════════════════════════════
// │                      CLASE PRINCIPAL DE SCHEDULER                          │
// ═══════════════════════════════════════════════════════════════════════════════

export class TaskScheduler extends EventEmitter {
    declare config: any
    declare tasks: Map<any, any>
    declare cronJobs: Map<any, any>
    declare oneTimeTasks: Map<any, any>
    declare recurringTasks: Map<any, any>
    declare runningTasks: Set<any>
    declare completedTasks: Map<any, any>
    declare failedTasks: Map<any, any>
    declare stats: any
    declare taskQueue: any[]
    declare isProcessingQueue: boolean

    constructor(config: Record<string, any> = {}) {
        super();
        
        this.config = {
            // Configuración general
            timezone: config.timezone || 'America/Lima',
            enablePersistence: config.enablePersistence !== false,
            dataPath: config.dataPath || './scheduler',
            
            // Configuración de ejecución
            maxConcurrentTasks: config.maxConcurrentTasks || 10,
            defaultTimeout: config.defaultTimeout || 300000, // 5 minutos
            retryAttempts: config.retryAttempts || 3,
            retryDelay: config.retryDelay || 5000, // 5 segundos
            
            // Configuración de logs
            enableLogging: config.enableLogging !== false,
            logPath: config.logPath || './logs/scheduler.log',
            
            // Configuración de alertas
            enableAlerts: config.enableAlerts || false,
            alertWebhook: config.alertWebhook || '',
            
            ...config
        };
        
        // Tareas programadas
        this.tasks = new Map();
        this.cronJobs = new Map();
        this.oneTimeTasks = new Map();
        this.recurringTasks = new Map();
        
        // Estado de ejecución
        this.runningTasks = new Set();
        this.completedTasks = new Map();
        this.failedTasks = new Map();
        
        // Estadísticas
        this.stats = {
            totalTasks: 0,
            completedTasks: 0,
            failedTasks: 0,
            runningTasks: 0,
            totalExecutionTime: 0,
            averageExecutionTime: 0
        };
        
        // Queue para tareas
        this.taskQueue = [];
        this.isProcessingQueue = false;
        
        this.init();
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                            INICIALIZACIÓN                              │
    // ═══════════════════════════════════════════════════════════════════════════
    
    async init() {
        try {
            await this.createDataDirectory();
            await this.loadPersistedTasks();
            this.setupDefaultTasks();
            this.startQueueProcessor();
            
            console.log(paint.green('𒁈 TaskScheduler inicializado correctamente'));
            this.emit('ready');
            
        } catch (error) {
            console.error(paint.red('𒁈 Error inicializando TaskScheduler:'), error.message);
            this.emit('error', error);
        }
    }
    
    async createDataDirectory() {
        if (this.config.enablePersistence && !fs.existsSync(this.config.dataPath)) {
            fs.mkdirSync(this.config.dataPath, { recursive: true });
        }
    }
    
    async loadPersistedTasks() {
        if (!this.config.enablePersistence) return;
        
        try {
            const data = loadValue<any>('scheduler:tasks', null);

            if (data) {
                
                for (const taskData of data.tasks || []) {
                    if (taskData.type === 'cron') {
                        this.scheduleCronTask(taskData.name, taskData.pattern, taskData.handler, taskData.options);
                    } else if (taskData.type === 'recurring') {
                        this.scheduleRecurring(taskData.name, taskData.interval, taskData.handler, taskData.options);
                    } else if (taskData.type === 'onetime' && taskData.executeAt > Date.now()) {
                        this.scheduleOnce(taskData.name, new Date(taskData.executeAt), taskData.handler, taskData.options);
                    }
                }
                
                console.log(paint.blue(`𒁈 ${data.tasks?.length || 0} tareas cargadas desde persistencia`));
            }
            
        } catch (error) {
            console.warn(paint.yellow('𒁈 Error cargando tareas persistidas:'), error.message);
        }
    }
    
    setupDefaultTasks() {
        // Tareas del sistema por defecto
        
        // Limpieza de archivos temporales cada hora
        this.scheduleCronTask('cleanup-temp', '0 * * * *', async () => {
            await this.cleanupTempFiles();
        }, { description: 'Limpieza de archivos temporales' });
        
        // Respaldo de base de datos cada 6 horas
        this.scheduleCronTask('database-backup', '0 */6 * * *', async () => {
            await this.createDatabaseBackup();
        }, { description: 'Respaldo automático de base de datos' });
        
        // Reporte de estadísticas diario
        this.scheduleCronTask('daily-stats', '0 9 * * *', async () => {
            await this.generateDailyReport();
        }, { description: 'Reporte diario de estadísticas' });
        
        // Limpieza de logs antiguos semanal
        this.scheduleCronTask('cleanup-logs', '0 2 * * 0', async () => {
            await this.cleanupOldLogs();
        }, { description: 'Limpieza de logs antiguos' });
        
        // Verificación de salud del sistema cada 30 minutos
        this.scheduleCronTask('health-check', '*/30 * * * *', async () => {
            await this.performHealthCheck();
        }, { description: 'Verificación de salud del sistema' });
    }
    
    startQueueProcessor() {
        // Procesar cola de tareas cada 5 segundos
        setInterval(() => {
            this.processTaskQueue().catch(console.error);
        }, 5000);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                        PROGRAMACIÓN DE TAREAS                          │
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Programar tarea con patrón cron
     */
    scheduleCronTask(name, pattern, handler, options: Record<string, any> = {}) {
        try {
            // Validar patrón cron
            if (!cron.validate(pattern)) {
                throw new Error(`Patrón cron inválido: ${pattern}`);
            }
            
            // Cancelar tarea existente si existe
            if (this.cronJobs.has(name)) {
                this.cancelTask(name);
            }
            
            const task = {
                id: this.generateTaskId(),
                name,
                type: 'cron',
                pattern,
                handler: typeof handler === 'string' ? this.getHandlerByName(handler) : handler,
                options: {
                    timezone: this.config.timezone,
                    scheduled: true,
                    ...options
                },
                createdAt: Date.now(),
                nextRun: this.getNextRunTime(pattern),
                runs: 0,
                lastRun: null,
                status: 'scheduled'
            };
            
            // Crear job de cron
            // node-cron v4: createTask crea la tarea sin iniciarla (equivale a `scheduled: false`)
            const job = cron.createTask(pattern, async () => {
                await this.executeTask(task);
            }, {
                timezone: task.options.timezone
            });
            
            // Guardar referencias
            this.tasks.set(name, task);
            this.cronJobs.set(name, job);
            
            // Iniciar si está programado
            if (task.options.scheduled) {
                job.start();
                this.log(`Tarea cron programada: ${name} (${pattern})`);
            }
            
            this.emit('taskScheduled', task);
            this.persistTasks();
            
            return task;
            
        } catch (error) {
            console.error(paint.red(`𒁈 Error programando tarea cron ${name}:`), error.message);
            throw error;
        }
    }
    
    /**
     * Programar tarea para ejecutar una vez
     */
    scheduleOnce(name, executeAt, handler, options: Record<string, any> = {}) {
        try {
            const executeTime = executeAt instanceof Date ? executeAt.getTime() : executeAt;
            
            if (executeTime <= Date.now()) {
                throw new Error('La fecha de ejecución debe ser futura');
            }
            
            // Cancelar tarea existente si existe
            if (this.oneTimeTasks.has(name)) {
                this.cancelTask(name);
            }
            
            const task = {
                id: this.generateTaskId(),
                name,
                type: 'onetime',
                executeAt: executeTime,
                handler: typeof handler === 'string' ? this.getHandlerByName(handler) : handler,
                options: {
                    timeout: this.config.defaultTimeout,
                    ...options
                },
                createdAt: Date.now(),
                status: 'scheduled'
            };
            
            // Programar timeout
            const delay = executeTime - Date.now();
            const timeout = setTimeout(async () => {
                await this.executeTask(task);
                this.oneTimeTasks.delete(name);
            }, delay);
            
            // Guardar referencias
            this.tasks.set(name, task);
            this.oneTimeTasks.set(name, { task, timeout });
            
            this.log(`Tarea única programada: ${name} para ${moment(executeTime).tz(this.config.timezone).format()}`);
            this.emit('taskScheduled', task);
            this.persistTasks();
            
            return task;
            
        } catch (error) {
            console.error(paint.red(`𒁈 Error programando tarea única ${name}:`), error.message);
            throw error;
        }
    }
    
    /**
     * Programar tarea recurrente por intervalo
     */
    scheduleRecurring(name, interval, handler, options: Record<string, any> = {}) {
        try {
            const intervalMs = typeof interval === 'string' ? this.parseInterval(interval) : interval;
            
            if (intervalMs < 1000) {
                throw new Error('El intervalo mínimo es 1 segundo');
            }
            
            // Cancelar tarea existente si existe
            if (this.recurringTasks.has(name)) {
                this.cancelTask(name);
            }
            
            const task = {
                id: this.generateTaskId(),
                name,
                type: 'recurring',
                interval: intervalMs,
                handler: typeof handler === 'string' ? this.getHandlerByName(handler) : handler,
                options: {
                    timeout: this.config.defaultTimeout,
                    enabled: true,
                    ...options
                },
                createdAt: Date.now(),
                nextRun: Date.now() + intervalMs,
                runs: 0,
                lastRun: null,
                status: 'scheduled'
            };
            
            // Crear intervalo
            const intervalId = setInterval(async () => {
                if (task.options.enabled) {
                    await this.executeTask(task);
                    task.nextRun = Date.now() + intervalMs;
                }
            }, intervalMs);
            
            // Guardar referencias
            this.tasks.set(name, task);
            this.recurringTasks.set(name, { task, intervalId });
            
            this.log(`Tarea recurrente programada: ${name} cada ${this.formatInterval(intervalMs)}`);
            this.emit('taskScheduled', task);
            this.persistTasks();
            
            return task;
            
        } catch (error) {
            console.error(paint.red(`𒁈 Error programando tarea recurrente ${name}:`), error.message);
            throw error;
        }
    }
    
    /**
     * Programar tarea en cola para ejecución asíncrona
     */
    queueTask(name, handler, options: Record<string, any> = {}) {
        const task = {
            id: this.generateTaskId(),
            name,
            type: 'queued',
            handler: typeof handler === 'string' ? this.getHandlerByName(handler) : handler,
            options: {
                priority: 0,
                timeout: this.config.defaultTimeout,
                ...options
            },
            createdAt: Date.now(),
            status: 'queued'
        };
        
        this.tasks.set(name, task);
        this.taskQueue.push(task);
        
        // Ordenar por prioridad
        this.taskQueue.sort((a, b) => b.options.priority - a.options.priority);
        
        this.log(`Tarea añadida a cola: ${name} (prioridad: ${task.options.priority})`);
        this.emit('taskQueued', task);
        
        return task;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                          EJECUCIÓN DE TAREAS                           │
    // ═══════════════════════════════════════════════════════════════════════════
    
    async executeTask(task, manual = false) {
        const startTime = Date.now();
        let result: any = null;
        
        try {
            // Verificar límite de tareas concurrentes
            if (this.runningTasks.size >= this.config.maxConcurrentTasks) {
                throw new Error('Límite de tareas concurrentes alcanzado');
            }
            
            // Marcar como ejecutándose
            this.runningTasks.add(task.id);
            task.status = 'running';
            task.startTime = startTime;
            task.runs++;
            this.stats.runningTasks++;
            
            this.log(`Ejecutando tarea: ${task.name}${manual ? ' (manual)' : ''}`);
            this.emit('taskStarted', task);
            
            // Ejecutar con timeout
            result = await this.executeWithTimeout(task.handler, task.options.timeout);
            
            // Marcar como completada
            const executionTime = Date.now() - startTime;
            task.status = 'completed';
            task.lastRun = Date.now();
            task.executionTime = executionTime;
            task.lastResult = result;
            
            // Actualizar estadísticas
            this.stats.completedTasks++;
            this.stats.totalExecutionTime += executionTime;
            this.stats.averageExecutionTime = this.stats.totalExecutionTime / this.stats.completedTasks;
            
            // Guardar en historial
            this.completedTasks.set(`${task.name}-${Date.now()}`, {
                ...task,
                result,
                completedAt: Date.now()
            });
            
            this.log(`Tarea completada: ${task.name} (${executionTime}ms)`);
            this.emit('taskCompleted', task, result);
            
        } catch (error) {
            // Marcar como fallida
            const executionTime = Date.now() - startTime;
            task.status = 'failed';
            task.lastError = {
                message: error.message,
                stack: error.stack,
                timestamp: Date.now()
            };
            
            // Actualizar estadísticas
            this.stats.failedTasks++;
            
            // Guardar en historial de fallos
            this.failedTasks.set(`${task.name}-${Date.now()}`, {
                ...task,
                error: task.lastError,
                failedAt: Date.now()
            });
            
            this.log(`Tarea fallida: ${task.name} - ${error.message}`, 'error');
            this.emit('taskFailed', task, error);
            
            // Reintentar si está configurado
            if (task.options.retryAttempts && (task.retryCount || 0) < task.options.retryAttempts) {
                task.retryCount = (task.retryCount || 0) + 1;
                
                setTimeout(() => {
                    this.executeTask(task).catch(console.error);
                }, this.config.retryDelay);
                
                this.log(`Reintentando tarea: ${task.name} (intento ${task.retryCount})`);
            }
            
            // Alertar si está configurado
            if (this.config.enableAlerts) {
                await this.sendAlert('task_failed', {
                    task: task.name,
                    error: error.message,
                    retryCount: task.retryCount || 0
                });
            }
            
        } finally {
            // Limpiar estado
            this.runningTasks.delete(task.id);
            this.stats.runningTasks--;
            
            // Si es tarea única, remover
            if (task.type === 'onetime') {
                this.tasks.delete(task.name);
            }
        }
        
        return result;
    }
    
    async executeWithTimeout(handler, timeout) {
        return new Promise(async (resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error(`Tarea excedió tiempo límite de ${timeout}ms`));
            }, timeout);
            
            try {
                const result = await handler();
                clearTimeout(timeoutId);
                resolve(result);
            } catch (error) {
                clearTimeout(timeoutId);
                reject(error);
            }
        });
    }
    
    async processTaskQueue() {
        if (this.isProcessingQueue || this.taskQueue.length === 0) return;
        if (this.runningTasks.size >= this.config.maxConcurrentTasks) return;
        
        this.isProcessingQueue = true;
        
        try {
            const task = this.taskQueue.shift();
            if (task) {
                await this.executeTask(task);
            }
        } catch (error) {
            console.error(paint.red('𒁈 Error procesando cola de tareas:'), error.message);
        } finally {
            this.isProcessingQueue = false;
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                        GESTIÓN DE TAREAS                               │
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Ejecutar tarea manualmente
     */
    async runTask(name) {
        const task = this.tasks.get(name);
        if (!task) {
            throw new Error(`Tarea no encontrada: ${name}`);
        }
        
        return await this.executeTask(task, true);
    }
    
    /**
     * Pausar tarea
     */
    pauseTask(name) {
        const task = this.tasks.get(name);
        if (!task) {
            throw new Error(`Tarea no encontrada: ${name}`);
        }
        
        if (task.type === 'cron') {
            const job = this.cronJobs.get(name);
            if (job) {
                job.stop();
                task.status = 'paused';
                this.log(`Tarea pausada: ${name}`);
            }
        } else if (task.type === 'recurring') {
            task.options.enabled = false;
            task.status = 'paused';
            this.log(`Tarea pausada: ${name}`);
        }
        
        this.emit('taskPaused', task);
        return true;
    }
    
    /**
     * Reanudar tarea
     */
    resumeTask(name) {
        const task = this.tasks.get(name);
        if (!task) {
            throw new Error(`Tarea no encontrada: ${name}`);
        }
        
        if (task.type === 'cron') {
            const job = this.cronJobs.get(name);
            if (job) {
                job.start();
                task.status = 'scheduled';
                this.log(`Tarea reanudada: ${name}`);
            }
        } else if (task.type === 'recurring') {
            task.options.enabled = true;
            task.status = 'scheduled';
            this.log(`Tarea reanudada: ${name}`);
        }
        
        this.emit('taskResumed', task);
        return true;
    }
    
    /**
     * Cancelar tarea
     */
    cancelTask(name) {
        const task = this.tasks.get(name);
        if (!task) {
            return false;
        }
        
        try {
            if (task.type === 'cron') {
                const job = this.cronJobs.get(name);
                if (job) {
                    job.destroy();
                    this.cronJobs.delete(name);
                }
            } else if (task.type === 'onetime') {
                const taskData = this.oneTimeTasks.get(name);
                if (taskData) {
                    clearTimeout(taskData.timeout);
                    this.oneTimeTasks.delete(name);
                }
            } else if (task.type === 'recurring') {
                const taskData = this.recurringTasks.get(name);
                if (taskData) {
                    clearInterval(taskData.intervalId);
                    this.recurringTasks.delete(name);
                }
            }
            
            this.tasks.delete(name);
            task.status = 'cancelled';
            
            this.log(`Tarea cancelada: ${name}`);
            this.emit('taskCancelled', task);
            this.persistTasks();
            
            return true;
            
        } catch (error) {
            console.error(paint.red(`𒁈 Error cancelando tarea ${name}:`), error.message);
            return false;
        }
    }
    
    /**
     * Obtener información de tarea
     */
    getTask(name) {
        return this.tasks.get(name);
    }
    
    /**
     * Listar todas las tareas
     */
    getAllTasks() {
        return Array.from(this.tasks.values());
    }
    
    /**
     * Listar tareas por estado
     */
    getTasksByStatus(status) {
        return Array.from(this.tasks.values()).filter(task => task.status === status);
    }
    
    /**
     * Obtener estadísticas
     */
    getStats() {
        return {
            ...this.stats,
            totalTasks: this.tasks.size,
            queuedTasks: this.taskQueue.length,
            cronTasks: this.cronJobs.size,
            recurringTasks: this.recurringTasks.size,
            oneTimeTasks: this.oneTimeTasks.size
        };
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                        TAREAS DEL SISTEMA                              │
    // ═══════════════════════════════════════════════════════════════════════════
    
    async cleanupTempFiles() {
        try {
            const tempDirs = ['./tmp', './temp', './cache'];
            let cleanedFiles = 0;
            
            for (const dir of tempDirs) {
                if (fs.existsSync(dir)) {
                    const files = fs.readdirSync(dir);
                    const now = Date.now();
                    
                    for (const file of files) {
                        const filePath = path.join(dir, file);
                        const stats = fs.statSync(filePath);
                        
                        // Eliminar archivos más antiguos de 1 hora
                        if (now - stats.mtime.getTime() > 3600000) {
                            fs.unlinkSync(filePath);
                            cleanedFiles++;
                        }
                    }
                }
            }
            
            this.log(`Limpieza completada: ${cleanedFiles} archivos eliminados`);
            return { cleanedFiles };
            
        } catch (error) {
            this.log(`Error en limpieza: ${error.message}`, 'error');
            throw error;
        }
    }
    
    async createDatabaseBackup() {
        try {
            // Aquí integrarías con tu sistema de base de datos
            if (global.db?.data) {
                await global.db.write();
                this.log('Respaldo de base de datos completado');
                return { success: true as const };
            }
            
            this.log('Sistema de base de datos no disponible para respaldo', 'warn');
            return { success: false as const, reason: 'DB not available' };
            
        } catch (error) {
            this.log(`Error en respaldo de BD: ${error.message}`, 'error');
            throw error;
        }
    }
    
    async generateDailyReport() {
        try {
            const stats = this.getStats();
            const report = {
                date: moment().tz(this.config.timezone).format('YYYY-MM-DD'),
                scheduler: stats,
                systemHealth: await this.getSystemHealth()
            };
            
            // Guardar reporte
            if (this.config.enablePersistence) {
                // Reportes diarios con caducidad de 30 días
                saveValue(`scheduler:report:${report.date}`, report, 30 * 86_400_000);
            }
            
            this.log('Reporte diario generado');
            this.emit('dailyReport', report);
            
            return report;
            
        } catch (error) {
            this.log(`Error generando reporte diario: ${error.message}`, 'error');
            throw error;
        }
    }
    
    async cleanupOldLogs() {
        try {
            const logDirs = ['./logs', './analytics'];
            let cleanedFiles = 0;
            
            for (const dir of logDirs) {
                if (fs.existsSync(dir)) {
                    const files = fs.readdirSync(dir);
                    const cutoffTime = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 días
                    
                    for (const file of files) {
                        const filePath = path.join(dir, file);
                        const stats = fs.statSync(filePath);
                        
                        if (stats.mtime.getTime() < cutoffTime) {
                            fs.unlinkSync(filePath);
                            cleanedFiles++;
                        }
                    }
                }
            }
            
            this.log(`Limpieza de logs: ${cleanedFiles} archivos eliminados`);
            return { cleanedFiles };
            
        } catch (error) {
            this.log(`Error en limpieza de logs: ${error.message}`, 'error');
            throw error;
        }
    }
    
    async performHealthCheck() {
        try {
            const health = await this.getSystemHealth();
            
            // Alertar si hay problemas críticos
            if (health.memoryUsage > 90 || health.diskUsage > 95) {
                await this.sendAlert('system_health', {
                    memory: health.memoryUsage,
                    disk: health.diskUsage,
                    timestamp: Date.now()
                });
            }
            
            this.emit('healthCheck', health);
            return health;
            
        } catch (error) {
            this.log(`Error en verificación de salud: ${error.message}`, 'error');
            throw error;
        }
    }
    
    async getSystemHealth() {
        const memUsage = process.memoryUsage();
        const totalMem = memUsage.heapTotal;
        const usedMem = memUsage.heapUsed;
        
        return {
            memoryUsage: Math.round((usedMem / totalMem) * 100),
            diskUsage: 0, // Implementar según necesidades
            uptime: Math.round(process.uptime()),
            runningTasks: this.runningTasks.size,
            queuedTasks: this.taskQueue.length,
            timestamp: Date.now()
        };
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                         FUNCIONES AUXILIARES                           │
    // ═══════════════════════════════════════════════════════════════════════════
    
    generateTaskId() {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    getHandlerByName(handlerName) {
        // Aquí podrías implementar un registro de handlers por nombre
        // Por ahora retorna una función que ejecuta eval (no recomendado en producción)
        return async () => {
            throw new Error(`Handler por nombre no implementado: ${handlerName}`);
        };
    }
    
    getNextRunTime(cronPattern) {
        try {
            // Implementación básica - en producción usarías una librería como 'cron-parser'
            return Date.now() + 60000; // Próximo minuto por defecto
        } catch (error) {
            return null;
        }
    }
    
    parseInterval(intervalStr) {
        const units = {
            's': 1000,
            'sec': 1000,
            'second': 1000,
            'seconds': 1000,
            'm': 60000,
            'min': 60000,
            'minute': 60000,
            'minutes': 60000,
            'h': 3600000,
            'hour': 3600000,
            'hours': 3600000,
            'd': 86400000,
            'day': 86400000,
            'days': 86400000
        };
        
        const match = intervalStr.match(/^(\d+)\s*(.*?)s?$/i);
        if (!match) {
            throw new Error(`Formato de intervalo inválido: ${intervalStr}`);
        }
        
        const [, amount, unit] = match;
        const multiplier = units[unit.toLowerCase()] || units['s'];
        
        return parseInt(amount) * multiplier;
    }
    
    formatInterval(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days} día${days > 1 ? 's' : ''}`;
        if (hours > 0) return `${hours} hora${hours > 1 ? 's' : ''}`;
        if (minutes > 0) return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
        return `${seconds} segundo${seconds > 1 ? 's' : ''}`;
    }
    
    log(message, level = 'info') {
        if (this.config.enableLogging) {
            const timestamp = moment().tz(this.config.timezone).format();
            const logMessage = `[${timestamp}] [SCHEDULER] [${level.toUpperCase()}] ${message}`;
            
            // Log a consola con colores
            switch (level) {
                case 'error':
                    console.error(paint.red(logMessage));
                    break;
                case 'warn':
                    console.warn(paint.yellow(logMessage));
                    break;
                default:
                    console.log(paint.blue(logMessage));
            }
            
            // Log a archivo si está configurado
            if (this.config.logPath) {
                try {
                    fs.appendFileSync(this.config.logPath, logMessage + '\n');
                } catch (error) {
                    // Error silencioso para evitar loops
                }
            }
        }
    }
    
    async sendAlert(type, data) {
        if (!this.config.enableAlerts || !this.config.alertWebhook) return;
        
        try {
            const alert = {
                type,
                data,
                timestamp: moment().tz(this.config.timezone).format(),
                source: 'avenix-scheduler'
            };
            
            const response = await fetch(this.config.alertWebhook, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(alert)
            });
            
            if (!response.ok) {
                throw new Error(`Alert webhook responded with ${response.status}`);
            }
            
        } catch (error) {
            this.log(`Error enviando alerta: ${error.message}`, 'error');
        }
    }
    
    async persistTasks() {
        if (!this.config.enablePersistence) return;
        
        try {
            const tasksData = {
                tasks: Array.from(this.tasks.values()).map(task => ({
                    name: task.name,
                    type: task.type,
                    pattern: task.pattern,
                    interval: task.interval,
                    executeAt: task.executeAt,
                    options: task.options,
                    // No guardar handler por seguridad
                    handler: null
                })),
                timestamp: Date.now()
            };
            
            saveValue('scheduler:tasks', tasksData);
            
        } catch (error) {
            this.log(`Error persistiendo tareas: ${error.message}`, 'error');
        }
    }
    
    /**
     * Obtener historial de ejecuciones
     */
    getExecutionHistory(limit = 50) {
        const completed = Array.from(this.completedTasks.values())
            .sort((a, b) => b.completedAt - a.completedAt)
            .slice(0, limit);
            
        const failed = Array.from(this.failedTasks.values())
            .sort((a, b) => b.failedAt - a.failedAt)
            .slice(0, limit);
        
        return {
            completed,
            failed,
            total: completed.length + failed.length
        };
    }
    
    /**
     * Limpiar historial antiguo
     */
    cleanupHistory(daysToKeep = 30) {
        const cutoffTime = Date.now() - (daysToKeep * 86400000);
        
        // Limpiar tareas completadas
        for (const [key, task] of this.completedTasks) {
            if ((task.completedAt || task.lastRun) < cutoffTime) {
                this.completedTasks.delete(key);
            }
        }
        
        // Limpiar tareas fallidas
        for (const [key, task] of this.failedTasks) {
            if ((task.failedAt || task.lastRun) < cutoffTime) {
                this.failedTasks.delete(key);
            }
        }
        
        this.log(`Historial limpiado: eliminados registros anteriores a ${daysToKeep} días`);
    }
    
    /**
     * Cerrar scheduler
     */
    async close() {
        console.log(paint.blue('𒁈 Cerrando TaskScheduler...'));
        
        // Cancelar todas las tareas
        for (const taskName of this.tasks.keys()) {
            this.cancelTask(taskName);
        }
        
        // Persistir estado final
        await this.persistTasks();
        
        // Limpiar eventos
        this.removeAllListeners();
        
        console.log(paint.green('𒁈 TaskScheduler cerrado correctamente'));
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                         INSTANCIA GLOBAL                                   │
// ═══════════════════════════════════════════════════════════════════════════════

export const scheduler = new TaskScheduler({
    timezone: 'America/Lima',
    enablePersistence: true,
    dataPath: './scheduler',
    maxConcurrentTasks: 10,
    defaultTimeout: 300000, // 5 minutos
    enableLogging: true,
    logPath: './logs/scheduler.log',
    enableAlerts: false
});

export default scheduler;
