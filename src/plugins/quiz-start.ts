// En tu plugin (e.g., plugins/quiz-start.js)
import QuizSession, { playerStats, sessionManager } from '../lib/coding-quiz.js';
import type { PluginHandler } from '../types/index.js'

const handler: PluginHandler = async (m, { conn, text, command }) => {
    const userId = m.sender;
    
    if (command === 'quiz') {
        // Verificar sesión activa
        let session = sessionManager.getPlayerSession(userId);
        
        if (session) {
            return m.reply('❌ Ya tienes un quiz activo. Usa *.quizanswer* para responder.');
        }
        
        // Parsear opciones
        const args = text.split(' ');
        const language = args[0] || 'javascript';
        const difficulty = args[1] || 'junior';
        
        // Crear sesión
        session = sessionManager.createSession(userId, {
            mode: 'practice',
            language,
            difficulty,
            questionCount: 10
        });
        
        const start = session.start();
        
        if (!start.success) {
            return m.reply(`❌ ${start.message}`);
        }
        
        // Mostrar primera pregunta
        const q = start.firstQuestion;
        
        let message = `
🎯 *CODING QUIZ* 🎯

*Pregunta ${q.questionNumber}/${q.totalQuestions}*
📚 *Categoría:* ${q.category}
⭐ *Dificultad:* ${q.difficulty}
⏰ *Tiempo:* ${q.timeLimit/1000}s
❤️ *Vidas:* ${q.lives}
🔥 *Racha:* ${q.streak}
💯 *Puntos:* ${q.score}

*${q.question}*

${q.options.map((opt, i) => opt ? `${i + 1}. ${opt}` : '').filter(Boolean).join('\n')}

*Responde con:* .qa [1-4]
*Ejemplo:* .qa 1

💡 *Pistas disponibles:* ${q.hintsAvailable}
⚡ *Power-ups:* .qpowerup [tipo]
        `.trim();
        
        return conn.reply(m.chat, message, m);
    }
    
    if (command === 'qa' || command === 'quizanswer') {
        const session = sessionManager.getPlayerSession(userId);
        
        if (!session) {
            return m.reply('❌ No tienes quiz activo. Usa *.quiz* para empezar.');
        }
        
        const answer = parseInt(text) - 1; // 1-4 a 0-3
        
        if (isNaN(answer) || answer < 0 || answer > 3) {
            return m.reply('❌ Respuesta inválida. Usa números del 1 al 4.');
        }
        
        const result = session.answer(answer);
        
        let message = result.isCorrect 
            ? `✅ *¡CORRECTO!* ✅\n\n` 
            : `❌ *INCORRECTO* ❌\n\n`;
        
        message += `*Respuesta correcta:* ${result.correctOption}\n`;
        message += `*Explicación:* ${result.explanation}\n\n`;
        message += `⏱️ *Tiempo:* ${result.timeSpent}s\n`;
        message += `💯 *Puntos:* +${result.points}\n`;
        message += `🔥 *Racha:* ${result.streak}\n`;
        message += `❤️ *Vidas:* ${result.lives}\n`;
        message += `📊 *Total:* ${result.score} pts\n\n`;
        
        if (result.gameOver) {
            const summary = result.summary;
            message += `
🏁 *¡QUIZ COMPLETADO!* 🏁

📋 *Resultados:*
✅ Correctas: ${summary.correctAnswers}
❌ Incorrectas: ${summary.wrongAnswers}
🎯 Precisión: ${summary.accuracy}
💯 Puntuación Final: ${summary.finalScore}
🔥 Mejor Racha: ${summary.bestStreak}
⏱️ Tiempo Total: ${summary.duration}s

📊 *Tu Rating:* ${summary.playerRating} ELO
🏆 *Rank:* ${summary.playerRank}

${summary.newCertificates.length > 0 
    ? `🎓 *¡NUEVO CERTIFICADO!* ${summary.newCertificates.join(', ')}\n\n` 
    : ''}
*Usa .quiz para jugar de nuevo!*
            `.trim();
            
            // Limpiar sesión
            sessionManager.deleteSession(session.id);
            
        } else {
            // Siguiente pregunta
            const q = result.nextQuestion;
            message += `
*Pregunta ${q.questionNumber}/${q.totalQuestions}*
📚 *Categoría:* ${q.category}
⏰ *Tiempo:* ${q.timeLimit/1000}s

*${q.question}*

${q.options.map((opt, i) => opt ? `${i + 1}. ${opt}` : '').filter(Boolean).join('\n')}

*Responde con:* .qa [1-4]
            `.trim();
        }
        
        return conn.reply(m.chat, message, m);
    }
    
    if (command === 'qhint') {
        const session = sessionManager.getPlayerSession(userId);
        
        if (!session) {
            return m.reply('❌ No tienes quiz activo.');
        }
        
        const hint = session.getHint();
        
        if (!hint.success) {
            return m.reply(`❌ ${hint.message}`);
        }
        
        return m.reply(`
💡 *PISTA* 💡

${hint.hint}

⚠️ *Penalización:* ${hint.penalty * 100}% puntos
💡 *Pistas restantes:* ${hint.hintsRemaining}
        `.trim());
    }
    
    if (command === 'qstats') {
        const stats = playerStats.getPlayerStats(userId);
        
        return m.reply(`
📊 *TUS ESTADÍSTICAS* 📊

*General:*
📝 Preguntas: ${stats.totalQuestions}
✅ Correctas: ${stats.correctAnswers}
❌ Incorrectas: ${stats.wrongAnswers}
🎯 Precisión: ${stats.accuracy}%

*Puntuación:*
💯 Puntos Totales: ${stats.totalPoints}
📊 Rating ELO: ${stats.rating}
🏆 Rank: ${QuizSession.calculateRank(stats.rating)}

*Rachas:*
🔥 Actual: ${stats.currentStreak}
⭐ Mejor: ${stats.bestStreak}

*Tiempo:*
⏱️ Promedio: ${Math.round(stats.averageTime/1000)}s
⚡ Más Rápido: ${stats.fastestAnswer === Infinity ? 'N/A' : Math.round(stats.fastestAnswer/1000)}s

*Certificados:* ${stats.certificates.length > 0 ? stats.certificates.join(', ') : 'Ninguno aún'}

*Fortalezas:*
${stats.strengths.map(s => `✅ ${s.name}: ${s.accuracy.toFixed(0)}%`).join('\n') || 'Continúa practicando'}

*Áreas de mejora:*
${stats.weaknesses.map(w => `⚠️ ${w.name}: ${w.accuracy.toFixed(0)}%`).join('\n') || '¡Excelente!'}
        `.trim());
    }
};

handler.help = ['quiz', 'qa', 'qhint', 'qstats'];
handler.tags = ['game'];
handler.command = /^(quiz|qa|quizanswer|qhint|qstats)$/i;

export default handler;
