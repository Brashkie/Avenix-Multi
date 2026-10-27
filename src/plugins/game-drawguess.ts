// plugin: drawguess.js
import { gameManager, WordGenerator, DRAWING_EMOJIS } from '../lib/draw-guess.js';
import type { PluginHandler } from '../types/index.js'

const handler: PluginHandler = async (m, { conn, text, command, usedPrefix, participants }) => {
    const chatId = m.chat;
    const userId = m.sender;
    const userName = await conn.getName(userId);
    
    // ═══════════════════════════════════════════════════════════════════════
    // │                      CREAR JUEGO                                    │
    // ═══════════════════════════════════════════════════════════════════════
    
    if (command === 'drawguess' || command === 'dibujadivina') {
        const game = gameManager.getGame(chatId);
        
        if (game && !game.isFinished) {
            return m.reply('❌ Ya hay un juego activo. Usa *.drawjoin* para unirte.');
        }
        
        // Parsear opciones
        const args = text.split(' ');
        const rounds = parseInt(args[0]) || 5;
        const difficulty = args[1] || 'medio';
        const category = args[2] || null;
        
        try {
            const newGame = gameManager.createGame(chatId, {
                maxRounds: rounds,
                difficulty,
                category
            });
            
            return m.reply(`
🎨 *DIBUJA Y ADIVINA* 🎨

*Configuración:*
- Rondas: ${rounds}
- Dificultad: ${difficulty}
- Categoría: ${category || 'Todas'}

*¿Cómo jugar?*
1. Únete: ${usedPrefix}drawjoin
2. Inicia: ${usedPrefix}drawstart
3. Dibuja con emojis cuando sea tu turno
4. Adivina la palabra de otros

*Comandos:*
- ${usedPrefix}drawjoin - Unirse
- ${usedPrefix}drawstart - Iniciar
- ${usedPrefix}drawhint - Pedir pista
- ${usedPrefix}drawstatus - Ver estado

*Emojis disponibles:*
${usedPrefix}drawemojis

⏳ Esperando jugadores...
            `.trim());
            
        } catch (error) {
            return m.reply(`❌ Error: ${error.message}`);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // │                      UNIRSE AL JUEGO                                │
    // ═══════════════════════════════════════════════════════════════════════
    
    if (command === 'drawjoin') {
        const game = gameManager.getGame(chatId);
        
        if (!game) {
            return m.reply(`❌ No hay juego activo. Crea uno con ${usedPrefix}drawguess`);
        }
        
        if (game.isStarted) {
            return m.reply('❌ El juego ya comenzó.');
        }
        
        try {
            game.addPlayer(userId, userName);
            
            return m.reply(`
✅ *${userName}* se unió al juego!

👥 Jugadores: ${game.players.size}

${game.players.size >= 2 ? `\n🎲 Usa *${usedPrefix}drawstart* para iniciar` : '⏳ Se necesitan al menos 2 jugadores...'}
            `.trim());
            
        } catch (error) {
            return m.reply(`❌ ${error.message}`);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // │                      INICIAR JUEGO                                  │
    // ═══════════════════════════════════════════════════════════════════════
    
    if (command === 'drawstart') {
        const game = gameManager.getGame(chatId);
        
        if (!game) {
            return m.reply('❌ No hay juego activo.');
        }
        
        if (game.isStarted) {
            return m.reply('❌ El juego ya comenzó.');
        }
        
        try {
            const round = game.start();
            
            // Mensaje para el dibujante (privado)
            const drawerMsg = `
🎨 *¡ES TU TURNO DE DIBUJAR!* 🎨

📝 *Palabra:* ||${round.word}||
📁 *Categoría:* ${round.category}
⭐ *Dificultad:* ${round.difficulty}

*Instrucciones:*
1. Dibuja usando emojis
2. Envía tu dibujo al grupo
3. Los demás intentarán adivinar
4. Usa: ${usedPrefix}drawsend [tu dibujo]

*Emojis útiles:*
⬛⬜🟥🟦🟨🟩🟪🟫
😀😁😂🤣😊😎🤔
👍👎👌✌️🤞👈👉
❤️🧡💛💚💙💜🖤

⏰ Tienes 90 segundos para dibujar
            `.trim();
            
            await conn.sendMessage(round.drawer.id, { text: drawerMsg });
            
            // Mensaje al grupo
            return m.reply(`
🎲 *RONDA ${game.roundNumber}/${game.maxRounds}*

🎨 *Dibujante:* ${round.drawer.name}
📁 *Categoría:* ${round.category}
⭐ *Dificultad:* ${round.difficulty}

⏳ ${round.drawer.name} está dibujando...

💡 Cuando veas el dibujo, escribe tu respuesta directamente en el chat.
            `.trim());
            
        } catch (error) {
            return m.reply(`❌ ${error.message}`);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // │                      ENVIAR DIBUJO                                  │
    // ═══════════════════════════════════════════════════════════════════════
    
    if (command === 'drawsend') {
        const game = gameManager.getGame(chatId);
        
        if (!game || !game.isStarted) {
            return m.reply('❌ No hay juego activo.');
        }
        
        if (!text) {
            return m.reply(`❌ Uso: ${usedPrefix}drawsend [tu dibujo con emojis]`);
        }
        
        try {
            game.submitDrawing(userId, text);
            
            return conn.reply(m.chat, `
🎨 *ADIVINA LA PALABRA* 🎨

${text}

📁 *Categoría:* ${game.currentRound.category}
⭐ *Dificultad:* ${game.currentRound.difficulty}

💬 Escribe tu respuesta en el chat
💡 Pista: ${usedPrefix}drawhint

⏰ Tienes 60 segundos
            `.trim(), m);
            
        } catch (error) {
            return m.reply(`❌ ${error.message}`);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // │                      ADIVINAR (AUTOMÁTICO)                          │
    // ═══════════════════════════════════════════════════════════════════════
    
    // Este no es un comando, se activa automáticamente
    if (m.text && !m.text.startsWith(usedPrefix)) {
        const game = gameManager.getGame(chatId);
        
        if (game && game.isStarted && game.currentRound && game.currentRound.drawing) {
            try {
                const result = game.submitGuess(userId, m.text);
                
                if (result.isCorrect) {
                    let message = `
✅ *¡${userName} ADIVINÓ!* ✅

🎯 Palabra: *${game.currentRound.word}*
💰 Puntos: +${result.points}
                    `.trim();
                    
                    if (result.streakBonus > 0) {
                        message += `\n🔥 Racha: +${result.streakBonus}`;
                    }
                    
                    const player = game.getPlayer(userId);
                    message += `\n📊 Total: ${player.score} puntos`;
                    
                    return m.reply(message);
                }
                
            } catch (error) {
                // Silencioso, no mostrar errores en cada mensaje
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // │                      PEDIR PISTA                                    │
    // ═══════════════════════════════════════════════════════════════════════
    
    if (command === 'drawhint' || command === 'drawpista') {
        const game = gameManager.getGame(chatId);
        
        if (!game || !game.isStarted) {
            return m.reply('❌ No hay juego activo.');
        }
        
        if (!game.currentRound || !game.currentRound.drawing) {
            return m.reply('❌ Aún no se ha enviado el dibujo.');
        }
        
        try {
            const hint = game.requestHint();
            return m.reply(`💡 *PISTA ${game.currentRound.hintsGiven}/${3}*\n\n${hint}\n\n⚠️ Penalización: -10 puntos`);
            
        } catch (error) {
            return m.reply(`❌ ${error.message}`);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // │                      VER ESTADO                                     │
    // ═══════════════════════════════════════════════════════════════════════
    
    if (command === 'drawstatus') {
        const game = gameManager.getGame(chatId);
        
        if (!game) {
            return m.reply('❌ No hay juego activo.');
        }
        
        const state = game.getState();
        
        let message = `📊 *ESTADO DEL JUEGO*\n\n`;
        
        message += `🎲 Ronda: ${state.roundNumber}/${state.maxRounds}\n`;
        message += `⭐ Dificultad: ${state.difficulty}\n`;
        message += `📁 Categoría: ${state.category || 'Todas'}\n\n`;
        
        message += `👥 *JUGADORES* (${state.players.length}):\n`;
        state.players.forEach((p, i) => {
            message += `${i + 1}. ${p.name}: ${p.score} pts`;
            if (p.streak > 0) message += ` 🔥${p.streak}`;
            message += '\n';
        });
        
        if (state.currentRound) {
            message += `\n🎨 Dibujante actual: ${state.currentRound.drawer}\n`;
            message += `📝 Adivinanzas: ${state.currentRound.guesses}\n`;
            message += `✅ Correctas: ${state.currentRound.correctGuesses}\n`;
            message += `💡 Pistas: ${state.currentRound.hintsGiven}/3`;
        }
        
        return m.reply(message);
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // │                      VER RANKING                                    │
    // ═══════════════════════════════════════════════════════════════════════
    
    if (command === 'drawrank' || command === 'drawranking') {
        const game = gameManager.getGame(chatId);
        
        if (!game) {
            return m.reply('❌ No hay juego activo.');
        }
        
        const ranking = game.getRanking();
        
        let message = `🏆 *RANKING* 🏆\n\n`;
        
        ranking.forEach((player, i) => {
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
            message += `${medal} *${player.name}*\n`;
            message += `   💰 ${player.score} puntos\n`;
            message += `   ✅ ${player.stats.correctGuesses}/${player.stats.guessesMade} (${player.stats.accuracy})\n`;
            message += `   🔥 Racha: ${player.stats.streak} | Max: ${player.stats.maxStreak}\n\n`;
        });
        
        return m.reply(message);
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // │                      VER EMOJIS DISPONIBLES                         │
    // ═══════════════════════════════════════════════════════════════════════
    
    if (command === 'drawemojis') {
        let message = `🎨 *EMOJIS PARA DIBUJAR* 🎨\n\n`;
        
        for (const [category, emojis] of Object.entries(DRAWING_EMOJIS)) {
            message += `*${category.toUpperCase()}:*\n`;
            message += emojis.slice(0, 20).join(' ') + '\n\n';
        }
        
        message += `💡 Copia y pega estos emojis para crear tu dibujo`;
        
        return m.reply(message);
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // │                      ABANDONAR JUEGO                                │
    // ═══════════════════════════════════════════════════════════════════════
    
    if (command === 'drawleave') {
        const game = gameManager.getGame(chatId);
        
        if (!game) {
            return m.reply('❌ No hay juego activo.');
        }
        
        try {
            game.removePlayer(userId);
            return m.reply(`👋 ${userName} abandonó el juego.`);
            
        } catch (error) {
            return m.reply(`❌ ${error.message}`);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // │                      TERMINAR JUEGO                                 │
    // ═══════════════════════════════════════════════════════════════════════
    
    if (command === 'drawend') {
        const game = gameManager.getGame(chatId);
        
        if (!game) {
            return m.reply('❌ No hay juego activo.');
        }
        
        // Solo admin o creador puede terminar
        const groupMetadata = await conn.groupMetadata(chatId);
        const isAdmin = groupMetadata.participants.find(p => 
            p.id === userId
        )?.admin;
        
        if (!isAdmin && game.players.values().next().value.id !== userId) {
            return m.reply('❌ Solo admins pueden terminar el juego.');
        }
        
        game.endGame();
        gameManager.deleteGame(chatId);
        
        const ranking = game.getRanking();
        
        let message = `🏁 *JUEGO TERMINADO* 🏁\n\n`;
        message += `🏆 *GANADOR: ${ranking[0].name}* 🏆\n`;
        message += `💰 Puntos: ${ranking[0].score}\n\n`;
        
        message += `📊 *CLASIFICACIÓN:*\n`;
        ranking.slice(0, 5).forEach((p, i) => {
            message += `${i + 1}. ${p.name}: ${p.score} pts\n`;
        });
        
        message += `\n🎮 Juega otra vez: ${usedPrefix}drawguess`;
        
        return m.reply(message);
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // │                      VER CATEGORÍAS                                 │
    // ═══════════════════════════════════════════════════════════════════════
    
    if (command === 'drawcategories' || command === 'drawcats') {
        const categories = WordGenerator.getAllCategories();
        
        let message = `📁 *CATEGORÍAS DISPONIBLES*\n\n`;
        
        categories.forEach(cat => {
            message += `• ${cat}\n`;
        });
        
        message += `\n💡 Uso: ${usedPrefix}drawguess 5 medio animales`;
        
        return m.reply(message);
    }
};

handler.help = [
    'drawguess [rondas] [dificultad] [categoría]',
    'drawjoin', 'drawstart', 'drawsend', 
    'drawhint', 'drawstatus', 'drawrank',
    'drawemojis', 'drawleave', 'drawend', 'drawcats'
];
handler.tags = ['game'];
handler.command = /^(drawguess|dibujadivina|drawjoin|drawstart|drawsend|drawhint|drawpista|drawstatus|drawrank|drawranking|drawemojis|drawleave|drawend|drawcategories|drawcats)$/i;
handler.group = true;

export default handler;
