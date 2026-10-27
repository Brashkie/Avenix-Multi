/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                            𒁈 AVENIX-MULTI V2.0.0 𒁈                         ┃
 * ┃                    LIB/LEVELUP.JS - SISTEMA DE NIVELES Y RPG                ┃
 * ┃                          Creado por: Hepein Oficial                          ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import paint from './paint.js'
import moment from 'moment-timezone'
import { randomNumber, msToTime } from './functions.js'

// ═══════════════════════════════════════════════════════════════════════════════
// │                        CLASE PRINCIPAL DE LEVELUP                           │
// ═══════════════════════════════════════════════════════════════════════════════

class AvenixLevelUp {
    levelConfig: any
    roles: any
    expActivities: any
    levelRewards: any
    achievements: any

    constructor() {
        // Configuración del sistema de niveles
        this.levelConfig = {
            baseExp: 200,              // EXP base para subir de nivel
            expMultiplier: 1.2,        // Multiplicador de EXP por nivel
            maxLevel: 1000,            // Nivel máximo
            prestige: {
                enabled: true,
                minLevel: 100,         // Nivel mínimo para prestigio
                resetLevel: 1,         // Nivel tras prestigio
                bonusMultiplier: 0.1   // Bonus EXP por prestigio
            }
        }
        
        // Sistema de roles
        this.roles = [
            { name: 'Novato', minLevel: 0, color: '🔰' },
            { name: 'Aprendiz', minLevel: 10, color: '🌱' },
            { name: 'Intermedio', minLevel: 25, color: '⚡' },
            { name: 'Avanzado', minLevel: 50, color: '🔥' },
            { name: 'Experto', minLevel: 75, color: '💎' },
            { name: 'Master', minLevel: 100, color: '👑' },
            { name: 'Grandmaster', minLevel: 150, color: '🌟' },
            { name: 'Legendario', minLevel: 200, color: '🏆' },
            { name: 'Mítico', minLevel: 300, color: '🌌' },
            { name: 'Divino', minLevel: 500, color: '✨' },
            { name: 'Trascendente', minLevel: 750, color: '🔮' },
            { name: 'Omnipotente', minLevel: 1000, color: '💫' }
        ]
        
        // Actividades que dan EXP
        this.expActivities = {
            message: { min: 1, max: 3, cooldown: 60000 },      // 1 minuto
            command: { min: 5, max: 15, cooldown: 30000 },     // 30 segundos
            game: { min: 10, max: 25, cooldown: 0 },           // Sin cooldown
            daily: { min: 50, max: 100, cooldown: 86400000 },  // 24 horas
            quest: { min: 100, max: 500, cooldown: 0 },        // Sin cooldown
            work: { min: 15, max: 35, cooldown: 3600000 },     // 1 hora
            crime: { min: 25, max: 75, cooldown: 1800000 },    // 30 minutos
            adventure: { min: 50, max: 150, cooldown: 7200000 } // 2 horas
        }
        
        // Recompensas por nivel
        this.levelRewards = {
            money: (level) => level * 100,
            limits: (level) => Math.floor(level / 10),
            diamonds: (level) => Math.floor(level / 5),
            premium: [50, 100, 200, 500] // Niveles que dan premium temporal
        }
        
        // Sistema de logros
        this.achievements = [
            {
                id: 'first_level',
                name: 'Primer Paso',
                description: 'Alcanza el nivel 5',
                condition: (user) => user.level >= 5,
                reward: { money: 500, exp: 100 },
                emoji: '🌟'
            },
            {
                id: 'veteran',
                name: 'Veterano',
                description: 'Alcanza el nivel 50',
                condition: (user) => user.level >= 50,
                reward: { money: 5000, diamonds: 10 },
                emoji: '🎖️'
            },
            {
                id: 'master',
                name: 'Maestro',
                description: 'Alcanza el nivel 100',
                condition: (user) => user.level >= 100,
                reward: { money: 25000, diamonds: 50, premiumTime: 604800000 },
                emoji: '👑'
            },
            {
                id: 'rich',
                name: 'Millonario',
                description: 'Acumula 1,000,000 de dinero',
                condition: (user) => user.money >= 1000000,
                reward: { diamonds: 100, exp: 1000 },
                emoji: '💰'
            },
            {
                id: 'active',
                name: 'Muy Activo',
                description: 'Envía 1000 mensajes',
                condition: (user) => (user.messageCount || 0) >= 1000,
                reward: { money: 10000, exp: 500 },
                emoji: '📱'
            }
        ]
        
        console.log(paint.green('𒁈 LevelUp system inicializado'))
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                           CÁLCULOS DE EXPERIENCIA                           │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    calculateExpRequired(level) {
        if (level <= 0) return 0
        return Math.floor(this.levelConfig.baseExp * Math.pow(this.levelConfig.expMultiplier, level - 1))
    }
    
    calculateTotalExpRequired(level) {
        let total = 0
        for (let i = 1; i <= level; i++) {
            total += this.calculateExpRequired(i)
        }
        return total
    }
    
    calculateLevelFromExp(exp) {
        let level = 0
        let currentExp = 0
        
        while (currentExp <= exp && level < this.levelConfig.maxLevel) {
            level++
            currentExp += this.calculateExpRequired(level)
        }
        
        return Math.max(0, level - 1)
    }
    
    getExpProgress(user) {
        const currentLevel = user.level || 0
        const currentExp = user.exp || 0
        
        if (currentLevel >= this.levelConfig.maxLevel) {
            return {
                level: currentLevel,
                currentExp: currentExp,
                expRequired: 0,
                expForNext: 0,
                progress: 100,
                isMaxLevel: true
            }
        }
        
        const expForCurrentLevel = this.calculateTotalExpRequired(currentLevel)
        const expForNextLevel = this.calculateTotalExpRequired(currentLevel + 1)
        const expRequired = expForNextLevel - expForCurrentLevel
        const expProgress = currentExp - expForCurrentLevel
        const progressPercentage = Math.min(100, Math.max(0, (expProgress / expRequired) * 100))
        
        return {
            level: currentLevel,
            currentExp: currentExp,
            expRequired: expRequired,
            expForNext: Math.max(0, expRequired - expProgress),
            progress: progressPercentage,
            isMaxLevel: false
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                             SISTEMA DE ROLES                                │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    getUserRole(level) {
        for (let i = this.roles.length - 1; i >= 0; i--) {
            if (level >= this.roles[i].minLevel) {
                return this.roles[i]
            }
        }
        return this.roles[0]
    }
    
    getNextRole(level) {
        const currentRole = this.getUserRole(level)
        const currentIndex = this.roles.findIndex(role => role.name === currentRole.name)
        
        if (currentIndex < this.roles.length - 1) {
            return this.roles[currentIndex + 1]
        }
        
        return null // Ya es el rol máximo
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                           OTORGAR EXPERIENCIA                               │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    giveExp(user, activity, amount: any = null, bypassCooldown = false) {
        try {
            if (!user || typeof user !== 'object') {
                return { success: false as const, error: 'Usuario inválido' }
            }
            
            // Inicializar propiedades si no existen
            if (!user.exp) user.exp = 0
            if (!user.level) user.level = 0
            if (!user.lastExpGain) user.lastExpGain = {}
            if (!user.prestige) user.prestige = 0
            
            const activityConfig = this.expActivities[activity]
            if (!activityConfig && amount === null) {
                return { success: false as const, error: 'Actividad no válida' }
            }
            
            // Verificar cooldown
            const now = Date.now()
            const lastGain = user.lastExpGain[activity] || 0
            const cooldownRemaining = (lastGain + (activityConfig?.cooldown || 0)) - now
            
            if (!bypassCooldown && cooldownRemaining > 0) {
                return {
                    success: false as const,
                    error: 'Cooldown activo',
                    cooldownRemaining: cooldownRemaining,
                    cooldownFormatted: msToTime(cooldownRemaining)
                }
            }
            
            // Calcular EXP ganada
            let expGained = amount
            if (expGained === null && activityConfig) {
                expGained = randomNumber(activityConfig.min, activityConfig.max)
            }
            
            // Aplicar bonus de prestigio
            if (user.prestige > 0) {
                const prestigeBonus = user.prestige * this.levelConfig.prestige.bonusMultiplier
                expGained = Math.floor(expGained * (1 + prestigeBonus))
            }
            
            const oldLevel = user.level
            const oldExp = user.exp
            const oldRole = this.getUserRole(oldLevel)
            
            // Agregar experiencia
            user.exp += expGained
            user.lastExpGain[activity] = now
            
            // Calcular nuevo nivel
            const newLevel = this.calculateLevelFromExp(user.exp)
            const leveledUp = newLevel > oldLevel
            
            // Actualizar nivel
            user.level = Math.min(newLevel, this.levelConfig.maxLevel)
            
            const result: Record<string, any> = {
                success: true,
                expGained: expGained,
                oldLevel: oldLevel,
                newLevel: user.level,
                leveledUp: leveledUp,
                oldRole: oldRole,
                newRole: this.getUserRole(user.level),
                progress: this.getExpProgress(user)
            }
            
            // Si subió de nivel, agregar recompensas
            if (leveledUp) {
                const rewards = this.calculateLevelUpRewards(oldLevel, user.level)
                result.rewards = rewards
                
                // Aplicar recompensas
                this.applyRewards(user, rewards)
                
                // Verificar logros
                const achievements = this.checkAchievements(user)
                if (achievements.length > 0) {
                    result.achievements = achievements
                }
            }
            
            return result
            
        } catch (error) {
            console.error(paint.red('𒁈 Error dando EXP:'), error)
            return { success: false as const, error: error.message }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                            RECOMPENSAS DE NIVEL                             │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    calculateLevelUpRewards(oldLevel, newLevel) {
        const rewards: Record<string, any> = {
            money: 0,
            limits: 0,
            diamonds: 0,
            premiumTime: 0,
            special: []
        }
        
        for (let level = oldLevel + 1; level <= newLevel; level++) {
            // Recompensas base
            rewards.money += this.levelRewards.money(level)
            rewards.limits += this.levelRewards.limits(level)
            rewards.diamonds += this.levelRewards.diamonds(level)
            
            // Premium temporal en niveles especiales
            if (this.levelRewards.premium.includes(level)) {
                rewards.premiumTime += 7 * 24 * 60 * 60 * 1000 // 7 días
                rewards.special.push(`🎁 ¡Premium por 7 días por alcanzar nivel ${level}!`)
            }
            
            // Recompensas especiales cada 25 niveles
            if (level % 25 === 0) {
                rewards.diamonds += 25
                rewards.special.push(`💎 ¡Bonus de 25 diamantes por nivel ${level}!`)
            }
            
            // Recompensas especiales cada 50 niveles
            if (level % 50 === 0) {
                rewards.money += level * 50
                rewards.special.push(`💰 ¡Bonus de ${level * 50} monedas por nivel ${level}!`)
            }
            
            // Recompensas de prestigio cada 100 niveles
            if (level % 100 === 0 && level >= this.levelConfig.prestige.minLevel) {
                rewards.special.push(`⭐ ¡Prestigio disponible en nivel ${level}!`)
            }
        }
        
        return rewards
    }
    
    applyRewards(user, rewards) {
        if (rewards.money > 0) {
            user.money = (user.money || 0) + rewards.money
        }
        
        if (rewards.limits > 0) {
            user.limit = (user.limit || 25) + rewards.limits
        }
        
        if (rewards.diamonds > 0) {
            user.diamond = (user.diamond || 0) + rewards.diamonds
        }
        
        if (rewards.premiumTime > 0) {
            const currentPremiumTime = user.premiumTime || 0
            const now = Date.now()
            
            if (currentPremiumTime > now) {
                user.premiumTime = currentPremiumTime + rewards.premiumTime
            } else {
                user.premiumTime = now + rewards.premiumTime
                user.premium = true
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                            SISTEMA DE LOGROS                                │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    checkAchievements(user) {
        if (!user.achievements) user.achievements = []
        
        const newAchievements: any[] = []
        
        for (const achievement of this.achievements) {
            // Si ya tiene el logro, continuar
            if (user.achievements.includes(achievement.id)) continue
            
            // Verificar condición
            if (achievement.condition(user)) {
                user.achievements.push(achievement.id)
                newAchievements.push(achievement)
                
                // Aplicar recompensa
                if (achievement.reward) {
                    this.applyRewards(user, achievement.reward)
                }
            }
        }
        
        return newAchievements
    }
    
    getUserAchievements(user) {
        if (!user.achievements) return []
        
        return this.achievements.filter(achievement => 
            user.achievements.includes(achievement.id)
        )
    }
    
    getAvailableAchievements(user) {
        if (!user.achievements) user.achievements = []
        
        return this.achievements.filter(achievement => 
            !user.achievements.includes(achievement.id)
        )
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                            SISTEMA DE PRESTIGIO                             │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    canPrestige(user) {
        return this.levelConfig.prestige.enabled && 
               user.level >= this.levelConfig.prestige.minLevel
    }
    
    doPrestige(user) {
        if (!this.canPrestige(user)) {
            return { success: false as const, error: 'No cumples los requisitos para prestigio' }
        }
        
        const oldLevel = user.level
        const oldPrestige = user.prestige || 0
        
        // Resetear nivel y EXP
        user.level = this.levelConfig.prestige.resetLevel
        user.exp = this.calculateTotalExpRequired(this.levelConfig.prestige.resetLevel)
        user.prestige = oldPrestige + 1
        
        // Recompensas de prestigio
        const prestigeRewards = {
            money: oldLevel * 1000,
            diamonds: oldLevel * 2,
            premiumTime: 30 * 24 * 60 * 60 * 1000, // 30 días
            special: [`🌟 ¡Prestigio ${user.prestige} alcanzado!`]
        }
        
        this.applyRewards(user, prestigeRewards)
        
        return {
            success: true as const,
            oldLevel: oldLevel,
            oldPrestige: oldPrestige,
            newPrestige: user.prestige,
            rewards: prestigeRewards,
            expBonus: (user.prestige * this.levelConfig.prestige.bonusMultiplier * 100).toFixed(1)
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                            LEADERBOARDS                                     │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    getTopUsers(users, type = 'level', limit = 10) {
        try {
            if (!users || typeof users !== 'object') return []
            
            const userArray = Object.entries(users as Record<string, any>)
                .filter(([jid, user]) => {
                    // Filtrar usuarios válidos
                    return user && 
                           typeof user === 'object' && 
                           !jid.includes('@newsletter') && 
                           !jid.includes('lid')
                })
                .map(([jid, user]) => ({
                    jid,
                    name: user.name || jid.split('@')[0],
                    level: user.level || 0,
                    exp: user.exp || 0,
                    prestige: user.prestige || 0,
                    money: user.money || 0,
                    role: this.getUserRole(user.level || 0)
                }))
            
            // Ordenar según el tipo
            switch (type) {
                case 'level':
                    userArray.sort((a, b) => {
                        if (b.prestige !== a.prestige) return b.prestige - a.prestige
                        if (b.level !== a.level) return b.level - a.level
                        return b.exp - a.exp
                    })
                    break
                    
                case 'exp':
                    userArray.sort((a, b) => b.exp - a.exp)
                    break
                    
                case 'money':
                    userArray.sort((a, b) => b.money - a.money)
                    break
                    
                case 'prestige':
                    userArray.sort((a, b) => {
                        if (b.prestige !== a.prestige) return b.prestige - a.prestige
                        return b.level - a.level
                    })
                    break
                    
                default:
                    userArray.sort((a, b) => b.level - a.level)
            }
            
            return userArray.slice(0, limit)
            
        } catch (error) {
            console.error(paint.red('𒁈 Error obteniendo top users:'), error)
            return []
        }
    }
    
    getUserRank(users, userJid, type = 'level') {
        try {
            const topUsers = this.getTopUsers(users, type, 1000)
            const userIndex = topUsers.findIndex(user => user.jid === userJid)
            
            return userIndex !== -1 ? userIndex + 1 : null
            
        } catch (error) {
            console.error(paint.red('𒁈 Error obteniendo rank:'), error)
            return null
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                            FORMATEO DE MENSAJES                             │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    formatLevelUpMessage(result) {
        const { oldLevel, newLevel, newRole, rewards } = result
        
        let message = `🎉 *¡NIVEL SUPERIOR!* 🎉\n\n`
        message += `📊 *Nivel:* ${oldLevel} ➜ ${newLevel}\n`
        message += `🏆 *Rol:* ${newRole.color} ${newRole.name}\n\n`
        
        if (rewards) {
            message += `*🎁 Recompensas:*\n`
            if (rewards.money > 0) message += `💰 +${rewards.money.toLocaleString()} monedas\n`
            if (rewards.limits > 0) message += `💎 +${rewards.limits} límites\n`
            if (rewards.diamonds > 0) message += `💎 +${rewards.diamonds} diamantes\n`
            if (rewards.premiumTime > 0) message += `⭐ Premium extendido\n`
            
            if (rewards.special && rewards.special.length > 0) {
                message += `\n*✨ Especiales:*\n`
                rewards.special.forEach(special => {
                    message += `${special}\n`
                })
            }
        }
        
        message += `\n𒁈 *Avenix-Multi*`
        
        return message
    }
    
    formatProgressBar(progress, length = 20) {
        const filled = Math.floor((progress / 100) * length)
        const empty = length - filled
        
        return '▰'.repeat(filled) + '▱'.repeat(empty)
    }
    
    formatUserProfile(user, rank: any = null) {
        const role = this.getUserRole(user.level || 0)
        const progress = this.getExpProgress(user)
        const nextRole = this.getNextRole(user.level || 0)
        
        let profile = `👤 *PERFIL DE USUARIO*\n\n`
        profile += `📝 *Nombre:* ${user.name || 'Sin nombre'}\n`
        profile += `📊 *Nivel:* ${user.level || 0}${user.prestige ? ` (⭐${user.prestige})` : ''}\n`
        profile += `🏆 *Rol:* ${role.color} ${role.name}\n`
        
        if (rank) {
            profile += `📈 *Ranking:* #${rank}\n`
        }
        
        profile += `\n💫 *Experiencia:*\n`
        profile += `${this.formatProgressBar(progress.progress)} ${progress.progress.toFixed(1)}%\n`
        profile += `${progress.currentExp}/${progress.currentExp + progress.expForNext} EXP\n`
        
        if (nextRole) {
            profile += `\n🎯 *Siguiente rol:* ${nextRole.color} ${nextRole.name} (Nivel ${nextRole.minLevel})\n`
        }
        
        profile += `\n💰 *Economía:*\n`
        profile += `💵 Dinero: ${(user.money || 0).toLocaleString()}\n`
        profile += `💎 Diamantes: ${user.diamond || 0}\n`
        profile += `🎫 Límites: ${user.limit || 25}\n`
        
        if (user.premium && user.premiumTime > Date.now()) {
            const timeLeft = user.premiumTime - Date.now()
            profile += `⭐ Premium: ${msToTime(timeLeft)}\n`
        }
        
        if (this.canPrestige(user)) {
            profile += `\n⭐ *¡Prestigio disponible!*\n`
        }
        
        profile += `\n𒁈 *Avenix-Multi*`
        
        return profile
    }
    
    formatLeaderboard(topUsers, type = 'level', title = 'Top Usuarios') {
        let leaderboard = `🏆 *${title.toUpperCase()}*\n\n`
        
        topUsers.forEach((user, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📍'
            
            leaderboard += `${medal} *${index + 1}.* ${user.role.color} ${user.name}\n`
            
            switch (type) {
                case 'level':
                    leaderboard += `   📊 Nivel ${user.level}${user.prestige ? ` (⭐${user.prestige})` : ''} • ${user.exp.toLocaleString()} EXP\n`
                    break
                case 'money':
                    leaderboard += `   💰 ${user.money.toLocaleString()} monedas\n`
                    break
                case 'exp':
                    leaderboard += `   ⚡ ${user.exp.toLocaleString()} EXP\n`
                    break
                case 'prestige':
                    leaderboard += `   ⭐ Prestigio ${user.prestige} • Nivel ${user.level}\n`
                    break
            }
            
            leaderboard += '\n'
        })
        
        leaderboard += `𒁈 *Avenix-Multi*`
        
        return leaderboard
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                              INSTANCIA GLOBAL                               │
// ═══════════════════════════════════════════════════════════════════════════════

const levelup = new AvenixLevelUp()

export default levelup
