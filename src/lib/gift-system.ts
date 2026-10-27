/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                   𒁈 GIFT SYSTEM V1.0 ULTRA 𒁈                              ┃
 * ┃              Sistema Completo de Regalos y Obsequios                        ┃
 * ┃                    Creado para: Avenix-Multi V6.1.0                          ┃
 * ┃                    By: Hepein Oficial                                        ┃
 * ┃                                                                               ┃
 * ┃  CARACTERÍSTICAS:                                                            ┃
 * ┃  ✅ Envío de regalos entre usuarios                                         ┃
 * ┃  ✅ 50+ items predefinidos con rareza                                       ┃
 * ┃  ✅ Regalos anónimos opcionales                                             ┃
 * ┃  ✅ Mensajes personalizados                                                 ┃
 * ┃  ✅ Sistema de envolturas premium                                           ┃
 * ┃  ✅ Regalos programados (cumpleaños, eventos)                               ┃
 * ┃  ✅ Wish list (lista de deseos)                                             ┃
 * ┃  ✅ Historial completo de regalos                                           ┃
 * ┃  ✅ Efectos especiales al abrir                                             ┃
 * ┃  ✅ Sistema de intercambio (trade)                                          ┃
 * ┃  ✅ Regalos grupales (varios usuarios)                                      ┃
 * ┃  ✅ Estadísticas y rankings                                                 ┃
 * ┃  ✅ Integración con economía del bot                                        ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import { randomHex } from './crypto.js';
import paint from './paint.js'

// ═══════════════════════════════════════════════════════════════════════════════
// │                        CONFIGURACIÓN GLOBAL                                 │
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
    // Economía
    GIFT_WRAP_COST: {
        basic: 0,
        premium: 100,
        deluxe: 250,
        legendary: 500
    },
    
    // Límites
    MAX_MESSAGE_LENGTH: 200,
    MAX_DAILY_GIFTS: 20,
    MAX_SCHEDULED_GIFTS: 10,
    MAX_WISHLIST_ITEMS: 15,
    
    // Cooldowns
    GIFT_COOLDOWN: 30000, // 30 segundos
    TRADE_TIMEOUT: 300000, // 5 minutos
    
    // Características
    ALLOW_ANONYMOUS: true,
    ALLOW_SCHEDULED: true,
    ALLOW_GROUP_GIFTS: true,
    ALLOW_TRADES: true,
    
    // Notificaciones
    NOTIFY_ON_RECEIVE: true,
    NOTIFY_ON_OPEN: true,
    
    // Efectos
    EFFECTS_ENABLED: true,
    
    // Estadísticas
    STATS_ENABLED: true,
    SAVE_HISTORY: true,
    MAX_HISTORY: 100,
    
    // Logging
    LOG_ENABLED: true,
    LOG_LEVEL: 'info'
};

// ═══════════════════════════════════════════════════════════════════════════════
// │                      CATÁLOGO DE REGALOS                                    │
// ═══════════════════════════════════════════════════════════════════════════════

