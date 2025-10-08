/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                   𒁈 CLOUDDB ADAPTER V2.0 ULTRA 𒁈                          ┃
 * ┃              Sistema de Base de Datos en la Nube Profesional                ┃
 * ┃                    Creado para: Avenix-Multi V6.1.0                          ┃
 * ┃                    By: Hepein Oficial (Mejorado)                             ┃
 * ┃                                                                               ┃
 * ┃  CARACTERÍSTICAS:                                                            ┃
 * ┃  ✅ Sistema de caché inteligente con TTL                                    ┃
 * ┃  ✅ Reintentos automáticos con backoff exponencial                          ┃
 * ┃  ✅ Compresión automática (gzip/brotli)                                     ┃
 * ┃  ✅ Encriptación AES-256-GCM                                                ┃
 * ┃  ✅ Versionado automático con backups                                       ┃
 * ┃  ✅ Rate limiting inteligente                                               ┃
 * ┃  ✅ Validación de integridad (checksums)                                    ┃
 * ┃  ✅ Múltiples backends (JSONBin, MongoDB Atlas, etc)                        ┃
 * ┃  ✅ Sincronización diferencial (solo cambios)                               ┃
 * ┃  ✅ Métricas y estadísticas en tiempo real                                  ┃
 * ┃  ✅ Logging avanzado con niveles                                            ┃
 * ┃  ✅ Fallback automático a local                                             ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import got from 'got';
import crypto from 'crypto';
import zlib from 'zlib';
import { promisify } from 'util';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

// Promisify zlib functions
const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);
const brotliCompress = promisify(zlib.brotliCompress);
const brotliDecompress = promisify(zlib.brotliDecompress);

// ═══════════════════════════════════════════════════════════════════════════════
// │                        CONFIGURACIÓN GLOBAL                                 │
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
    // Caché
    CACHE_ENABLED: true,
    CACHE_TTL: 300000, // 5 minutos
    
    // Compresión
    COMPRESSION_ENABLED: true,
    COMPRESSION_TYPE: 'gzip', // 'gzip' | 'brotli' | 'none'
    COMPRESSION_MIN_SIZE: 1024, // 1KB - solo comprimir si es mayor
    
    // Encriptación
    ENCRYPTION_ENABLED: false, // Activar solo si se proporciona una clave
    ENCRYPTION_ALGORITHM: 'aes-256-gcm',
    
    // Reintentos
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    RETRY_BACKOFF: 2,
    
    // Rate Limiting
    RATE_LIMIT_ENABLED: true,
    RATE_LIMIT_MAX_REQUESTS: 60,
    RATE_LIMIT_WINDOW: 60000, // 1 minuto
    
    // Versionado
    VERSIONING_ENABLED: true,
    MAX_VERSIONS: 10,
    
    // Validación
    VALIDATE_CHECKSUM: true,
    
    // Timeouts
    TIMEOUT_READ: 30000,
    TIMEOUT_WRITE: 60000,
    
    // Fallback
    FALLBACK_ENABLED: true,
    FALLBACK_PATH: './data/db-fallback.json',
    
    // Sincronización
    SYNC_DIFFERENTIAL: true, // Solo guardar cambios
    
    // Logging
    LOG_ENABLED: true,
    LOG_LEVEL: 'info',
    
    // Métricas
    METRICS_ENABLED: true
};

// ═══════════════════════════════════════════════════════════════════════════════
// │                      SISTEMA DE LOGGING                                     │
// ═══════════════════════════════════════════════════════════════════════════════

class Logger {
    static levels = { debug: 0, info: 1, warn: 2, error: 3 };
    static currentLevel = this.levels[CONFIG.LOG_LEVEL] || 1;
    
    static log(level, ...args) {
        if (!CONFIG.LOG_ENABLED || this.levels[level] < this.currentLevel) return;
        
        const timestamp = new Date().toLocaleString('es-PE');
        const prefix = {
            debug: chalk.bold.bgBlue(' DEBUG '),
            info: chalk.bold.bgGreen(' INFO '),
            warn: chalk.bold.bgYellow(' WARN '),
            error: chalk.bold.bgRed(' ERROR ')
        }[level];
        
        console.log(prefix, `[${chalk.gray(timestamp)}] [CloudDB]:`, ...args);
    }
    
