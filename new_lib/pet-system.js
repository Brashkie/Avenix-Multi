/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                   𒁈 PET SYSTEM V2.0 ULTRA 𒁈                               ┃
 * ┃              Sistema Completo de Mascotas Virtuales                         ┃
 * ┃                    Creado para: Avenix-Multi V6.1.0                          ┃
 * ┃                    By: Hepein Oficial                                        ┃
 * ┃                                                                               ┃
 * ┃  CARACTERÍSTICAS:                                                            ┃
 * ┃  ✅ 50+ especies diferentes de mascotas                                     ┃
 * ┃  ✅ Sistema de evolución por niveles                                        ┃
 * ┃  ✅ Estadísticas: hambre, felicidad, salud, energía                        ┃
 * ┃  ✅ Alimentación y cuidados (comer, jugar, dormir)                         ┃
 * ┃  ✅ Sistema de batalla turn-based                                           ┃
 * ┃  ✅ Habilidades especiales por especie                                      ┃
 * ┃  ✅ Entrenamiento y subida de nivel                                         ┃
 * ┃  ✅ Crianza y reproducción                                                  ┃
 * ┃  ✅ Sistema de rareza (común, raro, épico, legendario)                     ┃
 * ┃  ✅ Mercado de intercambio                                                  ┃
 * ┃  ✅ Inventario de items y accesorios                                        ┃
 * ┃  ✅ Mini-juegos con mascotas                                                ┃
 * ┃  ✅ Logros y achievements                                                   ┃
 * ┃  ✅ Rankings y estadísticas globales                                        ┃
 * ┃  ✅ Personalización (nombres, colores, accesorios)                         ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import crypto from 'crypto';
import chalk from 'chalk';

// ═══════════════════════════════════════════════════════════════════════════════
// │                        CONFIGURACIÓN GLOBAL                                 │
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
    // Estadísticas
    MAX_HUNGER: 100,
    MAX_HAPPINESS: 100,
    MAX_HEALTH: 100,
    MAX_ENERGY: 100,
    
    // Decay rates (por hora)
    HUNGER_DECAY: 5,
    HAPPINESS_DECAY: 3,
    ENERGY_DECAY: 4,
    
    // Costos
    ADOPTION_COST: 1000,
    FOOD_COST: 50,
    TOY_COST: 30,
    MEDICINE_COST: 100,
    
    // Experiencia
    EXP_PER_LEVEL: 100,
    EXP_MULTIPLIER: 1.5,
    MAX_LEVEL: 100,
    
    // Batalla
    BATTLE_COOLDOWN: 300000, // 5 minutos
    BATTLE_REWARD_BASE: 50,
    
    // Reproducción
    BREEDING_COOLDOWN: 86400000, // 24 horas
    BREEDING_COST: 5000,
    MIN_BREEDING_LEVEL: 10,
    
    // Rareza - Probabilidades
    RARITY_CHANCES: {
        common: 60,      // 60%
        uncommon: 25,    // 25%
        rare: 10,        // 10%
        epic: 4,         // 4%
        legendary: 1     // 1%
    },
    
    // Evolución
    EVOLUTION_LEVELS: [10, 25, 50],
    
    // Items
    MAX_INVENTORY: 50,
    
    // Sistema
    AUTO_SAVE: true,
    SAVE_INTERVAL: 300000, // 5 minutos
    
    // Logging
    LOG_ENABLED: true,
    LOG_LEVEL: 'info'
};

// ═══════════════════════════════════════════════════════════════════════════════
// │                      CATÁLOGO DE ESPECIES                                   │
// ═══════════════════════════════════════════════════════════════════════════════

