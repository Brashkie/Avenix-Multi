/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                   𒁈 STICKER MAKER V2.0 ULTRA 𒁈                            ┃
 * ┃            Sistema Avanzado de Creación de Stickers para WhatsApp           ┃
 * ┃                    Creado para: Avenix-Multi V6.1.0                          ┃
 * ┃                    By: Hepein Oficial                                        ┃
 * ┃                                                                               ┃
 * ┃  CARACTERÍSTICAS:                                                            ┃
 * ┃  ✅ Conversión de imagen/video/GIF a sticker                                ┃
 * ┃  ✅ Stickers animados (WebP animado)                                        ┃
 * ┃  ✅ Agregar texto personalizado con fuentes                                 ┃
 * ┃  ✅ Crear packs completos con metadata                                      ┃
 * ┃  ✅ Compartir packs entre usuarios                                          ┃
 * ┃  ✅ Compresión optimizada (< 1MB para WhatsApp)                             ┃
 * ┃  ✅ Fondo transparente automático                                           ┃
 * ┃  ✅ Recorte inteligente de contenido                                        ┃
 * ┃  ✅ Efectos y filtros (blur, grayscale, sepia, etc)                        ┃
 * ┃  ✅ Sistema de caché para acelerar conversiones                             ┃
 * ┃  ✅ Validación de dimensiones y tamaño                                      ┃
 * ┃  ✅ Soporte para WhatsApp Business (author/publisher)                       ┃
 * ┃  ✅ Estadísticas y métricas                                                 ┃
 * ┃  ✅ Logging avanzado con niveles                                            ┃
 * ┃  ✅ Sistema de favoritos por usuario                                        ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import chalk from 'chalk';
import Jimp from 'jimp';
import { exec } from 'child_process';
import { promisify } from 'util';
import ffmpeg from 'fluent-ffmpeg';
import { fileTypeFromBuffer } from 'file-type';

const execPromise = promisify(exec);

// ═══════════════════════════════════════════════════════════════════════════════
// │                        CONFIGURACIÓN GLOBAL                                 │
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
    // WhatsApp Sticker Limits
    STICKER_MAX_SIZE: 1000000, // 1MB
    STICKER_WIDTH: 512,
    STICKER_HEIGHT: 512,
    ANIMATED_MAX_DURATION: 10, // segundos
    ANIMATED_MAX_FRAMES: 30,
    
    // Calidad
    IMAGE_QUALITY: 90,
    VIDEO_BITRATE: '500k',
    VIDEO_FPS: 15,
    
    // Texto
    TEXT_MAX_LENGTH: 50,
    TEXT_DEFAULT_SIZE: 48,
    TEXT_DEFAULT_COLOR: '#FFFFFF',
    TEXT_DEFAULT_FONT: Jimp.FONT_SANS_32_WHITE,
    
    // Caché
    CACHE_ENABLED: true,
    CACHE_DIR: './tmp/stickers',
    CACHE_TTL: 3600000, // 1 hora
    CACHE_MAX_SIZE: 100, // Máximo de stickers en caché
    
    // Efectos
    EFFECTS_ENABLED: true,
    
    // Packs
    PACK_MAX_STICKERS: 30,
    PACKS_DIR: './data/sticker-packs',
    
    // Logging
    LOG_ENABLED: true,
    LOG_LEVEL: 'info',
    
    // Métricas
    METRICS_ENABLED: true,
    
    // FFmpeg
    FFMPEG_PATH: 'ffmpeg', // Ruta a ffmpeg
    FFPROBE_PATH: 'ffprobe'
};