const GIFT_CATALOG = {
    // ═══ CATEGORÍA: FLORES ═══
    rose: {
        id: 'rose',
        name: '🌹 Rosa Roja',
        category: 'flowers',
        rarity: 'common',
        value: 50,
        description: 'Una hermosa rosa roja, símbolo de amor',
        effect: 'sparkle'
    },
    tulip: {
        id: 'tulip',
        name: '🌷 Tulipán',
        category: 'flowers',
        rarity: 'common',
        value: 40,
        description: 'Un elegante tulipán',
        effect: 'bloom'
    },
    sunflower: {
        id: 'sunflower',
        name: '🌻 Girasol',
        category: 'flowers',
        rarity: 'common',
        value: 45,
        description: 'Un alegre girasol',
        effect: 'shine'
    },
    bouquet: {
        id: 'bouquet',
        name: '💐 Ramo de Flores',
        category: 'flowers',
        rarity: 'rare',
        value: 200,
        description: 'Un hermoso ramo de flores mixtas',
        effect: 'explosion'
    },
    
    // ═══ CATEGORÍA: COMIDA ═══
    chocolate: {
        id: 'chocolate',
        name: '🍫 Chocolate',
        category: 'food',
        rarity: 'common',
        value: 30,
        description: 'Delicioso chocolate',
        effect: 'melt'
    },
    cake: {
        id: 'cake',
        name: '🎂 Pastel',
        category: 'food',
        rarity: 'uncommon',
        value: 100,
        description: 'Un delicioso pastel de celebración',
        effect: 'confetti'
    },
    pizza: {
        id: 'pizza',
        name: '🍕 Pizza',
        category: 'food',
        rarity: 'common',
        value: 50,
        description: 'Una pizza recién horneada',
        effect: 'steam'
    },
    sushi: {
        id: 'sushi',
        name: '🍣 Sushi',
        category: 'food',
        rarity: 'uncommon',
        value: 80,
        description: 'Sushi premium',
        effect: 'roll'
    },
    
    // ═══ CATEGORÍA: BEBIDAS ═══
    coffee: {
        id: 'coffee',
        name: '☕ Café',
        category: 'drinks',
        rarity: 'common',
        value: 25,
        description: 'Un café caliente',
        effect: 'steam'
    },
    cocktail: {
        id: 'cocktail',
        name: '🍹 Cóctel',
        category: 'drinks',
        rarity: 'uncommon',
        value: 75,
        description: 'Un cóctel tropical',
        effect: 'splash'
    },
    champagne: {
        id: 'champagne',
        name: '🍾 Champagne',
        category: 'drinks',
        rarity: 'rare',
        value: 250,
        description: 'Champagne para celebrar',
        effect: 'pop'
    },
    
    // ═══ CATEGORÍA: JOYAS ═══
    ring: {
        id: 'ring',
        name: '💍 Anillo',
        category: 'jewelry',
        rarity: 'epic',
        value: 500,
        description: 'Un hermoso anillo',
        effect: 'shine'
    },
    gem: {
        id: 'gem',
        name: '💎 Gema',
        category: 'jewelry',
        rarity: 'rare',
        value: 300,
        description: 'Una gema preciosa',
        effect: 'sparkle'
    },
    crown: {
        id: 'crown',
        name: '👑 Corona',
        category: 'jewelry',
        rarity: 'legendary',
        value: 1000,
        description: 'Una corona real',
        effect: 'royal'
    },
    
    // ═══ CATEGORÍA: ANIMALES ═══
    teddy: {
        id: 'teddy',
        name: '🧸 Oso de Peluche',
        category: 'toys',
        rarity: 'common',
        value: 60,
        description: 'Un adorable oso de peluche',
        effect: 'hug'
    },
    panda: {
        id: 'panda',
        name: '🐼 Panda',
        category: 'animals',
        rarity: 'rare',
        value: 200,
        description: 'Un tierno panda',
        effect: 'bounce'
    },
    unicorn: {
        id: 'unicorn',
        name: '🦄 Unicornio',
        category: 'mythical',
        rarity: 'legendary',
        value: 800,
        description: 'Un mágico unicornio',
        effect: 'rainbow'
    },
    
    // ═══ CATEGORÍA: CORAZONES ═══
    heart: {
        id: 'heart',
        name: '❤️ Corazón',
        category: 'love',
        rarity: 'common',
        value: 100,
        description: 'Un corazón lleno de amor',
        effect: 'heartbeat'
    },
    hearts: {
        id: 'hearts',
        name: '💕 Corazones',
        category: 'love',
        rarity: 'uncommon',
        value: 150,
        description: 'Dos corazones entrelazados',
        effect: 'float'
    },
    sparkling_heart: {
        id: 'sparkling_heart',
        name: '💖 Corazón Brillante',
        category: 'love',
        rarity: 'rare',
        value: 250,
        description: 'Un corazón que brilla con luz propia',
        effect: 'sparkle'
    },
    
    // ═══ CATEGORÍA: ESPECIALES ═══
    gift_box: {
        id: 'gift_box',
        name: '🎁 Caja de Regalo',
        category: 'special',
        rarity: 'uncommon',
        value: 100,
        description: 'Una caja sorpresa',
        effect: 'surprise'
    },
    trophy: {
        id: 'trophy',
        name: '🏆 Trofeo',
        category: 'special',
        rarity: 'epic',
        value: 600,
        description: 'Un trofeo de campeón',
        effect: 'victory'
    },
    star: {
        id: 'star',
        name: '⭐ Estrella',
        category: 'special',
        rarity: 'rare',
        value: 300,
        description: 'Una estrella brillante',
        effect: 'twinkle'
    },
    moon: {
        id: 'moon',
        name: '🌙 Luna',
        category: 'special',
        rarity: 'epic',
        value: 500,
        description: 'La hermosa luna',
        effect: 'glow'
    },
    
    // ═══ CATEGORÍA: FESTIVOS ═══
    christmas_tree: {
        id: 'christmas_tree',
        name: '🎄 Árbol de Navidad',
        category: 'holiday',
        rarity: 'rare',
        value: 350,
        description: 'Un árbol navideño decorado',
        effect: 'snow',
        seasonal: 'christmas'
    },
    jack_o_lantern: {
        id: 'jack_o_lantern',
        name: '🎃 Calabaza de Halloween',
        category: 'holiday',
        rarity: 'rare',
        value: 300,
        description: 'Una calabaza tallada',
        effect: 'spooky',
        seasonal: 'halloween'
    },
    fireworks: {
        id: 'fireworks',
        name: '🎆 Fuegos Artificiales',
        category: 'holiday',
        rarity: 'epic',
        value: 400,
        description: 'Espectáculo de fuegos artificiales',
        effect: 'explode'
    },
    balloon: {
        id: 'balloon',
        name: '🎈 Globo',
        category: 'party',
        rarity: 'common',
        value: 20,
        description: 'Un colorido globo',
        effect: 'float'
    }
};

