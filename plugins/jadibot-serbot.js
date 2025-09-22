/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                         𒁈 AVENIX-MULTI V2.0.0 𒁈                          ┃
 * ┃                        SISTEMA DE JADIBOT AVANZADO                        ┃
 * ┃                         Creado por: Hepein Oficial                        ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import { useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, fetchLatestBaileysVersion } from "@whiskeysockets/baileys";
import qrcode from "qrcode";
import NodeCache from "node-cache";
import fs from "fs";
import path from "path";
import pino from 'pino';
import chalk from 'chalk';
import { makeWASocket } from '../lib/simple.js';
import { fileURLToPath } from 'url';
import EventEmitter from 'events';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ═══════════════════════════════════════════════════════════════════════════════
// │                        CONFIGURACIÓN DEL SISTEMA                           │
// ═══════════════════════════════════════════════════════════════════════════════

const JADIBOT_CONFIG = {
    MAX_SUBBOTS: 50,                    // Límite de sub-bots simultáneos
    MAX_SUBBOTS_PER_USER: 3,            // Límite por usuario
    SESSION_TIMEOUT: 300000,            // 5 minutos timeout para QR
    COOLDOWN_TIME: 120000,              // 2 minutos entre conexiones
    CLEANUP_INTERVAL: 60000,            // Limpieza cada minuto
    RECONNECT_ATTEMPTS: 3,              // Intentos de reconexión
    HEALTH_CHECK_INTERVAL: 30000,       // Verificación de salud cada 30s
    AUTO_RESTART_TIMEOUT: 10000         // Auto-restart después de 10s
};

const JADIBOT_MESSAGES = {
    qr: `╭━═▣ 𒁈 𝗔𝘃𝗲𝗻𝗶𝘅-𝗠𝘂𝗹𝘁𝗶 𝗦𝘂𝗯-𝗕𝗼𝘁 ▣═━╮
┃ 📱 *CONEXIÓN MEDIANTE QR*
┃ 
┃ 🔗 Escanea el código QR para conectarte
┃ como Sub-Bot temporal de Avenix-Multi
┃ 
┃ 📋 *Pasos:*
┃ • Abre WhatsApp Web o Desktop
┃ • Ve a "Dispositivos vinculados"  
┃ • Escanea el código QR mostrado
┃ 
┃ ⏳ *Código válido por 5 minutos*
┃ 🔒 *Conexión segura y encriptada*
╰━═▣ 𒁈 *Hepein Oficial* 𒁈 ▣═━╯`,

    code: `╭━═▣ 𒁈 𝗔𝘃𝗲𝗻𝗶𝘅-𝗠𝘂𝗹𝘁𝗶 𝗦𝘂𝗯-𝗕𝗼𝘁 ▣═━╮
┃ 📲 *CONEXIÓN CON CÓDIGO*
┃ 
┃ 🔐 Usa el código de emparejamiento
┃ para conectarte como Sub-Bot
┃ 
┃ 📋 *Pasos:*
┃ • Abre WhatsApp en tu dispositivo
┃ • Ve a "Dispositivos vinculados"
┃ • Selecciona "Vincular con código"
┃ • Ingresa el código mostrado abajo
┃ 
┃ ⚠️ *Importante:* Cierra otras sesiones
┃ activas para evitar conflictos
╰━═▣ 𒁈 *Avenix-Multi* 𒁈 ▣═━╯`,

    connected: `🎉 *¡SUB-BOT CONECTADO EXITOSAMENTE!* 𒁈

👋 Bienvenido @user a la red Avenix-Multi
🤖 Tu Sub-Bot está activo y funcional
📊 Procesando mensajes automáticamente

💡 *Comandos disponibles:*
• .menu - Ver lista completa
• .ping - Verificar conexión  
• .info - Información del sub-bot

𒁈 *Disfruta tu experiencia con Avenix-Multi*`,

    disconnected: `⚠️ *SUB-BOT DESCONECTADO* 𒁈

📱 Tu conexión como Sub-Bot ha terminado
🔄 Puedes reconectarte usando .serbot
⏰ Tiempo de sesión: {duration}

¡Gracias por usar Avenix-Multi!`
};

