// plugins/game-tournament.js

import { tournamentManager, TournamentFormat } from '../lib/tournament-manager.js';
import type { PluginHandler } from '../types/index.js'

const handler: PluginHandler = async (m, { conn, text, command, usedPrefix, args }) => {
    const chatId = m.chat;
    const senderId = m.sender;
    const senderName = await conn.getName(senderId);
    
    // ═══════════════════════════════════════════════════════════════════
    // │                    CREAR TORNEO                                 │
    // ═══════════════════════════════════════════════════════════════════
    
    if (command === 'tournament' || command === 'torneo') {
        if (!text) {
            return m.reply(`
🏆 *SISTEMA DE TORNEOS* 🏆

*Crear torneo:*
${usedPrefix}torneo crear <nombre>

*Unirse:*
${usedPrefix}torneo join <id>

*Ver torneos:*
${usedPrefix}torneo list

*Info de torneo:*
${usedPrefix}torneo info <id>

*Check-in:*
${usedPrefix}torneo checkin <id>

*Reportar:*
${usedPrefix}torneo report <match-id> <ganador>

*Brackets:*
${usedPrefix}torneo bracket <id>
            `.trim());
        }
        
        const [subcommand, ...subargs] = text.split(' ');
        
        // CREAR TORNEO
        if (subcommand === 'crear' || subcommand === 'create') {
            const tournamentName = subargs.join(' ') || `Torneo ${Date.now()}`;
            
            try {
                const tournament = tournamentManager.createTournament({
                    name: tournamentName,
                    format: TournamentFormat.SINGLE_ELIMINATION,
                    game: 'tictactoe',
                    creatorId: senderId,
                    minPlayers: 2,
                    maxPlayers: 16,
                    prizePool: 100,
                    isPublic: true,
                    requireCheckIn: true
                });
                
                // Guardar ID en el chat
                if (!global.db.data.chats[chatId].tournaments) {
                    global.db.data.chats[chatId].tournaments = [];
                }
                global.db.data.chats[chatId].tournaments.push(tournament.id);
                
                return m.reply(`
🏆 *TORNEO CREADO* 🏆

*ID:* \`${tournament.id}\`
*Nombre:* ${tournament.name}
*Formato:* Eliminación Simple
*Jugadores:* 0/${tournament.config.maxPlayers}
*Premio:* $${tournament.prizePool}

*Para unirse:*
${usedPrefix}torneo join ${tournament.id}

*Cierra inscripciones:*
${usedPrefix}torneo start ${tournament.id}
                `.trim());
                
            } catch (error) {
                return m.reply(`❌ Error al crear torneo: ${error.message}`);
            }
        }
        
        // UNIRSE A TORNEO
        if (subcommand === 'join' || subcommand === 'unirse') {
            const tournamentId = subargs[0];
            
            if (!tournamentId) {
                return m.reply('❌ Debes especificar el ID del torneo');
            }
            
            const tournament = tournamentManager.getTournament(tournamentId);
            
            if (!tournament) {
                return m.reply('❌ Torneo no encontrado');
            }
            
            const result = tournament.register(senderId, senderName);
            
            if (result.success) {
                const remaining = tournament.config.maxPlayers - tournament.participants.size;
                
                return m.reply(`
✅ *¡INSCRITO!* ✅

*Torneo:* ${tournament.name}
*Jugador:* ${senderName}
*Posición:* #${tournament.participants.size}

📊 *Inscritos:* ${tournament.participants.size}/${tournament.config.maxPlayers}
⏳ *Lugares restantes:* ${remaining}

${remaining === 0 ? '🔥 *¡TORNEO LLENO!* 🔥' : ''}
                `.trim());
            } else {
                return m.reply(`❌ ${result.message}`);
            }
        }
        
        // LISTA DE TORNEOS
        if (subcommand === 'list' || subcommand === 'lista') {
            const tournaments = tournamentManager.getPublicTournaments();
            
            if (tournaments.length === 0) {
                return m.reply('📋 No hay torneos activos');
            }
            
            let msg = '🏆 *TORNEOS ACTIVOS* 🏆\n\n';
            
            tournaments.forEach((t, i) => {
                msg += `${i + 1}. *${t.name}*\n`;
                msg += `   ID: \`${t.id}\`\n`;
                msg += `   Estado: ${t.status}\n`;
                msg += `   Jugadores: ${t.participants.size}/${t.config.maxPlayers}\n`;
                msg += `   Premio: $${t.prizePool}\n\n`;
            });
            
            msg += `Para unirte: ${usedPrefix}torneo join <id>`;
            
            return m.reply(msg);
        }
        
        // INFO DE TORNEO
        if (subcommand === 'info') {
            const tournamentId = subargs[0];
            const tournament = tournamentManager.getTournament(tournamentId);
            
            if (!tournament) {
                return m.reply('❌ Torneo no encontrado');
            }
            
            const info = tournament.getInfo();
            
            return m.reply(`
🏆 *${info.name}* 🏆

*ID:* \`${info.id}\`
*Estado:* ${info.status}
*Formato:* ${info.format}
*Jugadores:* ${info.participants}/${info.maxPlayers}
*Ronda Actual:* ${info.currentRound}/${info.totalRounds}
*Premio:* $${info.prizePool}

${info.status === 'registration' ? `Para unirte: ${usedPrefix}torneo join ${info.id}` : ''}
            `.trim());
        }
        
        // CHECK-IN
        if (subcommand === 'checkin') {
            const tournamentId = subargs[0];
            const tournament = tournamentManager.getTournament(tournamentId);
            
            if (!tournament) {
                return m.reply('❌ Torneo no encontrado');
            }
            
            const result = tournament.checkIn(senderId);
            
            if (result.success) {
                const checkedIn = Array.from(tournament.participants.values() as Iterable<any>)
                    .filter(p => p.status === 'checked_in').length;
                
                return m.reply(`
✅ *CHECK-IN REALIZADO* ✅

*Torneo:* ${tournament.name}
*Jugador:* ${senderName}

📊 Check-in: ${checkedIn}/${tournament.participants.size}
⏰ Esperando a los demás...
                `.trim());
            } else {
                return m.reply(`❌ ${result.message}`);
            }
        }
        
        // INICIAR TORNEO (Solo creador)
        if (subcommand === 'start' || subcommand === 'iniciar') {
            const tournamentId = subargs[0];
            const tournament = tournamentManager.getTournament(tournamentId);
            
            if (!tournament) {
                return m.reply('❌ Torneo no encontrado');
            }
            
            if (tournament.creatorId !== senderId) {
                return m.reply('❌ Solo el creador puede iniciar el torneo');
            }
            
            const result = tournament.closeRegistration();
            
            if (result.success) {
                if (result.status === 'check_in') {
                    return m.reply(`
📋 *CHECK-IN INICIADO* 📋

*Torneo:* ${tournament.name}
*Tiempo:* 5 minutos

Todos los inscritos deben hacer:
${usedPrefix}torneo checkin ${tournament.id}

⏰ El torneo iniciará automáticamente
                    `.trim());
                }
            } else {
                return m.reply(`❌ ${result.message}`);
            }
        }
        
        // VER BRACKETS
        if (subcommand === 'bracket' || subcommand === 'brackets') {
            const tournamentId = subargs[0];
            const tournament = tournamentManager.getTournament(tournamentId);
            
            if (!tournament) {
                return m.reply('❌ Torneo no encontrado');
            }
            
            const bracket = tournament.getBracketVisualization();
            
            return m.reply(`\`\`\`\n${bracket}\n\`\`\``);
        }
        
        // VER PARTIDAS
        if (subcommand === 'matches' || subcommand === 'partidas') {
            const tournamentId = subargs[0];
            const tournament = tournamentManager.getTournament(tournamentId);
            
            if (!tournament) {
                return m.reply('❌ Torneo no encontrado');
            }
            
            const matches = tournament.getCurrentMatches();
            
            if (matches.length === 0) {
                return m.reply('⏰ No hay partidas activas');
            }
            
            let msg = `⚔️ *PARTIDAS ACTIVAS* ⚔️\n\n`;
            
            matches.forEach((match, i) => {
                msg += `${i + 1}. \`${match.id}\`\n`;
                msg += `   ${match.participant1?.name || 'TBD'}\n`;
                msg += `   vs\n`;
                msg += `   ${match.participant2?.name || 'TBD'}\n\n`;
            });
            
            msg += `Para reportar: ${usedPrefix}torneo report <match-id>`;
            
            return m.reply(msg);
        }
        
        // REPORTAR RESULTADO
        if (subcommand === 'report' || subcommand === 'reportar') {
            const matchId = subargs[0];
            
            if (!matchId) {
                return m.reply('❌ Debes especificar el ID de la partida');
            }
            
            // Buscar torneo que contenga este match
            let tournament: any = null;
            for (const t of tournamentManager.getActiveTournaments()) {
                if (t.matches.has(matchId)) {
                    tournament = t;
                    break;
                }
            }
            
            if (!tournament) {
                return m.reply('❌ Partida no encontrada');
            }
            
            const match = tournament.matches.get(matchId);
            
            // Verificar que el jugador sea participante
            if (match.participant1.id !== senderId && match.participant2.id !== senderId) {
                return m.reply('❌ No eres participante de esta partida');
            }
            
            // Reportar victoria del jugador
            const result = tournament.reportMatchResult(
                matchId,
                senderId,
                null,
                senderId
            );
            
            if (result.success) {
                return m.reply(`
🏆 *RESULTADO REPORTADO* 🏆

*Ganador:* ${result.winner.name}
*Partida:* ${matchId}

${tournament.status === 'completed' ? 
    `🎉 *¡TORNEO COMPLETADO!*\n\nVer ganadores: ${usedPrefix}torneo winners ${tournament.id}` :
    `⏰ Esperando más resultados...`}
                `.trim());
            } else {
                return m.reply(`❌ ${result.message}`);
            }
        }
        
        // VER GANADORES
        if (subcommand === 'winners' || subcommand === 'ganadores') {
            const tournamentId = subargs[0];
            const tournament = tournamentManager.getTournament(tournamentId);
            
            if (!tournament || tournament.status !== 'completed') {
                return m.reply('❌ Torneo no completado');
            }
            
            const ranking = tournament.finalRanking;
            
            let msg = `🏆 *GANADORES: ${tournament.name}* 🏆\n\n`;
            
            ranking.slice(0, 3).forEach((entry, i) => {
                const medals = ['🥇', '🥈', '🥉'];
                msg += `${medals[i]} *${entry.position}. ${entry.participant.name}*\n`;
                msg += `   Partidas: ${entry.stats.matchesPlayed}\n`;
                msg += `   Victorias: ${entry.stats.wins}\n`;
                msg += `   Puntos: ${entry.stats.points}\n`;
                if (entry.prize > 0) {
                    msg += `   Premio: $${entry.prize}\n`;
                }
                msg += `\n`;
            });
            
            return m.reply(msg);
        }
    }
};

handler.help = ['tournament', 'torneo'];
handler.tags = ['game'];
handler.command = /^(tournament|torneo)$/i;
handler.group = true;

export default handler;