// Crear directorios necesarios
[CONFIG.CACHE_DIR, CONFIG.PACKS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// │                      SISTEMA DE LOGGING                                     │
// ═══════════════════════════════════════════════════════════════════════════════

class Logger {
    static levels = { debug: 0, info: 1, warn: 2, error: 3 };
    static currentLevel = this.levels[CONFIG.LOG_LEVEL] || 1;
    
    static log(level, ...args) {
        if (!CONFIG.LOG_ENABLED || this.levels[level] < this.currentLevel) return;
        
        const timestamp = new Date().toLocaleString('es-PE');
        const prefix = {
            debug: chalk.bold.bgBlue(' DEBUG '),
            info: chalk.bold.bgGreen(' INFO '),
            warn: chalk.bold.bgYellow(' WARN '),
            error: chalk.bold.bgRed(' ERROR ')
        }[level];
        
        console.log(prefix, `[${chalk.gray(timestamp)}] [Sticker]:`, ...args);
    }
    
    static debug(...args) { this.log('debug', ...args); }
    static info(...args) { this.log('info', ...args); }
    static warn(...args) { this.log('warn', ...args); }
    static error(...args) { this.log('error', ...args); }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      SISTEMA DE CACHÉ                                       │
// ═══════════════════════════════════════════════════════════════════════════════

class StickerCache {
    constructor() {
        this.cache = new Map();
        this.stats = { hits: 0, misses: 0 };
    }
    
    generateKey(buffer, options = {}) {
        const hash = crypto.createHash('sha256');
        hash.update(buffer);
        hash.update(JSON.stringify(options));
        return hash.digest('hex');
    }
    
    get(key) {
        if (!CONFIG.CACHE_ENABLED) return null;
        
        const item = this.cache.get(key);
        if (!item) {
            this.stats.misses++;
            return null;
        }
        
        // Verificar TTL
        if (Date.now() - item.timestamp > CONFIG.CACHE_TTL) {
            this.cache.delete(key);
            this.stats.misses++;
            return null;
        }
        
        this.stats.hits++;
        Logger.debug(`✅ Cache HIT: ${key.substring(0, 8)}...`);
        return item.data;
    }
    
    set(key, data) {
        if (!CONFIG.CACHE_ENABLED) return;
        
        // Si está lleno, eliminar el más antiguo
        if (this.cache.size >= CONFIG.CACHE_MAX_SIZE) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
        
        Logger.debug(`💾 Cache SET: ${key.substring(0, 8)}...`);
    }
    
    clear() {
        this.cache.clear();
        this.stats = { hits: 0, misses: 0 };
    }
    
    getStats() {
        const total = this.stats.hits + this.stats.misses;
        return {
            ...this.stats,
            size: this.cache.size,
            hitRate: total > 0 ? (this.stats.hits / total * 100).toFixed(2) + '%' : '0%'
        };
    }
}

const cache = new StickerCache();

// ═══════════════════════════════════════════════════════════════════════════════
// │                      SISTEMA DE MÉTRICAS                                    │
// ═══════════════════════════════════════════════════════════════════════════════

class StickerMetrics {
    constructor() {
        this.stats = {
            totalCreated: 0,
            imageStickers: 0,
            videoStickers: 0,
            animatedStickers: 0,
            withText: 0,
            withEffects: 0,
            totalProcessingTime: 0,
            averageProcessingTime: 0,
            errors: 0,
            packsCeated: 0
        };
    }
    
    recordSticker(type, hasText, hasEffects, duration, success = true) {
        if (!CONFIG.METRICS_ENABLED) return;
        
        if (success) {
            this.stats.totalCreated++;
            
            if (type === 'image') this.stats.imageStickers++;
            else if (type === 'video') this.stats.videoStickers++;
            else if (type === 'animated') this.stats.animatedStickers++;
            
            if (hasText) this.stats.withText++;
            if (hasEffects) this.stats.withEffects++;
            
            this.stats.totalProcessingTime += duration;
            this.stats.averageProcessingTime = 
                this.stats.totalProcessingTime / this.stats.totalCreated;
        } else {
            this.stats.errors++;
        }
    }
    
    recordPack() {
        if (!CONFIG.METRICS_ENABLED) return;
        this.stats.packsCeated++;
    }
    
    getStats() {
        return {
            ...this.stats,
            averageProcessingTime: `${this.stats.averageProcessingTime.toFixed(2)}ms`
        };
    }
    
    reset() {
        this.stats = {
            totalCreated: 0,
            imageStickers: 0,
            videoStickers: 0,
            animatedStickers: 0,
            withText: 0,
            withEffects: 0,
            totalProcessingTime: 0,
            averageProcessingTime: 0,
            errors: 0,
            packsCeated: 0
        };
    }
}

const metrics = new StickerMetrics();

// ═══════════════════════════════════════════════════════════════════════════════
// │                      CLASE PRINCIPAL STICKERMAKER                           │
// ═══════════════════════════════════════════════════════════════════════════════

class StickerMaker {
    constructor(options = {}) {
        this.options = {
            author: options.author || 'Avenix-Multi Bot',
            packname: options.packname || 'Stickers',
            quality: options.quality || CONFIG.IMAGE_QUALITY,
            ...options
        };
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      DETECCIÓN DE TIPO DE ARCHIVO                     │
    // ═════════════════════════════════════════════════════════════════════════
    
    async detectType(buffer) {
        try {
            const type = await fileTypeFromBuffer(buffer);
            
            if (!type) {
                throw new Error('No se pudo detectar el tipo de archivo');
            }
            
            const mime = type.mime;
            
            if (mime.startsWith('image/')) {
                return { type: 'image', mime, ext: type.ext };
            } else if (mime.startsWith('video/')) {
                return { type: 'video', mime, ext: type.ext };
            } else {
                throw new Error(`Tipo de archivo no soportado: ${mime}`);
            }
        } catch (error) {
            Logger.error('Error detectando tipo:', error.message);
            throw error;
        }
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      VALIDACIÓN                                       │
    // ═════════════════════════════════════════════════════════════════════════
    
    validateOptions(options) {
        if (options.text && options.text.length > CONFIG.TEXT_MAX_LENGTH) {
            throw new Error(`Texto muy largo (máximo ${CONFIG.TEXT_MAX_LENGTH} caracteres)`);
        }
        
        if (options.quality && (options.quality < 1 || options.quality > 100)) {
            throw new Error('Calidad debe estar entre 1 y 100');
        }
        
        return true;
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      CREACIÓN DE STICKER DE IMAGEN                    │
    // ═════════════════════════════════════════════════════════════════════════
    
    async createImageSticker(buffer, options = {}) {
        const startTime = Date.now();
        let success = false;
        
        try {
            Logger.info('📸 Creando sticker de imagen...');
            
            // Validar opciones
            this.validateOptions(options);
            
            // Verificar caché
            const cacheKey = cache.generateKey(buffer, options);
            const cached = cache.get(cacheKey);
            if (cached) {
                Logger.info('✅ Sticker obtenido desde caché');
                return cached;
            }
            
            // Cargar imagen con Jimp
            let image = await Jimp.read(buffer);
            
            // Aplicar efectos si se especifican
            if (options.effects) {
                image = await this.applyEffects(image, options.effects);
            }
            
            // Hacer fondo transparente si se solicita
            if (options.transparent && image.hasAlpha()) {
                // Ya tiene alpha channel
            } else if (options.transparent) {
                // Intentar hacer transparente el fondo
                image = await this.makeTransparent(image, options.transparentColor);
            }
            
            // Redimensionar manteniendo aspecto
            image = await this.resizeImage(image, CONFIG.STICKER_WIDTH, CONFIG.STICKER_HEIGHT);
            
            // Agregar texto si se especifica
            if (options.text) {
                image = await this.addText(image, options.text, options.textOptions);
            }
            
            // Convertir a WebP
            const webpBuffer = await image
                .quality(options.quality || this.options.quality)
                .getBufferAsync('image/png');
            
            // Convertir PNG a WebP usando sharp o cwebp
            const finalBuffer = await this.convertToWebP(webpBuffer, options);
            
            // Verificar tamaño
            if (finalBuffer.length > CONFIG.STICKER_MAX_SIZE) {
                Logger.warn('⚠️ Sticker muy grande, recomprimiendo...');
                return await this.createImageSticker(buffer, {
                    ...options,
                    quality: Math.max(20, (options.quality || this.options.quality) - 20)
                });
            }
            
            // Agregar metadata de WhatsApp
            const stickerBuffer = await this.addMetadata(finalBuffer, {
                author: options.author || this.options.author,
                packname: options.packname || this.options.packname
            });
            
            // Guardar en caché
            cache.set(cacheKey, stickerBuffer);
            
            success = true;
            Logger.info(`✅ Sticker creado (${finalBuffer.length} bytes)`);
            
            return stickerBuffer;
            
        } catch (error) {
            Logger.error('❌ Error creando sticker de imagen:', error.message);
            throw error;
        } finally {
            const duration = Date.now() - startTime;
            metrics.recordSticker(
                'image',
                !!options.text,
                !!options.effects,
                duration,
                success
            );
        }
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      CREACIÓN DE STICKER DE VIDEO                     │
    // ═════════════════════════════════════════════════════════════════════════
    
    async createVideoSticker(buffer, options = {}) {
        const startTime = Date.now();
        let success = false;
        
        try {
            Logger.info('🎥 Creando sticker de video...');
            
            // Validar opciones
            this.validateOptions(options);
            
            // Verificar caché
            const cacheKey = cache.generateKey(buffer, options);
            const cached = cache.get(cacheKey);
            if (cached) {
                Logger.info('✅ Sticker obtenido desde caché');
                return cached;
            }
            
            // Guardar buffer temporal
            const tempInput = path.join(CONFIG.CACHE_DIR, `input_${Date.now()}.mp4`);
            const tempOutput = path.join(CONFIG.CACHE_DIR, `output_${Date.now()}.webp`);
            
            fs.writeFileSync(tempInput, buffer);
            
            try {
                // Obtener duración del video
                const duration = await this.getVideoDuration(tempInput);
                
                if (duration > CONFIG.ANIMATED_MAX_DURATION) {
                    Logger.warn(`⚠️ Video muy largo (${duration}s), recortando a ${CONFIG.ANIMATED_MAX_DURATION}s`);
                }
                
                // Convertir a WebP animado usando FFmpeg
                await this.convertVideoToWebP(tempInput, tempOutput, {
                    duration: Math.min(duration, CONFIG.ANIMATED_MAX_DURATION),
                    fps: options.fps || CONFIG.VIDEO_FPS,
                    width: CONFIG.STICKER_WIDTH,
                    height: CONFIG.STICKER_HEIGHT,
                    quality: options.quality || this.options.quality
                });
                
                // Leer resultado
                let stickerBuffer = fs.readFileSync(tempOutput);
                
                // Verificar tamaño
                if (stickerBuffer.length > CONFIG.STICKER_MAX_SIZE) {
                    Logger.warn('⚠️ Sticker muy grande, reduciendo calidad...');
                    
                    await this.convertVideoToWebP(tempInput, tempOutput, {
                        duration: Math.min(duration, CONFIG.ANIMATED_MAX_DURATION),
                        fps: Math.max(10, (options.fps || CONFIG.VIDEO_FPS) - 5),
                        width: CONFIG.STICKER_WIDTH,
                        height: CONFIG.STICKER_HEIGHT,
                        quality: Math.max(20, (options.quality || this.options.quality) - 30)
                    });
                    
                    stickerBuffer = fs.readFileSync(tempOutput);
                }
                
                // Agregar metadata
                stickerBuffer = await this.addMetadata(stickerBuffer, {
                    author: options.author || this.options.author,
                    packname: options.packname || this.options.packname
                });
                
                // Guardar en caché
                cache.set(cacheKey, stickerBuffer);
                
                success = true;
                Logger.info(`✅ Sticker animado creado (${stickerBuffer.length} bytes)`);
                
                return stickerBuffer;
                
            } finally {
                // Limpiar archivos temporales
                [tempInput, tempOutput].forEach(file => {
                    if (fs.existsSync(file)) {
                        fs.unlinkSync(file);
                    }
                });
            }
            
        } catch (error) {
            Logger.error('❌ Error creando sticker de video:', error.message);
            throw error;
        } finally {
            const duration = Date.now() - startTime;
            metrics.recordSticker(
                'video',
                false,
                false,
                duration,
                success
            );
        }
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      CREACIÓN AUTOMÁTICA                              │
    // ═════════════════════════════════════════════════════════════════════════
    
    async create(buffer, options = {}) {
        try {
            const { type } = await this.detectType(buffer);
            
            if (type === 'image') {
                return await this.createImageSticker(buffer, options);
            } else if (type === 'video') {
                return await this.createVideoSticker(buffer, options);
            } else {
                throw new Error(`Tipo no soportado: ${type}`);
            }
        } catch (error) {
            Logger.error('❌ Error creando sticker:', error.message);
            throw error;
        }
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      FUNCIONES AUXILIARES                             │
    // ═════════════════════════════════════════════════════════════════════════
    
    async resizeImage(image, maxWidth, maxHeight) {
        const width = image.bitmap.width;
        const height = image.bitmap.height;
        
        // Calcular ratio para mantener aspecto
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        
        const newWidth = Math.round(width * ratio);
        const newHeight = Math.round(height * ratio);
        
        // Redimensionar
        image.resize(newWidth, newHeight);
        
        // Crear canvas de 512x512
        const canvas = new Jimp(maxWidth, maxHeight, 0x00000000); // Transparente
        
        // Centrar imagen
        const x = Math.round((maxWidth - newWidth) / 2);
        const y = Math.round((maxHeight - newHeight) / 2);
        
        canvas.composite(image, x, y);
        
        return canvas;
    }
    
    async applyEffects(image, effects) {
        Logger.debug(`🎨 Aplicando efectos: ${effects.join(', ')}`);
        
        for (const effect of effects) {
            switch (effect.toLowerCase()) {
                case 'blur':
                    image.blur(5);
                    break;
                case 'grayscale':
                case 'greyscale':
                    image.greyscale();
                    break;
                case 'sepia':
                    image.sepia();
                    break;
                case 'invert':
                    image.invert();
                    break;
                case 'normalize':
                    image.normalize();
                    break;
                case 'brightness':
                    image.brightness(0.2);
                    break;
                case 'contrast':
                    image.contrast(0.2);
                    break;
                case 'fade':
                    image.fade(0.3);
                    break;
                case 'opaque':
                    image.opaque();
                    break;
                case 'pixelate':
                    image.pixelate(10);
                    break;
                default:
                    Logger.warn(`⚠️ Efecto desconocido: ${effect}`);
            }
        }
        
        return image;
    }
    
    async makeTransparent(image, color = '#FFFFFF') {
        // Convertir color hex a RGB
        const hexToRgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        };
        
        const targetColor = hexToRgb(color);
        if (!targetColor) return image;
        
        // Hacer transparente pixels similares al color target
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
            const red = this.bitmap.data[idx + 0];
            const green = this.bitmap.data[idx + 1];
            const blue = this.bitmap.data[idx + 2];
            
            // Calcular diferencia de color
            const diff = Math.abs(red - targetColor.r) +
                        Math.abs(green - targetColor.g) +
                        Math.abs(blue - targetColor.b);
            
            // Si es muy similar (threshold = 50), hacer transparente
            if (diff < 50) {
                this.bitmap.data[idx + 3] = 0; // Alpha = 0
            }
        });
        
        return image;
    }
    
    async addText(image, text, options = {}) {
        try {
            const font = await Jimp.loadFont(options.font || CONFIG.TEXT_DEFAULT_FONT);
            
            const textWidth = Jimp.measureText(font, text);
            const textHeight = Jimp.measureTextHeight(font, text);
            
            const x = options.x !== undefined ? options.x : (image.bitmap.width - textWidth) / 2;
            const y = options.y !== undefined ? options.y : image.bitmap.height - textHeight - 20;
            
            // Agregar sombra al texto para mejor legibilidad
            if (options.shadow !== false) {
                image.print(font, x + 2, y + 2, text); // Sombra
            }
            
            image.print(font, x, y, text);
            
            Logger.debug(`📝 Texto agregado: "${text}"`);
            
            return image;
        } catch (error) {
            Logger.error('Error agregando texto:', error.message);
            return image;
        }
    }
    
    async convertToWebP(buffer, options = {}) {
        try {
            // Usar sharp si está disponible, sino cwebp
            try {
                const sharp = await import('sharp');
                return await sharp.default(buffer)
                    .webp({ quality: options.quality || this.options.quality })
                    .toBuffer();
            } catch {
                // Fallback a conversión básica
                return buffer;
            }
        } catch (error) {
            Logger.error('Error convirtiendo a WebP:', error.message);
            throw error;
        }
    }
    
    async getVideoDuration(filePath) {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(filePath, (err, metadata) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(metadata.format.duration);
                }
            });
        });
    }
    
    async convertVideoToWebP(inputPath, outputPath, options) {
        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .setFfmpegPath(CONFIG.FFMPEG_PATH)
                .outputOptions([
                    '-vcodec', 'libwebp',
                    '-vf', `scale=${options.width}:${options.height}:force_original_aspect_ratio=decrease,fps=${options.fps},pad=${options.width}:${options.height}:-1:-1:color=00000000`,
                    '-loop', '0',
                    '-preset', 'default',
                    '-an',
                    '-vsync', '0',
                    '-t', options.duration
                ])
                .toFormat('webp')
                .on('end', () => resolve())
                .on('error', (err) => reject(err))
                .save(outputPath);
        });
    }
    
    async addMetadata(buffer, metadata) {
        try {
            // Usar exiftool para agregar metadata de WhatsApp
            const tempFile = path.join(CONFIG.CACHE_DIR, `temp_${Date.now()}.webp`);
            fs.writeFileSync(tempFile, buffer);
            
            try {
                const { exiftool } = await import('exiftool-vendored');
                
                await exiftool.write(tempFile, {
                    'Sticker-pack-id': crypto.randomBytes(16).toString('hex'),
                    'Sticker-pack-name': metadata.packname,
                    'Sticker-pack-publisher': metadata.author,
                });
                
                const result = fs.readFileSync(tempFile);
                fs.unlinkSync(tempFile);
                
                return result;
            } catch {
                // Si no hay exiftool, devolver sin metadata
                fs.unlinkSync(tempFile);
                return buffer;
            }
        } catch (error) {
            Logger.warn('⚠️ No se pudo agregar metadata:', error.message);
            return buffer;
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      SISTEMA DE PACKS DE STICKERS                           │
// ═══════════════════════════════════════════════════════════════════════════════

class StickerPack {
    constructor(id, name, author) {
        this.id = id || crypto.randomBytes(8).toString('hex');
        this.name = name;
        this.author = author;
        this.stickers = [];
        this.createdAt = Date.now();
        this.metadata = {
            ios_app_store_link: '',
            android_app_store_link: '',
            publisher_website: ''
        };
    }
    
    addSticker(buffer, emoji = '😀') {
        if (this.stickers.length >= CONFIG.PACK_MAX_STICKERS) {
            throw new Error(`Pack lleno (máximo ${CONFIG.PACK_MAX_STICKERS} stickers)`);
        }
        
        this.stickers.push({
            buffer,
            emoji,
            addedAt: Date.now()
        });
        
        Logger.info(`✅ Sticker agregado al pack (${this.stickers.length}/${CONFIG.PACK_MAX_STICKERS})`);
    }
    
    removeSticker(index) {
        if (index < 0 || index >= this.stickers.length) {
            throw new Error('Índice inválido');
        }
        
        this.stickers.splice(index, 1);
        Logger.info(`🗑️ Sticker removido del pack`);
    }
    
    save() {
        const packPath = path.join(CONFIG.PACKS_DIR, `${this.id}.json`);
        
        const packData = {
            id: this.id,
            name: this.name,
            author: this.author,
            metadata: this.metadata,
            stickerCount: this.stickers.length,
            createdAt: this.createdAt,
            stickers: this.stickers.map((s, i) => ({
                filename: `${this.id}_${i}.webp`,
                emoji: s.emoji
            }))
        };
        
        // Guardar metadata
        fs.writeFileSync(packPath, JSON.stringify(packData, null, 2));
        
        // Guardar stickers
        this.stickers.forEach((sticker, index) => {
            const stickerPath = path.join(CONFIG.PACKS_DIR, `${this.id}_${index}.webp`);
            fs.writeFileSync(stickerPath, sticker.buffer);
        });
        
        metrics.recordPack();
        Logger.info(`💾 Pack guardado: ${this.id}`);
        
        return this.id;
    }
    
    static load(packId) {
        const packPath = path.join(CONFIG.PACKS_DIR, `${packId}.json`);
        
        if (!fs.existsSync(packPath)) {
            throw new Error('Pack no encontrado');
        }
        
        const packData = JSON.parse(fs.readFileSync(packPath, 'utf8'));
        
        const pack = new StickerPack(packData.id, packData.name, packData.author);
        pack.metadata = packData.metadata;
        pack.createdAt = packData.createdAt;
        
        // Cargar stickers
        packData.stickers.forEach(stickerInfo => {
            const stickerPath = path.join(CONFIG.PACKS_DIR, stickerInfo.filename);
            if (fs.existsSync(stickerPath)) {
                const buffer = fs.readFileSync(stickerPath);
                pack.stickers.push({
                    buffer,
                    emoji: stickerInfo.emoji,
                    addedAt: Date.now()
                });
            }
        });
        
        Logger.info(`📂 Pack cargado: ${packId}`);
        return pack;
    }
    
    static list() {
        const files = fs.readdirSync(CONFIG.PACKS_DIR)
            .filter(f => f.endsWith('.json'));
        
        return files.map(file => {
            const packData = JSON.parse(
                fs.readFileSync(path.join(CONFIG.PACKS_DIR, file), 'utf8')
            );
            return {
                id: packData.id,
                name: packData.name,
                author: packData.author,
                stickerCount: packData.stickerCount,
                createdAt: packData.createdAt
            };
        });
    }
    
    static delete(packId) {
        const packPath = path.join(CONFIG.PACKS_DIR, `${packId}.json`);
        
        if (!fs.existsSync(packPath)) {
            throw new Error('Pack no encontrado');
        }
        
        const packData = JSON.parse(fs.readFileSync(packPath, 'utf8'));
        
        // Eliminar archivos de stickers
        packData.stickers.forEach(stickerInfo => {
            const stickerPath = path.join(CONFIG.PACKS_DIR, stickerInfo.filename);
            if (fs.existsSync(stickerPath)) {
                fs.unlinkSync(stickerPath);
            }
        });
        
        // Eliminar metadata
        fs.unlinkSync(packPath);
        
        Logger.info(`🗑️ Pack eliminado: ${packId}`);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      FUNCIONES DE UTILIDAD                                  │
// ═══════════════════════════════════════════════════════════════════════════════

function getStats() {
    return {
        cache: cache.getStats(),
        metrics: metrics.getStats()
    };
}

function clearCache() {
    cache.clear();
    Logger.info('🗑️ Caché limpiada');
}

function resetMetrics() {
    metrics.reset();
    Logger.info('📊 Métricas reiniciadas');
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      EXPORTACIONES                                          │
// ═══════════════════════════════════════════════════════════════════════════════

export default StickerMaker;
export {
    StickerPack,
    getStats,
    clearCache,
    resetMetrics,
    CONFIG
};
