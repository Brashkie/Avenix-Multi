/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                     𒁈 AVENIX-MULTI V2.0.0 - CACHE.JS 𒁈                  ┃
 * ┃                        Sistema de Caché Avanzado                           ┃
 * ┃                         Creado por: Hepein Oficial                         ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import NodeCache from 'node-cache';
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import paint from './paint.js'
import { promisify } from 'util';
import v8 from 'v8';
import { brotliCompressSync, brotliDecompressSync } from 'zlib';
import { openStore } from './storage.js';

// ═══════════════════════════════════════════════════════════════════════════════
// │                        CLASE PRINCIPAL DE CACHÉ                            │
// ═══════════════════════════════════════════════════════════════════════════════

export class CacheManager extends EventEmitter {
    declare config: any
    declare memoryCache: NodeCache
    declare stats: any
    declare layers: any
    declare redisClient: any
    declare diskCacheSize: number

    constructor(config: Record<string, any> = {}) {
        super();
        
        this.config = {
            // Configuración de memoria
            stdTTL: config.stdTTL || 600, // 10 minutos por defecto
            checkperiod: config.checkperiod || 120, // 2 minutos
            useClones: config.useClones !== false,
            deleteOnExpire: config.deleteOnExpire !== false,
            maxKeys: config.maxKeys || 10000,
            
            // Configuración de disco
            enableDiskCache: config.enableDiskCache !== false,
            diskCacheTTL: config.diskCacheTTL || 3600, // 1 hora
            maxDiskSize: config.maxDiskSize || 100 * 1024 * 1024, // 100MB
            
            // Configuración de Redis (opcional)
            enableRedis: config.enableRedis || false,
            redisUrl: config.redisUrl || 'redis://localhost:6379',
            redisPrefix: config.redisPrefix || 'avenix:',
            
            // Configuración de compresión
            enableCompression: config.enableCompression || false,
            compressionThreshold: config.compressionThreshold || 1024, // 1KB
            
            ...config
        };
        
        // Inicializar cache en memoria
        this.memoryCache = new NodeCache({
            stdTTL: this.config.stdTTL,
            checkperiod: this.config.checkperiod,
            useClones: this.config.useClones,
            deleteOnExpire: this.config.deleteOnExpire,
            maxKeys: this.config.maxKeys
        });
        
        // Estadísticas
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            errors: 0,
            diskHits: 0,
            diskMisses: 0,
            compressionSaved: 0
        };
        
        // Cache por capas (L1: Memory, L2: Disk, L3: Redis)
        this.layers = {
            memory: true,
            disk: this.config.enableDiskCache,
            redis: this.config.enableRedis
        };
        
        this.redisClient = null;
        this.diskCacheSize = 0;
        
        this.init();
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                            INICIALIZACIÓN                              │
    // ═══════════════════════════════════════════════════════════════════════════
    
    async init() {
        try {
            await this.setupDiskCache();
            await this.setupRedisCache();
            this.setupEventListeners();
            this.setupCleanupTasks();
            
            console.log(paint.green('𒁈 CacheManager inicializado correctamente'));
            this.emit('ready');
            
        } catch (error) {
            console.error(paint.red('𒁈 Error inicializando CacheManager:'), error.message);
            this.emit('error', error);
        }
    }
    
    async setupDiskCache() {
        if (!this.layers.disk) return;
        // Capa de disco: log binario de strenor con TTL nativo (./storage/cache.strenor)
        this.calculateDiskCacheSize();
        console.log(paint.blue('𒁈 Disk cache habilitado (strenor)'));
    }

    async setupRedisCache() {
        if (!this.layers.redis) return;
        
        try {
            // Importar Redis dinámicamente
            const { createClient } = await import('redis');
            
            this.redisClient = createClient({
                url: this.config.redisUrl
            });
            
            this.redisClient.on('error', (err) => {
                console.error(paint.red('𒁈 Redis error:'), err.message);
                this.stats.errors++;
            });
            
            await this.redisClient.connect();
            console.log(paint.blue('𒁈 Redis cache conectado'));
            
        } catch (error) {
            console.warn(paint.yellow('𒁈 Redis no disponible, usando solo cache local'));
            this.layers.redis = false;
        }
    }
    
