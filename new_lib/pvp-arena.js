/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                   𒁈 PVP ARENA V1.0 ULTRA 𒁈                                ┃
 * ┃              Sistema Completo de Arena PvP con ELO y Temporadas            ┃
 * ┃                    Creado para: Avenix-Multi V6.1.0                          ┃
 * ┃                    By: Hepein Oficial                                        ┃
 * ┃                                                                               ┃
 * ┃  CARACTERÍSTICAS:                                                            ┃
 * ┃  ✅ Sistema ELO completo (Chess.com style)                                  ┃
 * ┃  ✅ Matchmaking inteligente por rating                                      ┃
 * ┃  ✅ Temporadas con recompensas                                              ┃
 * ┃  ✅ Divisiones y ligas (Bronce → Legendario)                               ┃
 * ┃  ✅ Sistema de apuestas en batallas                                         ┃
 * ┃  ✅ Combate por turnos estratégico                                          ┃
 * ┃  ✅ Habilidades especiales y buffs                                          ┃
 * ┃  ✅ Equipment y power-ups                                                   ┃
 * ┃  ✅ Estadísticas detalladas                                                 ┃
 * ┃  ✅ Historial de combates                                                   ┃
 * ┃  ✅ Rankings por temporada                                                  ┃
 * ┃  ✅ Sistema de rachas (win streaks)                                         ┃
 * ┃  ✅ Recompensas por victoria                                                ┃
 * ┃  ✅ Sistema anti-cheat                                                      ┃
 * ┃  ✅ Replay de batallas                                                      ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import crypto from 'crypto';
import chalk from 'chalk';

// ═══════════════════════════════════════════════════════════════════════════════
// │                        CONFIGURACIÓN GLOBAL                                 │
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
    // Sistema ELO
    INITIAL_ELO: 1000,
    K_FACTOR: 32, // Factor K para cálculo ELO
    MIN_ELO: 0,
    MAX_ELO: 5000,
    
    // Divisiones y Ligas
    DIVISIONS: {
        UNRANKED: { name: 'Sin Rango', minElo: 0, icon: '⚪', color: 'gray' },
        BRONZE: { name: 'Bronce', minElo: 800, icon: '🥉', color: '#CD7F32' },
        SILVER: { name: 'Plata', minElo: 1000, icon: '🥈', color: '#C0C0C0' },
        GOLD: { name: 'Oro', minElo: 1200, icon: '🥇', color: '#FFD700' },
        PLATINUM: { name: 'Platino', minElo: 1400, icon: '💎', color: '#E5E4E2' },
        DIAMOND: { name: 'Diamante', minElo: 1600, icon: '💠', color: '#00CED1' },
        MASTER: { name: 'Maestro', minElo: 1800, icon: '👑', color: '#9400D3' },
        GRANDMASTER: { name: 'Gran Maestro', minElo: 2000, icon: '🔱', color: '#FF4500' },
        LEGENDARY: { name: 'Legendario', minElo: 2200, icon: '⚡', color: '#FFD700' }
    },
    
    // Matchmaking
    ELO_RANGE_SEARCH: 100, // Buscar oponentes ±100 ELO
    MAX_ELO_RANGE: 300, // Máximo ±300 ELO
    QUEUE_TIMEOUT: 300000, // 5 minutos en cola
    
    // Combate
    BASE_HP: 100,
    BASE_ATTACK: 10,
    BASE_DEFENSE: 5,
    TURN_TIMEOUT: 30000, // 30 segundos por turno
    MAX_TURNS: 50, // Máximo 50 turnos
    CRITICAL_CHANCE: 0.15, // 15% crítico
    CRITICAL_MULTIPLIER: 1.5,
    
    // Habilidades
    ABILITIES: {
        ATTACK: { name: 'Ataque Normal', damage: 1.0, cost: 0 },
        POWER_STRIKE: { name: 'Golpe Poderoso', damage: 1.5, cost: 20 },
        DEFEND: { name: 'Defender', reduction: 0.5, duration: 1 },
        HEAL: { name: 'Curar', amount: 30, cost: 25 },
        ULTIMATE: { name: 'Ultimate', damage: 2.5, cost: 50 }
    },
    
    // Apuestas
    MIN_BET: 100,
    MAX_BET: 100000,
    HOUSE_EDGE: 0.05, // 5% comisión
    
    // Recompensas
    BASE_REWARD_WIN: 500,
    BASE_REWARD_LOSS: 100,
    STREAK_BONUS: 100, // +100 por cada victoria consecutiva
    MAX_STREAK_BONUS: 1000,
    
    // Temporadas
    SEASON_DURATION: 2592000000, // 30 días
    SEASON_END_REWARDS: {
        LEGENDARY: 50000,
        GRANDMASTER: 30000,
        MASTER: 20000,
        DIAMOND: 10000,
        PLATINUM: 5000,
        GOLD: 2500,
        SILVER: 1000,
        BRONZE: 500
    },
    
    // Cooldowns
    BATTLE_COOLDOWN: 60000, // 1 minuto entre batallas
    
    // Anti-Cheat
    MAX_BATTLES_PER_HOUR: 30,
    SUSPICIOUS_WIN_RATE: 0.95, // 95% sospechoso
    
    // Logging
    LOG_ENABLED: true,
    LOG_LEVEL: 'info'
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
        
        console.log(prefix, `[${chalk.gray(timestamp)}] [PvPArena]:`, ...args);
    }
    
    static debug(...args) { this.log('debug', ...args); }
    static info(...args) { this.log('info', ...args); }
    static warn(...args) { this.log('warn', ...args); }
    static error(...args) { this.log('error', ...args); }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      CLASE FIGHTER (LUCHADOR)                               │