// ═══════════════════════════════════════════════════════════════════════════════
// │                       CLASE PRINCIPAL JADIBOT                              │
// ═══════════════════════════════════════════════════════════════════════════════

class AvenixJadiBotManager extends EventEmitter {
    constructor() {
        super();
        this.activeSessions = new Map();
        this.userSessions = new Map();
        this.qrCodes = new Map();
        this.cooldowns = new Map();
        this.healthChecks = new Map();
        this.sessionStats = {
            totalCreated: 0,
            totalConnected: 0,
            totalDisconnected: 0,
            activeCount: 0
        };
        
        this.startHealthMonitor();
        this.startCleanupService();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // │                      VALIDACIONES Y VERIFICACIONES                     │
    // ═══════════════════════════════════════════════════════════════════════════

    validateUser(userId) {
        const now = Date.now();
        const userCooldown = this.cooldowns.get(userId) || 0;
        
        if (now - userCooldown < JADIBOT_CONFIG.COOLDOWN_TIME) {
            const remaining = JADIBOT_CONFIG.COOLDOWN_TIME - (now - userCooldown);
            return {
                valid: false,
                reason: 'cooldown',
                remaining: Math.ceil(remaining / 1000)
            };
        }

        const userSessionCount = this.userSessions.get(userId)?.length || 0;
        if (userSessionCount >= JADIBOT_CONFIG.MAX_SUBBOTS_PER_USER) {
            return {
                valid: false,
                reason: 'user_limit',
                current: userSessionCount,
                max: JADIBOT_CONFIG.MAX_SUBBOTS_PER_USER
            };
        }

        if (this.activeSessions.size >= JADIBOT_CONFIG.MAX_SUBBOTS) {
            return {
                valid: false,
                reason: 'global_limit',
                current: this.activeSessions.size,
                max: JADIBOT_CONFIG.MAX_SUBBOTS
            };
        }

        return { valid: true };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // │                        CREACIÓN DE SESIÓN                              │
    // ═══════════════════════════════════════════════════════════════════════════

    async createSession(options) {
        const { userId, conn, m, args, usedPrefix, command } = options;
        const sessionId = `${userId}_${Date.now()}`;
        
        // Validar usuario
        const validation = this.validateUser(userId);
        if (!validation.valid) {
            return this.handleValidationError(validation, conn, m);
        }

        // Configurar método de conexión
        const useCode = args.includes('code') || command === 'code';
        const pathJadiBot = path.join('./AvenixJadiBot', userId);
        
        // Crear directorio de sesión
        if (!fs.existsSync(pathJadiBot)) {
            fs.mkdirSync(pathJadiBot, { recursive: true });
        }

        // Procesar credenciales si se proporcionan
        if (args[0] && !args.includes('code')) {
            try {
                const credentials = JSON.parse(Buffer.from(args[0], "base64").toString("utf-8"));
                fs.writeFileSync(
                    path.join(pathJadiBot, "creds.json"),
                    JSON.stringify(credentials, null, 2)
                );
            } catch (error) {
                return conn.reply(m.chat, `❌ Credenciales inválidas. Usa: ${usedPrefix}${command} code`, m);
            }
        }

        // Crear instancia de JadiBot
        const session = new AvenixJadiBotSession({
            sessionId,
            userId,
            pathJadiBot,
            useCode,
            parentConn: conn,
            message: m,
            manager: this
        });

        // Registrar sesión
        this.activeSessions.set(sessionId, session);
        this.updateUserSessions(userId, sessionId, 'add');
        this.cooldowns.set(userId, Date.now());
        this.sessionStats.totalCreated++;

        // Iniciar sesión
        try {
            await session.initialize();
            this.emit('sessionCreated', { sessionId, userId });
            return session;
        } catch (error) {
            this.removeSession(sessionId);
            throw error;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // │                     MANEJO DE ERRORES DE VALIDACIÓN                    │
    // ═══════════════════════════════════════════════════════════════════════════

    async handleValidationError(validation, conn, m) {
        let message;
        
        switch (validation.reason) {
            case 'cooldown':
                message = `⏳ *Cooldown Activo*\n\nDebe esperar ${validation.remaining}s antes de crear otro Sub-Bot.`;
                break;
            
            case 'user_limit':
                message = `🚫 *Límite de Usuario Alcanzado*\n\nTienes ${validation.current}/${validation.max} Sub-Bots activos.\nCierra uno existente para crear otro.`;
                break;
            
            case 'global_limit':
                message = `🚫 *Límite Global Alcanzado*\n\nHay ${validation.current}/${validation.max} Sub-Bots activos.\nIntenta más tarde.`;
                break;
            
            default:
                message = `❌ *Error de Validación*\n\nNo se pudo crear el Sub-Bot.`;
        }

        return conn.reply(m.chat, message, m);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // │                       GESTIÓN DE SESIONES                              │
    // ═══════════════════════════════════════════════════════════════════════════

    updateUserSessions(userId, sessionId, action) {
        if (!this.userSessions.has(userId)) {
            this.userSessions.set(userId, []);
        }

        const sessions = this.userSessions.get(userId);
        
        if (action === 'add') {
            sessions.push(sessionId);
        } else if (action === 'remove') {
            const index = sessions.indexOf(sessionId);
            if (index > -1) sessions.splice(index, 1);
            
            if (sessions.length === 0) {
                this.userSessions.delete(userId);
            }
        }
    }

    removeSession(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session) return;

        const userId = session.userId;
        
        // Limpiar recursos
        session.cleanup();
        this.activeSessions.delete(sessionId);
        this.updateUserSessions(userId, sessionId, 'remove');
        this.healthChecks.delete(sessionId);
        
        this.sessionStats.totalDisconnected++;
        this.sessionStats.activeCount = this.activeSessions.size;
        
        this.emit('sessionRemoved', { sessionId, userId });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // │                        MONITOREO DE SALUD                              │
    // ═══════════════════════════════════════════════════════════════════════════

    startHealthMonitor() {
        setInterval(() => {
            for (const [sessionId, session] of this.activeSessions) {
                if (!session.isHealthy()) {
                    console.log(chalk.yellow(`⚠️ Sesión no saludable detectada: ${sessionId}`));
                    this.removeSession(sessionId);
                }
            }
        }, JADIBOT_CONFIG.HEALTH_CHECK_INTERVAL);
    }

    startCleanupService() {
        setInterval(() => {
            // Limpiar QR codes expirados
            const now = Date.now();
            for (const [sessionId, qrData] of this.qrCodes) {
                if (now - qrData.created > JADIBOT_CONFIG.SESSION_TIMEOUT) {
                    this.qrCodes.delete(sessionId);
                }
            }

            // Limpiar cooldowns expirados
            for (const [userId, time] of this.cooldowns) {
                if (now - time > JADIBOT_CONFIG.COOLDOWN_TIME * 2) {
                    this.cooldowns.delete(userId);
                }
            }
        }, JADIBOT_CONFIG.CLEANUP_INTERVAL);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // │                         ESTADÍSTICAS                                   │
    // ═══════════════════════════════════════════════════════════════════════════

    getStats() {
        return {
            ...this.sessionStats,
            activeCount: this.activeSessions.size,
            activeUsers: this.userSessions.size,
            avgSessionsPerUser: this.userSessions.size > 0 ? 
                Array.from(this.userSessions.values()).reduce((sum, sessions) => sum + sessions.length, 0) / this.userSessions.size : 0
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                         CLASE SESIÓN INDIVIDUAL                            │
// ═══════════════════════════════════════════════════════════════════════════════

class AvenixJadiBotSession extends EventEmitter {
    constructor(options) {
        super();
        this.sessionId = options.sessionId;
        this.userId = options.userId;
        this.pathJadiBot = options.pathJadiBot;
        this.useCode = options.useCode;
        this.parentConn = options.parentConn;
        this.message = options.message;
        this.manager = options.manager;
        
        this.sock = null;
        this.isConnected = false;
        this.connectionAttempts = 0;
        this.createdAt = Date.now();
        this.lastActivity = Date.now();
        this.qrMessage = null;
        this.codeMessage = null;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // │                         INICIALIZACIÓN                                 │
    // ═══════════════════════════════════════════════════════════════════════════

    async initialize() {
        try {
            const { version } = await fetchLatestBaileysVersion();
            const { state, saveState, saveCreds } = await useMultiFileAuthState(this.pathJadiBot);
            
            const connectionOptions = {
                logger: pino({ level: "silent" }),
                printQRInTerminal: false,
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
                },
                msgRetryCache: new NodeCache(),
                browser: this.useCode ? 
                    ['Avenix-Multi SubBot', 'Chrome', '120.0.0'] : 
                    ['Avenix-Multi SubBot', 'Safari', '15.0'],
                version,
                generateHighQualityLinkPreview: true,
                markOnlineOnConnect: false
            };

            this.sock = makeWASocket(connectionOptions);
            this.sock.isInit = false;
            this.saveCreds = saveCreds;
            
            this.setupEventHandlers();
            
            console.log(chalk.cyan(`🔄 Iniciando sesión JadiBot: ${this.sessionId}`));
            
        } catch (error) {
            console.error(chalk.red(`❌ Error inicializando sesión ${this.sessionId}:`, error));
            throw error;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // │                      CONFIGURACIÓN DE EVENTOS                          │
    // ═══════════════════════════════════════════════════════════════════════════

    setupEventHandlers() {
        this.sock.ev.on('connection.update', this.handleConnectionUpdate.bind(this));
        this.sock.ev.on('creds.update', this.saveCreds.bind(this.sock, true));
        this.sock.ev.on('messages.upsert', this.handleMessages.bind(this));
    }

    async handleConnectionUpdate(update) {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr && !this.useCode) {
            await this.handleQRCode(qr);
        }
        
        if (qr && this.useCode) {
            await this.handlePairingCode();
        }
        
        if (connection === 'open') {
            await this.handleConnectionSuccess();
        }
        
        if (connection === 'close') {
            await this.handleConnectionClose(lastDisconnect);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // │                       MANEJO DE QR Y CÓDIGOS                           │
    // ═══════════════════════════════════════════════════════════════════════════

    async handleQRCode(qr) {
        try {
            const qrBuffer = await qrcode.toBuffer(qr, { scale: 8 });
            
            if (this.qrMessage) {
                await this.parentConn.sendMessage(this.message.chat, { delete: this.qrMessage.key });
            }
            
            this.qrMessage = await this.parentConn.sendMessage(this.message.chat, {
                image: qrBuffer,
                caption: JADIBOT_MESSAGES.qr
            }, { quoted: this.message });

            // Auto-eliminar QR después de timeout
            setTimeout(async () => {
                if (this.qrMessage && !this.isConnected) {
                    await this.parentConn.sendMessage(this.message.chat, { delete: this.qrMessage.key });
                    this.qrMessage = null;
                }
            }, JADIBOT_CONFIG.SESSION_TIMEOUT);

        } catch (error) {
            console.error(chalk.red(`❌ Error manejando QR para ${this.sessionId}:`, error));
        }
    }

    async handlePairingCode() {
        try {
            const pairingCode = await this.sock.requestPairingCode(this.userId.split('@')[0]);
            const formattedCode = pairingCode.match(/.{1,4}/g)?.join("-") || pairingCode;
            
            // Enviar mensaje de instrucciones
            const instructionMessage = await this.parentConn.sendMessage(this.message.chat, {
                image: { url: global.imagen1 || 'https://i.imgur.com/placeholder.jpg' },
                caption: JADIBOT_MESSAGES.code
            }, { quoted: this.message });
            
            // Enviar código
            this.codeMessage = await this.parentConn.reply(this.message.chat, 
                `🔐 *Código de Emparejamiento:*\n\n\`${formattedCode}\`\n\n⏳ *Válido por 60 segundos*`, 
                this.message
            );

            // Auto-eliminar después de timeout
            setTimeout(async () => {
                if (instructionMessage && !this.isConnected) {
                    await this.parentConn.sendMessage(this.message.chat, { delete: instructionMessage.key });
                }
                if (this.codeMessage && !this.isConnected) {
                    await this.parentConn.sendMessage(this.message.chat, { delete: this.codeMessage.key });
                    this.codeMessage = null;
                }
            }, 60000);

            console.log(chalk.blue(`🔐 Código de emparejamiento para ${this.userId}: ${formattedCode}`));

        } catch (error) {
            console.error(chalk.red(`❌ Error generando código para ${this.sessionId}:`, error));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // │                    MANEJO DE CONEXIÓN EXITOSA                          │
    // ═══════════════════════════════════════════════════════════════════════════

    async handleConnectionSuccess() {
        this.isConnected = true;
        this.sock.isInit = true;
        this.lastActivity = Date.now();
        
        // Limpiar mensajes de QR/código
        if (this.qrMessage) {
            await this.parentConn.sendMessage(this.message.chat, { delete: this.qrMessage.key });
            this.qrMessage = null;
        }
        if (this.codeMessage) {
            await this.parentConn.sendMessage(this.message.chat, { delete: this.codeMessage.key });
            this.codeMessage = null;
        }
        
        // Agregar a conexiones globales
        if (!global.conns) global.conns = [];
        global.conns.push(this.sock);
        
        // Unirse a canales oficiales
        await this.joinChannels();
        
        // Obtener información del usuario
        const userName = this.sock.authState.creds.me?.name || 'Usuario Anónimo';
        const userJid = this.sock.authState.creds.me?.jid || this.userId;
        
        // Actualizar estadísticas
        this.manager.sessionStats.totalConnected++;
        this.manager.sessionStats.activeCount = this.manager.activeSessions.size;
        
        // Log de conexión exitosa
        console.log(chalk.green(`✅ SubBot conectado: ${userName} (+${this.userId.split('@')[0]})`));
        
        // Enviar mensaje de bienvenida
        const welcomeMessage = JADIBOT_MESSAGES.connected.replace('@user', `@${this.userId.split('@')[0]}`);
        await this.parentConn.sendMessage(this.message.chat, {
            text: welcomeMessage,
            mentions: [this.userId]
        }, { quoted: this.message });
        
        // Configurar handler de mensajes
        await this.setupMessageHandler();
        
        this.emit('connected', { sessionId: this.sessionId, userId: this.userId });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // │                      CONFIGURACIÓN DEL HANDLER                         │
    // ═══════════════════════════════════════════════════════════════════════════

    async setupMessageHandler() {
        try {
            const handler = await import('../handler.js');
            
            this.sock.handler = handler.handler.bind(this.sock);
            this.sock.participantsUpdate = handler.participantsUpdate?.bind(this.sock);
            this.sock.groupsUpdate = handler.groupsUpdate?.bind(this.sock);
            this.sock.onDelete = handler.deleteUpdate?.bind(this.sock);
            this.sock.onCall = handler.callUpdate?.bind(this.sock);
            
            this.sock.ev.on("messages.upsert", this.sock.handler);
            if (this.sock.participantsUpdate) this.sock.ev.on("group-participants.update", this.sock.participantsUpdate);
            if (this.sock.groupsUpdate) this.sock.ev.on("groups.update", this.sock.groupsUpdate);
            if (this.sock.onDelete) this.sock.ev.on("message.delete", this.sock.onDelete);
            if (this.sock.onCall) this.sock.ev.on("call", this.sock.onCall);
            
            console.log(chalk.cyan(`🔧 Handler configurado para sesión: ${this.sessionId}`));
            
        } catch (error) {
            console.error(chalk.red(`❌ Error configurando handler para ${this.sessionId}:`, error));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // │                      MANEJO DE DESCONEXIÓN                             │
    // ═══════════════════════════════════════════════════════════════════════════

    async handleConnectionClose(lastDisconnect) {
        const reason = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode;
        const sessionName = this.userId.split('@')[0];
        
        console.log(chalk.yellow(`⚠️ Conexión cerrada para ${sessionName}: ${reason}`));
        
        switch (reason) {
            case DisconnectReason.badSession:
                console.log(chalk.red(`❌ Sesión corrupta para ${sessionName}, eliminando...`));
                this.cleanup();
                this.manager.removeSession(this.sessionId);
                break;
                
            case DisconnectReason.connectionClosed:
            case DisconnectReason.connectionLost:
            case DisconnectReason.timedOut:
                if (this.connectionAttempts < JADIBOT_CONFIG.RECONNECT_ATTEMPTS) {
                    console.log(chalk.yellow(`🔄 Intentando reconectar ${sessionName} (${this.connectionAttempts + 1}/${JADIBOT_CONFIG.RECONNECT_ATTEMPTS})`));
                    this.connectionAttempts++;
                    setTimeout(() => this.initialize(), JADIBOT_CONFIG.AUTO_RESTART_TIMEOUT);
                } else {
                    console.log(chalk.red(`❌ Máximos intentos alcanzados para ${sessionName}`));
                    this.manager.removeSession(this.sessionId);
                }
                break;
                
            case DisconnectReason.connectionReplaced:
                console.log(chalk.magenta(`🔄 Conexión reemplazada para ${sessionName}`));
                await this.notifyUser('Conexión reemplazada por otra sesión activa.');
                this.manager.removeSession(this.sessionId);
                break;
                
            case DisconnectReason.loggedOut:
                console.log(chalk.red(`🚪 Usuario desconectado ${sessionName}`));
                await this.notifyUser('Sesión cerrada manualmente.');
                this.cleanup();
                this.manager.removeSession(this.sessionId);
                break;
                
            case DisconnectReason.restartRequired:
                console.log(chalk.blue(`🔄 Reinicio requerido para ${sessionName}`));
                setTimeout(() => this.initialize(), JADIBOT_CONFIG.AUTO_RESTART_TIMEOUT);
                break;
                
            default:
                console.log(chalk.red(`❓ Desconexión desconocida para ${sessionName}: ${reason}`));
                this.manager.removeSession(this.sessionId);
                break;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // │                         FUNCIONES AUXILIARES                           │
    // ═══════════════════════════════════════════════════════════════════════════

    async joinChannels() {
        if (!global.ch) return;
        
        try {
            for (const channelId of Object.values(global.ch)) {
                await this.sock.newsletterFollow(channelId).catch(() => {});
                await new Promise(resolve => setTimeout(resolve, 1000)); // Delay entre canales
            }
            console.log(chalk.green(`📢 Unido a canales oficiales: ${this.sessionId}`));
        } catch (error) {
            console.warn(chalk.yellow(`⚠️ Error uniéndose a canales: ${error.message}`));
        }
    }

    async notifyUser(message) {
        try {
            const fullMessage = `🤖 *Notificación SubBot* 𒁈\n\n${message}\n\n_${new Date().toLocaleString()}_`;
            await this.parentConn.sendMessage(this.userId, { text: fullMessage });
        } catch (error) {
            console.warn(chalk.yellow(`⚠️ No se pudo notificar al usuario ${this.userId}`));
        }
    }

    handleMessages(chatUpdate) {
        this.lastActivity = Date.now();
    }

    isHealthy() {
        const now = Date.now();
        const maxInactivity = 600000; // 10 minutos
        
        return (
            this.sock &&
            this.sock.user &&
            this.sock.ws?.socket &&
            this.sock.ws.socket.readyState === 1 &&
            (now - this.lastActivity) < maxInactivity
        );
    }

    cleanup() {
        try {
            if (this.sock) {
                this.sock.ws?.close();
                this.sock.ev?.removeAllListeners();
            }
            
            // Remover de conexiones globales
            if (global.conns) {
                const index = global.conns.indexOf(this.sock);
                if (index > -1) {
                    global.conns.splice(index, 1);
                }
            }
            
            this.isConnected = false;
            console.log(chalk.gray(`🧹 Limpieza completada para sesión: ${this.sessionId}`));
            
        } catch (error) {
            console.warn(chalk.yellow(`⚠️ Error durante limpieza: ${error.message}`));
        }
    }

    getDuration() {
        return Date.now() - this.createdAt;
    }

    getInfo() {
        return {
            sessionId: this.sessionId,
            userId: this.userId,
            isConnected: this.isConnected,
            duration: this.getDuration(),
            lastActivity: this.lastActivity,
            connectionAttempts: this.connectionAttempts,
            isHealthy: this.isHealthy()
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                        INSTANCIA GLOBAL DEL MANAGER                        │
// ═══════════════════════════════════════════════════════════════════════════════

const jadiBotManager = new AvenixJadiBotManager();

// ═══════════════════════════════════════════════════════════════════════════════
// │                        FUNCIÓN PRINCIPAL PARA EXPORT                       │
// ═══════════════════════════════════════════════════════════════════════════════

export async function AvenixJadiBot(options) {
    try {
        const session = await jadiBotManager.createSession(options);
        return session;
    } catch (error) {
        console.error(chalk.red(`❌ Error creando JadiBot:`, error));
        throw error;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                          COMANDO PRINCIPAL                                 │
// ═══════════════════════════════════════════════════════════════════════════════

const handler = async (m, { conn, args, usedPrefix, command, isOwner }) => {
    // Verificar si JadiBot está habilitado
    if (!global.db.data.settings[conn.user.jid]?.jadibotmd) {
        return m.reply(`🚫 *Sistema JadiBot Deshabilitado*\n\nEsta funcionalidad está temporalmente desactivada.\nContacta al propietario para más información.`);
    }

    const userId = m.sender;
    
    try {
        await AvenixJadiBot({
            userId,
            conn,
            m,
            args,
            usedPrefix,
            command
        });
        
    } catch (error) {
        console.error(chalk.red(`❌ Error en comando JadiBot:`, error));
        m.reply(`❌ *Error creando SubBot*\n\nOcurrió un error inesperado. Inténtalo nuevamente en unos minutos.`);
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// │                         COMANDOS ADICIONALES                               │
// ═══════════════════════════════════════════════════════════════════════════════

export const jadibotStats = async (m, { conn }) => {
    const stats = jadiBotManager.getStats();
    const activeSessions = Array.from(jadiBotManager.activeSessions.values())
        .map(session => session.getInfo());
    
    let message = `📊 *ESTADÍSTICAS JADIBOT* 𒁈\n\n`;
    message += `👥 *SubBots Activos:* ${stats.activeCount}\n`;
    message += `📈 *Total Creados:* ${stats.totalCreated}\n`;
    message += `✅ *Total Conectados:* ${stats.totalConnected}\n`;
    message += `📱 *Usuarios Activos:* ${stats.activeUsers}\n`;
    message += `📊 *Promedio por Usuario:* ${stats.avgSessionsPerUser.toFixed(1)}\n\n`;
    
    if (activeSessions.length > 0) {
        message += `🔗 *Sesiones Activas:*\n`;
        activeSessions.forEach((session, index) => {
            const duration = Math.floor(session.duration / 60000);
            const health = session.isHealthy ? '🟢' : '🔴';
            message += `${index + 1}. ${health} +${session.userId.split('@')[0]} (${duration}m)\n`;
        });
    }
    
    message += `\n𒁈 *Avenix-Multi JadiBot System*`;
    
    await conn.reply(m.chat, message, m);
};

// ═══════════════════════════════════════════════════════════════════════════════
// │                        EXPORTACIONES Y CONFIGURACIÓN                       │
// ═══════════════════════════════════════════════════════════════════════════════

handler.help = ['serbot', 'subbot', 'jadibot', 'code'];
handler.tags = ['jadibot'];
handler.command = ['serbot', 'subbot', 'jadibot', 'code'];
handler.register = true;

export default handler;

// Exportar manager para uso en otros módulos
export { jadiBotManager };

// ═══════════════════════════════════════════════════════════════════════════════
// │                         MANEJO DE CIERRE GRACEFUL                          │
// ═══════════════════════════════════════════════════════════════════════════════

process.on('SIGINT', async () => {
    console.log(chalk.yellow('\n🛑 Cerrando JadiBot Manager...'));
    
    for (const [sessionId, session] of jadiBotManager.activeSessions) {
        console.log(chalk.blue(`🔄 Cerrando sesión: ${sessionId}`));
        session.cleanup();
    }
    
    console.log(chalk.green('✅ JadiBot Manager cerrado correctamente'));
});

process.on('SIGTERM', async () => {
    console.log(chalk.yellow('\n🛑 SIGTERM recibido, cerrando JadiBot Manager...'));
    
    for (const [sessionId, session] of jadiBotManager.activeSessions) {
        session.cleanup();
    }
});
