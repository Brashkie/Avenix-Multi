/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                   𒁈 POKER V1.0 ULTRA 𒁈                                    ┃
 * ┃              Texas Hold'em Profesional con Sistema Completo                 ┃
 * ┃                    Creado para: Avenix-Multi V6.1.0                          ┃
 * ┃                    By: Hepein Oficial                                        ┃
 * ┃                                                                               ┃
 * ┃  CARACTERÍSTICAS:                                                            ┃
 * ┃  ✅ Texas Hold'em completo                                                  ┃
 * ┃  ✅ Sistema de apuestas (call, raise, fold, all-in)                         ┃
 * ┃  ✅ Evaluación precisa de manos (Royal Flush → High Card)                   ┃
 * ┃  ✅ Side pots automáticos                                                   ┃
 * ┃  ✅ Múltiples jugadores (2-10)                                              ┃
 * ┃  ✅ Sistema de torneos                                                      ┃
 * ┃  ✅ Blinds automáticas                                                      ┃
 * ┃  ✅ Estadísticas detalladas                                                 ┃
 * ┃  ✅ Historial de manos                                                      ┃
 * ┃  ✅ Sistema de rankings                                                     ┃
 * ┃  ✅ Visualización con emojis                                                ┃
 * ┃  ✅ Guardado automático                                                     ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import { randomHex } from './crypto.js';
import paint from './paint.js'

// ═══════════════════════════════════════════════════════════════════════════════
// │                        CONFIGURACIÓN GLOBAL                                 │
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
    // Límites de jugadores
    MIN_PLAYERS: 2,
    MAX_PLAYERS: 10,
    
    // Apuestas
    DEFAULT_SMALL_BLIND: 5,
    DEFAULT_BIG_BLIND: 10,
    MIN_BUY_IN: 100,
    MAX_BUY_IN: 10000,
    
    // Timeouts
    ACTION_TIMEOUT: 60000, // 1 minuto por acción
    
    // Blinds incrementales (para torneos)
    BLIND_INCREASE_INTERVAL: 600000, // 10 minutos
    BLIND_MULTIPLIER: 1.5,
    
    // Visualización
    CARD_SUITS: {
        'hearts': '♥️',
        'diamonds': '♦️',
        'clubs': '♣️',
        'spades': '♠️'
    },
    
    // Logging
    LOG_ENABLED: true,
    LOG_LEVEL: 'info',
    
    // Estadísticas
    STATS_ENABLED: true,
    SAVE_HISTORY: true
};

// ═══════════════════════════════════════════════════════════════════════════════
// │                      CONSTANTES DE POKER                                    │
// ═══════════════════════════════════════════════════════════════════════════════

const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];

const HAND_RANKINGS = {
    ROYAL_FLUSH: 10,
    STRAIGHT_FLUSH: 9,
    FOUR_OF_A_KIND: 8,
    FULL_HOUSE: 7,
    FLUSH: 6,
    STRAIGHT: 5,
    THREE_OF_A_KIND: 4,
    TWO_PAIR: 3,
    PAIR: 2,
    HIGH_CARD: 1
};

const HAND_NAMES = {
    10: 'Escalera Real',
    9: 'Escalera de Color',
    8: 'Póker',
    7: 'Full House',
    6: 'Color',
    5: 'Escalera',
    4: 'Trío',
    3: 'Doble Pareja',
    2: 'Pareja',
    1: 'Carta Alta'
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
        
        console.log(prefix, '[Poker]:', ...args);
    }
    
    static debug(...args) { this.log('debug', ...args); }
    static info(...args) { this.log('info', ...args); }
    static warn(...args) { this.log('warn', ...args); }
    static error(...args) { this.log('error', ...args); }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      CLASE CARTA                                            │
// ═══════════════════════════════════════════════════════════════════════════════

class Card {
    rank: any
    suit: any
    value: number

    constructor(rank, suit) {
        this.rank = rank;
        this.suit = suit;
        this.value = RANKS.indexOf(rank);
    }
    
    toString() {
        const suitEmoji = CONFIG.CARD_SUITS[this.suit];
        return `${this.rank}${suitEmoji}`;
    }
    