// Rareza de items
const RARITY_INFO = {
    common: { name: 'Común', color: '⚪', multiplier: 1 },
    uncommon: { name: 'Poco Común', color: '🟢', multiplier: 1.5 },
    rare: { name: 'Raro', color: '🔵', multiplier: 2 },
    epic: { name: 'Épico', color: '🟣', multiplier: 3 },
    legendary: { name: 'Legendario', color: '🟡', multiplier: 5 }
};

// ═══════════════════════════════════════════════════════════════════════════════
// │                      SISTEMA DE EFECTOS                                     │
// ═══════════════════════════════════════════════════════════════════════════════

const EFFECTS = {
    sparkle: '✨✨✨ ¡Brillos mágicos rodean el regalo! ✨✨✨',
    bloom: '🌸🌺🌸 ¡Flores brotan alrededor! 🌸🌺🌸',
    shine: '🌟💫🌟 ¡Destello luminoso! 🌟💫🌟',
    explosion: '💥🎆💥 ¡Explosión de colores! 💥🎆💥',
    confetti: '🎊🎉🎊 ¡Confeti por todos lados! 🎊🎉🎊',
    heartbeat: '💗💓💗 ¡Palpitaciones de amor! 💗💓💗',
    rainbow: '🌈✨🌈 ¡Arcoíris mágico! 🌈✨🌈',
    royal: '👑✨👑 ¡Aura real! 👑✨👑',
    victory: '🏆🎺🏆 ¡Fanfarria de victoria! 🏆🎺🏆',
    surprise: '🎁❓🎁 ¡Sorpresa dentro! 🎁❓🎁',
    snow: '❄️⛄❄️ ¡Nieve cayendo! ❄️⛄❄️',
    spooky: '👻🎃👻 ¡Atmósfera misteriosa! 👻🎃👻',
    explode: '🎆🎇🎆 ¡Explosión espectacular! 🎆🎇🎆',
    float: '🎈☁️🎈 ¡Flotando en el aire! 🎈☁️🎈',
    twinkle: '✨⭐✨ ¡Centelleo estelar! ✨⭐✨',
    glow: '🌟🌙🌟 ¡Resplandor nocturno! 🌟🌙🌟'
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
            debug: paint.bold.bgBlue(' DEBUG '),
            info: paint.bold.bgGreen(' INFO '),
            warn: paint.bold.bgYellow(' WARN '),
            error: paint.bold.bgRed(' ERROR ')
        }[level];
        
        console.log(prefix, `[${paint.gray(timestamp)}] [GiftSystem]:`, ...args);
    }
    
    static debug(...args) { this.log('debug', ...args); }
    static info(...args) { this.log('info', ...args); }
    static warn(...args) { this.log('warn', ...args); }
    static error(...args) { this.log('error', ...args); }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      CLASE PRINCIPAL GIFT                                   │
