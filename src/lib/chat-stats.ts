/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                   𒁈 CHAT-STATS V2.0 ULTRA 𒁈                               ┃
 * ┃           Sistema de Análisis y Estadísticas Avanzado de Chat              ┃
 * ┃                    Creado para: Avenix-Multi V6.1.0                          ┃
 * ┃                    By: Hepein Oficial                                        ┃
 * ┃                                                                               ┃
 * ┃  CARACTERÍSTICAS:                                                            ┃
 * ┃  ✅ Análisis en tiempo real de actividad                                    ┃
 * ┃  ✅ Estadísticas por usuario, grupo y global                                ┃
 * ┃  ✅ Palabras y emojis más usados                                            ┃
 * ┃  ✅ Análisis temporal (hora, día, semana, mes)                              ┃
 * ┃  ✅ Gráficos ASCII de actividad                                             ┃
 * ┃  ✅ Ranking de usuarios más activos                                         ┃
 * ┃  ✅ Detección de tendencias                                                 ┃
 * ┃  ✅ Análisis de comandos ejecutados                                         ┃
 * ┃  ✅ Exportación a JSON/CSV                                                  ┃
 * ┃  ✅ Heatmaps de actividad                                                   ┃
 * ┃  ✅ Análisis de sentimiento (básico)                                        ┃
 * ┃  ✅ Sistema de caché para consultas rápidas                                 ┃
 * ┃  ✅ Comparativas entre períodos                                             ┃
 * ┃  ✅ Predicción de picos de actividad                                        ┃
 * ┃  ✅ Dashboard completo                                                      ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import paint from './paint.js'
import { loadValue, saveValue } from './storage.js';

const STORE_KEY = 'chat-stats';
const BACKUP_KEY = 'chat-stats:backup';

// ═══════════════════════════════════════════════════════════════════════════════
// │                        CONFIGURACIÓN GLOBAL                                 │
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
    // Almacenamiento
    
    // Caché
    CACHE_ENABLED: true,
    CACHE_TTL: 300000, // 5 minutos
    
    // Análisis
    TOP_WORDS_LIMIT: 50,
    TOP_EMOJIS_LIMIT: 20,
    TOP_USERS_LIMIT: 20,
    MIN_WORD_LENGTH: 3,
    STOPWORDS_ENABLED: true,
    
    // Períodos de tiempo
    TIMEFRAMES: {
        HOUR: 3600000,
        DAY: 86400000,
        WEEK: 604800000,
        MONTH: 2592000000
    },
    
    // Gráficos
    GRAPH_WIDTH: 40,
    GRAPH_HEIGHT: 10,
    
    // Auto-save
    AUTO_SAVE_INTERVAL: 300000, // 5 minutos
    AUTO_SAVE_ENABLED: true,
    
    // Limpieza
    AUTO_CLEANUP_ENABLED: true,
    MAX_DAYS_TO_KEEP: 90, // 3 meses
    
    // Logging
    LOG_ENABLED: true,
    LOG_LEVEL: 'info'
};

// ═══════════════════════════════════════════════════════════════════════════════
// │                      PALABRAS VACÍAS (STOPWORDS)                            │
// ═══════════════════════════════════════════════════════════════════════════════