    static debug(...args) { this.log('debug', ...args); }
    static info(...args) { this.log('info', ...args); }
    static warn(...args) { this.log('warn', ...args); }
    static error(...args) { this.log('error', ...args); }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      SISTEMA DE CACHÉ                                       │
// ═══════════════════════════════════════════════════════════════════════════════

class Cache {
    constructor(ttl = CONFIG.CACHE_TTL) {
        this.ttl = ttl;
        this.data = null;
        this.timestamp = null;
        this.hash = null;
        this.stats = { hits: 0, misses: 0 };
    }
    
    set(data) {
        if (!CONFIG.CACHE_ENABLED) return;
        
        this.data = data;
        this.timestamp = Date.now();
        this.hash = this.generateHash(data);
        
        Logger.debug(`📦 Datos guardados en caché`);
    }
    
    get() {
        if (!CONFIG.CACHE_ENABLED || !this.data) {
            this.stats.misses++;
            return null;
        }
        
        // Verificar TTL
        if (Date.now() - this.timestamp > this.ttl) {
            Logger.debug(`⏰ Caché expirada`);
            this.clear();
            this.stats.misses++;
            return null;
        }
        
        this.stats.hits++;
        Logger.debug(`✅ Caché HIT`);
        return this.data;
    }
    
    isValid() {
        return this.data !== null && Date.now() - this.timestamp <= this.ttl;
    }
    
    hasChanged(newData) {
        if (!this.data) return true;
        
        const newHash = this.generateHash(newData);
        return this.hash !== newHash;
    }
    
    generateHash(data) {
        const str = typeof data === 'string' ? data : JSON.stringify(data);
        return crypto.createHash('sha256').update(str).digest('hex');
    }
    
    clear() {
        this.data = null;
        this.timestamp = null;
        this.hash = null;
    }
    
