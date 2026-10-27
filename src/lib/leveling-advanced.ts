/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                   𒁈 LEVELING SYSTEM V3.0 ADVANCED 𒁈                       ┃
 * ┃              Sistema de Nivelación Avanzado con Prestigio                   ┃
 * ┃                    Creado para: Avenix-Multi V6.1.0                          ┃
 * ┃                    By: Hepein Oficial                                        ┃
 * ┃                                                                               ┃
 * ┃  CARACTERÍSTICAS:                                                            ┃
 * ┃  ✅ XP por actividad (mensajes, comandos, juegos)                          ┃
 * ┃  ✅ Curva de experiencia balanceada (exponencial)                           ┃
 * ┃  ✅ Sistema de prestigio (hasta 10 prestigios)                              ┃
 * ┃  ✅ Multiplicadores de XP (premium, boosts, eventos)                        ┃
 * ┃  ✅ Recompensas automáticas por nivel                                       ┃
 * ┃  ✅ Roles/títulos desbloqueables                                            ┃
 * ┃  ✅ Sistema de rachas (streak bonus)                                        ┃
 * ┃  ✅ Penalización por inactividad                                            ┃
 * ┃  ✅ Ranking global y por servidor                                           ┃
 * ┃  ✅ Estadísticas detalladas                                                 ┃
 * ┃  ✅ Visualización de progreso (barras, gráficos)                            ┃
 * ┃  ✅ Eventos de doble/triple XP                                              ┃
 * ┃  ✅ Sistema de medallas y logros                                            ┃
 * ┃  ✅ Boost temporal comprable                                                ┃
 * ┃  ✅ Anti-spam (cooldown entre XP)                                           ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import paint from './paint.js'

// ═══════════════════════════════════════════════════════════════════════════════
// │                        CONFIGURACIÓN GLOBAL                                 │
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
    // XP Base
    XP_PER_MESSAGE: 10,
    XP_PER_COMMAND: 5,
    XP_PER_GAME: 20,
    XP_PER_VOICE_MINUTE: 15,
    
    // Fórmula de nivel (XP necesario)
    LEVEL_BASE: 100,
    LEVEL_MULTIPLIER: 1.5,
    MAX_LEVEL: 100,
    
    // Prestigio
    PRESTIGE_ENABLED: true,
    MAX_PRESTIGE: 10,
    PRESTIGE_LEVEL_REQUIRED: 100,
    PRESTIGE_XP_BONUS: 0.1, // 10% extra por prestigio
    
    // Cooldowns (anti-spam)
    MESSAGE_COOLDOWN: 60000, // 1 minuto entre XP por mensaje
    COMMAND_COOLDOWN: 30000, // 30 segundos entre XP por comando
    
    // Multiplicadores
    PREMIUM_MULTIPLIER: 2.0,
    BOOST_MULTIPLIER: 1.5,
    EVENT_MULTIPLIER: 2.0,
    WEEKEND_MULTIPLIER: 1.25,
    
    // Rachas
    STREAK_ENABLED: true,
    STREAK_BONUS_PER_DAY: 0.05, // 5% extra por día
    STREAK_MAX_BONUS: 0.5, // Máximo 50% extra
    STREAK_RESET_HOURS: 48, // Reset si no se conecta en 48h
    
    // Inactividad
    INACTIVITY_ENABLED: true,
    INACTIVITY_DAYS: 30,
    INACTIVITY_XP_LOSS: 0.1, // Pierde 10% de XP
    
    // Recompensas
    REWARDS_ENABLED: true,
    MONEY_PER_LEVEL: 100,
    DIAMOND_PER_LEVEL: 1,
    BONUS_EVERY_N_LEVELS: 10, // Bonus especial cada 10 niveles
    
    // Roles
    AUTO_ROLES_ENABLED: false, // Activar si se integra con sistema de roles
    
    // Visualización
    SHOW_LEVELUP_MESSAGE: true,
    LEVELUP_EMOJI: '🎉',
    PROGRESS_BAR_LENGTH: 10,
    
    // Estadísticas
    STATS_ENABLED: true,
    SAVE_HISTORY: true,
    
    // Logging
    LOG_ENABLED: true,
    LOG_LEVEL: 'info'
};