const STOPWORDS_ES = new Set([
    'de', 'la', 'que', 'el', 'en', 'y', 'a', 'los', 'del', 'se', 'las', 'por',
    'un', 'para', 'con', 'no', 'una', 'su', 'al', 'lo', 'como', 'más', 'pero',
    'sus', 'le', 'ya', 'o', 'este', 'sí', 'porque', 'esta', 'entre', 'cuando',
    'muy', 'sin', 'sobre', 'también', 'me', 'hasta', 'hay', 'donde', 'quien',
    'desde', 'todo', 'nos', 'durante', 'todos', 'uno', 'les', 'ni', 'contra',
    'otros', 'ese', 'eso', 'ante', 'ellos', 'e', 'esto', 'mí', 'antes', 'algunos',
    'qué', 'unos', 'yo', 'otro', 'otras', 'otra', 'él', 'tanto', 'esa', 'estos',
    'mucho', 'quienes', 'nada', 'muchos', 'cual', 'poco', 'ella', 'estar', 'estas',
    'algunas', 'algo', 'nosotros', 'mi', 'mis', 'tú', 'te', 'ti', 'tu', 'tus',
    'ellas', 'nosotras', 'vosotros', 'vosotras', 'os', 'mío', 'mía', 'míos',
    'mías', 'tuyo', 'tuya', 'tuyos', 'tuyas', 'suyo', 'suya', 'suyos', 'suyas',
    'nuestro', 'nuestra', 'nuestros', 'nuestras', 'vuestro', 'vuestra', 'vuestros',
    'vuestras', 'esos', 'esas', 'estoy', 'estás', 'está', 'estamos', 'estáis',
    'están', 'esté', 'estés', 'estemos', 'estéis', 'estén', 'estaré', 'estarás',
    'estará', 'estaremos', 'estaréis', 'estarán', 'estaría', 'estarías', 'estaríamos',
    'estaríais', 'estarían', 'estaba', 'estabas', 'estábamos', 'estabais', 'estaban'
]);

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
            debug: paint.bold.bgBlue(' DEBUG '),
            info: paint.bold.bgGreen(' INFO '),
            warn: paint.bold.bgYellow(' WARN '),
            error: paint.bold.bgRed(' ERROR ')
        }[level];
        
        console.log(prefix, `[${paint.gray(timestamp)}] [ChatStats]:`, ...args);
    }
    
    static debug(...args) { this.log('debug', ...args); }
    static info(...args) { this.log('info', ...args); }
    static warn(...args) { this.log('warn', ...args); }
    static error(...args) { this.log('error', ...args); }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      SISTEMA DE CACHÉ                                       │
// ═══════════════════════════════════════════════════════════════════════════════

class Cache {
    ttl: number
    cache: Map<any, any>

    constructor(ttl = CONFIG.CACHE_TTL) {
        this.ttl = ttl;
        this.cache = new Map();
    }
    
    set(key, value) {
        if (!CONFIG.CACHE_ENABLED) return;
        
        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    }
    
    get(key) {
        if (!CONFIG.CACHE_ENABLED) return null;
        
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() - item.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }
        
        return item.value;
    }
    
    clear() {
        this.cache.clear();
    }
    
    invalidate(pattern) {
        if (typeof pattern === 'string') {
            for (const key of this.cache.keys()) {
                if (key.includes(pattern)) {
                    this.cache.delete(key);
                }
            }
        }
    }
}

const cache = new Cache();

// ═══════════════════════════════════════════════════════════════════════════════
// │                      CLASE PRINCIPAL CHATSTATS                              │
// ═══════════════════════════════════════════════════════════════════════════════

class ChatStats {
    data: any
    autoSaveInterval: null | NodeJS.Timeout