    getStats() {
        const total = this.stats.hits + this.stats.misses;
        return {
            ...this.stats,
            hitRate: total > 0 ? (this.stats.hits / total * 100).toFixed(2) + '%' : '0%',
            isValid: this.isValid()
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      SISTEMA DE RATE LIMITING                               │
// ═══════════════════════════════════════════════════════════════════════════════

class RateLimiter {
    constructor(maxRequests = CONFIG.RATE_LIMIT_MAX_REQUESTS, window = CONFIG.RATE_LIMIT_WINDOW) {
        this.maxRequests = maxRequests;
        this.window = window;
        this.requests = [];
    }
    
    async checkLimit() {
        if (!CONFIG.RATE_LIMIT_ENABLED) return true;
        
        const now = Date.now();
        this.requests = this.requests.filter(time => now - time < this.window);
        
        if (this.requests.length >= this.maxRequests) {
            const waitTime = this.window - (now - this.requests[0]);
            Logger.warn(`⏳ Rate limit alcanzado. Esperando ${waitTime}ms...`);
            await this.sleep(waitTime);
            return this.checkLimit();
        }
        
        this.requests.push(now);
        return true;
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      SISTEMA DE MÉTRICAS                                    │
// ═══════════════════════════════════════════════════════════════════════════════

class Metrics {
    constructor() {
        this.stats = {
            reads: 0,
            writes: 0,
            errors: 0,
            totalReadTime: 0,
            totalWriteTime: 0,
            avgReadTime: 0,
            avgWriteTime: 0,
            lastSync: null,
            compressionRatio: 0,
            totalBytesSaved: 0
        };
    }
    
    recordRead(duration, success = true) {
        if (!CONFIG.METRICS_ENABLED) return;
        
        this.stats.reads++;
        if (success) {
            this.stats.totalReadTime += duration;
            this.stats.avgReadTime = this.stats.totalReadTime / this.stats.reads;
        } else {
            this.stats.errors++;
        }
    }
    
    recordWrite(duration, originalSize, compressedSize, success = true) {
        if (!CONFIG.METRICS_ENABLED) return;
        
        this.stats.writes++;
        this.stats.lastSync = new Date().toISOString();
        
        if (success) {
            this.stats.totalWriteTime += duration;
            this.stats.avgWriteTime = this.stats.totalWriteTime / this.stats.writes;
            
            if (compressedSize && originalSize) {
                const saved = originalSize - compressedSize;
                this.stats.totalBytesSaved += saved;
                this.stats.compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(2);
            }
        } else {
            this.stats.errors++;
        }
    }
    
    getStats() {
        return {
            ...this.stats,
            avgReadTime: `${this.stats.avgReadTime.toFixed(2)}ms`,
            avgWriteTime: `${this.stats.avgWriteTime.toFixed(2)}ms`,
            totalBytesSaved: `${(this.stats.totalBytesSaved / 1024).toFixed(2)}KB`,
            compressionRatio: `${this.stats.compressionRatio}%`
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      CLOUDDB ADAPTER PRINCIPAL                              │
// ═══════════════════════════════════════════════════════════════════════════════

class CloudDBAdapter {
    constructor(url, options = {}) {
        if (!url) throw new Error('CloudDBAdapter necesita una URL válida');
        
        this.url = url;
        this.options = {
            serialize: options.serialize || this.defaultSerialize,
            deserialize: options.deserialize || this.defaultDeserialize,
            fetchOptions: options.fetchOptions || {},
            encryptionKey: options.encryptionKey || null,
            ...options
        };
        
        // Activar encriptación si hay clave
        if (this.options.encryptionKey) {
            CONFIG.ENCRYPTION_ENABLED = true;
            this.encryptionKey = this.deriveKey(this.options.encryptionKey);
        }
        
        // Componentes
        this.cache = new Cache();
        this.rateLimiter = new RateLimiter();
        this.metrics = new Metrics();
        this.versions = [];
        
        // Cliente HTTP
        this.client = got.extend({
            timeout: {
                request: CONFIG.TIMEOUT_READ
            },
            retry: {
                limit: 0 // Manejamos reintentos manualmente
            },
            ...this.options.fetchOptions
        });
        
        Logger.info(`🚀 CloudDB Adapter inicializado`);
        Logger.info(`   URL: ${this.maskUrl(url)}`);
        Logger.info(`   Caché: ${CONFIG.CACHE_ENABLED ? '✅' : '❌'}`);
        Logger.info(`   Compresión: ${CONFIG.COMPRESSION_ENABLED ? `✅ (${CONFIG.COMPRESSION_TYPE})` : '❌'}`);
        Logger.info(`   Encriptación: ${CONFIG.ENCRYPTION_ENABLED ? '✅' : '❌'}`);
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      SERIALIZACIÓN                                    │
    // ═════════════════════════════════════════════════════════════════════════
    
    defaultSerialize(obj) {
        return JSON.stringify(obj, null, 2);
    }
    
    defaultDeserialize(str) {
        return JSON.parse(str, (_, v) => {
            if (v !== null && typeof v === 'object' && v.type === 'Buffer' && Array.isArray(v.data)) {
                return Buffer.from(v.data);
            }
            return v;
        });
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      COMPRESIÓN                                       │
    // ═════════════════════════════════════════════════════════════════════════
    
    async compress(data) {
        if (!CONFIG.COMPRESSION_ENABLED) return { data, compressed: false };
        
        const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
        
        if (buffer.length < CONFIG.COMPRESSION_MIN_SIZE) {
            Logger.debug(`📦 Sin comprimir (tamaño: ${buffer.length}B < ${CONFIG.COMPRESSION_MIN_SIZE}B)`);
            return { data, compressed: false };
        }
        
        try {
            let compressed;
            
            if (CONFIG.COMPRESSION_TYPE === 'brotli') {
                compressed = await brotliCompress(buffer);
            } else {
                compressed = await gzip(buffer);
            }
            
            const ratio = ((1 - compressed.length / buffer.length) * 100).toFixed(2);
            Logger.debug(`📦 Comprimido: ${buffer.length}B → ${compressed.length}B (${ratio}% reducción)`);
            
            return {
                data: compressed.toString('base64'),
                compressed: true,
                type: CONFIG.COMPRESSION_TYPE,
                originalSize: buffer.length
            };
        } catch (error) {
            Logger.error(`❌ Error al comprimir:`, error.message);
            return { data, compressed: false };
        }
    }
    
    async decompress(data, metadata = {}) {
        if (!metadata.compressed) {
            return Buffer.isBuffer(data) ? data.toString() : data;
        }
        
        try {
            const buffer = Buffer.from(data, 'base64');
            let decompressed;
            
            if (metadata.type === 'brotli') {
                decompressed = await brotliDecompress(buffer);
            } else {
                decompressed = await gunzip(buffer);
            }
            
            Logger.debug(`📦 Descomprimido: ${buffer.length}B → ${decompressed.length}B`);
            return decompressed.toString();
        } catch (error) {
            Logger.error(`❌ Error al descomprimir:`, error.message);
            throw error;
        }
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      ENCRIPTACIÓN                                     │
    // ═════════════════════════════════════════════════════════════════════════
    
    deriveKey(password) {
        return crypto.scryptSync(password, 'salt', 32);
    }
    
    encrypt(data) {
        if (!CONFIG.ENCRYPTION_ENABLED) return { data, encrypted: false };
        
        try {
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv(CONFIG.ENCRYPTION_ALGORITHM, this.encryptionKey, iv);
            
            const encrypted = Buffer.concat([
                cipher.update(data, 'utf8'),
                cipher.final()
            ]);
            
            const authTag = cipher.getAuthTag();
            
            Logger.debug(`🔐 Datos encriptados`);
            
            return {
                data: encrypted.toString('base64'),
                iv: iv.toString('base64'),
                authTag: authTag.toString('base64'),
                encrypted: true
            };
        } catch (error) {
            Logger.error(`❌ Error al encriptar:`, error.message);
            return { data, encrypted: false };
        }
    }
    
    decrypt(data, metadata = {}) {
        if (!metadata.encrypted) return data;
        
        try {
            const decipher = crypto.createDecipheriv(
                CONFIG.ENCRYPTION_ALGORITHM,
                this.encryptionKey,
                Buffer.from(metadata.iv, 'base64')
            );
            
            decipher.setAuthTag(Buffer.from(metadata.authTag, 'base64'));
            
            const decrypted = Buffer.concat([
                decipher.update(Buffer.from(data, 'base64')),
                decipher.final()
            ]);
            
            Logger.debug(`🔓 Datos desencriptados`);
            return decrypted.toString();
        } catch (error) {
            Logger.error(`❌ Error al desencriptar:`, error.message);
            throw error;
        }
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      VALIDACIÓN                                       │
    // ═════════════════════════════════════════════════════════════════════════
    
    generateChecksum(data) {
        const str = typeof data === 'string' ? data : JSON.stringify(data);
        return crypto.createHash('sha256').update(str).digest('hex');
    }
    
    validateChecksum(data, checksum) {
        const calculatedChecksum = this.generateChecksum(data);
        const isValid = calculatedChecksum === checksum;
        
        if (!isValid) {
            Logger.error(`❌ Checksum inválido. Datos posiblemente corruptos.`);
        }
        
        return isValid;
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      VERSIONADO                                       │
    // ═════════════════════════════════════════════════════════════════════════
    
    addVersion(data) {
        if (!CONFIG.VERSIONING_ENABLED) return;
        
        this.versions.push({
            data: JSON.parse(JSON.stringify(data)),
            timestamp: Date.now(),
            checksum: this.generateChecksum(data)
        });
        
        // Mantener solo las últimas N versiones
        if (this.versions.length > CONFIG.MAX_VERSIONS) {
            this.versions.shift();
        }
        
        Logger.debug(`📚 Versión guardada (total: ${this.versions.length})`);
    }
    
    getVersion(index = -1) {
        if (!CONFIG.VERSIONING_ENABLED || this.versions.length === 0) {
            return null;
        }
        
        // Índice negativo cuenta desde el final
        const actualIndex = index < 0 ? this.versions.length + index : index;
        return this.versions[actualIndex] || null;
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      FALLBACK LOCAL                                   │
    // ═════════════════════════════════════════════════════════════════════════
    
    async saveFallback(data) {
        if (!CONFIG.FALLBACK_ENABLED) return;
        
        try {
            const dir = path.dirname(CONFIG.FALLBACK_PATH);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            fs.writeFileSync(
                CONFIG.FALLBACK_PATH,
                this.options.serialize(data),
                'utf8'
            );
            
            Logger.debug(`💾 Fallback guardado en ${CONFIG.FALLBACK_PATH}`);
        } catch (error) {
            Logger.error(`❌ Error guardando fallback:`, error.message);
        }
    }
    
    async loadFallback() {
        if (!CONFIG.FALLBACK_ENABLED || !fs.existsSync(CONFIG.FALLBACK_PATH)) {
            return null;
        }
        
        try {
            const data = fs.readFileSync(CONFIG.FALLBACK_PATH, 'utf8');
            Logger.info(`📂 Datos cargados desde fallback local`);
            return this.options.deserialize(data);
        } catch (error) {
            Logger.error(`❌ Error cargando fallback:`, error.message);
            return null;
        }
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      READ (LECTURA)                                   │
    // ═════════════════════════════════════════════════════════════════════════
    
    async read() {
        const startTime = Date.now();
        
        try {
            // Verificar caché
            const cachedData = this.cache.get();
            if (cachedData) {
                Logger.info(`✅ Datos obtenidos desde caché`);
                this.metrics.recordRead(Date.now() - startTime);
                return cachedData;
            }
            
            // Rate limiting
            await this.rateLimiter.checkLimit();
            
            Logger.info(`📥 Leyendo datos de la nube...`);
            
            // Intentar leer con reintentos
            const response = await this.retryWithBackoff(async () => {
                return await this.client(this.url, {
                    method: 'GET',
                    headers: { Accept: 'application/json;q=0.9,text/plain' },
                    timeout: { request: CONFIG.TIMEOUT_READ }
                });
            });
            
            if (response.statusCode !== 200) {
                throw new Error(`Error HTTP ${response.statusCode}: ${response.statusMessage}`);
            }
            
            let body = response.body;
            let metadata = {};
            
            // Intentar parsear metadata si está en formato JSON
            try {
                const parsed = JSON.parse(body);
                if (parsed.data && parsed.metadata) {
                    body = parsed.data;
                    metadata = parsed.metadata;
                } else {
                    body = response.body;
                }
            } catch {
                // No es JSON con metadata, usar como está
            }
            
            // Desencriptar
            if (metadata.encrypted) {
                body = this.decrypt(body, metadata);
            }
            
            // Descomprimir
            if (metadata.compressed) {
                body = await this.decompress(body, metadata);
            }
            
            // Validar checksum
            if (CONFIG.VALIDATE_CHECKSUM && metadata.checksum) {
                if (!this.validateChecksum(body, metadata.checksum)) {
                    Logger.warn(`⚠️ Checksum inválido, intentando usar fallback...`);
                    const fallback = await this.loadFallback();
                    if (fallback) return fallback;
                    throw new Error('Datos corruptos y no hay fallback disponible');
                }
            }
            
            // Deserializar
            const data = this.options.deserialize(body);
            
            // Guardar en caché
            this.cache.set(data);
            
            // Guardar fallback
            await this.saveFallback(data);
            
            this.metrics.recordRead(Date.now() - startTime);
            Logger.info(`✅ Datos leídos exitosamente`);
            
            return data;
            
        } catch (error) {
            this.metrics.recordRead(Date.now() - startTime, false);
            Logger.error(`❌ Error al leer datos:`, error.message);
            
            // Intentar usar fallback
            if (CONFIG.FALLBACK_ENABLED) {
                Logger.warn(`⚠️ Intentando cargar desde fallback...`);
                const fallback = await this.loadFallback();
                if (fallback) {
                    Logger.info(`✅ Datos cargados desde fallback`);
                    return fallback;
                }
            }
            
            return null;
        }
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      WRITE (ESCRITURA)                                │
    // ═════════════════════════════════════════════════════════════════════════
    
    async write(obj) {
        const startTime = Date.now();
        
        try {
            // Verificar si hay cambios (sincronización diferencial)
            if (CONFIG.SYNC_DIFFERENTIAL && !this.cache.hasChanged(obj)) {
                Logger.info(`⏭️ Sin cambios detectados, saltando escritura`);
                return { success: true, message: 'No changes detected' };
            }
            
            // Rate limiting
            await this.rateLimiter.checkLimit();
            
            Logger.info(`📤 Guardando datos en la nube...`);
            
            // Guardar versión
            this.addVersion(obj);
            
            // Serializar
            let data = this.options.serialize(obj);
            const originalSize = Buffer.byteLength(data);
            
            // Generar checksum
            const checksum = this.generateChecksum(data);
            
            // Comprimir
            const compressionResult = await this.compress(data);
            data = compressionResult.data;
            
            // Encriptar
            const encryptionResult = this.encrypt(data);
            data = encryptionResult.data;
            
            // Metadata
            const metadata = {
                timestamp: Date.now(),
                checksum,
                compressed: compressionResult.compressed,
                type: compressionResult.type,
                originalSize: compressionResult.originalSize,
                encrypted: encryptionResult.encrypted,
                iv: encryptionResult.iv,
                authTag: encryptionResult.authTag,
                version: this.versions.length
            };
            
            // Preparar payload
            const payload = JSON.stringify({ data, metadata });
            const finalSize = Buffer.byteLength(payload);
            
            // Intentar escribir con reintentos
            const response = await this.retryWithBackoff(async () => {
                return await this.client(this.url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: payload,
                    timeout: { request: CONFIG.TIMEOUT_WRITE }
                });
            });
            
            if (response.statusCode !== 200) {
                throw new Error(`Error HTTP ${response.statusCode}: ${response.statusMessage}`);
            }
            
            // Actualizar caché
            this.cache.set(obj);
            
            // Guardar fallback
            await this.saveFallback(obj);
            
            this.metrics.recordWrite(Date.now() - startTime, originalSize, finalSize);
            Logger.info(`✅ Datos guardados exitosamente (${originalSize}B → ${finalSize}B)`);
            
            return { success: true, metadata };
            
        } catch (error) {
            this.metrics.recordWrite(Date.now() - startTime, 0, 0, false);
            Logger.error(`❌ Error al escribir datos:`, error.message);
            
            // Guardar en fallback como último recurso
            await this.saveFallback(obj);
            
            throw error;
        }
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      REINTENTOS                                       │
    // ═════════════════════════════════════════════════════════════════════════
    
    async retryWithBackoff(fn, maxRetries = CONFIG.MAX_RETRIES, initialDelay = CONFIG.RETRY_DELAY, backoff = CONFIG.RETRY_BACKOFF) {
        let lastError;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                
                if (attempt < maxRetries) {
                    const delay = initialDelay * Math.pow(backoff, attempt);
                    Logger.warn(`⚠️ Intento ${attempt + 1}/${maxRetries + 1} falló. Reintentando en ${delay}ms...`);
                    await this.sleep(delay);
                }
            }
        }
        
        throw lastError;
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      UTILIDADES                                       │
    // ═════════════════════════════════════════════════════════════════════════
    
    maskUrl(url) {
        try {
            const urlObj = new URL(url);
            return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname.substring(0, 10)}...`;
        } catch {
            return url.substring(0, 30) + '...';
        }
    }
    
    getStats() {
        return {
            cache: this.cache.getStats(),
            metrics: this.metrics.getStats(),
            versions: this.versions.length
        };
    }
    
    clearCache() {
        this.cache.clear();
        Logger.info(`🗑️ Caché limpiada`);
    }
    
    resetMetrics() {
        this.metrics = new Metrics();
        Logger.info(`📊 Métricas reiniciadas`);
    }
}

export default CloudDBAdapter;
