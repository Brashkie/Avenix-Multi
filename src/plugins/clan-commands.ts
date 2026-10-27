// plugins/clan-commands.js
import { clanManager, CONFIG } from '../lib/clan-system.js';
import type { PluginHandler } from '../types/index.js'

const handler: PluginHandler = async (m, { conn, text, command, usedPrefix }) => {
    const sender = m.sender;
    const user = global.db.data.users[sender];
    
    // ════════════════════════════════════════════════════════════════
    // │                    .clan crear                                │
    // ════════════════════════════════════════════════════════════════
    
    if (command === 'clancreate' || command === 'clancrear') {
        if (!text) {
            return m.reply(`*Uso:* ${usedPrefix}${command} <nombre>|<tag>|<descripción>

*Ejemplo:* ${usedPrefix}${command} Los Guerreros|LG|El mejor clan

💰 *Costo:* $${CONFIG.CLAN_CREATE_COST.toLocaleString()}`);
        }
        
        const [name, tag, description] = text.split('|').map(s => s.trim());
        
        if (!name || !tag) {
            return m.reply('❌ Debes proporcionar nombre y tag');
        }
        
        if (user.money < CONFIG.CLAN_CREATE_COST) {
            return m.reply(`❌ Necesitas $${CONFIG.CLAN_CREATE_COST.toLocaleString()}\nTienes: $${user.money.toLocaleString()}`);
        }
        
        const result = clanManager.createClan({
            name,
            tag: tag.toUpperCase(),
            description: description || 'Sin descripción',
            leader: sender
        });
        
        if (!result.success) {
            return m.reply(`❌ ${result.message}`);
        }
        
        user.money -= CONFIG.CLAN_CREATE_COST;
        
        return m.reply(`✅ *¡CLAN CREADO!* 🏰

*Nombre:* ${result.clan.name}
*Tag:* [${result.clan.tag}]
*Líder:* @${sender.split('@')[0]}
*ID:* ${result.clan.id}

¡Empieza a invitar miembros con *${usedPrefix}claninvite*!`, null, { mentions: [sender] });
    }
    
    // ════════════════════════════════════════════════════════════════
    // │                    .clan info                                 │
    // ════════════════════════════════════════════════════════════════
    
    if (command === 'clan' || command === 'claninfo') {
        let clan;
        
        if (text) {
            // Buscar por tag
            clan = clanManager.getClanByTag(text.toUpperCase());
        } else {
            // Clan del usuario
            clan = clanManager.getUserClan(sender);
        }
        
        if (!clan) {
            return m.reply(`❌ Clan no encontrado

*Buscar clan:* ${usedPrefix}clan <tag>
*Crear clan:* ${usedPrefix}clancreate`);
        }
        
        const info = clan.getInfo();
        const topContributors = clan.getTopContributors(5);
        
        let msg = `╔═══════════════════════════╗
║   🏰 INFORMACIÓN DEL CLAN   ║
╚═══════════════════════════╝

*Nombre:* ${info.name} [${info.tag}]
*Líder:* @${clan.leader.split('@')[0]}

📊 *ESTADÍSTICAS*
├ Nivel: ${info.level} (${info.xp}/${info.xpNeeded} XP)
├ Miembros: ${info.members}/${info.maxMembers}
├ Tesorería: $${info.treasury.toLocaleString()}
└ Impuestos: ${(info.taxRate * 100).toFixed(1)}%

⚔️ *COMBATE*
├ Guerras Ganadas: ${info.stats.warWins}
├ Guerras Perdidas: ${info.stats.warLosses}
├ Territorios: ${info.territories}
└ Alianzas: ${info.alliances}

💰 *TOP DONANTES*
${topContributors.map(c => `${c.rank}. @${c.userId.split('@')[0]} - $${c.amount.toLocaleString()}`).join('\n')}

${info.description || 'Sin descripción'}

*ID:* ${info.id}
*Creado:* ${new Date(info.createdAt).toLocaleDateString('es-ES')}`;

        return m.reply(msg, null, { 
            mentions: [clan.leader, ...topContributors.map(c => c.userId)] 
        });
    }
    
    // ════════════════════════════════════════════════════════════════
    // │                    .clan depositar                            │
    // ════════════════════════════════════════════════════════════════
    
    if (command === 'clandeposit' || command === 'clandepositar') {
        const clan = clanManager.getUserClan(sender);
        
        if (!clan) {
            return m.reply('❌ No eres miembro de ningún clan');
        }
        
        const amount = parseInt(text);
        
        if (isNaN(amount) || amount <= 0) {
            return m.reply(`*Uso:* ${usedPrefix}${command} <cantidad>

*Ejemplo:* ${usedPrefix}${command} 10000`);
        }
        
        if (user.money < amount) {
            return m.reply(`❌ No tienes suficiente dinero\nTienes: $${user.money.toLocaleString()}`);
        }
        
        const result = clan.deposit(sender, amount);
        
        if (!result.success) {
            return m.reply(`❌ ${result.message}`);
        }
        
        user.money -= amount;
        
        return m.reply(`✅ *¡DEPÓSITO EXITOSO!* 💰

*Depositaste:* $${amount.toLocaleString()}
*Nueva tesorería:* $${result.newBalance.toLocaleString()}
*Tu contribución total:* $${result.totalContribution.toLocaleString()}

¡Gracias por contribuir al clan!`);
    }
    
    // ════════════════════════════════════════════════════════════════
    // │                    .clan invitar                              │
    // ════════════════════════════════════════════════════════════════
    
    if (command === 'claninvite' || command === 'claninvitar') {
        const clan = clanManager.getUserClan(sender);
        
        if (!clan) {
            return m.reply('❌ No eres miembro de ningún clan');
        }
        
        if (!clan.hasPermission(sender, 'invite')) {
            return m.reply('❌ No tienes permiso para invitar');
        }
        
        const mentioned = m.mentionedJid[0];
        if (!mentioned) {
            return m.reply(`*Uso:* ${usedPrefix}${command} @usuario

*Ejemplo:* ${usedPrefix}${command} @5219992095479`);
        }
        
        const result = clan.inviteMember(mentioned, sender);
        
        if (!result.success) {
            return m.reply(`❌ ${result.message}`);
        }
        
        await m.reply(`✅ Invitación enviada a @${mentioned.split('@')[0]}`, null, { mentions: [mentioned] });
        
        // Enviar invitación al usuario
        await conn.reply(mentioned, `🏰 *¡INVITACIÓN DE CLAN!*

El clan *${clan.name}* [${clan.tag}] te ha invitado a unirte.

*Líder:* @${clan.leader.split('@')[0]}
*Nivel:* ${clan.level}
*Miembros:* ${clan.members.size}/${clan.getLevelBenefits().maxMembers}

*Aceptar:* ${usedPrefix}clanjoin ${clan.tag}
*Rechazar:* ${usedPrefix}clanreject ${clan.tag}

Esta invitación expira en 5 minutos.`, null, { mentions: [clan.leader] });
    }
    
    // Más comandos: claninvitar, clanexpulsar, clanpromo, clanwar, etc...
};

handler.help = ['clan', 'clancrear', 'clandeposit'];
handler.tags = ['clan'];
handler.command = /^(clan|claninfo|clancreate|clancrear|clandeposit|clandepositar|claninvite|claninvitar)$/i;

export default handler;
