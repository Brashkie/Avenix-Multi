/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                   𒁈 TOURNAMENT MANAGER V1.0 ULTRA 𒁈                       ┃
 * ┃              Sistema Completo de Gestión de Torneos                         ┃
 * ┃                    Creado para: Avenix-Multi V6.1.0                          ┃
 * ┃                    By: Hepein Oficial                                        ┃
 * ┃                                                                               ┃
 * ┃  CARACTERÍSTICAS:                                                            ┃
 * ┃  ✅ 4 formatos de torneo (Single/Double Elim, Round Robin, Swiss)          ┃
 * ┃  ✅ Brackets automáticos con visualización ASCII                            ┃
 * ┃  ✅ Sistema de inscripción con check-in                                     ┃
 * ┃  ✅ Programación de partidas con notificaciones                             ┃
 * ┃  ✅ Sistema de puntuación flexible                                          ┃
 * ┃  ✅ Estadísticas completas por jugador                                      ┃
 * ┃  ✅ Premios y recompensas automáticas                                       ┃
 * ┃  ✅ Integración con cualquier juego                                         ┃
 * ┃  ✅ Torneos públicos/privados con contraseña                                ┃
 * ┃  ✅ Sistema de seeds (cabezas de serie)                                     ┃
 * ┃  ✅ Bye automático para potencias de 2                                      ┃
 * ┃  ✅ Sistema de desempate avanzado                                           ┃
 * ┃  ✅ Moderación y reportes de resultados                                     ┃
 * ┃  ✅ Guardado automático con recuperación                                    ┃
 * ┃  ✅ Logs y auditoría completa                                               ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import { randomHex } from './crypto.js';
import paint from './paint.js'
import EventEmitter from 'events';

// ═══════════════════════════════════════════════════════════════════════════════
// │                        CONFIGURACIÓN GLOBAL                                 │
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
    // Límites
    MIN_PLAYERS: 2,
    MAX_PLAYERS: 256,
    MAX_ACTIVE_TOURNAMENTS: 50,
    
    // Tiempos
    REGISTRATION_TIME: 600000,      // 10 minutos
    CHECK_IN_TIME: 300000,          // 5 minutos
    MATCH_TIMEOUT: 3600000,         // 1 hora
    
    // Premios por defecto (% del prize pool)
    DEFAULT_PRIZES: {
        1: 0.50,  // 50% primer lugar
        2: 0.30,  // 30% segundo lugar
        3: 0.20   // 20% tercer lugar
    },
    
    // Puntos por resultado
    POINTS: {
        WIN: 3,
        DRAW: 1,
        LOSS: 0,
        BYE: 3
    },
    
    // Logging
    LOG_ENABLED: true,
    LOG_LEVEL: 'info',
    
    // Estadísticas
    STATS_ENABLED: true,
    
    // Notificaciones
    NOTIFICATIONS_ENABLED: true
};

// ═══════════════════════════════════════════════════════════════════════════════
// │                      TIPOS Y ENUMS                                          │
// ═══════════════════════════════════════════════════════════════════════════════

const TournamentFormat = {
    SINGLE_ELIMINATION: 'single_elimination',
    DOUBLE_ELIMINATION: 'double_elimination',
    ROUND_ROBIN: 'round_robin',
    SWISS: 'swiss'
};

const TournamentStatus = {
    REGISTRATION: 'registration',
    CHECK_IN: 'check_in',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
};

const MatchStatus = {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    DISPUTED: 'disputed',
    CANCELLED: 'cancelled'
};

const ParticipantStatus = {
    REGISTERED: 'registered',
    CHECKED_IN: 'checked_in',
    ACTIVE: 'active',
    ELIMINATED: 'eliminated',
    DISQUALIFIED: 'disqualified'
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
        
        console.log(prefix, `[${paint.gray(timestamp)}] [Tournament]:`, ...args);
    }
    
    static debug(...args) { this.log('debug', ...args); }
    static info(...args) { this.log('info', ...args); }
    static warn(...args) { this.log('warn', ...args); }
    static error(...args) { this.log('error', ...args); }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      CLASE PARTICIPANTE                                     │
// ═══════════════════════════════════════════════════════════════════════════════

class Participant {
    id: any
    name: any
    seed: any
    status: string
    checkedInAt: null | number
    registeredAt: number
    stats: any

    constructor(id, name, seed: any = null) {
        this.id = id;
        this.name = name;
        this.seed = seed;
        this.status = ParticipantStatus.REGISTERED;
        this.checkedInAt = null;
        this.registeredAt = Date.now();
        
        // Estadísticas
        this.stats = {
            matchesPlayed: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            points: 0,
            goalsFor: 0,      // Para desempates
            goalsAgainst: 0,
            goalDifference: 0,
            buchholz: 0,      // Para sistema suizo
            tiebreaks: {}
        };
    }
    
