/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                     𒁈 AVENIX-MULTI V2.0.0 - SECURITY.JS 𒁈               ┃
 * ┃                        Sistema de Seguridad y Validación                   ┃
 * ┃                         Creado por: Hepein Oficial                         ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import crypto from 'crypto';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';
import { EventEmitter } from 'events';
import chalk from 'chalk';
import validator from 'validator';

// ═══════════════════════════════════════════════════════════════════════════════
// │                        CLASE PRINCIPAL DE SEGURIDAD                        │
// ═══════════════════════════════════════════════════════════════════════════════

export class SecurityManager extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Rate limiting
            maxRequestsPerMinute: config.maxRequestsPerMinute || 20,
            maxRequestsPerHour: config.maxRequestsPerHour || 100,
            banDuration: config.banDuration || 3600000, // 1 hora
            
            // Validación
            maxMessageLength: config.maxMessageLength || 4000,
            maxFileSize: config.maxFileSize || 50 * 1024 * 1024, // 50MB
            allowedMimeTypes: config.allowedMimeTypes || [
                'image/jpeg', 'image/png', 'image/gif', 'image/webp',
                'video/mp4', 'video/webm', 'video/ogg',
                'audio/mpeg', 'audio/wav', 'audio/ogg',
                'application/pdf', 'text/plain'
            ],
            
            // Encriptación
            saltRounds: config.saltRounds || 12,
            secretKey: config.secretKey || process.env.SECRET_KEY || 'avenix-default-key',
            
            // Anti-spam
            spamThreshold: config.spamThreshold || 5,
            spamTimeWindow: config.spamTimeWindow || 60000, // 1 minuto
            
            ...config
        };
        
        this.rateLimiters = new Map();
        this.bannedUsers = new Map();
        this.suspiciousActivity = new Map();
        this.userRequests = new Map();
        this.lastCleanup = Date.now();
        
        this.setupCleanupInterval();
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                           RATE LIMITING                                │
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Verificar límite de velocidad para un usuario
     */
    checkRateLimit(userId, action = 'default') {
        const key = `${userId}:${action}`;
        const now = Date.now();
        
        if (!this.userRequests.has(key)) {
            this.userRequests.set(key, []);
        }
        
        const requests = this.userRequests.get(key);
        
        // Limpiar requests antiguos (última hora)
        const oneHourAgo = now - 3600000;
        const recentRequests = requests.filter(time => time > oneHourAgo);
        this.userRequests.set(key, recentRequests);
        
        // Verificar límites
        const lastMinuteRequests = recentRequests.filter(time => time > now - 60000);
        const lastHourRequests = recentRequests.length;
        
        if (lastMinuteRequests.length >= this.config.maxRequestsPerMinute) {
            this.emit('rateLimitExceeded', { userId, action, type: 'minute' });
            return {
                allowed: false,
                reason: 'Too many requests per minute',
                resetTime: Math.min(...lastMinuteRequests) + 60000
            };
        }
        
        if (lastHourRequests >= this.config.maxRequestsPerHour) {
            this.emit('rateLimitExceeded', { userId, action, type: 'hour' });
            return {
                allowed: false,
                reason: 'Too many requests per hour',
                resetTime: Math.min(...recentRequests) + 3600000
            };
        }
        
        // Registrar request
        recentRequests.push(now);
        this.userRequests.set(key, recentRequests);
        
        return { allowed: true };
    }
    
    /**
     * Banear usuario temporalmente
     */
    banUser(userId, reason = 'Security violation', duration = null) {
        const banDuration = duration || this.config.banDuration;
        const banUntil = Date.now() + banDuration;
        
        this.bannedUsers.set(userId, {
            reason,
            bannedAt: Date.now(),
            banUntil,
            duration: banDuration
        });
        
        console.log(chalk.red(`𒁈 Usuario baneado: ${userId} - Razón: ${reason}`));
        this.emit('userBanned', { userId, reason, banUntil });
        
        return { success: true, banUntil };
    }
    
    /**
     * Verificar si un usuario está baneado
     */
    isUserBanned(userId) {
        const ban = this.bannedUsers.get(userId);
        
        if (!ban) return false;
        
        if (Date.now() > ban.banUntil) {
            this.bannedUsers.delete(userId);
            this.emit('userUnbanned', { userId });
            return false;
        }
        
        return ban;
    }
    
    /**
     * Desbanear usuario
     */
    unbanUser(userId) {
        if (this.bannedUsers.has(userId)) {
            this.bannedUsers.delete(userId);
            this.emit('userUnbanned', { userId });
            return true;
        }
        return false;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                         VALIDACIÓN DE ENTRADA                          │
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Sanitizar texto de entrada
     */
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        
        // Remover caracteres peligrosos
        return input
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .replace(/data:(?!image\/)/gi, '')
            .trim();
    }
    
    /**
     * Validar mensaje de texto
     */
    validateMessage(message) {
        const errors = [];
        
        if (!message || typeof message !== 'string') {
            errors.push('Mensaje debe ser una cadena de texto');
            return { valid: false, errors };
        }
        
        // Longitud
        if (message.length > this.config.maxMessageLength) {
            errors.push(`Mensaje muy largo (máximo ${this.config.maxMessageLength} caracteres)`);
        }
        
        // Patrones sospechosos
        const suspiciousPatterns = [
            /javascript:/i,
            /<script/i,
            /eval\(/i,
            /document\./i,
            /window\./i,
            /\.innerHTML/i,
            /base64,/i,
            /data:(?!image\/)/i
        ];
        
        for (const pattern of suspiciousPatterns) {
            if (pattern.test(message)) {
                errors.push('Contenido potencialmente malicioso detectado');
                this.emit('suspiciousInput', { message, pattern: pattern.toString() });
                break;
            }
        }
        
        // Spam detection (mensajes repetitivos)
        if (this.isSpamMessage(message)) {
            errors.push('Mensaje detectado como spam');
        }
        
        return { valid: errors.length === 0, errors };
    }
    
    /**
     * Validar archivo
     */
    validateFile(fileInfo) {
        const errors = [];
        
        if (!fileInfo || typeof fileInfo !== 'object') {
            errors.push('Información de archivo inválida');
            return { valid: false, errors };
        }
        
        // Verificar tamaño
        if (fileInfo.size > this.config.maxFileSize) {
            errors.push(`Archivo muy grande (máximo ${this.config.maxFileSize / 1024 / 1024}MB)`);
        }
        
        // Verificar tipo MIME
        if (fileInfo.mimetype && !this.config.allowedMimeTypes.includes(fileInfo.mimetype)) {
            errors.push(`Tipo de archivo no permitido: ${fileInfo.mimetype}`);
        }
        
        // Verificar extensión
        if (fileInfo.filename) {
            const ext = fileInfo.filename.split('.').pop().toLowerCase();
            const dangerousExtensions = ['exe', 'bat', 'cmd', 'scr', 'com', 'pif', 'js', 'jar'];
            
            if (dangerousExtensions.includes(ext)) {
                errors.push(`Extensión de archivo peligrosa: .${ext}`);
            }
        }
        
        return { valid: errors.length === 0, errors };
    }
    
    /**
     * Validar comando
     */
    validateCommand(command, args, user) {
        const errors = [];
        
        // Validar comando
        if (!command || typeof command !== 'string') {
            errors.push('Comando inválido');
            return { valid: false, errors };
        }
        
        // Verificar caracteres peligrosos en comando
        if (/[;&|`$()]/.test(command)) {
            errors.push('Comando contiene caracteres peligrosos');
        }
        
        // Verificar argumentos
        if (args && Array.isArray(args)) {
            for (const arg of args) {
                if (typeof arg === 'string' && /[;&|`$()]/.test(arg)) {
                    errors.push('Argumentos contienen caracteres peligrosos');
                    break;
                }
            }
        }
        
        // Verificar permisos de usuario
        if (user && this.isUserBanned(user.id)) {
            errors.push('Usuario baneado');
        }
        
        return { valid: errors.length === 0, errors };
    }
    
    /**
     * Detectar spam
     */
    isSpamMessage(message) {
        // Simplificado - en implementación real usarías ML o algoritmos más sofisticados
        const spamIndicators = [
            /(.)\1{10,}/, // Caracteres repetidos
            /https?:\/\/[^\s]+/g, // Múltiples URLs
            /\b(gratis|free|click|aquí|here)\b/gi, // Palabras spam comunes
            /[A-Z]{10,}/, // Texto en mayúsculas
            /(\d{10,})/, // Números largos (posibles números de teléfono)
        ];
        
        let spamScore = 0;
        
        for (const indicator of spamIndicators) {
            if (indicator.test(message)) {
                spamScore++;
            }
        }
        
        return spamScore >= 2;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                           ENCRIPTACIÓN                                 │
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Encriptar datos sensibles
     */
    encrypt(data) {
        try {
            const algorithm = 'aes-256-gcm';
            const key = crypto.scryptSync(this.config.secretKey, 'salt', 32);
            const iv = crypto.randomBytes(16);
            
            const cipher = crypto.createCipher(algorithm, key);
            cipher.setAAD(Buffer.from('avenix-multi', 'utf8'));
            
            let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            const authTag = cipher.getAuthTag();
            
            return {
                encrypted,
                iv: iv.toString('hex'),
                authTag: authTag.toString('hex')
            };
            
        } catch (error) {
            console.error(chalk.red('𒁈 Error encriptando datos:'), error.message);
            throw error;
        }
    }
    
    /**
     * Desencriptar datos
     */
    decrypt(encryptedData) {
        try {
            const algorithm = 'aes-256-gcm';
            const key = crypto.scryptSync(this.config.secretKey, 'salt', 32);
            
            const decipher = crypto.createDecipher(algorithm, key);
            decipher.setAAD(Buffer.from('avenix-multi', 'utf8'));
            decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
            
            let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return JSON.parse(decrypted);
            
        } catch (error) {
            console.error(chalk.red('𒁈 Error desencriptando datos:'), error.message);
            throw error;
        }
    }
    
    /**
     * Hash de contraseña
     */
    async hashPassword(password) {
        return await bcrypt.hash(password, this.config.saltRounds);
    }
    
    /**
     * Verificar contraseña
     */
    async verifyPassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }
    
    /**
     * Generar token seguro
     */
    generateSecureToken(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }
    
    /**
     * Generar hash de archivo
     */
    generateFileHash(buffer) {
        return crypto.createHash('sha256').update(buffer).digest('hex');
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                       DETECCIÓN DE AMENAZAS                            │
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Analizar actividad sospechosa
     */
    analyzeSuspiciousActivity(userId, activity) {
        const key = userId;
        
        if (!this.suspiciousActivity.has(key)) {
            this.suspiciousActivity.set(key, {
                activities: [],
                score: 0,
                lastUpdate: Date.now()
            });
        }
        
        const userActivity = this.suspiciousActivity.get(key);
        userActivity.activities.push({
            type: activity.type,
            timestamp: Date.now(),
            details: activity.details
        });
        
        // Calcular score de riesgo
        let riskScore = 0;
        
        switch (activity.type) {
            case 'rapid_commands':
                riskScore = 2;
                break;
            case 'suspicious_input':
                riskScore = 5;
                break;
            case 'file_upload_spam':
                riskScore = 3;
                break;
            case 'rate_limit_exceeded':
                riskScore = 4;
                break;
            default:
                riskScore = 1;
        }
        
        userActivity.score += riskScore;
        userActivity.lastUpdate = Date.now();
        
        // Acciones automáticas basadas en score
        if (userActivity.score >= 15) {
            this.banUser(userId, 'Actividad sospechosa automatizada', 3600000); // 1 hora
            this.emit('automaticBan', { userId, score: userActivity.score });
        } else if (userActivity.score >= 10) {
            this.emit('highRiskUser', { userId, score: userActivity.score });
        }
        
        return userActivity;
    }
    
    /**
     * Verificar IP sospechosa (para implementación futura)
     */
    checkSuspiciousIP(ip) {
        // Lista básica de rangos IP sospechosos
        const suspiciousRanges = [
            '10.0.0.0/8',
            '172.16.0.0/12',
            '192.168.0.0/16'
        ];
        
        // En implementación real, usarías servicios como VirusTotal, AbuseIPDB, etc.
        return false;
    }
    
    /**
     * Verificar URL maliciosa
     */
    async checkMaliciousURL(url) {
        try {
            // Validar formato URL
            if (!validator.isURL(url)) {
                return { malicious: true, reason: 'Formato de URL inválido' };
            }
            
            // Lista básica de dominios sospechosos
            const suspiciousDomains = [
                'bit.ly', 'tinyurl.com', 'shortened.link',
                'discord.gg', 'telegram.me'
            ];
            
            const domain = new URL(url).hostname;
            
            if (suspiciousDomains.includes(domain)) {
                return { malicious: true, reason: 'Dominio en lista de riesgo' };
            }
            
            // Verificar protocolos peligrosos
            const protocol = new URL(url).protocol;
            if (!['http:', 'https:'].includes(protocol)) {
                return { malicious: true, reason: 'Protocolo no permitido' };
            }
            
            return { malicious: false };
            
        } catch (error) {
            return { malicious: true, reason: 'Error analizando URL' };
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                         FUNCIONES AUXILIARES                           │
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Limpiar datos antiguos
     */
    cleanup() {
        const now = Date.now();
        const oneHourAgo = now - 3600000;
        
        // Limpiar rate limiting
        for (const [key, requests] of this.userRequests.entries()) {
            const recentRequests = requests.filter(time => time > oneHourAgo);
            if (recentRequests.length === 0) {
                this.userRequests.delete(key);
            } else {
                this.userRequests.set(key, recentRequests);
            }
        }
        
        // Limpiar actividad sospechosa
        for (const [userId, activity] of this.suspiciousActivity.entries()) {
            if (activity.lastUpdate < oneHourAgo) {
                this.suspiciousActivity.delete(userId);
            }
        }
        
        // Limpiar bans expirados
        for (const [userId, ban] of this.bannedUsers.entries()) {
            if (now > ban.banUntil) {
                this.bannedUsers.delete(userId);
                this.emit('userUnbanned', { userId });
            }
        }
        
        this.lastCleanup = now;
    }
    
    /**
     * Configurar limpieza automática
     */
    setupCleanupInterval() {
        setInterval(() => {
            this.cleanup();
        }, 300000); // 5 minutos
    }
    
    /**
     * Obtener estadísticas de seguridad
     */
    getSecurityStats() {
        const stats = {
            bannedUsers: this.bannedUsers.size,
            suspiciousUsers: this.suspiciousActivity.size,
            activeRateLimits: this.userRequests.size,
            lastCleanup: this.lastCleanup
        };
        
        // Calcular distribución de scores de riesgo
        const riskDistribution = { low: 0, medium: 0, high: 0 };
        
        for (const [userId, activity] of this.suspiciousActivity.entries()) {
            if (activity.score < 5) riskDistribution.low++;
            else if (activity.score < 10) riskDistribution.medium++;
            else riskDistribution.high++;
        }
        
        stats.riskDistribution = riskDistribution;
        
        return stats;
    }
    
    /**
     * Generar reporte de seguridad
     */
    generateSecurityReport() {
        const stats = this.getSecurityStats();
        const report = {
            timestamp: new Date().toISOString(),
            summary: stats,
            details: {
                bannedUsers: Array.from(this.bannedUsers.entries()).map(([userId, ban]) => ({
                    userId,
                    reason: ban.reason,
                    bannedAt: new Date(ban.bannedAt).toISOString(),
                    banUntil: new Date(ban.banUntil).toISOString()
                })),
                highRiskUsers: Array.from(this.suspiciousActivity.entries())
                    .filter(([userId, activity]) => activity.score >= 5)
                    .map(([userId, activity]) => ({
                        userId,
                        score: activity.score,
                        activities: activity.activities.slice(-5) // Últimas 5 actividades
                    }))
            }
        };
        
        return report;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                         INSTANCIA GLOBAL                                   │
// ═══════════════════════════════════════════════════════════════════════════════

export const security = new SecurityManager({
    maxRequestsPerMinute: 20,
    maxRequestsPerHour: 100,
    banDuration: 3600000, // 1 hora
    maxMessageLength: 4000,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    spamThreshold: 5,
    spamTimeWindow: 60000
});

// Event listeners para logging
security.on('rateLimitExceeded', (data) => {
    console.log(chalk.yellow(`𒁈 Rate limit excedido: ${data.userId} (${data.type})`));
});

security.on('userBanned', (data) => {
    console.log(chalk.red(`𒁈 Usuario baneado automáticamente: ${data.userId}`));
});

security.on('suspiciousInput', (data) => {
    console.log(chalk.yellow(`𒁈 Input sospechoso detectado: ${data.pattern}`));
});

export default security;