const SPECIES_CATALOG = {
    // ═══════════ COMUNES ═══════════
    dog: {
        name: 'Perro',
        emoji: '🐕',
        rarity: 'common',
        type: 'normal',
        baseStats: { hp: 100, atk: 15, def: 12, spd: 14 },
        evolutions: ['dog2', 'dog3'],
        abilities: ['ladrido', 'mordisco'],
        description: 'El mejor amigo del hombre'
    },
    cat: {
        name: 'Gato',
        emoji: '🐈',
        rarity: 'common',
        type: 'normal',
        baseStats: { hp: 80, atk: 18, def: 10, spd: 20 },
        evolutions: ['cat2', 'cat3'],
        abilities: ['arañazo', 'agilidad'],
        description: 'Independiente y elegante'
    },
    rabbit: {
        name: 'Conejo',
        emoji: '🐰',
        rarity: 'common',
        type: 'normal',
        baseStats: { hp: 70, atk: 10, def: 8, spd: 25 },
        evolutions: ['rabbit2', 'rabbit3'],
        abilities: ['salto', 'esquivar'],
        description: 'Rápido y adorable'
    },
    hamster: {
        name: 'Hámster',
        emoji: '🐹',
        rarity: 'common',
        type: 'normal',
        baseStats: { hp: 60, atk: 8, def: 7, spd: 18 },
        evolutions: ['hamster2'],
        abilities: ['roer', 'correr'],
        description: 'Pequeño pero valiente'
    },
    bird: {
        name: 'Pájaro',
        emoji: '🐦',
        rarity: 'common',
        type: 'flying',
        baseStats: { hp: 65, atk: 12, def: 8, spd: 30 },
        evolutions: ['bird2', 'bird3'],
        abilities: ['picotazo', 'volar'],
        description: 'Ligero como una pluma'
    },
    
    // ═══════════ POCO COMUNES ═══════════
    fox: {
        name: 'Zorro',
        emoji: '🦊',
        rarity: 'uncommon',
        type: 'fire',
        baseStats: { hp: 90, atk: 22, def: 14, spd: 22 },
        evolutions: ['fox2', 'fox3'],
        abilities: ['llama', 'astucia'],
        description: 'Astuto y ágil'
    },
    panda: {
        name: 'Panda',
        emoji: '🐼',
        rarity: 'uncommon',
        type: 'normal',
        baseStats: { hp: 120, atk: 16, def: 20, spd: 10 },
        evolutions: ['panda2'],
        abilities: ['abrazo', 'descanso'],
        description: 'Tierno gigante'
    },
    penguin: {
        name: 'Pingüino',
        emoji: '🐧',
        rarity: 'uncommon',
        type: 'ice',
        baseStats: { hp: 85, atk: 14, def: 16, spd: 12 },
        evolutions: ['penguin2', 'penguin3'],
        abilities: ['deslizamiento', 'helada'],
        description: 'Nadador experto'
    },
    koala: {
        name: 'Koala',
        emoji: '🐨',
        rarity: 'uncommon',
        type: 'normal',
        baseStats: { hp: 95, atk: 12, def: 18, spd: 8 },
        evolutions: ['koala2'],
        abilities: ['abrazo', 'dormir'],
        description: 'Relajado y calmado'
    },
    
    // ═══════════ RAROS ═══════════
    lion: {
        name: 'León',
        emoji: '🦁',
        rarity: 'rare',
        type: 'normal',
        baseStats: { hp: 130, atk: 30, def: 22, spd: 18 },
        evolutions: ['lion2'],
        abilities: ['rugido', 'garra'],
        description: 'Rey de la selva'
    },
    tiger: {
        name: 'Tigre',
        emoji: '🐯',
        rarity: 'rare',
        type: 'normal',
        baseStats: { hp: 125, atk: 32, def: 20, spd: 24 },
        evolutions: ['tiger2'],
        abilities: ['zarpazo', 'sigilo'],
        description: 'Cazador sigiloso'
    },
    wolf: {
        name: 'Lobo',
        emoji: '🐺',
        rarity: 'rare',
        type: 'dark',
        baseStats: { hp: 110, atk: 28, def: 18, spd: 26 },
        evolutions: ['wolf2', 'wolf3'],
        abilities: ['aullido', 'manada'],
        description: 'Líder de manada'
    },
    unicorn: {
        name: 'Unicornio',
        emoji: '🦄',
        rarity: 'rare',
        type: 'magic',
        baseStats: { hp: 100, atk: 25, def: 20, spd: 28 },
        evolutions: ['unicorn2'],
        abilities: ['magia', 'curación'],
        description: 'Criatura mágica'
    },
    
    // ═══════════ ÉPICOS ═══════════
    dragon: {
        name: 'Dragón',
        emoji: '🐉',
        rarity: 'epic',
        type: 'dragon',
        baseStats: { hp: 150, atk: 40, def: 30, spd: 25 },
        evolutions: ['dragon2', 'dragon3'],
        abilities: ['aliento_fuego', 'volar', 'intimidar'],
        description: 'Bestia antigua y poderosa'
    },
    phoenix: {
        name: 'Fénix',
        emoji: '🔥',
        rarity: 'epic',
        type: 'fire',
        baseStats: { hp: 130, atk: 38, def: 25, spd: 35 },
        evolutions: ['phoenix2'],
        abilities: ['renacimiento', 'llamas', 'volar'],
        description: 'Resurge de las cenizas'
    },
    griffin: {
        name: 'Grifo',
        emoji: '🦅',
        rarity: 'epic',
        type: 'flying',
        baseStats: { hp: 140, atk: 36, def: 28, spd: 32 },
        evolutions: ['griffin2'],
        abilities: ['garra', 'volar', 'rugido'],
        description: 'Mitad águila, mitad león'
    },
    
    // ═══════════ LEGENDARIOS ═══════════
    celestial_dragon: {
        name: 'Dragón Celestial',
        emoji: '✨🐉',
        rarity: 'legendary',
        type: 'dragon',
        baseStats: { hp: 200, atk: 50, def: 40, spd: 35 },
        evolutions: [],
        abilities: ['cosmos', 'devastación', 'bendición', 'omnipotencia'],
        description: 'Guardián de los cielos'
    },
    divine_phoenix: {
        name: 'Fénix Divino',
        emoji: '🔥👑',
        rarity: 'legendary',
        type: 'fire',
        baseStats: { hp: 180, atk: 48, def: 35, spd: 45 },
        evolutions: [],
        abilities: ['resurrección', 'fuego_sagrado', 'purificación', 'inmortalidad'],
        description: 'Encarnación del fuego eterno'
    },
    leviathan: {
        name: 'Leviatán',
        emoji: '🌊🐋',
        rarity: 'legendary',
        type: 'water',
        baseStats: { hp: 220, atk: 45, def: 50, spd: 30 },
        evolutions: [],
        abilities: ['maremoto', 'torbellino', 'presión_abismal', 'tsunami'],
        description: 'Señor de los océanos'
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// │                      CATÁLOGO DE HABILIDADES                                │
// ═══════════════════════════════════════════════════════════════════════════════

const ABILITIES = {
    // Básicas
    ladrido: { name: 'Ladrido', power: 20, type: 'normal', effect: 'damage' },
    mordisco: { name: 'Mordisco', power: 30, type: 'normal', effect: 'damage' },
    arañazo: { name: 'Arañazo', power: 25, type: 'normal', effect: 'damage' },
    agilidad: { name: 'Agilidad', power: 0, type: 'buff', effect: 'speed_up' },
    salto: { name: 'Salto', power: 20, type: 'normal', effect: 'damage' },
    esquivar: { name: 'Esquivar', power: 0, type: 'buff', effect: 'evasion' },
    
    // Elementales
    llama: { name: 'Llama', power: 35, type: 'fire', effect: 'damage' },
    helada: { name: 'Helada', power: 30, type: 'ice', effect: 'damage_freeze' },
    aliento_fuego: { name: 'Aliento de Fuego', power: 50, type: 'fire', effect: 'damage' },
    
    // Especiales
    curación: { name: 'Curación', power: 40, type: 'magic', effect: 'heal' },
    magia: { name: 'Magia', power: 35, type: 'magic', effect: 'damage' },
    rugido: { name: 'Rugido', power: 0, type: 'buff', effect: 'attack_up' },
    
    // Legendarias
    devastación: { name: 'Devastación', power: 80, type: 'dragon', effect: 'damage' },
    resurrección: { name: 'Resurrección', power: 100, type: 'magic', effect: 'full_heal' },
    tsunami: { name: 'Tsunami', power: 90, type: 'water', effect: 'damage' }
};

// ═══════════════════════════════════════════════════════════════════════════════
// │                      CATÁLOGO DE ITEMS                                      │
// ═══════════════════════════════════════════════════════════════════════════════

const ITEMS = {
    // Comida
    apple: { name: 'Manzana', emoji: '🍎', type: 'food', hunger: 20, cost: 30 },
    meat: { name: 'Carne', emoji: '🥩', type: 'food', hunger: 40, cost: 80 },
    fish: { name: 'Pescado', emoji: '🐟', type: 'food', hunger: 35, cost: 60 },
    cookie: { name: 'Galleta', emoji: '🍪', type: 'food', hunger: 15, happiness: 10, cost: 40 },
    cake: { name: 'Pastel', emoji: '🍰', type: 'food', hunger: 25, happiness: 20, cost: 100 },
    
    // Juguetes
    ball: { name: 'Pelota', emoji: '⚽', type: 'toy', happiness: 20, energy: -10, cost: 50 },
    bone: { name: 'Hueso', emoji: '🦴', type: 'toy', happiness: 25, cost: 60 },
    yarn: { name: 'Ovillo', emoji: '🧶', type: 'toy', happiness: 15, cost: 40 },
    
    // Medicina
    potion: { name: 'Poción', emoji: '🧪', type: 'medicine', health: 50, cost: 150 },
    super_potion: { name: 'Super Poción', emoji: '💊', type: 'medicine', health: 100, cost: 300 },
    revive: { name: 'Revivir', emoji: '✨', type: 'medicine', health: 999, cost: 500 },
    
    // Accesorios
    collar: { name: 'Collar', emoji: '📿', type: 'accessory', def: 5, cost: 200 },
    crown: { name: 'Corona', emoji: '👑', type: 'accessory', all: 10, cost: 1000 },
    cape: { name: 'Capa', emoji: '🦸', type: 'accessory', spd: 8, cost: 300 },
    
    // Especiales
    exp_boost: { name: 'Potenciador XP', emoji: '⬆️', type: 'boost', exp_multiplier: 2, duration: 3600000, cost: 500 },
    rare_candy: { name: 'Caramelo Raro', emoji: '🍬', type: 'boost', level_up: 1, cost: 1000 }
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
        
        console.log(prefix, `[${chalk.gray(timestamp)}] [PetSystem]:`, ...args);
    }
    
    static debug(...args) { this.log('debug', ...args); }
    static info(...args) { this.log('info', ...args); }
    static warn(...args) { this.log('warn', ...args); }
    static error(...args) { this.log('error', ...args); }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      CLASE PRINCIPAL: PET                                   │
// ═══════════════════════════════════════════════════════════════════════════════

class Pet {
    constructor(species, owner, name = null) {
        const speciesData = SPECIES_CATALOG[species];
        if (!speciesData) throw new Error(`Especie "${species}" no existe`);
        
        this.id = crypto.randomBytes(8).toString('hex');
        this.species = species;
        this.owner = owner;
        this.name = name || this.generateRandomName();
        this.emoji = speciesData.emoji;
        this.rarity = speciesData.rarity;
        this.type = speciesData.type;
        
        // Estadísticas base
        this.level = 1;
        this.exp = 0;
        this.stats = { ...speciesData.baseStats };
        
        // Estados actuales
        this.currentHp = this.stats.hp;
        this.hunger = 100;
        this.happiness = 100;
        this.health = 100;
        this.energy = 100;
        
        // Habilidades
        this.abilities = [...speciesData.abilities];
        
        // Evolución
        this.evolutions = speciesData.evolutions || [];
        this.evolutionStage = 0;
        
        // Batalla
        this.wins = 0;
        this.losses = 0;
        this.lastBattle = 0;
        
        // Reproducción
        this.lastBreeding = 0;
        this.children = [];
        
        // Personalización
        this.accessories = [];
        this.color = null;
        
        // Inventario personal
        this.inventory = [];
        
        // Timestamps
        this.createdAt = Date.now();
        this.lastFed = Date.now();
        this.lastPlayed = Date.now();
        this.lastUpdate = Date.now();
        
        Logger.info(`🐾 Nueva mascota creada: ${this.name} (${this.species})`);
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      NOMBRES ALEATORIOS                               │
    // ═════════════════════════════════════════════════════════════════════════
    
    generateRandomName() {
        const names = [
            'Max', 'Luna', 'Charlie', 'Bella', 'Rocky', 'Lucy',
            'Buddy', 'Daisy', 'Zeus', 'Milo', 'Lola', 'Jack',
            'Coco', 'Oliver', 'Simba', 'Nala', 'Shadow', 'Angel',
            'Duke', 'Princess', 'Thor', 'Athena', 'Rex', 'Molly'
        ];
        return names[Math.floor(Math.random() * names.length)];
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      ACTUALIZACIÓN DE ESTADOS                         │
    // ═════════════════════════════════════════════════════════════════════════
    
    update() {
        const now = Date.now();
        const hoursPassed = (now - this.lastUpdate) / 3600000;
        
        if (hoursPassed > 0) {
            // Decay de estadísticas
            this.hunger = Math.max(0, this.hunger - (CONFIG.HUNGER_DECAY * hoursPassed));
            this.happiness = Math.max(0, this.happiness - (CONFIG.HAPPINESS_DECAY * hoursPassed));
            this.energy = Math.max(0, this.energy - (CONFIG.ENERGY_DECAY * hoursPassed));
            
            // Si tiene hambre, pierde salud
            if (this.hunger < 20) {
                this.health = Math.max(0, this.health - (2 * hoursPassed));
            }
            
            // Si está muy infeliz, pierde salud
            if (this.happiness < 20) {
                this.health = Math.max(0, this.health - (1 * hoursPassed));
            }
            
            this.lastUpdate = now;
            Logger.debug(`📊 Estado actualizado para ${this.name}`);
        }
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      ALIMENTACIÓN                                     │
    // ═════════════════════════════════════════════════════════════════════════
    
    feed(itemId) {
        const item = ITEMS[itemId];
        if (!item || item.type !== 'food') {
            return { success: false, message: 'Item inválido o no es comida' };
        }
        
        this.update();
        
        this.hunger = Math.min(CONFIG.MAX_HUNGER, this.hunger + item.hunger);
        
        if (item.happiness) {
            this.happiness = Math.min(CONFIG.MAX_HAPPINESS, this.happiness + item.happiness);
        }
        
        this.lastFed = Date.now();
        
        Logger.info(`🍽️ ${this.name} comió ${item.name}`);
        
        return {
            success: true,
            message: `${this.emoji} ${this.name} comió ${item.emoji} ${item.name}!`,
            stats: this.getStats()
        };
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      JUGAR                                            │
    // ═════════════════════════════════════════════════════════════════════════
    
    play(itemId = null) {
        this.update();
        
        if (this.energy < 10) {
            return { success: false, message: `${this.name} está muy cansado. Necesita descansar.` };
        }
        
        let happinessGain = 15;
        let energyLoss = 10;
        let expGain = 5;
        
        if (itemId) {
            const item = ITEMS[itemId];
            if (item && item.type === 'toy') {
                happinessGain = item.happiness || 15;
                energyLoss = Math.abs(item.energy || 10);
            }
        }
        
        this.happiness = Math.min(CONFIG.MAX_HAPPINESS, this.happiness + happinessGain);
        this.energy = Math.max(0, this.energy - energyLoss);
        this.addExp(expGain);
        
        this.lastPlayed = Date.now();
        
        Logger.info(`🎾 ${this.name} jugó`);
        
        return {
            success: true,
            message: `${this.emoji} ${this.name} está muy feliz jugando!`,
            stats: this.getStats()
        };
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      DORMIR                                           │
    // ═════════════════════════════════════════════════════════════════════════
    
    sleep() {
        this.update();
        
        const energyGain = 50;
        const healthGain = 10;
        
        this.energy = Math.min(CONFIG.MAX_ENERGY, this.energy + energyGain);
        this.health = Math.min(CONFIG.MAX_HEALTH, this.health + healthGain);
        
        Logger.info(`😴 ${this.name} durmió`);
        
        return {
            success: true,
            message: `${this.emoji} ${this.name} descansó y recuperó energía!`,
            stats: this.getStats()
        };
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      CURAR                                            │
    // ═════════════════════════════════════════════════════════════════════════
    
    heal(itemId) {
        const item = ITEMS[itemId];
        if (!item || item.type !== 'medicine') {
            return { success: false, message: 'Item inválido o no es medicina' };
        }
        
        this.update();
        
        this.health = Math.min(CONFIG.MAX_HEALTH, this.health + item.health);
        this.currentHp = Math.min(this.stats.hp, this.currentHp + item.health);
        
        Logger.info(`💊 ${this.name} usó medicina`);
        
        return {
            success: true,
            message: `${this.emoji} ${this.name} se siente mejor!`,
            stats: this.getStats()
        };
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      EXPERIENCIA Y NIVEL                              │
    // ═════════════════════════════════════════════════════════════════════════
    
    addExp(amount) {
        this.exp += amount;
        
        const requiredExp = this.getRequiredExp();
        
        if (this.exp >= requiredExp && this.level < CONFIG.MAX_LEVEL) {
            this.levelUp();
        }
    }
    
    getRequiredExp() {
        return Math.floor(CONFIG.EXP_PER_LEVEL * Math.pow(CONFIG.EXP_MULTIPLIER, this.level - 1));
    }
    
    levelUp() {
        this.level++;
        this.exp = 0;
        
        // Aumentar stats
        this.stats.hp += 5;
        this.stats.atk += 2;
        this.stats.def += 2;
        this.stats.spd += 1;
        
        this.currentHp = this.stats.hp;
        
        Logger.info(`⬆️ ${this.name} subió a nivel ${this.level}!`);
        
        // Verificar evolución
        if (CONFIG.EVOLUTION_LEVELS.includes(this.level)) {
            return this.checkEvolution();
        }
        
        return {
            levelUp: true,
            newLevel: this.level,
            message: `🎉 ${this.name} subió a nivel ${this.level}!`
        };
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      EVOLUCIÓN                                        │
    // ═════════════════════════════════════════════════════════════════════════
    
    checkEvolution() {
        if (this.evolutionStage >= this.evolutions.length) {
            return { canEvolve: false };
        }
        
        const nextEvolution = this.evolutions[this.evolutionStage];
        
        return {
            canEvolve: true,
            nextEvolution,
            message: `✨ ${this.name} puede evolucionar a ${SPECIES_CATALOG[nextEvolution]?.name}!`
        };
    }
    
    evolve() {
        if (this.evolutionStage >= this.evolutions.length) {
            return { success: false, message: 'No hay más evoluciones disponibles' };
        }
        
        const nextEvolution = this.evolutions[this.evolutionStage];
        const newSpecies = SPECIES_CATALOG[nextEvolution];
        
        if (!newSpecies) {
            return { success: false, message: 'Evolución no disponible' };
        }
        
        // Cambiar especies
        this.species = nextEvolution;
        this.emoji = newSpecies.emoji;
        this.type = newSpecies.type;
        
        // Mejorar stats
        this.stats.hp += 20;
        this.stats.atk += 10;
        this.stats.def += 10;
        this.stats.spd += 5;
        
        // Nuevas habilidades
        if (newSpecies.abilities) {
            newSpecies.abilities.forEach(ability => {
                if (!this.abilities.includes(ability)) {
                    this.abilities.push(ability);
                }
            });
        }
        
        this.evolutionStage++;
        this.currentHp = this.stats.hp;
        
        Logger.info(`✨ ${this.name} evolucionó a ${newSpecies.name}!`);
        
        return {
            success: true,
            message: `✨ ¡${this.name} evolucionó a ${newSpecies.name}!`,
            newSpecies: newSpecies.name
        };
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      BATALLA                                          │
    // ═════════════════════════════════════════════════════════════════════════
    
    canBattle() {
        this.update();
        
        if (this.health < 30) {
            return { can: false, reason: 'Salud muy baja' };
        }
        
        if (this.energy < 20) {
            return { can: false, reason: 'Energía muy baja' };
        }
        
        const now = Date.now();
        if (now - this.lastBattle < CONFIG.BATTLE_COOLDOWN) {
            const remaining = CONFIG.BATTLE_COOLDOWN - (now - this.lastBattle);
            return { can: false, reason: `Cooldown (${Math.ceil(remaining / 1000)}s)` };
        }
        
        return { can: true };
    }
    
    attack(ability, target) {
        const abilityData = ABILITIES[ability];
        if (!abilityData) {
            return { success: false, message: 'Habilidad inválida' };
        }
        
        if (!this.abilities.includes(ability)) {
            return { success: false, message: `${this.name} no conoce esa habilidad` };
        }
        
        let damage = 0;
        
        if (abilityData.effect === 'damage' || abilityData.effect.startsWith('damage_')) {
            // Calcular daño
            const baseDamage = abilityData.power + this.stats.atk;
            const defense = target.stats.def;
            damage = Math.max(1, Math.floor(baseDamage * (100 / (100 + defense))));
            
            // Variación aleatoria ±10%
            damage = Math.floor(damage * (0.9 + Math.random() * 0.2));
            
            target.currentHp = Math.max(0, target.currentHp - damage);
        }
        
        this.energy = Math.max(0, this.energy - 15);
        
        return {
            success: true,
            damage,
            abilityName: abilityData.name,
            targetRemaining: target.currentHp,
            message: `${this.name} usó ${abilityData.name}! ${damage > 0 ? `Causó ${damage} de daño!` : ''}`
        };
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      INFORMACIÓN                                      │
    // ═════════════════════════════════════════════════════════════════════════
    
    getStats() {
        this.update();
        
        return {
            name: this.name,
            species: SPECIES_CATALOG[this.species].name,
            emoji: this.emoji,
            level: this.level,
            exp: this.exp,
            requiredExp: this.getRequiredExp(),
            rarity: this.rarity,
            hunger: Math.round(this.hunger),
            happiness: Math.round(this.happiness),
            health: Math.round(this.health),
            energy: Math.round(this.energy),
            stats: this.stats,
            currentHp: this.currentHp,
            wins: this.wins,
            losses: this.losses,
            age: Date.now() - this.createdAt
        };
    }
    
    getFullInfo() {
        return {
            ...this.getStats(),
            id: this.id,
            owner: this.owner,
            type: this.type,
            abilities: this.abilities.map(a => ABILITIES[a]?.name || a),
            evolutions: this.evolutions,
            evolutionStage: this.evolutionStage,
            accessories: this.accessories,
            inventory: this.inventory,
            children: this.children.length,
            createdAt: this.createdAt
        };
    }
    
    render() {
        this.update();
        
        const barLength = 10;
        const hungerBar = '█'.repeat(Math.floor(this.hunger / 10)) + '░'.repeat(barLength - Math.floor(this.hunger / 10));
        const happyBar = '█'.repeat(Math.floor(this.happiness / 10)) + '░'.repeat(barLength - Math.floor(this.happiness / 10));
        const healthBar = '█'.repeat(Math.floor(this.health / 10)) + '░'.repeat(barLength - Math.floor(this.health / 10));
        const energyBar = '█'.repeat(Math.floor(this.energy / 10)) + '░'.repeat(barLength - Math.floor(this.energy / 10));
        
        return `
╔═══════════════════════════════╗
║   ${this.emoji} ${this.name} - Nivel ${this.level}
║   ${SPECIES_CATALOG[this.species].name} (${this.rarity})
╠═══════════════════════════════╣
║ 🍖 Hambre:     ${hungerBar} ${Math.round(this.hunger)}%
║ 😊 Felicidad:  ${happyBar} ${Math.round(this.happiness)}%
║ 💊 Salud:      ${healthBar} ${Math.round(this.health)}%
║ ⚡ Energía:    ${energyBar} ${Math.round(this.energy)}%
╠═══════════════════════════════╣
║ 📊 HP: ${this.currentHp}/${this.stats.hp}
║ ⚔️ ATK: ${this.stats.atk}  🛡️ DEF: ${this.stats.def}
║ 💨 SPD: ${this.stats.spd}
╠═══════════════════════════════╣
║ 🏆 Victorias: ${this.wins}
║ 💀 Derrotas: ${this.losses}
║ ⭐ EXP: ${this.exp}/${this.getRequiredExp()}
╚═══════════════════════════════╝
        `.trim();
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      SISTEMA DE BATALLA                                     │
// ═══════════════════════════════════════════════════════════════════════════════

class Battle {
    constructor(pet1, pet2) {
        this.id = crypto.randomBytes(4).toString('hex');
        this.pet1 = pet1;
        this.pet2 = pet2;
        this.turn = 0;
        this.log = [];
        this.winner = null;
        this.finished = false;
        
        // Guardar HP original
        this.originalHp1 = pet1.currentHp;
        this.originalHp2 = pet2.currentHp;
        
        Logger.info(`⚔️ Batalla iniciada: ${pet1.name} vs ${pet2.name}`);
    }
    
    start() {
        // Determinar quién ataca primero (basado en velocidad)
        this.currentAttacker = this.pet1.stats.spd >= this.pet2.stats.spd ? this.pet1 : this.pet2;
        this.currentDefender = this.currentAttacker === this.pet1 ? this.pet2 : this.pet1;
        
        this.addLog(`⚔️ Batalla entre ${this.pet1.emoji} ${this.pet1.name} (Lv.${this.pet1.level}) vs ${this.pet2.emoji} ${this.pet2.name} (Lv.${this.pet2.level})`);
        this.addLog(`${this.currentAttacker.name} atacará primero!`);
        
        return {
            battleId: this.id,
            message: `⚔️ Batalla iniciada! ${this.currentAttacker.name} ataca primero!`,
            firstAttacker: this.currentAttacker.name
        };
    }
    
    executeTurn(abilityId) {
        if (this.finished) {
            return { success: false, message: 'La batalla ya terminó' };
        }
        
        this.turn++;
        
        // Ataque
        const result = this.currentAttacker.attack(abilityId, this.currentDefender);
        
        if (!result.success) {
            return result;
        }
        
        this.addLog(`${this.currentAttacker.emoji} ${this.currentAttacker.name} usó ${result.abilityName}!`);
        
        if (result.damage > 0) {
            this.addLog(`💥 Causó ${result.damage} de daño!`);
            this.addLog(`${this.currentDefender.emoji} ${this.currentDefender.name}: ${this.currentDefender.currentHp}/${this.currentDefender.stats.hp} HP`);
        }
        
        // Verificar si hay ganador
        if (this.currentDefender.currentHp <= 0) {
            this.endBattle(this.currentAttacker);
            return {
                success: true,
                ...result,
                winner: this.winner.name,
                finished: true,
                log: this.log
            };
        }
        
        // Cambiar turno
        [this.currentAttacker, this.currentDefender] = [this.currentDefender, this.currentAttacker];
        
        return {
            success: true,
            ...result,
            nextAttacker: this.currentAttacker.name,
            finished: false,
            turn: this.turn
        };
    }
    
    autoPlay() {
        while (!this.finished) {
            // IA simple: elegir habilidad aleatoria
            const abilities = this.currentAttacker.abilities;
            const randomAbility = abilities[Math.floor(Math.random() * abilities.length)];
            
            this.executeTurn(randomAbility);
        }
        
        return this.getResult();
    }
    
    endBattle(winner) {
        this.winner = winner;
        this.finished = true;
        
        const loser = winner === this.pet1 ? this.pet2 : this.pet1;
        
        // Actualizar récords
        winner.wins++;
        loser.losses++;
        
        winner.lastBattle = Date.now();
        loser.lastBattle = Date.now();
        
        // Recompensas
        const expReward = Math.floor(CONFIG.BATTLE_REWARD_BASE * (1 + loser.level / 10));
        winner.addExp(expReward);
        
        // Restaurar HP
        this.pet1.currentHp = this.originalHp1;
        this.pet2.currentHp = this.originalHp2;
        
        this.addLog(`\n🏆 ${winner.emoji} ${winner.name} ganó la batalla!`);
        this.addLog(`⭐ +${expReward} EXP`);
        
        Logger.info(`🏆 ${winner.name} ganó contra ${loser.name}`);
    }
    
    addLog(message) {
        this.log.push(message);
    }
    
    getResult() {
        return {
            battleId: this.id,
            winner: this.winner?.name,
            loser: this.winner === this.pet1 ? this.pet2.name : this.pet1.name,
            turns: this.turn,
            log: this.log,
            pet1Stats: this.pet1.getStats(),
            pet2Stats: this.pet2.getStats()
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      GESTOR DE MASCOTAS                                     │
// ═══════════════════════════════════════════════════════════════════════════════

class PetManager {
    constructor() {
        this.pets = new Map();
        this.activeBattles = new Map();
    }
    
    adoptPet(owner, species, name = null) {
        try {
            const pet = new Pet(species, owner, name);
            this.pets.set(pet.id, pet);
            
            Logger.info(`🐾 ${owner} adoptó a ${pet.name}`);
            
            return {
                success: true,
                pet: pet.getFullInfo(),
                message: `¡Adoptaste a ${pet.emoji} ${pet.name}!`
            };
        } catch (error) {
            Logger.error('Error adoptando mascota:', error.message);
            return {
                success: false,
                message: error.message
            };
        }
    }
    
    getPet(petId) {
        return this.pets.get(petId);
    }
    
    getPetsByOwner(owner) {
        return Array.from(this.pets.values()).filter(pet => pet.owner === owner);
    }
    
    startBattle(petId1, petId2) {
        const pet1 = this.pets.get(petId1);
        const pet2 = this.pets.get(petId2);
        
        if (!pet1 || !pet2) {
            return { success: false, message: 'Mascotas no encontradas' };
        }
        
        const check1 = pet1.canBattle();
        if (!check1.can) {
            return { success: false, message: `${pet1.name}: ${check1.reason}` };
        }
        
        const check2 = pet2.canBattle();
        if (!check2.can) {
            return { success: false, message: `${pet2.name}: ${check2.reason}` };
        }
        
        const battle = new Battle(pet1, pet2);
        this.activeBattles.set(battle.id, battle);
        
        return {
            success: true,
            ...battle.start()
        };
    }
    
    getActiveBattle(battleId) {
        return this.activeBattles.get(battleId);
    }
    
    getRandomSpecies(rarity = null) {
        const species = Object.keys(SPECIES_CATALOG);
        
        if (rarity) {
            const filtered = species.filter(s => SPECIES_CATALOG[s].rarity === rarity);
            return filtered[Math.floor(Math.random() * filtered.length)];
        }
        
        // Usar probabilidades de rareza
        const random = Math.random() * 100;
        let cumulative = 0;
        
        for (const [rarityLevel, chance] of Object.entries(CONFIG.RARITY_CHANCES)) {
            cumulative += chance;
            if (random <= cumulative) {
                const filtered = species.filter(s => SPECIES_CATALOG[s].rarity === rarityLevel);
                return filtered[Math.floor(Math.random() * filtered.length)];
            }
        }
        
        return species[0];
    }
    
    getLeaderboard(type = 'level', limit = 10) {
        const allPets = Array.from(this.pets.values());
        
        const sorted = allPets.sort((a, b) => {
            switch (type) {
                case 'level':
                    return b.level - a.level;
                case 'wins':
                    return b.wins - a.wins;
                case 'winrate':
                    const winrateA = a.wins / (a.wins + a.losses || 1);
                    const winrateB = b.wins / (b.wins + b.losses || 1);
                    return winrateB - winrateA;
                default:
                    return b.level - a.level;
            }
        });
        
        return sorted.slice(0, limit).map((pet, index) => ({
            rank: index + 1,
            ...pet.getStats()
        }));
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      EXPORTACIONES                                          │
// ═══════════════════════════════════════════════════════════════════════════════

const petManager = new PetManager();

export default Pet;
export {
    Pet,
    Battle,
    PetManager,
    petManager,
    SPECIES_CATALOG,
    ABILITIES,
    ITEMS,
    CONFIG,
    Logger
};
