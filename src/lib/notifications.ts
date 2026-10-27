/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                 𒁈 AVENIX-MULTI V2.0.0 - NOTIFICATIONS.JS 𒁈               ┃
 * ┃                       Sistema de Notificaciones                            ┃
 * ┃                         Creado por: Hepein Oficial                         ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import paint from './paint.js'
import { loadValue, saveValue } from './storage.js'
import moment from 'moment-timezone';

// ═══════════════════════════════════════════════════════════════════════════════
// │                    CLASE PRINCIPAL DE NOTIFICACIONES                       │
// ═══════════════════════════════════════════════════════════════════════════════

export class NotificationManager extends EventEmitter {
    declare config: any
    declare queues: any
    declare subscribers: any
    declare templates: Map<any, any>
    declare history: Map<any, any>
    declare rateLimits: Map<any, any>
    declare stats: any
    declare emailTransporter: any
    declare pushService: any
    declare isPaused: boolean

    constructor(config: Record<string, any> = {}) {
        super();
        
        this.config = {
            // Configuración general
            timezone: config.timezone || 'America/Lima',
            enablePersistence: config.enablePersistence !== false,
            dataPath: config.dataPath || './notifications',
            
            // Configuración de canales
            enableWhatsApp: config.enableWhatsApp !== false,
            enableEmail: config.enableEmail || false,
            enableWebhook: config.enableWebhook || false,
            enablePush: config.enablePush || false,
            
            // Configuración de WhatsApp
            bot: config.bot || null, // Instancia del bot de WhatsApp
            
            // Configuración de Email
            emailConfig: {
                host: config.emailConfig?.host || 'smtp.gmail.com',
                port: config.emailConfig?.port || 587,
                secure: config.emailConfig?.secure || false,
                auth: {
                    user: config.emailConfig?.user || process.env.EMAIL_USER,
                    pass: config.emailConfig?.pass || process.env.EMAIL_PASS
                },
                ...config.emailConfig
            },
            
            // Configuración de Webhook
            webhookUrl: config.webhookUrl || process.env.WEBHOOK_URL,
            webhookHeaders: config.webhookHeaders || {},
            
            // Configuración de Push
            pushConfig: {
                vapidKeys: {
                    publicKey: config.pushConfig?.vapidKeys?.publicKey || process.env.VAPID_PUBLIC,
                    privateKey: config.pushConfig?.vapidKeys?.privateKey || process.env.VAPID_PRIVATE
                },
                contact: config.pushConfig?.contact || 'mailto:admin@avenix-multi.com',
                ...config.pushConfig
            },
            
            // Configuración de cola
            enableQueue: config.enableQueue !== false,
            maxRetries: config.maxRetries || 3,
            retryDelay: config.retryDelay || 5000,
            queueProcessInterval: config.queueProcessInterval || 1000,
            
            // Configuración de filtros
            enableFiltering: config.enableFiltering !== false,
            enableRateLimiting: config.enableRateLimiting !== false,
            maxNotificationsPerUser: config.maxNotificationsPerUser || 10,
            rateLimitWindow: config.rateLimitWindow || 3600000, // 1 hora
            
            ...config
        };
        
        // Colas de notificaciones
        this.queues = {
            whatsapp: [],
            email: [],
            webhook: [],
            push: []
        };
        
        // Subscriptores
        this.subscribers = {
            owners: new Set(),
            admins: new Set(),
            users: new Set(),
            groups: new Set(),
            push: new Map() // userId -> subscriptionData
        };
        
        // Plantillas de notificación
        this.templates = new Map();
        
        // Historial de notificaciones
        this.history = new Map();
        
        // Rate limiting
        this.rateLimits = new Map();
        
        // Estadísticas
        this.stats = {
            total: 0,
            sent: 0,
            failed: 0,
            queued: 0,
            byChannel: {
                whatsapp: 0,
                email: 0,
                webhook: 0,
                push: 0
            },
            byType: new Map()
        };
        
        // Configuraciones externas
        this.emailTransporter = null;
        this.pushService = null;
        
        this.init();
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                            INICIALIZACIÓN                              │
    // ═══════════════════════════════════════════════════════════════════════════
    
    async init() {
        try {
            await this.createDataDirectory();
            await this.loadSubscribers();
            await this.loadTemplates();
            this.setupEmailTransporter();
            this.setupPushService();
            this.setupDefaultTemplates();
            this.startQueueProcessor();
            
            console.log(paint.green('𒁈 NotificationManager inicializado correctamente'));
            this.emit('ready');
            
        } catch (error) {
            console.error(paint.red('𒁈 Error inicializando NotificationManager:'), error.message);
            this.emit('error', error);
        }
    }
    
    async createDataDirectory() {
        if (this.config.enablePersistence && !fs.existsSync(this.config.dataPath)) {
            fs.mkdirSync(this.config.dataPath, { recursive: true });
        }
    }
    
    async loadSubscribers() {
        if (!this.config.enablePersistence) return;
        
        try {
            const data = loadValue<any>('notifications:subscribers', null);

            if (data) {
                
                this.subscribers.owners = new Set(data.owners || []);
                this.subscribers.admins = new Set(data.admins || []);
                this.subscribers.users = new Set(data.users || []);
                this.subscribers.groups = new Set(data.groups || []);
                this.subscribers.push = new Map(data.push || []);
                
                console.log(paint.blue(`𒁈 Subscriptores cargados: ${data.owners?.length || 0} owners, ${data.users?.length || 0} users`));
            }
            
        } catch (error) {
            console.warn(paint.yellow('𒁈 Error cargando subscriptores:'), error.message);
        }
    }
    
    async loadTemplates() {
        if (!this.config.enablePersistence) return;
        
        try {
            const data = loadValue<Record<string, any> | null>('notifications:templates', null);

            if (data) {
                
                for (const [name, template] of Object.entries(data as Record<string, any>)) {
                    this.templates.set(name, template);
                }
                
                console.log(paint.blue(`𒁈 ${Object.keys(data).length} plantillas cargadas`));
            }
            
        } catch (error) {
            console.warn(paint.yellow('𒁈 Error cargando plantillas:'), error.message);
        }
    }
    
    setupEmailTransporter() {
        if (!this.config.enableEmail) return;
        
        try {
            // Importar nodemailer dinámicamente si está disponible
            import('nodemailer').then((nodemailer) => {
                this.emailTransporter = nodemailer.createTransport(this.config.emailConfig);
                console.log(paint.blue('𒁈 Email transporter configurado'));
            }).catch(() => {
                console.warn(paint.yellow('𒁈 Nodemailer no disponible, email deshabilitado'));
                this.config.enableEmail = false;
            });
        } catch (error) {
            console.warn(paint.yellow('𒁈 Error configurando email:'), error.message);
            this.config.enableEmail = false;
        }
    }
    
    setupPushService() {
        if (!this.config.enablePush) return;
        
        try {
            // Importar web-push dinámicamente si está disponible
            import('web-push').then((webpush) => {
                this.pushService = webpush.default || webpush;
                
                if (this.config.pushConfig.vapidKeys.publicKey && this.config.pushConfig.vapidKeys.privateKey) {
                    this.pushService.setVapidDetails(
                        this.config.pushConfig.contact,
                        this.config.pushConfig.vapidKeys.publicKey,
                        this.config.pushConfig.vapidKeys.privateKey
                    );
                    console.log(paint.blue('𒁈 Push service configurado'));
                } else {
                    console.warn(paint.yellow('𒁈 VAPID keys no configuradas, push deshabilitado'));
                    this.config.enablePush = false;
                }
            }).catch(() => {
                console.warn(paint.yellow('𒁈 Web-push no disponible, push deshabilitado'));
                this.config.enablePush = false;
            });
        } catch (error) {
            console.warn(paint.yellow('𒁈 Error configurando push:'), error.message);
            this.config.enablePush = false;
        }
    }
    
    setupDefaultTemplates() {
        // Plantillas por defecto del sistema
        const defaultTemplates = {
            system_alert: {
                title: '🚨 Alerta del Sistema',
                whatsapp: '🚨 *ALERTA DEL SISTEMA* 🚨\n\n{message}\n\n⏰ {timestamp}\n\n𒁈 *Avenix-Multi*',
                email: {
                    subject: 'Alerta del Sistema - Avenix-Multi',
                    html: '<h2>🚨 Alerta del Sistema</h2><p>{message}</p><p><small>Timestamp: {timestamp}</small></p>'
                },
                webhook: {
                    type: 'system_alert',
                    message: '{message}',
                    timestamp: '{timestamp}',
                    source: 'avenix-multi'
                }
            },
            
            user_banned: {
                title: '🔒 Usuario Baneado',
                whatsapp: '🔒 *USUARIO BANEADO* 🔒\n\n👤 Usuario: {user}\n📝 Razón: {reason}\n⏰ Duración: {duration}\n\n𒁈 *Avenix-Multi*',
                email: {
                    subject: 'Usuario Baneado - Avenix-Multi',
                    html: '<h2>🔒 Usuario Baneado</h2><p><strong>Usuario:</strong> {user}</p><p><strong>Razón:</strong> {reason}</p><p><strong>Duración:</strong> {duration}</p>'
                }
            },
            
            error_critical: {
                title: '💥 Error Crítico',
                whatsapp: '💥 *ERROR CRÍTICO* 💥\n\n🐛 Error: {error}\n📍 Ubicación: {location}\n⏰ {timestamp}\n\n*Requiere atención inmediata*\n\n𒁈 *Avenix-Multi*',
                email: {
                    subject: 'Error Crítico - Avenix-Multi',
                    html: '<h2 style="color: red;">💥 Error Crítico</h2><p><strong>Error:</strong> {error}</p><p><strong>Ubicación:</strong> {location}</p><p><strong>Timestamp:</strong> {timestamp}</p><p style="color: red;"><strong>Requiere atención inmediata</strong></p>'
                }
            },
            
            daily_report: {
                title: '📊 Reporte Diario',
                whatsapp: '📊 *REPORTE DIARIO* 📊\n\n📅 Fecha: {date}\n\n📈 Estadísticas:\n• Comandos: {commands}\n• Usuarios: {users}\n• Grupos: {groups}\n• Errores: {errors}\n\n𒁈 *Avenix-Multi*',
                email: {
                    subject: 'Reporte Diario - {date}',
                    html: '<h2>📊 Reporte Diario</h2><h3>Fecha: {date}</h3><ul><li>Comandos: {commands}</li><li>Usuarios: {users}</li><li>Grupos: {groups}</li><li>Errores: {errors}</li></ul>'
                }
            },
            
            maintenance_mode: {
                title: '🔧 Modo Mantenimiento',
                whatsapp: '🔧 *MODO MANTENIMIENTO* 🔧\n\n⚠️ El bot entrará en mantenimiento\n\n⏰ Inicio: {start_time}\n🕐 Duración: {duration}\n📝 Motivo: {reason}\n\n𒁈 *Avenix-Multi*',
                email: {
                    subject: 'Modo Mantenimiento - Avenix-Multi',
                    html: '<h2>🔧 Modo Mantenimiento</h2><p><strong>Inicio:</strong> {start_time}</p><p><strong>Duración:</strong> {duration}</p><p><strong>Motivo:</strong> {reason}</p>'
                }
            },
            
            new_user: {
                title: '👋 Nuevo Usuario',
                whatsapp: '👋 *NUEVO USUARIO* 👋\n\n🆕 Usuario: {user}\n📱 Chat: {chat}\n⏰ {timestamp}\n\n𒁈 *Avenix-Multi*',
                email: {
                    subject: 'Nuevo Usuario Registrado',
                    html: '<h2>👋 Nuevo Usuario</h2><p><strong>Usuario:</strong> {user}</p><p><strong>Chat:</strong> {chat}</p><p><strong>Timestamp:</strong> {timestamp}</p>'
                }
            }
        };
        
        for (const [name, template] of Object.entries(defaultTemplates)) {
            this.templates.set(name, template);
        }
    }
    
    startQueueProcessor() {
        if (!this.config.enableQueue) return;
        
        // Procesar colas cada segundo
        setInterval(() => {
            this.processQueues().catch(console.error);
        }, this.config.queueProcessInterval);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                      GESTIÓN DE SUBSCRIPTORES                          │
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Agregar owner (propietario)
     */
    addOwner(userId) {
        this.subscribers.owners.add(userId);
        this.persistSubscribers();
        this.emit('subscriberAdded', { type: 'owner', userId });
        return true;
    }
    
    /**
     * Agregar admin
     */
    addAdmin(userId) {
        this.subscribers.admins.add(userId);
        this.persistSubscribers();
        this.emit('subscriberAdded', { type: 'admin', userId });
        return true;
    }
    
    /**
     * Agregar usuario normal
     */
    addUser(userId) {
        this.subscribers.users.add(userId);
        this.persistSubscribers();
        this.emit('subscriberAdded', { type: 'user', userId });
        return true;
    }
    
    /**
     * Agregar grupo
     */
    addGroup(groupId) {
        this.subscribers.groups.add(groupId);
        this.persistSubscribers();
        this.emit('subscriberAdded', { type: 'group', groupId });
        return true;
    }
    
    /**
     * Agregar subscripción push
     */
    addPushSubscription(userId, subscription) {
        this.subscribers.push.set(userId, {
            subscription,
            timestamp: Date.now()
        });
        this.persistSubscribers();
        this.emit('pushSubscriptionAdded', { userId, subscription });
        return true;
    }
    
    /**
     * Remover subscriptor
     */
    removeSubscriber(type, id) {
        let removed = false;
        
        switch (type) {
            case 'owner':
                removed = this.subscribers.owners.delete(id);
                break;
            case 'admin':
                removed = this.subscribers.admins.delete(id);
                break;
            case 'user':
                removed = this.subscribers.users.delete(id);
                break;
            case 'group':
                removed = this.subscribers.groups.delete(id);
                break;
            case 'push':
                removed = this.subscribers.push.delete(id);
                break;
        }
        
        if (removed) {
            this.persistSubscribers();
            this.emit('subscriberRemoved', { type, id });
        }
        
        return removed;
    }
    
    /**
     * Obtener subscriptores por tipo
     */
    getSubscribers(type) {
        switch (type) {
            case 'owners':
                return Array.from(this.subscribers.owners as Iterable<any>);
            case 'admins':
                return Array.from(this.subscribers.admins as Iterable<any>);
            case 'users':
                return Array.from(this.subscribers.users as Iterable<any>);
            case 'groups':
                return Array.from(this.subscribers.groups as Iterable<any>);
            case 'push':
                return Array.from(this.subscribers.push.keys() as Iterable<any>);
            default:
                return [];
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                        ENVÍO DE NOTIFICACIONES                         │
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Enviar notificación a owners
     */
    async notifyOwners(templateName, data: Record<string, any> = {}, channels = ['whatsapp']) {
        const recipients = Array.from(this.subscribers.owners as Iterable<any>);
        return await this.sendNotification(templateName, data, recipients, channels, 'owners');
    }
    
    /**
     * Enviar notificación a admins
     */
    async notifyAdmins(templateName, data: Record<string, any> = {}, channels = ['whatsapp']) {
        const recipients = Array.from(this.subscribers.admins as Iterable<any>);
        return await this.sendNotification(templateName, data, recipients, channels, 'admins');
    }
    
    /**
     * Enviar notificación a usuarios
     */
    async notifyUsers(templateName, data: Record<string, any> = {}, channels = ['whatsapp'], userIds: any = null) {
        const recipients = userIds || Array.from(this.subscribers.users as Iterable<any>);
        return await this.sendNotification(templateName, data, recipients, channels, 'users');
    }
    
    /**
     * Enviar notificación a grupos
     */
    async notifyGroups(templateName, data: Record<string, any> = {}, channels = ['whatsapp'], groupIds: any = null) {
        const recipients = groupIds || Array.from(this.subscribers.groups as Iterable<any>);
        return await this.sendNotification(templateName, data, recipients, channels, 'groups');
    }
    
    /**
     * Broadcast a todos los subscriptores
     */
    async broadcast(templateName, data: Record<string, any> = {}, channels = ['whatsapp']) {
        const allRecipients = [
            ...this.subscribers.owners,
            ...this.subscribers.admins,
            ...this.subscribers.users,
            ...this.subscribers.groups
        ];
        
        const uniqueRecipients = [...new Set(allRecipients)];
        return await this.sendNotification(templateName, data, uniqueRecipients, channels, 'broadcast');
    }
    
    /**
     * Enviar notificación personalizada
     */
    async sendCustomNotification(recipients, message, channels = ['whatsapp'], options: Record<string, any> = {}) {
        const notification = {
            id: this.generateNotificationId(),
            type: 'custom',
            message,
            recipients: Array.isArray(recipients) ? recipients : [recipients],
            channels: Array.isArray(channels) ? channels : [channels],
            options,
            timestamp: Date.now(),
            status: 'pending'
        };
        
        this.stats.total++;
        
        if (this.config.enableQueue) {
            // Agregar a colas
            for (const channel of notification.channels) {
                if (this.queues[channel]) {
                    this.queues[channel].push(notification);
                    this.stats.queued++;
                }
            }
        } else {
            // Enviar inmediatamente
            await this.processNotification(notification);
        }
        
        this.emit('notificationCreated', notification);
        return notification;
    }
    
    /**
     * Función principal de envío
     */
    async sendNotification(templateName, data: Record<string, any> = {}, recipients: any[] = [], channels = ['whatsapp'], audienceType = 'custom') {
        try {
            // Verificar template
            const template = this.templates.get(templateName);
            if (!template) {
                throw new Error(`Template no encontrado: ${templateName}`);
            }
            
            // Verificar rate limiting
            if (this.config.enableRateLimiting && !this.checkRateLimit(audienceType)) {
                throw new Error('Rate limit excedido para este tipo de audiencia');
            }
            
            // Crear notificación
            const notification = {
                id: this.generateNotificationId(),
                type: templateName,
                template,
                data: {
                    ...data,
                    timestamp: moment().tz(this.config.timezone).format('DD/MM/YYYY HH:mm:ss'),
                    date: moment().tz(this.config.timezone).format('DD/MM/YYYY')
                },
                recipients: Array.isArray(recipients) ? recipients : [recipients],
                channels: Array.isArray(channels) ? channels : [channels],
                audienceType,
                timestamp: Date.now(),
                status: 'pending',
                attempts: 0,
                lastAttempt: null,
                errors: []
            };
            
            // Filtrar recipients si está habilitado
            if (this.config.enableFiltering) {
                notification.recipients = this.filterRecipients(notification.recipients, audienceType);
            }
            
            this.stats.total++;
            this.updateTypeStats(templateName);
            
            if (this.config.enableQueue) {
                // Agregar a colas correspondientes
                for (const channel of notification.channels) {
                    if (this.queues[channel]) {
                        this.queues[channel].push({ ...notification });
                        this.stats.queued++;
                    }
                }
            } else {
                // Enviar inmediatamente
                await this.processNotification(notification);
            }
            
            // Guardar en historial
            this.history.set(notification.id, notification);
            
            this.emit('notificationCreated', notification);
            return notification;
            
        } catch (error) {
            console.error(paint.red('𒁈 Error enviando notificación:'), error.message);
            this.stats.failed++;
            throw error;
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                      PROCESAMIENTO DE NOTIFICACIONES                   │
    // ═══════════════════════════════════════════════════════════════════════════
    
    async processQueues() {
        for (const [channel, queue] of Object.entries(this.queues as Record<string, any>)) {
            if (queue.length === 0) continue;
            
            const notification = queue.shift();
            if (notification) {
                this.stats.queued--;
                await this.processNotification(notification, channel);
            }
        }
    }
    
    async processNotification(notification, specificChannel: any = null) {
        notification.attempts++;
        notification.lastAttempt = Date.now();
        notification.status = 'processing';
        
        try {
            const channels = specificChannel ? [specificChannel] : notification.channels;
            
            for (const channel of channels) {
                await this.sendToChannel(notification, channel);
            }
            
            notification.status = 'sent';
            this.stats.sent++;
            this.updateChannelStats(channels);
            
            this.emit('notificationSent', notification);
            
        } catch (error) {
            notification.status = 'failed';
            notification.errors.push({
                message: error.message,
                timestamp: Date.now(),
                attempt: notification.attempts
            });
            
            this.stats.failed++;
            
            // Reintentar si no se alcanzó el límite
            if (notification.attempts < this.config.maxRetries) {
                setTimeout(() => {
                    if (this.config.enableQueue) {
                        // Volver a agregar a la cola
                        for (const channel of notification.channels) {
                            if (this.queues[channel]) {
                                this.queues[channel].push(notification);
                            }
                        }
                    } else {
                        this.processNotification(notification).catch(console.error);
                    }
                }, this.config.retryDelay);
            }
            
            this.emit('notificationFailed', notification, error);
            console.error(paint.red(`𒁈 Error procesando notificación ${notification.id}:`), error.message);
        }
    }
    
    async sendToChannel(notification, channel) {
        switch (channel) {
            case 'whatsapp':
                await this.sendWhatsApp(notification);
                break;
            case 'email':
                await this.sendEmail(notification);
                break;
            case 'webhook':
                await this.sendWebhook(notification);
                break;
            case 'push':
                await this.sendPush(notification);
                break;
            default:
                throw new Error(`Canal no soportado: ${channel}`);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                         ENVÍO POR CANALES                              │
    // ═══════════════════════════════════════════════════════════════════════════
    
    async sendWhatsApp(notification) {
        if (!this.config.enableWhatsApp || !this.config.bot) {
            throw new Error('WhatsApp no está configurado');
        }
        
        const template = notification.template || { whatsapp: notification.message };
        let message = template.whatsapp || notification.message;
        
        // Reemplazar variables en el template
        if (notification.data) {
            for (const [key, value] of Object.entries(notification.data as Record<string, any>)) {
                message = message.replace(new RegExp(`{${key}}`, 'g'), value);
            }
        }
        
        // Enviar a cada recipient
        for (const recipient of notification.recipients) {
            try {
                await this.config.bot.sendMessage(recipient, { text: message });
                await new Promise<void>(resolve => setTimeout(resolve, 1000)); // Delay entre envíos
            } catch (error) {
                console.warn(paint.yellow(`𒁈 Error enviando WhatsApp a ${recipient}:`), error.message);
            }
        }
    }
    
    async sendEmail(notification) {
        if (!this.config.enableEmail || !this.emailTransporter) {
            throw new Error('Email no está configurado');
        }
        
        const template = notification.template || { email: { subject: 'Notification', html: notification.message } };
        const emailTemplate = template.email;
        
        if (!emailTemplate) {
            throw new Error('Template de email no encontrado');
        }
        
        let subject = emailTemplate.subject || 'Avenix-Multi Notification';
        let html = emailTemplate.html || notification.message;
        
        // Reemplazar variables
        if (notification.data) {
            for (const [key, value] of Object.entries(notification.data as Record<string, any>)) {
                subject = subject.replace(new RegExp(`{${key}}`, 'g'), value);
                html = html.replace(new RegExp(`{${key}}`, 'g'), value);
            }
        }
        
        // Enviar a cada recipient
        for (const recipient of notification.recipients) {
            try {
                await this.emailTransporter.sendMail({
                    from: this.config.emailConfig.from || this.config.emailConfig.auth.user,
                    to: recipient,
                    subject,
                    html
                });
            } catch (error) {
                console.warn(paint.yellow(`𒁈 Error enviando email a ${recipient}:`), error.message);
            }
        }
    }
    
    async sendWebhook(notification) {
        if (!this.config.enableWebhook || !this.config.webhookUrl) {
            throw new Error('Webhook no está configurado');
        }
        
        const template = notification.template || { webhook: notification.message };
        let payload = template.webhook || { message: notification.message };
        
        // Reemplazar variables si es objeto
        if (typeof payload === 'object' && notification.data) {
            const vars = notification.data as Record<string, any>;
            const fill = (value: unknown): unknown =>
                typeof value === 'string' ? value.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m))
                : Array.isArray(value) ? value.map(fill)
                : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, fill(v)]))
                : value;
            payload = fill(structuredClone(payload));
        }
        
        // Agregar metadata
        payload.notification_id = notification.id;
        payload.recipients = notification.recipients;
        payload.timestamp = notification.timestamp;
        payload.source = 'avenix-multi';
        
        try {
            const response = await fetch(this.config.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.config.webhookHeaders
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                throw new Error(`Webhook responded with status ${response.status}`);
            }
            
        } catch (error) {
            throw new Error(`Error sending webhook: ${error.message}`);
        }
    }
    
    async sendPush(notification) {
        if (!this.config.enablePush || !this.pushService) {
            throw new Error('Push notifications no están configuradas');
        }
        
        const template = notification.template || { title: 'Notification', body: notification.message };
        
        let title = template.title || 'Avenix-Multi';
        let body = template.push || notification.message;
        
        // Reemplazar variables
        if (notification.data) {
            for (const [key, value] of Object.entries(notification.data as Record<string, any>)) {
                title = title.replace(new RegExp(`{${key}}`, 'g'), value);
                body = body.replace(new RegExp(`{${key}}`, 'g'), value);
            }
        }
        
        const pushPayload = {
            notification: {
                title,
                body,
                icon: '/icon-192x192.png',
                badge: '/badge-72x72.png',
                data: {
                    notificationId: notification.id,
                    timestamp: notification.timestamp
                }
            }
        };
        
        // Enviar a subscriptores push que estén en recipients
        for (const recipient of notification.recipients) {
            const pushData = this.subscribers.push.get(recipient);
            if (pushData) {
                try {
                    await this.pushService.sendNotification(
                        pushData.subscription,
                        JSON.stringify(pushPayload)
                    );
                } catch (error) {
                    // Si la subscripción es inválida, eliminarla
                    if (error.statusCode === 410) {
                        this.subscribers.push.delete(recipient);
                    }
                    console.warn(paint.yellow(`𒁈 Error enviando push a ${recipient}:`), error.message);
                }
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                        GESTIÓN DE PLANTILLAS                           │
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Crear o actualizar plantilla
     */
    setTemplate(name, template) {
        this.templates.set(name, {
            ...template,
            createdAt: Date.now(),
            updatedAt: Date.now()
        });
        
        this.persistTemplates();
        this.emit('templateUpdated', { name, template });
        return true;
    }
    
    /**
     * Obtener plantilla
     */
    getTemplate(name) {
        return this.templates.get(name);
    }
    
    /**
     * Listar todas las plantillas
     */
    getAllTemplates() {
        return Object.fromEntries(this.templates);
    }
    
    /**
     * Eliminar plantilla
     */
    deleteTemplate(name) {
        const deleted = this.templates.delete(name);
        if (deleted) {
            this.persistTemplates();
            this.emit('templateDeleted', { name });
        }
        return deleted;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                         FUNCIONES AUXILIARES                           │
    // ═══════════════════════════════════════════════════════════════════════════
    
    generateNotificationId() {
        return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    checkRateLimit(audienceType) {
        const now = Date.now();
        const windowStart = now - this.config.rateLimitWindow;
        
        if (!this.rateLimits.has(audienceType)) {
            this.rateLimits.set(audienceType, []);
        }
        
        const requests = this.rateLimits.get(audienceType);
        
        // Limpiar requests antiguos
        const recentRequests = requests.filter(time => time > windowStart);
        this.rateLimits.set(audienceType, recentRequests);
        
        // Verificar límite
        if (recentRequests.length >= this.config.maxNotificationsPerUser) {
            return false;
        }
        
        // Agregar request actual
        recentRequests.push(now);
        return true;
    }
    
    filterRecipients(recipients, audienceType) {
        // Implementar filtros según necesidades
        // Por ejemplo, filtrar usuarios inactivos, baneados, etc.
        return recipients.filter(recipient => {
            // Lógica de filtrado personalizada
            return true;
        });
    }
    
    updateTypeStats(type) {
        if (!this.stats.byType.has(type)) {
            this.stats.byType.set(type, 0);
        }
        this.stats.byType.set(type, this.stats.byType.get(type) + 1);
    }
    
    updateChannelStats(channels) {
        for (const channel of channels) {
            if (this.stats.byChannel[channel] !== undefined) {
                this.stats.byChannel[channel]++;
            }
        }
    }
    
    async persistSubscribers() {
        if (!this.config.enablePersistence) return;
        
        try {
            const data = {
                owners: Array.from(this.subscribers.owners as Iterable<any>),
                admins: Array.from(this.subscribers.admins as Iterable<any>),
                users: Array.from(this.subscribers.users as Iterable<any>),
                groups: Array.from(this.subscribers.groups as Iterable<any>),
                push: Array.from(this.subscribers.push.entries() as Iterable<any>),
                timestamp: Date.now()
            };
            
            saveValue('notifications:subscribers', data);
            
        } catch (error) {
            console.error(paint.red('𒁈 Error persistiendo subscriptores:'), error.message);
        }
    }
    
    async persistTemplates() {
        if (!this.config.enablePersistence) return;
        
        try {
            const data = Object.fromEntries(this.templates);
            saveValue('notifications:templates', data);
            
        } catch (error) {
            console.error(paint.red('𒁈 Error persistiendo plantillas:'), error.message);
        }
    }
    
    /**
     * Obtener estadísticas
     */
    getStats() {
        return {
            ...this.stats,
            subscribers: {
                owners: this.subscribers.owners.size,
                admins: this.subscribers.admins.size,
                users: this.subscribers.users.size,
                groups: this.subscribers.groups.size,
                push: this.subscribers.push.size
            },
            templates: this.templates.size,
            queueSizes: Object.fromEntries(
                Object.entries(this.queues as Record<string, any>).map(([channel, queue]) => [channel, queue.length])
            ),
            byType: Object.fromEntries(this.stats.byType)
        };
    }
    
    /**
     * Obtener historial de notificaciones
     */
    getHistory(limit = 50) {
        const notifications = Array.from(this.history.values())
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
        
        return notifications;
    }
    
    /**
     * Limpiar historial antiguo
     */
    cleanupHistory(daysToKeep = 7) {
        const cutoffTime = Date.now() - (daysToKeep * 86400000);
        
        for (const [id, notification] of this.history) {
            if (notification.timestamp < cutoffTime) {
                this.history.delete(id);
            }
        }
    }
    
    /**
     * Pausar notificaciones
     */
    pause() {
        this.isPaused = true;
        this.emit('paused');
    }
    
    /**
     * Reanudar notificaciones
     */
    resume() {
        this.isPaused = false;
        this.emit('resumed');
    }
    
    /**
     * Cerrar notification manager
     */
    async close() {
        console.log(paint.blue('𒁈 Cerrando NotificationManager...'));
        
        // Procesar notificaciones pendientes
        await this.processQueues();
        
        // Persistir datos
        await this.persistSubscribers();
        await this.persistTemplates();
        
        // Limpiar eventos
        this.removeAllListeners();
        
        console.log(paint.green('𒁈 NotificationManager cerrado correctamente'));
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                         INSTANCIA GLOBAL                                   │
// ═══════════════════════════════════════════════════════════════════════════════

export const notifications = new NotificationManager({
    timezone: 'America/Lima',
    enablePersistence: true,
    dataPath: './notifications',
    enableWhatsApp: true,
    enableEmail: false,
    enableWebhook: false,
    enablePush: false,
    enableQueue: true,
    maxRetries: 3,
    retryDelay: 5000,
    enableRateLimiting: true,
    maxNotificationsPerUser: 10
});

export default notifications;
