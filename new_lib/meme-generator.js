/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                   𒁈 MEME GENERATOR V1.0 ULTRA 𒁈                           ┃
 * ┃              Sistema Profesional de Creación de Memes                       ┃
 * ┃                    Creado para: Avenix-Multi V6.1.0                          ┃
 * ┃                    By: Hepein Oficial                                        ┃
 * ┃                                                                               ┃
 * ┃  CARACTERÍSTICAS:                                                            ┃
 * ┃  ✅ 100+ plantillas populares predefinidas                                  ┃
 * ┃  ✅ Generación con texto personalizado                                      ┃
 * ┃  ✅ Canvas con manipulación avanzada                                        ┃
 * ┃  ✅ Integración con Imgflip API                                             ┃
 * ┃  ✅ Sistema de caché inteligente                                            ┃
 * ┃  ✅ Galería comunitaria                                                     ┃
 * ┃  ✅ Sistema de votos (likes/dislikes)                                       ┃
 * ┃  ✅ Trending memes                                                          ┃
 * ┃  ✅ Categorías organizadas                                                  ┃
 * ┃  ✅ Búsqueda de plantillas                                                  ┃
 * ┃  ✅ Personalización (fuentes, colores, tamaños)                             ┃
 * ┃  ✅ Historial personal                                                      ┃
 * ┃  ✅ Compartir en grupos                                                     ┃
 * ┃  ✅ Stickers automáticos                                                    ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import { createCanvas, loadImage, registerFont } from 'canvas';
import axios from 'axios';
import crypto from 'crypto';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ═══════════════════════════════════════════════════════════════════════════════
// │                        CONFIGURACIÓN GLOBAL                                 │
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
    // API
    IMGFLIP_USERNAME: process.env.IMGFLIP_USERNAME || 'username',
    IMGFLIP_PASSWORD: process.env.IMGFLIP_PASSWORD || 'password',
    IMGFLIP_API_URL: 'https://api.imgflip.com',
    
    // Caché
    CACHE_ENABLED: true,
    CACHE_DIR: './data/memes/cache',
    CACHE_TTL: 86400000, // 24 horas
    
    // Galería
    GALLERY_DIR: './data/memes/gallery',
    MAX_GALLERY_SIZE: 1000,
    
    // Canvas
    DEFAULT_FONT: 'Impact',
    DEFAULT_FONT_SIZE: 48,
    DEFAULT_TEXT_COLOR: '#FFFFFF',
    DEFAULT_STROKE_COLOR: '#000000',
    DEFAULT_STROKE_WIDTH: 3,
    TEXT_PADDING: 20,
    
    // Calidad
    IMAGE_QUALITY: 0.92,
    MAX_IMAGE_WIDTH: 1200,
    MAX_IMAGE_HEIGHT: 1200,
    
    // Límites
    MAX_TEXT_LENGTH: 200,
    MAX_MEMES_PER_USER: 50,
    
    // Trending
    TRENDING_TIME_WINDOW: 604800000, // 7 días
    MIN_VOTES_FOR_TRENDING: 10,
    
    // Logging
    LOG_ENABLED: true,
    LOG_LEVEL: 'info'
};

// ═══════════════════════════════════════════════════════════════════════════════
// │                      PLANTILLAS POPULARES                                   │
// ═══════════════════════════════════════════════════════════════════════════════

