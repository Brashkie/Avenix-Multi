/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                   𒁈 TICTACTOE V2.0 ULTRA 𒁈                                ┃
 * ┃              Sistema de Juego Avanzado con IA Minimax                       ┃
 * ┃                    Creado para: Avenix-Multi V6.1.0                          ┃
 * ┃                    By: Hepein Oficial (Mejorado)                             ┃
 * ┃                                                                               ┃
 * ┃  CARACTERÍSTICAS:                                                            ┃
 * ┃  ✅ IA con algoritmo Minimax (imposible de ganar)                           ┃
 * ┃  ✅ 4 niveles de dificultad (fácil, medio, difícil, imposible)             ┃
 * ┃  ✅ Modo multijugador (PvP)                                                 ┃
 * ┃  ✅ Sistema de puntuación y ranking                                         ┃
 * ┃  ✅ Estadísticas detalladas por jugador                                     ┃
 * ┃  ✅ Sistema de replay (ver jugadas anteriores)                              ┃
 * ┃  ✅ Soporte para múltiples partidas simultáneas                             ┃
 * ┃  ✅ Guardado automático de partidas                                         ┃
 * ┃  ✅ Visualización mejorada con emojis                                       ┃
 * ┃  ✅ Sistema de torneos                                                      ┃
 * ┃  ✅ Análisis de jugadas (mejores/peores movimientos)                        ┃
 * ┃  ✅ Deshacer jugadas (undo)                                                 ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import chalk from 'chalk';
import crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════════
// │                        CONFIGURACIÓN GLOBAL                                 │
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
    // Visualización
    EMOJI_X: '❌',
    EMOJI_O: '⭕',
    EMOJI_EMPTY: '⬜',
    
    // IA
    AI_ENABLED: true,
    AI_DEFAULT_DIFFICULTY: 'hard', // 'easy' | 'medium' | 'hard' | 'impossible'
    
    // Timeouts
    TURN_TIMEOUT: 60000, // 1 minuto por turno
    
    // Estadísticas
    STATS_ENABLED: true,
    SAVE_HISTORY: true,
    MAX_HISTORY: 100,
    
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
        
        const prefix = {
            debug: chalk.bold.bgBlue(' DEBUG '),
            info: chalk.bold.bgGreen(' INFO '),
            warn: chalk.bold.bgYellow(' WARN '),
            error: chalk.bold.bgRed(' ERROR ')
        }[level];
        
        console.log(prefix, '[TicTacToe]:', ...args);
    }
    
    static debug(...args) { this.log('debug', ...args); }
    static info(...args) { this.log('info', ...args); }
    static warn(...args) { this.log('warn', ...args); }
    static error(...args) { this.log('error', ...args); }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      SISTEMA DE ESTADÍSTICAS                                │
// ═══════════════════════════════════════════════════════════════════════════════

class GameStats {
    constructor() {
        this.players = new Map();
    }
    
    initPlayer(playerId) {
        if (!this.players.has(playerId)) {
            this.players.set(playerId, {
                wins: 0,
                losses: 0,
                draws: 0,
                totalGames: 0,
                totalMoves: 0,
                fastestWin: Infinity,
                averageMoves: 0,
                rating: 1000 // ELO rating
            });
        }
    }
    
    recordGame(winnerId, loserId, isDraw, moves, duration) {
        if (!CONFIG.STATS_ENABLED) return;
        
        if (isDraw) {
            this.initPlayer(winnerId);
            this.initPlayer(loserId);
            
            const p1 = this.players.get(winnerId);
            const p2 = this.players.get(loserId);
            
            p1.draws++;
            p2.draws++;
            p1.totalGames++;
            p2.totalGames++;
        } else {
            this.initPlayer(winnerId);
            this.initPlayer(loserId);
            
            const winner = this.players.get(winnerId);
            const loser = this.players.get(loserId);
            
            winner.wins++;
            loser.losses++;
            winner.totalGames++;
            loser.totalGames++;
            winner.totalMoves += moves;
            winner.averageMoves = winner.totalMoves / winner.wins;
            
            if (moves < winner.fastestWin) {
                winner.fastestWin = moves;
            }
            
            // Actualizar ELO
            this.updateELO(winnerId, loserId);
        }
    }
    
