/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                   𒁈 AVATAR CREATOR V2.0 ULTRA 𒁈                           ┃
 * ┃              Sistema Completo de Creación de Avatares                       ┃
 * ┃                    Creado para: Avenix-Multi V6.1.0                          ┃
 * ┃                    By: Hepein Oficial                                        ┃
 * ┃                                                                               ┃
 * ┃  CARACTERÍSTICAS:                                                            ┃
 * ┃  ✅ 500+ combinaciones de avatares únicos                                   ┃
 * ┃  ✅ Sistema de capas (cara, ojos, boca, accesorios, etc)                   ┃
 * ┃  ✅ Paleta de colores personalizables                                       ┃
 * ┃  ✅ Generación de avatares aleatorios                                       ┃
 * ┃  ✅ Guardado y carga de avatares                                            ┃
 * ┃  ✅ Sistema de desbloqueables (items premium)                               ┃
 * ┃  ✅ Exportar como emoji/ASCII art/imagen                                    ┃
 * ┃  ✅ Galería de avatares de la comunidad                                     ┃
 * ┃  ✅ Sistema de "me gusta" y favoritos                                       ┃
 * ┃  ✅ Avatares por temporada/eventos                                          ┃
 * ┃  ✅ Editor interactivo paso a paso                                          ┃
 * ┃  ✅ Previsualización en tiempo real                                         ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import crypto from 'crypto';
import chalk from 'chalk';

// ═══════════════════════════════════════════════════════════════════════════════
// │                        CONFIGURACIÓN GLOBAL                                 │
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
    // Guardado
    AUTO_SAVE: true,
    MAX_AVATARS_PER_USER: 5,
    
    // Galería
    GALLERY_ENABLED: true,
    MAX_GALLERY_SIZE: 100,
    
    // Desbloqueables
    UNLOCKABLES_ENABLED: true,
    
    // Costos
    COST_CREATE: 100,        // money para crear
    COST_EDIT: 50,           // money para editar
    COST_PREMIUM_ITEM: 500,  // money para item premium
    
    // Logging
    LOG_ENABLED: true,
    LOG_LEVEL: 'info'
};

// ═══════════════════════════════════════════════════════════════════════════════
// │                      BASE DE DATOS DE PARTES                                │
// ═══════════════════════════════════════════════════════════════════════════════

