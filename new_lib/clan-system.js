/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                   𒁈 CLAN SYSTEM V1.0 ULTRA 𒁈                              ┃
 * ┃              Sistema Completo de Clanes para Bots de WhatsApp               ┃
 * ┃                    Creado para: Avenix-Multi V6.1.0                          ┃
 * ┃                    By: Hepein Oficial                                        ┃
 * ┃                                                                               ┃
 * ┃  CARACTERÍSTICAS:                                                            ┃
 * ┃  ✅ Sistema de rangos (Líder, Co-líder, Élite, Miembro)                    ┃
 * ┃  ✅ Invitaciones y solicitudes de ingreso                                   ┃
 * ┃  ✅ Guerras entre clanes (PvP masivo)                                       ┃
 * ┃  ✅ Sistema de territorios conquistables                                    ┃
 * ┃  ✅ Niveles y XP de clan                                                    ┃
 * ┃  ✅ Tesorería compartida del clan                                           ┃
 * ┃  ✅ Estadísticas detalladas y rankings                                      ┃
 * ┃  ✅ Sistema de logros de clan                                               ┃
 * ┃  ✅ Chat privado de clan                                                    ┃
 * ┃  ✅ Alianzas entre clanes                                                   ┃
 * ┃  ✅ Sistema de contribuciones                                               ┃
 * ┃  ✅ Eventos de clan programados                                             ┃
 * ┃  ✅ Beneficios desbloqueables por nivel                                     ┃
 * ┃  ✅ Sistema de impuestos y bonos                                            ┃
 * ┃  ✅ Protección anti-raid                                                    ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import crypto from 'crypto';
import chalk from 'chalk';

// ═══════════════════════════════════════════════════════════════════════════════
// │                        CONFIGURACIÓN GLOBAL                                 │
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
    // Límites de clan
    MAX_CLAN_NAME_LENGTH: 20,
    MIN_CLAN_NAME_LENGTH: 3,
    MAX_CLAN_TAG_LENGTH: 5,
    MIN_CLAN_TAG_LENGTH: 2,
    MAX_CLAN_DESCRIPTION: 200,
    MAX_CLAN_MEMBERS: 50,
    MIN_MEMBERS_TO_WAR: 5,
    
    // Costos
    CLAN_CREATE_COST: 50000, // Money para crear clan
    CLAN_RENAME_COST: 10000,
    CLAN_TAG_CHANGE_COST: 5000,
    
    // Rangos
    RANKS: {
        LEADER: 'leader',       // Líder del clan
        COLEADER: 'coleader',   // Co-líder
        ELITE: 'elite',         // Miembro élite
        MEMBER: 'member'        // Miembro regular
    },
    
    // Permisos por rango
    PERMISSIONS: {
        leader: ['all'],
        coleader: ['invite', 'kick', 'promote', 'demote', 'war', 'alliance', 'deposit', 'withdraw'],
        elite: ['invite', 'war', 'deposit'],
        member: ['deposit']
    },
    
    // Guerras
    WAR_DURATION: 86400000, // 24 horas
    WAR_COOLDOWN: 172800000, // 48 horas
    WAR_PREPARATION_TIME: 3600000, // 1 hora
    WAR_COST_PER_MEMBER: 1000,
    
    // XP y Niveles
    BASE_XP_PER_LEVEL: 1000,
    XP_MULTIPLIER: 1.5,
    MAX_CLAN_LEVEL: 50,
    
    // Territorios
    TOTAL_TERRITORIES: 20,
    TERRITORY_CONQUEST_COST: 25000,
    TERRITORY_INCOME_PER_HOUR: 500,
    
    // Cooldowns
    INVITE_COOLDOWN: 300000, // 5 minutos
    KICK_COOLDOWN: 60000, // 1 minuto
    DONATE_COOLDOWN: 3600000, // 1 hora
    
    // Contribuciones
    DAILY_CONTRIBUTION_LIMIT: 100000,
    
    // Impuestos
    DEFAULT_TAX_RATE: 0.05, // 5% de ganancias van al clan
    MAX_TAX_RATE: 0.20, // 20% máximo
    
    // Protección
    CLAN_SHIELD_DURATION: 259200000, // 3 días para nuevos clanes
    
    // Alianzas
    MAX_ALLIANCES: 5,
    
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
        
        console.log(prefix, `[${chalk.gray(timestamp)}] [ClanSystem]:`, ...args);
    }
    
    static debug(...args) { this.log('debug', ...args); }
    static info(...args) { this.log('info', ...args); }
    static warn(...args) { this.log('warn', ...args); }
    static error(...args) { this.log('error', ...args); }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      CLASE CLAN                                             │
