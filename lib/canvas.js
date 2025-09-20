/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                            𒁈 AVENIX-MULTI V2.0.0 𒁈                         ┃
 * ┃               LIB/CANVAS.JS - GENERACIÓN DE IMÁGENES Y GRÁFICOS             ┃
 * ┃                          Creado por: Hepein Oficial                          ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import { createCanvas, loadImage, registerFont } from 'canvas'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import fetch from 'node-fetch'
import chalk from 'chalk'
import { downloadFile } from './functions.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ═══════════════════════════════════════════════════════════════════════════════
// │                        CLASE PRINCIPAL DE CANVAS                            │
// ═══════════════════════════════════════════════════════════════════════════════

class AvenixCanvas {
    constructor() {
        this.fontsDir = path.join(__dirname, '../assets/fonts')
        this.templatesDir = path.join(__dirname, '../assets/templates')
        this.defaultFont = 'Arial'
        
        // Colores predefinidos
        this.colors = {
            primary: '#3498db',
            secondary: '#2ecc71',
            accent: '#e74c3c',
            background: '#2c3e50',
            text: '#ffffff',
            textDark: '#2c3e50',
            gradient: {
                blue: ['#3498db', '#2980b9'],
                green: ['#2ecc71', '#27ae60'],
                purple: ['#9b59b6', '#8e44ad'],
                orange: ['#f39c12', '#e67e22'],
                red: ['#e74c3c', '#c0392b']
            }
        }
        
        // Configuraciones predefinidas
        this.presets = {
            profile: { width: 800, height: 400 },
            welcome: { width: 1000, height: 500 },
            rank: { width: 600, height: 200 },
            levelup: { width: 800, height: 300 },
            achievement: { width: 600, height: 300 },
            stats: { width: 900, height: 600 }
        }
        
        this.init()
    }
    
    async init() {
        try {
            // Crear directorios necesarios
            await this.createDirectories()
            
            // Cargar fuentes si están disponibles
            await this.loadFonts()
            
            console.log(chalk.green('𒁈 Canvas engine inicializado'))
        } catch (error) {
            console.error(chalk.red('𒁈 Error inicializando canvas:'), error)
        }
    }
    
    async createDirectories() {
        const dirs = [this.fontsDir, this.templatesDir]
        for (const dir of dirs) {
            try {
                await fs.mkdir(dir, { recursive: true })
            } catch (error) {
                // Directorio ya existe
            }
        }
    }
    
    async loadFonts() {
        try {
            const fontFiles = await fs.readdir(this.fontsDir)
            
            for (const fontFile of fontFiles) {
                if (fontFile.endsWith('.ttf') || fontFile.endsWith('.otf')) {
                    const fontPath = path.join(this.fontsDir, fontFile)
                    const fontName = path.parse(fontFile).name
                    
                    try {
                        registerFont(fontPath, { family: fontName })
                        console.log(chalk.cyan(`𒁈 Fuente cargada: ${fontName}`))
                    } catch (error) {
                        console.error(chalk.yellow(`𒁈 Error cargando fuente ${fontName}:`), error.message)
                    }
                }
            }
        } catch (error) {
            // No hay fuentes personalizadas, usar las del sistema
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                           FUNCIONES DE UTILIDAD                             │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async loadImageSafe(source) {
        try {
            if (typeof source === 'string' && source.startsWith('http')) {
                // Descargar imagen de URL
                const buffer = await downloadFile(source, 10 * 1024 * 1024) // 10MB max
                return await loadImage(buffer)
            } else if (Buffer.isBuffer(source)) {
                return await loadImage(source)
            } else if (typeof source === 'string') {
                // Ruta local
                return await loadImage(source)
            }
            throw new Error('Fuente de imagen no válida')
        } catch (error) {
            console.error(chalk.red('𒁈 Error cargando imagen:'), error.message)
            // Retornar imagen por defecto o null
            return null
        }
    }
    
    createGradient(ctx, colors, direction = 'horizontal', width = 800, height = 400) {
        let gradient
        
        switch (direction) {
            case 'horizontal':
                gradient = ctx.createLinearGradient(0, 0, width, 0)
                break
            case 'vertical':
                gradient = ctx.createLinearGradient(0, 0, 0, height)
                break
            case 'diagonal':
                gradient = ctx.createLinearGradient(0, 0, width, height)
                break
            case 'radial':
                gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height)/2)
                break
            default:
                gradient = ctx.createLinearGradient(0, 0, width, 0)
        }
        
        if (Array.isArray(colors)) {
            colors.forEach((color, index) => {
                gradient.addColorStop(index / (colors.length - 1), color)
            })
        } else {
            gradient.addColorStop(0, colors[0] || this.colors.primary)
            gradient.addColorStop(1, colors[1] || this.colors.secondary)
        }
        
        return gradient
    }
    