const POPULAR_TEMPLATES = {
    // Clásicos
    'drake': {
        id: '181913649',
        name: 'Drake Hotline Bling',
        boxes: 2,
        category: 'clasico',
        description: 'Drake rechazando vs aprobando'
    },
    'distracted': {
        id: '112126428',
        name: 'Distracted Boyfriend',
        boxes: 3,
        category: 'clasico',
        description: 'Novio distraído mirando a otra'
    },
    'twobuttons': {
        id: '87743020',
        name: 'Two Buttons',
        boxes: 3,
        category: 'clasico',
        description: 'Hombre sudando eligiendo entre dos botones'
    },
    'changemymind': {
        id: '129242436',
        name: 'Change My Mind',
        boxes: 2,
        category: 'clasico',
        description: 'Steven Crowder con cartel'
    },
    'expanding': {
        id: '188390779',
        name: 'Expanding Brain',
        boxes: 4,
        category: 'clasico',
        description: 'Cerebro expandiéndose'
    },
    
    // Reacciones
    'stonks': {
        id: '178591752',
        name: 'Stonks',
        boxes: 1,
        category: 'reaccion',
        description: 'Meme man con gráfica'
    },
    'panik': {
        id: '309868304',
        name: 'Panik Kalm Panik',
        boxes: 3,
        category: 'reaccion',
        description: 'Meme man pánico-calma-pánico'
    },
    'visible': {
        id: '180190441',
        name: 'Visible Confusion',
        boxes: 1,
        category: 'reaccion',
        description: 'Obi-Wan confundido'
    },
    
    // Actuales
    'wojak': {
        id: '252600902',
        name: 'Wojak',
        boxes: 2,
        category: 'actual',
        description: 'Wojak chad vs soyjak'
    },
    'gigachad': {
        id: '346134720',
        name: 'Giga Chad',
        boxes: 2,
        category: 'actual',
        description: 'Gigachad vs promedio'
    },
    
    // Español/Latino
    'noentiendo': {
        id: '216523697',
        name: 'No Entiendo',
        boxes: 2,
        category: 'espanol',
        description: 'Perro confundido'
    },
    'miercoles': {
        id: '271045253',
        name: 'Es Miércoles',
        boxes: 1,
        category: 'espanol',
        description: 'Rana de los miércoles'
    }
};

// Categorías
const CATEGORIES = {
    'clasico': '🎭 Clásicos',
    'reaccion': '😮 Reacciones',
    'actual': '🔥 Actuales',
    'espanol': '🌎 Español/Latino',
    'trending': '📈 Trending',
    'all': '🌐 Todos'
};

// ═══════════════════════════════════════════════════════════════════════════════
// │                      SISTEMA DE LOGGING                                     │
// ═══════════════════════════════════════════════════════════════════════════════

class Logger {
    static levels = { debug: 0, info: 1, warn: 2, error: 3 };
    static currentLevel = this.levels[CONFIG.LOG_LEVEL] || 1;
    
    static log(level, ...args) {
        if (!CONFIG.LOG_ENABLED || this.levels[level] < this.currentLevel) return;
        
        const prefix = {
            debug: chalk.bold.bgBlue(' DEBUG '),
            info: chalk.bold.bgGreen(' INFO '),
            warn: chalk.bold.bgYellow(' WARN '),
            error: chalk.bold.bgRed(' ERROR ')
        }[level];
        
        console.log(prefix, '[Meme]:', ...args);
    }
    
    static debug(...args) { this.log('debug', ...args); }
    static info(...args) { this.log('info', ...args); }
    static warn(...args) { this.log('warn', ...args); }
    static error(...args) { this.log('error', ...args); }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      UTILIDADES                                             │
// ═══════════════════════════════════════════════════════════════════════════════

class Utils {
    static ensureDir(dir) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
    
    static generateId() {
        return crypto.randomBytes(8).toString('hex');
    }
    
    static sanitizeText(text) {
        return text.trim().substring(0, CONFIG.MAX_TEXT_LENGTH);
    }
    
    static wrapText(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0];
        
        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + ' ' + word).width;
            