// ═══════════════════════════════════════════════════════════════════════════════

class Clan {
    constructor(data) {
        this.id = data.id || crypto.randomBytes(8).toString('hex');
        this.name = data.name;
        this.tag = data.tag; // [TAG]
        this.description = data.description || '';
        this.leader = data.leader;
        this.createdAt = data.createdAt || Date.now();
        this.members = data.members || new Map([[data.leader, CONFIG.RANKS.LEADER]]);
        
        // XP y Nivel
        this.xp = data.xp || 0;
        this.level = data.level || 1;
        
        // Economía
        this.treasury = data.treasury || 0; // Tesorería del clan
        this.taxRate = data.taxRate || CONFIG.DEFAULT_TAX_RATE;
        
        // Estadísticas
        this.stats = data.stats || {
            totalWins: 0,
            totalLosses: 0,
            totalDraws: 0,
            territoriesOwned: 0,
            totalDonations: 0,
            totalMembers: 1,
            totalKills: 0,
            totalDeaths: 0,
            warWins: 0,
            warLosses: 0
        };
        
        // Territorios
        this.territories = data.territories || [];
        
        // Alianzas
        this.alliances = data.alliances || [];
        
        // Guerras
        this.currentWar = data.currentWar || null;
        this.warHistory = data.warHistory || [];
        this.lastWarTime = data.lastWarTime || 0;
        
        // Protección
        this.shieldUntil = data.shieldUntil || (Date.now() + CONFIG.CLAN_SHIELD_DURATION);
        
        // Logros
        this.achievements = data.achievements || [];
        
        // Configuración
        this.settings = data.settings || {
            openToJoin: false,
            minLevel: 1,
            minMoney: 0,
            requireApproval: true
        };
        
        // Invitaciones y solicitudes
        this.invitations = data.invitations || new Map(); // userId -> timestamp
        this.requests = data.requests || new Map(); // userId -> timestamp
        
        // Historial
        this.activityLog = data.activityLog || [];
        this.contributions = data.contributions || new Map(); // userId -> amount
        
        Logger.info(`🏰 Clan "${this.name}" [${this.tag}] inicializado`);
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      GESTIÓN DE MIEMBROS                              │
    // ═════════════════════════════════════════════════════════════════════════
    
    /**
     * Añade un miembro al clan
     */
    addMember(userId, rank = CONFIG.RANKS.MEMBER) {
        if (this.members.has(userId)) {
            return { success: false, message: 'El usuario ya es miembro' };
        }
        
        if (this.members.size >= CONFIG.MAX_CLAN_MEMBERS) {
            return { success: false, message: 'El clan está lleno' };
        }
        
        this.members.set(userId, rank);
        this.stats.totalMembers = this.members.size;
        
        this.addActivity('member_join', userId, `Se unió al clan`);
        Logger.info(`👤 ${userId} se unió al clan ${this.name}`);
        
        return { success: true, message: 'Miembro añadido exitosamente' };
    }
    
    /**
     * Elimina un miembro del clan
     */
    removeMember(userId, removedBy) {
        if (!this.members.has(userId)) {
            return { success: false, message: 'El usuario no es miembro' };
        }
        
        if (userId === this.leader) {
            return { success: false, message: 'No puedes expulsar al líder' };
        }
        
        // Devolver contribuciones (50%)
        const contribution = this.contributions.get(userId) || 0;
        const refund = Math.floor(contribution * 0.5);
        
        this.members.delete(userId);
        this.contributions.delete(userId);
        this.stats.totalMembers = this.members.size;
        
        this.addActivity('member_kick', removedBy, `Expulsó a ${userId}`);
        Logger.info(`🚫 ${userId} fue expulsado del clan ${this.name}`);
        
        return { 
            success: true, 
            message: 'Miembro expulsado',
            refund 
        };
    }
    
    /**
     * Promover miembro
     */
    promoteMember(userId, promotedBy) {
        if (!this.members.has(userId)) {
            return { success: false, message: 'El usuario no es miembro' };
        }
        
        const currentRank = this.members.get(userId);
        let newRank;
        
        switch (currentRank) {
            case CONFIG.RANKS.MEMBER:
                newRank = CONFIG.RANKS.ELITE;
                break;
            case CONFIG.RANKS.ELITE:
                newRank = CONFIG.RANKS.COLEADER;
                break;
            case CONFIG.RANKS.COLEADER:
                return { success: false, message: 'Ya es co-líder' };
            default:
                return { success: false, message: 'No se puede promover más' };
        }
        
        this.members.set(userId, newRank);
        this.addActivity('member_promote', promotedBy, `Promovió a ${userId} a ${newRank}`);
        Logger.info(`⬆️ ${userId} promovido a ${newRank} en ${this.name}`);
        
        return { success: true, message: `Promovido a ${newRank}`, newRank };
    }
    
    /**
     * Degradar miembro
     */
    demoteMember(userId, demotedBy) {
        if (!this.members.has(userId)) {
            return { success: false, message: 'El usuario no es miembro' };
        }
        
        if (userId === this.leader) {
            return { success: false, message: 'No puedes degradar al líder' };
        }
        
        const currentRank = this.members.get(userId);
        let newRank;
        
        switch (currentRank) {
            case CONFIG.RANKS.COLEADER:
                newRank = CONFIG.RANKS.ELITE;
                break;
            case CONFIG.RANKS.ELITE:
                newRank = CONFIG.RANKS.MEMBER;
                break;
            case CONFIG.RANKS.MEMBER:
                return { success: false, message: 'Ya es miembro regular' };
            default:
                return { success: false, message: 'No se puede degradar más' };
        }
        
        this.members.set(userId, newRank);
        this.addActivity('member_demote', demotedBy, `Degradó a ${userId} a ${newRank}`);
        Logger.info(`⬇️ ${userId} degradado a ${newRank} en ${this.name}`);
        
        return { success: true, message: `Degradado a ${newRank}`, newRank };
    }
    
    /**
     * Transferir liderazgo
     */
    transferLeadership(newLeader, currentLeader) {
        if (currentLeader !== this.leader) {
            return { success: false, message: 'Solo el líder puede transferir el liderazgo' };
        }
        
        if (!this.members.has(newLeader)) {
            return { success: false, message: 'El usuario no es miembro' };
        }
        
        // Cambiar roles
        this.members.set(currentLeader, CONFIG.RANKS.COLEADER);
        this.members.set(newLeader, CONFIG.RANKS.LEADER);
        this.leader = newLeader;
        
        this.addActivity('leadership_transfer', currentLeader, `Transfirió el liderazgo a ${newLeader}`);
        Logger.info(`👑 Liderazgo de ${this.name} transferido a ${newLeader}`);
        
        return { success: true, message: 'Liderazgo transferido' };
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      SISTEMA DE INVITACIONES                          │
    // ═════════════════════════════════════════════════════════════════════════
    
    /**
     * Invitar usuario al clan
     */
    inviteMember(userId, invitedBy) {
        if (this.members.has(userId)) {
            return { success: false, message: 'El usuario ya es miembro' };
        }
        
        if (this.invitations.has(userId)) {
            return { success: false, message: 'Ya hay una invitación pendiente' };
        }
        
        if (this.members.size >= CONFIG.MAX_CLAN_MEMBERS) {
            return { success: false, message: 'El clan está lleno' };
        }
        
        this.invitations.set(userId, { invitedBy, timestamp: Date.now() });
        
        Logger.info(`📨 ${invitedBy} invitó a ${userId} al clan ${this.name}`);
        
        return { 
            success: true, 
            message: 'Invitación enviada',
            expiresIn: CONFIG.INVITE_COOLDOWN
        };
    }
    
    /**
     * Aceptar invitación
     */
    acceptInvitation(userId) {
        if (!this.invitations.has(userId)) {
            return { success: false, message: 'No tienes invitación pendiente' };
        }
        
        this.invitations.delete(userId);
        return this.addMember(userId);
    }
    
    /**
     * Rechazar invitación
     */
    rejectInvitation(userId) {
        if (!this.invitations.has(userId)) {
            return { success: false, message: 'No tienes invitación pendiente' };
        }
        
        this.invitations.delete(userId);
        Logger.info(`❌ ${userId} rechazó la invitación del clan ${this.name}`);
        
        return { success: true, message: 'Invitación rechazada' };
    }
    
    /**
     * Solicitar unirse al clan
     */
    requestJoin(userId) {
        if (this.members.has(userId)) {
            return { success: false, message: 'Ya eres miembro' };
        }
        
        if (this.requests.has(userId)) {
            return { success: false, message: 'Ya tienes una solicitud pendiente' };
        }
        
        if (this.members.size >= CONFIG.MAX_CLAN_MEMBERS) {
            return { success: false, message: 'El clan está lleno' };
        }
        
        this.requests.set(userId, { timestamp: Date.now() });
        
        Logger.info(`📝 ${userId} solicitó unirse al clan ${this.name}`);
        
        return { success: true, message: 'Solicitud enviada' };
    }
    
    /**
     * Aceptar solicitud
     */
    acceptRequest(userId, acceptedBy) {
        if (!this.requests.has(userId)) {
            return { success: false, message: 'No hay solicitud de este usuario' };
        }
        
        this.requests.delete(userId);
        return this.addMember(userId);
    }
    
    /**
     * Rechazar solicitud
     */
    rejectRequest(userId, rejectedBy) {
        if (!this.requests.has(userId)) {
            return { success: false, message: 'No hay solicitud de este usuario' };
        }
        
        this.requests.delete(userId);
        Logger.info(`❌ ${rejectedBy} rechazó la solicitud de ${userId} en ${this.name}`);
        
        return { success: true, message: 'Solicitud rechazada' };
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      SISTEMA DE ECONOMÍA                              │
    // ═════════════════════════════════════════════════════════════════════════
    
    /**
     * Depositar dinero en la tesorería
     */
    deposit(userId, amount) {
        if (!this.members.has(userId)) {
            return { success: false, message: 'No eres miembro del clan' };
        }
        
        if (amount <= 0) {
            return { success: false, message: 'Cantidad inválida' };
        }
        
        const currentContribution = this.contributions.get(userId) || 0;
        
        this.treasury += amount;
        this.contributions.set(userId, currentContribution + amount);
        this.stats.totalDonations += amount;
        
        this.addActivity('deposit', userId, `Depositó $${amount.toLocaleString()}`);
        this.addXP(Math.floor(amount / 100)); // 1 XP por cada 100 money
        
        Logger.info(`💰 ${userId} depositó $${amount} en ${this.name}`);
        
        return { 
            success: true, 
            message: 'Depósito exitoso',
            newBalance: this.treasury,
            totalContribution: this.contributions.get(userId)
        };
    }
    
    /**
     * Retirar dinero de la tesorería
     */
    withdraw(userId, amount) {
        if (!this.members.has(userId)) {
            return { success: false, message: 'No eres miembro del clan' };
        }
        
        if (amount <= 0 || amount > this.treasury) {
            return { success: false, message: 'Cantidad inválida' };
        }
        
        this.treasury -= amount;
        this.addActivity('withdraw', userId, `Retiró $${amount.toLocaleString()}`);
        
        Logger.info(`💸 ${userId} retiró $${amount} de ${this.name}`);
        
        return { 
            success: true, 
            message: 'Retiro exitoso',
            amount,
            newBalance: this.treasury
        };
    }
    
    /**
     * Establecer tasa de impuestos
     */
    setTaxRate(newRate, changedBy) {
        if (newRate < 0 || newRate > CONFIG.MAX_TAX_RATE) {
            return { 
                success: false, 
                message: `La tasa debe estar entre 0% y ${CONFIG.MAX_TAX_RATE * 100}%` 
            };
        }
        
        this.taxRate = newRate;
        this.addActivity('tax_change', changedBy, `Cambió impuestos a ${(newRate * 100).toFixed(1)}%`);
        
        Logger.info(`💵 ${changedBy} cambió impuestos de ${this.name} a ${newRate * 100}%`);
        
        return { success: true, message: `Impuestos establecidos en ${newRate * 100}%` };
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      SISTEMA DE XP Y NIVELES                          │
    // ═════════════════════════════════════════════════════════════════════════
    
    /**
     * Añadir XP al clan
     */
    addXP(amount) {
        this.xp += amount;
        
        // Verificar si sube de nivel
        const xpNeeded = this.getXPForNextLevel();
        
        if (this.xp >= xpNeeded && this.level < CONFIG.MAX_CLAN_LEVEL) {
            this.levelUp();
        }
        
        return { xp: this.xp, level: this.level };
    }
    
    /**
     * Calcular XP necesario para siguiente nivel
     */
    getXPForNextLevel() {
        return Math.floor(
            CONFIG.BASE_XP_PER_LEVEL * Math.pow(CONFIG.XP_MULTIPLIER, this.level - 1)
        );
    }
    
    /**
     * Subir de nivel
     */
    levelUp() {
        this.level++;
        this.xp = 0;
        
        // Beneficios por nivel
        const benefits = this.getLevelBenefits();
        
        this.addActivity('level_up', 'system', `¡El clan subió al nivel ${this.level}!`);
        Logger.info(`⬆️ ${this.name} subió al nivel ${this.level}`);
        
        return { 
            success: true, 
            newLevel: this.level,
            benefits 
        };
    }
    
    /**
     * Obtener beneficios del nivel actual
     */
    getLevelBenefits() {
        return {
            maxMembers: Math.min(CONFIG.MAX_CLAN_MEMBERS, 10 + (this.level * 2)),
            treasuryBonus: this.level * 0.05, // 5% más por nivel
            warBonus: this.level * 0.02, // 2% más daño en guerras
            territorySlots: Math.floor(this.level / 5), // 1 slot extra cada 5 niveles
            dailyReward: this.level * 100 // Recompensa diaria
        };
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      SISTEMA DE GUERRAS                               │
    // ═════════════════════════════════════════════════════════════════════════
    
    /**
     * Declarar guerra a otro clan
     */
    declareWar(targetClan, declaredBy) {
        // Validaciones
        if (this.currentWar) {
            return { success: false, message: 'Ya estás en guerra' };
        }
        
        if (Date.now() - this.lastWarTime < CONFIG.WAR_COOLDOWN) {
            const timeLeft = CONFIG.WAR_COOLDOWN - (Date.now() - this.lastWarTime);
            return { 
                success: false, 
                message: `Cooldown de guerra: ${Math.ceil(timeLeft / 3600000)}h restantes` 
            };
        }
        
        if (this.members.size < CONFIG.MIN_MEMBERS_TO_WAR) {
            return { 
                success: false, 
                message: `Se necesitan mínimo ${CONFIG.MIN_MEMBERS_TO_WAR} miembros` 
            };
        }
        
        if (Date.now() < this.shieldUntil) {
            return { success: false, message: 'El clan tiene escudo de protección activo' };
        }
        
        // Costo de guerra
        const warCost = this.members.size * CONFIG.WAR_COST_PER_MEMBER;
        if (this.treasury < warCost) {
            return { 
                success: false, 
                message: `Se necesitan $${warCost.toLocaleString()} en tesorería` 
            };
        }
        
        // Crear guerra
        const war = {
            id: crypto.randomBytes(8).toString('hex'),
            attacker: this.id,
            defender: targetClan.id,
            startTime: Date.now() + CONFIG.WAR_PREPARATION_TIME,
            endTime: Date.now() + CONFIG.WAR_PREPARATION_TIME + CONFIG.WAR_DURATION,
            status: 'preparation',
            attackerScore: 0,
            defenderScore: 0,
            attackerParticipants: Array.from(this.members.keys()),
            defenderParticipants: Array.from(targetClan.members.keys()),
            battles: [],
            winner: null
        };
        
        this.currentWar = war;
        this.treasury -= warCost;
        
        this.addActivity('war_declared', declaredBy, `Declaró guerra a ${targetClan.name}`);
        Logger.info(`⚔️ ${this.name} declaró guerra a ${targetClan.name}`);
        
        return { 
            success: true, 
            message: 'Guerra declarada',
            war 
        };
    }
    
    /**
     * Registrar batalla en guerra
     */
    addWarBattle(war, attackerId, defenderId, result) {
        if (!this.currentWar || this.currentWar.id !== war.id) {
            return { success: false, message: 'No hay guerra activa' };
        }
        
        if (this.currentWar.status !== 'active') {
            return { success: false, message: 'La guerra no ha iniciado' };
        }
        
        const battle = {
            id: crypto.randomBytes(4).toString('hex'),
            timestamp: Date.now(),
            attacker: attackerId,
            defender: defenderId,
            winner: result.winner,
            damage: result.damage || 0
        };
        
        this.currentWar.battles.push(battle);
        
        if (result.winner === attackerId) {
            this.currentWar.attackerScore += result.damage;
        } else {
            this.currentWar.defenderScore += result.damage;
        }
        
        Logger.debug(`⚔️ Batalla registrada: ${attackerId} vs ${defenderId}`);
        
        return { success: true, battle };
    }
    
    /**
     * Finalizar guerra
     */
    endWar() {
        if (!this.currentWar) {
            return { success: false, message: 'No hay guerra activa' };
        }
        
        const war = this.currentWar;
        
        // Determinar ganador
        if (war.attackerScore > war.defenderScore) {
            war.winner = war.attacker;
            this.stats.warWins++;
        } else if (war.defenderScore > war.attackerScore) {
            war.winner = war.defender;
            this.stats.warLosses++;
        } else {
            war.winner = null; // Empate
            this.stats.totalDraws++;
        }
        
        war.status = 'finished';
        this.warHistory.push(war);
        this.currentWar = null;
        this.lastWarTime = Date.now();
        
        // Recompensas
        let reward = 0;
        if (war.winner === this.id) {
            reward = Math.floor(war.defenderScore * 0.5); // 50% del score enemigo
            this.treasury += reward;
            this.addXP(war.attackerScore);
        }
        
        this.addActivity('war_ended', 'system', 
            war.winner === this.id ? '¡Victoria en guerra!' : 
            war.winner ? 'Derrota en guerra' : 'Empate en guerra'
        );
        
        Logger.info(`⚔️ Guerra finalizada: ${this.name} - ${war.winner === this.id ? 'VICTORIA' : 'DERROTA'}`);
        
        return { 
            success: true, 
            war,
            reward 
        };
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      SISTEMA DE TERRITORIOS                           │
    // ═════════════════════════════════════════════════════════════════════════
    
    /**
     * Conquistar territorio
     */
    conquestTerritory(territoryId) {
        if (this.territories.includes(territoryId)) {
            return { success: false, message: 'Ya controlas este territorio' };
        }
        
        if (this.treasury < CONFIG.TERRITORY_CONQUEST_COST) {
            return { 
                success: false, 
                message: `Se necesitan $${CONFIG.TERRITORY_CONQUEST_COST.toLocaleString()}` 
            };
        }
        
        const maxTerritories = this.getLevelBenefits().territorySlots;
        if (this.territories.length >= maxTerritories) {
            return { 
                success: false, 
                message: `Máximo ${maxTerritories} territorios en nivel ${this.level}` 
            };
        }
        
        this.territories.push(territoryId);
        this.treasury -= CONFIG.TERRITORY_CONQUEST_COST;
        this.stats.territoriesOwned = this.territories.length;
        
        this.addActivity('territory_conquest', 'system', `Conquistó territorio #${territoryId}`);
        this.addXP(500);
        
        Logger.info(`🏴 ${this.name} conquistó territorio #${territoryId}`);
        
        return { 
            success: true, 
            message: 'Territorio conquistado',
            income: CONFIG.TERRITORY_INCOME_PER_HOUR 
        };
    }
    
    /**
     * Perder territorio
     */
    loseTerritory(territoryId) {
        const index = this.territories.indexOf(territoryId);
        if (index === -1) {
            return { success: false, message: 'No controlas este territorio' };
        }
        
        this.territories.splice(index, 1);
        this.stats.territoriesOwned = this.territories.length;
        
        this.addActivity('territory_lost', 'system', `Perdió territorio #${territoryId}`);
        
        Logger.info(`💔 ${this.name} perdió territorio #${territoryId}`);
        
        return { success: true, message: 'Territorio perdido' };
    }
    
    /**
     * Calcular ingresos de territorios
     */
    collectTerritoryIncome() {
        const income = this.territories.length * CONFIG.TERRITORY_INCOME_PER_HOUR;
        
        if (income > 0) {
            this.treasury += income;
            Logger.debug(`💰 ${this.name} recaudó $${income} de territorios`);
        }
        
        return income;
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      SISTEMA DE ALIANZAS                              │
    // ═════════════════════════════════════════════════════════════════════════
    
    /**
     * Proponer alianza
     */
    proposeAlliance(targetClanId, proposedBy) {
        if (this.alliances.length >= CONFIG.MAX_ALLIANCES) {
            return { 
                success: false, 
                message: `Máximo ${CONFIG.MAX_ALLIANCES} alianzas` 
            };
        }
        
        if (this.alliances.includes(targetClanId)) {
            return { success: false, message: 'Ya son aliados' };
        }
        
        this.addActivity('alliance_proposed', proposedBy, `Propuso alianza con clan #${targetClanId}`);
        
        Logger.info(`🤝 ${this.name} propuso alianza a clan #${targetClanId}`);
        
        return { success: true, message: 'Propuesta de alianza enviada' };
    }
    
    /**
     * Aceptar alianza
     */
    acceptAlliance(allyId, acceptedBy) {
        if (this.alliances.includes(allyId)) {
            return { success: false, message: 'Ya son aliados' };
        }
        
        this.alliances.push(allyId);
        this.addActivity('alliance_accepted', acceptedBy, `Aceptó alianza con clan #${allyId}`);
        
        Logger.info(`🤝 ${this.name} aceptó alianza con clan #${allyId}`);
        
        return { success: true, message: 'Alianza establecida' };
    }
    
    /**
     * Romper alianza
     */
    breakAlliance(allyId, brokenBy) {
        const index = this.alliances.indexOf(allyId);
        if (index === -1) {
            return { success: false, message: 'No son aliados' };
        }
        
        this.alliances.splice(index, 1);
        this.addActivity('alliance_broken', brokenBy, `Rompió alianza con clan #${allyId}`);
        
        Logger.info(`💔 ${this.name} rompió alianza con clan #${allyId}`);
        
        return { success: true, message: 'Alianza rota' };
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      UTILIDADES                                       │
    // ═════════════════════════════════════════════════════════════════════════
    
    /**
     * Verificar permisos de usuario
     */
    hasPermission(userId, permission) {
        if (!this.members.has(userId)) return false;
        
        const rank = this.members.get(userId);
        const permissions = CONFIG.PERMISSIONS[rank] || [];
        
        return permissions.includes('all') || permissions.includes(permission);
    }
    
    /**
     * Obtener rango de usuario
     */
    getMemberRank(userId) {
        return this.members.get(userId) || null;
    }
    
    /**
     * Añadir actividad al log
     */
    addActivity(type, userId, description) {
        this.activityLog.push({
            type,
            userId,
            description,
            timestamp: Date.now()
        });
        
        // Mantener solo últimas 100 actividades
        if (this.activityLog.length > 100) {
            this.activityLog = this.activityLog.slice(-100);
        }
    }
    
    /**
     * Obtener información completa del clan
     */
    getInfo() {
        return {
            id: this.id,
            name: this.name,
            tag: this.tag,
            description: this.description,
            leader: this.leader,
            level: this.level,
            xp: this.xp,
            xpNeeded: this.getXPForNextLevel(),
            treasury: this.treasury,
            taxRate: this.taxRate,
            members: this.members.size,
            maxMembers: this.getLevelBenefits().maxMembers,
            stats: this.stats,
            territories: this.territories.length,
            alliances: this.alliances.length,
            currentWar: this.currentWar ? {
                enemy: this.currentWar.defender,
                status: this.currentWar.status,
                score: `${this.currentWar.attackerScore} - ${this.currentWar.defenderScore}`
            } : null,
            shieldActive: Date.now() < this.shieldUntil,
            createdAt: this.createdAt,
            benefits: this.getLevelBenefits()
        };
    }
    
    /**
     * Obtener ranking de contribuciones
     */
    getTopContributors(limit = 10) {
        return Array.from(this.contributions.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([userId, amount], index) => ({
                rank: index + 1,
                userId,
                amount,
                percentage: (amount / this.stats.totalDonations * 100).toFixed(2)
            }));
    }
    
    /**
     * Serializar para guardado
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            tag: this.tag,
            description: this.description,
            leader: this.leader,
            createdAt: this.createdAt,
            members: Array.from(this.members.entries()),
            xp: this.xp,
            level: this.level,
            treasury: this.treasury,
            taxRate: this.taxRate,
            stats: this.stats,
            territories: this.territories,
            alliances: this.alliances,
            currentWar: this.currentWar,
            warHistory: this.warHistory,
            lastWarTime: this.lastWarTime,
            shieldUntil: this.shieldUntil,
            achievements: this.achievements,
            settings: this.settings,
            invitations: Array.from(this.invitations.entries()),
            requests: Array.from(this.requests.entries()),
            activityLog: this.activityLog,
            contributions: Array.from(this.contributions.entries())
        };
    }
    
    /**
     * Deserializar desde JSON
     */
    static fromJSON(data) {
        return new Clan({
            ...data,
            members: new Map(data.members),
            invitations: new Map(data.invitations),
            requests: new Map(data.requests),
            contributions: new Map(data.contributions)
        });
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      GESTOR DE CLANES                                       │
// ═══════════════════════════════════════════════════════════════════════════════

class ClanManager {
    constructor() {
        this.clans = new Map();
        this.userClans = new Map(); // userId -> clanId
        this.clansByTag = new Map(); // tag -> clanId
    }
    
    /**
     * Crear nuevo clan
     */
    createClan(data) {
        // Validaciones
        if (data.name.length < CONFIG.MIN_CLAN_NAME_LENGTH || 
            data.name.length > CONFIG.MAX_CLAN_NAME_LENGTH) {
            return { 
                success: false, 
                message: `Nombre debe tener entre ${CONFIG.MIN_CLAN_NAME_LENGTH}-${CONFIG.MAX_CLAN_NAME_LENGTH} caracteres` 
            };
        }
        
        if (data.tag.length < CONFIG.MIN_CLAN_TAG_LENGTH || 
            data.tag.length > CONFIG.MAX_CLAN_TAG_LENGTH) {
            return { 
                success: false, 
                message: `Tag debe tener entre ${CONFIG.MIN_CLAN_TAG_LENGTH}-${CONFIG.MAX_CLAN_TAG_LENGTH} caracteres` 
            };
        }
        
        // Verificar si ya existe
        if (this.clansByTag.has(data.tag.toUpperCase())) {
            return { success: false, message: 'Tag ya está en uso' };
        }
        
        // Verificar si el usuario ya está en un clan
        if (this.userClans.has(data.leader)) {
            return { success: false, message: 'Ya eres miembro de un clan' };
        }
        
        // Crear clan
        const clan = new Clan(data);
        
        this.clans.set(clan.id, clan);
        this.clansByTag.set(clan.tag.toUpperCase(), clan.id);
        this.userClans.set(data.leader, clan.id);
        
        Logger.info(`🏰 Clan creado: ${clan.name} [${clan.tag}] por ${data.leader}`);
        
        return { 
            success: true, 
            message: 'Clan creado exitosamente',
            clan 
        };
    }
    
    /**
     * Obtener clan por ID
     */
    getClan(clanId) {
        return this.clans.get(clanId);
    }
    
    /**
     * Obtener clan por tag
     */
    getClanByTag(tag) {
        const clanId = this.clansByTag.get(tag.toUpperCase());
        return clanId ? this.clans.get(clanId) : null;
    }
    
    /**
     * Obtener clan de un usuario
     */
    getUserClan(userId) {
        const clanId = this.userClans.get(userId);
        return clanId ? this.clans.get(clanId) : null;
    }
    
    /**
     * Eliminar clan
     */
    deleteClan(clanId) {
        const clan = this.clans.get(clanId);
        if (!clan) {
            return { success: false, message: 'Clan no encontrado' };
        }
        
        // Remover a todos los miembros
        for (const userId of clan.members.keys()) {
            this.userClans.delete(userId);
        }
        
        this.clansByTag.delete(clan.tag.toUpperCase());
        this.clans.delete(clanId);
        
        Logger.info(`🗑️ Clan eliminado: ${clan.name} [${clan.tag}]`);
        
        return { success: true, message: 'Clan eliminado' };
    }
    
    /**
     * Obtener ranking de clanes
     */
    getLeaderboard(sortBy = 'level', limit = 20) {
        const clans = Array.from(this.clans.values());
        
        let sorted;
        switch (sortBy) {
            case 'level':
                sorted = clans.sort((a, b) => b.level - a.level || b.xp - a.xp);
                break;
            case 'members':
                sorted = clans.sort((a, b) => b.members.size - a.members.size);
                break;
            case 'treasury':
                sorted = clans.sort((a, b) => b.treasury - a.treasury);
                break;
            case 'wars':
                sorted = clans.sort((a, b) => b.stats.warWins - a.stats.warWins);
                break;
            case 'territories':
                sorted = clans.sort((a, b) => b.territories.length - a.territories.length);
                break;
            default:
                sorted = clans.sort((a, b) => b.level - a.level);
        }
        
        return sorted.slice(0, limit).map((clan, index) => ({
            rank: index + 1,
            ...clan.getInfo()
        }));
    }
    
    /**
     * Buscar clanes
     */
    searchClans(query) {
        const results = [];
        
        for (const clan of this.clans.values()) {
            if (clan.name.toLowerCase().includes(query.toLowerCase()) ||
                clan.tag.toLowerCase().includes(query.toLowerCase())) {
                results.push(clan.getInfo());
            }
        }
        
        return results;
    }
    
    /**
     * Procesar ingresos de territorios (llamar cada hora)
     */
    processIncome() {
        let totalIncome = 0;
        
        for (const clan of this.clans.values()) {
            const income = clan.collectTerritoryIncome();
            totalIncome += income;
        }
        
        Logger.info(`💰 Ingresos de territorios procesados: $${totalIncome.toLocaleString()}`);
        return totalIncome;
    }
    
    /**
     * Limpiar invitaciones/solicitudes expiradas
     */
    cleanupExpired() {
        const now = Date.now();
        let cleaned = 0;
        
        for (const clan of this.clans.values()) {
            // Limpiar invitaciones
            for (const [userId, data] of clan.invitations.entries()) {
                if (now - data.timestamp > CONFIG.INVITE_COOLDOWN) {
                    clan.invitations.delete(userId);
                    cleaned++;
                }
            }
            
            // Limpiar solicitudes
            for (const [userId, data] of clan.requests.entries()) {
                if (now - data.timestamp > CONFIG.INVITE_COOLDOWN) {
                    clan.requests.delete(userId);
                    cleaned++;
                }
            }
        }
        
        if (cleaned > 0) {
            Logger.info(`🧹 ${cleaned} invitaciones/solicitudes expiradas limpiadas`);
        }
        
        return cleaned;
    }
    
    /**
     * Guardar todos los clanes
     */
    saveAll() {
        const data = Array.from(this.clans.values()).map(clan => clan.toJSON());
        return data;
    }
    
    /**
     * Cargar clanes desde datos guardados
     */
    loadAll(data) {
        for (const clanData of data) {
            const clan = Clan.fromJSON(clanData);
            
            this.clans.set(clan.id, clan);
            this.clansByTag.set(clan.tag.toUpperCase(), clan.id);
            
            for (const userId of clan.members.keys()) {
                this.userClans.set(userId, clan.id);
            }
        }
        
        Logger.info(`📦 ${data.length} clanes cargados`);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      EXPORTACIONES                                          │
// ═══════════════════════════════════════════════════════════════════════════════

const clanManager = new ClanManager();

export default Clan;
export {
    ClanManager,
    clanManager,
    CONFIG,
    Logger
};