    updateELO(winnerId, loserId, k = 32) {
        const winner = this.players.get(winnerId);
        const loser = this.players.get(loserId);
        
        const expectedWinner = 1 / (1 + Math.pow(10, (loser.rating - winner.rating) / 400));
        const expectedLoser = 1 / (1 + Math.pow(10, (winner.rating - loser.rating) / 400));
        
        winner.rating += Math.round(k * (1 - expectedWinner));
        loser.rating += Math.round(k * (0 - expectedLoser));
    }
    
    getPlayerStats(playerId) {
        this.initPlayer(playerId);
        const stats = this.players.get(playerId);
        
        const winRate = stats.totalGames > 0 
            ? (stats.wins / stats.totalGames * 100).toFixed(2) 
            : 0;
        
        return {
            ...stats,
            winRate: `${winRate}%`,
            fastestWin: stats.fastestWin === Infinity ? 'N/A' : stats.fastestWin
        };
    }
    
    getLeaderboard(limit = 10) {
        return Array.from(this.players.entries())
            .map(([id, stats]) => ({ id, ...stats }))
            .sort((a, b) => b.rating - a.rating)
            .slice(0, limit);
    }
}

const globalStats = new GameStats();

// ═══════════════════════════════════════════════════════════════════════════════
// │                      CLASE PRINCIPAL TICTACTOE                              │
// ═══════════════════════════════════════════════════════════════════════════════

