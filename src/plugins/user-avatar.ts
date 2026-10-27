import { AVATAR_PARTS, avatarManager, formatPartsList } from '../lib/avatar-creator.js';
import type { PluginHandler } from '../types/index.js'

const handler: PluginHandler = async (m, { conn, text, command, usedPrefix }) => {
    const userId = m.sender;
    let user = global.db.data.users[userId];
    
    // Inicializar usuario si no existe
    if (!user.avatars) {
        user.avatars = {
            current: null,
            favorites: []
        };
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // │                      CREAR AVATAR                               │
    // ═══════════════════════════════════════════════════════════════════
    
    if (command === 'avatar' || command === 'createavatar') {
        if (!text) {
            return m.reply(`
🎨 *AVATAR CREATOR* 🎨

Comandos disponibles:

*Crear:*
- ${usedPrefix}avatar crear [nombre]
- ${usedPrefix}avatar random
- ${usedPrefix}avatar random legendary

*Ver:*
- ${usedPrefix}avatar ver
- ${usedPrefix}avatar lista
- ${usedPrefix}avatar galeria

*Editar:*
- ${usedPrefix}avatar editar
- ${usedPrefix}avatar cambiar [parte]

*Shop:*
- ${usedPrefix}avatar shop
- ${usedPrefix}avatar comprar [parte]

*Stats:*
- ${usedPrefix}avatar stats
- ${usedPrefix}avatar ranking

Ejemplo:
${usedPrefix}avatar crear Mi Avatar Cool
            `.trim());
        }
        
        const args = text.split(' ');
        const subcommand = args[0].toLowerCase();
        
        // CREAR AVATAR
        if (subcommand === 'crear' || subcommand === 'create') {
            const userAvatars = avatarManager.getUserAvatars(userId);
            
            if (userAvatars.length >= 5) {
                return m.reply('❌ Ya tienes el máximo de avatares (5). Elimina uno primero con *.avatar eliminar [id]*');
            }
            
            if (user.money < 100) {
                return m.reply('❌ Necesitas 100 money para crear un avatar');
            }
            
            const name = args.slice(1).join(' ') || 'Mi Avatar';
            const result = avatarManager.createAvatar(userId, { name });
            
            if (result.success) {
                user.money -= 100;
                user.avatars.current = result.avatar.id;
                
                await m.reply(`
✅ *AVATAR CREADO* ✅

${result.avatar.renderCard()}

*ID:* ${result.avatar.id}
*Costo:* 100 💰

Ahora edítalo con:
${usedPrefix}avatar editar
                `.trim());
            } else {
                m.reply(`❌ ${result.message}`);
            }
            return;
        }
        
        // AVATAR ALEATORIO
        if (subcommand === 'random' || subcommand === 'aleatorio') {
            const rarity = args[1] || 'any';
            const validRarities = ['any', 'common', 'rare', 'epic', 'legendary'];
            
            if (!validRarities.includes(rarity)) {
                return m.reply(`❌ Rareza inválida. Usa: ${validRarities.join(', ')}`);
            }
            
            if (user.money < 100) {
                return m.reply('❌ Necesitas 100 money');
            }
            
            const result = avatarManager.generateRandom(userId, rarity);
            
            if (result.success) {
                user.money -= 100;
                user.avatars.current = result.avatar.id;
                
                await m.reply(`
🎲 *AVATAR ALEATORIO* 🎲

${result.avatar.renderCard()}

¡Prueba tu suerte de nuevo!
${usedPrefix}avatar random
                `.trim());
            }
            return;
        }
        
        // VER AVATAR ACTUAL
        if (subcommand === 'ver' || subcommand === 'show') {
            const currentId = user.avatars.current;
            if (!currentId) {
                return m.reply('❌ No tienes avatar activo. Crea uno con *.avatar crear*');
            }
            
            const avatar = avatarManager.getAvatar(userId, currentId);
            if (!avatar) {
                return m.reply('❌ Avatar no encontrado');
            }
            
            avatar.addView();
            
            await m.reply(`
${avatar.renderCard()}

*Partes:*
${avatar.getPartsList().map(p => `${p.rarityEmoji} ${p.emoji} ${p.name}`).join('\n')}

*Valor Total:* ${avatar.getTotalValue()} 💰
            `.trim());
            return;
        }
        
        // LISTA DE AVATARES
        if (subcommand === 'lista' || subcommand === 'list') {
            const avatars = avatarManager.getUserAvatars(userId);
            
            if (avatars.length === 0) {
                return m.reply('❌ No tienes avatares. Crea uno con *.avatar crear*');
            }
            
            let text = `📋 *TUS AVATARES* (${avatars.length}/5)\n\n`;
            
            avatars.forEach((avatar, i) => {
                const isCurrent = avatar.id === user.avatars.current;
                text += `${i + 1}. ${isCurrent ? '⭐' : '•'} *${avatar.name}*\n`;
                text += `   ID: \`${avatar.id}\`\n`;
                text += `   ${avatar.render('emoji')}\n`;
                text += `   ❤️ ${avatar.stats.likes} • 👁️ ${avatar.stats.views}\n\n`;
            });
            
            text += `\n*Activar:* ${usedPrefix}avatar activar [id]\n`;
            text += `*Eliminar:* ${usedPrefix}avatar eliminar [id]`;
            
            await m.reply(text.trim());
            return;
        }
        
        // EDITAR AVATAR
        if (subcommand === 'editar' || subcommand === 'edit') {
            const currentId = user.avatars.current;
            if (!currentId) {
                return m.reply('❌ No tienes avatar activo');
            }
            
            const avatar = avatarManager.getAvatar(userId, currentId);
            const inventory = avatarManager.getUserInventory(userId);
            
            let text = `
🎨 *EDITOR DE AVATAR* 🎨

${avatar.render('ascii')}

*Partes Actuales:*
${Object.entries(avatar.parts as Record<string, any>).map(([cat, part]) => `• ${cat}: ${part}`).join('\n')}

*Cambiar Partes:*
${usedPrefix}avatar cambiar cara [nombre]
${usedPrefix}avatar cambiar ojos [nombre]
${usedPrefix}avatar cambiar boca [nombre]
${usedPrefix}avatar cambiar cabello [nombre]
${usedPrefix}avatar cambiar accesorio [nombre]
${usedPrefix}avatar cambiar fondo [nombre]

*Ver Catálogo:*
${usedPrefix}avatar catalogo [categoria]

*Renombrar:*
${usedPrefix}avatar nombre [nuevo nombre]
            `.trim();
            
            await m.reply(text);
            return;
        }
        
        // CAMBIAR PARTE
        if (subcommand === 'cambiar' || subcommand === 'change') {
            const currentId = user.avatars.current;
            if (!currentId) {
                return m.reply('❌ No tienes avatar activo');
            }
            
            const category = args[1]?.toLowerCase();
            const partName = args[2]?.toLowerCase();
            
            const categoryMap = {
                'cara': 'face',
                'face': 'face',
                'ojos': 'eyes',
                'eyes': 'eyes',
                'boca': 'mouth',
                'mouth': 'mouth',
                'cabello': 'hair',
                'pelo': 'hair',
                'hair': 'hair',
                'accesorio': 'accessory',
                'accessory': 'accessory',
                'fondo': 'background',
                'background': 'background'
            };
            
            const realCategory = categoryMap[category];
            
            if (!realCategory || !partName) {
                return m.reply(`
❌ Uso: ${usedPrefix}avatar cambiar [categoria] [parte]

Categorías: cara, ojos, boca, cabello, accesorio, fondo

Ejemplo:
${usedPrefix}avatar cambiar ojos fire
                `.trim());
            }
            
            const avatar = avatarManager.getAvatar(userId, currentId);
            const inventory = avatarManager.getUserInventory(userId);
            
            const result = avatar.setPart(realCategory, partName, inventory);
            
            if (!result.success) {
                if (result.cost) {
                    return m.reply(`
🔒 *ITEM BLOQUEADO*

Parte: ${partName}
Rareza: ${result.rarity}
Costo: ${result.cost} 💰

Comprar con:
${usedPrefix}avatar comprar ${realCategory} ${partName}
                    `.trim());
                }
                return m.reply(`❌ ${result.message}`);
            }
            
            user.money -= 50; // Costo de edición
            
            await m.reply(`
✅ *AVATAR ACTUALIZADO*

${avatar.render('ascii')}

*Cambio:* ${category} → ${partName}
*Costo:* 50 💰
            `.trim());
            return;
        }
        
        // SHOP / CATÁLOGO
        if (subcommand === 'shop' || subcommand === 'catalogo' || subcommand === 'catalog') {
            const category = args[1];
            
            if (!category) {
                return m.reply(`
🛒 *AVATAR SHOP* 🛒

Categorías disponibles:
- cara / face
- ojos / eyes
- boca / mouth
- cabello / hair
- accesorio / accessory
- fondo / background

Ver catálogo:
${usedPrefix}avatar catalogo [categoria]

Ejemplo:
${usedPrefix}avatar catalogo ojos
                `.trim());
            }
            
            const categoryMap = {
                'cara': 'face',
                'face': 'face',
                'ojos': 'eyes',
                'eyes': 'eyes',
                'boca': 'mouth',
                'mouth': 'mouth',
                'cabello': 'hair',
                'pelo': 'hair',
                'hair': 'hair',
                'accesorio': 'accessory',
                'accessory': 'accessory',
                'fondo': 'background',
                'background': 'background'
            };
            
            const realCategory = categoryMap[category.toLowerCase()];
            
            if (!realCategory) {
                return m.reply('❌ Categoría inválida');
            }
            
            const parts = avatarManager.getAvailableParts(userId, realCategory);
            
            let text = `🛒 *CATÁLOGO: ${category.toUpperCase()}*\n\n`;
            
            parts.forEach(part => {
                const status = part.isUnlocked ? '✅' : '🔒';
                text += `${status} ${part.emoji} *${part.name}*\n`;
                text += `   Rareza: ${part.rarity}\n`;
                text += `   Costo: ${part.cost > 0 ? `${part.cost} 💰` : 'Gratis'}\n\n`;
            });
            
            text += `\n*Comprar:*\n${usedPrefix}avatar comprar ${category} [nombre]`;
            
            await m.reply(text.trim());
            return;
        }
        
        // COMPRAR PARTE
        if (subcommand === 'comprar' || subcommand === 'buy') {
            const category = args[1]?.toLowerCase();
            const partName = args[2]?.toLowerCase();
            
            if (!category || !partName) {
                return m.reply(`❌ Uso: ${usedPrefix}avatar comprar [categoria] [parte]`);
            }
            
            const categoryMap = {
                'cara': 'face',
                'ojos': 'eyes',
                'boca': 'mouth',
                'cabello': 'hair',
                'accesorio': 'accessory',
                'fondo': 'background'
            };
            
            const realCategory = categoryMap[category] || category;
            
            // Verificar si existe la parte
            const part = AVATAR_PARTS[realCategory]?.[partName];
            if (!part) {
                return m.reply('❌ Parte no encontrada');
            }
            
            // Verificar si ya está desbloqueada
            const inventory = avatarManager.getUserInventory(userId);
            const invKey = `${realCategory}_${partName}`;
            
            if (inventory[invKey]) {
                return m.reply('✅ Ya tienes esta parte desbloqueada');
            }
            
            // Verificar money
            if (user.money < part.cost) {
                return m.reply(`❌ No tienes suficiente money\nNecesitas: ${part.cost} 💰\nTienes: ${user.money} 💰`);
            }
            
            // Desbloquear
            const result = avatarManager.unlockPart(userId, realCategory, partName);
            
            if (result.success) {
                user.money -= part.cost;
                
                await m.reply(`
✅ *COMPRA EXITOSA*

${part.emoji} *${partName}*
Rareza: ${part.rarity}
Costo: ${part.cost} 💰

¡Ahora puedes usarlo en tu avatar!
${usedPrefix}avatar cambiar ${category} ${partName}
                `.trim());
            }
            return;
        }
        
        // GALERÍA
        if (subcommand === 'galeria' || subcommand === 'gallery') {
            const sortBy = args[1] || 'likes';
            const validSort = ['likes', 'views', 'recent', 'value'];
            
            if (!validSort.includes(sortBy)) {
                return m.reply(`❌ Orden inválido. Usa: ${validSort.join(', ')}`);
            }
            
            const gallery = avatarManager.getGallery(10, sortBy);
            
            if (gallery.length === 0) {
                return m.reply('❌ La galería está vacía');
            }
            
            let text = `🎨 *GALERÍA DE AVATARES* 🎨\n\n`;
            
            gallery.forEach((avatar, i) => {
                text += `${i + 1}. *${avatar.name}*\n`;
                text += `   ${avatar.render('emoji')}\n`;
                text += `   👤 ${avatar.userId.substring(0, 10)}...\n`;
                text += `   ❤️ ${avatar.stats.likes} • 👁️ ${avatar.stats.views}\n`;
                text += `   💰 Valor: ${avatar.getTotalValue()}\n\n`;
            });
            
            text += `\n*Ver más:* ${usedPrefix}avatar galeria [likes|views|recent|value]`;
            
            await m.reply(text.trim());
            return;
        }
        
        // ESTADÍSTICAS
        if (subcommand === 'stats' || subcommand === 'estadisticas') {
            const stats = avatarManager.getUserStats(userId);
            
            await m.reply(`
📊 *TUS ESTADÍSTICAS* 📊

*General:*
- Avatares: ${stats.totalAvatars}/5
- Likes totales: ❤️ ${stats.totalLikes}
- Vistas totales: 👁️ ${stats.totalViews}

*Inventario:*
- Partes desbloqueadas: 🔓 ${stats.unlockedParts}
- Valor total: 💰 ${stats.totalValue}

*Preferencias:*
- Rareza favorita: ${stats.favoriteRarity}
            `.trim());
            return;
        }
    }
};

handler.help = ['avatar', 'createavatar'];
handler.tags = ['fun', 'game'];
handler.command = /^(avatar|createavatar)$/i;
handler.register = true;

export default handler;
