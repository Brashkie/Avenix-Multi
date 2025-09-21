/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                   𒁈 AVENIX-MULTI V2.0.0 - ANALYTICS.JS 𒁈                ┃
 * ┃                      Sistema de Métricas y Estadísticas                   ┃
 * ┃                         Creado por: Hepein Oficial                        ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import chalk from 'chalk';
import moment from 'moment-timezone';

// ═══════════════════════════════════════════════════════════════════════════════
// │                      CLASE PRINCIPAL DE ANALYTICS                          │
// ═══════════════════════════════════════════════════════════════════════════════

export class Analytics extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Configuración general
            timezone: config.timezone || 'America/Lima',
            enablePersistence: config.enablePersistence !== false,
            dataPath: config.dataPath || './analytics',
            
            // Configuración de métricas
            trackCommands: config.trackCommands !== false,
            trackUsers: config.trackUsers !== false,
            trackGroups: config.trackGroups !== false,
            trackPerformance: config.trackPerformance !== false,
            trackErrors: config.trackErrors !== false,
            
            // Retención de datos
            dataRetentionDays: config.dataRetentionDays || 90,
            maxEventsInMemory: config.maxEventsInMemory || 10000,
            
            // Agregación
            aggregationIntervals: config.aggregationIntervals || ['hourly', 'daily', 'weekly', 'monthly'],
            enableRealTimeStats: config.enableRealTimeStats !== false,
            
            // Webhooks para reportes
            enableWebhooks: config.enableWebhooks || false,
            webhookUrl: config.webhookUrl || '',
            reportInterval: config.reportInterval || 'daily',
            
            ...config
        };
        
        // Datos en memoria
        this.events = [];
        this.metrics = {
            commands: new Map(),
            users: new Map(),
            groups: new Map(),
            performance: new Map(),
            errors: new Map(),
            system: new Map()
        };
        
        // Estadísticas agregadas
        this.aggregatedStats = {
            hourly: new Map(),
            daily: new Map(),
            weekly: new Map(),
            monthly: new Map()
        };
        
        // Métricas en tiempo real
        this.realTimeStats = {
            commandsPerMinute: 0,
            activeUsers: new Set(),
            averageResponseTime: 0,
            errorRate: 0,
            memoryUsage: 0,
            uptime: 0
        };
        
        // Contadores para métricas en tiempo real
        this.counters = {
            totalCommands: 0,
            totalErrors: 0,
            responseTimes: [],
            lastMinuteCommands: [],
            lastMinuteErrors: []
        };
        
        this.startTime = Date.now();
        this.lastCleanup = Date.now();
        
        this.init();
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                            INICIALIZACIÓN                              │
    // ═══════════════════════════════════════════════════════════════════════════
    
    async init() {
        try {
            await this.createDataDirectory();
            await this.loadPersistedData();
            this.setupRealTimeUpdates();
            this.setupAggregationTasks();
            this.setupCleanupTasks();
            
            console.log(chalk.green('𒁈 Analytics inicializado correctamente'));
            this.emit('ready');
            
        } catch (error) {
            console.error(chalk.red('𒁈 Error inicializando Analytics:'), error.message);
            this.emit('error', error);
        }
    }
    
    async createDataDirectory() {
        if (this.config.enablePersistence && !fs.existsSync(this.config.dataPath)) {
            fs.mkdirSync(this.config.dataPath, { recursive: true });
        }
    }
    
    async loadPersistedData() {
        if (!this.config.enablePersistence) return;
        
        try {
            const files = ['events.json', 'metrics.json', 'aggregated.json'];
            
            for (const file of files) {
                const filepath = path.join(this.config.dataPath, file);
                
                if (fs.existsSync(filepath)) {
                    const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
                    
                    switch (file) {
                        case 'events.json':
                            this.events = data.slice(-this.config.maxEventsInMemory);
                            break;
                        case 'metrics.json':
                            this.loadMetricsFromData(data);
                            break;
                        case 'aggregated.json':
                            this.loadAggregatedFromData(data);
                            break;
                    }
                }
            }
            
            console.log(chalk.blue(`𒁈 Datos de analytics cargados: ${this.events.length} eventos`));
            
        } catch (error) {
            console.warn(chalk.yellow('𒁈 Error cargando datos persistidos:'), error.message);
        }
    }
    
    setupRealTimeUpdates() {
        if (!this.config.enableRealTimeStats) return;
        
        // Actualizar métricas en tiempo real cada 10 segundos
        setInterval(() => {
            this.updateRealTimeStats();
        }, 10000);
        
        // Limpiar contadores cada minuto
        setInterval(() => {
            this.cleanupCounters();
        }, 60000);
    }
    
    setupAggregationTasks() {
        // Agregar datos cada 5 minutos
        setInterval(() => {
            this.aggregateData().catch(console.error);
        }, 300000); // 5 minutos
        
        // Reporte automático según configuración
        if (this.config.enableWebhooks) {
            this.setupReportSchedule();
        }
    }
    
    setupCleanupTasks() {
        // Limpieza de datos antiguos cada hora
        setInterval(() => {
            this.cleanupOldData().catch(console.error);
        }, 3600000); // 1 hora
        
        // Guardar datos cada 10 minutos
        if (this.config.enablePersistence) {
            setInterval(() => {
                this.persistData().catch(console.error);
            }, 600000); // 10 minutos
        }
    }
    
    setupReportSchedule() {
        let interval;
        
        switch (this.config.reportInterval) {
            case 'hourly':
                interval = 3600000; // 1 hora
                break;
            case 'daily':
                interval = 86400000; // 1 día
                break;
            case 'weekly':
                interval = 604800000; // 1 semana
                break;
            default:
                interval = 86400000; // Por defecto diario
        }
        
        setInterval(() => {
            this.sendAutomaticReport().catch(console.error);
        }, interval);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                        TRACKING DE EVENTOS                             │
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Trackear comando ejecutado
     */
    trackCommand(command, user, responseTime, success = true) {
        if (!this.config.trackCommands) return;
        
        const event = {
            type: 'command',
            timestamp: Date.now(),
            command,
            user,
            responseTime,
            success,
            date: moment().tz(this.config.timezone).format('YYYY-MM-DD'),
            hour: moment().tz(this.config.timezone).hour()
        };
        
        this.addEvent(event);
        
        // Actualizar métricas de comandos
        this.updateCommandMetrics(command, responseTime, success);
        
        // Actualizar contadores para tiempo real
        this.counters.totalCommands++;
        this.counters.lastMinuteCommands.push(Date.now());
        this.counters.responseTimes.push(responseTime);
        
        // Mantener solo últimos 100 tiempos de respuesta
        if (this.counters.responseTimes.length > 100) {
            this.counters.responseTimes = this.counters.responseTimes.slice(-100);
        }
        
        this.emit('commandTracked', event);
    }
    
    /**
     * Trackear actividad de usuario
     */
    trackUser(userId, action, metadata = {}) {
        if (!this.config.trackUsers) return;
        
        const event = {
            type: 'user_activity',
            timestamp: Date.now(),
            userId,
            action,
            metadata,
            date: moment().tz(this.config.timezone).format('YYYY-MM-DD'),
            hour: moment().tz(this.config.timezone).hour()
        };
        
        this.addEvent(event);
        this.updateUserMetrics(userId, action);
        
        // Agregar a usuarios activos
        this.realTimeStats.activeUsers.add(userId);
        
        this.emit('userTracked', event);
    }
    
    /**
     * Trackear actividad de grupo
     */
    trackGroup(groupId, action, metadata = {}) {
        if (!this.config.trackGroups) return;
        
        const event = {
            type: 'group_activity',
            timestamp: Date.now(),
            groupId,
            action,
            metadata,
            date: moment().tz(this.config.timezone).format('YYYY-MM-DD'),
            hour: moment().tz(this.config.timezone).hour()
        };
        
        this.addEvent(event);
        this.updateGroupMetrics(groupId, action);
        
        this.emit('groupTracked', event);
    }
    
    /**
     * Trackear métricas de rendimiento
     */
    trackPerformance(metric, value, metadata = {}) {
        if (!this.config.trackPerformance) return;
        
        const event = {
            type: 'performance',
            timestamp: Date.now(),
            metric,
            value,
            metadata,
            date: moment().tz(this.config.timezone).format('YYYY-MM-DD'),
            hour: moment().tz(this.config.timezone).hour()
        };
        
        this.addEvent(event);
        this.updatePerformanceMetrics(metric, value);
        
        this.emit('performanceTracked', event);
    }
    
    /**
     * Trackear errores
     */
    trackError(error, context = {}) {
        if (!this.config.trackErrors) return;
        
        const event = {
            type: 'error',
            timestamp: Date.now(),
            error: {
                message: error.message || String(error),
                stack: error.stack || null,
                name: error.name || 'Unknown'
            },
            context,
            date: moment().tz(this.config.timezone).format('YYYY-MM-DD'),
            hour: moment().tz(this.config.timezone).hour()
        };
        
        this.addEvent(event);
        this.updateErrorMetrics(error, context);
        
        // Actualizar contadores de errores
        this.counters.totalErrors++;
        this.counters.lastMinuteErrors.push(Date.now());
        
        this.emit('errorTracked', event);
    }
    
    /**
     * Trackear métricas del sistema
     */
    trackSystem(metric, value) {
        const event = {
            type: 'system',
            timestamp: Date.now(),
            metric,
            value,
            date: moment().tz(this.config.timezone).format('YYYY-MM-DD'),
            hour: moment().tz(this.config.timezone).hour()
        };
        
        this.addEvent(event);
        this.updateSystemMetrics(metric, value);
        
        this.emit('systemTracked', event);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                      ACTUALIZACIÓN DE MÉTRICAS                         │
    // ═══════════════════════════════════════════════════════════════════════════
    
    updateCommandMetrics(command, responseTime, success) {
        if (!this.metrics.commands.has(command)) {
            this.metrics.commands.set(command, {
                count: 0,
                successCount: 0,
                failureCount: 0,
                totalResponseTime: 0,
                averageResponseTime: 0,
                minResponseTime: Infinity,
                maxResponseTime: 0,
                lastUsed: null
            });
        }
        
        const metric = this.metrics.commands.get(command);
        metric.count++;
        metric.lastUsed = Date.now();
        
        if (success) {
            metric.successCount++;
        } else {
            metric.failureCount++;
        }
        
        metric.totalResponseTime += responseTime;
        metric.averageResponseTime = metric.totalResponseTime / metric.count;
        metric.minResponseTime = Math.min(metric.minResponseTime, responseTime);
        metric.maxResponseTime = Math.max(metric.maxResponseTime, responseTime);
    }
    
    updateUserMetrics(userId, action) {
        if (!this.metrics.users.has(userId)) {
            this.metrics.users.set(userId, {
                totalActions: 0,
                actions: new Map(),
                firstSeen: Date.now(),
                lastSeen: null,
                isActive: true
            });
        }
        
        const metric = this.metrics.users.get(userId);
        metric.totalActions++;
        metric.lastSeen = Date.now();
        
        if (!metric.actions.has(action)) {
            metric.actions.set(action, 0);
        }
        metric.actions.set(action, metric.actions.get(action) + 1);
    }
    
    updateGroupMetrics(groupId, action) {
        if (!this.metrics.groups.has(groupId)) {
            this.metrics.groups.set(groupId, {
                totalActivity: 0,
                activities: new Map(),
                firstSeen: Date.now(),
                lastActivity: null,
                isActive: true
            });
        }
        
        const metric = this.metrics.groups.get(groupId);
        metric.totalActivity++;
        metric.lastActivity = Date.now();
        
        if (!metric.activities.has(action)) {
            metric.activities.set(action, 0);
        }
        metric.activities.set(action, metric.activities.get(action) + 1);
    }
    
    updatePerformanceMetrics(metric, value) {
        if (!this.metrics.performance.has(metric)) {
            this.metrics.performance.set(metric, {
                count: 0,
                total: 0,
                average: 0,
                min: Infinity,
                max: 0,
                latest: null
            });
        }
        
        const perfMetric = this.metrics.performance.get(metric);
        perfMetric.count++;
        perfMetric.total += value;
        perfMetric.average = perfMetric.total / perfMetric.count;
        perfMetric.min = Math.min(perfMetric.min, value);
        perfMetric.max = Math.max(perfMetric.max, value);
        perfMetric.latest = value;
    }
    
    updateErrorMetrics(error, context) {
        const errorKey = error.name || 'Unknown';
        
        if (!this.metrics.errors.has(errorKey)) {
            this.metrics.errors.set(errorKey, {
                count: 0,
                lastOccurrence: null,
                contexts: new Map()
            });
        }
        
        const metric = this.metrics.errors.get(errorKey);
        metric.count++;
        metric.lastOccurrence = Date.now();
        
        const contextKey = context.command || context.module || 'general';
        if (!metric.contexts.has(contextKey)) {
            metric.contexts.set(contextKey, 0);
        }
        metric.contexts.set(contextKey, metric.contexts.get(contextKey) + 1);
    }
    
    updateSystemMetrics(metric, value) {
        this.metrics.system.set(metric, {
            value,
            timestamp: Date.now()
        });
    }
    
    updateRealTimeStats() {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        
        // Comandos por minuto
        this.counters.lastMinuteCommands = this.counters.lastMinuteCommands.filter(time => time > oneMinuteAgo);
        this.realTimeStats.commandsPerMinute = this.counters.lastMinuteCommands.length;
        
        // Errores por minuto para calcular tasa de error
        this.counters.lastMinuteErrors = this.counters.lastMinuteErrors.filter(time => time > oneMinuteAgo);
        const errorsPerMinute = this.counters.lastMinuteErrors.length;
        
        // Tasa de error (errores / comandos)
        this.realTimeStats.errorRate = this.realTimeStats.commandsPerMinute > 0 ? 
            (errorsPerMinute / this.realTimeStats.commandsPerMinute * 100).toFixed(2) : 0;
        
        // Tiempo de respuesta promedio
        if (this.counters.responseTimes.length > 0) {
            const sum = this.counters.responseTimes.reduce((a, b) => a + b, 0);
            this.realTimeStats.averageResponseTime = Math.round(sum / this.counters.responseTimes.length);
        }
        
        // Uso de memoria
        const memUsage = process.memoryUsage();
        this.realTimeStats.memoryUsage = Math.round(memUsage.heapUsed / 1024 / 1024); // MB
        
        // Uptime
        this.realTimeStats.uptime = Math.round((now - this.startTime) / 1000); // segundos
        
        // Limpiar usuarios activos después de 5 minutos de inactividad
        const fiveMinutesAgo = now - 300000;
        const activeUsers = new Set();
        
        for (const userId of this.realTimeStats.activeUsers) {
            const userMetric = this.metrics.users.get(userId);
            if (userMetric && userMetric.lastSeen > fiveMinutesAgo) {
                activeUsers.add(userId);
            }
        }
        
        this.realTimeStats.activeUsers = activeUsers;
    }
    
    cleanupCounters() {
        const oneHourAgo = Date.now() - 3600000;
        
        // Mantener solo los últimos 100 tiempos de respuesta
        if (this.counters.responseTimes.length > 100) {
            this.counters.responseTimes = this.counters.responseTimes.slice(-100);
        }
        
        // Limpiar comandos y errores de la última hora
        this.counters.lastMinuteCommands = this.counters.lastMinuteCommands.filter(time => time > oneHourAgo);
        this.counters.lastMinuteErrors = this.counters.lastMinuteErrors.filter(time => time > oneHourAgo);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                         AGREGACIÓN DE DATOS                            │
    // ═══════════════════════════════════════════════════════════════════════════
    
    async aggregateData() {
        try {
            const now = moment().tz(this.config.timezone);
            
            for (const interval of this.config.aggregationIntervals) {
                await this.aggregateByInterval(interval, now);
            }
            
            console.log(chalk.blue('𒁈 Datos agregados correctamente'));
            
        } catch (error) {
            console.error(chalk.red('𒁈 Error agregando datos:'), error.message);
        }
    }
    
    async aggregateByInterval(interval, now) {
        const key = this.getAggregationKey(interval, now);
        
        if (!this.aggregatedStats[interval]) {
            this.aggregatedStats[interval] = new Map();
        }
        
        // Obtener eventos del período
        const periodEvents = this.getEventsForPeriod(interval, now);
        
        if (periodEvents.length === 0) return;
        
        const aggregation = {
            period: key,
            timestamp: now.valueOf(),
            totalEvents: periodEvents.length,
            commands: this.aggregateCommands(periodEvents),
            users: this.aggregateUsers(periodEvents),
            groups: this.aggregateGroups(periodEvents),
            performance: this.aggregatePerformance(periodEvents),
            errors: this.aggregateErrors(periodEvents),
            system: this.aggregateSystem(periodEvents)
        };
        
        this.aggregatedStats[interval].set(key, aggregation);
    }
    
    getAggregationKey(interval, moment) {
        switch (interval) {
            case 'hourly':
                return moment.format('YYYY-MM-DD-HH');
            case 'daily':
                return moment.format('YYYY-MM-DD');
            case 'weekly':
                return moment.format('YYYY-[W]WW');
            case 'monthly':
                return moment.format('YYYY-MM');
            default:
                return moment.format('YYYY-MM-DD');
        }
    }
    
    getEventsForPeriod(interval, now) {
        let startTime;
        
        switch (interval) {
            case 'hourly':
                startTime = now.clone().startOf('hour').valueOf();
                break;
            case 'daily':
                startTime = now.clone().startOf('day').valueOf();
                break;
            case 'weekly':
                startTime = now.clone().startOf('week').valueOf();
                break;
            case 'monthly':
                startTime = now.clone().startOf('month').valueOf();
                break;
            default:
                startTime = now.clone().startOf('day').valueOf();
        }
        
        return this.events.filter(event => event.timestamp >= startTime);
    }
    
    aggregateCommands(events) {
        const commandEvents = events.filter(e => e.type === 'command');
        const commands = new Map();
        
        for (const event of commandEvents) {
            if (!commands.has(event.command)) {
                commands.set(event.command, {
                    count: 0,
                    successCount: 0,
                    failureCount: 0,
                    totalResponseTime: 0,
                    averageResponseTime: 0
                });
            }
            
            const cmd = commands.get(event.command);
            cmd.count++;
            cmd.totalResponseTime += event.responseTime || 0;
            
            if (event.success) {
                cmd.successCount++;
            } else {
                cmd.failureCount++;
            }
        }
        
        // Calcular promedios
        for (const [command, stats] of commands) {
            stats.averageResponseTime = stats.count > 0 ? 
                Math.round(stats.totalResponseTime / stats.count) : 0;
        }
        
        return Object.fromEntries(commands);
    }
    
    aggregateUsers(events) {
        const userEvents = events.filter(e => e.type === 'user_activity');
        const users = new Set();
        const actions = new Map();
        
        for (const event of userEvents) {
            users.add(event.userId);
            
            if (!actions.has(event.action)) {
                actions.set(event.action, 0);
            }
            actions.set(event.action, actions.get(event.action) + 1);
        }
        
        return {
            uniqueUsers: users.size,
            totalActions: userEvents.length,
            actionBreakdown: Object.fromEntries(actions)
        };
    }
    
    aggregateGroups(events) {
        const groupEvents = events.filter(e => e.type === 'group_activity');
        const groups = new Set();
        const activities = new Map();
        
        for (const event of groupEvents) {
            groups.add(event.groupId);
            
            if (!activities.has(event.action)) {
                activities.set(event.action, 0);
            }
            activities.set(event.action, activities.get(event.action) + 1);
        }
        
        return {
            activeGroups: groups.size,
            totalActivities: groupEvents.length,
            activityBreakdown: Object.fromEntries(activities)
        };
    }
    
    aggregatePerformance(events) {
        const perfEvents = events.filter(e => e.type === 'performance');
        const metrics = new Map();
        
        for (const event of perfEvents) {
            if (!metrics.has(event.metric)) {
                metrics.set(event.metric, {
                    count: 0,
                    total: 0,
                    min: Infinity,
                    max: 0
                });
            }
            
            const metric = metrics.get(event.metric);
            metric.count++;
            metric.total += event.value;
            metric.min = Math.min(metric.min, event.value);
            metric.max = Math.max(metric.max, event.value);
        }
        
        // Calcular promedios
        for (const [metricName, stats] of metrics) {
            stats.average = stats.count > 0 ? stats.total / stats.count : 0;
        }
        
        return Object.fromEntries(metrics);
    }
    
    aggregateErrors(events) {
        const errorEvents = events.filter(e => e.type === 'error');
        const errors = new Map();
        
        for (const event of errorEvents) {
            const errorName = event.error.name || 'Unknown';
            
            if (!errors.has(errorName)) {
                errors.set(errorName, {
                    count: 0,
                    contexts: new Map()
                });
            }
            
            const error = errors.get(errorName);
            error.count++;
            
            const context = event.context.command || event.context.module || 'general';
            if (!error.contexts.has(context)) {
                error.contexts.set(context, 0);
            }
            error.contexts.set(context, error.contexts.get(context) + 1);
        }
        
        // Convertir contexts Map a Object
        for (const [errorName, errorData] of errors) {
            errorData.contexts = Object.fromEntries(errorData.contexts);
        }
        
        return {
            totalErrors: errorEvents.length,
            errorBreakdown: Object.fromEntries(errors)
        };
    }
    
    aggregateSystem(events) {
        const systemEvents = events.filter(e => e.type === 'system');
        const metrics = new Map();
        
        for (const event of systemEvents) {
            if (!metrics.has(event.metric)) {
                metrics.set(event.metric, []);
            }
            metrics.get(event.metric).push(event.value);
        }
        
        // Calcular estadísticas para cada métrica
        const result = {};
        for (const [metric, values] of metrics) {
            if (values.length > 0) {
                result[metric] = {
                    count: values.length,
                    average: values.reduce((a, b) => a + b, 0) / values.length,
                    min: Math.min(...values),
                    max: Math.max(...values),
                    latest: values[values.length - 1]
                };
            }
        }
        
        return result;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                           CONSULTAS DE DATOS                           │
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Obtener estadísticas en tiempo real
     */
    getRealTimeStats() {
        return {
            ...this.realTimeStats,
            activeUsers: this.realTimeStats.activeUsers.size
        };
    }
    
    /**
     * Obtener top comandos
     */
    getTopCommands(limit = 10) {
        const commands = Array.from(this.metrics.commands.entries())
            .sort(([,a], [,b]) => b.count - a.count)
            .slice(0, limit)
            .map(([command, stats]) => ({ command, ...stats }));
        
        return commands;
    }
    
    /**
     * Obtener usuarios más activos
     */
    getTopUsers(limit = 10) {
        const users = Array.from(this.metrics.users.entries())
            .sort(([,a], [,b]) => b.totalActions - a.totalActions)
            .slice(0, limit)
            .map(([userId, stats]) => ({
                userId,
                totalActions: stats.totalActions,
                lastSeen: stats.lastSeen,
                daysSinceFirstSeen: Math.floor((Date.now() - stats.firstSeen) / 86400000)
            }));
        
        return users;
    }
    
    /**
     * Obtener grupos más activos
     */
    getTopGroups(limit = 10) {
        const groups = Array.from(this.metrics.groups.entries())
            .sort(([,a], [,b]) => b.totalActivity - a.totalActivity)
            .slice(0, limit)
            .map(([groupId, stats]) => ({
                groupId,
                totalActivity: stats.totalActivity,
                lastActivity: stats.lastActivity
            }));
        
        return groups;
    }
    
    /**
     * Obtener estadísticas diarias
     */
    getDailyStats(days = 7) {
        const daily = this.aggregatedStats.daily;
        const result = [];
        
        for (let i = days - 1; i >= 0; i--) {
            const date = moment().tz(this.config.timezone).subtract(i, 'days').format('YYYY-MM-DD');
            const stats = daily.get(date) || this.getEmptyDayStats(date);
            result.push(stats);
        }
        
        return result;
    }
    
    /**
     * Obtener resumen general
     */
    getSummary() {
        const now = Date.now();
        const oneDayAgo = now - 86400000;
        const oneWeekAgo = now - 604800000;
        
        // Eventos recientes
        const recentEvents = this.events.filter(e => e.timestamp > oneDayAgo);
        const weeklyEvents = this.events.filter(e => e.timestamp > oneWeekAgo);
        
        return {
            totalEvents: this.events.length,
            eventsLast24h: recentEvents.length,
            eventsLastWeek: weeklyEvents.length,
            totalCommands: this.counters.totalCommands,
            totalErrors: this.counters.totalErrors,
            uniqueUsers: this.metrics.users.size,
            activeGroups: this.metrics.groups.size,
            uptime: Math.round((now - this.startTime) / 1000),
            realTimeStats: this.getRealTimeStats()
        };
    }
    
    /**
     * Obtener métricas de rendimiento
     */
    getPerformanceMetrics() {
        const metrics = {};
        
        for (const [name, data] of this.metrics.performance) {
            metrics[name] = { ...data };
        }
        
        return metrics;
    }
    
    /**
     * Obtener reporte de errores
     */
    getErrorReport() {
        const errors = Array.from(this.metrics.errors.entries())
            .sort(([,a], [,b]) => b.count - a.count)
            .map(([error, stats]) => ({
                error,
                count: stats.count,
                lastOccurrence: stats.lastOccurrence,
                contexts: Object.fromEntries(stats.contexts)
            }));
        
        return {
            totalErrors: this.counters.totalErrors,
            errorRate: parseFloat(this.realTimeStats.errorRate),
            errorBreakdown: errors
        };
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                         FUNCIONES AUXILIARES                           │
    // ═══════════════════════════════════════════════════════════════════════════
    
    addEvent(event) {
        this.events.push(event);
        
        // Mantener límite de eventos en memoria
        if (this.events.length > this.config.maxEventsInMemory) {
            this.events = this.events.slice(-this.config.maxEventsInMemory);
        }
    }
    
    getEmptyDayStats(date) {
        return {
            period: date,
            timestamp: moment(date).valueOf(),
            totalEvents: 0,
            commands: {},
            users: { uniqueUsers: 0, totalActions: 0, actionBreakdown: {} },
            groups: { activeGroups: 0, totalActivities: 0, activityBreakdown: {} },
            performance: {},
            errors: { totalErrors: 0, errorBreakdown: {} },
            system: {}
        };
    }
    
    loadMetricsFromData(data) {
        for (const [type, metrics] of Object.entries(data)) {
            if (this.metrics[type]) {
                this.metrics[type] = new Map(Object.entries(metrics));
            }
        }
    }
    
    loadAggregatedFromData(data) {
        for (const [interval, stats] of Object.entries(data)) {
            if (this.aggregatedStats[interval]) {
                this.aggregatedStats[interval] = new Map(Object.entries(stats));
            }
        }
    }
    
    async persistData() {
        if (!this.config.enablePersistence) return;
        
        try {
            // Guardar eventos
            const eventsFile = path.join(this.config.dataPath, 'events.json');
            fs.writeFileSync(eventsFile, JSON.stringify(this.events.slice(-this.config.maxEventsInMemory), null, 2));
            
            // Guardar métricas
            const metricsData = {};
            for (const [type, metrics] of Object.entries(this.metrics)) {
                metricsData[type] = Object.fromEntries(metrics);
            }
            const metricsFile = path.join(this.config.dataPath, 'metrics.json');
            fs.writeFileSync(metricsFile, JSON.stringify(metricsData, null, 2));
            
            // Guardar datos agregados
            const aggregatedData = {};
            for (const [interval, stats] of Object.entries(this.aggregatedStats)) {
                aggregatedData[interval] = Object.fromEntries(stats);
            }
            const aggregatedFile = path.join(this.config.dataPath, 'aggregated.json');
            fs.writeFileSync(aggregatedFile, JSON.stringify(aggregatedData, null, 2));
            
        } catch (error) {
            console.error(chalk.red('𒁈 Error persistiendo datos de analytics:'), error.message);
        }
    }
    
    async cleanupOldData() {
        const cutoffTime = Date.now() - (this.config.dataRetentionDays * 86400000);
        
        // Limpiar eventos antiguos
        this.events = this.events.filter(event => event.timestamp > cutoffTime);
        
        // Limpiar estadísticas agregadas antiguas
        for (const [interval, stats] of Object.entries(this.aggregatedStats)) {
            const filteredStats = new Map();
            
            for (const [key, data] of stats) {
                if (data.timestamp > cutoffTime) {
                    filteredStats.set(key, data);
                }
            }
            
            this.aggregatedStats[interval] = filteredStats;
        }
        
        console.log(chalk.blue(`𒁈 Datos antiguos limpiados (${this.config.dataRetentionDays} días)`));
    }
    
    async sendAutomaticReport() {
        if (!this.config.enableWebhooks || !this.config.webhookUrl) return;
        
        try {
            const report = {
                timestamp: moment().tz(this.config.timezone).format(),
                summary: this.getSummary(),
                topCommands: this.getTopCommands(5),
                topUsers: this.getTopUsers(5),
                errorReport: this.getErrorReport(),
                performance: this.getPerformanceMetrics()
            };
            
            const response = await fetch(this.config.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(report)
            });
            
            if (!response.ok) {
                throw new Error(`Webhook response: ${response.status}`);
            }
            
            console.log(chalk.green('𒁈 Reporte automático enviado'));
            
        } catch (error) {
            console.error(chalk.red('𒁈 Error enviando reporte automático:'), error.message);
        }
    }
    
    /**
     * Exportar datos para análisis externo
     */
    exportData(format = 'json', options = {}) {
        const data = {
            summary: this.getSummary(),
            realTimeStats: this.getRealTimeStats(),
            topCommands: this.getTopCommands(options.limit || 20),
            topUsers: this.getTopUsers(options.limit || 20),
            dailyStats: this.getDailyStats(options.days || 30),
            errorReport: this.getErrorReport(),
            performance: this.getPerformanceMetrics()
        };
        
        switch (format) {
            case 'json':
                return JSON.stringify(data, null, 2);
                
            case 'csv':
                // Implementar exportación CSV básica
                const csv = [];
                csv.push('metric,value');
                csv.push(`total_events,${data.summary.totalEvents}`);
                csv.push(`total_commands,${data.summary.totalCommands}`);
                csv.push(`unique_users,${data.summary.uniqueUsers}`);
                csv.push(`error_rate,${data.realTimeStats.errorRate}`);
                return csv.join('\n');
                
            default:
                return data;
        }
    }
    
    /**
     * Cerrar analytics
     */
    async close() {
        console.log(chalk.blue('𒁈 Cerrando Analytics...'));
        
        await this.persistData();
        this.removeAllListeners();
        
        console.log(chalk.green('𒁈 Analytics cerrado correctamente'));
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                         INSTANCIA GLOBAL                                   │
// ═══════════════════════════════════════════════════════════════════════════════

export const analytics = new Analytics({
    timezone: 'America/Lima',
    enablePersistence: true,
    dataPath: './analytics',
    trackCommands: true,
    trackUsers: true,
    trackGroups: true,
    trackPerformance: true,
    trackErrors: true,
    dataRetentionDays: 90,
    enableRealTimeStats: true,
    aggregationIntervals: ['daily', 'weekly', 'monthly']
});

export default analytics;