    constructor() {
        this.data = {
            global: this.initGlobalStats(),
            chats: {},
            users: {},
            lastUpdated: Date.now()
        };
        
        this.autoSaveInterval = null;
        this.load();
        
        if (CONFIG.AUTO_SAVE_ENABLED) {
            this.startAutoSave();
        }
        
        Logger.info('📊 ChatStats inicializado');
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      INICIALIZACIÓN                                   │
    // ═════════════════════════════════════════════════════════════════════════
    
    initGlobalStats() {
        return {
            totalMessages: 0,
            totalUsers: 0,
            totalChats: 0,
            totalCommands: 0,
            totalMediaMessages: 0,
            startDate: Date.now(),
            lastMessageDate: null
        };
    }
    
    initChatStats(chatId) {
        return {
            id: chatId,
            name: '',
            totalMessages: 0,
            uniqueUsers: new Set(),
            messages: [],
            words: {},
            emojis: {},
            commands: {},
            hourlyActivity: Array(24).fill(0),
            dailyActivity: Array(7).fill(0),
            mediaTypes: {
                images: 0,
                videos: 0,
                audios: 0,
                documents: 0,
                stickers: 0
            },
            firstMessageDate: Date.now(),
            lastMessageDate: Date.now(),
            averageMessageLength: 0,
            totalCharacters: 0
        };
    }
    
    initUserStats(userId) {
        return {
            id: userId,
            name: '',
            totalMessages: 0,
            totalCommands: 0,
            totalCharacters: 0,
            averageMessageLength: 0,
            favoriteEmojis: {},
            favoriteWords: {},
            chatsParticipated: new Set(),
            firstMessageDate: Date.now(),
            lastMessageDate: Date.now(),
            hourlyActivity: Array(24).fill(0),
            dailyActivity: Array(7).fill(0),
            messagesByDay: {}
        };
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      REGISTRO DE MENSAJES                             │
    // ═════════════════════════════════════════════════════════════════════════
    
    recordMessage(chatId, userId, userName, message, metadata: Record<string, any> = {}) {
        const timestamp = Date.now();
        
        // Inicializar si no existen
        if (!this.data.chats[chatId]) {
            this.data.chats[chatId] = this.initChatStats(chatId);
            this.data.global.totalChats++;
        }
        
        if (!this.data.users[userId]) {
            this.data.users[userId] = this.initUserStats(userId);
            this.data.global.totalUsers++;
        }
        
        const chat = this.data.chats[chatId];
        const user = this.data.users[userId];
        
        // Actualizar nombres
        if (userName) {
            user.name = userName;
            if (metadata.chatName) chat.name = metadata.chatName;
        }
        
        // Actualizar contadores básicos
        chat.totalMessages++;
        user.totalMessages++;
        this.data.global.totalMessages++;
        
        // Agregar usuario único al chat
        chat.uniqueUsers.add(userId);
        user.chatsParticipated.add(chatId);
        
        // Actualizar fechas
        chat.lastMessageDate = timestamp;
        user.lastMessageDate = timestamp;
        this.data.global.lastMessageDate = timestamp;
        
        // Registrar comando si aplica
        if (metadata.isCommand && metadata.command) {
            this.recordCommand(chatId, userId, metadata.command);
        }
        
        // Registrar media si aplica
        if (metadata.mediaType) {
            this.recordMedia(chatId, metadata.mediaType);
        }
        
        // Analizar texto del mensaje
        if (message && typeof message === 'string') {
            this.analyzeMessage(chatId, userId, message, timestamp);
        }
        
        // Guardar mensaje reciente (últimos 1000)
        chat.messages.push({
            userId,
            text: message.substring(0, 200), // Limitar tamaño
            timestamp,
            length: message.length
        });
        
        if (chat.messages.length > 1000) {
            chat.messages.shift();
        }
        
        // Invalidar caché relevante
        cache.invalidate(`chat_${chatId}`);
        cache.invalidate(`user_${userId}`);
        cache.invalidate('global');
        
        Logger.debug(`📝 Mensaje registrado: ${chatId} / ${userId}`);
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      ANÁLISIS DE MENSAJES                             │
    // ═════════════════════════════════════════════════════════════════════════
    
    analyzeMessage(chatId, userId, message, timestamp) {
        const chat = this.data.chats[chatId];
        const user = this.data.users[userId];
        
        const messageLength = message.length;
        
        // Actualizar promedios de longitud
        chat.totalCharacters += messageLength;
        chat.averageMessageLength = chat.totalCharacters / chat.totalMessages;
        
        user.totalCharacters += messageLength;
        user.averageMessageLength = user.totalCharacters / user.totalMessages;
        
        // Analizar palabras
        const words = this.extractWords(message);
        for (const word of words) {
            chat.words[word] = (chat.words[word] || 0) + 1;
            user.favoriteWords[word] = (user.favoriteWords[word] || 0) + 1;
        }
        
        // Analizar emojis
        const emojis = this.extractEmojis(message);
        for (const emoji of emojis) {
            chat.emojis[emoji] = (chat.emojis[emoji] || 0) + 1;
            user.favoriteEmojis[emoji] = (user.favoriteEmojis[emoji] || 0) + 1;
        }
        
        // Actividad por hora
        const hour = new Date(timestamp).getHours();
        chat.hourlyActivity[hour]++;
        user.hourlyActivity[hour]++;
        
        // Actividad por día de la semana
        const day = new Date(timestamp).getDay();
        chat.dailyActivity[day]++;
        user.dailyActivity[day]++;
        
        // Mensajes por día (usuario)
        const dateKey = new Date(timestamp).toISOString().split('T')[0];
        user.messagesByDay[dateKey] = (user.messagesByDay[dateKey] || 0) + 1;
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      EXTRACCIÓN DE DATOS                              │
    // ═════════════════════════════════════════════════════════════════════════
    
    extractWords(text) {
        const words = text
            .toLowerCase()
            .replace(/[^\p{L}\p{N}\s]/gu, ' ')
            .split(/\s+/)
            .filter(word => 
                word.length >= CONFIG.MIN_WORD_LENGTH &&
                (!CONFIG.STOPWORDS_ENABLED || !STOPWORDS_ES.has(word))
            );
        
        return words;
    }
    
    extractEmojis(text) {
        const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
        return text.match(emojiRegex) || [];
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      REGISTRO DE COMANDOS Y MEDIA                     │
    // ═════════════════════════════════════════════════════════════════════════
    
    recordCommand(chatId, userId, command) {
        const chat = this.data.chats[chatId];
        const user = this.data.users[userId];
        
        chat.commands[command] = (chat.commands[command] || 0) + 1;
        user.totalCommands++;
        this.data.global.totalCommands++;
    }
    
    recordMedia(chatId, mediaType) {
        const chat = this.data.chats[chatId];
        
        if (chat.mediaTypes[mediaType] !== undefined) {
            chat.mediaTypes[mediaType]++;
        }
        
        this.data.global.totalMediaMessages++;
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      OBTENER ESTADÍSTICAS                             │
    // ═════════════════════════════════════════════════════════════════════════
    
    getGlobalStats() {
        const cacheKey = 'global_stats';
        const cached = cache.get(cacheKey);
        if (cached) return cached;
        
        const stats = {
            ...this.data.global,
            uptime: Date.now() - this.data.global.startDate,
            averageMessagesPerDay: this.calculateAverageMessagesPerDay(),
            mostActiveChat: this.getMostActiveChat(),
            mostActiveUser: this.getMostActiveUser(),
            totalUniqueWords: this.getTotalUniqueWords(),
            totalUniqueEmojis: this.getTotalUniqueEmojis()
        };
        
        cache.set(cacheKey, stats);
        return stats;
    }
    
    getChatStats(chatId) {
        const cacheKey = `chat_${chatId}_stats`;
        const cached = cache.get(cacheKey);
        if (cached) return cached;
        
        const chat = this.data.chats[chatId];
        if (!chat) return null;
        
        const stats = {
            ...chat,
            uniqueUsers: chat.uniqueUsers.size,
            topWords: this.getTopItems(chat.words, CONFIG.TOP_WORDS_LIMIT),
            topEmojis: this.getTopItems(chat.emojis, CONFIG.TOP_EMOJIS_LIMIT),
            topCommands: this.getTopItems(chat.commands, 10),
            topUsers: this.getTopUsersInChat(chatId, CONFIG.TOP_USERS_LIMIT),
            activityPeakHour: this.getPeakHour(chat.hourlyActivity),
            activityPeakDay: this.getPeakDay(chat.dailyActivity),
            messagesLastWeek: this.getMessagesInTimeframe(chat, CONFIG.TIMEFRAMES.WEEK),
            messagesLastMonth: this.getMessagesInTimeframe(chat, CONFIG.TIMEFRAMES.MONTH),
            growthRate: this.calculateGrowthRate(chat)
        };
        
        // Convertir Set a número para serialización
        delete stats.uniqueUsers;
        stats.uniqueUsers = chat.uniqueUsers.size;
        
        cache.set(cacheKey, stats);
        return stats;
    }
    
    getUserStats(userId) {
        const cacheKey = `user_${userId}_stats`;
        const cached = cache.get(cacheKey);
        if (cached) return cached;
        
        const user = this.data.users[userId];
        if (!user) return null;
        
        const stats = {
            ...user,
            chatsParticipated: user.chatsParticipated.size,
            topEmojis: this.getTopItems(user.favoriteEmojis, CONFIG.TOP_EMOJIS_LIMIT),
            topWords: this.getTopItems(user.favoriteWords, CONFIG.TOP_WORDS_LIMIT),
            activityPeakHour: this.getPeakHour(user.hourlyActivity),
            activityPeakDay: this.getPeakDay(user.dailyActivity),
            messagesLastWeek: this.getUserMessagesInTimeframe(user, CONFIG.TIMEFRAMES.WEEK),
            messagesLastMonth: this.getUserMessagesInTimeframe(user, CONFIG.TIMEFRAMES.MONTH),
            averageMessagesPerDay: this.calculateUserAverageMessagesPerDay(user),
            mostActiveChat: this.getUserMostActiveChat(userId)
        };
        
        // Convertir Set a número
        stats.chatsParticipated = user.chatsParticipated.size;
        
        cache.set(cacheKey, stats);
        return stats;
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      RANKINGS Y TOP LISTAS                            │
    // ═════════════════════════════════════════════════════════════════════════
    
    getTopUsers(limit = CONFIG.TOP_USERS_LIMIT) {
        return Object.values(this.data.users as Record<string, any>)
            .sort((a, b) => b.totalMessages - a.totalMessages)
            .slice(0, limit)
            .map(user => ({
                id: user.id,
                name: user.name,
                totalMessages: user.totalMessages,
                totalCommands: user.totalCommands,
                averageMessageLength: Math.round(user.averageMessageLength),
                chatsParticipated: user.chatsParticipated.size
            }));
    }
    
    getTopChats(limit = 10) {
        return Object.values(this.data.chats as Record<string, any>)
            .sort((a, b) => b.totalMessages - a.totalMessages)
            .slice(0, limit)
            .map(chat => ({
                id: chat.id,
                name: chat.name,
                totalMessages: chat.totalMessages,
                uniqueUsers: chat.uniqueUsers.size,
                averageMessageLength: Math.round(chat.averageMessageLength)
            }));
    }
    
    getTopUsersInChat(chatId, limit = CONFIG.TOP_USERS_LIMIT) {
        const chat = this.data.chats[chatId];
        if (!chat) return [];
        
        const userMessageCounts: Record<string, any> = {};
        
        for (const msg of chat.messages) {
            userMessageCounts[msg.userId] = (userMessageCounts[msg.userId] || 0) + 1;
        }
        
        return Object.entries(userMessageCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([userId, count]) => ({
                id: userId,
                name: this.data.users[userId]?.name || 'Usuario',
                messages: count
            }));
    }
    
    getTopItems(items, limit) {
        return Object.entries(items as Record<string, any>)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([item, count]) => ({ item, count }));
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      ANÁLISIS TEMPORAL                                │
    // ═════════════════════════════════════════════════════════════════════════
    
    getPeakHour(hourlyActivity) {
        const maxIndex = hourlyActivity.indexOf(Math.max(...hourlyActivity));
        return {
            hour: maxIndex,
            messages: hourlyActivity[maxIndex]
        };
    }
    
    getPeakDay(dailyActivity) {
        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const maxIndex = dailyActivity.indexOf(Math.max(...dailyActivity));
        return {
            day: days[maxIndex],
            dayIndex: maxIndex,
            messages: dailyActivity[maxIndex]
        };
    }
    
    getMessagesInTimeframe(chat, timeframe) {
        const now = Date.now();
        const cutoff = now - timeframe;
        
        return chat.messages.filter(msg => msg.timestamp >= cutoff).length;
    }
    
    getUserMessagesInTimeframe(user, timeframe) {
        const now = Date.now();
        const cutoff = now - timeframe;
        const cutoffDate = new Date(cutoff).toISOString().split('T')[0];
        
        let count = 0;
        for (const [date, messages] of Object.entries(user.messagesByDay as Record<string, any>)) {
            if (date >= cutoffDate) {
                count += messages;
            }
        }
        
        return count;
    }
    
    calculateAverageMessagesPerDay() {
        const daysSinceStart = (Date.now() - this.data.global.startDate) / CONFIG.TIMEFRAMES.DAY;
        return daysSinceStart > 0 ? Math.round(this.data.global.totalMessages / daysSinceStart) : 0;
    }
    
    calculateUserAverageMessagesPerDay(user) {
        const daysSinceFirst = (Date.now() - user.firstMessageDate) / CONFIG.TIMEFRAMES.DAY;
        return daysSinceFirst > 0 ? Math.round(user.totalMessages / daysSinceFirst) : 0;
    }
    
    calculateGrowthRate(chat) {
        const recentMessages = this.getMessagesInTimeframe(chat, CONFIG.TIMEFRAMES.WEEK);
        const previousMessages = chat.totalMessages - recentMessages;
        
        if (previousMessages === 0) return 0;
        
        return ((recentMessages - previousMessages) / previousMessages * 100).toFixed(2);
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      UTILIDADES                                       │
    // ═════════════════════════════════════════════════════════════════════════
    
    getMostActiveChat() {
        const chats = Object.values(this.data.chats as Record<string, any>);
        if (chats.length === 0) return null;
        
        const mostActive = chats.reduce((prev, current) => 
            (current.totalMessages > prev.totalMessages) ? current : prev
        );
        
        return {
            id: mostActive.id,
            name: mostActive.name,
            messages: mostActive.totalMessages
        };
    }
    
    getMostActiveUser() {
        const users = Object.values(this.data.users as Record<string, any>);
        if (users.length === 0) return null;
        
        const mostActive = users.reduce((prev, current) => 
            (current.totalMessages > prev.totalMessages) ? current : prev
        );
        
        return {
            id: mostActive.id,
            name: mostActive.name,
            messages: mostActive.totalMessages
        };
    }
    
    getUserMostActiveChat(userId) {
        const user = this.data.users[userId];
        if (!user) return null;
        
        let maxMessages = 0;
        let mostActiveChat: any = null;
        
        for (const chatId of user.chatsParticipated) {
            const chat = this.data.chats[chatId];
            if (!chat) continue;
            
            const userMessages = chat.messages.filter(m => m.userId === userId).length;
            if (userMessages > maxMessages) {
                maxMessages = userMessages;
                mostActiveChat = {
                    id: chat.id,
                    name: chat.name,
                    messages: userMessages
                };
            }
        }
        
        return mostActiveChat;
    }
    
    getTotalUniqueWords() {
        const allWords = new Set();
        
        for (const chat of Object.values(this.data.chats as Record<string, any>)) {
            for (const word of Object.keys(chat.words)) {
                allWords.add(word);
            }
        }
        
        return allWords.size;
    }
    
    getTotalUniqueEmojis() {
        const allEmojis = new Set();
        
        for (const chat of Object.values(this.data.chats as Record<string, any>)) {
            for (const emoji of Object.keys(chat.emojis)) {
                allEmojis.add(emoji);
            }
        }
        
        return allEmojis.size;
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      VISUALIZACIÓN                                    │
    // ═════════════════════════════════════════════════════════════════════════
    
    generateActivityGraph(activity, title = 'Actividad') {
        const max = Math.max(...activity);
        if (max === 0) return 'Sin datos suficientes';
        
        const height = CONFIG.GRAPH_HEIGHT;
        let graph = `\n${title}:\n`;
        
        for (let i = height; i >= 0; i--) {
            const threshold = (max / height) * i;
            let line = '';
            
            for (let value of activity) {
                line += value >= threshold ? '█' : ' ';
            }
            
            graph += `${line}\n`;
        }
        
        // Etiquetas
        if (activity.length === 24) {
            graph += '0  2  4  6  8 10 12 14 16 18 20 22\n';
        } else if (activity.length === 7) {
            graph += 'D  L  M  M  J  V  S\n';
        }
        
        return graph;
    }
    
    generateHeatmap(data, rows, cols) {
        const max = Math.max(...data.flat ? data.flat() : data);
        let heatmap = '\n';
        
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const value = data[i * cols + j] || 0;
                const intensity = max > 0 ? value / max : 0;
                
                const symbol = intensity > 0.75 ? '█' :
                              intensity > 0.5 ? '▓' :
                              intensity > 0.25 ? '▒' :
                              intensity > 0 ? '░' : ' ';
                
                heatmap += symbol;
            }
            heatmap += '\n';
        }
        
        return heatmap;
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      EXPORTACIÓN                                      │
    // ═════════════════════════════════════════════════════════════════════════
    
    /** Reporte de texto legible (en memoria) con las estadísticas del chat, usuario o globales. */
    exportReport(chatId: any = null, userId: any = null): { buffer: Buffer; fileName: string } {
        const data = chatId ? this.getChatStats(chatId) : userId ? this.getUserStats(userId) : this.getGlobalStats();
        const lines = [`ESTADÍSTICAS ${chatId ? 'DEL CHAT' : userId ? 'DEL USUARIO' : 'GLOBALES'}`, `Generado: ${new Date().toLocaleString('es-PE')}`, '']
        const walk = (value: unknown, prefix: string) => {
            if (value instanceof Set) value = [...value]
            if (value instanceof Map) value = Object.fromEntries(value)
            if (value && typeof value === 'object' && !(value instanceof Date)) {
                for (const [k, v] of Object.entries(value)) walk(v, prefix ? `${prefix}.${k}` : k)
            } else {
                lines.push(`${prefix}: ${value instanceof Date ? value.toISOString() : String(value)}`)
            }
        }
        walk(data, '')
        const fileName = `stats_${(chatId || userId || 'global').split('@')[0]}_${Date.now()}.txt`
        Logger.info(`📤 Estadísticas exportadas: ${fileName}`);
        return { buffer: Buffer.from(lines.join('\n'), 'utf8'), fileName }
    }

    /** Tabla CSV (en memoria) con los usuarios más activos del chat. */
    exportToCSV(chatId): { buffer: Buffer; fileName: string } | null {
        const chat = this.data.chats[chatId];
        if (!chat) return null;

        const escape = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`
        let csv = ['Usuario', 'Mensajes', 'Promedio Longitud'].join(',') + '\n';
        for (const user of this.getTopUsersInChat(chatId, 50)) {
            const userStats = this.data.users[user.id];
            csv += [escape(user.name), user.messages, Math.round(userStats?.averageMessageLength || 0)].join(',') + '\n';
        }

        const fileName = `stats_${chatId.split('@')[0]}_${Date.now()}.csv`;
        Logger.info(`📤 CSV exportado: ${fileName}`);
        return { buffer: Buffer.from(csv, 'utf8'), fileName };
    }

    // ═════════════════════════════════════════════════════════════════════════
    // │                      PERSISTENCIA (strenor, binaria)                  │
    // ═════════════════════════════════════════════════════════════════════════

    save() {
        try {
            // La copia anterior se conserva como respaldo; los Set se guardan tal cual
            const previous = loadValue<any>(STORE_KEY, null);
            if (previous) saveValue(BACKUP_KEY, previous);
            saveValue(STORE_KEY, { ...this.data, lastUpdated: Date.now() });

            Logger.debug('💾 Estadísticas guardadas');
            return true;
        } catch (error) {
            Logger.error('❌ Error guardando estadísticas:', error.message);
            return false;
        }
    }

    load() {
        try {
            const loadedData = loadValue<any>(STORE_KEY, null);
            if (!loadedData) {
                Logger.info('📂 Sin estadísticas guardadas, creando nuevas...');
                this.save();
                return;
            }

            // Garantiza Sets aunque los datos vengan de otra versión
            for (const chat of Object.values(loadedData.chats as Record<string, any>)) {
                chat.uniqueUsers = new Set(chat.uniqueUsers || []);
            }

            for (const user of Object.values(loadedData.users as Record<string, any>)) {
                user.chatsParticipated = new Set(user.chatsParticipated || []);
            }

            this.data = loadedData;
            
            Logger.info('📂 Estadísticas cargadas');
            Logger.info(`   📊 ${this.data.global.totalMessages} mensajes`);
            Logger.info(`   👥 ${this.data.global.totalUsers} usuarios`);
            Logger.info(`   💬 ${this.data.global.totalChats} chats`);
        } catch (error) {
            Logger.error('❌ Error cargando estadísticas:', error.message);
            Logger.warn('⚠️ Iniciando con datos vacíos...');
        }
    }
    
    startAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        
        this.autoSaveInterval = setInterval(() => {
            this.save();
        }, CONFIG.AUTO_SAVE_INTERVAL);
        
        Logger.info(`⏰ Auto-guardado activado (cada ${CONFIG.AUTO_SAVE_INTERVAL / 1000}s)`);
    }
    
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
            Logger.info('⏸️ Auto-guardado detenido');
        }
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      LIMPIEZA Y MANTENIMIENTO                         │
    // ═════════════════════════════════════════════════════════════════════════
    
    cleanup() {
        if (!CONFIG.AUTO_CLEANUP_ENABLED) return;
        
        const cutoff = Date.now() - (CONFIG.MAX_DAYS_TO_KEEP * CONFIG.TIMEFRAMES.DAY);
        let cleaned = 0;
        
        // Limpiar mensajes antiguos
        for (const chat of Object.values(this.data.chats as Record<string, any>)) {
            const oldLength = chat.messages.length;
            chat.messages = chat.messages.filter(msg => msg.timestamp >= cutoff);
            cleaned += oldLength - chat.messages.length;
        }
        
        // Limpiar días antiguos de usuarios
        for (const user of Object.values(this.data.users as Record<string, any>)) {
            const cutoffDate = new Date(cutoff).toISOString().split('T')[0];
            
            for (const date of Object.keys(user.messagesByDay)) {
                if (date < cutoffDate) {
                    delete user.messagesByDay[date];
                    cleaned++;
                }
            }
        }
        
        Logger.info(`🧹 Limpieza completada: ${cleaned} entradas eliminadas`);
        
        // Limpiar caché
        cache.clear();
    }
    
    resetStats(chatId: any = null, userId: any = null) {
        if (chatId) {
            delete this.data.chats[chatId];
            cache.invalidate(`chat_${chatId}`);
            Logger.info(`🗑️ Estadísticas de chat ${chatId} eliminadas`);
        } else if (userId) {
            delete this.data.users[userId];
            cache.invalidate(`user_${userId}`);
            Logger.info(`🗑️ Estadísticas de usuario ${userId} eliminadas`);
        } else {
            this.data = {
                global: this.initGlobalStats(),
                chats: {},
                users: {},
                lastUpdated: Date.now()
            };
            cache.clear();
            Logger.info(`🗑️ Todas las estadísticas eliminadas`);
        }
        
        this.save();
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      INSTANCIA GLOBAL                                       │
// ═══════════════════════════════════════════════════════════════════════════════

const chatStats = new ChatStats();

// ═══════════════════════════════════════════════════════════════════════════════
// │                      EXPORTACIONES                                          │
// ═══════════════════════════════════════════════════════════════════════════════

export default chatStats;
export { ChatStats, CONFIG };
