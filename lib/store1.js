/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                            𒁈 AVENIX-MULTI V2.0.0 𒁈                         ┃
 * ┃                       LIB/STORE.JS - ALMACÉN DE MENSAJES                    ┃
 * ┃                          Creado por: Hepein Oficial                          ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import { makeInMemoryStore } from '@whiskeysockets/baileys'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import chalk from 'chalk'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ═══════════════════════════════════════════════════════════════════════════════
// │                        STORE OPTIMIZADO PARA AVENIX                         │
// ═══════════════════════════════════════════════════════════════════════════════

class AvenixStore {
    constructor() {
        // Store principal de Baileys
        this.store = makeInMemoryStore({
            logger: {
                level: 'silent',
                print: () => {}
            }
        })
        
        // Configuraciones optimizadas
        this.config = {
            maxMessages: 1000,        // Máximo mensajes por chat
            maxContacts: 5000,        // Máximo contactos
            saveInterval: 30 * 1000,  // Intervalo de guardado
            cleanupInterval: 10 * 60 * 1000, // Limpieza cada 10 min
            retentionDays: 7          // Días de retención de mensajes
        }
        
        // Rutas de archivos
        this.paths = {
            store: path.join(__dirname, '../AvenixSession/store.json'),
            backup: path.join(__dirname, '../BackupSession'),
            temp: path.join(__dirname, '../tmp')
        }
        
        // Cache interno para optimizar consultas
        this.cache = new Map()
        this.lastCleanup = Date.now()
        
        this.init()
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                             INICIALIZACIÓN                                  │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    init() {
        try {
            this.createDirectories()
            this.loadStore()
            this.setupAutoSave()
            this.setupCleanup()
            
            console.log(chalk.green('𒁈 Store de Avenix-Multi inicializado'))
        } catch (error) {
            console.error(chalk.red('𒁈 Error inicializando store:'), error)
        }
    }
    
    createDirectories() {
        [this.paths.backup, this.paths.temp, path.dirname(this.paths.store)]
            .forEach(dir => {
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true })
                }
            })
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                        CARGA Y GUARDADO DE STORE                            │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    loadStore() {
        try {
            if (fs.existsSync(this.paths.store)) {
                const data = JSON.parse(fs.readFileSync(this.paths.store, 'utf8'))
                
                // Restaurar datos
                if (data.chats) {
                    Object.assign(this.store.chats, data.chats)
                }
                
                if (data.contacts) {
                    Object.assign(this.store.contacts, data.contacts)
                }
                
                if (data.messages) {
                    Object.keys(data.messages).forEach(jid => {
                        if (data.messages[jid]) {
                            this.store.messages[jid] = data.messages[jid]
                            this.limitMessages(jid)
                        }
                    })
                }
                
                console.log(chalk.cyan('𒁈 Store cargado desde archivo'))
            }
        } catch (error) {
            console.error(chalk.yellow('𒁈 Store corrupto, creando nuevo:'), error.message)
            this.store = makeInMemoryStore({ logger: { level: 'silent', print: () => {} } })
        }
    }
    
    async saveStore() {
        try {
            await this.createBackup()
            
            const storeData = {
                chats: this.store.chats,
                contacts: this.store.contacts,
                messages: this.getLimitedMessages(),
                metadata: {
                    timestamp: Date.now(),
                    version: global.vs || '2.0.0',
                    messageCount: this.getMessageCount()
                }
            }
            
            // Guardado atómico
            const tempFile = this.paths.store + '.tmp'
            fs.writeFileSync(tempFile, JSON.stringify(storeData, null, 2))
            fs.renameSync(tempFile, this.paths.store)
            
        } catch (error) {
            console.error(chalk.red('𒁈 Error guardando store:'), error)
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                           GESTIÓN DE MENSAJES                               │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async loadMessage(jid, id, conn = null) {
        try {
            const cacheKey = `${jid}:${id}`
            
            // Buscar en cache
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey)
            }
            
            // Buscar en store
            if (this.store.messages[jid]) {
                const messages = Object.values(this.store.messages[jid])
                const message = messages.find(msg => 
                    msg.key?.id === id || 
                    msg.key?.stanzaId === id ||
                    msg.id === id
                )
                
                if (message) {
                    this.cache.set(cacheKey, message)
                    return message
                }
            }
            
            return null
        } catch (error) {
            console.error(chalk.red('𒁈 Error cargando mensaje:'), error)
            return null
        }
    }
    
    saveMessage(jid, message) {
        try {
            if (!this.store.messages[jid]) {
                this.store.messages[jid] = {}
            }
            
            const messageId = message.key?.id || message.id
            if (messageId) {
                this.store.messages[jid][messageId] = message
                
                // Cache del mensaje
                this.cache.set(`${jid}:${messageId}`, message)
                
                // Limitar mensajes si es necesario
                this.limitMessages(jid)
            }
        } catch (error) {
            console.error(chalk.red('𒁈 Error guardando mensaje:'), error)
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                            FUNCIONES DE UTILIDAD                            │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    limitMessages(jid) {
        const messages = this.store.messages[jid]
        if (!messages) return
        
        const messageKeys = Object.keys(messages)
        if (messageKeys.length > this.config.maxMessages) {
            // Ordenar por timestamp y mantener solo los más recientes
            const sortedKeys = messageKeys
                .sort((a, b) => {
                    const msgA = messages[a]
                    const msgB = messages[b]
                    return (msgA.messageTimestamp || 0) - (msgB.messageTimestamp || 0)
                })
            
            const toDelete = sortedKeys.slice(0, messageKeys.length - this.config.maxMessages)
            toDelete.forEach(key => {
                delete messages[key]
                this.cache.delete(`${jid}:${key}`)
            })
        }
    }
    
    getLimitedMessages() {
        const limitedMessages = {}
        const cutoffTime = Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000)
        
        Object.keys(this.store.messages).forEach(jid => {
            const messages = this.store.messages[jid]
            limitedMessages[jid] = {}
            
            Object.keys(messages).forEach(messageId => {
                const message = messages[messageId]
                const timestamp = message.messageTimestamp * 1000 || 0
                
                if (timestamp > cutoffTime) {
                    limitedMessages[jid][messageId] = message
                }
            })
        })
        
        return limitedMessages
    }
    
    getMessageCount() {
        let count = 0
        Object.values(this.store.messages).forEach(chat => {
            count += Object.keys(chat).length
        })
        return count
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                              RESPALDOS                                      │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async createBackup() {
        try {
            if (!fs.existsSync(this.paths.store)) return
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
            const backupFile = path.join(this.paths.backup, `store-${timestamp}.json`)
            
            fs.copyFileSync(this.paths.store, backupFile)
            
            // Mantener solo los 3 respaldos más recientes
            const backups = fs.readdirSync(this.paths.backup)
                .filter(file => file.startsWith('store-') && file.endsWith('.json'))
                .sort()
            
            while (backups.length > 3) {
                const oldest = backups.shift()
                fs.unlinkSync(path.join(this.paths.backup, oldest))
            }
            
        } catch (error) {
            console.error(chalk.yellow('𒁈 Error creando respaldo:'), error)
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                           CONFIGURACIÓN AUTOMÁTICA                          │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    setupAutoSave() {
        setInterval(async () => {
            await this.saveStore()
        }, this.config.saveInterval)
    }
    
    setupCleanup() {
        setInterval(() => {
            this.cleanup()
        }, this.config.cleanupInterval)
    }
    
    cleanup() {
        try {
            const now = Date.now()
            
            // Limpiar cache viejo
            const cacheEntries = Array.from(this.cache.entries())
            const oldEntries = cacheEntries.filter(([key, value]) => {
                const timestamp = value.messageTimestamp * 1000 || 0
                return now - timestamp > (24 * 60 * 60 * 1000) // 24 horas
            })
            
            oldEntries.forEach(([key]) => this.cache.delete(key))
            
            // Estadísticas
            if (oldEntries.length > 0) {
                console.log(chalk.cyan(`𒁈 Cache limpiado: ${oldEntries.length} entradas eliminadas`))
            }
            
            this.lastCleanup = now
        } catch (error) {
            console.error(chalk.red('𒁈 Error en limpieza:'), error)
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                           MÉTODOS PÚBLICOS                                  │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    bind(conn) {
        // Vincular store con conexión
        this.store.bind(conn.ev)
        
        // Eventos personalizados
        conn.ev.on('messages.upsert', ({ messages }) => {
            messages.forEach(message => {
                if (message.key?.remoteJid) {
                    this.saveMessage(message.key.remoteJid, message)
                }
            })
        })
        
        conn.ev.on('chats.set', ({ chats }) => {
            chats.forEach(chat => {
                this.store.chats[chat.id] = chat
            })
        })
        
        conn.ev.on('contacts.set', ({ contacts }) => {
            contacts.forEach(contact => {
                this.store.contacts[contact.id] = contact
            })
        })
    }
    
    getStats() {
        return {
            messageCount: this.getMessageCount(),
            chatCount: Object.keys(this.store.chats).length,
            contactCount: Object.keys(this.store.contacts).length,
            cacheSize: this.cache.size,
            lastCleanup: new Date(this.lastCleanup).toLocaleString('es-ES')
        }
    }
    
    clearCache() {
        this.cache.clear()
        console.log(chalk.cyan('𒁈 Cache del store limpiado'))
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                              EXPORTAR STORE                                 │
// ═══════════════════════════════════════════════════════════════════════════════

const store = new AvenixStore()

export default store
