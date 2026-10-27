// plugin: poker.js
import { gameManager } from '../lib/poker.js';
import type { PluginHandler } from '../types/index.js'

const handler: PluginHandler = async (m, { conn, text, command, usedPrefix }) => {
    const chatId = m.chat;
    const userId = m.sender;
    const userName = await conn.getName(userId);
    
    // Crear mesa
    if (command === 'poker' || command === 'pokerstart') {
        if (global.db.data.chats[chatId].pokerGame) {
            return m.reply('❌ Ya hay una partida activa. Usa *.pokerjoin* para unirte.');
        }
        
        const game = gameManager.createGame({
            smallBlind: 10,
            bigBlind: 20,
            minBuyIn: 200,
            maxBuyIn: 2000
        });
        
        global.db.data.chats[chatId].pokerGame = game.id;
        
        return m.reply(`
🃏 *MESA DE POKER CREADA* 🃏

*Configuración:*
- Small Blind: $10
- Big Blind: $20
- Buy-in: $200 - $2000
- Jugadores: 2-10

*Comandos:*
- ${usedPrefix}pokerjoin [cantidad] - Unirse
- ${usedPrefix}pokerstart - Empezar
- ${usedPrefix}pokerleave - Salir

*ID de Mesa:* \`${game.id}\`

⏳ Esperando jugadores...
        `.trim());
    }
    
    // Unirse a la mesa
    if (command === 'pokerjoin') {
        const gameId = global.db.data.chats[chatId].pokerGame;
        if (!gameId) {
            return m.reply('❌ No hay mesa activa. Crea una con *.poker*');
        }
        
        const game = gameManager.getGame(gameId);
        if (!game) {
            delete global.db.data.chats[chatId].pokerGame;
            return m.reply('❌ La mesa no existe. Crea una nueva.');
        }
        
        const buyIn = parseInt(text) || 500;
        
        // Verificar que tenga suficiente dinero
        const userMoney = global.db.data.users[userId].money || 0;
        if (userMoney < buyIn) {
            return m.reply(`❌ No tienes suficiente dinero. Necesitas $${buyIn} y tienes $${userMoney}.`);
        }
        
        try {
            game.addPlayer(userId, userName, buyIn);
            
            // Descontar dinero
            global.db.data.users[userId].money -= buyIn;
            
            return m.reply(`
✅ *${userName}* se unió a la mesa!

💵 Buy-in: $${buyIn}
👥 Jugadores: ${game.players.length}/${game.config.maxPlayers}

${game.players.length >= 2 ? `\n🎲 Usa *${usedPrefix}pokerbegin* para iniciar` : '⏳ Esperando más jugadores...'}
            `.trim());
            
        } catch (error) {
            return m.reply(`❌ Error: ${error.message}`);
        }
    }
    
    // Iniciar partida
    if (command === 'pokerbegin') {
        const gameId = global.db.data.chats[chatId].pokerGame;
        const game = gameManager.getGame(gameId);
        
        if (!game) {
            return m.reply('❌ No hay mesa activa.');
        }
        
        try {
            game.start();
            
            const state = game.getGameState();
            const currentPlayer = game.getCurrentPlayer();
            
            return conn.reply(m.chat, `
🎲 *PARTIDA INICIADA* 🎲

${game.renderTable()}

*Turno actual:* ${currentPlayer.name}

*Acciones disponibles:*
- ${usedPrefix}pokercall - Igualar apuesta
- ${usedPrefix}pokerraise [cantidad] - Subir
- ${usedPrefix}pokerfold - Retirarse
- ${usedPrefix}pokercheck - Pasar (si no hay apuesta)
- ${usedPrefix}pokerallin - All-in

*Tiempo límite:* 60 segundos
            `.trim(), m);
            
        } catch (error) {
            return m.reply(`❌ Error: ${error.message}`);
        }
    }
    
    // Acciones de juego
    const actions = {
        'pokercall': 'call',
        'pokerraise': 'raise',
        'pokerfold': 'fold',
        'pokercheck': 'check',
        'pokerallin': 'allin'
    };
    
    if (actions[command]) {
        const gameId = global.db.data.chats[chatId].pokerGame;
        const game = gameManager.getGame(gameId);
        
        if (!game || !game.isStarted) {
            return m.reply('❌ No hay partida activa.');
        }
        
        const currentPlayer = game.getCurrentPlayer();
        if (currentPlayer.id !== userId) {
            return m.reply(`⏳ No es tu turno. Esperando a: ${currentPlayer.name}`);
        }
        
        try {
            const action = actions[command];
            let amount = 0;
            
            if (action === 'raise') {
                amount = parseInt(text);
                if (!amount || amount <= game.currentBet) {
                    return m.reply(`❌ Debes especificar una cantidad mayor a $${game.currentBet}`);
                }
            }
            
            const result = game.playerAction(userId, action, amount);
            
            // Mostrar resultado
            let message = `${result.action.toUpperCase()}`;
            if (result.amount > 0) {
                message += ` $${result.amount}`;
            }
            message += `\n\n${game.renderTable()}`;
            
            // Si terminó la mano, mostrar ganadores
            if (game.winners.length > 0) {
                message += `\n\n🏆 *GANADORES* 🏆\n`;
                game.winners.forEach(winner => {
                    const hand = winner.stats.bestHand;
                    message += `\n${winner.name}\n`;
                    message += `💰 Ganancia: $${winner.chips - winner.totalBet}\n`;
                    if (hand) {
                        message += `🃏 Mano: ${hand.name}\n`;
                        message += `🎴 Cartas: ${hand.cards.map(c => c.toString()).join(' ')}\n`;
                    }
                });
                
                // Devolver dinero a los jugadores
                game.players.forEach(player => {
                    if (global.db.data.users[player.id]) {
                        global.db.data.users[player.id].money += player.chips;
                    }
                });
                
                // Limpiar mesa
                delete global.db.data.chats[chatId].pokerGame;
                
                message += `\n\n✅ Dinero devuelto a los jugadores.`;
                message += `\n🎲 Usa *${usedPrefix}poker* para jugar de nuevo.`;
            } else {
                const nextPlayer = game.getCurrentPlayer();
                message += `\n\n*Siguiente:* ${nextPlayer.name}`;
            }
            
            return conn.reply(m.chat, message, m);
            
        } catch (error) {
            return m.reply(`❌ Error: ${error.message}`);
        }
    }
    
    // Ver estado de la mesa
    if (command === 'pokerstatus') {
        const gameId = global.db.data.chats[chatId].pokerGame;
        const game = gameManager.getGame(gameId);
        
        if (!game) {
            return m.reply('❌ No hay mesa activa.');
        }
        
        return conn.reply(m.chat, game.renderTable(), m);
    }
    
    // Abandonar mesa
    if (command === 'pokerleave') {
        const gameId = global.db.data.chats[chatId].pokerGame;
        const game = gameManager.getGame(gameId);
        
        if (!game) {
            return m.reply('❌ No hay mesa activa.');
        }
        
        if (game.isStarted) {
            return m.reply('❌ No puedes salir mientras la partida está en curso.');
        }
        
        try {
            const player = game.removePlayer(userId);
            
            // Devolver dinero
            global.db.data.users[userId].money += player.chips;
            
            return m.reply(`✅ Saliste de la mesa. Dinero devuelto: $${player.chips}`);
            
        } catch (error) {
            return m.reply(`❌ Error: ${error.message}`);
        }
    }
};

handler.help = [
    'poker', 'pokerjoin', 'pokerbegin',
    'pokercall', 'pokerraise', 'pokerfold',
    'pokercheck', 'pokerallin', 'pokerstatus', 'pokerleave'
];
handler.tags = ['game'];
handler.command = /^(poker|pokerjoin|pokerbegin|pokercall|pokerraise|pokerfold|pokercheck|pokerallin|pokerstatus|pokerleave)$/i;
handler.group = true;

export default handler;
