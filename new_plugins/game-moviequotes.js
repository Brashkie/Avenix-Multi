/**
 * Plugin: Movie Quotes Game
 * Archivo: plugins/game-moviequotes.js
 * Sistema de juego "Adivina la Película"
 */

import { gameManager, globalStats, addCustomQuote, getCategories, getGlobalStats } from '../lib/movie-quotes.js';

// ═══════════════════════════════════════════════════════════════════════════════
// │                      COMANDO PRINCIPAL                                      │
// ═══════════════════════════════════════════════════════════════════════════════

let handler = async (m, { conn, command, text, usedPrefix }) => {
    const user = global.db.data.users[m.sender];
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      INICIAR JUEGO                                    │
    // ═════════════════════════════════════════════════════════════════════════
    
    if (command === 'moviequote' || command === 'mq') {
        // Verificar si ya tiene un juego activo
        const activeGame = gameManager.getPlayerGame(m.sender);
        
        if (activeGame) {
            return m.reply(`
🎬 *YA TIENES UN JUEGO ACTIVO* 🎬

📊 *Estado:*
• Intentos: ${activeGame.attempts}/${activeGame.options.maxAttempts}
• Pistas usadas: ${activeGame.hintsUsed}
• Tiempo restante: ${Math.floor(activeGame.getGameInfo().timeLeft)}s

*Comandos:*
• *${usedPrefix}mqguess [respuesta]* - Adivinar
• *${usedPrefix}mqhint* - Pedir pista (-100 pts)
• *${usedPrefix}mqsurrender* - Rendirse
            `.trim());
        }
        
        // Parsear opciones
        const args = text.trim().split(' ');
        const difficulty = args[0]?.toLowerCase() || 'medium';
        const category = args[1]?.toLowerCase() || 'all';
        
        // Validar dificultad
        const validDifficulties = ['easy', 'medium', 'hard', 'expert'];
        if (!validDifficulties.includes(difficulty)) {
            return m.reply(`
❌ *DIFICULTAD INVÁLIDA* ❌

*Dificultades disponibles:*
• 🟢 *easy* - 100 pts base
• 🟡 *medium* - 200 pts base
• 🔴 *hard* - 500 pts base
• ⚫ *expert* - 1000 pts base

*Uso:* ${usedPrefix}mq [dificultad] [categoría]
*Ejemplo:* ${usedPrefix}mq medium action
            `.trim());
        }
        
        // Crear juego
        const game = gameManager.createGame(m.sender, {
            difficulty,
            category,
            maxAttempts: 3,
            timeLimit: 120
        });
        
        const result = game.start();
        
        if (!result.success) {
            return m.reply(`❌ Error: ${result.message}`);
        }
        
        // Enviar cita
        return m.reply(`
🎬 *ADIVINA LA PELÍCULA* 🎬

*Cita:*
"_${result.quote}_"

📊 *Información:*
• Dificultad: ${difficulty.toUpperCase()}
• Intentos: ${result.maxAttempts}
• Tiempo límite: ${result.timeLimit}s
• Puntos base: ${game.getBasePoints()}

*¿De qué película es esta cita?*

*Comandos:*
• *${usedPrefix}mqguess [título]* - Adivinar
• *${usedPrefix}mqhint* - Pista (-100 pts)
• *${usedPrefix}mqsurrender* - Rendirse

🎯 *¡Buena suerte!*
        `.trim());
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      ADIVINAR                                         │
    // ═════════════════════════════════════════════════════════════════════════
    
    if (command === 'mqguess') {
        const game = gameManager.getPlayerGame(m.sender);
        
        if (!game) {
            return m.reply(`
❌ No tienes un juego activo.

*Inicia uno con:* ${usedPrefix}mq [dificultad]
*Ejemplo:* ${usedPrefix}mq medium
            `.trim());
        }
        
        if (!text) {
            return m.reply('❌ Debes escribir el título de la película.');
        }
        
        const result = game.guess(text);
        
        if (result.gameOver) {
            // Actualizar dinero y XP del usuario
            if (result.won) {
                user.money += result.points;
                user.exp += result.points;
                
                return m.reply(`
🏆 *¡CORRECTO!* 🏆

*${result.correctAnswer}*

📊 *Resultados:*
• Puntos ganados: +${result.points}
• Tiempo: ${result.duration}s
• Intentos: ${result.attempts}/${game.options.maxAttempts}
• Pistas usadas: ${result.hintsUsed}

💰 *Money:* $${user.money.toLocaleString()}
⭐ *XP:* ${user.exp.toLocaleString()}

*Información de la película:*
🎬 Título: ${result.movieInfo.title}
📅 Año: ${result.movieInfo.year}
🎭 Género: ${result.movieInfo.genre.join(', ')}
⭐ Rating: ${result.movieInfo.rating}/10

*Juega de nuevo:* ${usedPrefix}mq
                `.trim());
            } else {
                return m.reply(`
😔 *INCORRECTO* 😔

*Respuesta correcta:*
"${result.correctAnswer}"

*Información de la película:*
🎬 Título: ${result.movieInfo.title}
📅 Año: ${result.movieInfo.year}
🎭 Género: ${result.movieInfo.genre.join(', ')}
⭐ Rating: ${result.movieInfo.rating}/10

*Intenta de nuevo:* ${usedPrefix}mq
                `.trim());
            }
        }
        
        // Respuesta incorrecta pero aún hay intentos
        return m.reply(`
${result.message}

${result.hint || ''}

*Usa:* ${usedPrefix}mqguess [título]
        `.trim());
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      PISTA                                            │
    // ═════════════════════════════════════════════════════════════════════════
    
    if (command === 'mqhint') {
        const game = gameManager.getPlayerGame(m.sender);
        
        if (!game) {
            return m.reply(`❌ No tienes un juego activo.`);
        }
        
        const result = game.getHint();
        
        if (!result.success) {
            return m.reply(`❌ ${result.message}`);
        }
        
        return m.reply(`
💡 *PISTA* 💡

${result.hint}

⚠️ Penalización: -${result.penalty} puntos
📊 Pistas usadas: ${result.hintsUsed}

*Adivina:* ${usedPrefix}mqguess [título]
        `.trim());
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      RENDIRSE                                         │
    // ═════════════════════════════════════════════════════════════════════════
    
    if (command === 'mqsurrender') {
        const game = gameManager.getPlayerGame(m.sender);
        
        if (!game) {
            return m.reply(`❌ No tienes un juego activo.`);
        }
        
        const result = game.surrender();
        
        return m.reply(`
🏳️ *TE HAS RENDIDO* 🏳️

*La respuesta era:*
"${result.correctAnswer}"

*Información:*
🎬 ${result.movieInfo.title}
📅 ${result.movieInfo.year}
🎭 ${result.movieInfo.genre.join(', ')}
⭐ ${result.movieInfo.rating}/10

*Intenta de nuevo:* ${usedPrefix}mq
        `.trim());
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      ESTADÍSTICAS                                     │
    // ═════════════════════════════════════════════════════════════════════════
    
    if (command === 'mqstats') {
        const stats = globalStats.getPlayerStats(m.sender);
        
        return m.reply(`
📊 *TUS ESTADÍSTICAS* 📊

🎮 *Partidas:*
• Jugadas: ${stats.gamesPlayed}
• Ganadas: ${stats.correctGuesses}
• Perdidas: ${stats.wrongGuesses}
• Precisión: ${stats.accuracy}

⭐ *Puntuación:*
• Puntos totales: ${stats.totalPoints.toLocaleString()}
• Mejor racha: ${stats.bestStreak}
• Racha actual: ${stats.currentStreak}

⏱️ *Tiempos:*
• Más rápido: ${stats.fastestGuess}
• Promedio: ${stats.averageTime}

💡 *Otros:*
• Pistas usadas: ${stats.hintsUsed}

📈 *Por dificultad:*
${Object.entries(stats.difficulty).map(([diff, d]) => 
    `• ${diff}: ${d.correct}/${d.played} (${d.played > 0 ? (d.correct/d.played*100).toFixed(1) : 0}%)`
).join('\n')}
        `.trim());
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      RANKING                                          │
    // ═════════════════════════════════════════════════════════════════════════
    
    if (command === 'mqrank') {
        const leaderboard = globalStats.getLeaderboard(10);
        
        if (leaderboard.length === 0) {
            return m.reply('📊 Aún no hay jugadores en el ranking.');
        }
        
        let message = '🏆 *RANKING - TOP 10* 🏆\n\n';
        
        for (let i = 0; i < leaderboard.length; i++) {
            const player = leaderboard[i];
            const medal = ['🥇', '🥈', '🥉'][i] || `${i + 1}.`;
            const name = await conn.getName(player.id);
            
            message += `${medal} *${name}*\n`;
            message += `   💰 ${player.points.toLocaleString()} pts\n`;
            message += `   📊 ${player.accuracy}% | 🔥 ${player.streak}\n\n`;
        }
        
        message += `_Total jugadores: ${globalStats.players.size}_`;
        
        return m.reply(message);
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      CATEGORÍAS                                       │
    // ═════════════════════════════════════════════════════════════════════════
    
    if (command === 'mqcategories') {
        const categories = getCategories();
        const globalInfo = getGlobalStats();
        
        return m.reply(`
📂 *CATEGORÍAS DISPONIBLES* 📂

${categories.map(cat => `• ${cat}`).join('\n')}

📊 *Estadísticas globales:*
• Total citas: ${globalInfo.totalQuotes}
• Total jugadores: ${globalInfo.totalPlayers}
• Partidas jugadas: ${globalInfo.totalGames}

*Uso:* ${usedPrefix}mq [dificultad] [categoría]
*Ejemplo:* ${usedPrefix}mq medium action
        `.trim());
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      AYUDA                                            │
    // ═════════════════════════════════════════════════════════════════════════
    
    if (command === 'mqhelp') {
        return m.reply(`
🎬 *MOVIE QUOTES - AYUDA* 🎬

*¿Cómo jugar?*
1. Inicia un juego: *${usedPrefix}mq [dificultad]*
2. Lee la cita de la película
3. Adivina: *${usedPrefix}mqguess [título]*
4. Si no sabes: *${usedPrefix}mqhint*

*Comandos disponibles:*
• *${usedPrefix}mq* - Iniciar juego
• *${usedPrefix}mqguess* - Adivinar
• *${usedPrefix}mqhint* - Pedir pista
• *${usedPrefix}mqsurrender* - Rendirse
• *${usedPrefix}mqstats* - Tus estadísticas
• *${usedPrefix}mqrank* - Ver ranking
• *${usedPrefix}mqcategories* - Ver categorías

*Dificultades:*
🟢 *easy* - 100 pts | 5 intentos
🟡 *medium* - 200 pts | 3 intentos
🔴 *hard* - 500 pts | 2 intentos
⚫ *expert* - 1000 pts | 1 intento

*Sistema de puntos:*
• Puntos base según dificultad
• -100 pts por pista
• +10 pts/seg por velocidad
• +50 pts por intento no usado

*¡Diviértete!* 🎉
        `.trim());
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// │                      CONFIGURACIÓN DEL HANDLER                              │
// ═══════════════════════════════════════════════════════════════════════════════

handler.help = [
    'moviequote',
    'mqguess',
    'mqhint',
    'mqstats',
    'mqrank'
];

handler.tags = ['game'];

handler.command = /^(moviequote|mq|mqguess|mqhint|mqsurrender|mqstats|mqrank|mqcategories|mqhelp)$/i;

handler.group = false; // Funciona en privado y grupos
handler.register = true; // Requiere registro

export default handler;