    drawRoundedRect(ctx, x, y, width, height, radius) {
        ctx.beginPath()
        ctx.roundRect(x, y, width, height, radius)
        ctx.fill()
    }
    
    wrapText(ctx, text, maxWidth) {
        const words = text.split(' ')
        const lines = []
        let currentLine = words[0]
        
        for (let i = 1; i < words.length; i++) {
            const word = words[i]
            const width = ctx.measureText(currentLine + ' ' + word).width
            
            if (width < maxWidth) {
                currentLine += ' ' + word
            } else {
                lines.push(currentLine)
                currentLine = word
            }
        }
        lines.push(currentLine)
        
        return lines
    }
    
    drawTextWithStroke(ctx, text, x, y, fillColor = '#ffffff', strokeColor = '#000000', strokeWidth = 2) {
        ctx.strokeStyle = strokeColor
        ctx.lineWidth = strokeWidth
        ctx.strokeText(text, x, y)
        
        ctx.fillStyle = fillColor
        ctx.fillText(text, x, y)
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                            PERFIL DE USUARIO                                │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async createProfileCard(user, options = {}) {
        try {
            console.log(chalk.cyan('𒁈 Generando tarjeta de perfil'))
            
            const config = { ...this.presets.profile, ...options }
            const canvas = createCanvas(config.width, config.height)
            const ctx = canvas.getContext('2d')
            
            // Fondo con gradiente
            const gradient = this.createGradient(ctx, this.colors.gradient.blue, 'diagonal', config.width, config.height)
            ctx.fillStyle = gradient
            ctx.fillRect(0, 0, config.width, config.height)
            
            // Overlay semitransparente
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
            ctx.fillRect(0, 0, config.width, config.height)
            
            // Avatar del usuario
            let avatarImage = null
            if (user.avatarUrl) {
                avatarImage = await this.loadImageSafe(user.avatarUrl)
            }
            
            const avatarSize = 120
            const avatarX = 50
            const avatarY = config.height / 2 - avatarSize / 2
            
            if (avatarImage) {
                // Círculo para el avatar
                ctx.save()
                ctx.beginPath()
                ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2)
                ctx.closePath()
                ctx.clip()
                
                ctx.drawImage(avatarImage, avatarX, avatarY, avatarSize, avatarSize)
                ctx.restore()
                
                // Borde del avatar
                ctx.strokeStyle = this.colors.text
                ctx.lineWidth = 4
                ctx.beginPath()
                ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2)
                ctx.stroke()
            } else {
                // Avatar por defecto
                ctx.fillStyle = this.colors.background
                ctx.beginPath()
                ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2)
                ctx.fill()
                
                ctx.strokeStyle = this.colors.text
                ctx.lineWidth = 4
                ctx.stroke()
                
                // Icono de usuario
                ctx.fillStyle = this.colors.text
                ctx.font = 'bold 48px Arial'
                ctx.textAlign = 'center'
                ctx.fillText('👤', avatarX + avatarSize/2, avatarY + avatarSize/2 + 15)
            }
            