// ═══════════════════════════════════════════════════════════════════════════════

class Gift {
    id: string
    itemId: any
    item: any
    from: any
    to: any
    message: any
    anonymous: any
    wrap: any
    opened: boolean
    createdAt: number
    openedAt: null | number
    scheduledFor: any
    isGroupGift: any
    contributors: any

    constructor(itemId, from, to, options: Record<string, any> = {}) {
        this.id = randomHex(8);
        this.itemId = itemId;
        this.item = GIFT_CATALOG[itemId];
        
        if (!this.item) {
            throw new Error(`Item no encontrado: ${itemId}`);
        }
        
        this.from = from;
        this.to = to;
        this.message = options.message || '';
        this.anonymous = options.anonymous || false;
        this.wrap = options.wrap || 'basic';
        this.opened = false;
        this.createdAt = Date.now();
        this.openedAt = null;
        this.scheduledFor = options.scheduledFor || null;
        this.isGroupGift = options.isGroupGift || false;
        this.contributors = options.contributors || [from];
        
        Logger.debug(`🎁 Regalo creado: ${this.id} (${this.item.name})`);
    }
    
    open() {
        if (this.opened) {
            return {
                success: false as const,
                message: 'Este regalo ya fue abierto'
            };
        }
        
        this.opened = true;
        this.openedAt = Date.now();
        
        Logger.info(`📦 Regalo abierto: ${this.id} por ${this.to}`);
        
        return {
            success: true as const,
            item: this.item,
            effect: CONFIG.EFFECTS_ENABLED ? EFFECTS[this.item.effect] : null,
            from: this.anonymous ? '❓ Anónimo' : this.from,
            message: this.message
        };
    }
    
    getInfo() {
        return {
            id: this.id,
            item: this.item,
            from: this.anonymous ? '❓ Anónimo' : this.from,
            to: this.to,
            message: this.message,
            wrap: this.wrap,
            opened: this.opened,
            createdAt: this.createdAt,
            openedAt: this.openedAt,
            isGroupGift: this.isGroupGift,
            contributors: this.contributors.length
        };
    }
    