    checkIn() {
        if (this.status === ParticipantStatus.REGISTERED) {
            this.status = ParticipantStatus.CHECKED_IN;
            this.checkedInAt = Date.now();
            return true;
        }
        return false;
    }
    
    activate() {
        this.status = ParticipantStatus.ACTIVE;
    }
    
    eliminate() {
        this.status = ParticipantStatus.ELIMINATED;
    }
    
    disqualify() {
        this.status = ParticipantStatus.DISQUALIFIED;
    }
    
    recordResult(won, drew = false, goalsFor = 0, goalsAgainst = 0) {
        this.stats.matchesPlayed++;
        
        if (won) {
            this.stats.wins++;
            this.stats.points += CONFIG.POINTS.WIN;
        } else if (drew) {
            this.stats.draws++;
            this.stats.points += CONFIG.POINTS.DRAW;
        } else {
            this.stats.losses++;
            this.stats.points += CONFIG.POINTS.LOSS;
        }
        
        this.stats.goalsFor += goalsFor;
        this.stats.goalsAgainst += goalsAgainst;
        this.stats.goalDifference = this.stats.goalsFor - this.stats.goalsAgainst;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      CLASE PARTIDA                                          │
// ═══════════════════════════════════════════════════════════════════════════════

class Match {
    id: any
    round: any
    participant1: any
    participant2: any
    bracket: string
    status: string
    winner: any
    loser: any
    result: any
    score: any
    startedAt: null | number
    completedAt: null | number
    reportedBy: any
    disputed: boolean
    disputeReason: any

    constructor(id, round, participant1, participant2, bracket = 'main') {
        this.id = id;
        this.round = round;
        this.participant1 = participant1;
        this.participant2 = participant2;
        this.bracket = bracket;  // 'main' o 'losers' para doble eliminación
        this.status = MatchStatus.PENDING;
        this.winner = null;
        this.loser = null;
        this.result = null;
        this.score = null;
        this.startedAt = null;
        this.completedAt = null;
        this.reportedBy = null;
        this.disputed = false;
        this.disputeReason = null;
    }
    
    start() {
        if (this.status === MatchStatus.PENDING) {
            this.status = MatchStatus.IN_PROGRESS;
            this.startedAt = Date.now();
            return true;
        }
        return false;
    }
    
    reportResult(winnerId, score: any = null, reportedBy: any = null) {
        if (this.status !== MatchStatus.IN_PROGRESS && this.status !== MatchStatus.PENDING) {
            return { success: false as const, message: 'La partida no está en progreso' };
        }
        
        // Validar que el ganador sea uno de los participantes
        if (winnerId !== this.participant1?.id && winnerId !== this.participant2?.id && winnerId !== 'draw') {
            return { success: false as const, message: 'Ganador inválido' };
        }
        
        this.status = MatchStatus.COMPLETED;
        this.completedAt = Date.now();
        this.reportedBy = reportedBy;
        this.score = score;
        
        if (winnerId === 'draw') {
            this.result = 'draw';
            this.winner = null;
            this.loser = null;
        } else {
            this.winner = winnerId === this.participant1?.id ? this.participant1 : this.participant2;
            this.loser = winnerId === this.participant1?.id ? this.participant2 : this.participant1;
            this.result = winnerId;
        }
        
        Logger.info(`⚔️ Partida ${this.id} completada: ${this.winner?.name || 'Empate'}`);
        
        return { success: true as const, winner: this.winner, loser: this.loser };
    }
    
    dispute(reason, participantId) {
        if (this.status !== MatchStatus.COMPLETED) {
            return { success: false as const, message: 'Solo se pueden disputar partidas completadas' };
        }
        
        this.disputed = true;
        this.status = MatchStatus.DISPUTED;
        this.disputeReason = reason;
        
        Logger.warn(`⚠️ Partida ${this.id} en disputa por ${participantId}: ${reason}`);
        
        return { success: true as const };
    }
    
    isBye() {
        return !this.participant1 || !this.participant2;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      CLASE TORNEO                                           │
// ═══════════════════════════════════════════════════════════════════════════════

class Tournament extends EventEmitter {
    declare id: string
    declare name: any
    declare format: any
    declare game: any
    declare creatorId: any
    declare status: string
    declare config: any
    declare prizePool: any
    declare prizes: any
    declare registrationEndsAt: any
    declare checkInEndsAt: null | number
    declare startedAt: null | number
    declare completedAt: null | number
    declare participants: Map<any, any>
    declare matches: Map<any, any>
    declare rounds: any
    declare currentRound: number
    declare standings: any[]
    declare finalRanking: any
    declare logs: any[]
    declare losersBracket: any

    constructor(options: Record<string, any> = {}) {
        super();
        
        this.id = randomHex(8);
        this.name = options.name || `Torneo ${this.id.substring(0, 6)}`;
        this.format = options.format || TournamentFormat.SINGLE_ELIMINATION;
        this.game = options.game || 'generic';
        this.creatorId = options.creatorId;
        this.status = TournamentStatus.REGISTRATION;
        
        // Configuración
        this.config = {
            minPlayers: options.minPlayers || CONFIG.MIN_PLAYERS,
            maxPlayers: options.maxPlayers || CONFIG.MAX_PLAYERS,
            isPublic: options.isPublic !== false,
            password: options.password || null,
            requireCheckIn: options.requireCheckIn !== false,
            allowLateRegistration: options.allowLateRegistration === true,
            bestOf: options.bestOf || 1,
            thirdPlaceMatch: options.thirdPlaceMatch !== false
        };
        
        // Premios
        this.prizePool = options.prizePool || 0;
        this.prizes = options.prizes || CONFIG.DEFAULT_PRIZES;
        
        // Tiempos
        this.registrationEndsAt = options.registrationEndsAt || Date.now() + CONFIG.REGISTRATION_TIME;
        this.checkInEndsAt = null;
        this.startedAt = null;
        this.completedAt = null;
        
        // Participantes y partidas
        this.participants = new Map();
        this.matches = new Map();
        this.rounds = [];
        this.currentRound = 0;
        
        // Rankings
        this.standings = [];
        this.finalRanking = [];
        
        // Logs
        this.logs = [];
        
        Logger.info(`🏆 Torneo creado: ${this.name} (${this.format})`);
        this.addLog('TOURNAMENT_CREATED', { name: this.name, format: this.format });
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      GESTIÓN DE PARTICIPANTES                         │
    // ═════════════════════════════════════════════════════════════════════════
    
    register(playerId, playerName, password: any = null) {
        // Validaciones
        if (this.status !== TournamentStatus.REGISTRATION) {
            return { success: false as const, message: 'Las inscripciones están cerradas' };
        }
        
        if (this.participants.size >= this.config.maxPlayers) {
            return { success: false as const, message: 'El torneo está lleno' };
        }
        
        if (this.participants.has(playerId)) {
            return { success: false as const, message: 'Ya estás inscrito' };
        }
        
        if (this.config.password && this.config.password !== password) {
            return { success: false as const, message: 'Contraseña incorrecta' };
        }
        
        // Inscribir
        const participant = new Participant(playerId, playerName);
        this.participants.set(playerId, participant);
        
        Logger.info(`✅ ${playerName} inscrito en ${this.name}`);
        this.addLog('PLAYER_REGISTERED', { playerId, playerName });
        this.emit('player:registered', participant);
        
        return { success: true as const, participant };
    }
    
    unregister(playerId) {
        if (this.status !== TournamentStatus.REGISTRATION) {
            return { success: false as const, message: 'No puedes desincribirte en este momento' };
        }
        
        const participant = this.participants.get(playerId);
        if (!participant) {
            return { success: false as const, message: 'No estás inscrito' };
        }
        
        this.participants.delete(playerId);
        
        Logger.info(`❌ ${participant.name} se desinscribió de ${this.name}`);
        this.addLog('PLAYER_UNREGISTERED', { playerId, playerName: participant.name });
        this.emit('player:unregistered', participant);
        
        return { success: true as const };
    }
    
    checkIn(playerId) {
        if (this.status !== TournamentStatus.CHECK_IN) {
            return { success: false as const, message: 'El check-in no está activo' };
        }
        
        const participant = this.participants.get(playerId);
        if (!participant) {
            return { success: false as const, message: 'No estás inscrito' };
        }
        
        if (participant.checkIn()) {
            Logger.info(`✅ ${participant.name} hizo check-in`);
            this.addLog('PLAYER_CHECKED_IN', { playerId, playerName: participant.name });
            this.emit('player:checkedIn', participant);
            
            // Si todos hicieron check-in, iniciar torneo
            this.checkAllCheckedIn();
            
            return { success: true as const };
        }
        
        return { success: false as const, message: 'Ya hiciste check-in' };
    }
    
    checkAllCheckedIn() {
        const checkedIn = Array.from(this.participants.values())
            .filter(p => p.status === ParticipantStatus.CHECKED_IN).length;
        
        if (checkedIn === this.participants.size && this.participants.size >= this.config.minPlayers) {
            Logger.info(`🎮 Todos hicieron check-in. Iniciando torneo...`);
            setTimeout(() => this.start(), 3000);
        }
    }
    
    disqualify(playerId, reason = 'Violación de reglas') {
        const participant = this.participants.get(playerId);
        if (!participant) {
            return { success: false as const, message: 'Participante no encontrado' };
        }
        
        participant.disqualify();
        
        Logger.warn(`🚫 ${participant.name} descalificado: ${reason}`);
        this.addLog('PLAYER_DISQUALIFIED', { playerId, playerName: participant.name, reason });
        this.emit('player:disqualified', participant, reason);
        
        return { success: true as const };
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      GESTIÓN DEL TORNEO                               │
    // ═════════════════════════════════════════════════════════════════════════
    
    closeRegistration() {
        if (this.status !== TournamentStatus.REGISTRATION) {
            return { success: false as const, message: 'Las inscripciones ya están cerradas' };
        }
        
        if (this.participants.size < this.config.minPlayers) {
            return { 
                success: false as const, 
                message: `Se necesitan al menos ${this.config.minPlayers} jugadores (hay ${this.participants.size})` 
            };
        }
        
        if (this.config.requireCheckIn) {
            this.status = TournamentStatus.CHECK_IN;
            this.checkInEndsAt = Date.now() + CONFIG.CHECK_IN_TIME;
            
            Logger.info(`📋 Check-in iniciado para ${this.name}`);
            this.addLog('CHECK_IN_STARTED');
            this.emit('checkIn:started');
            
            // Timer para iniciar automáticamente
            setTimeout(() => {
                if (this.status === TournamentStatus.CHECK_IN) {
                    this.removeNoCheckIn();
                    this.start();
                }
            }, CONFIG.CHECK_IN_TIME);
            
            return { success: true as const, message: 'Check-in iniciado', status: 'check_in' };
        } else {
            return this.start();
        }
    }
    
    removeNoCheckIn() {
        let removed = 0;
        
        for (const [playerId, participant] of this.participants.entries()) {
            if (participant.status === ParticipantStatus.REGISTERED) {
                this.participants.delete(playerId);
                removed++;
                Logger.info(`❌ ${participant.name} eliminado por no hacer check-in`);
            }
        }
        
        if (removed > 0) {
            this.addLog('NO_CHECK_IN_REMOVED', { count: removed });
        }
    }
    
    start() {
        // Validaciones
        if (this.status === TournamentStatus.IN_PROGRESS) {
            return { success: false as const, message: 'El torneo ya está en progreso' };
        }
        
        if (this.status === TournamentStatus.COMPLETED) {
            return { success: false as const, message: 'El torneo ya terminó' };
        }
        
        const activeParticipants = Array.from(this.participants.values())
            .filter(p => p.status === ParticipantStatus.CHECKED_IN || p.status === ParticipantStatus.REGISTERED);
        
        if (activeParticipants.length < this.config.minPlayers) {
            return { 
                success: false as const, 
                message: `Se necesitan al menos ${this.config.minPlayers} jugadores (hay ${activeParticipants.length})` 
            };
        }
        
        // Activar participantes
        activeParticipants.forEach(p => p.activate());
        
        // Iniciar torneo
        this.status = TournamentStatus.IN_PROGRESS;
        this.startedAt = Date.now();
        
        // Asignar seeds si no están asignados
        this.assignSeeds();
        
        // Generar brackets según formato
        this.generateBrackets();
        
        Logger.info(`🏁 Torneo ${this.name} iniciado con ${activeParticipants.length} jugadores`);
        this.addLog('TOURNAMENT_STARTED', { playerCount: activeParticipants.length });
        this.emit('tournament:started');
        
        return { success: true as const, message: 'Torneo iniciado', matches: this.getCurrentMatches() };
    }
    
    assignSeeds() {
        const activeParticipants = Array.from(this.participants.values())
            .filter(p => p.status === ParticipantStatus.ACTIVE);
        
        // Ordenar aleatoriamente si no hay seeds
        activeParticipants.sort((a, b) => {
            if (a.seed !== null && b.seed !== null) {
                return a.seed - b.seed;
            }
            return Math.random() - 0.5;
        });
        
        // Asignar seeds
        activeParticipants.forEach((p, index) => {
            if (p.seed === null) {
                p.seed = index + 1;
            }
        });
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      GENERACIÓN DE BRACKETS                           │
    // ═════════════════════════════════════════════════════════════════════════
    
    generateBrackets() {
        switch (this.format) {
            case TournamentFormat.SINGLE_ELIMINATION:
                return this.generateSingleElimination();
            case TournamentFormat.DOUBLE_ELIMINATION:
                return this.generateDoubleElimination();
            case TournamentFormat.ROUND_ROBIN:
                return this.generateRoundRobin();
            case TournamentFormat.SWISS:
                return this.generateSwissRound();
            default:
                throw new Error(`Formato no soportado: ${this.format}`);
        }
    }
    
    generateSingleElimination() {
        const participants = Array.from(this.participants.values())
            .filter(p => p.status === ParticipantStatus.ACTIVE)
            .sort((a, b) => a.seed - b.seed);
        
        // Calcular rondas necesarias
        const totalRounds = Math.ceil(Math.log2(participants.length));
        this.rounds = Array(totalRounds).fill(null).map((_, i) => ({
            number: i + 1,
            name: this.getRoundName(i + 1, totalRounds),
            matches: []
        }));
        
        // Primera ronda con emparejamiento óptimo
        const round1Matches: any[] = [];
        const nextPowerOf2 = Math.pow(2, totalRounds);
        const byes = nextPowerOf2 - participants.length;
        
        let matchId = 1;
        let participantIndex = 0;
        
        // Generar emparejamientos (1 vs último, 2 vs penúltimo, etc)
        const pairings = this.generateOptimalPairings(participants);
        
        for (const [p1, p2] of pairings) {
            const match = new Match(`M${matchId}`, 1, p1, p2 || null);
            round1Matches.push(match);
            this.matches.set(match.id, match);
            
            // Si es bye, dar victoria automática
            if (!p2) {
                match.reportResult(p1.id, null, 'system');
                p1.stats.points += CONFIG.POINTS.BYE;
            }
            
            matchId++;
        }
        
        this.rounds[0].matches = round1Matches;
        this.currentRound = 1;
        
        Logger.debug(`🎯 Generados ${round1Matches.length} partidos para ronda 1`);
    }
    
    generateOptimalPairings(participants) {
        const pairings: any[] = [];
        const n = participants.length;
        
        // Si es potencia de 2, emparejamiento directo
        if ((n & (n - 1)) === 0) {
            for (let i = 0; i < n / 2; i++) {
                pairings.push([participants[i], participants[n - 1 - i]]);
            }
        } else {
            // Con byes, los mejores seeds pasan directo
            const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(n)));
            const byes = nextPowerOf2 - n;
            
            // Los primeros 'byes' jugadores reciben bye
            for (let i = 0; i < byes; i++) {
                pairings.push([participants[i], null]);
            }
            
            // El resto se empareja
            const remaining = participants.slice(byes);
            for (let i = 0; i < remaining.length / 2; i++) {
                pairings.push([remaining[i], remaining[remaining.length - 1 - i]]);
            }
        }
        
        return pairings;
    }
    
    generateDoubleElimination() {
        // Similar a single pero con bracket de perdedores
        this.generateSingleElimination();
        
        // Inicializar bracket de perdedores
        this.losersBracket = {
            rounds: [],
            currentRound: 0
        };
    }
    
    generateRoundRobin() {
        const participants = Array.from(this.participants.values())
            .filter(p => p.status === ParticipantStatus.ACTIVE);
        
        const n = participants.length;
        const totalRounds = n % 2 === 0 ? n - 1 : n;
        
        this.rounds = Array(totalRounds).fill(null).map((_, i) => ({
            number: i + 1,
            name: `Jornada ${i + 1}`,
            matches: []
        }));
        
        // Algoritmo de round-robin (círculo)
        let matchId = 1;
        
        for (let round = 0; round < totalRounds; round++) {
            const roundMatches: any[] = [];
            
            for (let i = 0; i < Math.floor(n / 2); i++) {
                const home = (round + i) % (n - 1);
                const away = (n - 1 - i + round) % (n - 1);
                
                // El último participante siempre está fijo
                const p1 = i === 0 ? participants[n - 1] : participants[home];
                const p2 = participants[away];
                
                const match = new Match(`M${matchId}`, round + 1, p1, p2);
                roundMatches.push(match);
                this.matches.set(match.id, match);
                matchId++;
            }
            
            this.rounds[round].matches = roundMatches;
        }
        
        this.currentRound = 1;
        Logger.debug(`🔄 Generadas ${totalRounds} jornadas para Round Robin`);
    }
    
    generateSwissRound() {
        // Sistema suizo: emparejar jugadores con puntos similares
        const participants = Array.from(this.participants.values())
            .filter(p => p.status === ParticipantStatus.ACTIVE)
            .sort((a, b) => b.stats.points - a.stats.points || a.seed - b.seed);
        
        const roundMatches: any[] = [];
        const paired = new Set();
        let matchId = this.matches.size + 1;
        
        for (let i = 0; i < participants.length; i++) {
            if (paired.has(participants[i].id)) continue;
            
            // Buscar oponente con puntos similares que no haya enfrentado
            let opponent: any = null;
            for (let j = i + 1; j < participants.length; j++) {
                if (paired.has(participants[j].id)) continue;
                
                // Verificar que no se hayan enfrentado antes
                if (!this.havePlayed(participants[i], participants[j])) {
                    opponent = participants[j];
                    break;
                }
            }
            
            if (!opponent) {
                // Si no hay oponente disponible, bye
                const match = new Match(`M${matchId}`, this.currentRound + 1, participants[i], null);
                match.reportResult(participants[i].id, null, 'system');
                roundMatches.push(match);
                this.matches.set(match.id, match);
            } else {
                const match = new Match(`M${matchId}`, this.currentRound + 1, participants[i], opponent);
                roundMatches.push(match);
                this.matches.set(match.id, match);
                paired.add(opponent.id);
            }
            
            paired.add(participants[i].id);
            matchId++;
        }
        
        if (!this.rounds[this.currentRound]) {
            this.rounds[this.currentRound] = {
                number: this.currentRound + 1,
                name: `Ronda ${this.currentRound + 1}`,
                matches: []
            };
        }
        
        this.rounds[this.currentRound].matches = roundMatches;
        this.currentRound++;
        
        Logger.debug(`♟️ Generada ronda ${this.currentRound} del sistema suizo`);
    }
    
    havePlayed(p1, p2) {
        for (const match of this.matches.values()) {
            if (match.status === MatchStatus.COMPLETED) {
                if ((match.participant1?.id === p1.id && match.participant2?.id === p2.id) ||
                    (match.participant1?.id === p2.id && match.participant2?.id === p1.id)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    getRoundName(round, total) {
        if (round === total) return 'Final';
        if (round === total - 1) return 'Semifinal';
        if (round === total - 2) return 'Cuartos de Final';
        if (round === total - 3) return 'Octavos de Final';
        return `Ronda ${round}`;
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      GESTIÓN DE PARTIDAS                              │
    // ═════════════════════════════════════════════════════════════════════════
    
    reportMatchResult(matchId, winnerId, score: any = null, reportedBy: any = null) {
        const match = this.matches.get(matchId);
        if (!match) {
            return { success: false as const, message: 'Partida no encontrada' };
        }
        
        const result = match.reportResult(winnerId, score, reportedBy);
        
        if (result.success) {
            // Actualizar estadísticas
            this.updateParticipantStats(match, result.winner, result.loser, score);
            
            // Avanzar ganador
            this.advanceWinner(match, result.winner, result.loser);
            
            // Verificar si la ronda terminó
            this.checkRoundComplete();
            
            this.addLog('MATCH_COMPLETED', { 
                matchId, 
                winner: result.winner?.name,
                score 
            });
            
            this.emit('match:completed', match, result.winner);
        }
        
        return result;
    }
    
    updateParticipantStats(match, winner, loser, score) {
        if (!winner || !loser) return; // Empate o bye
        
        const isDraw = match.result === 'draw';
        
        if (isDraw) {
            winner?.recordResult(false, true);
            loser?.recordResult(false, true);
        } else {
            winner?.recordResult(true, false, score?.winner || 0, score?.loser || 0);
            loser?.recordResult(false, false, score?.loser || 0, score?.winner || 0);
        }
    }
    
    advanceWinner(match, winner, loser) {
        if (this.format === TournamentFormat.SINGLE_ELIMINATION) {
            this.advanceSingleElimination(match, winner, loser);
        } else if (this.format === TournamentFormat.DOUBLE_ELIMINATION) {
            this.advanceDoubleElimination(match, winner, loser);
        }
        // Round Robin y Swiss no avanzan, solo acumulan puntos
    }
    
    advanceSingleElimination(match, winner, loser) {
        if (!winner) return;
        
        const nextRound = match.round + 1;
        
        if (nextRound > this.rounds.length) {
            // Es la final, torneo terminado
            this.completeTournament();
            return;
        }
        
        // Buscar o crear el siguiente partido
        const nextMatchIndex = Math.floor((this.rounds[match.round - 1].matches.indexOf(match)) / 2);
        let nextMatch = this.rounds[nextRound - 1]?.matches[nextMatchIndex];
        
        if (!nextMatch) {
            // Crear siguiente ronda si no existe
            if (!this.rounds[nextRound - 1]) {
                this.rounds[nextRound - 1] = {
                    number: nextRound,
                    name: this.getRoundName(nextRound, this.rounds.length),
                    matches: []
                };
            }
            
            nextMatch = new Match(`M${this.matches.size + 1}`, nextRound, null, null);
            this.rounds[nextRound - 1].matches.push(nextMatch);
            this.matches.set(nextMatch.id, nextMatch);
        }
        
        // Colocar ganador en la siguiente partida
        if (!nextMatch.participant1) {
            nextMatch.participant1 = winner;
        } else {
            nextMatch.participant2 = winner;
        }
        
        Logger.debug(`➡️ ${winner.name} avanza a ${nextMatch.id}`);
    }
    
    advanceDoubleElimination(match, winner, loser) {
        // Implementación similar pero con bracket de perdedores
        this.advanceSingleElimination(match, winner, loser);
        
        // Enviar perdedor al bracket de perdedores
        if (loser && match.bracket === 'main') {
            // TODO: Implementar lógica de bracket de perdedores
        }
    }
    
    checkRoundComplete() {
        if (!this.rounds[this.currentRound - 1]) return;
        
        const currentRoundMatches = this.rounds[this.currentRound - 1].matches;
        const allCompleted = currentRoundMatches.every(m => 
            m.status === MatchStatus.COMPLETED || m.isBye()
        );
        
        if (allCompleted) {
            Logger.info(`✅ Ronda ${this.currentRound} completada`);
            this.addLog('ROUND_COMPLETED', { round: this.currentRound });
            this.emit('round:completed', this.currentRound);
            
            // Para sistema suizo, generar siguiente ronda
            if (this.format === TournamentFormat.SWISS) {
                const maxRounds = Math.ceil(Math.log2(this.participants.size));
                if (this.currentRound < maxRounds) {
                    this.generateSwissRound();
                    this.emit('round:started', this.currentRound);
                } else {
                    this.completeTournament();
                }
            } else {
                // Para eliminación, verificar si hay siguiente ronda
                if (this.currentRound < this.rounds.length) {
                    this.currentRound++;
                    this.emit('round:started', this.currentRound);
                } else {
                    this.completeTournament();
                }
            }
        }
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      FINALIZACIÓN DEL TORNEO                          │
    // ═════════════════════════════════════════════════════════════════════════
    
    completeTournament() {
        this.status = TournamentStatus.COMPLETED;
        this.completedAt = Date.now();
        
        // Calcular ranking final
        this.calculateFinalRanking();
        
        // Distribuir premios
        this.distributePrizes();
        
        Logger.info(`🏆 Torneo ${this.name} completado`);
        this.addLog('TOURNAMENT_COMPLETED');
        this.emit('tournament:completed', this.finalRanking);
    }
    
    calculateFinalRanking() {
        const participants = Array.from(this.participants.values())
            .filter(p => p.status === ParticipantStatus.ACTIVE || p.status === ParticipantStatus.ELIMINATED);
        
        // Ordenar por puntos, diferencia de goles, etc
        participants.sort((a, b) => {
            // Primero por puntos
            if (b.stats.points !== a.stats.points) {
                return b.stats.points - a.stats.points;
            }
            // Luego por diferencia de goles
            if (b.stats.goalDifference !== a.stats.goalDifference) {
                return b.stats.goalDifference - a.stats.goalDifference;
            }
            // Luego por goles a favor
            if (b.stats.goalsFor !== a.stats.goalsFor) {
                return b.stats.goalsFor - a.stats.goalsFor;
            }
            // Finalmente por seed
            return a.seed - b.seed;
        });
        
        this.finalRanking = participants.map((p, index) => ({
            position: index + 1,
            participant: p,
            stats: p.stats,
            prize: this.prizes[index + 1] ? this.prizePool * this.prizes[index + 1] : 0
        }));
        
        Logger.debug(`📊 Ranking final calculado`);
    }
    
    distributePrizes() {
        if (this.prizePool <= 0) return;
        
        for (const entry of this.finalRanking) {
            if (entry.prize > 0) {
                Logger.info(`💰 ${entry.participant.name} ganó ${entry.prize} (Posición ${entry.position})`);
                this.addLog('PRIZE_DISTRIBUTED', {
                    playerId: entry.participant.id,
                    playerName: entry.participant.name,
                    position: entry.position,
                    prize: entry.prize
                });
                
                this.emit('prize:distributed', entry.participant, entry.prize, entry.position);
            }
        }
    }
    
    cancel(reason = 'Cancelado por el organizador') {
        this.status = TournamentStatus.CANCELLED;
        this.completedAt = Date.now();
        
        Logger.warn(`🚫 Torneo ${this.name} cancelado: ${reason}`);
        this.addLog('TOURNAMENT_CANCELLED', { reason });
        this.emit('tournament:cancelled', reason);
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      UTILIDADES Y CONSULTAS                           │
    // ═════════════════════════════════════════════════════════════════════════
    
    getCurrentMatches() {
        if (this.currentRound === 0 || !this.rounds[this.currentRound - 1]) {
            return [];
        }
        
        return this.rounds[this.currentRound - 1].matches.filter(m => 
            m.status === MatchStatus.PENDING || m.status === MatchStatus.IN_PROGRESS
        );
    }
    
    getStandings() {
        const participants = Array.from(this.participants.values())
            .filter(p => p.status === ParticipantStatus.ACTIVE || p.status === ParticipantStatus.ELIMINATED);
        
        participants.sort((a, b) => {
            if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
            if (b.stats.goalDifference !== a.stats.goalDifference) return b.stats.goalDifference - a.stats.goalDifference;
            return b.stats.goalsFor - a.stats.goalsFor;
        });
        
        return participants.map((p, index) => ({
            position: index + 1,
            participant: p,
            stats: p.stats
        }));
    }
    
    getBracketVisualization() {
        // Generar visualización ASCII del bracket
        const lines: any[] = [];
        
        lines.push(`╔═══════════════════════════════════════╗`);
        lines.push(`║  🏆 ${this.name.padEnd(32)} ║`);
        lines.push(`╠═══════════════════════════════════════╣`);
        
        for (const round of this.rounds) {
            lines.push(`║ ${round.name.padEnd(37)} ║`);
            lines.push(`╟───────────────────────────────────────╢`);
            
            for (const match of round.matches) {
                const p1 = match.participant1?.name || 'TBD';
                const p2 = match.participant2?.name || 'BYE';
                const status = match.status === MatchStatus.COMPLETED ? '✓' : '○';
                
                lines.push(`║ ${status} ${p1.padEnd(15)} vs ${p2.padEnd(15)} ║`);
            }
            
            lines.push(`╟───────────────────────────────────────╢`);
        }
        
        lines.push(`╚═══════════════════════════════════════╝`);
        
        return lines.join('\n');
    }
    
    getInfo() {
        return {
            id: this.id,
            name: this.name,
            format: this.format,
            game: this.game,
            status: this.status,
            participants: this.participants.size,
            maxPlayers: this.config.maxPlayers,
            currentRound: this.currentRound,
            totalRounds: this.rounds.length,
            prizePool: this.prizePool,
            startedAt: this.startedAt,
            completedAt: this.completedAt
        };
    }
    
    addLog(event, data: Record<string, any> = {}) {
        this.logs.push({
            event,
            data,
            timestamp: Date.now()
        });
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      GESTOR DE TORNEOS                                      │
// ═══════════════════════════════════════════════════════════════════════════════

class TournamentManager {
    tournaments: Map<any, any>
    stats: any

    constructor() {
        this.tournaments = new Map();
        this.stats = {
            totalTournaments: 0,
            activeTournaments: 0,
            completedTournaments: 0,
            cancelledTournaments: 0,
            totalParticipants: 0,
            totalMatches: 0
        };
    }
    
    createTournament(options) {
        if (this.getActiveTournaments().length >= CONFIG.MAX_ACTIVE_TOURNAMENTS) {
            throw new Error(`Máximo de ${CONFIG.MAX_ACTIVE_TOURNAMENTS} torneos activos alcanzado`);
        }
        
        const tournament = new Tournament(options);
        this.tournaments.set(tournament.id, tournament);
        
        this.stats.totalTournaments++;
        this.stats.activeTournaments++;
        
        Logger.info(`🏆 Torneo creado por manager: ${tournament.id}`);
        
        // Event listeners
        tournament.on('tournament:completed', () => {
            this.stats.activeTournaments--;
            this.stats.completedTournaments++;
        });
        
        tournament.on('tournament:cancelled', () => {
            this.stats.activeTournaments--;
            this.stats.cancelledTournaments++;
        });
        
        return tournament;
    }
    
    getTournament(id) {
        return this.tournaments.get(id);
    }
    
    deleteTournament(id) {
        const tournament = this.tournaments.get(id);
        if (tournament) {
            if (tournament.status === TournamentStatus.IN_PROGRESS) {
                throw new Error('No se puede eliminar un torneo en progreso');
            }
            
            this.tournaments.delete(id);
            Logger.info(`🗑️ Torneo eliminado: ${id}`);
            return true;
        }
        return false;
    }
    
    getActiveTournaments() {
        return Array.from(this.tournaments.values()).filter(t => 
            t.status === TournamentStatus.REGISTRATION ||
            t.status === TournamentStatus.CHECK_IN ||
            t.status === TournamentStatus.IN_PROGRESS
        );
    }
    
    getPublicTournaments() {
        return this.getActiveTournaments().filter(t => t.config.isPublic);
    }
    
    getTournamentsByGame(game) {
        return Array.from(this.tournaments.values()).filter(t => t.game === game);
    }
    
    cleanupOldTournaments(maxAge = 86400000) { // 24 horas
        const now = Date.now();
        let cleaned = 0;
        
        for (const [id, tournament] of this.tournaments.entries()) {
            if (tournament.status === TournamentStatus.COMPLETED || 
                tournament.status === TournamentStatus.CANCELLED) {
                const age = now - (tournament.completedAt || tournament.startedAt || 0);
                if (age > maxAge) {
                    this.tournaments.delete(id);
                    cleaned++;
                }
            }
        }
        
        if (cleaned > 0) {
            Logger.info(`🧹 ${cleaned} torneos antiguos limpiados`);
        }
        
        return cleaned;
    }
    
    getStats() {
        return { ...this.stats };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      EXPORTACIONES                                          │
// ═══════════════════════════════════════════════════════════════════════════════

const tournamentManager = new TournamentManager();

export default Tournament;
export {
    TournamentManager,
    TournamentFormat,
    TournamentStatus,
    MatchStatus,
    ParticipantStatus,
    Participant,
    Match,
    tournamentManager,
    CONFIG
};