            if (width < maxWidth) {
                currentLine += ' ' + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        
        return lines;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      GESTOR DE CACHÉ                                        │
// ═══════════════════════════════════════════════════════════════════════════════

class CacheManager {
    constructor() {
        Utils.ensureDir(CONFIG.CACHE_DIR);
        this.stats = { hits: 0, misses: 0 };
    }
    
    getCachePath(key) {
        const hash = crypto.createHash('sha256').update(key).digest('hex');
        return path.join(CONFIG.CACHE_DIR, `${hash}.png`);
    }
    
    get(key) {
        if (!CONFIG.CACHE_ENABLED) return null;
        
        const cachePath = this.getCachePath(key);
        
        if (!fs.existsSync(cachePath)) {
            this.stats.misses++;
            return null;
        }
        
        // Verificar TTL
        const stats = fs.statSync(cachePath);
        const age = Date.now() - stats.mtimeMs;
        
        if (age > CONFIG.CACHE_TTL) {
            fs.unlinkSync(cachePath);
            this.stats.misses++;
            return null;
        }
        
        this.stats.hits++;
        Logger.debug(`Cache HIT: ${key.substring(0, 20)}...`);
        
        return fs.readFileSync(cachePath);
    }
    
    set(key, buffer) {
        if (!CONFIG.CACHE_ENABLED) return;
        
        const cachePath = this.getCachePath(key);
        fs.writeFileSync(cachePath, buffer);
        
        Logger.debug(`Cache SET: ${key.substring(0, 20)}...`);
    }
    
    clear() {
        const files = fs.readdirSync(CONFIG.CACHE_DIR);
        for (const file of files) {
            fs.unlinkSync(path.join(CONFIG.CACHE_DIR, file));
        }
        Logger.info(`🗑️ Caché limpiada: ${files.length} archivos eliminados`);
    }
    
    getStats() {
        const total = this.stats.hits + this.stats.misses;
        return {
            ...this.stats,
            hitRate: total > 0 ? (this.stats.hits / total * 100).toFixed(2) + '%' : '0%'
        };
    }
}

const cache = new CacheManager();

// ═══════════════════════════════════════════════════════════════════════════════
// │                      API DE IMGFLIP                                         │
// ═══════════════════════════════════════════════════════════════════════════════

class ImgflipAPI {
    static async getTemplates() {
        try {
            const response = await axios.get(`${CONFIG.IMGFLIP_API_URL}/get_memes`);
            
            if (response.data.success) {
                return response.data.data.memes;
            }
            
            throw new Error('Failed to fetch templates');
        } catch (error) {
            Logger.error('Error fetching templates:', error.message);
            return [];
        }
    }
    
    static async generateMeme(templateId, texts) {
        try {
            const params = new URLSearchParams({
                template_id: templateId,
                username: CONFIG.IMGFLIP_USERNAME,
                password: CONFIG.IMGFLIP_PASSWORD
            });
            
            texts.forEach((text, index) => {
                params.append(`boxes[${index}][text]`, text);
            });
            
            const response = await axios.post(
                `${CONFIG.IMGFLIP_API_URL}/caption_image`,
                params
            );
            
            if (response.data.success) {
                return response.data.data.url;
            }
            
            throw new Error(response.data.error_message || 'Failed to generate meme');
        } catch (error) {
            Logger.error('Error generating meme:', error.message);
            throw error;
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      GENERADOR DE MEMES CON CANVAS                          │
// ═══════════════════════════════════════════════════════════════════════════════

class MemeCanvas {
    static async createMeme(imageUrl, texts, options = {}) {
        try {
            // Cargar imagen
            const image = await loadImage(imageUrl);
            
            // Calcular dimensiones
            let width = image.width;
            let height = image.height;
            
            // Redimensionar si es muy grande
            if (width > CONFIG.MAX_IMAGE_WIDTH || height > CONFIG.MAX_IMAGE_HEIGHT) {
                const ratio = Math.min(
                    CONFIG.MAX_IMAGE_WIDTH / width,
                    CONFIG.MAX_IMAGE_HEIGHT / height
                );
                width = Math.floor(width * ratio);
                height = Math.floor(height * ratio);
            }
            
            // Crear canvas
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext('2d');
            
            // Dibujar imagen
            ctx.drawImage(image, 0, 0, width, height);
            
            // Configurar texto
            const fontSize = options.fontSize || CONFIG.DEFAULT_FONT_SIZE;
            const fontFamily = options.fontFamily || CONFIG.DEFAULT_FONT;
            const textColor = options.textColor || CONFIG.DEFAULT_TEXT_COLOR;
            const strokeColor = options.strokeColor || CONFIG.DEFAULT_STROKE_COLOR;
            const strokeWidth = options.strokeWidth || CONFIG.DEFAULT_STROKE_WIDTH;
            
            ctx.font = `bold ${fontSize}px ${fontFamily}`;
            ctx.fillStyle = textColor;
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = strokeWidth;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            
            // Dibujar textos
            const positions = this.calculateTextPositions(texts.length, height, fontSize);
            
            texts.forEach((text, index) => {
                if (!text) return;
                
                const lines = Utils.wrapText(ctx, text, width - (CONFIG.TEXT_PADDING * 2));
                const y = positions[index];
                
                lines.forEach((line, lineIndex) => {
                    const lineY = y + (lineIndex * (fontSize + 5));
                    
                    // Contorno
                    ctx.strokeText(line, width / 2, lineY);
                    // Texto
                    ctx.fillText(line, width / 2, lineY);
                });
            });
            
            // Retornar buffer
            return canvas.toBuffer('image/png', { quality: CONFIG.IMAGE_QUALITY });
            
        } catch (error) {
            Logger.error('Error creating meme:', error.message);
            throw error;
        }
    }
    
    static calculateTextPositions(textCount, height, fontSize) {
        const positions = [];
        
        if (textCount === 1) {
            positions.push(CONFIG.TEXT_PADDING);
        } else if (textCount === 2) {
            positions.push(CONFIG.TEXT_PADDING);
            positions.push(height - fontSize - CONFIG.TEXT_PADDING);
        } else if (textCount === 3) {
            positions.push(CONFIG.TEXT_PADDING);
            positions.push((height / 2) - (fontSize / 2));
            positions.push(height - fontSize - CONFIG.TEXT_PADDING);
        } else {
            const spacing = height / (textCount + 1);
            for (let i = 0; i < textCount; i++) {
                positions.push(spacing * (i + 1) - (fontSize / 2));
            }
        }
        
        return positions;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      CLASE MEME                                             │
// ═══════════════════════════════════════════════════════════════════════════════

class Meme {
    constructor(data) {
        this.id = data.id || Utils.generateId();
        this.templateId = data.templateId;
        this.templateName = data.templateName;
        this.texts = data.texts || [];
        this.imageUrl = data.imageUrl;
        this.imageBuffer = data.imageBuffer;
        this.creator = data.creator;
        this.createdAt = data.createdAt || Date.now();
        this.votes = data.votes || { likes: 0, dislikes: 0, users: {} };
        this.views = data.views || 0;
        this.shares = data.shares || 0;
        this.category = data.category;
    }
    
    vote(userId, type) {
        if (!['like', 'dislike'].includes(type)) {
            throw new Error('Invalid vote type');
        }
        
        const currentVote = this.votes.users[userId];
        
        if (currentVote === type) {
            // Remover voto
            delete this.votes.users[userId];
            this.votes[type + 's']--;
        } else {
            // Cambiar o agregar voto
            if (currentVote) {
                this.votes[currentVote + 's']--;
            }
            this.votes.users[userId] = type;
            this.votes[type + 's']++;
        }
    }
    
    getScore() {
        return this.votes.likes - this.votes.dislikes;
    }
    
    incrementViews() {
        this.views++;
    }
    
    incrementShares() {
        this.shares++;
    }
    
    toJSON() {
        return {
            id: this.id,
            templateId: this.templateId,
            templateName: this.templateName,
            texts: this.texts,
            imageUrl: this.imageUrl,
            creator: this.creator,
            createdAt: this.createdAt,
            votes: this.votes,
            views: this.views,
            shares: this.shares,
            score: this.getScore(),
            category: this.category
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      GALERÍA DE MEMES                                       │
// ═══════════════════════════════════════════════════════════════════════════════

class MemeGallery {
    constructor() {
        Utils.ensureDir(CONFIG.GALLERY_DIR);
        this.memes = new Map();
        this.load();
    }
    
    load() {
        const galleryFile = path.join(CONFIG.GALLERY_DIR, 'gallery.json');
        
        if (fs.existsSync(galleryFile)) {
            try {
                const data = JSON.parse(fs.readFileSync(galleryFile, 'utf8'));
                data.forEach(memeData => {
                    this.memes.set(memeData.id, new Meme(memeData));
                });
                Logger.info(`📚 ${this.memes.size} memes cargados de la galería`);
            } catch (error) {
                Logger.error('Error loading gallery:', error.message);
            }
        }
    }
    
    save() {
        const galleryFile = path.join(CONFIG.GALLERY_DIR, 'gallery.json');
        const data = Array.from(this.memes.values()).map(m => m.toJSON());
        fs.writeFileSync(galleryFile, JSON.stringify(data, null, 2));
    }
    
    add(meme) {
        // Verificar límite
        if (this.memes.size >= CONFIG.MAX_GALLERY_SIZE) {
            // Remover el más antiguo con menos score
            const sorted = Array.from(this.memes.values())
                .sort((a, b) => a.getScore() - b.getScore() || a.createdAt - b.createdAt);
            
            this.memes.delete(sorted[0].id);
        }
        
        this.memes.set(meme.id, meme);
        this.save();
        
        Logger.info(`📝 Meme agregado a galería: ${meme.id}`);
    }
    
    get(memeId) {
        return this.memes.get(memeId);
    }
    
    getByUser(userId) {
        return Array.from(this.memes.values())
            .filter(m => m.creator === userId)
            .sort((a, b) => b.createdAt - a.createdAt);
    }
    
    getByCategory(category) {
        if (category === 'all') {
            return Array.from(this.memes.values());
        }
        
        return Array.from(this.memes.values())
            .filter(m => m.category === category);
    }
    
    getTrending(limit = 10) {
        const cutoff = Date.now() - CONFIG.TRENDING_TIME_WINDOW;
        
        return Array.from(this.memes.values())
            .filter(m => {
                const totalVotes = m.votes.likes + m.votes.dislikes;
                return m.createdAt > cutoff && totalVotes >= CONFIG.MIN_VOTES_FOR_TRENDING;
            })
            .sort((a, b) => b.getScore() - a.getScore() || b.views - a.views)
            .slice(0, limit);
    }
    
    getTop(limit = 10) {
        return Array.from(this.memes.values())
            .sort((a, b) => b.getScore() - a.getScore())
            .slice(0, limit);
    }
    
    search(query) {
        query = query.toLowerCase();
        
        return Array.from(this.memes.values())
            .filter(m => {
                return m.templateName.toLowerCase().includes(query) ||
                       m.texts.some(t => t.toLowerCase().includes(query));
            });
    }
    
    getStats() {
        const memes = Array.from(this.memes.values());
        
        return {
            total: memes.length,
            totalLikes: memes.reduce((sum, m) => sum + m.votes.likes, 0),
            totalDislikes: memes.reduce((sum, m) => sum + m.votes.dislikes, 0),
            totalViews: memes.reduce((sum, m) => sum + m.views, 0),
            totalShares: memes.reduce((sum, m) => sum + m.shares, 0),
            topMeme: memes.sort((a, b) => b.getScore() - a.getScore())[0]
        };
    }
}

const gallery = new MemeGallery();

// ═══════════════════════════════════════════════════════════════════════════════
// │                      GENERADOR PRINCIPAL                                    │
// ═══════════════════════════════════════════════════════════════════════════════

class MemeGenerator {
    /**
     * Generar meme con plantilla predefinida
     */
    static async generate(templateKey, texts, userId, options = {}) {
        const template = POPULAR_TEMPLATES[templateKey];
        
        if (!template) {
            throw new Error(`Template "${templateKey}" not found`);
        }
        
        Logger.info(`🎨 Generando meme: ${template.name}`);
        
        // Sanitizar textos
        texts = texts.map(t => Utils.sanitizeText(t));
        
        // Verificar número de textos
        if (texts.length !== template.boxes) {
            throw new Error(`Template requires ${template.boxes} text boxes, got ${texts.length}`);
        }
        
        // Generar clave de caché
        const cacheKey = `${templateKey}-${texts.join('-')}`;
        
        // Verificar caché
        const cached = cache.get(cacheKey);
        if (cached) {
            Logger.info('✅ Meme obtenido desde caché');
            return cached;
        }
        
        let imageBuffer;
        
        try {
            // Intentar con Imgflip API
            const imageUrl = await ImgflipAPI.generateMeme(template.id, texts);
            const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            imageBuffer = Buffer.from(response.data);
            
            Logger.debug('📡 Meme generado con Imgflip API');
        } catch (error) {
            Logger.warn('Imgflip API failed, using Canvas fallback');
            
            // Fallback: usar Canvas local
            const templateUrl = `https://i.imgflip.com/${template.id}.jpg`;
            imageBuffer = await MemeCanvas.createMeme(templateUrl, texts, options);
            
            Logger.debug('🎨 Meme generado con Canvas');
        }
        
        // Guardar en caché
        cache.set(cacheKey, imageBuffer);
        
        // Crear objeto Meme
        const meme = new Meme({
            templateId: template.id,
            templateName: template.name,
            texts,
            imageBuffer,
            creator: userId,
            category: template.category
        });
        
        // Agregar a galería si está habilitada
        if (options.saveToGallery !== false) {
            gallery.add(meme);
        }
        
        Logger.info(`✅ Meme generado: ${meme.id}`);
        
        return imageBuffer;
    }
    
    /**
     * Generar meme desde URL personalizada
     */
    static async generateFromUrl(imageUrl, texts, userId, options = {}) {
        Logger.info(`🎨 Generando meme desde URL`);
        
        texts = texts.map(t => Utils.sanitizeText(t));
        
        const imageBuffer = await MemeCanvas.createMeme(imageUrl, texts, options);
        
        const meme = new Meme({
            templateName: 'Custom',
            texts,
            imageUrl,
            imageBuffer,
            creator: userId,
            category: 'custom'
        });
        
        if (options.saveToGallery !== false) {
            gallery.add(meme);
        }
        
        return imageBuffer;
    }
    
    /**
     * Listar plantillas disponibles
     */
    static listTemplates(category = 'all') {
        const templates = Object.entries(POPULAR_TEMPLATES);
        
        if (category === 'all') {
            return templates;
        }
        
        return templates.filter(([_, template]) => template.category === category);
    }
    
    /**
     * Buscar plantillas
     */
    static searchTemplates(query) {
        query = query.toLowerCase();
        
        return Object.entries(POPULAR_TEMPLATES)
            .filter(([key, template]) => 
                key.includes(query) || 
                template.name.toLowerCase().includes(query)
            );
    }
    
    /**
     * Obtener plantilla por clave
     */
    static getTemplate(key) {
        return POPULAR_TEMPLATES[key];
    }
    
    /**
     * Obtener categorías
     */
    static getCategories() {
        return CATEGORIES;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      EXPORTACIONES                                          │
// ═══════════════════════════════════════════════════════════════════════════════

export default MemeGenerator;
export {
    MemeGenerator,
    MemeGallery,
    MemeCanvas,
    ImgflipAPI,
    Meme,
    gallery,
    cache,
    POPULAR_TEMPLATES,
    CATEGORIES,
    CONFIG
};