// ═══════════════════════════════════════════════════════════════════════════════
// │                      TÍTULOS Y ROLES POR NIVEL                              │
// ═══════════════════════════════════════════════════════════════════════════════

const TITLES = {
    1: { name: 'Novato', emoji: '🌱', color: 'gray' },
    5: { name: 'Aprendiz', emoji: '📚', color: 'green' },
    10: { name: 'Aventurero', emoji: '⚔️', color: 'blue' },
    15: { name: 'Guerrero', emoji: '🛡️', color: 'cyan' },
    20: { name: 'Veterano', emoji: '🎖️', color: 'yellow' },
    25: { name: 'Experto', emoji: '💫', color: 'magenta' },
    30: { name: 'Maestro', emoji: '🎓', color: 'red' },
    40: { name: 'Campeón', emoji: '🏆', color: 'yellow' },
    50: { name: 'Héroe', emoji: '⭐', color: 'cyan' },
    60: { name: 'Leyenda', emoji: '👑', color: 'magenta' },
    70: { name: 'Titán', emoji: '⚡', color: 'red' },
    80: { name: 'Dios', emoji: '🔱', color: 'yellow' },
    90: { name: 'Inmortal', emoji: '💎', color: 'cyan' },
    100: { name: 'Trascendente', emoji: '✨', color: 'rainbow' }
};

// ═══════════════════════════════════════════════════════════════════════════════
// │                      MEDALLAS ESPECIALES                                    │
// ═══════════════════════════════════════════════════════════════════════════════

const MEDALS = {
    FIRST_LEVEL: { name: 'Primera Subida', emoji: '🥇', description: 'Alcanzaste nivel 1' },
    LEVEL_10: { name: 'Aventurero Novato', emoji: '🎯', description: 'Alcanzaste nivel 10' },
    LEVEL_50: { name: 'Héroe Local', emoji: '🌟', description: 'Alcanzaste nivel 50' },
    LEVEL_100: { name: 'Maestro Absoluto', emoji: '👑', description: 'Alcanzaste nivel 100' },
    FIRST_PRESTIGE: { name: 'Reinicio Épico', emoji: '🔄', description: 'Completaste tu primer prestigio' },
    MAX_PRESTIGE: { name: 'Prestigio Máximo', emoji: '💫', description: 'Alcanzaste prestigio 10' },
    STREAK_7: { name: 'Semana Completa', emoji: '📅', description: '7 días seguidos activo' },
    STREAK_30: { name: 'Mes Dedicado', emoji: '🗓️', description: '30 días seguidos activo' },
    TOP_1: { name: 'Rey del Ranking', emoji: '👑', description: 'Alcanzaste el puesto #1' },
    TOP_10: { name: 'Elite', emoji: '🏆', description: 'Entraste al top 10' },
    FAST_LEVELER: { name: 'Veloz', emoji: '⚡', description: 'Subiste 10 niveles en 24h' },
    XP_MASTER: { name: 'Maestro de XP', emoji: '💯', description: 'Ganaste 10,000 XP en un día' }
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
            debug: paint.bold.bgBlue(' DEBUG '),
            info: paint.bold.bgGreen(' INFO '),
            warn: paint.bold.bgYellow(' WARN '),
            error: paint.bold.bgRed(' ERROR ')
        }[level];
        
        console.log(prefix, '[Leveling]:', ...args);
    }
    
    static debug(...args) { this.log('debug', ...args); }
    static info(...args) { this.log('info', ...args); }
    static warn(...args) { this.log('warn', ...args); }
    static error(...args) { this.log('error', ...args); }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      CALCULADORA DE XP                                      │
// ═══════════════════════════════════════════════════════════════════════════════

class XPCalculator {
    /**
     * Calcula XP necesario para un nivel específico
     */
    static getXPForLevel(level) {
        if (level <= 0) return 0;
        if (level > CONFIG.MAX_LEVEL) level = CONFIG.MAX_LEVEL;
        
        return Math.floor(
            CONFIG.LEVEL_BASE * Math.pow(level, CONFIG.LEVEL_MULTIPLIER)
        );
    }
    
