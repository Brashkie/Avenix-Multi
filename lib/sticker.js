/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                            𒁈 AVENIX-MULTI V2.0.0 𒁈                         ┃
 * ┃                     LIB/STICKER.JS - CREACIÓN DE STICKERS                   ┃
 * ┃                          Creado por: Hepein Oficial                          ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { fileTypeFromBuffer } from 'file-type'
import chalk from 'chalk'
import { Sticker, createSticker, StickerTypes } from 'wa-sticker-formatter'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ═══════════════════════════════════════════════════════════════════════════════
// │                        CLASE PRINCIPAL DE STICKERS                          │
// ═══════════════════════════════════════════════════════════════════════════════

class AvenixSticker {
    constructor() {
        this.tempDir = path.join(__dirname, '../tmp')
        this.maxFileSize = 2 * 1024 * 1024 // 2MB límite de WhatsApp
        this.stickerSize = 512 // Tamaño estándar de stickers
        this.maxDuration = 10 // Segundos máximos para stickers animados
        
        this.defaultOptions = {
            pack: global.packname || '𒁈 Avenix-Multi',
            author: global.stickauth || 'Hepein Oficial',
            type: StickerTypes.FULL,
            categories: ['💎', '🤖'],
            id: '𒁈-avenix-multi-stickers',
            quality: 80,
            background: 'transparent'
        }
        
        this.init()
    }
    