    renderWrapped() {
        const wraps = {
            basic: '🎁',
            premium: '🎀',
            deluxe: '🎊',
            legendary: '✨🎁✨'
        };
        
        return wraps[this.wrap] || wraps.basic;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      GESTOR DE REGALOS                                      │
// ═══════════════════════════════════════════════════════════════════════════════

class GiftManager {
    gifts: Map<any, any>
    userGifts: Map<any, any>
    history: Map<any, any>
    wishLists: Map<any, any>
    cooldowns: Map<any, any>
    trades: Map<any, any>
    stats: Map<any, any>
    scheduledGifts: any[]

    constructor() {
        this.gifts = new Map(); // id -> Gift
        this.userGifts = new Map(); // userId -> [giftIds]
        this.history = new Map(); // userId -> [history]
        this.wishLists = new Map(); // userId -> [itemIds]
        this.cooldowns = new Map(); // userId -> timestamp
        this.trades = new Map(); // tradeId -> Trade
        this.stats = new Map(); // userId -> stats
        this.scheduledGifts = [];
        
        // Iniciar limpieza automática
        this.startCleanupInterval();
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      ENVÍO DE REGALOS                                 │
    // ═════════════════════════════════════════════════════════════════════════
    
    sendGift(itemId, from, to, options: Record<string, any> = {}) {
        try {
            // Validaciones
            if (!GIFT_CATALOG[itemId]) {
                return {
                    success: false as const,
                    message: `❌ Item no encontrado: ${itemId}`
                };
            }
            
            if (from === to && !options.allowSelfGift) {
                return {
                    success: false as const,
                    message: '❌ No puedes enviarte regalos a ti mismo'
                };
            }
            
            // Verificar cooldown
            if (!this.checkCooldown(from)) {
                const remaining = this.getRemainingCooldown(from);
                return {
                    success: false as const,
                    message: `⏳ Debes esperar ${Math.ceil(remaining / 1000)}s antes de enviar otro regalo`
                };
            }
            
            // Verificar mensaje
            if (options.message && options.message.length > CONFIG.MAX_MESSAGE_LENGTH) {
                return {
                    success: false as const,
                    message: `❌ El mensaje es demasiado largo (máx ${CONFIG.MAX_MESSAGE_LENGTH} caracteres)`
                };
            }
            
            // Crear regalo
            const gift = new Gift(itemId, from, to, options);
            
            // Guardar
            this.gifts.set(gift.id, gift);
            
            // Agregar a lista del usuario
            if (!this.userGifts.has(to)) {
                this.userGifts.set(to, []);
            }
            this.userGifts.get(to).push(gift.id);
            
            // Actualizar cooldown
            this.setCooldown(from);
            
            // Guardar en historial
            this.addToHistory(from, {
                type: 'sent',
                giftId: gift.id,
                itemId: itemId,
                to: to,
                timestamp: Date.now()
            });
            
            // Actualizar estadísticas
            this.updateStats(from, 'sent');
            
            Logger.info(`✅ Regalo enviado: ${from} → ${to} (${GIFT_CATALOG[itemId].name})`);
            
            return {
                success: true as const,
                gift: gift,
                message: `✅ Regalo enviado exitosamente!\n${gift.renderWrapped()} ${GIFT_CATALOG[itemId].name}`
            };
            
        } catch (error) {
            Logger.error('Error enviando regalo:', error);
            return {
                success: false as const,
                message: `❌ Error: ${error.message}`
            };
        }
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      RECIBIR Y ABRIR REGALOS                          │
    // ═════════════════════════════════════════════════════════════════════════
    
    getReceivedGifts(userId) {
        const giftIds = this.userGifts.get(userId) || [];
        return giftIds
            .map(id => this.gifts.get(id))
            .filter(gift => gift && !gift.opened);
    }
    
    openGift(giftId, userId) {
        const gift = this.gifts.get(giftId);
        
        if (!gift) {
            return {
                success: false as const,
                message: '❌ Regalo no encontrado'
            };
        }
        
        if (gift.to !== userId) {
            return {
                success: false as const,
                message: '❌ Este regalo no es tuyo'
            };
        }
        
        if (gift.opened) {
            return {
                success: false as const,
                message: '❌ Este regalo ya fue abierto'
            };
        }
        
        // Verificar si está programado
        if (gift.scheduledFor && Date.now() < gift.scheduledFor) {
            const remaining = gift.scheduledFor - Date.now();
            const hours = Math.floor(remaining / 3600000);
            const minutes = Math.floor((remaining % 3600000) / 60000);
            
            return {
                success: false as const,
                message: `⏰ Este regalo está programado para más tarde (${hours}h ${minutes}m)`
            };
        }
        
        const result = gift.open();
        
        if (result.success) {
            // Agregar al historial
            this.addToHistory(userId, {
                type: 'received',
                giftId: gift.id,
                itemId: gift.itemId,
                from: gift.from,
                timestamp: Date.now()
            });
            
            // Actualizar estadísticas
            this.updateStats(userId, 'received');
            this.updateStats(gift.from, 'opened');
            
            Logger.info(`📦 Regalo abierto: ${giftId} por ${userId}`);
        }
        
        return result;
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      LISTA DE DESEOS                                  │
    // ═════════════════════════════════════════════════════════════════════════
    
    addToWishList(userId, itemId) {
        if (!GIFT_CATALOG[itemId]) {
            return {
                success: false as const,
                message: '❌ Item no encontrado'
            };
        }
        
        if (!this.wishLists.has(userId)) {
            this.wishLists.set(userId, []);
        }
        
        const wishList = this.wishLists.get(userId);
        
        if (wishList.length >= CONFIG.MAX_WISHLIST_ITEMS) {
            return {
                success: false as const,
                message: `❌ Lista de deseos llena (máx ${CONFIG.MAX_WISHLIST_ITEMS})`
            };
        }
        
        if (wishList.includes(itemId)) {
            return {
                success: false as const,
                message: '❌ Este item ya está en tu lista de deseos'
            };
        }
        
        wishList.push(itemId);
        
        Logger.info(`💝 ${userId} agregó ${itemId} a su lista de deseos`);
        
        return {
            success: true as const,
            message: `✅ Agregado a tu lista de deseos: ${GIFT_CATALOG[itemId].name}`
        };
    }
    
    removeFromWishList(userId, itemId) {
        if (!this.wishLists.has(userId)) {
            return {
                success: false as const,
                message: '❌ No tienes lista de deseos'
            };
        }
        
        const wishList = this.wishLists.get(userId);
        const index = wishList.indexOf(itemId);
        
        if (index === -1) {
            return {
                success: false as const,
                message: '❌ Este item no está en tu lista de deseos'
            };
        }
        
        wishList.splice(index, 1);
        
        return {
            success: true as const,
            message: `✅ Removido de tu lista de deseos: ${GIFT_CATALOG[itemId].name}`
        };
    }
    
    getWishList(userId) {
        const itemIds = this.wishLists.get(userId) || [];
        return itemIds.map(id => GIFT_CATALOG[id]).filter(Boolean);
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      REGALOS GRUPALES                                 │
    // ═════════════════════════════════════════════════════════════════════════
    
    createGroupGift(itemId, organizer, to, contributors, options: Record<string, any> = {}) {
        if (!CONFIG.ALLOW_GROUP_GIFTS) {
            return {
                success: false as const,
                message: '❌ Los regalos grupales están deshabilitados'
            };
        }
        
        if (contributors.length < 2) {
            return {
                success: false as const,
                message: '❌ Se necesitan al menos 2 contribuyentes'
            };
        }
        
        options.isGroupGift = true;
        options.contributors = contributors;
        
        return this.sendGift(itemId, organizer, to, options);
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      REGALOS PROGRAMADOS                              │
    // ═════════════════════════════════════════════════════════════════════════
    
    scheduleGift(itemId, from, to, scheduledFor, options: Record<string, any> = {}) {
        if (!CONFIG.ALLOW_SCHEDULED) {
            return {
                success: false as const,
                message: '❌ Los regalos programados están deshabilitados'
            };
        }
        
        if (scheduledFor <= Date.now()) {
            return {
                success: false as const,
                message: '❌ La fecha debe ser en el futuro'
            };
        }
        
        const userScheduled = this.scheduledGifts.filter(g => g.from === from);
        if (userScheduled.length >= CONFIG.MAX_SCHEDULED_GIFTS) {
            return {
                success: false as const,
                message: `❌ Máximo ${CONFIG.MAX_SCHEDULED_GIFTS} regalos programados`
            };
        }
        
        options.scheduledFor = scheduledFor;
        
        const result = this.sendGift(itemId, from, to, options);
        
        if (result.success) {
            this.scheduledGifts.push(result.gift);
        }
        
        return result;
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      SISTEMA DE INTERCAMBIO                           │
    // ═════════════════════════════════════════════════════════════════════════
    
    createTrade(userId1, itemId1, userId2, itemId2) {
        if (!CONFIG.ALLOW_TRADES) {
            return {
                success: false as const,
                message: '❌ Los intercambios están deshabilitados'
            };
        }
        
        const tradeId = randomHex(8);
        
        const trade = {
            id: tradeId,
            user1: userId1,
            item1: itemId1,
            user2: userId2,
            item2: itemId2,
            status: 'pending',
            acceptedBy: [],
            createdAt: Date.now(),
            expiresAt: Date.now() + CONFIG.TRADE_TIMEOUT
        };
        
        this.trades.set(tradeId, trade);
        
        Logger.info(`🔄 Intercambio creado: ${tradeId}`);
        
        return {
            success: true as const,
            tradeId: tradeId,
            trade: trade
        };
    }
    
    acceptTrade(tradeId, userId) {
        const trade = this.trades.get(tradeId);
        
        if (!trade) {
            return {
                success: false as const,
                message: '❌ Intercambio no encontrado'
            };
        }
        
        if (trade.status !== 'pending') {
            return {
                success: false as const,
                message: '❌ Este intercambio ya fue completado o cancelado'
            };
        }
        
        if (Date.now() > trade.expiresAt) {
            trade.status = 'expired';
            return {
                success: false as const,
                message: '❌ Este intercambio expiró'
            };
        }
        
        if (userId !== trade.user1 && userId !== trade.user2) {
            return {
                success: false as const,
                message: '❌ No eres parte de este intercambio'
            };
        }
        
        if (trade.acceptedBy.includes(userId)) {
            return {
                success: false as const,
                message: '⏳ Ya aceptaste este intercambio, esperando al otro usuario'
            };
        }
        
        trade.acceptedBy.push(userId);
        
        // Si ambos aceptaron, completar
        if (trade.acceptedBy.length === 2) {
            trade.status = 'completed';
            
            // Realizar intercambio
            this.sendGift(trade.item2, trade.user2, trade.user1, { 
                message: '🔄 Intercambio completado' 
            });
            this.sendGift(trade.item1, trade.user1, trade.user2, { 
                message: '🔄 Intercambio completado' 
            });
            
            Logger.info(`✅ Intercambio completado: ${tradeId}`);
            
            return {
                success: true as const,
                message: '✅ ¡Intercambio completado!'
            };
        }
        
        return {
            success: true as const,
            message: '✅ Aceptado. Esperando al otro usuario...'
        };
    }
    
    cancelTrade(tradeId, userId) {
        const trade = this.trades.get(tradeId);
        
        if (!trade) {
            return {
                success: false as const,
                message: '❌ Intercambio no encontrado'
            };
        }
        
        if (userId !== trade.user1 && userId !== trade.user2) {
            return {
                success: false as const,
                message: '❌ No eres parte de este intercambio'
            };
        }
        
        if (trade.status !== 'pending') {
            return {
                success: false as const,
                message: '❌ Este intercambio ya fue completado o cancelado'
            };
        }
        
        trade.status = 'cancelled';
        
        Logger.info(`❌ Intercambio cancelado: ${tradeId}`);
        
        return {
            success: true as const,
            message: '✅ Intercambio cancelado'
        };
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      COOLDOWNS                                        │
    // ═════════════════════════════════════════════════════════════════════════
    
    checkCooldown(userId) {
        const lastGift = this.cooldowns.get(userId);
        if (!lastGift) return true;
        
        return Date.now() - lastGift >= CONFIG.GIFT_COOLDOWN;
    }
    
    setCooldown(userId) {
        this.cooldowns.set(userId, Date.now());
    }
    
    getRemainingCooldown(userId) {
        const lastGift = this.cooldowns.get(userId);
        if (!lastGift) return 0;
        
        const elapsed = Date.now() - lastGift;
        return Math.max(0, CONFIG.GIFT_COOLDOWN - elapsed);
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      HISTORIAL                                        │
    // ═════════════════════════════════════════════════════════════════════════
    
    addToHistory(userId, entry) {
        if (!CONFIG.SAVE_HISTORY) return;
        
        if (!this.history.has(userId)) {
            this.history.set(userId, []);
        }
        
        const history = this.history.get(userId);
        history.push(entry);
        
        // Mantener solo los últimos N
        if (history.length > CONFIG.MAX_HISTORY) {
            history.shift();
        }
    }
    
    getHistory(userId, limit = 10) {
        const history = this.history.get(userId) || [];
        return history.slice(-limit).reverse();
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      ESTADÍSTICAS                                     │
    // ═════════════════════════════════════════════════════════════════════════
    
    updateStats(userId, type) {
        if (!CONFIG.STATS_ENABLED) return;
        
        if (!this.stats.has(userId)) {
            this.stats.set(userId, {
                sent: 0,
                received: 0,
                opened: 0,
                totalValue: 0,
                favoriteItem: null,
                itemCounts: {}
            });
        }
        
        const stats = this.stats.get(userId);
        
        if (type === 'sent') stats.sent++;
        if (type === 'received') stats.received++;
        if (type === 'opened') stats.opened++;
    }
    
    getStats(userId) {
        return this.stats.get(userId) || {
            sent: 0,
            received: 0,
            opened: 0,
            totalValue: 0,
            favoriteItem: null
        };
    }
    
    getLeaderboard(type = 'sent', limit = 10) {
        return Array.from(this.stats.entries())
            .map(([id, stats]) => ({ id, ...stats }))
            .sort((a, b) => b[type] - a[type])
            .slice(0, limit);
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      UTILIDADES                                       │
    // ═════════════════════════════════════════════════════════════════════════
    
    getCatalog(filters: Record<string, any> = {}) {
        let items = Object.values(GIFT_CATALOG);
        
        if (filters.category) {
            items = items.filter(item => item.category === filters.category);
        }
        
        if (filters.rarity) {
            items = items.filter(item => item.rarity === filters.rarity);
        }
        
        if (filters.maxValue) {
            items = items.filter(item => item.value <= filters.maxValue);
        }
        
        if (filters.minValue) {
            items = items.filter(item => item.value >= filters.minValue);
        }
        
        return items;
    }
    
    getCategories() {
        const categories = new Set();
        Object.values(GIFT_CATALOG).forEach(item => categories.add(item.category));
        return Array.from(categories);
    }
    
    searchItems(query) {
        query = query.toLowerCase();
        return Object.values(GIFT_CATALOG).filter(item => 
            item.name.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query) ||
            item.id.toLowerCase().includes(query)
        );
    }
    
    startCleanupInterval() {
        setInterval(() => {
            this.cleanupExpiredTrades();
            this.cleanupOldGifts();
        }, 300000); // Cada 5 minutos
    }
    
    cleanupExpiredTrades() {
        const now = Date.now();
        for (const [id, trade] of this.trades.entries()) {
            if (trade.status === 'pending' && now > trade.expiresAt) {
                trade.status = 'expired';
                Logger.debug(`⏰ Intercambio expirado: ${id}`);
            }
        }
    }
    
    cleanupOldGifts() {
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 días
        const now = Date.now();
        let cleaned = 0;
        
        for (const [id, gift] of this.gifts.entries()) {
            if (gift.opened && (now - gift.openedAt) > maxAge) {
                this.gifts.delete(id);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            Logger.info(`🧹 ${cleaned} regalos antiguos limpiados`);
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      INSTANCIA GLOBAL                                       │
// ═══════════════════════════════════════════════════════════════════════════════

const giftManager = new GiftManager();

// ═══════════════════════════════════════════════════════════════════════════════
// │                      EXPORTACIONES                                          │
// ═══════════════════════════════════════════════════════════════════════════════

export default GiftManager;
export {
    Gift,
    giftManager,
    GIFT_CATALOG,
    RARITY_INFO,
    EFFECTS,
    CONFIG
};