// ═══════════════════════════════════════════════════════════════════════════════

class Fighter {
    constructor(userId, stats = {}) {
        this.userId = userId;
        
        // Stats base
        this.maxHP = stats.maxHP || CONFIG.BASE_HP;
        this.currentHP = this.maxHP;
        this.attack = stats.attack || CONFIG.BASE_ATTACK;
        this.defense = stats.defense || CONFIG.BASE_DEFENSE;
        
        // Estado de batalla
        this.energy = 100;
        this.buffs = [];
        this.debuffs = [];
        this.defending = false;
        
        // Equipment (si tiene)
        this.equipment = stats.equipment || {};
        
        this.applyEquipmentBonuses();
    }
    
    applyEquipmentBonuses() {
        if (this.equipment.weapon) {
            this.attack += this.equipment.weapon.bonus || 0;
        }
        if (this.equipment.armor) {
            this.defense += this.equipment.armor.bonus || 0;
        }
        if (this.equipment.accessory) {
            this.maxHP += this.equipment.accessory.bonus || 0;
            this.currentHP = this.maxHP;
        }
    }
    
    takeDamage(amount) {
        let finalDamage = amount;
        
        // Aplicar defensa
        const reduction = this.defense * 0.5;
        finalDamage = Math.max(1, finalDamage - reduction);
        
        // Si está defendiendo
        if (this.defending) {
            finalDamage *= CONFIG.ABILITIES.DEFEND.reduction;
            this.defending = false;
        }
        
        this.currentHP = Math.max(0, this.currentHP - Math.floor(finalDamage));
        
        return Math.floor(finalDamage);
    }
    
    heal(amount) {
        const healed = Math.min(amount, this.maxHP - this.currentHP);
        this.currentHP += healed;
        return healed;
    }
    
    useEnergy(amount) {
        if (this.energy < amount) return false;
        this.energy -= amount;
        return true;
    }
    
    regenerateEnergy(amount = 10) {
        this.energy = Math.min(100, this.energy + amount);
    }
    
    isAlive() {
        return this.currentHP > 0;
    }
    
