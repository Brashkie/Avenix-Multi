/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                   𒁈 AVENIX-MULTI V2.0.0 - VALIDATOR.JS 𒁈                 ┃
 * ┃                       Sistema de Validación de Datos                       ┃
 * ┃                         Creado por: Hepein Oficial                         ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import { EventEmitter } from 'events';
import chalk from 'chalk';

// ═══════════════════════════════════════════════════════════════════════════════
// │                      CLASE PRINCIPAL DE VALIDACIÓN                         │
// ═══════════════════════════════════════════════════════════════════════════════

export class DataValidator extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Configuración de validación
            strictMode: config.strictMode || false,
            allowUnknownFields: config.allowUnknownFields !== false,
            enableSanitization: config.enableSanitization !== false,
            enableLogging: config.enableLogging !== false,
            
            // Configuración de límites
            maxStringLength: config.maxStringLength || 10000,
            maxArrayLength: config.maxArrayLength || 1000,
            maxObjectDepth: config.maxObjectDepth || 10,
            maxNumberValue: config.maxNumberValue || Number.MAX_SAFE_INTEGER,
            minNumberValue: config.minNumberValue || Number.MIN_SAFE_INTEGER,
            
            // Configuración de tipos de archivo
            allowedMimeTypes: config.allowedMimeTypes || [
                'image/jpeg', 'image/png', 'image/gif', 'image/webp',
                'video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav',
                'application/pdf', 'text/plain'
            ],
            maxFileSize: config.maxFileSize || 50 * 1024 * 1024, // 50MB
            
            // Patrones comunes
            patterns: {
                email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                phone: /^\+?[\d\s\-\(\)]{7,15}$/,
                url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
                whatsappId: /^\d{10,15}@s\.whatsapp\.net$/,
                groupId: /^\d{10,15}-\d{10}@g\.us$/,
                uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
                alphanumeric: /^[a-zA-Z0-9]+$/,
                slug: /^[a-z0-9-]+$/,
                hexColor: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
                ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
                ipv6: /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/
            },
            
            ...config
        };
        
        // Esquemas de validación predefinidos
        this.schemas = new Map();
        
        // Estadísticas de validación
        this.stats = {
            validations: 0,
            passed: 0,
            failed: 0,
            sanitized: 0,
            errors: new Map()
        };
        
        this.setupDefaultSchemas();
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                         ESQUEMAS PREDEFINIDOS                          │
    // ═══════════════════════════════════════════════════════════════════════════
    
    setupDefaultSchemas() {
        // Esquema para usuarios
        this.addSchema('user', {
            id: { type: 'string', required: true, pattern: 'whatsappId' },
            name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
            age: { type: 'number', min: 0, max: 150, required: false },
            email: { type: 'string', pattern: 'email', required: false },
            phone: { type: 'string', pattern: 'phone', required: false },
            level: { type: 'number', min: 0, default: 0 },
            exp: { type: 'number', min: 0, default: 0 },
            money: { type: 'number', min: 0, default: 1000 },
            premium: { type: 'boolean', default: false },
            banned: { type: 'boolean', default: false },
            warn: { type: 'number', min: 0, max: 10, default: 0 },
            registered: { type: 'boolean', default: false },
            regTime: { type: 'number', default: -1 },
            afk: { type: 'number', default: -1 },
            afkReason: { type: 'string', maxLength: 500, default: '' },
            lastSeen: { type: 'number', default: 0 },
            role: { type: 'string', enum: ['Novato', 'Aprendiz', 'Intermedio', 'Avanzado', 'Experto', 'Élite'], default: 'Novato' },
            autolevelup: { type: 'boolean', default: true }
        });
        
        // Esquema para grupos
        this.addSchema('group', {
            id: { type: 'string', required: true, pattern: 'groupId' },
            name: { type: 'string', required: true, maxLength: 200 },
            description: { type: 'string', maxLength: 1000, required: false },
            welcome: { type: 'boolean', default: false },
            antiLink: { type: 'boolean', default: false },
            antiSpam: { type: 'boolean', default: false },
            antiToxic: { type: 'boolean', default: false },
            detect: { type: 'boolean', default: false },
            nsfw: { type: 'boolean', default: false },
            game: { type: 'boolean', default: true },
            rpg: { type: 'boolean', default: true },
            modoadmin: { type: 'boolean', default: false },
            expired: { type: 'number', default: 0 },
            isBanned: { type: 'boolean', default: false }
        });
        
        // Esquema para comandos
        this.addSchema('command', {
            name: { type: 'string', required: true, pattern: 'alphanumeric', minLength: 1, maxLength: 50 },
            args: { type: 'array', maxLength: 20, required: false },
            text: { type: 'string', maxLength: 4000, required: false },
            sender: { type: 'string', required: true, pattern: 'whatsappId' },
            chat: { type: 'string', required: true },
            isGroup: { type: 'boolean', required: true },
            quoted: { type: 'object', required: false },
            mentionedJid: { type: 'array', required: false }
        });
        
        // Esquema para archivos
        this.addSchema('file', {
            filename: { type: 'string', required: true, maxLength: 255 },
            mimetype: { type: 'string', required: true, enum: this.config.allowedMimeTypes },
            size: { type: 'number', required: true, min: 1, max: this.config.maxFileSize },
            buffer: { type: 'buffer', required: false },
            url: { type: 'string', pattern: 'url', required: false }
        });
        
        // Esquema para configuraciones
        this.addSchema('config', {
            botname: { type: 'string', required: true, minLength: 1, maxLength: 100 },
            prefix: { type: 'string', required: true, minLength: 1, maxLength: 5 },
            owner: { type: 'array', required: true, minLength: 1 },
            timezone: { type: 'string', required: true },
            language: { type: 'string', enum: ['es', 'en', 'pt', 'fr'], default: 'es' },
            maxUsers: { type: 'number', min: 1, max: 100000, default: 10000 },
            autoread: { type: 'boolean', default: false },
            self: { type: 'boolean', default: false },
            restrict: { type: 'boolean', default: false }
        });
        
        // Esquema para mensajes
        this.addSchema('message', {
            text: { type: 'string', maxLength: this.config.maxStringLength },
            type: { type: 'string', enum: ['text', 'image', 'video', 'audio', 'document', 'sticker'] },
            from: { type: 'string', required: true, pattern: 'whatsappId' },
            to: { type: 'string', required: true },
            timestamp: { type: 'number', required: true },
            id: { type: 'string', required: true },
            key: { type: 'object', required: true }
        });
        
        // Esquema para eventos de analytics
        this.addSchema('analytics_event', {
            type: { type: 'string', required: true, enum: ['command', 'user_activity', 'group_activity', 'performance', 'error', 'system'] },
            timestamp: { type: 'number', required: true },
            data: { type: 'object', required: true },
            userId: { type: 'string', pattern: 'whatsappId', required: false },
            groupId: { type: 'string', pattern: 'groupId', required: false }
        });
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                       GESTIÓN DE ESQUEMAS                              │
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Agregar esquema de validación
     */
    addSchema(name, schema) {
        this.schemas.set(name, {
            ...schema,
            createdAt: Date.now()
        });
        
        this.emit('schemaAdded', { name, schema });
        return true;
    }
    
    /**
     * Obtener esquema
     */
    getSchema(name) {
        return this.schemas.get(name);
    }
    
    /**
     * Actualizar esquema
     */
    updateSchema(name, updates) {
        const existing = this.schemas.get(name);
        if (!existing) {
            throw new Error(`Esquema no encontrado: ${name}`);
        }
        
        const updated = {
            ...existing,
            ...updates,
            updatedAt: Date.now()
        };
        
        this.schemas.set(name, updated);
        this.emit('schemaUpdated', { name, schema: updated });
        return true;
    }
    
    /**
     * Eliminar esquema
     */
    removeSchema(name) {
        const deleted = this.schemas.delete(name);
        if (deleted) {
            this.emit('schemaRemoved', { name });
        }
        return deleted;
    }
    
    /**
     * Listar esquemas
     */
    listSchemas() {
        return Array.from(this.schemas.keys());
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                         VALIDACIÓN PRINCIPAL                           │
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Validar datos contra un esquema
     */
    validate(data, schemaName, options = {}) {
        this.stats.validations++;
        
        try {
            const schema = this.getSchema(schemaName);
            if (!schema) {
                throw new Error(`Esquema no encontrado: ${schemaName}`);
            }
            
            const result = this.validateObject(data, schema, options);
            
            if (result.valid) {
                this.stats.passed++;
            } else {
                this.stats.failed++;
                this.updateErrorStats(result.errors);
            }
            
            if (this.config.enableLogging && !result.valid) {
                this.log(`Validación fallida para esquema ${schemaName}:`, result.errors);
            }
            
            this.emit('validation', { schemaName, data, result });
            return result;
            
        } catch (error) {
            this.stats.failed++;
            this.updateErrorStats([error.message]);
            
            return {
                valid: false,
                errors: [error.message],
                data: null,
                sanitized: false
            };
        }
    }
    
    /**
     * Validar objeto contra esquema
     */
    validateObject(data, schema, options = {}) {
        const errors = [];
        const sanitized = {};
        let wasSanitized = false;
        
        // Verificar que data sea un objeto
        if (!data || typeof data !== 'object') {
            return {
                valid: false,
                errors: ['Los datos deben ser un objeto'],
                data: null,
                sanitized: false
            };
        }
        
        // Validar cada campo del esquema
        for (const [fieldName, fieldSchema] of Object.entries(schema)) {
            if (fieldName === 'createdAt' || fieldName === 'updatedAt') continue;
            
            const fieldValue = data[fieldName];
            const fieldResult = this.validateField(fieldValue, fieldSchema, fieldName, options);
            
            if (!fieldResult.valid) {
                errors.push(...fieldResult.errors);
            } else {
                sanitized[fieldName] = fieldResult.value;
                if (fieldResult.sanitized) {
                    wasSanitized = true;
                }
            }
        }
        
        // Verificar campos desconocidos
        if (!this.config.allowUnknownFields) {
            for (const fieldName of Object.keys(data)) {
                if (!(fieldName in schema)) {
                    errors.push(`Campo desconocido: ${fieldName}`);
                }
            }
        } else {
            // Agregar campos no definidos en el esquema
            for (const [fieldName, fieldValue] of Object.entries(data)) {
                if (!(fieldName in schema)) {
                    sanitized[fieldName] = fieldValue;
                }
            }
        }
        
        if (wasSanitized) {
            this.stats.sanitized++;
        }
        
        return {
            valid: errors.length === 0,
            errors,
            data: sanitized,
            sanitized: wasSanitized
        };
    }
    
    /**
     * Validar campo individual
     */
    validateField(value, fieldSchema, fieldName, options = {}) {
        const errors = [];
        let sanitized = value;
        let wasSanitized = false;
        
        // Verificar campo requerido
        if (fieldSchema.required && (value === undefined || value === null)) {
            return {
                valid: false,
                errors: [`Campo requerido: ${fieldName}`],
                value: fieldSchema.default !== undefined ? fieldSchema.default : null,
                sanitized: fieldSchema.default !== undefined
            };
        }
        
        // Usar valor por defecto si no está presente
        if (value === undefined || value === null) {
            if (fieldSchema.default !== undefined) {
                return {
                    valid: true,
                    errors: [],
                    value: fieldSchema.default,
                    sanitized: true
                };
            }
            return {
                valid: true,
                errors: [],
                value: null,
                sanitized: false
            };
        }
        
        // Validar tipo
        const typeResult = this.validateType(value, fieldSchema.type, fieldName);
        if (!typeResult.valid) {
            errors.push(...typeResult.errors);
        } else {
            sanitized = typeResult.value;
            if (typeResult.sanitized) wasSanitized = true;
        }
        
        // Validaciones específicas por tipo
        if (typeResult.valid) {
            switch (fieldSchema.type) {
                case 'string':
                    const stringResult = this.validateString(sanitized, fieldSchema, fieldName);
                    if (!stringResult.valid) {
                        errors.push(...stringResult.errors);
                    } else {
                        sanitized = stringResult.value;
                        if (stringResult.sanitized) wasSanitized = true;
                    }
                    break;
                    
                case 'number':
                    const numberResult = this.validateNumber(sanitized, fieldSchema, fieldName);
                    if (!numberResult.valid) {
                        errors.push(...numberResult.errors);
                    }
                    break;
                    
                case 'array':
                    const arrayResult = this.validateArray(sanitized, fieldSchema, fieldName);
                    if (!arrayResult.valid) {
                        errors.push(...arrayResult.errors);
                    }
                    break;
                    
                case 'object':
                    const objectResult = this.validateNestedObject(sanitized, fieldSchema, fieldName);
                    if (!objectResult.valid) {
                        errors.push(...objectResult.errors);
                    }
                    break;
            }
        }
        
        return {
            valid: errors.length === 0,
            errors,
            value: sanitized,
            sanitized: wasSanitized
        };
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                      VALIDACIONES POR TIPO                             │
    // ═══════════════════════════════════════════════════════════════════════════
    
    validateType(value, expectedType, fieldName) {
        let sanitized = value;
        let wasSanitized = false;
        
        switch (expectedType) {
            case 'string':
                if (typeof value !== 'string') {
                    // Intentar convertir a string
                    if (this.config.enableSanitization && (typeof value === 'number' || typeof value === 'boolean')) {
                        sanitized = String(value);
                        wasSanitized = true;
                    } else {
                        return {
                            valid: false,
                            errors: [`${fieldName} debe ser una cadena de texto`],
                            value: null,
                            sanitized: false
                        };
                    }
                }
                break;
                
            case 'number':
                if (typeof value !== 'number') {
                    // Intentar convertir a número
                    if (this.config.enableSanitization && typeof value === 'string' && !isNaN(value)) {
                        sanitized = Number(value);
                        wasSanitized = true;
                    } else {
                        return {
                            valid: false,
                            errors: [`${fieldName} debe ser un número`],
                            value: null,
                            sanitized: false
                        };
                    }
                }
                
                if (isNaN(sanitized) || !isFinite(sanitized)) {
                    return {
                        valid: false,
                        errors: [`${fieldName} debe ser un número válido`],
                        value: null,
                        sanitized: false
                    };
                }
                break;
                
            case 'boolean':
                if (typeof value !== 'boolean') {
                    // Intentar convertir a boolean
                    if (this.config.enableSanitization) {
                        if (value === 'true' || value === '1' || value === 1) {
                            sanitized = true;
                            wasSanitized = true;
                        } else if (value === 'false' || value === '0' || value === 0) {
                            sanitized = false;
                            wasSanitized = true;
                        } else {
                            return {
                                valid: false,
                                errors: [`${fieldName} debe ser un valor booleano`],
                                value: null,
                                sanitized: false
                            };
                        }
                    } else {
                        return {
                            valid: false,
                            errors: [`${fieldName} debe ser un valor booleano`],
                            value: null,
                            sanitized: false
                        };
                    }
                }
                break;
                
            case 'array':
                if (!Array.isArray(value)) {
                    return {
                        valid: false,
                        errors: [`${fieldName} debe ser un array`],
                        value: null,
                        sanitized: false
                    };
                }
                break;
                
            case 'object':
                if (typeof value !== 'object' || value === null || Array.isArray(value)) {
                    return {
                        valid: false,
                        errors: [`${fieldName} debe ser un objeto`],
                        value: null,
                        sanitized: false
                    };
                }
                break;
                
            case 'buffer':
                if (!Buffer.isBuffer(value)) {
                    return {
                        valid: false,
                        errors: [`${fieldName} debe ser un Buffer`],
                        value: null,
                        sanitized: false
                    };
                }
                break;
                
            default:
                return {
                    valid: false,
                    errors: [`Tipo desconocido: ${expectedType}`],
                    value: null,
                    sanitized: false
                };
        }
        
        return {
            valid: true,
            errors: [],
            value: sanitized,
            sanitized: wasSanitized
        };
    }
    
    validateString(value, fieldSchema, fieldName) {
        const errors = [];
        let sanitized = value;
        let wasSanitized = false;
        
        // Sanitizar string si está habilitado
        if (this.config.enableSanitization) {
            const originalValue = sanitized;
            sanitized = this.sanitizeString(sanitized);
            if (sanitized !== originalValue) {
                wasSanitized = true;
            }
        }
        
        // Validar longitud mínima
        if (fieldSchema.minLength !== undefined && sanitized.length < fieldSchema.minLength) {
            errors.push(`${fieldName} debe tener al menos ${fieldSchema.minLength} caracteres`);
        }
        
        // Validar longitud máxima
        if (fieldSchema.maxLength !== undefined && sanitized.length > fieldSchema.maxLength) {
            if (this.config.enableSanitization) {
                sanitized = sanitized.slice(0, fieldSchema.maxLength);
                wasSanitized = true;
            } else {
                errors.push(`${fieldName} no puede tener más de ${fieldSchema.maxLength} caracteres`);
            }
        }
        
        // Validar patrón
        if (fieldSchema.pattern) {
            const pattern = typeof fieldSchema.pattern === 'string' ? 
                this.config.patterns[fieldSchema.pattern] : fieldSchema.pattern;
            
            if (pattern && !pattern.test(sanitized)) {
                errors.push(`${fieldName} no cumple con el formato requerido`);
            }
        }
        
        // Validar enum
        if (fieldSchema.enum && !fieldSchema.enum.includes(sanitized)) {
            errors.push(`${fieldName} debe ser uno de: ${fieldSchema.enum.join(', ')}`);
        }
        
        return {
            valid: errors.length === 0,
            errors,
            value: sanitized,
            sanitized: wasSanitized
        };
    }
    
    validateNumber(value, fieldSchema, fieldName) {
        const errors = [];
        
        // Validar rango mínimo
        if (fieldSchema.min !== undefined && value < fieldSchema.min) {
            errors.push(`${fieldName} debe ser mayor o igual a ${fieldSchema.min}`);
        }
        
        // Validar rango máximo
        if (fieldSchema.max !== undefined && value > fieldSchema.max) {
            errors.push(`${fieldName} debe ser menor o igual a ${fieldSchema.max}`);
        }
        
        // Validar que sea entero si se especifica
        if (fieldSchema.integer && !Number.isInteger(value)) {
            errors.push(`${fieldName} debe ser un número entero`);
        }
        
        // Validar que sea positivo si se especifica
        if (fieldSchema.positive && value <= 0) {
            errors.push(`${fieldName} debe ser un número positivo`);
        }
        
        return {
            valid: errors.length === 0,
            errors,
            value: value,
            sanitized: false
        };
    }
    
    validateArray(value, fieldSchema, fieldName) {
        const errors = [];
        
        // Validar longitud mínima
        if (fieldSchema.minLength !== undefined && value.length < fieldSchema.minLength) {
            errors.push(`${fieldName} debe tener al menos ${fieldSchema.minLength} elementos`);
        }
        
        // Validar longitud máxima
        if (fieldSchema.maxLength !== undefined && value.length > fieldSchema.maxLength) {
            errors.push(`${fieldName} no puede tener más de ${fieldSchema.maxLength} elementos`);
        }
        
        // Validar elementos del array si se especifica el tipo
        if (fieldSchema.items) {
            for (let i = 0; i < value.length; i++) {
                const itemResult = this.validateField(value[i], fieldSchema.items, `${fieldName}[${i}]`);
                if (!itemResult.valid) {
                    errors.push(...itemResult.errors);
                }
            }
        }
        
        return {
            valid: errors.length === 0,
            errors,
            value: value,
            sanitized: false
        };
    }
    
    validateNestedObject(value, fieldSchema, fieldName) {
        const errors = [];
        
        // Si hay un esquema anidado, validarlo
        if (fieldSchema.schema) {
            const nestedResult = this.validateObject(value, fieldSchema.schema);
            if (!nestedResult.valid) {
                errors.push(...nestedResult.errors.map(error => `${fieldName}.${error}`));
            }
        }
        
        return {
            valid: errors.length === 0,
            errors,
            value: value,
            sanitized: false
        };
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                         VALIDACIONES ESPECÍFICAS                       │
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Validar usuario de WhatsApp
     */
    validateWhatsAppUser(userData) {
        return this.validate(userData, 'user');
    }
    
    /**
     * Validar grupo de WhatsApp
     */
    validateWhatsAppGroup(groupData) {
        return this.validate(groupData, 'group');
    }
    
    /**
     * Validar comando
     */
    validateCommand(commandData) {
        return this.validate(commandData, 'command');
    }
    
    /**
     * Validar archivo
     */
    validateFile(fileData) {
        return this.validate(fileData, 'file');
    }
    
    /**
     * Validar configuración
     */
    validateConfig(configData) {
        return this.validate(configData, 'config');
    }
    
    /**
     * Validar mensaje
     */
    validateMessage(messageData) {
        return this.validate(messageData, 'message');
    }
    
    /**
     * Validar evento de analytics
     */
    validateAnalyticsEvent(eventData) {
        return this.validate(eventData, 'analytics_event');
    }
    
    /**
     * Validar ID de WhatsApp
     */
    validateWhatsAppId(id) {
        if (!id || typeof id !== 'string') {
            return { valid: false, error: 'ID debe ser una cadena de texto' };
        }
        
        const userPattern = this.config.patterns.whatsappId;
        const groupPattern = this.config.patterns.groupId;
        
        if (userPattern.test(id) || groupPattern.test(id)) {
            return { valid: true, type: userPattern.test(id) ? 'user' : 'group' };
        }
        
        return { valid: false, error: 'Formato de ID de WhatsApp inválido' };
    }
    
    /**
     * Validar email
     */
    validateEmail(email) {
        if (!email || typeof email !== 'string') {
            return { valid: false, error: 'Email debe ser una cadena de texto' };
        }
        
        const sanitized = this.sanitizeString(email).toLowerCase();
        
        if (this.config.patterns.email.test(sanitized)) {
            return { valid: true, email: sanitized };
        }
        
        return { valid: false, error: 'Formato de email inválido' };
    }
    
    /**
     * Validar URL
     */
    validateUrl(url) {
        if (!url || typeof url !== 'string') {
            return { valid: false, error: 'URL debe ser una cadena de texto' };
        }
        
        const sanitized = this.sanitizeString(url);
        
        if (this.config.patterns.url.test(sanitized)) {
            return { valid: true, url: sanitized };
        }
        
        return { valid: false, error: 'Formato de URL inválido' };
    }
    
    /**
     * Validar número de teléfono
     */
    validatePhone(phone) {
        if (!phone || typeof phone !== 'string') {
            return { valid: false, error: 'Teléfono debe ser una cadena de texto' };
        }
        
        const sanitized = phone.replace(/\s+/g, '');
        
        if (this.config.patterns.phone.test(sanitized)) {
            return { valid: true, phone: sanitized };
        }
        
        return { valid: false, error: 'Formato de teléfono inválido' };
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                           SANITIZACIÓN                                 │
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Sanitizar string
     */
    sanitizeString(str) {
        if (typeof str !== 'string') return str;
        
        return str
            .trim()
            .replace(/\s+/g, ' ') // Normalizar espacios
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remover caracteres de control
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remover scripts
            .replace(/javascript:/gi, '') // Remover javascript:
            .replace(/on\w+\s*=/gi, '') // Remover event handlers
            .slice(0, this.config.maxStringLength); // Limitar longitud
    }
    
    /**
     * Sanitizar objeto recursivamente
     */
    sanitizeObject(obj, depth = 0) {
        if (depth > this.config.maxObjectDepth) {
            return {};
        }
        
        if (!obj || typeof obj !== 'object') return obj;
        
        if (Array.isArray(obj)) {
            return obj.slice(0, this.config.maxArrayLength).map(item => 
                this.sanitizeObject(item, depth + 1)
            );
        }
        
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            const sanitizedKey = this.sanitizeString(key);
            
            if (typeof value === 'string') {
                sanitized[sanitizedKey] = this.sanitizeString(value);
            } else if (typeof value === 'object') {
                sanitized[sanitizedKey] = this.sanitizeObject(value, depth + 1);
            } else {
                sanitized[sanitizedKey] = value;
            }
        }
        
        return sanitized;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                         FUNCIONES AUXILIARES                           │
    // ═══════════════════════════════════════════════════════════════════════════
    
    updateErrorStats(errors) {
        for (const error of errors) {
            if (!this.stats.errors.has(error)) {
                this.stats.errors.set(error, 0);
            }
            this.stats.errors.set(error, this.stats.errors.get(error) + 1);
        }
    }
    
    log(message, data = null) {
        if (this.config.enableLogging) {
            console.log(chalk.yellow(`𒁈 [VALIDATOR] ${message}`));
            if (data) {
                console.log(chalk.gray('   Detalles:'), data);
            }
        }
    }
    
    /**
     * Obtener estadísticas de validación
     */
    getStats() {
        return {
            ...this.stats,
            successRate: this.stats.validations > 0 ? 
                (this.stats.passed / this.stats.validations * 100).toFixed(2) : 0,
            errors: Object.fromEntries(this.stats.errors),
            schemas: this.schemas.size
        };
    }
    
    /**
     * Resetear estadísticas
     */
    resetStats() {
        this.stats = {
            validations: 0,
            passed: 0,
            failed: 0,
            sanitized: 0,
            errors: new Map()
        };
    }
    
    /**
     * Validación masiva
     */
    validateBatch(dataArray, schemaName, options = {}) {
        const results = [];
        const summary = {
            total: dataArray.length,
            passed: 0,
            failed: 0,
            errors: []
        };
        
        for (let i = 0; i < dataArray.length; i++) {
            const result = this.validate(dataArray[i], schemaName, options);
            results.push({
                index: i,
                ...result
            });
            
            if (result.valid) {
                summary.passed++;
            } else {
                summary.failed++;
                summary.errors.push({
                    index: i,
                    errors: result.errors
                });
            }
        }
        
        return {
            results,
            summary
        };
    }
    
    /**
     * Crear validador personalizado
     */
    createCustomValidator(name, validatorFunction) {
        this[`validate${name}`] = validatorFunction.bind(this);
        this.emit('customValidatorAdded', { name });
        return true;
    }
    
    /**
     * Exportar esquemas
     */
    exportSchemas() {
        return Object.fromEntries(this.schemas);
    }
    
    /**
     * Importar esquemas
     */
    importSchemas(schemas) {
        for (const [name, schema] of Object.entries(schemas)) {
            this.addSchema(name, schema);
        }
        return true;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                         INSTANCIA GLOBAL                                   │
// ═══════════════════════════════════════════════════════════════════════════════

export const validator = new DataValidator({
    strictMode: false,
    allowUnknownFields: true,
    enableSanitization: true,
    enableLogging: false,
    maxStringLength: 10000,
    maxArrayLength: 1000,
    maxObjectDepth: 10
});

export default validator;