    setupEventListeners() {
        // Eventos del cache en memoria
        this.memoryCache.on('set', (key, value) => {
            this.stats.sets++;
            this.emit('memorySet', { key, size: this.estimateSize(value) });
        });
        
        this.memoryCache.on('del', (key, value) => {
            this.stats.deletes++;
            this.emit('memoryDelete', { key });
        });
        
        this.memoryCache.on('expired', (key, value) => {
            this.emit('expired', { key, layer: 'memory' });
        });
    }
    
    setupCleanupTasks() {
        // Limpiar disk cache cada 30 minutos
        setInterval(() => {
            this.cleanupDiskCache().catch(console.error);
        }, 30 * 60 * 1000);
        
        // Reportar estadísticas cada 10 minutos
        setInterval(() => {
            this.logStats();
        }, 10 * 60 * 1000);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                         OPERACIONES PRINCIPALES                        │
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Obtener valor del cache (multi-capa)
     */
    async get(key, options: Record<string, any> = {}) {
        try {
            const startTime = Date.now();
            
            // L1: Memory Cache
            if (this.layers.memory) {
                const memoryValue = this.memoryCache.get(key);
                if (memoryValue !== undefined) {
                    this.stats.hits++;
                    this.emit('hit', { key, layer: 'memory', time: Date.now() - startTime });
                    return memoryValue;
                }
            }
            
            // L2: Disk Cache
            if (this.layers.disk) {
                const diskValue = await this.getDiskCache(key);
                if (diskValue !== null) {
                    this.stats.diskHits++;
                    this.stats.hits++;
                    
                    // Promover a memory cache
                    if (this.layers.memory) {
                        this.memoryCache.set(key, diskValue, options.ttl || this.config.stdTTL);
                    }
                    
                    this.emit('hit', { key, layer: 'disk', time: Date.now() - startTime });
                    return diskValue;
                }
                this.stats.diskMisses++;
            }
            
            // L3: Redis Cache
            if (this.layers.redis && this.redisClient) {
                const redisValue = await this.getRedisCache(key);
                if (redisValue !== null) {
                    this.stats.hits++;
                    
                    // Promover a capas superiores
                    if (this.layers.memory) {
                        this.memoryCache.set(key, redisValue, options.ttl || this.config.stdTTL);
                    }
                    if (this.layers.disk) {
                        await this.setDiskCache(key, redisValue, options.ttl || this.config.diskCacheTTL);
                    }
                    
                    this.emit('hit', { key, layer: 'redis', time: Date.now() - startTime });
                    return redisValue;
                }
            }
            
            // Cache miss
            this.stats.misses++;
            this.emit('miss', { key, time: Date.now() - startTime });
            return null;
            
        } catch (error) {
            this.stats.errors++;
            console.error(paint.red(`𒁈 Error en cache get(${key}):`), error.message);
            return null;
        }
    }
    
    /**
     * Establecer valor en cache (multi-capa)
     */
    async set(key, value, ttl: any = null, options: Record<string, any> = {}) {
        try {
            const finalTtl = ttl || this.config.stdTTL;
            const startTime = Date.now();
            
            // Comprimir si es necesario
            const processedValue = this.config.enableCompression ? 
                this.compressValue(value) : value;
            
            // L1: Memory Cache
            if (this.layers.memory) {
                this.memoryCache.set(key, processedValue, finalTtl);
            }
            
            // L2: Disk Cache
            if (this.layers.disk && !options.memoryOnly) {
                await this.setDiskCache(key, processedValue, this.config.diskCacheTTL);
            }
            
            // L3: Redis Cache
            if (this.layers.redis && this.redisClient && !options.memoryOnly) {
                await this.setRedisCache(key, processedValue, this.config.diskCacheTTL);
            }
            
            this.emit('set', { 
                key, 
                size: this.estimateSize(value),
                time: Date.now() - startTime
            });
            
            return true;
            
        } catch (error) {
            this.stats.errors++;
            console.error(paint.red(`𒁈 Error en cache set(${key}):`), error.message);
            return false;
        }
    }
    
    /**
     * Eliminar del cache
     */
    async delete(key) {
        try {
            const deleted = {
                memory: false,
                disk: false,
                redis: false
            };
            
            // Eliminar de memory cache
            if (this.layers.memory) {
                deleted.memory = this.memoryCache.del(key) > 0;
            }
            
            // Eliminar de disk cache
            if (this.layers.disk) {
                deleted.disk = await this.deleteDiskCache(key);
            }
            
            // Eliminar de Redis
            if (this.layers.redis && this.redisClient) {
                deleted.redis = await this.deleteRedisCache(key);
            }
            
            this.emit('delete', { key, deleted });
            return Object.values(deleted).some(d => d);
            
        } catch (error) {
            this.stats.errors++;
            console.error(paint.red(`𒁈 Error en cache delete(${key}):`), error.message);
            return false;
        }
    }
    
    /**
     * Verificar si existe una clave
     */
    async has(key) {
        try {
            // Verificar en memory cache
            if (this.layers.memory && this.memoryCache.has(key)) {
                return true;
            }
            
            // Verificar en disk cache
            if (this.layers.disk && await this.hasDiskCache(key)) {
                return true;
            }
            
            // Verificar en Redis
            if (this.layers.redis && this.redisClient) {
                const exists = await this.redisClient.exists(this.config.redisPrefix + key);
                return exists === 1;
            }
            
            return false;
            
        } catch (error) {
            this.stats.errors++;
            return false;
        }
    }
    
    /**
     * Limpiar todo el cache
     */
    async flush() {
        try {
            // Limpiar memory cache
            if (this.layers.memory) {
                this.memoryCache.flushAll();
            }
            
            // Limpiar disk cache
            if (this.layers.disk) {
                await this.flushDiskCache();
            }
            
            // Limpiar Redis cache
            if (this.layers.redis && this.redisClient) {
                await this.redisClient.flushDb();
            }
            
            console.log(paint.green('𒁈 Cache completamente limpiado'));
            this.emit('flush');
            
            return true;
            
        } catch (error) {
            this.stats.errors++;
            console.error(paint.red('𒁈 Error limpiando cache:'), error.message);
            return false;
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                        OPERACIONES DE DISK CACHE                       │
    // ═══════════════════════════════════════════════════════════════════════════
    
    diskStore() {
        return openStore('cache');
    }

    async getDiskCache(key) {
        try {
            const value = this.diskStore().get(key);
            return value == null ? null : this.config.enableCompression ? this.decompressValue(value) : value;
        } catch (error) {
            return null;
        }
    }

    async setDiskCache(key, value, ttl) {
        try {
            if (this.diskCacheSize > this.config.maxDiskSize) await this.cleanupDiskCache();
            this.diskStore().set(key, value, { ttl: (ttl || this.config.diskCacheTTL) * 1000 });
            this.calculateDiskCacheSize();
            return true;
        } catch (error) {
            console.error(paint.red('𒁈 Error escribiendo disk cache:'), error.message);
            return false;
        }
    }

    async deleteDiskCache(key) {
        try {
            return this.diskStore().del(key);
        } catch (error) {
            return false;
        }
    }

    async hasDiskCache(key) {
        try {
            return this.diskStore().exists(key);
        } catch (error) {
            return false;
        }
    }

    async flushDiskCache() {
        try {
            this.diskStore().clear();
            this.diskStore().compact();
            this.diskCacheSize = 0;
        } catch (error) {
            console.error(paint.red('𒁈 Error limpiando disk cache:'), error.message);
        }
    }

    async cleanupDiskCache() {
        try {
            const removed = this.diskStore().sweep();
            this.diskStore().compact();
            this.calculateDiskCacheSize();
            if (removed > 0) console.log(paint.blue(`𒁈 Disk cache limpiado: ${removed} entradas expiradas`));
        } catch (error) {
            console.error(paint.red('𒁈 Error en cleanup disk cache:'), error.message);
        }
    }

    calculateDiskCacheSize() {
        try {
            this.diskCacheSize = this.diskStore().aofSize();
        } catch (error) {
            this.diskCacheSize = 0;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // │                        OPERACIONES DE REDIS CACHE                      │
    // ═══════════════════════════════════════════════════════════════════════════
    
    async getRedisCache(key) {
        try {
            if (!this.redisClient) return null;
            
            const value = await this.redisClient.get(this.config.redisPrefix + key);
            return value ? v8.deserialize(Buffer.from(value, 'base64')) : null;
            
        } catch (error) {
            return null;
        }
    }
    
    async setRedisCache(key, value, ttl) {
        try {
            if (!this.redisClient) return false;
            
            const serialized = v8.serialize(value).toString('base64');
            
            if (ttl) {
                await this.redisClient.setEx(this.config.redisPrefix + key, ttl, serialized);
            } else {
                await this.redisClient.set(this.config.redisPrefix + key, serialized);
            }
            
            return true;
            
        } catch (error) {
            return false;
        }
    }
    
    async deleteRedisCache(key) {
        try {
            if (!this.redisClient) return false;
            
            const deleted = await this.redisClient.del(this.config.redisPrefix + key);
            return deleted > 0;
            
        } catch (error) {
            return false;
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                          FUNCIONES AUXILIARES                          │
    // ═══════════════════════════════════════════════════════════════════════════
    
    /** Compresión real: serialización binaria V8 + Brotli. */
    compressValue(value) {
        const serialized = v8.serialize(value);
        if (serialized.length < this.config.compressionThreshold) {
            return value; // No comprimir valores pequeños
        }
        const data = brotliCompressSync(serialized);
        this.stats.compressionSaved += serialized.length - data.length;
        return { _compressed: true, data, originalSize: serialized.length };
    }

    decompressValue(value) {
        if (value && value._compressed) {
            return v8.deserialize(brotliDecompressSync(value.data));
        }
        return value;
    }

    estimateSize(value) {
        try {
            return v8.serialize(value).length;
        } catch (error) {
            return 0;
        }
    }

    logStats() {
        const hitRate = this.stats.hits + this.stats.misses > 0 ? 
            (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2) : 0;
        
        const memoryStats = this.memoryCache.getStats();
        
        console.log(paint.blue(`𒁈 Cache Stats - Hit Rate: ${hitRate}%, Memory Keys: ${memoryStats.keys}, Disk Size: ${(this.diskCacheSize / 1024).toFixed(2)}KB`));
    }
    
    /**
     * Obtener estadísticas completas
     */
    getStats() {
        const memoryStats = this.memoryCache.getStats();
        const hitRate = this.stats.hits + this.stats.misses > 0 ? 
            (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2) : 0;
        
        return {
            ...this.stats,
            hitRate: parseFloat(String(hitRate)),
            memory: memoryStats,
            disk: {
                size: this.diskCacheSize,
                enabled: this.layers.disk
            },
            redis: {
                connected: this.redisClient ? this.redisClient.isReady : false,
                enabled: this.layers.redis
            },
            compressionSavings: this.stats.compressionSaved
        };
    }
    
    /**
     * Obtener información de configuración
     */
    getInfo() {
        return {
            config: { ...this.config },
            layers: { ...this.layers },
            stats: this.getStats()
        };
    }
    
    /**
     * Cerrar conexiones
     */
    async close() {
        console.log(paint.blue('𒁈 Cerrando CacheManager...'));
        
        if (this.redisClient) {
            await this.redisClient.quit();
        }
        
        this.memoryCache.close();
        
        console.log(paint.green('𒁈 CacheManager cerrado correctamente'));
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                         INSTANCIA GLOBAL                                   │
// ═══════════════════════════════════════════════════════════════════════════════

export const cache = new CacheManager({
    stdTTL: 600, // 10 minutos
    checkperiod: 120, // 2 minutos
    maxKeys: 10000,
    enableDiskCache: true,
    diskCacheTTL: 3600, // 1 hora
    maxDiskSize: 100 * 1024 * 1024, // 100MB
    enableRedis: false, // Deshabilitado por defecto
    enableCompression: false // Deshabilitado por defecto
});

export default cache;