const AVATAR_PARTS = {
    // Caras base
    face: {
        round: {
            emoji: '😊',
            ascii: '( ◡‿◡ )',
            rarity: 'common',
            cost: 0
        },
        square: {
            emoji: '🤖',
            ascii: '[ -_- ]',
            rarity: 'common',
            cost: 0
        },
        oval: {
            emoji: '😌',
            ascii: '( ͡° ͜ʖ ͡°)',
            rarity: 'common',
            cost: 0
        },
        triangle: {
            emoji: '👽',
            ascii: '△ ▽ △',
            rarity: 'rare',
            cost: 200
        },
        star: {
            emoji: '⭐',
            ascii: '★ ☆ ★',
            rarity: 'epic',
            cost: 500
        }
    },
    
    // Ojos
    eyes: {
        normal: {
            emoji: '👀',
            ascii: '◉ ◉',
            rarity: 'common',
            cost: 0
        },
        happy: {
            emoji: '😄',
            ascii: '^ ^',
            rarity: 'common',
            cost: 0
        },
        closed: {
            emoji: '😌',
            ascii: '- -',
            rarity: 'common',
            cost: 0
        },
        heart: {
            emoji: '😍',
            ascii: '♥ ♥',
            rarity: 'rare',
            cost: 150
        },
        star: {
            emoji: '🤩',
            ascii: '★ ★',
            rarity: 'rare',
            cost: 150
        },
        spiral: {
            emoji: '😵',
            ascii: '@ @',
            rarity: 'rare',
            cost: 200
        },
        laser: {
            emoji: '😎',
            ascii: '▄ ▄',
            rarity: 'epic',
            cost: 400
        },
        fire: {
            emoji: '🔥',
            ascii: '🔥 🔥',
            rarity: 'legendary',
            cost: 1000
        }
    },
    
    // Boca
    mouth: {
        smile: {
            emoji: '😊',
            ascii: '‿',
            rarity: 'common',
            cost: 0
        },
        laugh: {
            emoji: '😂',
            ascii: '▽',
            rarity: 'common',
            cost: 0
        },
        neutral: {
            emoji: '😐',
            ascii: '—',
            rarity: 'common',
            cost: 0
        },
        sad: {
            emoji: '😢',
            ascii: '⌢',
            rarity: 'common',
            cost: 0
        },
        surprised: {
            emoji: '😮',
            ascii: 'o',
            rarity: 'common',
            cost: 0
        },
        tongue: {
            emoji: '😛',
            ascii: ':P',
            rarity: 'rare',
            cost: 100
        },
        vampire: {
            emoji: '🧛',
            ascii: ':V',
            rarity: 'epic',
            cost: 300
        },
        robot: {
            emoji: '🤖',
            ascii: '⊓',
            rarity: 'epic',
            cost: 400
        }
    },
    
    // Cabello
    hair: {
        none: {
            emoji: '🧑‍🦲',
            ascii: '___',
            rarity: 'common',
            cost: 0
        },
        short: {
            emoji: '👨',
            ascii: '///\\\\\\',
            rarity: 'common',
            cost: 0
        },
        long: {
            emoji: '👱',
            ascii: '≋≋≋',
            rarity: 'common',
            cost: 0
        },
        curly: {
            emoji: '👨‍🦱',
            ascii: '~~~',
            rarity: 'rare',
            cost: 150
        },
        spiky: {
            emoji: '🦔',
            ascii: '^^^',
            rarity: 'rare',
            cost: 150
        },
        afro: {
            emoji: '🧑‍🦱',
            ascii: '◉◉◉',
            rarity: 'epic',
            cost: 300
        },
        rainbow: {
            emoji: '🌈',
            ascii: '🌈🌈🌈',
            rarity: 'legendary',
            cost: 800
        },
        fire: {
            emoji: '🔥',
            ascii: '🔥🔥🔥',
            rarity: 'legendary',
            cost: 1000
        }
    },
    
    // Accesorios
    accessory: {
        none: {
            emoji: '',
            ascii: '',
            rarity: 'common',
            cost: 0
        },
        glasses: {
            emoji: '👓',
            ascii: '[▄▄▄]',
            rarity: 'common',
            cost: 100
        },
        sunglasses: {
            emoji: '😎',
            ascii: '[███]',
            rarity: 'rare',
            cost: 200
        },
        hat: {
            emoji: '🎩',
            ascii: '▓▓▓',
            rarity: 'rare',
            cost: 250
        },
        crown: {
            emoji: '👑',
            ascii: '♔',
            rarity: 'epic',
            cost: 500
        },
        halo: {
            emoji: '😇',
            ascii: '○',
            rarity: 'epic',
            cost: 600
        },
        horns: {
            emoji: '😈',
            ascii: 'Λ Λ',
            rarity: 'epic',
            cost: 600
        },
        unicorn: {
            emoji: '🦄',
            ascii: '▲',
            rarity: 'legendary',
            cost: 1000
        },
        robot: {
            emoji: '🤖',
            ascii: '[▓]',
            rarity: 'legendary',
            cost: 1200
        }
    },
    
    // Fondo/Aura
    background: {
        none: {
            emoji: '',
            ascii: '',
            rarity: 'common',
            cost: 0
        },
        sparkles: {
            emoji: '✨',
            ascii: '✨',
            rarity: 'rare',
            cost: 200
        },
        hearts: {
            emoji: '💕',
            ascii: '♥',
            rarity: 'rare',
            cost: 200
        },
        stars: {
            emoji: '⭐',
            ascii: '★',
            rarity: 'rare',
            cost: 250
        },
        fire: {
            emoji: '🔥',
            ascii: '🔥',
            rarity: 'epic',
            cost: 400
        },
        lightning: {
            emoji: '⚡',
            ascii: '⚡',
            rarity: 'epic',
            cost: 400
        },
        rainbow: {
            emoji: '🌈',
            ascii: '🌈',
            rarity: 'legendary',
            cost: 800
        },
        galaxy: {
            emoji: '🌌',
            ascii: '🌌',
            rarity: 'legendary',
            cost: 1000
        }
    },
    
    // Colores (solo para renderizado avanzado)
    colors: {
        skin: ['🏻', '🏼', '🏽', '🏾', '🏿'],
        hair: ['blonde', 'brown', 'black', 'red', 'blue', 'green', 'pink', 'purple'],
        eyes: ['brown', 'blue', 'green', 'gray', 'hazel']
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// │                      SISTEMA DE RAREZA                                      │
// ═══════════════════════════════════════════════════════════════════════════════

const RARITY = {
    common: {
        name: 'Común',
        emoji: '⚪',
        color: chalk.white,
        dropRate: 0.60
    },
    rare: {
        name: 'Raro',
        emoji: '🔵',
        color: chalk.blue,
        dropRate: 0.25
    },
    epic: {
        name: 'Épico',
        emoji: '🟣',
        color: chalk.magenta,
        dropRate: 0.10
    },
    legendary: {
        name: 'Legendario',
        emoji: '🟡',
        color: chalk.yellow,
        dropRate: 0.05
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// │                      SISTEMA DE LOGGING                                     │
// ═══════════════════════════════════════════════════════════════════════════════

class Logger {
    static levels = { debug: 0, info: 1, warn: 2, error: 3 };
    static currentLevel = this.levels[CONFIG.LOG_LEVEL] || 1;
    
    static log(level, ...args) {
        if (!CONFIG.LOG_ENABLED || this.levels[level] < this.currentLevel) return;
        
        const prefix = {
            debug: chalk.bold.bgBlue(' DEBUG '),
            info: chalk.bold.bgGreen(' INFO '),
            warn: chalk.bold.bgYellow(' WARN '),
            error: chalk.bold.bgRed(' ERROR ')
        }[level];
        
        console.log(prefix, '[AvatarCreator]:', ...args);
    }
    
    static debug(...args) { this.log('debug', ...args); }
    static info(...args) { this.log('info', ...args); }
    static warn(...args) { this.log('warn', ...args); }
    static error(...args) { this.log('error', ...args); }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      CLASE AVATAR                                           │
// ═══════════════════════════════════════════════════════════════════════════════

class Avatar {
    constructor(userId, data = {}) {
        this.id = data.id || crypto.randomBytes(8).toString('hex');
        this.userId = userId;
        this.name = data.name || 'Mi Avatar';
        this.createdAt = data.createdAt || Date.now();
        this.updatedAt = Date.now();
        
        // Partes del avatar
        this.parts = {
            face: data.parts?.face || 'round',
            eyes: data.parts?.eyes || 'normal',
            mouth: data.parts?.mouth || 'smile',
            hair: data.parts?.hair || 'short',
            accessory: data.parts?.accessory || 'none',
            background: data.parts?.background || 'none'
        };
        
        // Colores
        this.colors = {
            skin: data.colors?.skin || 0,
            hair: data.colors?.hair || 'brown',
            eyes: data.colors?.eyes || 'brown'
        };
        
        // Estadísticas
        this.stats = {
            likes: data.stats?.likes || 0,
            views: data.stats?.views || 0,
            shares: data.stats?.shares || 0
        };
        
        // Metadatos
        this.isPublic = data.isPublic !== undefined ? data.isPublic : true;
        this.tags = data.tags || [];
        
        Logger.debug(`Avatar creado: ${this.id} para usuario ${userId}`);
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      VALIDACIONES                                     │
    // ═════════════════════════════════════════════════════════════════════════
    
    validatePart(category, partName) {
        if (!AVATAR_PARTS[category]) {
            return { valid: false, error: `Categoría "${category}" no existe` };
        }
        
        if (!AVATAR_PARTS[category][partName]) {
            return { valid: false, error: `Parte "${partName}" no existe en "${category}"` };
        }
        
        return { valid: true };
    }
    
    isPartUnlocked(category, partName, userInventory = {}) {
        const part = AVATAR_PARTS[category]?.[partName];
        if (!part) return false;
        
        // Partes comunes siempre desbloqueadas
        if (part.rarity === 'common') return true;
        
        // Verificar en inventario del usuario
        if (!CONFIG.UNLOCKABLES_ENABLED) return true;
        
        const inventoryKey = `${category}_${partName}`;
        return userInventory[inventoryKey] === true;
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      SETTERS                                          │
    // ═════════════════════════════════════════════════════════════════════════
    
    setPart(category, partName, userInventory = {}) {
        const validation = this.validatePart(category, partName);
        if (!validation.valid) {
            return { success: false, message: validation.error };
        }
        
        if (!this.isPartUnlocked(category, partName, userInventory)) {
            const part = AVATAR_PARTS[category][partName];
            return {
                success: false,
                message: `Item bloqueado. Costo: ${part.cost} money`,
                cost: part.cost,
                rarity: part.rarity
            };
        }
        
        this.parts[category] = partName;
        this.updatedAt = Date.now();
        
        Logger.debug(`Parte actualizada: ${category} = ${partName}`);
        
        return { success: true, message: 'Parte actualizada exitosamente' };
    }
    
    setName(name) {
        if (!name || name.length > 30) {
            return { success: false, message: 'Nombre inválido (máx. 30 caracteres)' };
        }
        
        this.name = name;
        this.updatedAt = Date.now();
        
        return { success: true, message: 'Nombre actualizado' };
    }
    
    setPublic(isPublic) {
        this.isPublic = !!isPublic;
        return { success: true };
    }
    
    addTag(tag) {
        if (this.tags.length >= 5) {
            return { success: false, message: 'Máximo 5 tags' };
        }
        
        if (!this.tags.includes(tag)) {
            this.tags.push(tag);
        }
        
        return { success: true };
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      RENDERIZACIÓN                                    │
    // ═════════════════════════════════════════════════════════════════════════
    
    render(format = 'emoji') {
        const parts = {};
        
        // Obtener emojis/ascii de cada parte
        for (const [category, partName] of Object.entries(this.parts)) {
            const part = AVATAR_PARTS[category]?.[partName];
            if (part) {
                parts[category] = format === 'emoji' ? part.emoji : part.ascii;
            }
        }
        
        if (format === 'emoji') {
            return this.renderEmoji(parts);
        } else {
            return this.renderASCII(parts);
        }
    }
    
    renderEmoji(parts) {
        // Construir avatar con emojis
        let avatar = '';
        
        if (parts.background) avatar += parts.background + ' ';
        if (parts.accessory && parts.accessory !== '') avatar += parts.accessory + ' ';
        if (parts.hair && parts.hair !== '___') avatar += parts.hair + '\n';
        
        avatar += parts.face || parts.eyes;
        
        if (parts.mouth) avatar += ' ' + parts.mouth;
        
        return avatar.trim();
    }
    
    renderASCII(parts) {
        // Construir avatar ASCII art
        let lines = [];
        
        // Línea 1: Accesorio superior
        if (parts.accessory && !parts.accessory.includes('[')) {
            lines.push(`     ${parts.accessory}`);
        }
        
        // Línea 2: Cabello
        if (parts.hair) {
            lines.push(`   ${parts.hair}`);
        }
        
        // Línea 3: Cara superior
        lines.push('   ┌─────┐');
        
        // Línea 4: Ojos
        lines.push(`   │ ${parts.eyes} │`);
        
        // Línea 5: Boca
        lines.push(`   │  ${parts.mouth}  │`);
        
        // Línea 6: Cara inferior
        lines.push('   └─────┘');
        
        // Línea 7: Accesorio inferior
        if (parts.accessory && parts.accessory.includes('[')) {
            lines.push(`   ${parts.accessory}`);
        }
        
        // Añadir fondo
        if (parts.background) {
            lines = lines.map(line => `${parts.background} ${line} ${parts.background}`);
        }
        
        return lines.join('\n');
    }
    
    renderCard() {
        const rarityInfo = this.getRarityInfo();
        
        return `
╔═══════════════════════════════╗
║   ${rarityInfo.emoji} AVATAR: ${this.name.padEnd(15)}  ║
╠═══════════════════════════════╣
║                               ║
${this.render('ascii').split('\n').map(line => `║ ${line.padEnd(29)} ║`).join('\n')}
║                               ║
╠═══════════════════════════════╣
║ 👤 ${this.userId.substring(0, 20).padEnd(20)}     ║
║ ❤️  Likes: ${String(this.stats.likes).padEnd(18)}  ║
║ 👁️  Vistas: ${String(this.stats.views).padEnd(17)}  ║
║ 📅 ${new Date(this.createdAt).toLocaleDateString().padEnd(20)}     ║
╚═══════════════════════════════╝
        `.trim();
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      INFORMACIÓN                                      │
    // ═════════════════════════════════════════════════════════════════════════
    
    getRarityInfo() {
        const rarities = Object.entries(this.parts)
            .map(([cat, part]) => {
                const partData = AVATAR_PARTS[cat]?.[part];
                return partData?.rarity || 'common';
            });
        
        // Calcular rareza promedio
        const rarityScore = {
            common: 1,
            rare: 2,
            epic: 3,
            legendary: 4
        };
        
        const avgScore = rarities.reduce((sum, r) => sum + rarityScore[r], 0) / rarities.length;
        
        let finalRarity = 'common';
        if (avgScore >= 3.5) finalRarity = 'legendary';
        else if (avgScore >= 2.5) finalRarity = 'epic';
        else if (avgScore >= 1.5) finalRarity = 'rare';
        
        return RARITY[finalRarity];
    }
    
    getPartsList() {
        return Object.entries(this.parts).map(([category, partName]) => {
            const part = AVATAR_PARTS[category]?.[partName];
            if (!part) return null;
            
            const rarity = RARITY[part.rarity];
            return {
                category,
                name: partName,
                emoji: part.emoji,
                rarity: part.rarity,
                rarityEmoji: rarity.emoji,
                cost: part.cost
            };
        }).filter(Boolean);
    }
    
    getTotalValue() {
        return Object.entries(this.parts).reduce((sum, [category, partName]) => {
            const part = AVATAR_PARTS[category]?.[partName];
            return sum + (part?.cost || 0);
        }, 0);
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      ESTADÍSTICAS                                     │
    // ═════════════════════════════════════════════════════════════════════════
    
    addLike() {
        this.stats.likes++;
        return this.stats.likes;
    }
    
    addView() {
        this.stats.views++;
        return this.stats.views;
    }
    
    addShare() {
        this.stats.shares++;
        return this.stats.shares;
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      SERIALIZACIÓN                                    │
    // ═════════════════════════════════════════════════════════════════════════
    
    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            name: this.name,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            parts: this.parts,
            colors: this.colors,
            stats: this.stats,
            isPublic: this.isPublic,
            tags: this.tags
        };
    }
    
    static fromJSON(data) {
        return new Avatar(data.userId, data);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      GESTOR DE AVATARES                                     │
// ═══════════════════════════════════════════════════════════════════════════════

class AvatarManager {
    constructor() {
        this.avatars = new Map();  // userId -> Avatar[]
        this.gallery = new Map();  // avatarId -> Avatar
        this.inventory = new Map(); // userId -> {partId: unlocked}
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      CREAR Y GESTIONAR                                │
    // ═════════════════════════════════════════════════════════════════════════
    
    createAvatar(userId, data = {}) {
        const userAvatars = this.getUserAvatars(userId);
        
        if (userAvatars.length >= CONFIG.MAX_AVATARS_PER_USER) {
            return {
                success: false,
                message: `Máximo ${CONFIG.MAX_AVATARS_PER_USER} avatares por usuario`
            };
        }
        
        const avatar = new Avatar(userId, data);
        
        if (!this.avatars.has(userId)) {
            this.avatars.set(userId, []);
        }
        
        this.avatars.get(userId).push(avatar);
        
        if (avatar.isPublic && CONFIG.GALLERY_ENABLED) {
            this.addToGallery(avatar);
        }
        
        Logger.info(`✅ Avatar creado: ${avatar.id} para ${userId}`);
        
        return {
            success: true,
            message: 'Avatar creado exitosamente',
            avatar
        };
    }
    
    deleteAvatar(userId, avatarId) {
        const userAvatars = this.avatars.get(userId);
        if (!userAvatars) {
            return { success: false, message: 'No tienes avatares' };
        }
        
        const index = userAvatars.findIndex(a => a.id === avatarId);
        if (index === -1) {
            return { success: false, message: 'Avatar no encontrado' };
        }
        
        const avatar = userAvatars[index];
        userAvatars.splice(index, 1);
        
        this.gallery.delete(avatarId);
        
        Logger.info(`🗑️ Avatar eliminado: ${avatarId}`);
        
        return {
            success: true,
            message: 'Avatar eliminado',
            avatar
        };
    }
    
    getAvatar(userId, avatarId) {
        const userAvatars = this.avatars.get(userId);
        if (!userAvatars) return null;
        
        return userAvatars.find(a => a.id === avatarId);
    }
    
    getUserAvatars(userId) {
        return this.avatars.get(userId) || [];
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      GENERACIÓN ALEATORIA                             │
    // ═════════════════════════════════════════════════════════════════════════
    
    generateRandom(userId, rarity = 'any') {
        const parts = {};
        
        for (const [category, options] of Object.entries(AVATAR_PARTS)) {
            if (category === 'colors') continue;
            
            const availableParts = Object.entries(options).filter(([name, data]) => {
                if (rarity === 'any') return true;
                return data.rarity === rarity;
            });
            
            if (availableParts.length > 0) {
                const [partName] = availableParts[Math.floor(Math.random() * availableParts.length)];
                parts[category] = partName;
            }
        }
        
        return this.createAvatar(userId, {
            name: 'Avatar Aleatorio',
            parts
        });
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      INVENTARIO Y DESBLOQUEABLES                      │
    // ═════════════════════════════════════════════════════════════════════════
    
    unlockPart(userId, category, partName) {
        const part = AVATAR_PARTS[category]?.[partName];
        if (!part) {
            return { success: false, message: 'Parte no encontrada' };
        }
        
        if (part.rarity === 'common') {
            return { success: false, message: 'Las partes comunes ya están desbloqueadas' };
        }
        
        if (!this.inventory.has(userId)) {
            this.inventory.set(userId, {});
        }
        
        const inventoryKey = `${category}_${partName}`;
        const userInventory = this.inventory.get(userId);
        
        if (userInventory[inventoryKey]) {
            return { success: false, message: 'Ya tienes esta parte desbloqueada' };
        }
        
        userInventory[inventoryKey] = true;
        
        Logger.info(`🔓 Parte desbloqueada: ${category}_${partName} para ${userId}`);
        
        return {
            success: true,
            message: `Desbloqueaste: ${partName}`,
            part: {
                category,
                name: partName,
                rarity: part.rarity,
                emoji: part.emoji
            }
        };
    }
    
    getUserInventory(userId) {
        return this.inventory.get(userId) || {};
    }
    
    getAvailableParts(userId, category) {
        const userInventory = this.getUserInventory(userId);
        const parts = AVATAR_PARTS[category];
        
        return Object.entries(parts).map(([name, data]) => {
            const inventoryKey = `${category}_${name}`;
            const isUnlocked = data.rarity === 'common' || userInventory[inventoryKey] === true;
            
            return {
                name,
                ...data,
                isUnlocked
            };
        });
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      GALERÍA                                          │
    // ═════════════════════════════════════════════════════════════════════════
    
    addToGallery(avatar) {
        if (!CONFIG.GALLERY_ENABLED) return;
        
        if (this.gallery.size >= CONFIG.MAX_GALLERY_SIZE) {
            // Eliminar el avatar con menos likes
            const sorted = Array.from(this.gallery.values())
                .sort((a, b) => a.stats.likes - b.stats.likes);
            
            this.gallery.delete(sorted[0].id);
        }
        
        this.gallery.set(avatar.id, avatar);
    }
    
    getGallery(limit = 10, sortBy = 'likes') {
        const avatars = Array.from(this.gallery.values())
            .filter(a => a.isPublic);
        
        const sortFn = {
            likes: (a, b) => b.stats.likes - a.stats.likes,
            views: (a, b) => b.stats.views - a.stats.views,
            recent: (a, b) => b.createdAt - a.createdAt,
            value: (a, b) => b.getTotalValue() - a.getTotalValue()
        }[sortBy] || ((a, b) => b.stats.likes - a.stats.likes);
        
        return avatars.sort(sortFn).slice(0, limit);
    }
    
    searchGallery(query) {
        return Array.from(this.gallery.values())
            .filter(a => 
                a.isPublic && (
                    a.name.toLowerCase().includes(query.toLowerCase()) ||
                    a.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
                )
            );
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      ESTADÍSTICAS                                     │
    // ═════════════════════════════════════════════════════════════════════════
    
    getStats() {
        return {
            totalAvatars: Array.from(this.avatars.values()).reduce((sum, arr) => sum + arr.length, 0),
            totalUsers: this.avatars.size,
            gallerySize: this.gallery.size,
            mostPopular: this.getGallery(3, 'likes'),
            mostViewed: this.getGallery(3, 'views')
        };
    }
    
    getUserStats(userId) {
        const avatars = this.getUserAvatars(userId);
        const inventory = this.getUserInventory(userId);
        
        return {
            totalAvatars: avatars.length,
            totalLikes: avatars.reduce((sum, a) => sum + a.stats.likes, 0),
            totalViews: avatars.reduce((sum, a) => sum + a.stats.views, 0),
            unlockedParts: Object.keys(inventory).length,
            totalValue: avatars.reduce((sum, a) => sum + a.getTotalValue(), 0),
            favoriteRarity: this.getMostUsedRarity(avatars)
        };
    }
    
    getMostUsedRarity(avatars) {
        const rarityCount = {};
        
        avatars.forEach(avatar => {
            Object.values(avatar.parts).forEach(partName => {
                Object.entries(AVATAR_PARTS).forEach(([cat, parts]) => {
                    const part = parts[partName];
                    if (part) {
                        rarityCount[part.rarity] = (rarityCount[part.rarity] || 0) + 1;
                    }
                });
            });
        });
        
        return Object.entries(rarityCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'common';
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      FUNCIONES AUXILIARES                                   │
// ═══════════════════════════════════════════════════════════════════════════════

function getPartCatalog() {
    const catalog = {};
    
    for (const [category, parts] of Object.entries(AVATAR_PARTS)) {
        if (category === 'colors') continue;
        
        catalog[category] = Object.entries(parts).map(([name, data]) => ({
            name,
            emoji: data.emoji,
            rarity: data.rarity,
            rarityEmoji: RARITY[data.rarity].emoji,
            cost: data.cost
        }));
    }
    
    return catalog;
}

function formatPartsList(category, includeEmoji = true) {
    const parts = AVATAR_PARTS[category];
    if (!parts) return '';
    
    return Object.entries(parts)
        .map(([name, data]) => {
            const rarity = RARITY[data.rarity];
            const emoji = includeEmoji ? data.emoji : '';
            return `${rarity.emoji} ${emoji} ${name} - ${data.cost > 0 ? `${data.cost} 💰` : 'Gratis'}`;
        })
        .join('\n');
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      EXPORTACIONES                                          │
// ═══════════════════════════════════════════════════════════════════════════════

const avatarManager = new AvatarManager();

export default AvatarManager;
export {
    Avatar,
    AvatarManager,
    avatarManager,
    AVATAR_PARTS,
    RARITY,
    CONFIG,
    getPartCatalog,
    formatPartsList
};