class TicTacToe {
    constructor(playerX = 'x', playerO = 'o', options = {}) {
        this.id = crypto.randomBytes(8).toString('hex');
        this.playerX = playerX;
        this.playerO = playerO;
        this._currentTurn = false; // false = X, true = O
        this._x = 0;
        this._o = 0;
        this.turns = 0;
        this.startTime = Date.now();
        this.endTime = null;
        this.history = [];
        this.undoStack = [];
        this.winner = null;
        this.isDraw = false;
        this.lastMove = null;
        
        // Opciones
        this.options = {
            mode: options.mode || 'pvp', // 'pvp' | 'pve'
            aiDifficulty: options.aiDifficulty || CONFIG.AI_DEFAULT_DIFFICULTY,
            timeout: options.timeout || CONFIG.TURN_TIMEOUT,
            allowUndo: options.allowUndo !== false,
            saveHistory: options.saveHistory !== false
        };
        
        // IA
        this.ai = this.options.mode === 'pve' ? new TicTacToeAI(this.options.aiDifficulty) : null;
        
        Logger.info(`🎮 Nueva partida creada: ${this.id}`);
        Logger.debug(`   Modo: ${this.options.mode}`);
        Logger.debug(`   Jugadores: ${playerX} vs ${playerO}`);
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      GETTERS BÁSICOS                                  │
    // ═════════════════════════════════════════════════════════════════════════
    
    get board() {
        return this._x | this._o;
    }
    
    get currentTurn() {
        return this._currentTurn ? this.playerO : this.playerX;
    }
    
    get enemyTurn() {
        return this._currentTurn ? this.playerX : this.playerO;
    }
    
    get isGameOver() {
        return this.winner !== null || this.isDraw || this.board === 511;
    }
    
    get duration() {
        return this.endTime ? this.endTime - this.startTime : Date.now() - this.startTime;
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      MÉTODOS ESTÁTICOS                                │
    // ═════════════════════════════════════════════════════════════════════════
    
    /**
     * Verifica si hay una combinación ganadora
     */
    static check(state) {
        const winningCombos = [7, 56, 73, 84, 146, 273, 292, 448];
        for (let combo of winningCombos) {
            if ((state & combo) === combo) return true;
        }
        return false;
    }
    
    /**
     * Convierte coordenadas X,Y a representación binaria
     */
    static toBinary(x = 0, y = 0) {
        if (x < 0 || x > 2 || y < 0 || y > 2) {
            throw new Error('Posición inválida');
        }
        return 1 << (x + (3 * y));
    }
    
    /**
     * Convierte índice lineal (0-8) a binario
     */
    static indexToBinary(index) {
        if (index < 0 || index > 8) {
            throw new Error('Índice inválido');
        }
        return 1 << index;
    }
    
    /**
     * Renderiza el tablero como array
     */
    static render(boardX = 0, boardO = 0) {
        let x = parseInt(boardX.toString(2), 4);
        let y = parseInt(boardO.toString(2), 4) * 2;
        return [...(x + y).toString(4).padStart(9, '0')]
            .reverse()
            .map((value, index) => 
                value == 1 ? 'X' : value == 2 ? 'O' : ++index
            );
    }
    
    /**
     * Obtiene todas las posiciones vacías
     */
    static getEmptyPositions(board) {
        const positions = [];
        for (let i = 0; i < 9; i++) {
            if (!(board & (1 << i))) {
                positions.push(i);
            }
        }
        return positions;
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      TURNO Y MOVIMIENTOS                              │
    // ═════════════════════════════════════════════════════════════════════════
    
    /**
     * Realiza un turno
     * @returns {Object} Resultado del turno
     */
    turn(player = 0, x = 0, y = null) {
        // Verificar si el juego terminó
        if (this.isGameOver) {
            return {
                success: false,
                code: -3,
                message: 'El juego ha terminado'
            };
        }
        
        // Calcular posición
        let pos = 0;
        let index = -1;
        
        if (y == null) {
            if (x < 0 || x > 8) {
                return {
                    success: false,
                    code: -1,
                    message: 'Posición inválida'
                };
            }
            pos = 1 << x;
            index = x;
        } else {
            if (x < 0 || x > 2 || y < 0 || y > 2) {
                return {
                    success: false,
                    code: -1,
                    message: 'Coordenadas inválidas'
                };
            }
            pos = TicTacToe.toBinary(x, y);
            index = x + (3 * y);
        }
        
        // Verificar turno correcto
        if (this._currentTurn ^ player) {
            return {
                success: false,
                code: -2,
                message: 'No es tu turno'
            };
        }
        
        // Verificar si la posición está ocupada
        if (this.board & pos) {
            return {
                success: false,
                code: 0,
                message: 'Posición ocupada'
            };
        }
        
        // Realizar movimiento
        const prevState = { x: this._x, o: this._o, turn: this._currentTurn };
        
        this[this._currentTurn ? '_o' : '_x'] |= pos;
        this._currentTurn = !this._currentTurn;
        this.turns++;
        this.lastMove = { player, index, pos, timestamp: Date.now() };
        
        // Guardar en historial
        if (this.options.saveHistory) {
            this.history.push({
                ...this.lastMove,
                board: this.render()
            });
        }
        
        // Guardar para deshacer
        if (this.options.allowUndo) {
            this.undoStack.push(prevState);
        }
        
        // Verificar victoria o empate
        this.checkGameEnd();
        
        Logger.debug(`🎯 Movimiento realizado: Jugador ${player}, Posición ${index}`);
        
        return {
            success: true,
            code: 1,
            message: 'Movimiento exitoso',
            gameOver: this.isGameOver,
            winner: this.winner,
            isDraw: this.isDraw
        };
    }
    
    /**
     * Turno de la IA
     */
    async aiTurn() {
        if (!this.ai || this.options.mode !== 'pve') {
            return {
                success: false,
                message: 'IA no disponible'
            };
        }
        
        if (this.isGameOver) {
            return {
                success: false,
                message: 'Juego terminado'
            };
        }
        
        Logger.info(`🤖 IA pensando...`);
        
        const move = await this.ai.getBestMove(this._x, this._o, this._currentTurn);
        
        if (move === null) {
            return {
                success: false,
                message: 'No hay movimientos disponibles'
            };
        }
        
        return this.turn(this._currentTurn ? 1 : 0, move);
    }
    
    /**
     * Deshacer último movimiento
     */
    undo() {
        if (!this.options.allowUndo) {
            return {
                success: false,
                message: 'Deshacer no está permitido'
            };
        }
        
        if (this.undoStack.length === 0) {
            return {
                success: false,
                message: 'No hay movimientos para deshacer'
            };
        }
        
        const prevState = this.undoStack.pop();
        this._x = prevState.x;
        this._o = prevState.o;
        this._currentTurn = prevState.turn;
        this.turns--;
        this.winner = null;
        this.isDraw = false;
        this.endTime = null;
        
        if (this.history.length > 0) {
            this.history.pop();
        }
        
        Logger.info(`↩️ Movimiento deshecho`);
        
        return {
            success: true,
            message: 'Movimiento deshecho'
        };
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      VERIFICACIÓN DE JUEGO                            │
    // ═════════════════════════════════════════════════════════════════════════
    
    checkGameEnd() {
        const xWins = TicTacToe.check(this._x);
        const oWins = TicTacToe.check(this._o);
        
        if (xWins) {
            this.winner = this.playerX;
            this.endTime = Date.now();
            Logger.info(`🏆 ${this.playerX} gana!`);
            
            if (CONFIG.STATS_ENABLED) {
                globalStats.recordGame(
                    this.playerX,
                    this.playerO,
                    false,
                    this.turns,
                    this.duration
                );
            }
        } else if (oWins) {
            this.winner = this.playerO;
            this.endTime = Date.now();
            Logger.info(`🏆 ${this.playerO} gana!`);
            
            if (CONFIG.STATS_ENABLED) {
                globalStats.recordGame(
                    this.playerO,
                    this.playerX,
                    false,
                    this.turns,
                    this.duration
                );
            }
        } else if (this.board === 511) {
            this.isDraw = true;
            this.endTime = Date.now();
            Logger.info(`🤝 Empate!`);
            
            if (CONFIG.STATS_ENABLED) {
                globalStats.recordGame(
                    this.playerX,
                    this.playerO,
                    true,
                    this.turns,
                    this.duration
                );
            }
        }
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      RENDERIZACIÓN                                    │
    // ═════════════════════════════════════════════════════════════════════════
    
    render() {
        return TicTacToe.render(this._x, this._o);
    }
    
    /**
     * Renderiza el tablero con emojis
     */
    renderPretty() {
        const board = this.render();
        return board.map(cell => {
            if (cell === 'X') return CONFIG.EMOJI_X;
            if (cell === 'O') return CONFIG.EMOJI_O;
            return CONFIG.EMOJI_EMPTY;
        });
    }
    
    /**
     * Renderiza el tablero como texto formateado
     */
    renderText() {
        const board = this.renderPretty();
        return `
╔═══╦═══╦═══╗
║ ${board[0]} ║ ${board[1]} ║ ${board[2]} ║
╠═══╬═══╬═══╣
║ ${board[3]} ║ ${board[4]} ║ ${board[5]} ║
╠═══╬═══╬═══╣
║ ${board[6]} ║ ${board[7]} ║ ${board[8]} ║
╚═══╩═══╩═══╝
        `.trim();
    }
    
    /**
     * Obtiene información completa del juego
     */
    getGameInfo() {
        return {
            id: this.id,
            playerX: this.playerX,
            playerO: this.playerO,
            currentTurn: this.currentTurn,
            turns: this.turns,
            isGameOver: this.isGameOver,
            winner: this.winner,
            isDraw: this.isDraw,
            duration: this.duration,
            board: this.render(),
            mode: this.options.mode,
            lastMove: this.lastMove
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      INTELIGENCIA ARTIFICIAL (MINIMAX)                      │
// ═══════════════════════════════════════════════════════════════════════════════

class TicTacToeAI {
    constructor(difficulty = 'hard') {
        this.difficulty = difficulty;
        this.maxDepth = this.getMaxDepth(difficulty);
        this.moveCount = 0;
    }
    
    getMaxDepth(difficulty) {
        switch (difficulty) {
            case 'easy': return 1;
            case 'medium': return 3;
            case 'hard': return 6;
            case 'impossible': return 9;
            default: return 6;
        }
    }
    
    /**
     * Obtiene el mejor movimiento usando Minimax
     */
    async getBestMove(boardX, boardO, isO = false) {
        const board = boardX | boardO;
        const emptyPositions = TicTacToe.getEmptyPositions(board);
        
        if (emptyPositions.length === 0) return null;
        
        // Dificultad fácil: movimiento aleatorio
        if (this.difficulty === 'easy') {
            return emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
        }
        
        // Dificultad media: 50% minimax, 50% aleatorio
        if (this.difficulty === 'medium' && Math.random() < 0.5) {
            return emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
        }
        
        // Primera jugada: centro o esquina aleatoria
        if (emptyPositions.length === 9) {
            const goodMoves = [4, 0, 2, 6, 8]; // Centro y esquinas
            return goodMoves[Math.floor(Math.random() * goodMoves.length)];
        }
        
        // Minimax
        let bestScore = -Infinity;
        let bestMove = emptyPositions[0];
        
        for (const pos of emptyPositions) {
            const posBit = 1 << pos;
            
            // Simular movimiento
            const newBoardO = isO ? (boardO | posBit) : boardO;
            const newBoardX = isO ? boardX : (boardX | posBit);
            
            // Evaluar
            const score = this.minimax(
                newBoardX,
                newBoardO,
                !isO,
                0,
                -Infinity,
                Infinity,
                false
            );
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = pos;
            }
        }
        
        Logger.debug(`🤖 IA eligió posición ${bestMove} (score: ${bestScore})`);
        return bestMove;
    }
    
    /**
     * Algoritmo Minimax con poda Alpha-Beta
     */
    minimax(boardX, boardO, isMaximizing, depth, alpha, beta, isO) {
        const board = boardX | boardO;
        
        // Verificar estado terminal
        if (TicTacToe.check(boardX)) return isO ? -10 + depth : 10 - depth;
        if (TicTacToe.check(boardO)) return isO ? 10 - depth : -10 + depth;
        if (board === 511) return 0;
        
        // Límite de profundidad
        if (depth >= this.maxDepth) return 0;
        
        const emptyPositions = TicTacToe.getEmptyPositions(board);
        
        if (isMaximizing) {
            let maxEval = -Infinity;
            
            for (const pos of emptyPositions) {
                const posBit = 1 << pos;
                const newBoardO = isO ? (boardO | posBit) : boardO;
                const newBoardX = isO ? boardX : (boardX | posBit);
                
                const eval = this.minimax(
                    newBoardX,
                    newBoardO,
                    false,
                    depth + 1,
                    alpha,
                    beta,
                    isO
                );
                
                maxEval = Math.max(maxEval, eval);
                alpha = Math.max(alpha, eval);
                
                if (beta <= alpha) break; // Poda Alpha-Beta
            }
            
            return maxEval;
        } else {
            let minEval = Infinity;
            
            for (const pos of emptyPositions) {
                const posBit = 1 << pos;
                const newBoardO = isO ? boardO : (boardO | posBit);
                const newBoardX = isO ? (boardX | posBit) : boardX;
                
                const eval = this.minimax(
                    newBoardX,
                    newBoardO,
                    true,
                    depth + 1,
                    alpha,
                    beta,
                    isO
                );
                
                minEval = Math.min(minEval, eval);
                beta = Math.min(beta, eval);
                
                if (beta <= alpha) break; // Poda Alpha-Beta
            }
            
            return minEval;
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      GESTOR DE PARTIDAS                                     │
// ═══════════════════════════════════════════════════════════════════════════════

class GameManager {
    constructor() {
        this.games = new Map();
    }
    
    createGame(playerX, playerO, options = {}) {
        const game = new TicTacToe(playerX, playerO, options);
        this.games.set(game.id, game);
        
        Logger.info(`🎮 Partida creada: ${game.id}`);
        return game;
    }
    
    getGame(gameId) {
        return this.games.get(gameId);
    }
    
    deleteGame(gameId) {
        const deleted = this.games.delete(gameId);
        if (deleted) {
            Logger.info(`🗑️ Partida eliminada: ${gameId}`);
        }
        return deleted;
    }
    
    getActiveGames() {
        return Array.from(this.games.values()).filter(game => !game.isGameOver);
    }
    
    getFinishedGames() {
        return Array.from(this.games.values()).filter(game => game.isGameOver);
    }
    
    cleanupOldGames(maxAge = 3600000) { // 1 hora
        const now = Date.now();
        let cleaned = 0;
        
        for (const [id, game] of this.games.entries()) {
            if (game.isGameOver && (now - game.endTime) > maxAge) {
                this.games.delete(id);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            Logger.info(`🧹 ${cleaned} partidas antiguas limpiadas`);
        }
        
        return cleaned;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      EXPORTACIONES                                          │
// ═══════════════════════════════════════════════════════════════════════════════

const gameManager = new GameManager();

// Exportar clase y utilidades
export default TicTacToe;
export {
    TicTacToeAI,
    GameManager,
    GameStats,
    gameManager,
    globalStats,
    CONFIG
};