            // Información del usuario
            const textStartX = avatarX + avatarSize + 30
            const textStartY = 80
            
            // Nombre
            ctx.fillStyle = this.colors.text
            ctx.font = 'bold 36px Arial'
            ctx.textAlign = 'left'
            ctx.fillText(user.name || 'Usuario', textStartX, textStartY)
            
            // Nivel y rol
            const level = user.level || 0
            const role = user.role || 'Novato'
            ctx.font = 'bold 24px Arial'
            ctx.fillText(`Nivel ${level} • ${role}`, textStartX, textStartY + 40)
            
            // Estadísticas
            const stats = [
                { label: 'EXP', value: (user.exp || 0).toLocaleString() },
                { label: 'Dinero', value: `$${(user.money || 0).toLocaleString()}` },
                { label: 'Diamantes', value: (user.diamond || 0).toString() }
            ]
            
            ctx.font = '18px Arial'
            let statY = textStartY + 80
            
            stats.forEach((stat, index) => {
                ctx.fillStyle = this.colors.text
                ctx.fillText(`${stat.label}:`, textStartX, statY)
                
                ctx.fillStyle = this.colors.secondary
                ctx.fillText(stat.value, textStartX + 100, statY)
                
                statY += 30
            })
            
            // Barra de progreso de EXP
            if (user.expProgress) {
                const progressBarX = textStartX
                const progressBarY = statY + 20
                const progressBarWidth = 300
                const progressBarHeight = 20
                
                // Fondo de la barra
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
                this.drawRoundedRect(ctx, progressBarX, progressBarY, progressBarWidth, progressBarHeight, 10)
                
                // Progreso
                const progressWidth = (user.expProgress / 100) * progressBarWidth
                ctx.fillStyle = this.colors.secondary
                this.drawRoundedRect(ctx, progressBarX, progressBarY, progressWidth, progressBarHeight, 10)
                
                // Texto del progreso
                ctx.fillStyle = this.colors.text
                ctx.font = 'bold 14px Arial'
                ctx.textAlign = 'center'
                ctx.fillText(`${user.expProgress.toFixed(1)}%`, progressBarX + progressBarWidth/2, progressBarY + 15)
            }
            
            // Logo/marca de agua
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
            ctx.font = 'bold 16px Arial'
            ctx.textAlign = 'right'
            ctx.fillText('𒁈 Avenix-Multi', config.width - 20, config.height - 20)
            