    /**
     * Calcula nivel actual basado en XP total
     */
    static getLevelFromXP(xp) {
        let level = 0;
        let totalXP = 0;
        
        while (level < CONFIG.MAX_LEVEL) {
            const nextLevelXP = this.getXPForLevel(level + 1);
            if (totalXP + nextLevelXP > xp) break;
            
            totalXP += nextLevelXP;
            level++;
        }
        
        return {
            level,
            currentXP: xp - totalXP,
            nextLevelXP: this.getXPForLevel(level + 1),
            totalXP: xp
        };
    }
    
    /**
     * Calcula XP total acumulado hasta un nivel
     */
    static getTotalXPForLevel(level) {
        let total = 0;
        for (let i = 1; i <= level; i++) {
            total += this.getXPForLevel(i);
        }
        return total;
    }
    
    /**
     * Calcula porcentaje de progreso en nivel actual
     */
    static getProgressPercentage(currentXP, nextLevelXP) {
        return Math.min(100, (currentXP / nextLevelXP) * 100);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      SISTEMA DE MULTIPLICADORES                             │
// ═══════════════════════════════════════════════════════════════════════════════

class MultiplierManager {
    activeBoosts: Map<any, any>
    activeEvents: Map<any, any>

    constructor() {
        this.activeBoosts = new Map(); // userId -> { multiplier, expires }
        this.activeEvents = new Map(); // eventId -> { multiplier, expires }
    }
    
    /**
     * Calcula multiplicador total para un usuario
     */
    calculateMultiplier(user, options: Record<string, any> = {}) {
        let multiplier = 1.0;
        
        // Premium
        if (user.premium) {
            multiplier *= CONFIG.PREMIUM_MULTIPLIER;
            Logger.debug(`Premium boost: x${CONFIG.PREMIUM_MULTIPLIER}`);
        }
        
        // Prestigio
        if (CONFIG.PRESTIGE_ENABLED && user.prestige > 0) {
            const prestigeBonus = user.prestige * CONFIG.PRESTIGE_XP_BONUS;
            multiplier *= (1 + prestigeBonus);
            Logger.debug(`Prestige boost: x${(1 + prestigeBonus).toFixed(2)}`);
        }
        
        // Racha
        if (CONFIG.STREAK_ENABLED && user.streak > 0) {
            const streakBonus = Math.min(
                user.streak * CONFIG.STREAK_BONUS_PER_DAY,
                CONFIG.STREAK_MAX_BONUS
            );
            multiplier *= (1 + streakBonus);
            Logger.debug(`Streak boost: x${(1 + streakBonus).toFixed(2)} (${user.streak} días)`);
        }
        
        // Boost temporal
        const boost = this.getActiveBoost(user.id);
        if (boost) {
            multiplier *= boost.multiplier;
            Logger.debug(`Boost temporal: x${boost.multiplier}`);
        }
        
        // Eventos globales
        const eventMultiplier = this.getEventMultiplier();
        if (eventMultiplier > 1) {
            multiplier *= eventMultiplier;
            Logger.debug(`Evento global: x${eventMultiplier}`);
        }
        
        // Fin de semana
        if (this.isWeekend()) {
            multiplier *= CONFIG.WEEKEND_MULTIPLIER;
            Logger.debug(`Fin de semana: x${CONFIG.WEEKEND_MULTIPLIER}`);
        }
        
        return multiplier;
    }
    
    /**
     * Activa boost temporal para usuario
     */
    activateBoost(userId, multiplier, durationMs) {
        this.activeBoosts.set(userId, {
            multiplier,
            expires: Date.now() + durationMs
        });
        
        Logger.info(`🚀 Boost x${multiplier} activado para ${userId} (${durationMs}ms)`);
    }
    
    /**
     * Obtiene boost activo del usuario
     */
    getActiveBoost(userId) {
        const boost = this.activeBoosts.get(userId);
        
        if (!boost) return null;
        
        // Verificar si expiró
        if (Date.now() > boost.expires) {
            this.activeBoosts.delete(userId);
            return null;
        }
        
        return boost;
    }
    
    /**
     * Activa evento global
     */
    activateEvent(eventId, multiplier, durationMs) {
        this.activeEvents.set(eventId, {
            multiplier,
            expires: Date.now() + durationMs
        });
        
        Logger.info(`🎉 Evento "${eventId}" x${multiplier} activado (${durationMs}ms)`);
    }
    
    /**
     * Obtiene multiplicador de eventos activos
     */
    getEventMultiplier() {
        let maxMultiplier = 1.0;
        
        for (const [eventId, event] of this.activeEvents.entries()) {
            if (Date.now() > event.expires) {
                this.activeEvents.delete(eventId);
                continue;
            }
            
            if (event.multiplier > maxMultiplier) {
                maxMultiplier = event.multiplier;
            }
        }
        
        return maxMultiplier;
    }
    
    /**
     * Verifica si es fin de semana
     */
    isWeekend() {
        const day = new Date().getDay();
        return day === 0 || day === 6; // Domingo o Sábado
    }
}

const multiplierManager = new MultiplierManager();

// ═══════════════════════════════════════════════════════════════════════════════
// │                      SISTEMA DE RACHAS (STREAKS)                            │
// ═══════════════════════════════════════════════════════════════════════════════

class StreakManager {
    /**
     * Actualiza racha del usuario
     */
    static updateStreak(user) {
        if (!CONFIG.STREAK_ENABLED) return 0;
        
        const now = Date.now();
        const lastActivity = user.lastActivity || 0;
        const hoursSinceLastActivity = (now - lastActivity) / (1000 * 60 * 60);
        
        // Primer login
        if (lastActivity === 0) {
            user.streak = 1;
            user.lastActivity = now;
            user.lastStreakUpdate = now;
            return 1;
        }
        
        // Reset si pasó mucho tiempo
        if (hoursSinceLastActivity > CONFIG.STREAK_RESET_HOURS) {
            Logger.warn(`⏰ Racha perdida para usuario (${hoursSinceLastActivity.toFixed(1)}h inactivo)`);
            user.streak = 1;
            user.lastActivity = now;
            user.lastStreakUpdate = now;
            return 1;
        }
        
        // Incrementar si es nuevo día
        const lastUpdate = user.lastStreakUpdate || 0;
        const daysSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60 * 24);
        
        if (daysSinceUpdate >= 1) {
            user.streak = (user.streak || 0) + 1;
            user.lastStreakUpdate = now;
            Logger.info(`🔥 Racha incrementada: ${user.streak} días`);
        }
        
        user.lastActivity = now;
        return user.streak;
    }
    
    /**
     * Obtiene bonificación de racha
     */
    static getStreakBonus(streak) {
        if (!CONFIG.STREAK_ENABLED || !streak) return 0;
        
        return Math.min(
            streak * CONFIG.STREAK_BONUS_PER_DAY,
            CONFIG.STREAK_MAX_BONUS
        );
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      SISTEMA PRINCIPAL DE NIVELACIÓN                        │
// ═══════════════════════════════════════════════════════════════════════════════

class LevelingSystem {
    cooldowns: Map<any, any>
    statistics: Map<any, any>

    constructor() {
        this.cooldowns = new Map(); // userId -> { message: timestamp, command: timestamp }
        this.statistics = new Map(); // userId -> stats
    }
    
    /**
     * Inicializa usuario en el sistema
     */
    initUser(user) {
        if (!user.exp) user.exp = 0;
        if (!user.level) user.level = 0;
        if (!user.prestige) user.prestige = 0;
        if (!user.streak) user.streak = 0;
        if (!user.lastActivity) user.lastActivity = 0;
        if (!user.lastStreakUpdate) user.lastStreakUpdate = 0;
        if (!user.medals) user.medals = [];
        if (!user.levelHistory) user.levelHistory = [];
        
        return user;
    }
    
    /**
     * Añade XP al usuario
     */
    addXP(user, amount, source = 'unknown', options: Record<string, any> = {}) {
        this.initUser(user);
        
        // Verificar cooldown
        if (!this.checkCooldown(user.id, source)) {
            Logger.debug(`⏳ Cooldown activo para ${user.id} (${source})`);
            return { success: false as const, reason: 'cooldown' };
        }
        
        // Actualizar racha
        StreakManager.updateStreak(user);
        
        // Calcular multiplicadores
        const multiplier = multiplierManager.calculateMultiplier(user, options);
        const finalXP = Math.floor(amount * multiplier);
        
        // Guardar nivel anterior
        const oldLevelData = XPCalculator.getLevelFromXP(user.exp);
        const oldLevel = oldLevelData.level;
        
        // Añadir XP
        user.exp += finalXP;
        
        // Calcular nuevo nivel
        const newLevelData = XPCalculator.getLevelFromXP(user.exp);
        const newLevel = newLevelData.level;
        
        // Verificar subida de nivel
        const leveledUp = newLevel > oldLevel;
        const levelsGained = newLevel - oldLevel;
        
        // Actualizar nivel
        user.level = newLevel;
        
        // Actualizar cooldown
        this.updateCooldown(user.id, source);
        
        // Registrar estadísticas
        this.recordStats(user.id, finalXP, source);
        
        Logger.info(`✨ +${finalXP} XP para ${user.id} (${source}, x${multiplier.toFixed(2)})`);
        
        // Procesar subida de nivel
        let rewards: any = null;
        let medals: any[] = [];
        
        if (leveledUp) {
            rewards = this.processLevelUp(user, oldLevel, newLevel);
            medals = this.checkMedals(user);
            
            // Guardar en historial
            if (CONFIG.SAVE_HISTORY) {
                user.levelHistory.push({
                    level: newLevel,
                    timestamp: Date.now(),
                    xp: user.exp
                });
                
                // Mantener solo últimos 100
                if (user.levelHistory.length > 100) {
                    user.levelHistory.shift();
                }
            }
        }
        
        return {
            success: true as const,
            xpGained: finalXP,
            multiplier,
            oldLevel,
            newLevel,
            leveledUp,
            levelsGained,
            levelData: newLevelData,
            rewards,
            medals,
            streak: user.streak
        };
    }
    
    /**
     * Procesa subida de nivel y recompensas
     */
    processLevelUp(user, oldLevel, newLevel) {
        const rewards: Record<string, any> = {
            money: 0,
            diamond: 0,
            items: [],
            title: null,
            special: []
        };
        
        if (!CONFIG.REWARDS_ENABLED) return rewards;
        
        // Recompensas por cada nivel subido
        for (let level = oldLevel + 1; level <= newLevel; level++) {
            rewards.money += CONFIG.MONEY_PER_LEVEL * (1 + user.prestige * 0.1);
            rewards.diamond += CONFIG.DIAMOND_PER_LEVEL;
            
            // Bonus especial cada N niveles
            if (level % CONFIG.BONUS_EVERY_N_LEVELS === 0) {
                const bonus = {
                    level,
                    money: CONFIG.MONEY_PER_LEVEL * 5,
                    diamond: CONFIG.DIAMOND_PER_LEVEL * 3,
                    message: `🎁 ¡Bonus especial nivel ${level}!`
                };
                rewards.special.push(bonus);
                rewards.money += bonus.money;
                rewards.diamond += bonus.diamond;
            }
            
            // Verificar título nuevo
            if (TITLES[level]) {
                rewards.title = TITLES[level];
                Logger.info(`🏆 Nuevo título desbloqueado: ${rewards.title?.name}`);
            }
        }
        
        Logger.info(`🎉 Nivel ${newLevel} alcanzado! Recompensas: $${rewards.money}, ${rewards.diamond}💎`);
        
        return rewards;
    }
    
    /**
     * Verifica y otorga medallas
     */
    checkMedals(user) {
        const newMedals: any[] = [];
        
        // Medalla primer nivel
        if (user.level === 1 && !user.medals.includes('FIRST_LEVEL')) {
            user.medals.push('FIRST_LEVEL');
            newMedals.push(MEDALS.FIRST_LEVEL);
        }
        
        // Medalla nivel 10
        if (user.level === 10 && !user.medals.includes('LEVEL_10')) {
            user.medals.push('LEVEL_10');
            newMedals.push(MEDALS.LEVEL_10);
        }
        
        // Medalla nivel 50
        if (user.level === 50 && !user.medals.includes('LEVEL_50')) {
            user.medals.push('LEVEL_50');
            newMedals.push(MEDALS.LEVEL_50);
        }
        
        // Medalla nivel 100
        if (user.level === 100 && !user.medals.includes('LEVEL_100')) {
            user.medals.push('LEVEL_100');
            newMedals.push(MEDALS.LEVEL_100);
        }
        
        // Medalla primer prestigio
        if (user.prestige === 1 && !user.medals.includes('FIRST_PRESTIGE')) {
            user.medals.push('FIRST_PRESTIGE');
            newMedals.push(MEDALS.FIRST_PRESTIGE);
        }
        
        // Medalla prestigio máximo
        if (user.prestige === CONFIG.MAX_PRESTIGE && !user.medals.includes('MAX_PRESTIGE')) {
            user.medals.push('MAX_PRESTIGE');
            newMedals.push(MEDALS.MAX_PRESTIGE);
        }
        
        // Medalla racha 7 días
        if (user.streak >= 7 && !user.medals.includes('STREAK_7')) {
            user.medals.push('STREAK_7');
            newMedals.push(MEDALS.STREAK_7);
        }
        
        // Medalla racha 30 días
        if (user.streak >= 30 && !user.medals.includes('STREAK_30')) {
            user.medals.push('STREAK_30');
            newMedals.push(MEDALS.STREAK_30);
        }
        
        return newMedals;
    }
    
    /**
     * Sistema de prestigio
     */
    prestige(user) {
        if (!CONFIG.PRESTIGE_ENABLED) {
            return { success: false as const, message: 'Prestigio desactivado' };
        }
        
        if (user.level < CONFIG.PRESTIGE_LEVEL_REQUIRED) {
            return {
                success: false as const,
                message: `Necesitas nivel ${CONFIG.PRESTIGE_LEVEL_REQUIRED} para hacer prestigio`
            };
        }
        
        if (user.prestige >= CONFIG.MAX_PRESTIGE) {
            return {
                success: false as const,
                message: `Ya alcanzaste el prestigio máximo (${CONFIG.MAX_PRESTIGE})`
            };
        }
        
        // Guardar progreso antes del reset
        const oldLevel = user.level;
        const oldXP = user.exp;
        
        // Reset
        user.prestige++;
        user.level = 0;
        user.exp = 0;
        
        // Bonificación por prestigio
        const bonus = {
            xpMultiplier: 1 + (user.prestige * CONFIG.PRESTIGE_XP_BONUS),
            money: 10000 * user.prestige,
            diamond: 50 * user.prestige
        };
        
        Logger.info(`⭐ Prestigio ${user.prestige} alcanzado! Bonus: x${bonus.xpMultiplier.toFixed(2)} XP`);
        
        return {
            success: true as const,
            oldLevel,
            oldXP,
            newPrestige: user.prestige,
            bonus
        };
    }
    
    /**
     * Verifica cooldown
     */
    checkCooldown(userId, source) {
        const cooldowns = this.cooldowns.get(userId) || {};
        const now = Date.now();
        
        let cooldownTime = 0;
        if (source === 'message') cooldownTime = CONFIG.MESSAGE_COOLDOWN;
        else if (source === 'command') cooldownTime = CONFIG.COMMAND_COOLDOWN;
        else return true; // Sin cooldown para otras fuentes
        
        const lastTime = cooldowns[source] || 0;
        return (now - lastTime) >= cooldownTime;
    }
    
    /**
     * Actualiza cooldown
     */
    updateCooldown(userId, source) {
        const cooldowns = this.cooldowns.get(userId) || {};
        cooldowns[source] = Date.now();
        this.cooldowns.set(userId, cooldowns);
    }
    
    /**
     * Registra estadísticas
     */
    recordStats(userId, xp, source) {
        if (!CONFIG.STATS_ENABLED) return;
        
        const stats = this.statistics.get(userId) || {
            totalXP: 0,
            bySource: {},
            sessions: 0,
            lastSession: 0
        };
        
        stats.totalXP += xp;
        stats.bySource[source] = (stats.bySource[source] || 0) + xp;
        stats.lastSession = Date.now();
        
        this.statistics.set(userId, stats);
    }
    
    /**
     * Obtiene estadísticas del usuario
     */
    getStats(userId) {
        return this.statistics.get(userId) || null;
    }
    
    /**
     * Renderiza barra de progreso
     */
    renderProgressBar(currentXP, nextLevelXP) {
        const percentage = XPCalculator.getProgressPercentage(currentXP, nextLevelXP);
        const filled = Math.floor((percentage / 100) * CONFIG.PROGRESS_BAR_LENGTH);
        const empty = CONFIG.PROGRESS_BAR_LENGTH - filled;
        
        const bar = '█'.repeat(filled) + '░'.repeat(empty);
        return `${bar} ${percentage.toFixed(1)}%`;
    }
    
    /**
     * Obtiene título actual del usuario
     */
    getUserTitle(level) {
        let title = TITLES[1]; // Default
        
        for (const [requiredLevel, titleData] of Object.entries(TITLES)) {
            if (level >= parseInt(requiredLevel)) {
                title = titleData;
            } else {
                break;
            }
        }
        
        return title;
    }
    
    /**
     * Genera tarjeta de perfil
     */
    generateProfileCard(user) {
        this.initUser(user);
        
        const levelData = XPCalculator.getLevelFromXP(user.exp);
        const title = this.getUserTitle(user.level);
        const progressBar = this.renderProgressBar(levelData.currentXP, levelData.nextLevelXP);
        const prestigeStars = '⭐'.repeat(user.prestige);
        
        return `
╭━━━━━━━━━━━━━━━━━━━━━━━━━╮
│  ${title.emoji} ${title.name} ${prestigeStars}
├━━━━━━━━━━━━━━━━━━━━━━━━━┤
│  📊 Nivel: ${user.level}
│  ✨ XP: ${levelData.currentXP.toLocaleString()}/${levelData.nextLevelXP.toLocaleString()}
│  📈 XP Total: ${user.exp.toLocaleString()}
│
│  ${progressBar}
│
│  ⭐ Prestigio: ${user.prestige}/${CONFIG.MAX_PRESTIGE}
│  🔥 Racha: ${user.streak} días
│  🏅 Medallas: ${user.medals.length}
╰━━━━━━━━━━━━━━━━━━━━━━━━━╯
        `.trim();
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      SISTEMA DE RANKING                                     │
// ═══════════════════════════════════════════════════════════════════════════════

class LeaderboardManager {
    /**
     * Obtiene ranking de usuarios
     */
    static getLeaderboard(users, limit = 10, sortBy = 'level') {
        const sorted = Object.entries(users as Record<string, any>)
            .map(([id, user]) => ({
                id,
                ...user,
                totalXP: user.exp || 0,
                level: user.level || 0,
                prestige: user.prestige || 0,
                score: (user.prestige || 0) * 1000000 + (user.exp || 0)
            }))
            .sort((a, b) => {
                if (sortBy === 'level') return b.score - a.score;
                if (sortBy === 'xp') return b.totalXP - a.totalXP;
                if (sortBy === 'prestige') return b.prestige - a.prestige;
                return 0;
            })
            .slice(0, limit);
        
        return sorted;
    }
    
    /**
     * Genera texto del leaderboard
     */
    static renderLeaderboard(leaderboard, currentUserId: any = null) {
        let text = '╭━━━━━━━━━━━━━━━━━━━━━━━━━╮\n';
        text += '│    🏆 RANKING GLOBAL    │\n';
        text += '├━━━━━━━━━━━━━━━━━━━━━━━━━┤\n';
        
        leaderboard.forEach((user, index) => {
            const position = index + 1;
            const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}.`;
            const stars = '⭐'.repeat(user.prestige);
            const isCurrentUser = user.id === currentUserId ? ' ◄' : '';
            
            text += `│ ${medal} Lv.${user.level} ${stars} ${user.name || user.id}${isCurrentUser}\n`;
        });
        
        text += '╰━━━━━━━━━━━━━━━━━━━━━━━━━╯';
        
        return text;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      EXPORTACIONES                                          │
// ═══════════════════════════════════════════════════════════════════════════════

const levelingSystem = new LevelingSystem();

export default LevelingSystem;
export {
    levelingSystem,
    XPCalculator,
    MultiplierManager,
    multiplierManager,
    StreakManager,
    LeaderboardManager,
    TITLES,
    MEDALS,
    CONFIG
};