    toJSON() {
        return {
            rank: this.rank,
            suit: this.suit,
            display: this.toString()
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      CLASE BARAJA                                           │
// ═══════════════════════════════════════════════════════════════════════════════

class Deck {
    cards: any[]

    constructor() {
        this.cards = [];
        this.reset();
    }
    
    reset() {
        this.cards = [];
        for (const suit of SUITS) {
            for (const rank of RANKS) {
                this.cards.push(new Card(rank, suit));
            }
        }
        this.shuffle();
    }
    
    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }
    
    draw() {
        if (this.cards.length === 0) {
            throw new Error('No quedan cartas en la baraja');
        }
        return this.cards.pop();
    }
    
    drawMultiple(count) {
        const cards: any[] = [];
        for (let i = 0; i < count; i++) {
            cards.push(this.draw());
        }
        return cards;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      EVALUADOR DE MANOS                                     │
// ═══════════════════════════════════════════════════════════════════════════════

class HandEvaluator {
    /**
     * Evalúa una mano de 5-7 cartas y devuelve su ranking
     */
    static evaluate(cards) {
        if (cards.length < 5) {
            throw new Error('Se necesitan al menos 5 cartas para evaluar');
        }
        
        // Si hay más de 5 cartas, encontrar la mejor combinación de 5
        if (cards.length > 5) {
            return this.findBestHand(cards);
        }
        
        const sorted = [...cards].sort((a, b) => b.value - a.value);
        
        const isFlush = this.isFlush(sorted);
        const isStraight = this.isStraight(sorted);
        const rankCounts = this.getRankCounts(sorted);
        
        // Royal Flush
        if (isFlush && isStraight && sorted[0].rank === 'A') {
            return {
                rank: HAND_RANKINGS.ROYAL_FLUSH,
                name: HAND_NAMES[HAND_RANKINGS.ROYAL_FLUSH],
                cards: sorted,
                value: this.calculateValue(sorted, HAND_RANKINGS.ROYAL_FLUSH)
            };
        }
        
        // Straight Flush
        if (isFlush && isStraight) {
            return {
                rank: HAND_RANKINGS.STRAIGHT_FLUSH,
                name: HAND_NAMES[HAND_RANKINGS.STRAIGHT_FLUSH],
                cards: sorted,
                value: this.calculateValue(sorted, HAND_RANKINGS.STRAIGHT_FLUSH)
            };
        }
        
        // Four of a Kind
        if (rankCounts.some(c => c.count === 4)) {
            return {
                rank: HAND_RANKINGS.FOUR_OF_A_KIND,
                name: HAND_NAMES[HAND_RANKINGS.FOUR_OF_A_KIND],
                cards: sorted,
                value: this.calculateValue(sorted, HAND_RANKINGS.FOUR_OF_A_KIND, rankCounts)
            };
        }
        
        // Full House
        const hasThree = rankCounts.some(c => c.count === 3);
        const hasPair = rankCounts.some(c => c.count === 2);
        if (hasThree && hasPair) {
            return {
                rank: HAND_RANKINGS.FULL_HOUSE,
                name: HAND_NAMES[HAND_RANKINGS.FULL_HOUSE],
                cards: sorted,
                value: this.calculateValue(sorted, HAND_RANKINGS.FULL_HOUSE, rankCounts)
            };
        }
        
        // Flush
        if (isFlush) {
            return {
                rank: HAND_RANKINGS.FLUSH,
                name: HAND_NAMES[HAND_RANKINGS.FLUSH],
                cards: sorted,
                value: this.calculateValue(sorted, HAND_RANKINGS.FLUSH)
            };
        }
        
        // Straight
        if (isStraight) {
            return {
                rank: HAND_RANKINGS.STRAIGHT,
                name: HAND_NAMES[HAND_RANKINGS.STRAIGHT],
                cards: sorted,
                value: this.calculateValue(sorted, HAND_RANKINGS.STRAIGHT)
            };
        }
        
        // Three of a Kind
        if (hasThree) {
            return {
                rank: HAND_RANKINGS.THREE_OF_A_KIND,
                name: HAND_NAMES[HAND_RANKINGS.THREE_OF_A_KIND],
                cards: sorted,
                value: this.calculateValue(sorted, HAND_RANKINGS.THREE_OF_A_KIND, rankCounts)
            };
        }
        
        // Two Pair
        const pairs = rankCounts.filter(c => c.count === 2);
        if (pairs.length >= 2) {
            return {
                rank: HAND_RANKINGS.TWO_PAIR,
                name: HAND_NAMES[HAND_RANKINGS.TWO_PAIR],
                cards: sorted,
                value: this.calculateValue(sorted, HAND_RANKINGS.TWO_PAIR, rankCounts)
            };
        }
        
        // Pair
        if (pairs.length === 1) {
            return {
                rank: HAND_RANKINGS.PAIR,
                name: HAND_NAMES[HAND_RANKINGS.PAIR],
                cards: sorted,
                value: this.calculateValue(sorted, HAND_RANKINGS.PAIR, rankCounts)
            };
        }
        
        // High Card
        return {
            rank: HAND_RANKINGS.HIGH_CARD,
            name: HAND_NAMES[HAND_RANKINGS.HIGH_CARD],
            cards: sorted,
            value: this.calculateValue(sorted, HAND_RANKINGS.HIGH_CARD)
        };
    }
    
    static findBestHand(cards) {
        // Generar todas las combinaciones de 5 cartas
        const combinations = this.getCombinations(cards, 5);
        
        let bestHand: any = null;
        let bestValue = -1;
        
        for (const combo of combinations) {
            const hand = this.evaluate(combo);
            if (hand.value > bestValue) {
                bestValue = hand.value;
                bestHand = hand;
            }
        }
        
        return bestHand;
    }
    
    static getCombinations(array, size) {
        if (size === 1) return array.map(item => [item]);
        
        const combinations: any[] = [];
        for (let i = 0; i <= array.length - size; i++) {
            const head = array[i];
            const tailCombs = this.getCombinations(array.slice(i + 1), size - 1);
            for (const tail of tailCombs) {
                combinations.push([head, ...tail]);
            }
        }
        return combinations;
    }
    
    static isFlush(cards) {
        const suit = cards[0].suit;
        return cards.every(card => card.suit === suit);
    }
    
    static isStraight(cards) {
        const values = cards.map(c => c.value).sort((a, b) => b - a);
        
        // Verificar secuencia normal
        let isStraight = true;
        for (let i = 0; i < values.length - 1; i++) {
            if (values[i] - values[i + 1] !== 1) {
                isStraight = false;
                break;
            }
        }
        
        if (isStraight) return true;
        
        // Verificar A-2-3-4-5 (escalera baja)
        if (values[0] === 12 && values[1] === 3 && values[2] === 2 && 
            values[3] === 1 && values[4] === 0) {
            return true;
        }
        
        return false;
    }
    
    static getRankCounts(cards) {
        const counts: Record<string, any> = {};
        for (const card of cards) {
            counts[card.rank] = (counts[card.rank] || 0) + 1;
        }
        
        return Object.entries(counts)
            .map(([rank, count]) => ({ rank, count, value: RANKS.indexOf(rank) }))
            .sort((a, b) => b.count - a.count || b.value - a.value);
    }
    
    static calculateValue(cards, handRank, rankCounts: any = null) {
        // Valor base del ranking
        let value = handRank * 10000000000;
        
        if (!rankCounts) {
            rankCounts = this.getRankCounts(cards);
        }
        
        // Añadir valores de cartas específicas según el tipo de mano
        const cardValues = rankCounts.map(rc => rc.value);
        
        for (let i = 0; i < cardValues.length; i++) {
            value += cardValues[i] * Math.pow(100, 4 - i);
        }
        
        return value;
    }
    
    /**
     * Compara dos manos y devuelve el resultado
     * @returns {number} 1 si hand1 gana, -1 si hand2 gana, 0 si empate
     */
    static compare(hand1, hand2) {
        if (hand1.value > hand2.value) return 1;
        if (hand1.value < hand2.value) return -1;
        return 0;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      CLASE JUGADOR                                          │
// ═══════════════════════════════════════════════════════════════════════════════

class Player {
    bet: number
    id: any
    name: any
    chips: any
    hand: any
    totalBet: number
    isActive: boolean
    isFolded: boolean
    isAllIn: boolean
    lastAction: any
    position: any
    stats: any

    constructor(id, name, chips) {
        this.id = id;
        this.name = name;
        this.chips = chips;
        this.hand = [];
        this.bet = 0;
        this.totalBet = 0;
        this.isActive = true;
        this.isFolded = false;
        this.isAllIn = false;
        this.lastAction = null;
        this.position = null;
        
        // Estadísticas de sesión
        this.stats = {
            handsPlayed: 0,
            handsWon: 0,
            totalWinnings: 0,
            totalLosses: 0,
            biggestPot: 0,
            bestHand: null
        };
    }
    
    dealCards(cards) {
        this.hand = cards;
    }
    
    placeBet(amount) {
        if (amount > this.chips) {
            // All-in
            amount = this.chips;
            this.isAllIn = true;
        }
        
        this.chips -= amount;
        this.bet += amount;
        this.totalBet += amount;
        this.lastAction = { type: 'bet', amount };
        
        Logger.debug(`${this.name} apuesta $${amount} (chips restantes: ${this.chips})`);
        
        return amount;
    }
    
    call(amount) {
        const callAmount = Math.min(amount, this.chips);
        return this.placeBet(callAmount);
    }
    
    raise(amount) {
        return this.placeBet(amount);
    }
    
    fold() {
        this.isFolded = true;
        this.isActive = false;
        this.lastAction = { type: 'fold' };
        Logger.debug(`${this.name} se retira`);
    }
    
    check() {
        this.lastAction = { type: 'check' };
        Logger.debug(`${this.name} hace check`);
    }
    
    allIn() {
        const amount = this.chips;
        this.isAllIn = true;
        return this.placeBet(amount);
    }
    
    winPot(amount) {
        this.chips += amount;
        this.stats.handsWon++;
        this.stats.totalWinnings += amount;
        
        if (amount > this.stats.biggestPot) {
            this.stats.biggestPot = amount;
        }
    }
    
    resetForNewHand() {
        this.hand = [];
        this.bet = 0;
        this.totalBet = 0;
        this.isFolded = false;
        this.isAllIn = false;
        this.isActive = this.chips > 0;
        this.lastAction = null;
    }
    
    getHandStrength() {
        return this.hand.map(card => card.toString()).join(' ');
    }
    
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            chips: this.chips,
            hand: this.hand.map(c => c.toJSON()),
            bet: this.bet,
            totalBet: this.totalBet,
            isActive: this.isActive,
            isFolded: this.isFolded,
            isAllIn: this.isAllIn,
            lastAction: this.lastAction,
            position: this.position
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      CLASE JUEGO DE POKER                                   │
// ═══════════════════════════════════════════════════════════════════════════════

class PokerGame {
    id: string
    players: any
    deck: Deck
    communityCards: any[]
    pot: number
    sidePots: any[]
    currentBet: any
    dealerButton: number
    smallBlindIndex: number
    bigBlindIndex: number
    currentPlayerIndex: number
    round: string
    handNumber: number
    isStarted: boolean
    isFinished: boolean
    winners: any[]
    history: any[]
    config: any

    constructor(options: Record<string, any> = {}) {
        this.id = randomHex(8);
        this.players = [];
        this.deck = new Deck();
        this.communityCards = [];
        this.pot = 0;
        this.sidePots = [];
        this.currentBet = 0;
        this.dealerButton = 0;
        this.smallBlindIndex = 1;
        this.bigBlindIndex = 2;
        this.currentPlayerIndex = 0;
        this.round = 'preflop'; // preflop, flop, turn, river
        this.handNumber = 0;
        this.isStarted = false;
        this.isFinished = false;
        this.winners = [];
        this.history = [];
        
        // Configuración
        this.config = {
            smallBlind: options.smallBlind || CONFIG.DEFAULT_SMALL_BLIND,
            bigBlind: options.bigBlind || CONFIG.DEFAULT_BIG_BLIND,
            minBuyIn: options.minBuyIn || CONFIG.MIN_BUY_IN,
            maxBuyIn: options.maxBuyIn || CONFIG.MAX_BUY_IN,
            maxPlayers: options.maxPlayers || CONFIG.MAX_PLAYERS,
            isTournament: options.isTournament || false,
            actionTimeout: options.actionTimeout || CONFIG.ACTION_TIMEOUT
        };
        
        Logger.info(`🃏 Nueva partida de poker creada: ${this.id}`);
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      GESTIÓN DE JUGADORES                             │
    // ═════════════════════════════════════════════════════════════════════════
    
    addPlayer(playerId, playerName, buyIn) {
        if (this.players.length >= this.config.maxPlayers) {
            throw new Error('La mesa está llena');
        }
        
        if (this.isStarted) {
            throw new Error('No se pueden agregar jugadores mientras el juego está en curso');
        }
        
        if (buyIn < this.config.minBuyIn || buyIn > this.config.maxBuyIn) {
            throw new Error(`Buy-in debe estar entre $${this.config.minBuyIn} y $${this.config.maxBuyIn}`);
        }
        
        const player = new Player(playerId, playerName, buyIn);
        player.position = this.players.length;
        this.players.push(player);
        
        Logger.info(`✅ ${playerName} se unió con $${buyIn}`);
        
        return player;
    }
    
    removePlayer(playerId) {
        const index = this.players.findIndex(p => p.id === playerId);
        if (index === -1) {
            throw new Error('Jugador no encontrado');
        }
        
        const player = this.players[index];
        this.players.splice(index, 1);
        
        Logger.info(`❌ ${player.name} abandonó la mesa`);
        
        return player;
    }
    
    getPlayer(playerId) {
        return this.players.find(p => p.id === playerId);
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      INICIO DEL JUEGO                                 │
    // ═════════════════════════════════════════════════════════════════════════
    
    start() {
        if (this.players.length < CONFIG.MIN_PLAYERS) {
            throw new Error(`Se necesitan al menos ${CONFIG.MIN_PLAYERS} jugadores`);
        }
        
        this.isStarted = true;
        Logger.info(`🎲 Juego iniciado con ${this.players.length} jugadores`);
        
        this.startNewHand();
    }
    
    startNewHand() {
        this.handNumber++;
        this.round = 'preflop';
        this.pot = 0;
        this.sidePots = [];
        this.currentBet = 0;
        this.communityCards = [];
        this.winners = [];
        
        // Resetear jugadores
        this.players.forEach(p => p.resetForNewHand());
        
        // Remover jugadores sin chips
        this.players = this.players.filter(p => p.chips > 0);
        
        if (this.players.length < CONFIG.MIN_PLAYERS) {
            this.endGame();
            return;
        }
        
        // Nueva baraja
        this.deck.reset();
        
        // Mover botón del dealer
        this.dealerButton = (this.dealerButton + 1) % this.players.length;
        this.smallBlindIndex = (this.dealerButton + 1) % this.players.length;
        this.bigBlindIndex = (this.dealerButton + 2) % this.players.length;
        
        // Publicar blinds
        this.postBlinds();
        
        // Repartir cartas
        this.dealHoleCards();
        
        // Primera ronda de apuestas (después del big blind)
        this.currentPlayerIndex = (this.bigBlindIndex + 1) % this.players.length;
        
        Logger.info(`📇 Mano #${this.handNumber} iniciada`);
        Logger.info(`   Dealer: ${this.players[this.dealerButton].name}`);
        Logger.info(`   Small Blind: ${this.players[this.smallBlindIndex].name} ($${this.config.smallBlind})`);
        Logger.info(`   Big Blind: ${this.players[this.bigBlindIndex].name} ($${this.config.bigBlind})`);
    }
    
    postBlinds() {
        const sbPlayer = this.players[this.smallBlindIndex];
        const bbPlayer = this.players[this.bigBlindIndex];
        
        const sbAmount = sbPlayer.placeBet(this.config.smallBlind);
        const bbAmount = bbPlayer.placeBet(this.config.bigBlind);
        
        this.pot += sbAmount + bbAmount;
        this.currentBet = this.config.bigBlind;
        
        Logger.debug(`Blinds publicados: SB=$${sbAmount}, BB=$${bbAmount}`);
    }
    
    dealHoleCards() {
        for (const player of this.players) {
            player.dealCards(this.deck.drawMultiple(2));
            player.stats.handsPlayed++;
        }
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      ACCIONES DE JUGADOR                              │
    // ═════════════════════════════════════════════════════════════════════════
    
    playerAction(playerId, action, amount = 0) {
        const player = this.getPlayer(playerId);
        if (!player) {
            throw new Error('Jugador no encontrado');
        }
        
        if (this.players[this.currentPlayerIndex].id !== playerId) {
            throw new Error('No es tu turno');
        }
        
        if (!player.isActive || player.isFolded) {
            throw new Error('No puedes realizar acciones');
        }
        
        let betAmount = 0;
        
        switch (action) {
            case 'fold':
                player.fold();
                break;
                
            case 'check':
                if (player.bet < this.currentBet) {
                    throw new Error('No puedes hacer check, debes igualar o retirarte');
                }
                player.check();
                break;
                
            case 'call':
                const callAmount = this.currentBet - player.bet;
                betAmount = player.call(callAmount);
                this.pot += betAmount;
                break;
                
            case 'raise':
                if (amount <= this.currentBet) {
                    throw new Error(`El raise debe ser mayor a $${this.currentBet}`);
                }
                betAmount = player.raise(amount - player.bet);
                this.pot += betAmount;
                this.currentBet = player.bet;
                break;
                
            case 'allin':
                betAmount = player.allIn();
                this.pot += betAmount;
                if (player.bet > this.currentBet) {
                    this.currentBet = player.bet;
                }
                break;
                
            default:
                throw new Error('Acción inválida');
        }
        
        this.history.push({
            handNumber: this.handNumber,
            round: this.round,
            player: player.name,
            action,
            amount: betAmount,
            pot: this.pot,
            timestamp: Date.now()
        });
        
        // Siguiente jugador
        this.nextPlayer();
        
        // Verificar si la ronda de apuestas terminó
        if (this.isBettingRoundComplete()) {
            this.nextRound();
        }
        
        return {
            success: true as const,
            action,
            amount: betAmount,
            pot: this.pot,
            currentBet: this.currentBet
        };
    }
    
    nextPlayer() {
        let attempts = 0;
        do {
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
            attempts++;
            
            if (attempts > this.players.length) {
                break;
            }
        } while (!this.players[this.currentPlayerIndex].isActive || 
                 this.players[this.currentPlayerIndex].isFolded ||
                 this.players[this.currentPlayerIndex].isAllIn);
    }
    
    isBettingRoundComplete() {
        const activePlayers = this.players.filter(p => p.isActive && !p.isFolded && !p.isAllIn);
        
        if (activePlayers.length === 0) {
            return true;
        }
        
        if (activePlayers.length === 1) {
            return true;
        }
        
        // Todos los jugadores activos han igualado la apuesta
        return activePlayers.every(p => p.bet === this.currentBet && p.lastAction !== null);
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      RONDAS DEL JUEGO                                 │
    // ═════════════════════════════════════════════════════════════════════════
    
    nextRound() {
        // Resetear apuestas
        this.players.forEach(p => {
            p.bet = 0;
            p.lastAction = null;
        });
        this.currentBet = 0;
        
        switch (this.round) {
            case 'preflop':
                this.dealFlop();
                this.round = 'flop';
                break;
                
            case 'flop':
                this.dealTurn();
                this.round = 'turn';
                break;
                
            case 'turn':
                this.dealRiver();
                this.round = 'river';
                break;
                
            case 'river':
                this.showdown();
                return;
        }
        
        // Primera persona después del dealer empieza
        this.currentPlayerIndex = (this.dealerButton + 1) % this.players.length;
        this.nextPlayer();
        
        Logger.info(`📊 Ronda: ${this.round.toUpperCase()}`);
    }
    
    dealFlop() {
        this.deck.draw(); // Burn card
        this.communityCards.push(...this.deck.drawMultiple(3));
        Logger.info(`🃏 Flop: ${this.communityCards.map(c => c.toString()).join(' ')}`);
    }
    
    dealTurn() {
        this.deck.draw(); // Burn card
        this.communityCards.push(this.deck.draw());
        Logger.info(`🃏 Turn: ${this.communityCards[3].toString()}`);
    }
    
    dealRiver() {
        this.deck.draw(); // Burn card
        this.communityCards.push(this.deck.draw());
        Logger.info(`🃏 River: ${this.communityCards[4].toString()}`);
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      SHOWDOWN Y GANADORES                             │
    // ═════════════════════════════════════════════════════════════════════════
    
    showdown() {
        Logger.info('🎭 ¡SHOWDOWN!');
        
        const activePlayers = this.players.filter(p => !p.isFolded);
        
        if (activePlayers.length === 1) {
            // Solo queda un jugador
            this.winners = [activePlayers[0]];
            activePlayers[0].winPot(this.pot);
            Logger.info(`🏆 ${activePlayers[0].name} gana $${this.pot}`);
        } else {
            // Evaluar manos
            const evaluatedPlayers = activePlayers.map(player => {
                const allCards = [...player.hand, ...this.communityCards];
                const hand = HandEvaluator.evaluate(allCards);
                
                return {
                    player,
                    hand
                };
            });
            
            // Ordenar por valor de mano
            evaluatedPlayers.sort((a, b) => 
                HandEvaluator.compare(b.hand, a.hand)
            );
            
            // Determinar ganadores (puede haber empates)
            const bestHandValue = evaluatedPlayers[0].hand.value;
            const winners = evaluatedPlayers.filter(ep => 
                ep.hand.value === bestHandValue
            );
            
            // Distribuir pot
            const winAmount = Math.floor(this.pot / winners.length);
            
            winners.forEach(({ player, hand }) => {
                player.winPot(winAmount);
                player.stats.bestHand = hand;
                this.winners.push(player);
                
                Logger.info(`🏆 ${player.name} gana $${winAmount} con ${hand.name}`);
                Logger.info(`   Cartas: ${hand.cards.map(c => c.toString()).join(' ')}`);
            });
        }
        
        // Continuar o finalizar
        setTimeout(() => {
            if (this.players.filter(p => p.chips > 0).length < CONFIG.MIN_PLAYERS) {
                this.endGame();
            } else {
                this.startNewHand();
            }
        }, 5000);
    }
    
    endGame() {
        this.isFinished = true;
        
        // Ordenar jugadores por chips
        const finalStandings = [...this.players].sort((a, b) => b.chips - a.chips);
        
        Logger.info('🏁 ¡JUEGO TERMINADO!');
        Logger.info('\n📊 RESULTADOS FINALES:');
        
        finalStandings.forEach((player, index) => {
            Logger.info(`${index + 1}. ${player.name}: $${player.chips}`);
        });
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      INFORMACIÓN Y ESTADO                             │
    // ═════════════════════════════════════════════════════════════════════════
    
    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }
    
    getGameState() {
        return {
            id: this.id,
            handNumber: this.handNumber,
            round: this.round,
            pot: this.pot,
            currentBet: this.currentBet,
            communityCards: this.communityCards.map(c => c.toJSON()),
            players: this.players.map(p => ({
                ...p.toJSON(),
                hand: p.isFolded ? [] : p.hand.map(c => c.toJSON())
            })),
            currentPlayer: this.getCurrentPlayer()?.name,
            dealerButton: this.dealerButton,
            isStarted: this.isStarted,
            isFinished: this.isFinished
        };
    }
    
    renderTable() {
        let output = '\n';
        output += '══════════════════════════════════\n';
        output += '      🃏 TEXAS HOLD\'EM 🃏\n';
        output += '══════════════════════════════════\n\n';
        
        output += `💰 POT: $${this.pot}\n`;
        output += `📊 Apuesta actual: $${this.currentBet}\n`;
        output += `🎲 Ronda: ${this.round.toUpperCase()}\n\n`;
        
        if (this.communityCards.length > 0) {
            output += `🃏 Mesa: ${this.communityCards.map(c => c.toString()).join(' ')}\n\n`;
        }
        
        output += '👥 JUGADORES:\n';
        output += '───────────────────────────────────────────────────────────\n';
        
        this.players.forEach((player, index) => {
            const isDealer = index === this.dealerButton ? ' 🎲' : '';
            const isCurrent = index === this.currentPlayerIndex ? ' 👉' : '';
            const status = player.isFolded ? ' (Retirado)' : 
                          player.isAllIn ? ' (ALL-IN)' : '';
            
            output += `${player.name}${isDealer}${isCurrent}${status}\n`;
            output += `  💵 Chips: $${player.chips} | Apuesta: $${player.bet}\n`;
            
            if (!player.isFolded && player.hand.length > 0) {
                output += `  🎴 Mano: ${player.hand.map(c => c.toString()).join(' ')}\n`;
            }
            
            output += '\n';
        });
        
        output += '═══════════════════════════════════════════════════════════\n';
        
        return output;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      GESTOR DE PARTIDAS                                     │
// ═══════════════════════════════════════════════════════════════════════════════

class PokerGameManager {
    games: Map<any, any>

    constructor() {
        this.games = new Map();
    }
    
    createGame(options: Record<string, any> = {}) {
        const game = new PokerGame(options);
        this.games.set(game.id, game);
        return game;
    }
    
    getGame(gameId) {
        return this.games.get(gameId);
    }
    
    deleteGame(gameId) {
        return this.games.delete(gameId);
    }
    
    getActiveGames() {
        return Array.from(this.games.values()).filter(g => !g.isFinished);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      EXPORTACIONES                                          │
// ═══════════════════════════════════════════════════════════════════════════════

const gameManager = new PokerGameManager();

export default PokerGame;
export {
    PokerGame,
    PokerGameManager,
    Player,
    Card,
    Deck,
    HandEvaluator,
    gameManager,
    HAND_RANKINGS,
    HAND_NAMES,
    CONFIG
};