    async init() {
        try {
            await fs.mkdir(this.tempDir, { recursive: true })
            console.log(chalk.green('𒁈 Sticker engine inicializado'))
        } catch (error) {
            console.error(chalk.red('𒁈 Error inicializando sticker engine:'), error)
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                           FUNCIONES DE UTILIDAD                             │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    generateTempPath(ext = 'tmp') {
        return path.join(this.tempDir, `sticker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`)
    }
    
    async cleanupFile(filePath) {
        try {
            await fs.unlink(filePath)
        } catch (error) {
            // Ignorar si el archivo no existe
        }
    }
    
    async validateInput(buffer) {
        if (!Buffer.isBuffer(buffer)) {
            throw new Error('Input debe ser un Buffer')
        }
        
        if (buffer.length === 0) {
            throw new Error('Buffer vacío')
        }
        
        if (buffer.length > this.maxFileSize * 2) { // Permitir más espacio para procesamiento
            throw new Error(`Archivo muy grande (max: ${this.maxFileSize / 1024 / 1024}MB para sticker final)`)
        }
        
        const fileType = await fileTypeFromBuffer(buffer)
        if (!fileType) {
            throw new Error('Tipo de archivo no detectado')
        }
        
        return fileType
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                           CREACIÓN DE STICKERS                              │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async create(buffer, options = {}) {
        try {
            const fileType = await this.validateInput(buffer)
            const mergedOptions = { ...this.defaultOptions, ...options }
            
            console.log(chalk.cyan(`𒁈 Creando sticker desde ${fileType.mime}`))
            
            // Determinar el tipo de sticker
            const isVideo = fileType.mime.startsWith('video/') || 
                           fileType.ext === 'gif' || 
                           fileType.ext === 'webm'
            
            let processedBuffer = buffer
            
            // Pre-procesar si es necesario
            if (isVideo) {
                processedBuffer = await this.preprocessVideo(buffer, fileType, mergedOptions)
            } else {
                processedBuffer = await this.preprocessImage(buffer, fileType, mergedOptions)
            }
            
            // Crear sticker usando wa-sticker-formatter
            const sticker = new Sticker(processedBuffer, {
                pack: mergedOptions.pack,
                author: mergedOptions.author,
                type: mergedOptions.type,
                categories: mergedOptions.categories,
                id: mergedOptions.id,
                quality: mergedOptions.quality,
                background: mergedOptions.background
            })
            
            const stickerBuffer = await sticker.toBuffer()
            
            // Verificar tamaño final
            if (stickerBuffer.length > this.maxFileSize) {
                console.log(chalk.yellow('𒁈 Sticker muy grande, recomprimiendo...'))
                return await this.compressSticker(processedBuffer, mergedOptions)
            }
            
            console.log(chalk.green(`𒁈 Sticker creado: ${(stickerBuffer.length / 1024).toFixed(1)}KB`))
            return stickerBuffer
            
        } catch (error) {
            console.error(chalk.red('𒁈 Error creando sticker:'), error)
            throw new Error(`Error creando sticker: ${error.message}`)
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                        PRE-PROCESAMIENTO DE IMAGEN                          │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async preprocessImage(buffer, fileType, options) {
        const inputPath = this.generateTempPath(fileType.ext)
        const outputPath = this.generateTempPath('png')
        
        try {
            await fs.writeFile(inputPath, buffer)
            
            const ffmpegArgs = [
                '-i', inputPath,
                '-vf', `scale=${this.stickerSize}:${this.stickerSize}:force_original_aspect_ratio=decrease,pad=${this.stickerSize}:${this.stickerSize}:(ow-iw)/2:(oh-ih)/2:color=${options.background || 'transparent'}`,
                '-c:v', 'png',
                '-pix_fmt', 'rgba',
                '-y',
                outputPath
            ]
            
            await this.runFFmpeg(ffmpegArgs)
            
            return await fs.readFile(outputPath)
            
        } finally {
            await Promise.all([
                this.cleanupFile(inputPath),
                this.cleanupFile(outputPath)
            ])
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                        PRE-PROCESAMIENTO DE VIDEO                           │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async preprocessVideo(buffer, fileType, options) {
        const inputPath = this.generateTempPath(fileType.ext)
        const outputPath = this.generateTempPath('webp')
        
        try {
            await fs.writeFile(inputPath, buffer)
            
            const duration = Math.min(options.duration || this.maxDuration, this.maxDuration)
            const fps = Math.min(options.fps || 15, 20) // Máximo 20 FPS para stickers
            
            const ffmpegArgs = [
                '-i', inputPath,
                '-vf', [
                    `scale=${this.stickerSize}:${this.stickerSize}:force_original_aspect_ratio=decrease`,
                    `pad=${this.stickerSize}:${this.stickerSize}:(ow-iw)/2:(oh-ih)/2:color=${options.background || 'transparent'}`,
                    `fps=${fps}`
                ].join(','),
                '-c:v', 'libwebp',
                '-quality', (options.quality || 80).toString(),
                '-compression_level', '6',
                '-preset', 'picture',
                '-loop', '0',
                '-an', // Sin audio
                '-t', duration.toString(),
                '-y',
                outputPath
            ]
            
            await this.runFFmpeg(ffmpegArgs)
            
            return await fs.readFile(outputPath)
            
        } finally {
            await Promise.all([
                this.cleanupFile(inputPath),
                this.cleanupFile(outputPath)
            ])
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                           COMPRESIÓN DE STICKERS                            │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async compressSticker(buffer, options, attempt = 1) {
        if (attempt > 3) {
            throw new Error('No se pudo comprimir el sticker al tamaño requerido')
        }
        
        try {
            console.log(chalk.yellow(`𒁈 Intento de compresión #${attempt}`))
            
            // Reducir calidad progresivamente
            const quality = Math.max(30, options.quality - (attempt * 20))
            const newOptions = { ...options, quality }
            
            const sticker = new Sticker(buffer, {
                pack: newOptions.pack,
                author: newOptions.author,
                type: newOptions.type,
                quality: quality,
                background: newOptions.background
            })
            
            const compressedBuffer = await sticker.toBuffer()
            
            if (compressedBuffer.length <= this.maxFileSize) {
                console.log(chalk.green(`𒁈 Sticker comprimido exitosamente en intento ${attempt}`))
                return compressedBuffer
            }
            
            // Si aún es muy grande, intentar de nuevo
            return await this.compressSticker(buffer, newOptions, attempt + 1)
            
        } catch (error) {
            throw new Error(`Error comprimiendo sticker: ${error.message}`)
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                          STICKERS ESPECIALES                                │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async createFromText(text, options = {}) {
        try {
            const {
                fontSize = 60,
                fontFamily = 'Arial',
                textColor = '#FFFFFF',
                backgroundColor = '#000000',
                borderColor = '#FFFFFF',
                borderWidth = 2
            } = options
            
            const outputPath = this.generateTempPath('png')
            
            // Crear imagen con texto usando ImageMagick
            const magickArgs = [
                '-size', `${this.stickerSize}x${this.stickerSize}`,
                '-background', backgroundColor,
                '-fill', textColor,
                '-font', fontFamily,
                '-pointsize', fontSize.toString(),
                '-gravity', 'center',
                '-stroke', borderColor,
                '-strokewidth', borderWidth.toString(),
                `label:${text}`,
                outputPath
            ]
            
            await this.runImageMagick(magickArgs)
            
            const imageBuffer = await fs.readFile(outputPath)
            await this.cleanupFile(outputPath)
            
            return await this.create(imageBuffer, options)
            
        } catch (error) {
            // Fallback usando canvas si ImageMagick no está disponible
            return await this.createTextStickerFallback(text, options)
        }
    }
    
    async createTextStickerFallback(text, options = {}) {
        // Implementación simple usando Canvas (requiere node-canvas)
        const outputPath = this.generateTempPath('png')
        
        try {
            // SVG simple como fallback
            const svg = `
                <svg width="${this.stickerSize}" height="${this.stickerSize}" xmlns="http://www.w3.org/2000/svg">
                    <rect width="100%" height="100%" fill="${options.backgroundColor || '#000000'}"/>
                    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" 
                          font-family="Arial" font-size="${options.fontSize || 60}" 
                          fill="${options.textColor || '#FFFFFF'}" 
                          stroke="${options.borderColor || '#FFFFFF'}" 
                          stroke-width="${options.borderWidth || 2}">
                        ${text}
                    </text>
                </svg>
            `
            
            // Convertir SVG a PNG usando FFmpeg
            const inputPath = this.generateTempPath('svg')
            await fs.writeFile(inputPath, svg)
            
            const ffmpegArgs = [
                '-i', inputPath,
                '-vf', `scale=${this.stickerSize}:${this.stickerSize}`,
                '-y',
                outputPath
            ]
            
            await this.runFFmpeg(ffmpegArgs)
            
            const imageBuffer = await fs.readFile(outputPath)
            
            await Promise.all([
                this.cleanupFile(inputPath),
                this.cleanupFile(outputPath)
            ])
            
            return await this.create(imageBuffer, options)
            
        } catch (error) {
            throw new Error(`Error creando sticker de texto: ${error.message}`)
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                         EJECUTORES DE HERRAMIENTAS                          │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    runFFmpeg(args) {
        return new Promise((resolve, reject) => {
            const ffmpeg = spawn('ffmpeg', args)
            
            let stderr = ''
            
            ffmpeg.stderr.on('data', (data) => {
                stderr += data.toString()
            })
            
            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    resolve()
                } else {
                    reject(new Error(`FFmpeg error (${code}): ${stderr}`))
                }
            })
            
            ffmpeg.on('error', (error) => {
                reject(new Error(`FFmpeg spawn error: ${error.message}`))
            })
            
            // Timeout de 60 segundos
            setTimeout(() => {
                ffmpeg.kill('SIGKILL')
                reject(new Error('FFmpeg timeout'))
            }, 60000)
        })
    }
    
    runImageMagick(args) {
        return new Promise((resolve, reject) => {
            const magick = spawn('convert', args)
            
            let stderr = ''
            
            magick.stderr.on('data', (data) => {
                stderr += data.toString()
            })
            
            magick.on('close', (code) => {
                if (code === 0) {
                    resolve()
                } else {
                    reject(new Error(`ImageMagick error (${code}): ${stderr}`))
                }
            })
            
            magick.on('error', (error) => {
                reject(new Error(`ImageMagick not available: ${error.message}`))
            })
            
            // Timeout de 30 segundos
            setTimeout(() => {
                magick.kill('SIGKILL')
                reject(new Error('ImageMagick timeout'))
            }, 30000)
        })
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                           FUNCIONES ESPECIALES                              │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async addWatermark(buffer, watermarkText, options = {}) {
        const inputPath = this.generateTempPath('input')
        const outputPath = this.generateTempPath('png')
        
        try {
            await fs.writeFile(inputPath, buffer)
            
            const {
                position = 'bottomright',
                fontSize = 24,
                color = 'white',
                opacity = 0.7
            } = options
            
            let gravity
            switch (position) {
                case 'topleft': gravity = 'northwest'; break
                case 'topright': gravity = 'northeast'; break
                case 'bottomleft': gravity = 'southwest'; break
                case 'bottomright': gravity = 'southeast'; break
                default: gravity = 'southeast'
            }
            
            const ffmpegArgs = [
                '-i', inputPath,
                '-vf', `drawtext=text='${watermarkText}':fontsize=${fontSize}:fontcolor=${color}@${opacity}:x=w-tw-10:y=h-th-10`,
                '-y',
                outputPath
            ]
            
            await this.runFFmpeg(ffmpegArgs)
            
            return await fs.readFile(outputPath)
            
        } finally {
            await Promise.all([
                this.cleanupFile(inputPath),
                this.cleanupFile(outputPath)
            ])
        }
    }
    
    async createCollage(buffers, options = {}) {
        if (!Array.isArray(buffers) || buffers.length < 2) {
            throw new Error('Se necesitan al menos 2 imágenes para crear un collage')
        }
        
        const { layout = 'grid' } = options
        const outputPath = this.generateTempPath('png')
        
        try {
            // Guardar todas las imágenes temporalmente
            const inputPaths = []
            for (let i = 0; i < buffers.length; i++) {
                const inputPath = this.generateTempPath(`input_${i}`)
                await fs.writeFile(inputPath, buffers[i])
                inputPaths.push(inputPath)
            }
            
            // Crear collage basado en layout
            let ffmpegArgs
            const halfSize = this.stickerSize / 2
            
            if (buffers.length === 2) {
                // 2 imágenes: lado a lado
                ffmpegArgs = [
                    '-i', inputPaths[0],
                    '-i', inputPaths[1],
                    '-filter_complex', `[0:v]scale=${halfSize}:${this.stickerSize}[v0];[1:v]scale=${halfSize}:${this.stickerSize}[v1];[v0][v1]hstack=inputs=2`,
                    '-y',
                    outputPath
                ]
            } else if (buffers.length === 4) {
                // 4 imágenes: grid 2x2
                ffmpegArgs = [
                    '-i', inputPaths[0],
                    '-i', inputPaths[1],
                    '-i', inputPaths[2],
                    '-i', inputPaths[3],
                    '-filter_complex', `[0:v]scale=${halfSize}:${halfSize}[v0];[1:v]scale=${halfSize}:${halfSize}[v1];[2:v]scale=${halfSize}:${halfSize}[v2];[3:v]scale=${halfSize}:${halfSize}[v3];[v0][v1]hstack[top];[v2][v3]hstack[bottom];[top][bottom]vstack`,
                    '-y',
                    outputPath
                ]
            } else {
                throw new Error('Layout no soportado para esta cantidad de imágenes')
            }
            
            await this.runFFmpeg(ffmpegArgs)
            
            const collageBuffer = await fs.readFile(outputPath)
            
            // Limpiar archivos temporales
            await Promise.all([
                ...inputPaths.map(path => this.cleanupFile(path)),
                this.cleanupFile(outputPath)
            ])
            
            return await this.create(collageBuffer, options)
            
        } catch (error) {
            throw new Error(`Error creando collage: ${error.message}`)
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                           LIMPIEZA AUTOMÁTICA                               │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async cleanup() {
        try {
            const files = await fs.readdir(this.tempDir)
            const oldFiles = files.filter(file => {
                return file.startsWith('sticker_') && 
                       (Date.now() - parseInt(file.split('_')[1]) > 300000) // 5 minutos
            })
            
            await Promise.all(
                oldFiles.map(file => 
                    this.cleanupFile(path.join(this.tempDir, file))
                )
            )
            
            if (oldFiles.length > 0) {
                console.log(chalk.cyan(`𒁈 Sticker: ${oldFiles.length} archivos temporales limpiados`))
            }
            
        } catch (error) {
            console.error(chalk.red('𒁈 Error limpiando archivos de sticker:'), error)
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                              INSTANCIA GLOBAL                               │
// ═══════════════════════════════════════════════════════════════════════════════

const stickerMaker = new AvenixSticker()

// Limpieza automática cada 10 minutos
setInterval(() => {
    stickerMaker.cleanup()
}, 10 * 60 * 1000)

export default stickerMaker