            return canvas.toBuffer('image/png')
            
        } catch (error) {
            console.error(chalk.red('𒁈 Error creando tarjeta de perfil:'), error)
            throw error
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                            TARJETA DE BIENVENIDA                            │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async createWelcomeCard(user, group, options = {}) {
        try {
            console.log(chalk.cyan('𒁈 Generando tarjeta de bienvenida'))
            
            const config = { ...this.presets.welcome, ...options }
            const canvas = createCanvas(config.width, config.height)
            const ctx = canvas.getContext('2d')
            
            // Imagen de fondo del grupo si está disponible
            let backgroundImage = null
            if (group.backgroundUrl || options.backgroundUrl) {
                backgroundImage = await this.loadImageSafe(group.backgroundUrl || options.backgroundUrl)
            }
            
            if (backgroundImage) {
                ctx.drawImage(backgroundImage, 0, 0, config.width, config.height)
                
                // Overlay oscuro para legibilidad
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
                ctx.fillRect(0, 0, config.width, config.height)
            } else {
                // Fondo con gradiente
                const gradient = this.createGradient(ctx, this.colors.gradient.green, 'radial', config.width, config.height)
                ctx.fillStyle = gradient
                ctx.fillRect(0, 0, config.width, config.height)
            }
            
            // Título principal
            ctx.fillStyle = this.colors.text
            ctx.font = 'bold 48px Arial'
            ctx.textAlign = 'center'
            this.drawTextWithStroke(ctx, '¡BIENVENIDO!', config.width/2, 80, this.colors.text, '#000000', 3)
            
            // Avatar del usuario
            let avatarImage = null
            if (user.avatarUrl) {
                avatarImage = await this.loadImageSafe(user.avatarUrl)
            }
            
            const avatarSize = 150
            const avatarX = config.width/2 - avatarSize/2
            const avatarY = 120
            
            if (avatarImage) {
                ctx.save()
                ctx.beginPath()
                ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2)
                ctx.closePath()
                ctx.clip()
                
                ctx.drawImage(avatarImage, avatarX, avatarY, avatarSize, avatarSize)
                ctx.restore()
                
                // Borde brillante
                ctx.strokeStyle = this.colors.secondary
                ctx.lineWidth = 6
                ctx.beginPath()
                ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2)
                ctx.stroke()
            } else {
                // Avatar por defecto con estilo
                const avatarGradient = this.createGradient(ctx, this.colors.gradient.purple, 'radial', avatarSize, avatarSize)
                ctx.fillStyle = avatarGradient
                ctx.beginPath()
                ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2)
                ctx.fill()
                
                ctx.fillStyle = this.colors.text
                ctx.font = 'bold 72px Arial'
                ctx.textAlign = 'center'
                ctx.fillText('👋', avatarX + avatarSize/2, avatarY + avatarSize/2 + 25)
            }
            
            // Nombre del usuario
            ctx.fillStyle = this.colors.text
            ctx.font = 'bold 36px Arial'
            ctx.textAlign = 'center'
            this.drawTextWithStroke(ctx, user.name || 'Nuevo miembro', config.width/2, avatarY + avatarSize + 50, this.colors.text, '#000000', 2)
            
            // Información del grupo
            ctx.font = 'bold 24px Arial'
            this.drawTextWithStroke(ctx, `a ${group.name || 'este grupo'}`, config.width/2, avatarY + avatarSize + 90, this.colors.text, '#000000', 2)
            
            // Contador de miembros
            if (group.memberCount) {
                ctx.font = '20px Arial'
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
                ctx.fillText(`Eres el miembro #${group.memberCount}`, config.width/2, avatarY + avatarSize + 120)
            }
            
            // Decoraciones
            this.drawDecorativeElements(ctx, config.width, config.height)
            
            // Marca de agua
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
            ctx.font = 'bold 18px Arial'
            ctx.textAlign = 'right'
            ctx.fillText('𒁈 Avenix-Multi', config.width - 20, config.height - 20)
            
            return canvas.toBuffer('image/png')
            
        } catch (error) {
            console.error(chalk.red('𒁈 Error creando tarjeta de bienvenida:'), error)
            throw error
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                            TARJETA DE RANKING                               │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async createRankCard(user, rank, totalUsers, options = {}) {
        try {
            console.log(chalk.cyan('𒁈 Generando tarjeta de ranking'))
            
            const config = { ...this.presets.rank, ...options }
            const canvas = createCanvas(config.width, config.height)
            const ctx = canvas.getContext('2d')
            
            // Fondo con gradiente dinámico según el rank
            let gradientColors = this.colors.gradient.blue
            
            if (rank <= 3) {
                gradientColors = this.colors.gradient.orange // Oro
            } else if (rank <= 10) {
                gradientColors = this.colors.gradient.purple // Plata
            } else if (rank <= 50) {
                gradientColors = this.colors.gradient.green // Bronce
            }
            
            const gradient = this.createGradient(ctx, gradientColors, 'horizontal', config.width, config.height)
            ctx.fillStyle = gradient
            ctx.fillRect(0, 0, config.width, config.height)
            
            // Overlay
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
            ctx.fillRect(0, 0, config.width, config.height)
            
            // Avatar
            let avatarImage = null
            if (user.avatarUrl) {
                avatarImage = await this.loadImageSafe(user.avatarUrl)
            }
            
            const avatarSize = 80
            const avatarX = 20
            const avatarY = config.height/2 - avatarSize/2
            
            if (avatarImage) {
                ctx.save()
                ctx.beginPath()
                ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2)
                ctx.closePath()
                ctx.clip()
                
                ctx.drawImage(avatarImage, avatarX, avatarY, avatarSize, avatarSize)
                ctx.restore()
                
                ctx.strokeStyle = this.colors.text
                ctx.lineWidth = 3
                ctx.beginPath()
                ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2)
                ctx.stroke()
            } else {
                ctx.fillStyle = this.colors.background
                ctx.beginPath()
                ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2)
                ctx.fill()
            }
            
            // Información del usuario
            const textX = avatarX + avatarSize + 20
            
            // Nombre
            ctx.fillStyle = this.colors.text
            ctx.font = 'bold 24px Arial'
            ctx.textAlign = 'left'
            ctx.fillText(user.name || 'Usuario', textX, 50)
            
            // Nivel y EXP
            ctx.font = '18px Arial'
            ctx.fillText(`Nivel ${user.level || 0} • ${(user.exp || 0).toLocaleString()} EXP`, textX, 75)
            
            // Barra de progreso
            if (user.expProgress) {
                const progressBarX = textX
                const progressBarY = 90
                const progressBarWidth = 200
                const progressBarHeight = 15
                
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
                this.drawRoundedRect(ctx, progressBarX, progressBarY, progressBarWidth, progressBarHeight, 7)
                
                const progressWidth = (user.expProgress / 100) * progressBarWidth
                ctx.fillStyle = this.colors.secondary
                this.drawRoundedRect(ctx, progressBarX, progressBarY, progressWidth, progressBarHeight, 7)
            }
            
            // Ranking
            ctx.fillStyle = this.colors.text
            ctx.font = 'bold 32px Arial'
            ctx.textAlign = 'right'
            
            let rankText = `#${rank}`
            if (rank === 1) rankText = '🥇 #1'
            else if (rank === 2) rankText = '🥈 #2'
            else if (rank === 3) rankText = '🥉 #3'
            
            ctx.fillText(rankText, config.width - 20, 50)
            
            // Total de usuarios
            ctx.font = '16px Arial'
            ctx.fillText(`de ${totalUsers} usuarios`, config.width - 20, 75)
            
            return canvas.toBuffer('image/png')
            
        } catch (error) {
            console.error(chalk.red('𒁈 Error creando tarjeta de ranking:'), error)
            throw error
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                            NOTIFICACIÓN DE LEVEL UP                         │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async createLevelUpCard(user, oldLevel, newLevel, options = {}) {
        try {
            console.log(chalk.cyan('𒁈 Generando tarjeta de level up'))
            
            const config = { ...this.presets.levelup, ...options }
            const canvas = createCanvas(config.width, config.height)
            const ctx = canvas.getContext('2d')
            
            // Fondo con gradiente dorado
            const gradient = this.createGradient(ctx, this.colors.gradient.orange, 'radial', config.width, config.height)
            ctx.fillStyle = gradient
            ctx.fillRect(0, 0, config.width, config.height)
            
            // Efectos de partículas/estrellas
            this.drawParticleEffect(ctx, config.width, config.height)
            
            // Título principal
            ctx.fillStyle = this.colors.text
            ctx.font = 'bold 36px Arial'
            ctx.textAlign = 'center'
            this.drawTextWithStroke(ctx, '🎉 ¡NIVEL SUPERIOR! 🎉', config.width/2, 50, this.colors.text, '#000000', 3)
            
            // Avatar pequeño
            let avatarImage = null
            if (user.avatarUrl) {
                avatarImage = await this.loadImageSafe(user.avatarUrl)
            }
            
            const avatarSize = 100
            const avatarX = 50
            const avatarY = config.height/2 - avatarSize/2
            
            if (avatarImage) {
                ctx.save()
                ctx.beginPath()
                ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2)
                ctx.closePath()
                ctx.clip()
                
                ctx.drawImage(avatarImage, avatarX, avatarY, avatarSize, avatarSize)
                ctx.restore()
                
                // Efecto de brillo
                ctx.strokeStyle = '#FFD700'
                ctx.lineWidth = 4
                ctx.beginPath()
                ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2)
                ctx.stroke()
            }
            
            // Información del level up
            const textX = avatarX + avatarSize + 30
            
            ctx.fillStyle = this.colors.text
            ctx.font = 'bold 28px Arial'
            ctx.textAlign = 'left'
            ctx.fillText(user.name || 'Usuario', textX, 120)
            
            // Cambio de nivel
            ctx.font = 'bold 32px Arial'
            ctx.fillText(`${oldLevel} ➜ ${newLevel}`, textX, 160)
            
            // Nuevo rol si aplica
            if (user.newRole) {
                ctx.font = 'bold 20px Arial'
                ctx.fillStyle = this.colors.secondary
                ctx.fillText(`🏆 ${user.newRole}`, textX, 190)
            }
            
            // Efectos decorativos adicionales
            this.drawCelebrationElements(ctx, config.width, config.height)
            
            return canvas.toBuffer('image/png')
            
        } catch (error) {
            console.error(chalk.red('𒁈 Error creando tarjeta de level up:'), error)
            throw error
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                            ELEMENTOS DECORATIVOS                            │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    drawDecorativeElements(ctx, width, height) {
        // Círculos decorativos
        const circles = [
            { x: width * 0.1, y: height * 0.2, radius: 30, alpha: 0.3 },
            { x: width * 0.9, y: height * 0.8, radius: 40, alpha: 0.2 },
            { x: width * 0.8, y: height * 0.3, radius: 25, alpha: 0.4 },
            { x: width * 0.2, y: height * 0.7, radius: 35, alpha: 0.25 }
        ]
        
        circles.forEach(circle => {
            ctx.fillStyle = `rgba(255, 255, 255, ${circle.alpha})`
            ctx.beginPath()
            ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2)
            ctx.fill()
        })
    }
    
    drawParticleEffect(ctx, width, height) {
        const particles = []
        for (let i = 0; i < 20; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                size: Math.random() * 4 + 1,
                alpha: Math.random() * 0.5 + 0.2
            })
        }
        
        particles.forEach(particle => {
            ctx.fillStyle = `rgba(255, 255, 255, ${particle.alpha})`
            ctx.beginPath()
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
            ctx.fill()
        })
    }
    
    drawCelebrationElements(ctx, width, height) {
        // Confeti
        const confetti = ['🎉', '🎊', '⭐', '✨', '💫']
        
        for (let i = 0; i < 10; i++) {
            const emoji = confetti[Math.floor(Math.random() * confetti.length)]
            const x = Math.random() * width
            const y = Math.random() * height
            const size = Math.random() * 20 + 15
            
            ctx.font = `${size}px Arial`
            ctx.textAlign = 'center'
            ctx.fillText(emoji, x, y)
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                            GRÁFICOS Y ESTADÍSTICAS                          │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async createStatsChart(data, options = {}) {
        try {
            console.log(chalk.cyan('𒁈 Generando gráfico de estadísticas'))
            
            const config = { ...this.presets.stats, ...options }
            const canvas = createCanvas(config.width, config.height)
            const ctx = canvas.getContext('2d')
            
            // Fondo
            ctx.fillStyle = this.colors.background
            ctx.fillRect(0, 0, config.width, config.height)
            
            // Título
            ctx.fillStyle = this.colors.text
            ctx.font = 'bold 24px Arial'
            ctx.textAlign = 'center'
            ctx.fillText(options.title || 'Estadísticas', config.width/2, 40)
            
            // Área del gráfico
            const chartArea = {
                x: 80,
                y: 80,
                width: config.width - 160,
                height: config.height - 160
            }
            
            // Fondo del gráfico
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
            ctx.fillRect(chartArea.x, chartArea.y, chartArea.width, chartArea.height)
            
            // Dibujar gráfico según el tipo
            switch (options.type) {
                case 'bar':
                    this.drawBarChart(ctx, data, chartArea)
                    break
                case 'line':
                    this.drawLineChart(ctx, data, chartArea)
                    break
                case 'pie':
                    this.drawPieChart(ctx, data, chartArea)
                    break
                default:
                    this.drawBarChart(ctx, data, chartArea)
            }
            
            return canvas.toBuffer('image/png')
            
        } catch (error) {
            console.error(chalk.red('𒁈 Error creando gráfico:'), error)
            throw error
        }
    }
    
    drawBarChart(ctx, data, area) {
        if (!data || data.length === 0) return
        
        const maxValue = Math.max(...data.map(d => d.value))
        const barWidth = area.width / data.length * 0.8
        const spacing = area.width / data.length * 0.2
        
        data.forEach((item, index) => {
            const barHeight = (item.value / maxValue) * area.height * 0.8
            const x = area.x + (index * (barWidth + spacing)) + spacing/2
            const y = area.y + area.height - barHeight - 20
            
            // Barra
            ctx.fillStyle = this.colors.gradient.blue[0]
            ctx.fillRect(x, y, barWidth, barHeight)
            
            // Etiqueta
            ctx.fillStyle = this.colors.text
            ctx.font = '12px Arial'
            ctx.textAlign = 'center'
            ctx.fillText(item.label, x + barWidth/2, area.y + area.height)
            
            // Valor
            ctx.fillText(item.value.toString(), x + barWidth/2, y - 5)
        })
    }
    
    drawLineChart(ctx, data, area) {
        if (!data || data.length === 0) return
        
        const maxValue = Math.max(...data.map(d => d.value))
        const stepX = area.width / (data.length - 1)
        
        ctx.strokeStyle = this.colors.secondary
        ctx.lineWidth = 3
        ctx.beginPath()
        
        data.forEach((item, index) => {
            const x = area.x + (index * stepX)
            const y = area.y + area.height - ((item.value / maxValue) * area.height * 0.8) - 20
            
            if (index === 0) {
                ctx.moveTo(x, y)
            } else {
                ctx.lineTo(x, y)
            }
            
            // Puntos
            ctx.fillStyle = this.colors.secondary
            ctx.beginPath()
            ctx.arc(x, y, 4, 0, Math.PI * 2)
            ctx.fill()
        })
        
        ctx.stroke()
    }
    
    drawPieChart(ctx, data, area) {
        if (!data || data.length === 0) return
        
        const centerX = area.x + area.width / 2
        const centerY = area.y + area.height / 2
        const radius = Math.min(area.width, area.height) / 3
        
        const total = data.reduce((sum, item) => sum + item.value, 0)
        let currentAngle = -Math.PI / 2
        
        const colors = Object.values(this.colors.gradient).map(g => g[0])
        
        data.forEach((item, index) => {
            const sliceAngle = (item.value / total) * 2 * Math.PI
            
            ctx.fillStyle = colors[index % colors.length]
            ctx.beginPath()
            ctx.moveTo(centerX, centerY)
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle)
            ctx.closePath()
            ctx.fill()
            
            // Etiqueta
            const labelAngle = currentAngle + sliceAngle / 2
            const labelX = centerX + Math.cos(labelAngle) * (radius + 30)
            const labelY = centerY + Math.sin(labelAngle) * (radius + 30)
            
            ctx.fillStyle = this.colors.text
            ctx.font = '12px Arial'
            ctx.textAlign = 'center'
            ctx.fillText(`${item.label}: ${item.value}`, labelX, labelY)
            
            currentAngle += sliceAngle
        })
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                              INSTANCIA GLOBAL                               │
// ═══════════════════════════════════════════════════════════════════════════════

const canvas = new AvenixCanvas()

export default canvas