    getStatus() {
        return {
            hp: `${this.currentHP}/${this.maxHP}`,
            energy: this.energy,
            attack: this.attack,
            defense: this.defense,
            buffs: this.buffs.length,
            defending: this.defending
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      CLASE BATTLE (BATALLA)                                 │
// ═══════════════════════════════════════════════════════════════════════════════

class Battle {
    constructor(player1, player2, options = {}) {
        this.id = crypto.randomBytes(8).toString('hex');
        this.player1 = new Fighter(player1.userId, player1.stats);
        this.player2 = new Fighter(player2.userId, player2.stats);
        
        this.currentTurn = Math.random() < 0.5 ? 1 : 2; // Quién empieza aleatorio
        this.turnCount = 0;
        this.maxTurns = CONFIG.MAX_TURNS;
        
        this.status = 'active';
        this.winner = null;
        this.loser = null;
        
        this.startTime = Date.now();
        this.endTime = null;
        
        this.bet = options.bet || 0;
        this.ranked = options.ranked !== false;
        
        this.log = [];
        this.actions = [];
        
        Logger.info(`⚔️ Batalla iniciada: ${player1.userId} vs ${player2.userId}`);
    }
    
    getCurrentPlayer() {
        return this.currentTurn === 1 ? this.player1 : this.player2;
    }
    
    getOpponent() {
        return this.currentTurn === 1 ? this.player2 : this.player1;
    }
    
    addLog(message, type = 'info') {
        this.log.push({
            turn: this.turnCount,
            message,
            type,
            timestamp: Date.now()
        });
    }
    
    /**
     * Ejecutar acción de combate
     */
    executeAction(userId, actionType, target = null) {
        if (this.status !== 'active') {
            return { success: false, message: 'Batalla no está activa' };
        }
        
        const attacker = this.getCurrentPlayer();
        const defender = this.getOpponent();
        
        if (attacker.userId !== userId) {
            return { success: false, message: 'No es tu turno' };
        }
        
        let result = { success: true, message: '', damage: 0, healed: 0 };
        
        switch (actionType) {
            case 'ATTACK':
                result = this.performAttack(attacker, defender);
                break;
            case 'POWER_STRIKE':
                result = this.performPowerStrike(attacker, defender);
                break;
            case 'DEFEND':
                result = this.performDefend(attacker);
                break;
            case 'HEAL':
                result = this.performHeal(attacker);
                break;
            case 'ULTIMATE':
                result = this.performUltimate(attacker, defender);
                break;
            default:
                return { success: false, message: 'Acción inválida' };
        }
        
        if (!result.success) {
            return result;
        }
        
        // Registrar acción
        this.actions.push({
            turn: this.turnCount,
            player: userId,
            action: actionType,
            result
        });
        
        this.addLog(result.message, 'action');
        
        // Verificar si alguien murió
        if (!defender.isAlive()) {
            this.endBattle(attacker.userId, defender.userId, 'knockout');
            return { ...result, battleEnded: true, winner: attacker.userId };
        }
        
        // Regenerar energía
        attacker.regenerateEnergy();
        defender.regenerateEnergy();
        
        // Cambiar turno
        this.nextTurn();
        
        // Verificar límite de turnos
        if (this.turnCount >= this.maxTurns) {
            this.endBattle(null, null, 'timeout');
            return { ...result, battleEnded: true, winner: null };
        }
        
        return result;
    }
    
    performAttack(attacker, defender) {
        let damage = attacker.attack;
        
        // Crítico
        if (Math.random() < CONFIG.CRITICAL_CHANCE) {
            damage *= CONFIG.CRITICAL_MULTIPLIER;
            const finalDamage = defender.takeDamage(damage);
            return {
                success: true,
                message: `¡CRÍTICO! ${attacker.userId} causó ${finalDamage} de daño`,
                damage: finalDamage,
                critical: true
            };
        }
        
        const finalDamage = defender.takeDamage(damage);
        return {
            success: true,
            message: `${attacker.userId} atacó causando ${finalDamage} de daño`,
            damage: finalDamage
        };
    }
    
    performPowerStrike(attacker, defender) {
        const ability = CONFIG.ABILITIES.POWER_STRIKE;
        
        if (!attacker.useEnergy(ability.cost)) {
            return { success: false, message: 'Energía insuficiente' };
        }
        
        let damage = attacker.attack * ability.damage;
        
        const finalDamage = defender.takeDamage(damage);
        return {
            success: true,
            message: `${attacker.userId} usó GOLPE PODEROSO causando ${finalDamage} de daño`,
            damage: finalDamage
        };
    }
    
    performDefend(attacker) {
        attacker.defending = true;
        return {
            success: true,
            message: `${attacker.userId} se está defendiendo`,
            damage: 0
        };
    }
    
    performHeal(attacker) {
        const ability = CONFIG.ABILITIES.HEAL;
        
        if (!attacker.useEnergy(ability.cost)) {
            return { success: false, message: 'Energía insuficiente' };
        }
        
        const healed = attacker.heal(ability.amount);
        return {
            success: true,
            message: `${attacker.userId} se curó ${healed} HP`,
            healed
        };
    }
    
    performUltimate(attacker, defender) {
        const ability = CONFIG.ABILITIES.ULTIMATE;
        
        if (!attacker.useEnergy(ability.cost)) {
            return { success: false, message: 'Energía insuficiente' };
        }
        
        let damage = attacker.attack * ability.damage;
        
        const finalDamage = defender.takeDamage(damage);
        return {
            success: true,
            message: `¡${attacker.userId} USÓ SU ULTIMATE! Causó ${finalDamage} de daño devastador`,
            damage: finalDamage,
            ultimate: true
        };
    }
    
    nextTurn() {
        this.currentTurn = this.currentTurn === 1 ? 2 : 1;
        this.turnCount++;
        
        Logger.debug(`Turno ${this.turnCount}: ${this.getCurrentPlayer().userId}`);
    }
    
    endBattle(winnerId, loserId, reason) {
        this.status = 'finished';
        this.winner = winnerId;
        this.loser = loserId;
        this.endTime = Date.now();
        
        const duration = this.endTime - this.startTime;
        
        this.addLog(`Batalla finalizada: ${reason}`, 'end');
        Logger.info(`⚔️ Batalla ${this.id} finalizada - Ganador: ${winnerId || 'Empate'}`);
        
        return {
            winner: winnerId,
            loser: loserId,
            reason,
            duration,
            turns: this.turnCount
        };
    }
    
    getBattleState() {
        return {
            id: this.id,
            status: this.status,
            currentTurn: this.currentTurn,
            turnCount: this.turnCount,
            player1: {
                userId: this.player1.userId,
                status: this.player1.getStatus()
            },
            player2: {
                userId: this.player2.userId,
                status: this.player2.getStatus()
            },
            bet: this.bet,
            ranked: this.ranked
        };
    }
    
    getReplay() {
        return {
            id: this.id,
            player1: this.player1.userId,
            player2: this.player2.userId,
            winner: this.winner,
            duration: this.endTime - this.startTime,
            turns: this.turnCount,
            actions: this.actions,
            log: this.log
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      PLAYER STATS (ESTADÍSTICAS)                            │
// ═══════════════════════════════════════════════════════════════════════════════

class PlayerStats {
    constructor(userId, data = {}) {
        this.userId = userId;
        
        // ELO y División
        this.elo = data.elo || CONFIG.INITIAL_ELO;
        this.division = this.calculateDivision();
        this.peakElo = data.peakElo || this.elo;
        
        // Estadísticas
        this.wins = data.wins || 0;
        this.losses = data.losses || 0;
        this.draws = data.draws || 0;
        this.totalBattles = this.wins + this.losses + this.draws;
        this.winRate = this.totalBattles > 0 ? (this.wins / this.totalBattles) : 0;
        
        // Rachas
        this.currentStreak = data.currentStreak || 0;
        this.bestStreak = data.bestStreak || 0;
        
        // Temporada actual
        this.seasonWins = data.seasonWins || 0;
        this.seasonLosses = data.seasonLosses || 0;
        this.seasonBattles = this.seasonWins + this.seasonLosses;
        
        // Combate
        this.totalDamageDealt = data.totalDamageDealt || 0;
        this.totalDamageTaken = data.totalDamageTaken || 0;
        this.totalHealing = data.totalHealing || 0;
        this.knockouts = data.knockouts || 0;
        
        // Económico
        this.totalEarnings = data.totalEarnings || 0;
        this.totalBet = data.totalBet || 0;
        this.netProfit = this.totalEarnings - this.totalBet;
        
        // Stats personalizados
        this.customStats = data.customStats || {
            hp: CONFIG.BASE_HP,
            attack: CONFIG.BASE_ATTACK,
            defense: CONFIG.BASE_DEFENSE
        };
        
        // Equipment
        this.equipment = data.equipment || {};
        
        // Historial
        this.lastBattleTime = data.lastBattleTime || 0;
        this.battleHistory = data.battleHistory || [];
        
        // Anti-cheat
        this.battlesThisHour = data.battlesThisHour || 0;
        this.lastHourReset = data.lastHourReset || Date.now();
    }
    
    calculateDivision() {
        const divisions = Object.entries(CONFIG.DIVISIONS)
            .sort((a, b) => b[1].minElo - a[1].minElo);
        
        for (const [key, div] of divisions) {
            if (this.elo >= div.minElo) {
                return key;
            }
        }
        
        return 'UNRANKED';
    }
    
    updateElo(opponentElo, won, draw = false) {
        const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - this.elo) / 400));
        const actualScore = draw ? 0.5 : (won ? 1 : 0);
        
        const eloChange = Math.round(CONFIG.K_FACTOR * (actualScore - expectedScore));
        
        this.elo = Math.max(CONFIG.MIN_ELO, Math.min(CONFIG.MAX_ELO, this.elo + eloChange));
        
        if (this.elo > this.peakElo) {
            this.peakElo = this.elo;
        }
        
        this.division = this.calculateDivision();
        
        return eloChange;
    }
    
    recordBattle(won, draw = false, opponent = null, battleData = {}) {
        // Actualizar estadísticas generales
        if (draw) {
            this.draws++;
        } else if (won) {
            this.wins++;
            this.seasonWins++;
            this.currentStreak++;
            
            if (this.currentStreak > this.bestStreak) {
                this.bestStreak = this.currentStreak;
            }
        } else {
            this.losses++;
            this.seasonLosses++;
            this.currentStreak = 0;
        }
        
        this.totalBattles = this.wins + this.losses + this.draws;
        this.seasonBattles = this.seasonWins + this.seasonLosses;
        this.winRate = this.totalBattles > 0 ? (this.wins / this.totalBattles) : 0;
        
        // Actualizar ELO si es ranked
        if (battleData.ranked && opponent) {
            this.updateElo(opponent.elo, won, draw);
        }
        
        // Estadísticas de combate
        this.totalDamageDealt += battleData.damageDealt || 0;
        this.totalDamageTaken += battleData.damageTaken || 0;
        this.totalHealing += battleData.healing || 0;
        
        if (battleData.knockout) {
            this.knockouts++;
        }
        
        // Económico
        const earnings = battleData.earnings || 0;
        const bet = battleData.bet || 0;
        
        this.totalEarnings += earnings;
        this.totalBet += bet;
        this.netProfit = this.totalEarnings - this.totalBet;
        
        // Historial
        this.lastBattleTime = Date.now();
        this.battleHistory.unshift({
            opponent: opponent?.userId,
            result: draw ? 'draw' : (won ? 'win' : 'loss'),
            eloChange: battleData.eloChange || 0,
            earnings,
            timestamp: Date.now()
        });
        
        // Mantener solo últimas 50 batallas
        if (this.battleHistory.length > 50) {
            this.battleHistory = this.battleHistory.slice(0, 50);
        }
        
        // Anti-cheat
        this.incrementBattleCounter();
        
        Logger.debug(`📊 Stats actualizadas para ${this.userId}`);
    }
    
    incrementBattleCounter() {
        const now = Date.now();
        
        if (now - this.lastHourReset > 3600000) {
            this.battlesThisHour = 1;
            this.lastHourReset = now;
        } else {
            this.battlesThisHour++;
        }
    }
    
    isSuspicious() {
        // Demasiadas batallas por hora
        if (this.battlesThisHour > CONFIG.MAX_BATTLES_PER_HOUR) {
            return { suspicious: true, reason: 'Demasiadas batallas por hora' };
        }
        
        // Winrate sospechoso
        if (this.totalBattles > 20 && this.winRate > CONFIG.SUSPICIOUS_WIN_RATE) {
            return { suspicious: true, reason: 'Winrate anormalmente alto' };
        }
        
        return { suspicious: false };
    }
    
    getReward(won, draw = false) {
        if (draw) {
            return Math.floor(CONFIG.BASE_REWARD_LOSS * 1.5);
        }
        
        if (!won) {
            return CONFIG.BASE_REWARD_LOSS;
        }
        
        let reward = CONFIG.BASE_REWARD_WIN;
        
        // Bonus por racha
        const streakBonus = Math.min(
            this.currentStreak * CONFIG.STREAK_BONUS,
            CONFIG.MAX_STREAK_BONUS
        );
        
        reward += streakBonus;
        
        // Bonus por división
        const divisionMultiplier = {
            UNRANKED: 1.0,
            BRONZE: 1.1,
            SILVER: 1.2,
            GOLD: 1.3,
            PLATINUM: 1.5,
            DIAMOND: 1.7,
            MASTER: 2.0,
            GRANDMASTER: 2.5,
            LEGENDARY: 3.0
        }[this.division] || 1.0;
        
        reward = Math.floor(reward * divisionMultiplier);
        
        return reward;
    }
    
    getInfo() {
        const divInfo = CONFIG.DIVISIONS[this.division];
        
        return {
            userId: this.userId,
            elo: this.elo,
            division: {
                name: divInfo.name,
                icon: divInfo.icon,
                color: divInfo.color
            },
            peakElo: this.peakElo,
            wins: this.wins,
            losses: this.losses,
            draws: this.draws,
            totalBattles: this.totalBattles,
            winRate: `${(this.winRate * 100).toFixed(2)}%`,
            currentStreak: this.currentStreak,
            bestStreak: this.bestStreak,
            season: {
                wins: this.seasonWins,
                losses: this.seasonLosses,
                battles: this.seasonBattles
            },
            combat: {
                damageDealt: this.totalDamageDealt,
                damageTaken: this.totalDamageTaken,
                healing: this.totalHealing,
                knockouts: this.knockouts
            },
            economy: {
                earnings: this.totalEarnings,
                bet: this.totalBet,
                profit: this.netProfit
            },
            stats: this.customStats
        };
    }
    
    toJSON() {
        return {
            userId: this.userId,
            elo: this.elo,
            peakElo: this.peakElo,
            wins: this.wins,
            losses: this.losses,
            draws: this.draws,
            currentStreak: this.currentStreak,
            bestStreak: this.bestStreak,
            seasonWins: this.seasonWins,
            seasonLosses: this.seasonLosses,
            totalDamageDealt: this.totalDamageDealt,
            totalDamageTaken: this.totalDamageTaken,
            totalHealing: this.totalHealing,
            knockouts: this.knockouts,
            totalEarnings: this.totalEarnings,
            totalBet: this.totalBet,
            customStats: this.customStats,
            equipment: this.equipment,
            lastBattleTime: this.lastBattleTime,
            battleHistory: this.battleHistory,
            battlesThisHour: this.battlesThisHour,
            lastHourReset: this.lastHourReset
        };
    }
    
    static fromJSON(data) {
        return new PlayerStats(data.userId, data);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      ARENA MANAGER                                          │
// ═══════════════════════════════════════════════════════════════════════════════

class ArenaManager {
    constructor() {
        this.players = new Map();
        this.activeBattles = new Map();
        this.queue = [];
        this.battleHistory = [];
        
        // Temporada
        this.currentSeason = 1;
        this.seasonStartTime = Date.now();
        this.seasonEndTime = Date.now() + CONFIG.SEASON_DURATION;
        
        Logger.info(`🏟️ Arena Manager inicializado - Temporada ${this.currentSeason}`);
    }
    
    /**
     * Registrar jugador o obtenerlo
     */
    getOrCreatePlayer(userId) {
        if (!this.players.has(userId)) {
            const player = new PlayerStats(userId);
            this.players.set(userId, player);
            Logger.info(`👤 Nuevo jugador registrado: ${userId}`);
        }
        
        return this.players.get(userId);
    }
    
    /**
     * Añadir jugador a la cola
     */
    joinQueue(userId) {
        const player = this.getOrCreatePlayer(userId);
        
        // Verificar cooldown
        const timeSinceLastBattle = Date.now() - player.lastBattleTime;
        if (timeSinceLastBattle < CONFIG.BATTLE_COOLDOWN) {
            const timeLeft = CONFIG.BATTLE_COOLDOWN - timeSinceLastBattle;
            return {
                success: false,
                message: `Espera ${Math.ceil(timeLeft / 1000)}s para otra batalla`
            };
        }
        
        // Verificar anti-cheat
        const suspicious = player.isSuspicious();
        if (suspicious.suspicious) {
            return {
                success: false,
                message: `Cuenta bajo revisión: ${suspicious.reason}`
            };
        }
        
        // Verificar si ya está en cola
        if (this.queue.find(p => p.userId === userId)) {
            return {
                success: false,
                message: 'Ya estás en la cola'
            };
        }
        
        // Verificar si ya está en batalla
        if (this.getPlayerBattle(userId)) {
            return {
                success: false,
                message: 'Ya estás en una batalla'
            };
        }
        
        this.queue.push({
            userId,
            elo: player.elo,
            joinedAt: Date.now()
        });
        
        Logger.info(`🎯 ${userId} se unió a la cola (ELO: ${player.elo})`);
        
        // Intentar matchmaking
        const match = this.findMatch(userId);
        
        if (match) {
            return {
                success: true,
                message: 'Oponente encontrado',
                matched: true,
                opponent: match.opponent
            };
        }
        
        return {
            success: true,
            message: 'Buscando oponente...',
            matched: false,
            queuePosition: this.queue.length
        };
    }
    
    /**
     * Salir de la cola
     */
    leaveQueue(userId) {
        const index = this.queue.findIndex(p => p.userId === userId);
        
        if (index === -1) {
            return { success: false, message: 'No estás en la cola' };
        }
        
        this.queue.splice(index, 1);
        Logger.info(`❌ ${userId} salió de la cola`);
        
        return { success: true, message: 'Saliste de la cola' };
    }
    
    /**
     * Encontrar oponente
     */
    findMatch(userId) {
        const player = this.queue.find(p => p.userId === userId);
        if (!player) return null;
        
        // Buscar oponente con ELO similar
        let eloRange = CONFIG.ELO_RANGE_SEARCH;
        const waitTime = Date.now() - player.joinedAt;
        
        // Expandir rango si lleva mucho tiempo esperando
        if (waitTime > 60000) { // 1 minuto
            eloRange = CONFIG.MAX_ELO_RANGE;
        }
        
        const opponent = this.queue.find(p => 
            p.userId !== userId &&
            Math.abs(p.elo - player.elo) <= eloRange
        );
        
        if (opponent) {
            // Remover ambos de la cola
            this.queue = this.queue.filter(p => 
                p.userId !== userId && p.userId !== opponent.userId
            );
            
            Logger.info(`⚔️ Match encontrado: ${userId} (${player.elo}) vs ${opponent.userId} (${opponent.elo})`);
            
            return {
                player: userId,
                opponent: opponent.userId,
                eloDiff: Math.abs(player.elo - opponent.elo)
            };
        }
        
        return null;
    }
    
    /**
     * Crear batalla
     */
    createBattle(player1Id, player2Id, options = {}) {
        const p1Stats = this.getOrCreatePlayer(player1Id);
        const p2Stats = this.getOrCreatePlayer(player2Id);
        
        const battle = new Battle(
            { userId: player1Id, stats: p1Stats.customStats },
            { userId: player2Id, stats: p2Stats.customStats },
            options
        );
        
        this.activeBattles.set(battle.id, battle);
        
        Logger.info(`🆕 Batalla creada: ${battle.id}`);
        
        return battle;
    }
    
    /**
     * Obtener batalla activa del jugador
     */
    getPlayerBattle(userId) {
        for (const battle of this.activeBattles.values()) {
            if (battle.player1.userId === userId || battle.player2.userId === userId) {
                return battle;
            }
        }
        return null;
    }
    
    /**
     * Obtener batalla por ID
     */
    getBattle(battleId) {
        return this.activeBattles.get(battleId);
    }
    
    /**
     * Finalizar batalla y procesar recompensas
     */
    finalizeBattle(battleId) {
        const battle = this.activeBattles.get(battleId);
        if (!battle || battle.status !== 'finished') {
            return { success: false, message: 'Batalla no encontrada o no finalizada' };
        }
        
        const p1Stats = this.players.get(battle.player1.userId);
        const p2Stats = this.players.get(battle.player2.userId);
        
        const isDraw = !battle.winner;
        const p1Won = battle.winner === battle.player1.userId;
        const p2Won = battle.winner === battle.player2.userId;
        
        // Calcular recompensas
        const p1Reward = p1Stats.getReward(p1Won, isDraw);
        const p2Reward = p2Stats.getReward(p2Won, isDraw);
        
        // Procesar apuesta
        let p1BetResult = 0;
        let p2BetResult = 0;
        
        if (battle.bet > 0) {
            const totalBet = battle.bet * 2;
            const houseAmount = Math.floor(totalBet * CONFIG.HOUSE_EDGE);
            const winnerPrize = totalBet - houseAmount;
            
            if (p1Won) {
                p1BetResult = winnerPrize;
                p2BetResult = -battle.bet;
            } else if (p2Won) {
                p1BetResult = -battle.bet;
                p2BetResult = winnerPrize;
            } else {
                // Empate: devolver apuestas
                p1BetResult = 0;
                p2BetResult = 0;
            }
        }
        
        const p1Total = p1Reward + p1BetResult;
        const p2Total = p2Reward + p2BetResult;
        
        // Calcular cambio de ELO
        let p1EloChange = 0;
        let p2EloChange = 0;
        
        if (battle.ranked) {
            p1EloChange = p1Stats.updateElo(p2Stats.elo, p1Won, isDraw);
            p2EloChange = p2Stats.updateElo(p1Stats.elo, p2Won, isDraw);
        }
        
        // Registrar batalla en estadísticas
        p1Stats.recordBattle(p1Won, isDraw, p2Stats, {
            ranked: battle.ranked,
            damageDealt: battle.player1.maxHP - battle.player2.currentHP,
            damageTaken: battle.player1.maxHP - battle.player1.currentHP,
            knockout: battle.player2.currentHP === 0,
            earnings: p1Total,
            bet: battle.bet,
            eloChange: p1EloChange
        });
        
        p2Stats.recordBattle(p2Won, isDraw, p1Stats, {
            ranked: battle.ranked,
            damageDealt: battle.player2.maxHP - battle.player1.currentHP,
            damageTaken: battle.player2.maxHP - battle.player2.currentHP,
            knockout: battle.player1.currentHP === 0,
            earnings: p2Total,
            bet: battle.bet,
            eloChange: p2EloChange
        });
        
        // Guardar en historial
        this.battleHistory.unshift({
            battleId,
            player1: battle.player1.userId,
            player2: battle.player2.userId,
            winner: battle.winner,
            timestamp: battle.endTime,
            duration: battle.endTime - battle.startTime,
            turns: battle.turnCount,
            ranked: battle.ranked,
            bet: battle.bet
        });
        
        // Limitar historial
        if (this.battleHistory.length > 100) {
            this.battleHistory = this.battleHistory.slice(0, 100);
        }
        
        // Eliminar batalla activa
        this.activeBattles.delete(battleId);
        
        Logger.info(`✅ Batalla ${battleId} finalizada y procesada`);
        
        return {
            success: true,
            results: {
                winner: battle.winner,
                player1: {
                    userId: battle.player1.userId,
                    reward: p1Total,
                    eloChange: p1EloChange,
                    newElo: p1Stats.elo
                },
                player2: {
                    userId: battle.player2.userId,
                    reward: p2Total,
                    eloChange: p2EloChange,
                    newElo: p2Stats.elo
                },
                replay: battle.getReplay()
            }
        };
    }
    
    /**
     * Obtener leaderboard
     */
    getLeaderboard(type = 'elo', limit = 20) {
        const players = Array.from(this.players.values());
        
        let sorted;
        switch (type) {
            case 'elo':
                sorted = players.sort((a, b) => b.elo - a.elo);
                break;
            case 'wins':
                sorted = players.sort((a, b) => b.wins - a.wins);
                break;
            case 'winrate':
                sorted = players.filter(p => p.totalBattles >= 10)
                    .sort((a, b) => b.winRate - a.winRate);
                break;
            case 'streak':
                sorted = players.sort((a, b) => b.currentStreak - a.currentStreak);
                break;
            case 'season':
                sorted = players.sort((a, b) => b.seasonWins - a.seasonWins);
                break;
            default:
                sorted = players.sort((a, b) => b.elo - a.elo);
        }
        
        return sorted.slice(0, limit).map((player, index) => ({
            rank: index + 1,
            ...player.getInfo()
        }));
    }
    
    /**
     * Finalizar temporada
     */
    endSeason() {
        Logger.info(`🏁 Finalizando temporada ${this.currentSeason}`);
        
        const rewards = new Map();
        
        for (const [userId, player] of this.players.entries()) {
            const divisionReward = CONFIG.SEASON_END_REWARDS[player.division] || 0;
            
            if (divisionReward > 0) {
                rewards.set(userId, {
                    division: player.division,
                    reward: divisionReward,
                    finalElo: player.elo,
                    seasonWins: player.seasonWins,
                    seasonLosses: player.seasonLosses
                });
            }
            
            // Reset stats de temporada
            player.seasonWins = 0;
            player.seasonLosses = 0;
            player.seasonBattles = 0;
        }
        
        // Nueva temporada
        this.currentSeason++;
        this.seasonStartTime = Date.now();
        this.seasonEndTime = Date.now() + CONFIG.SEASON_DURATION;
        
        Logger.info(`🆕 Nueva temporada ${this.currentSeason} iniciada`);
        
        return {
            season: this.currentSeason - 1,
            rewards: Array.from(rewards.entries()).map(([userId, data]) => ({
                userId,
                ...data
            }))
        };
    }
    
    /**
     * Guardar todos los datos
     */
    saveAll() {
        return {
            players: Array.from(this.players.entries()).map(([id, player]) => 
                [id, player.toJSON()]
            ),
            battleHistory: this.battleHistory,
            season: {
                current: this.currentSeason,
                startTime: this.seasonStartTime,
                endTime: this.seasonEndTime
            }
        };
    }
    
    /**
     * Cargar datos guardados
     */
    loadAll(data) {
        if (data.players) {
            for (const [id, playerData] of data.players) {
                this.players.set(id, PlayerStats.fromJSON(playerData));
            }
        }
        
        if (data.battleHistory) {
            this.battleHistory = data.battleHistory;
        }
        
        if (data.season) {
            this.currentSeason = data.season.current;
            this.seasonStartTime = data.season.startTime;
            this.seasonEndTime = data.season.endTime;
        }
        
        Logger.info(`📦 Datos cargados: ${this.players.size} jugadores`);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      EXPORTACIONES                                          │
// ═══════════════════════════════════════════════════════════════════════════════

const arenaManager = new ArenaManager();

export default Battle;
export {
    Battle,
    Fighter,
    PlayerStats,
    ArenaManager,
    arenaManager,
    CONFIG,
    Logger
};
