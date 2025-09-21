/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                     𒁈 AVENIX-MULTI V2.0.0 - DATABASE.JS 𒁈               ┃
 * ┃                        Sistema de Base de Datos Avanzado                  ┃
 * ┃                         Creado por: Hepein Oficial                        ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import fs from 'fs';
import path from 'path';
import Datastore from '@seald-io/nedb';
import { EventEmitter } from 'events';
import chalk from 'chalk';
import NodeCache from 'node-cache';
import { promisify } from 'util';

// ═══════════════════════════════════════════════════════════════════════════════
// │                        CLASE PRINCIPAL DE BASE DE DATOS                    │
// ═══════════════════════════════════════════════════════════════════════════════

export class DatabaseManager extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            path: config.path || './database',
            autoCompact: config.autoCompact !== false,
            compactInterval: config.compactInterval || 300000, // 5 minutos
            backupInterval: config.backupInterval || 3600000, // 1 hora
            maxBackups: config.maxBackups || 10,
            cacheSize: config.cacheSize || 1000,
            cacheTTL: config.cacheTTL || 300, // 5 minutos
            ...config
        };
        
        this.collections = new Map();
        this.cache = new NodeCache({ 
            stdTTL: this.config.cacheTTL,
            checkperiod: 60,
            maxKeys: this.config.cacheSize
        });
        
        this.stats = {
            queries: 0,
            cacheHits: 0,
            cacheMisses: 0,
            errors: 0,
            backups: 0
        };
        
        this.isConnected = false;
        this.backupTimer = null;
        this.compactTimer = null;
        
        this.init();
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                            INICIALIZACIÓN                              │
    // ═══════════════════════════════════════════════════════════════════════════
    
    async init() {
        try {
            await this.createDirectories();
            await this.initializeCollections();
            this.setupAutoTasks();
            this.isConnected = true;
            
            console.log(chalk.green('𒁈 DatabaseManager inicializado correctamente'));
            this.emit('connected');
            
        } catch (error) {
            console.error(chalk.red('𒁈 Error inicializando DatabaseManager:'), error);
            this.emit('error', error);
        }
    }
    
    async createDirectories() {
        const dirs = [
            this.config.path,
            path.join(this.config.path, 'backups'),
            path.join(this.config.path, 'logs')
        ];
        
        for (const dir of dirs) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        }
    }
    
    async initializeCollections() {
        const collections = ['users', 'chats', 'settings', 'msgs', 'sticker', 'stats'];
        
        for (const name of collections) {
            const collection = new Datastore({
                filename: path.join(this.config.path, `${name}.db`),
                autoload: true,
                timestampData: true
            });
            
            // Configurar auto-compactación
            if (this.config.autoCompact) {
                collection.setAutocompactionInterval(this.config.compactInterval);
            }
            
            // Promisificar métodos
            collection.findAsync = promisify(collection.find.bind(collection));
            collection.findOneAsync = promisify(collection.findOne.bind(collection));
            collection.insertAsync = promisify(collection.insert.bind(collection));
            collection.updateAsync = promisify(collection.update.bind(collection));
            collection.removeAsync = promisify(collection.remove.bind(collection));
            collection.countAsync = promisify(collection.count.bind(collection));
            
            this.collections.set(name, collection);
        }
    }
    
    setupAutoTasks() {
        // Auto-backup
        if (this.config.backupInterval > 0) {
            this.backupTimer = setInterval(() => {
                this.createBackup().catch(console.error);
            }, this.config.backupInterval);
        }
        
        // Limpiar estadísticas de cache
        setInterval(() => {
            const hitRate = this.stats.queries > 0 ? 
                (this.stats.cacheHits / this.stats.queries * 100).toFixed(2) : 0;
            
            if (this.stats.queries > 1000) {
                console.log(chalk.blue(`𒁈 DB Stats - Queries: ${this.stats.queries}, Cache Hit Rate: ${hitRate}%`));
            }
        }, 600000); // 10 minutos
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                         OPERACIONES BÁSICAS                            │
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Obtener un documento por ID
     */
    async get(collection, id, useCache = true) {
        try {
            this.stats.queries++;
            const cacheKey = `${collection}:${id}`;
            
            // Intentar obtener del cache
            if (useCache) {
                const cached = this.cache.get(cacheKey);
                if (cached) {
                    this.stats.cacheHits++;
                    return cached;
                }
            }
            
            this.stats.cacheMisses++;
            const col = this.collections.get(collection);
            if (!col) throw new Error(`Collection '${collection}' not found`);
            
            const doc = await col.findOneAsync({ _id: this.sanitizeId(id) });
            const result = doc ? this.unsanitizeDocument(doc) : null;
            
            // Guardar en cache
            if (result && useCache) {
                this.cache.set(cacheKey, result);
            }
            
            return result;
            
        } catch (error) {
            this.stats.errors++;
            console.error(chalk.red(`𒁈 Error en get(${collection}, ${id}):`), error.message);
            throw error;
        }
    }
    
    /**
     * Guardar o actualizar un documento
     */
    async set(collection, id, data, options = {}) {
        try {
            this.stats.queries++;
            const col = this.collections.get(collection);
            if (!col) throw new Error(`Collection '${collection}' not found`);
            
            const sanitizedId = this.sanitizeId(id);
            const sanitizedData = this.sanitizeDocument({ ...data, _id: sanitizedId });
            
            const result = await col.updateAsync(
                { _id: sanitizedId },
                sanitizedData,
                { upsert: true, returnUpdatedDocs: true }
            );
            
            // Actualizar cache
            const cacheKey = `${collection}:${id}`;
            this.cache.set(cacheKey, data);
            
            // Emitir evento
            this.emit('documentUpdated', { collection, id, data });
            
            return result;
            
        } catch (error) {
            this.stats.errors++;
            console.error(chalk.red(`𒁈 Error en set(${collection}, ${id}):`), error.message);
            throw error;
        }
    }
    
    /**
     * Eliminar un documento
     */
    async delete(collection, id) {
        try {
            this.stats.queries++;
            const col = this.collections.get(collection);
            if (!col) throw new Error(`Collection '${collection}' not found`);
            
            const result = await col.removeAsync({ _id: this.sanitizeId(id) });
            
            // Limpiar cache
            const cacheKey = `${collection}:${id}`;
            this.cache.del(cacheKey);
            
            // Emitir evento
            this.emit('documentDeleted', { collection, id });
            
            return result;
            
        } catch (error) {
            this.stats.errors++;
            console.error(chalk.red(`𒁈 Error en delete(${collection}, ${id}):`), error.message);
            throw error;
        }
    }
    
    /**
     * Buscar documentos con filtros
     */
    async find(collection, query = {}, options = {}) {
        try {
            this.stats.queries++;
            const col = this.collections.get(collection);
            if (!col) throw new Error(`Collection '${collection}' not found`);
            
            // Sanitizar query
            const sanitizedQuery = this.sanitizeDocument(query);
            
            let cursor = col.find(sanitizedQuery);
            
            // Aplicar opciones
            if (options.sort) cursor = cursor.sort(options.sort);
            if (options.limit) cursor = cursor.limit(options.limit);
            if (options.skip) cursor = cursor.skip(options.skip);
            
            const docs = await new Promise((resolve, reject) => {
                cursor.exec((err, docs) => {
                    if (err) reject(err);
                    else resolve(docs);
                });
            });
            
            return docs.map(doc => this.unsanitizeDocument(doc));
            
        } catch (error) {
            this.stats.errors++;
            console.error(chalk.red(`𒁈 Error en find(${collection}):`), error.message);
            throw error;
        }
    }
    
    /**
     * Contar documentos
     */
    async count(collection, query = {}) {
        try {
            this.stats.queries++;
            const col = this.collections.get(collection);
            if (!col) throw new Error(`Collection '${collection}' not found`);
            
            return await col.countAsync(this.sanitizeDocument(query));
            
        } catch (error) {
            this.stats.errors++;
            console.error(chalk.red(`𒁈 Error en count(${collection}):`), error.message);
            throw error;
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                       OPERACIONES AVANZADAS                            │
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Transacción simple (simulada)
     */
    async transaction(operations) {
        const rollbackOperations = [];
        
        try {
            for (const operation of operations) {
                const { type, collection, id, data } = operation;
                
                switch (type) {
                    case 'set':
                        // Guardar estado anterior para rollback
                        const oldDoc = await this.get(collection, id, false);
                        rollbackOperations.push({
                            type: oldDoc ? 'set' : 'delete',
                            collection,
                            id,
                            data: oldDoc
                        });
                        
                        await this.set(collection, id, data);
                        break;
                        
                    case 'delete':
                        const docToDelete = await this.get(collection, id, false);
                        rollbackOperations.push({
                            type: 'set',
                            collection,
                            id,
                            data: docToDelete
                        });
                        
                        await this.delete(collection, id);
                        break;
                        
                    default:
                        throw new Error(`Unknown transaction operation: ${type}`);
                }
            }
            
            return { success: true };
            
        } catch (error) {
            // Rollback
            console.warn(chalk.yellow('𒁈 Ejecutando rollback de transacción...'));
            
            for (const rollbackOp of rollbackOperations.reverse()) {
                try {
                    if (rollbackOp.type === 'set') {
                        await this.set(rollbackOp.collection, rollbackOp.id, rollbackOp.data);
                    } else if (rollbackOp.type === 'delete') {
                        await this.delete(rollbackOp.collection, rollbackOp.id);
                    }
                } catch (rollbackError) {
                    console.error(chalk.red('𒁈 Error en rollback:'), rollbackError.message);
                }
            }
            
            throw error;
        }
    }
    
    /**
     * Migración de datos
     */
    async migrate(migrationFunction) {
        console.log(chalk.blue('𒁈 Iniciando migración de base de datos...'));
        
        try {
            // Crear backup antes de migración
            await this.createBackup('pre-migration');
            
            await migrationFunction(this);
            
            console.log(chalk.green('𒁈 Migración completada exitosamente'));
            
        } catch (error) {
            console.error(chalk.red('𒁈 Error en migración:'), error.message);
            throw error;
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                           SISTEMA DE BACKUP                            │
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Crear backup de todas las colecciones
     */
    async createBackup(suffix = '') {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupName = `backup-${timestamp}${suffix ? '-' + suffix : ''}`;
            const backupDir = path.join(this.config.path, 'backups', backupName);
            
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }
            
            // Backup de cada colección
            for (const [name, collection] of this.collections) {
                const docs = await this.find(name);
                const backupFile = path.join(backupDir, `${name}.json`);
                
                fs.writeFileSync(backupFile, JSON.stringify(docs, null, 2));
            }
            
            // Metadata del backup
            const metadata = {
                timestamp: new Date().toISOString(),
                collections: Array.from(this.collections.keys()),
                version: '2.0.0',
                stats: { ...this.stats }
            };
            
            fs.writeFileSync(
                path.join(backupDir, 'metadata.json'),
                JSON.stringify(metadata, null, 2)
            );
            
            this.stats.backups++;
            console.log(chalk.green(`𒁈 Backup creado: ${backupName}`));
            
            // Limpiar backups antiguos
            await this.cleanOldBackups();
            
            return backupName;
            
        } catch (error) {
            console.error(chalk.red('𒁈 Error creando backup:'), error.message);
            throw error;
        }
    }
    
    /**
     * Restaurar desde backup
     */
    async restoreBackup(backupName) {
        try {
            const backupDir = path.join(this.config.path, 'backups', backupName);
            
            if (!fs.existsSync(backupDir)) {
                throw new Error(`Backup '${backupName}' no encontrado`);
            }
            
            console.log(chalk.blue(`𒁈 Restaurando backup: ${backupName}`));
            
            // Leer metadata
            const metadataFile = path.join(backupDir, 'metadata.json');
            if (fs.existsSync(metadataFile)) {
                const metadata = JSON.parse(fs.readFileSync(metadataFile, 'utf8'));
                console.log(chalk.gray(`𒁈 Backup fecha: ${metadata.timestamp}`));
            }
            
            // Restaurar cada colección
            for (const [name, collection] of this.collections) {
                const backupFile = path.join(backupDir, `${name}.json`);
                
                if (fs.existsSync(backupFile)) {
                    const docs = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
                    
                    // Limpiar colección actual
                    await collection.removeAsync({}, { multi: true });
                    
                    // Insertar documentos del backup
                    if (docs.length > 0) {
                        await collection.insertAsync(docs.map(doc => this.sanitizeDocument(doc)));
                    }
                    
                    console.log(chalk.gray(`𒁈 Restaurado ${name}: ${docs.length} documentos`));
                }
            }
            
            // Limpiar cache
            this.cache.flushAll();
            
            console.log(chalk.green(`𒁈 Backup restaurado exitosamente: ${backupName}`));
            
        } catch (error) {
            console.error(chalk.red('𒁈 Error restaurando backup:'), error.message);
            throw error;
        }
    }
    
    /**
     * Listar backups disponibles
     */
    getAvailableBackups() {
        const backupsDir = path.join(this.config.path, 'backups');
        
        if (!fs.existsSync(backupsDir)) {
            return [];
        }
        
        return fs.readdirSync(backupsDir)
            .filter(name => {
                const backupPath = path.join(backupsDir, name);
                return fs.statSync(backupPath).isDirectory();
            })
            .map(name => {
                const metadataFile = path.join(backupsDir, name, 'metadata.json');
                let metadata = {};
                
                if (fs.existsSync(metadataFile)) {
                    try {
                        metadata = JSON.parse(fs.readFileSync(metadataFile, 'utf8'));
                    } catch (e) {
                        // Ignorar errores de metadata
                    }
                }
                
                return {
                    name,
                    timestamp: metadata.timestamp || 'Unknown',
                    collections: metadata.collections || [],
                    size: this.getDirectorySize(path.join(backupsDir, name))
                };
            })
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
    
    async cleanOldBackups() {
        const backups = this.getAvailableBackups();
        
        if (backups.length > this.config.maxBackups) {
            const backupsToDelete = backups.slice(this.config.maxBackups);
            
            for (const backup of backupsToDelete) {
                const backupPath = path.join(this.config.path, 'backups', backup.name);
                fs.rmSync(backupPath, { recursive: true, force: true });
                console.log(chalk.gray(`𒁈 Backup antiguo eliminado: ${backup.name}`));
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                          FUNCIONES AUXILIARES                          │
    // ═══════════════════════════════════════════════════════════════════════════
    
    sanitizeId(id) {
        return String(id).replace(/\./g, '_');
    }
    
    unsanitizeId(id) {
        return String(id).replace(/_/g, '.');
    }
    
    sanitizeDocument(doc) {
        if (!doc || typeof doc !== 'object') return doc;
        
        const sanitized = {};
        for (const [key, value] of Object.entries(doc)) {
            const sanitizedKey = key.replace(/\./g, '_');
            sanitized[sanitizedKey] = (typeof value === 'object' && value !== null) 
                ? this.sanitizeDocument(value) 
                : value;
        }
        return sanitized;
    }
    
    unsanitizeDocument(doc) {
        if (!doc || typeof doc !== 'object') return doc;
        
        const unsanitized = {};
        for (const [key, value] of Object.entries(doc)) {
            const unsanitizedKey = key.replace(/_/g, '.');
            unsanitized[unsanitizedKey] = (typeof value === 'object' && value !== null) 
                ? this.unsanitizeDocument(value) 
                : value;
        }
        return unsanitized;
    }
    
    getDirectorySize(dirPath) {
        let size = 0;
        
        try {
            const files = fs.readdirSync(dirPath);
            
            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const stats = fs.statSync(filePath);
                
                if (stats.isDirectory()) {
                    size += this.getDirectorySize(filePath);
                } else {
                    size += stats.size;
                }
            }
        } catch (error) {
            // Ignorar errores
        }
        
        return size;
    }
    
    /**
     * Obtener estadísticas de la base de datos
     */
    async getStats() {
        const collections = {};
        
        for (const [name, collection] of this.collections) {
            const count = await this.count(name);
            const dbFile = path.join(this.config.path, `${name}.db`);
            let size = 0;
            
            try {
                size = fs.statSync(dbFile).size;
            } catch (e) {
                // Ignorar error
            }
            
            collections[name] = { count, size };
        }
        
        return {
            ...this.stats,
            cacheStats: this.cache.getStats(),
            collections,
            backups: this.getAvailableBackups().length,
            connected: this.isConnected
        };
    }
    
    /**
     * Cerrar conexiones y limpiar recursos
     */
    async close() {
        console.log(chalk.blue('𒁈 Cerrando DatabaseManager...'));
        
        if (this.backupTimer) {
            clearInterval(this.backupTimer);
        }
        
        if (this.compactTimer) {
            clearInterval(this.compactTimer);
        }
        
        this.cache.close();
        this.isConnected = false;
        
        console.log(chalk.green('𒁈 DatabaseManager cerrado correctamente'));
        this.emit('disconnected');
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                         INSTANCIA GLOBAL                                   │
// ═══════════════════════════════════════════════════════════════════════════════

export const db = new DatabaseManager({
    path: './database',
    autoCompact: true,
    compactInterval: 300000, // 5 minutos
    backupInterval: 3600000, // 1 hora
    maxBackups: 10,
    cacheSize: 1000,
    cacheTTL: 300 // 5 minutos
});

// Auto-inicializar
db.init().catch(console.error);

export default db;
