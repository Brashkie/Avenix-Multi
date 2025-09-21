/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                      𒁈 AVENIX-MULTI V2.0.0 - API.JS 𒁈                    ┃
 * ┃                       Cliente de APIs Externas                             ┃
 * ┃                         Creado por: Hepein Oficial                         ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import { EventEmitter } from 'events';
import chalk from 'chalk';

// ═══════════════════════════════════════════════════════════════════════════════
// │                      CLASE PRINCIPAL DE API CLIENT                         │
// ═══════════════════════════════════════════════════════════════════════════════

export class APIClient extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Configuración general
            timeout: config.timeout || 30000, // 30 segundos
            retries: config.retries || 3,
            retryDelay: config.retryDelay || 1000,
            
            // Headers por defecto
            defaultHeaders: {
                'User-Agent': 'Avenix-Multi/2.0.0',
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                ...config.defaultHeaders
            },
            
            // Rate limiting
            enableRateLimit: config.enableRateLimit !== false,
            maxRequestsPerMinute: config.maxRequestsPerMinute || 60,
            
            // Configuración de cache
            enableCache: config.enableCache !== false,
            cacheTTL: config.cacheTTL || 300, // 5 minutos
            
            // APIs configuradas
            apis: config.apis || {},
            
            // Configuración de fallbacks
            enableFallbacks: config.enableFallbacks !== false,
            fallbacks: config.fallbacks || {},
            
            // Configuración de monitoring
            enableMonitoring: config.enableMonitoring !== false,
            healthCheckInterval: config.healthCheckInterval || 300000, // 5 minutos
            
            ...config
        };
        
        // Estado de las APIs
        this.apiStatus = new Map();
        this.requestCounts = new Map();
        this.cache = new Map();
        
        // Estadísticas
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            cacheHits: 0,
            cacheMisses: 0,
            averageResponseTime: 0,
            totalResponseTime: 0,
            errorsByAPI: new Map(),
            requestsByAPI: new Map()
        };
        
        // Configuraciones predefinidas de APIs
        this.predefinedAPIs = {
            // APIs de imágenes
            unsplash: {
                baseURL: 'https://api.unsplash.com',
                headers: { 'Authorization': 'Client-ID {key}' },
                rateLimit: 50,
                endpoints: {
                    search: '/search/photos',
                    random: '/photos/random'
                }
            },
            
            // APIs de clima
            openweathermap: {
                baseURL: 'https://api.openweathermap.org/data/2.5',
                rateLimit: 60,
                endpoints: {
                    current: '/weather',
                    forecast: '/forecast'
                }
            },
            
            // APIs de traducción
            googletranslate: {
                baseURL: 'https://translation.googleapis.com/language/translate/v2',
                headers: { 'Authorization': 'Bearer {key}' },
                rateLimit: 100
            },
            
            // APIs de noticias
            newsapi: {
                baseURL: 'https://newsapi.org/v2',
                headers: { 'X-API-Key': '{key}' },
                rateLimit: 1000,
                endpoints: {
                    headlines: '/top-headlines',
                    everything: '/everything'
                }
            },
            
            // APIs de entretenimiento
            giphy: {
                baseURL: 'https://api.giphy.com/v1/gifs',
                rateLimit: 100,
                endpoints: {
                    search: '/search',
                    trending: '/trending',
                    random: '/random'
                }
            },
            
            // APIs de utilidades
            httpbin: {
                baseURL: 'https://httpbin.org',
                rateLimit: 100,
                endpoints: {
                    get: '/get',
                    post: '/post',
                    status: '/status/{code}'
                }
            },
            
            // APIs de AI/ML
            openai: {
                baseURL: 'https://api.openai.com/v1',
                headers: { 'Authorization': 'Bearer {key}' },
                rateLimit: 20,
                endpoints: {
                    completions: '/completions',
                    chat: '/chat/completions',
                    images: '/images/generations'
                }
            },
            
            // APIs de música
            spotify: {
                baseURL: 'https://api.spotify.com/v1',
                headers: { 'Authorization': 'Bearer {key}' },
                rateLimit: 100,
                endpoints: {
                    search: '/search',
                    track: '/tracks/{id}',
                    artist: '/artists/{id}'
                }
            },
            
            // APIs de YouTube
            youtube: {
                baseURL: 'https://www.googleapis.com/youtube/v3',
                rateLimit: 100,
                endpoints: {
                    search: '/search',
                    videos: '/videos',
                    channels: '/channels'
                }
            },
            
            // APIs de redes sociales
            twitter: {
                baseURL: 'https://api.twitter.com/2',
                headers: { 'Authorization': 'Bearer {key}' },
                rateLimit: 300,
                endpoints: {
                    tweets: '/tweets',
                    users: '/users'
                }
            }
        };
        
        this.init();
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                            INICIALIZACIÓN                              │
    // ═══════════════════════════════════════════════════════════════════════════
    
    async init() {
        try {
            this.setupAPIs();
            this.setupRateLimit();
            this.setupHealthMonitoring();
            
            console.log(chalk.green('𒁈 APIClient inicializado correctamente'));
            this.emit('ready');
            
        } catch (error) {
            console.error(chalk.red('𒁈 Error inicializando APIClient:'), error.message);
            this.emit('error', error);
        }
    }
    
    setupAPIs() {
        // Configurar APIs predefinidas
        for (const [name, config] of Object.entries(this.predefinedAPIs)) {
            if (!this.config.apis[name]) {
                this.config.apis[name] = config;
            }
        }
        
        // Inicializar estado de APIs
        for (const [name, config] of Object.entries(this.config.apis)) {
            this.apiStatus.set(name, {
                name,
                status: 'unknown',
                lastCheck: null,
                responseTime: null,
                errorCount: 0,
                totalRequests: 0,
                successfulRequests: 0,
                config
            });
            
            this.requestCounts.set(name, []);
            this.stats.errorsByAPI.set(name, 0);
            this.stats.requestsByAPI.set(name, 0);
        }
    }
    
    setupRateLimit() {
        if (!this.config.enableRateLimit) return;
        
        // Limpiar contadores cada minuto
        setInterval(() => {
            const now = Date.now();
            const oneMinuteAgo = now - 60000;
            
            for (const [apiName, requests] of this.requestCounts) {
                const recentRequests = requests.filter(time => time > oneMinuteAgo);
                this.requestCounts.set(apiName, recentRequests);
            }
        }, 60000);
    }
    
    setupHealthMonitoring() {
        if (!this.config.enableMonitoring) return;
        
        // Verificar salud de APIs periódicamente
        setInterval(() => {
            this.performHealthCheck().catch(console.error);
        }, this.config.healthCheckInterval);
        
        // Verificación inicial
        setTimeout(() => {
            this.performHealthCheck().catch(console.error);
        }, 5000);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                        MÉTODOS PRINCIPALES                             │
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Realizar petición a una API
     */
    async request(apiName, endpoint, options = {}) {
        const startTime = Date.now();
        
        try {
            // Verificar rate limit
            if (!this.checkRateLimit(apiName)) {
                throw new Error(`Rate limit excedido para API: ${apiName}`);
            }
            
            // Verificar cache
            const cacheKey = this.generateCacheKey(apiName, endpoint, options);
            if (this.config.enableCache && options.method !== 'POST' && options.method !== 'PUT') {
                const cached = this.getFromCache(cacheKey);
                if (cached) {
                    this.stats.cacheHits++;
                    return cached;
                }
                this.stats.cacheMisses++;
            }
            
            // Preparar request
            const requestOptions = await this.prepareRequest(apiName, endpoint, options);
            
            // Realizar petición con reintentos
            let lastError;
            for (let attempt = 1; attempt <= this.config.retries; attempt++) {
                try {
                    const response = await this.executeRequest(requestOptions);
                    
                    // Actualizar estadísticas
                    this.updateStats(apiName, startTime, true);
                    
                    // Guardar en cache
                    if (this.config.enableCache && response && options.method !== 'POST') {
                        this.saveToCache(cacheKey, response);
                    }
                    
                    this.emit('requestSuccess', {
                        apiName,
                        endpoint,
                        responseTime: Date.now() - startTime,
                        attempt
                    });
                    
                    return response;
                    
                } catch (error) {
                    lastError = error;
                    
                    if (attempt < this.config.retries) {
                        console.warn(chalk.yellow(`𒁈 Reintentando ${apiName} (${attempt}/${this.config.retries}): ${error.message}`));
                        await this.delay(this.config.retryDelay * attempt);
                    }
                }
            }
            
            throw lastError;
            
        } catch (error) {
            // Actualizar estadísticas de error
            this.updateStats(apiName, startTime, false);
            this.updateAPIStatus(apiName, 'error', Date.now() - startTime);
            
            this.emit('requestError', {
                apiName,
                endpoint,
                error: error.message,
                responseTime: Date.now() - startTime
            });
            
            // Intentar fallback si está configurado
            if (this.config.enableFallbacks && this.config.fallbacks[apiName]) {
                try {
                    const fallbackAPI = this.config.fallbacks[apiName];
                    console.log(chalk.yellow(`𒁈 Usando fallback para ${apiName}: ${fallbackAPI}`));
                    return await this.request(fallbackAPI, endpoint, options);
                } catch (fallbackError) {
                    console.error(chalk.red(`𒁈 Fallback también falló: ${fallbackError.message}`));
                }
            }
            
            throw error;
        }
    }
    
    /**
     * Realizar petición GET
     */
    async get(apiName, endpoint, params = {}) {
        return await this.request(apiName, endpoint, {
            method: 'GET',
            params
        });
    }
    
    /**
     * Realizar petición POST
     */
    async post(apiName, endpoint, data = {}) {
        return await this.request(apiName, endpoint, {
            method: 'POST',
            data
        });
    }
    
    /**
     * Realizar petición PUT
     */
    async put(apiName, endpoint, data = {}) {
        return await this.request(apiName, endpoint, {
            method: 'PUT',
            data
        });
    }
    
    /**
     * Realizar petición DELETE
     */
    async delete(apiName, endpoint) {
        return await this.request(apiName, endpoint, {
            method: 'DELETE'
        });
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                       MÉTODOS ESPECÍFICOS                              │
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Buscar imágenes
     */
    async searchImages(query, options = {}) {
        const apis = ['unsplash', 'pixabay', 'pexels'];
        
        for (const api of apis) {
            try {
                if (this.isAPIAvailable(api)) {
                    switch (api) {
                        case 'unsplash':
                            return await this.get('unsplash', '/search/photos', {
                                query,
                                per_page: options.limit || 10,
                                orientation: options.orientation || 'landscape'
                            });
                            
                        default:
                            continue;
                    }
                }
            } catch (error) {
                console.warn(chalk.yellow(`𒁈 Error en ${api}: ${error.message}`));
                continue;
            }
        }
        
        throw new Error('No hay APIs de imágenes disponibles');
    }
    
    /**
     * Obtener clima
     */
    async getWeather(location, options = {}) {
        try {
            return await this.get('openweathermap', '/weather', {
                q: location,
                appid: options.apiKey,
                units: options.units || 'metric',
                lang: options.lang || 'es'
            });
        } catch (error) {
            throw new Error(`Error obteniendo clima: ${error.message}`);
        }
    }
    
    /**
     * Traducir texto
     */
    async translateText(text, targetLang, sourceLang = 'auto') {
        const apis = ['googletranslate', 'deepl', 'microsoft'];
        
        for (const api of apis) {
            try {
                if (this.isAPIAvailable(api)) {
                    switch (api) {
                        case 'googletranslate':
                            return await this.post('googletranslate', '', {
                                q: text,
                                target: targetLang,
                                source: sourceLang !== 'auto' ? sourceLang : undefined
                            });
                            
                        default:
                            continue;
                    }
                }
            } catch (error) {
                console.warn(chalk.yellow(`𒁈 Error en ${api}: ${error.message}`));
                continue;
            }
        }
        
        throw new Error('No hay APIs de traducción disponibles');
    }
    
    /**
     * Buscar noticias
     */
    async searchNews(query, options = {}) {
        try {
            return await this.get('newsapi', '/everything', {
                q: query,
                language: options.language || 'es',
                sortBy: options.sortBy || 'publishedAt',
                pageSize: options.limit || 10,
                apiKey: options.apiKey
            });
        } catch (error) {
            throw new Error(`Error buscando noticias: ${error.message}`);
        }
    }
    
    /**
     * Buscar GIFs
     */
    async searchGifs(query, options = {}) {
        try {
            return await this.get('giphy', '/search', {
                q: query,
                api_key: options.apiKey,
                limit: options.limit || 10,
                rating: options.rating || 'pg'
            });
        } catch (error) {
            throw new Error(`Error buscando GIFs: ${error.message}`);
        }
    }
    
    /**
     * Generar completación con IA
     */
    async generateCompletion(prompt, options = {}) {
        try {
            return await this.post('openai', '/chat/completions', {
                model: options.model || 'gpt-3.5-turbo',
                messages: [
                    { role: 'user', content: prompt }
                ],
                max_tokens: options.maxTokens || 150,
                temperature: options.temperature || 0.7
            });
        } catch (error) {
            throw new Error(`Error generando completación: ${error.message}`);
        }
    }
    
    /**
     * Buscar música
     */
    async searchMusic(query, options = {}) {
        try {
            return await this.get('spotify', '/search', {
                q: query,
                type: options.type || 'track',
                limit: options.limit || 10,
                market: options.market || 'ES'
            });
        } catch (error) {
            throw new Error(`Error buscando música: ${error.message}`);
        }
    }
    
    /**
     * Buscar videos de YouTube
     */
    async searchYouTube(query, options = {}) {
        try {
            return await this.get('youtube', '/search', {
                part: 'snippet',
                q: query,
                type: 'video',
                maxResults: options.limit || 5,
                key: options.apiKey
            });
        } catch (error) {
            throw new Error(`Error buscando en YouTube: ${error.message}`);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                         FUNCIONES AUXILIARES                           │
    // ═══════════════════════════════════════════════════════════════════════════
    
    async prepareRequest(apiName, endpoint, options) {
        const apiConfig = this.config.apis[apiName];
        if (!apiConfig) {
            throw new Error(`API no configurada: ${apiName}`);
        }
        
        // Construir URL
        let url = apiConfig.baseURL + endpoint;
        
        // Reemplazar parámetros en la URL
        if (options.pathParams) {
            for (const [key, value] of Object.entries(options.pathParams)) {
                url = url.replace(`{${key}}`, encodeURIComponent(value));
            }
        }
        
        // Agregar parámetros de consulta
        if (options.params) {
            const searchParams = new URLSearchParams();
            for (const [key, value] of Object.entries(options.params)) {
                if (value !== undefined && value !== null) {
                    searchParams.append(key, value);
                }
            }
            if (searchParams.toString()) {
                url += '?' + searchParams.toString();
            }
        }
        
        // Preparar headers
        const headers = {
            ...this.config.defaultHeaders,
            ...apiConfig.headers,
            ...options.headers
        };
        
        // Reemplazar tokens en headers
        for (const [key, value] of Object.entries(headers)) {
            if (typeof value === 'string' && value.includes('{key}')) {
                const apiKey = options.apiKey || process.env[`${apiName.toUpperCase()}_API_KEY`];
                if (apiKey) {
                    headers[key] = value.replace('{key}', apiKey);
                } else {
                    delete headers[key];
                }
            }
        }
        
        // Preparar body
        let body;
        if (options.data && (options.method === 'POST' || options.method === 'PUT')) {
            if (headers['Content-Type'] === 'application/json') {
                body = JSON.stringify(options.data);
            } else {
                body = options.data;
            }
        }
        
        return {
            url,
            method: options.method || 'GET',
            headers,
            body,
            timeout: options.timeout || this.config.timeout
        };
    }
    
    async executeRequest(requestOptions) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), requestOptions.timeout);
        
        try {
            const response = await fetch(requestOptions.url, {
                method: requestOptions.method,
                headers: requestOptions.headers,
                body: requestOptions.body,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else if (contentType && contentType.includes('text/')) {
                return await response.text();
            } else {
                return await response.arrayBuffer();
            }
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            
            throw error;
        }
    }
    
    checkRateLimit(apiName) {
        if (!this.config.enableRateLimit) return true;
        
        const apiConfig = this.config.apis[apiName];
        const limit = apiConfig?.rateLimit || this.config.maxRequestsPerMinute;
        
        const now = Date.now();
        const requests = this.requestCounts.get(apiName) || [];
        const recentRequests = requests.filter(time => time > now - 60000);
        
        if (recentRequests.length >= limit) {
            return false;
        }
        
        // Agregar request actual
        requests.push(now);
        this.requestCounts.set(apiName, requests);
        
        return true;
    }
    
    generateCacheKey(apiName, endpoint, options) {
        const keyData = {
            api: apiName,
            endpoint,
            method: options.method || 'GET',
            params: options.params || {},
            pathParams: options.pathParams || {}
        };
        
        return btoa(JSON.stringify(keyData)).replace(/[^a-zA-Z0-9]/g, '');
    }
    
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        if (Date.now() > cached.expires) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }
    
    saveToCache(key, data) {
        this.cache.set(key, {
            data,
            expires: Date.now() + (this.config.cacheTTL * 1000)
        });
        
        // Limpiar cache si es muy grande
        if (this.cache.size > 1000) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }
    }
    
    updateStats(apiName, startTime, success) {
        const responseTime = Date.now() - startTime;
        
        this.stats.totalRequests++;
        this.stats.totalResponseTime += responseTime;
        this.stats.averageResponseTime = Math.round(this.stats.totalResponseTime / this.stats.totalRequests);
        
        const apiRequests = this.stats.requestsByAPI.get(apiName) || 0;
        this.stats.requestsByAPI.set(apiName, apiRequests + 1);
        
        if (success) {
            this.stats.successfulRequests++;
            this.updateAPIStatus(apiName, 'healthy', responseTime);
        } else {
            this.stats.failedRequests++;
            const apiErrors = this.stats.errorsByAPI.get(apiName) || 0;
            this.stats.errorsByAPI.set(apiName, apiErrors + 1);
        }
    }
    
    updateAPIStatus(apiName, status, responseTime) {
        const apiStatus = this.apiStatus.get(apiName);
        if (apiStatus) {
            apiStatus.status = status;
            apiStatus.lastCheck = Date.now();
            apiStatus.responseTime = responseTime;
            
            if (status === 'error') {
                apiStatus.errorCount++;
            } else if (status === 'healthy') {
                apiStatus.successfulRequests++;
            }
            
            apiStatus.totalRequests++;
        }
    }
    
    isAPIAvailable(apiName) {
        const status = this.apiStatus.get(apiName);
        if (!status) return false;
        
        // Considerar disponible si no hay datos o si está saludable
        return status.status === 'unknown' || status.status === 'healthy';
    }
    
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // │                       MONITOREO Y SALUD                                │
    // ═══════════════════════════════════════════════════════════════════════════
    
    async performHealthCheck() {
        console.log(chalk.blue('𒁈 Realizando verificación de salud de APIs...'));
        
        const healthChecks = [];
        
        for (const [apiName, config] of Object.entries(this.config.apis)) {
            if (config.healthEndpoint || config.baseURL) {
                healthChecks.push(this.checkAPIHealth(apiName, config));
            }
        }
        
        const results = await Promise.allSettled(healthChecks);
        
        let healthyAPIs = 0;
        let totalAPIs = results.length;
        
        results.forEach((result, index) => {
            const apiName = Object.keys(this.config.apis)[index];
            
            if (result.status === 'fulfilled' && result.value) {
                healthyAPIs++;
                this.updateAPIStatus(apiName, 'healthy', result.value.responseTime);
            } else {
                this.updateAPIStatus(apiName, 'error', null);
            }
        });
        
        const healthPercentage = totalAPIs > 0 ? (healthyAPIs / totalAPIs * 100).toFixed(1) : 0;
        
        console.log(chalk.blue(`𒁈 Salud de APIs: ${healthyAPIs}/${totalAPIs} (${healthPercentage}%)`));
        
        this.emit('healthCheck', {
            healthy: healthyAPIs,
            total: totalAPIs,
            percentage: healthPercentage
        });
        
        return { healthy: healthyAPIs, total: totalAPIs, percentage: healthPercentage };
    }
    
    async checkAPIHealth(apiName, config) {
        try {
            const startTime = Date.now();
            const endpoint = config.healthEndpoint || '/';
            
            const response = await this.executeRequest({
                url: config.baseURL + endpoint,
                method: 'GET',
                headers: { 'User-Agent': this.config.defaultHeaders['User-Agent'] },
                timeout: 10000
            });
            
            const responseTime = Date.now() - startTime;
            
            return { healthy: true, responseTime };
            
        } catch (error) {
            console.warn(chalk.yellow(`𒁈 API ${apiName} no disponible: ${error.message}`));
            return { healthy: false, error: error.message };
        }
    }
    
    /**
     * Obtener estado de todas las APIs
     */
    getAPIStatus() {
        const status = {};
        
        for (const [name, data] of this.apiStatus) {
            status[name] = {
                ...data,
                successRate: data.totalRequests > 0 ? 
                    (data.successfulRequests / data.totalRequests * 100).toFixed(2) : 0
            };
        }
        
        return status;
    }
    
    /**
     * Obtener estadísticas generales
     */
    getStats() {
        const successRate = this.stats.totalRequests > 0 ? 
            (this.stats.successfulRequests / this.stats.totalRequests * 100).toFixed(2) : 0;
        
        return {
            ...this.stats,
            successRate,
            cacheHitRate: this.stats.cacheHits + this.stats.cacheMisses > 0 ? 
                (this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) * 100).toFixed(2) : 0,
            errorsByAPI: Object.fromEntries(this.stats.errorsByAPI),
            requestsByAPI: Object.fromEntries(this.stats.requestsByAPI),
            cacheSize: this.cache.size
        };
    }
    
    /**
     * Configurar API
     */
    configureAPI(name, config) {
        this.config.apis[name] = config;
        
        this.apiStatus.set(name, {
            name,
            status: 'unknown',
            lastCheck: null,
            responseTime: null,
            errorCount: 0,
            totalRequests: 0,
            successfulRequests: 0,
            config
        });
        
        this.requestCounts.set(name, []);
        this.stats.errorsByAPI.set(name, 0);
        this.stats.requestsByAPI.set(name, 0);
        
        this.emit('apiConfigured', { name, config });
        
        return true;
    }
    
    /**
     * Configurar fallback
     */
    setFallback(primaryAPI, fallbackAPI) {
        this.config.fallbacks[primaryAPI] = fallbackAPI;
        this.emit('fallbackConfigured', { primary: primaryAPI, fallback: fallbackAPI });
        
        return true;
    }
    
    /**
     * Limpiar cache
     */
    clearCache(pattern = null) {
        if (pattern) {
            for (const [key, value] of this.cache) {
                if (key.includes(pattern)) {
                    this.cache.delete(key);
                }
            }
        } else {
            this.cache.clear();
        }
        
        this.emit('cacheCleared', { pattern });
        
        return true;
    }
    
    /**
     * Obtener métricas de API específica
     */
    getAPIMetrics(apiName) {
        const status = this.apiStatus.get(apiName);
        const requests = this.requestCounts.get(apiName) || [];
        const errors = this.stats.errorsByAPI.get(apiName) || 0;
        const totalRequests = this.stats.requestsByAPI.get(apiName) || 0;
        
        if (!status) {
            return null;
        }
        
        return {
            ...status,
            recentRequests: requests.length,
            totalErrors: errors,
            totalRequests,
            successRate: totalRequests > 0 ? 
                ((totalRequests - errors) / totalRequests * 100).toFixed(2) : 0
        };
    }
    
    /**
     * Generar reporte de APIs
     */
    generateReport() {
        const report = {
            timestamp: Date.now(),
            summary: this.getStats(),
            apiStatus: this.getAPIStatus(),
            healthCheck: null
        };
        
        // Realizar verificación de salud para el reporte
        this.performHealthCheck().then(healthData => {
            report.healthCheck = healthData;
            this.emit('reportGenerated', report);
        }).catch(console.error);
        
        return report;
    }
    
    /**
     * Cerrar API client
     */
    async close() {
        console.log(chalk.blue('𒁈 Cerrando APIClient...'));
        
        this.cache.clear();
        this.removeAllListeners();
        
        console.log(chalk.green('𒁈 APIClient cerrado correctamente'));
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                         INSTANCIA GLOBAL                                   │
// ═══════════════════════════════════════════════════════════════════════════════

export const apiClient = new APIClient({
    timeout: 30000,
    retries: 3,
    retryDelay: 1000,
    enableRateLimit: true,
    maxRequestsPerMinute: 60,
    enableCache: true,
    cacheTTL: 300,
    enableFallbacks: true,
    enableMonitoring: true,
    healthCheckInterval: 300000
});

export default apiClient;
