// En tu plugin de juego
import { gameManager } from './lib/tictactoe.js';

let handler = async (m, { conn, text, command }) => {
    const chatId = m.chat;
    
    // Comandos
    if (command === 'ttt' || command === 'tictactoe') {
        // Crear nueva partida
        const opponent = m.mentionedJid[0] || 'IA';
        const game = gameManager.createGame(
            m.sender,
            opponent,
            opponent === 'IA' ? { mode: 'pve', aiDifficulty: 'hard' } : { mode: 'pvp' }
        );
        
        // Guardar ID en la sesión del chat
        global.db.data.chats[chatId].tttGame = game.id;
        
        // Mostrar tablero inicial
        const boardText = game.renderText();
        await conn.reply(m.chat, `
🎮 *TRES EN RAYA* 🎮

${boardText}

*Jugadores:*
❌ ${game.playerX}
⭕ ${game.playerO}

*Turno actual:* ${game.currentTurn}

*Usa:* .ttt [1-9] para jugar
*Ejemplo:* .ttt 5 (centro)

Posiciones:
1 | 2 | 3
---------
4 | 5 | 6
---------
7 | 8 | 9
        `.trim(), m);
        
        return;
    }
    
    // Hacer movimiento
    if (command === 'tttmove' || /^\d$/.test(text)) {
        const gameId = global.db.data.chats[chatId].tttGame;
        const game = gameManager.getGame(gameId);
        
        if (!game) {
            return m.reply('❌ No hay partida activa. Usa *.ttt* para empezar.');
        }
        
        if (game.isGameOver) {
            return m.reply('❌ Esta partida ya terminó. Usa *.ttt* para nueva partida.');
        }
        
        // Verificar turno
        if (game.currentTurn !== m.sender) {
            return m.reply('⏳ No es tu turno. Espera al oponente.');
        }
        
        // Realizar movimiento
        const position = parseInt(text) - 1;  // 1-9 a 0-8
        const player = game.playerX === m.sender ? 0 : 1;
        const result = game.turn(player, position);
        
        if (!result.success) {
            return m.reply(`❌ ${result.message}`);
        }
        
        // Si es contra IA, hacer su turno
        if (game.options.mode === 'pve' && !game.isGameOver) {
            await game.aiTurn();
        }
        
        // Mostrar tablero actualizado
        const boardText = game.renderText();
        let message = `${boardText}\n\n`;
        
        if (game.isGameOver) {
            if (game.winner) {
                message += `🏆 *¡GANÓ ${game.winner}!*\n\n`;
            } else {
                message += `🤝 *¡EMPATE!*\n\n`;
            }
            message += `⏱️ Duración: ${Math.round(game.duration / 1000)}s\n`;
            message += `🔢 Turnos: ${game.turns}\n\n`;
            message += `Usa *.ttt* para jugar otra vez`;
            
            // Limpiar sesión
            delete global.db.data.chats[chatId].tttGame;
        } else {
            message += `*Turno actual:* ${game.currentTurn}`;
        }
        
        await conn.reply(m.chat, message, m);
        return;
    }
};

handler.help = ['ttt', 'tictactoe'];
handler.tags = ['game'];
handler.command = /^(ttt|tictactoe)$/i;

export default handler;
