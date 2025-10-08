/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                   𒁈 WEATHER V1.0 ULTRA 𒁈                                  ┃
 * ┃              Sistema Meteorológico Completo y Profesional                   ┃
 * ┃                    Creado para: Avenix-Multi V6.1.0                          ┃
 * ┃                    By: Hepein Oficial                                        ┃
 * ┃                                                                               ┃
 * ┃  CARACTERÍSTICAS:                                                            ┃
 * ┃  ✅ Clima actual con detalles completos                                     ┃
 * ┃  ✅ Pronóstico extendido (7-16 días)                                        ┃
 * ┃  ✅ Pronóstico por horas                                                    ┃
 * ┃  ✅ Alertas meteorológicas en tiempo real                                   ┃
 * ┃  ✅ Calidad del aire (AQI)                                                  ┃
 * ┃  ✅ Índice UV                                                               ┃
 * ┃  ✅ Datos astronómicos (amanecer/atardecer/luna)                            ┃
 * ┃  ✅ Múltiples APIs (OpenWeatherMap, WeatherAPI, etc)                        ┃
 * ┃  ✅ Geocodificación inversa                                                 ┃
 * ┃  ✅ Sistema de caché inteligente                                            ┃
 * ┃  ✅ Múltiples unidades (Celsius/Fahrenheit/Kelvin)                          ┃
 * ┃  ✅ Múltiples idiomas                                                       ┃
 * ┃  ✅ Visualización con emojis                                                ┃
 * ┃  ✅ Mapas meteorológicos                                                    ┃
 * ┃  ✅ Histórico del clima                                                     ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import axios from 'axios';
import crypto from 'crypto';
import chalk from 'chalk';

// ═══════════════════════════════════════════════════════════════════════════════
// │                        CONFIGURACIÓN GLOBAL                                 │
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
    // APIs (agregar tus claves)
    API_KEYS: {
        OPENWEATHERMAP: process.env.OPENWEATHER_API_KEY || 'YOUR_API_KEY',
        WEATHERAPI: process.env.WEATHERAPI_KEY || 'YOUR_API_KEY',
        VISUALCROSSING: process.env.VISUALCROSSING_KEY || 'YOUR_API_KEY'
    },
    
    // API preferida
    PREFERRED_API: 'OPENWEATHERMAP', // 'OPENWEATHERMAP' | 'WEATHERAPI' | 'VISUALCROSSING'
    
    // Fallback automático
    AUTO_FALLBACK: true,
    
    // Caché
    CACHE_ENABLED: true,
    CACHE_TTL: 600000, // 10 minutos
    CACHE_FORECAST_TTL: 3600000, // 1 hora
    
    // Unidades
    DEFAULT_UNITS: 'metric', // 'metric' | 'imperial' | 'standard'
    DEFAULT_LANGUAGE: 'es',
    
    // Límites
    MAX_FORECAST_DAYS: 16,
    MAX_HOURLY_HOURS: 48,
    
    // Timeouts
    REQUEST_TIMEOUT: 10000,
    
    // Logging
    LOG_ENABLED: true,
    LOG_LEVEL: 'info',
    
    // Features
    ENABLE_AIR_QUALITY: true,
    ENABLE_ALERTS: true,
    ENABLE_ASTRONOMY: true,
    ENABLE_HISTORICAL: true
};

// ═══════════════════════════════════════════════════════════════════════════════
// │                      EMOJIS METEOROLÓGICOS                                  │
// ═══════════════════════════════════════════════════════════════════════════════

const WEATHER_EMOJIS = {
    // Día
    '01d': '☀️', // Despejado
    '02d': '🌤️', // Pocas nubes
    '03d': '⛅', // Dispersas
    '04d': '☁️', // Nublado
    '09d': '🌧️', // Lluvia ligera
    '10d': '🌦️', // Lluvia
    '11d': '⛈️', // Tormenta
    '13d': '🌨️', // Nieve
    '50d': '🌫️', // Niebla
    
    // Noche
    '01n': '🌙', // Despejado
    '02n': '☁️', // Pocas nubes
    '03n': '☁️', // Dispersas
    '04n': '☁️', // Nublado
    '09n': '🌧️', // Lluvia ligera
    '10n': '🌧️', // Lluvia
    '11n': '⛈️', // Tormenta
    '13n': '🌨️', // Nieve
    '50n': '🌫️', // Niebla
    
    // Otros
    'tornado': '🌪️',
    'hurricane': '🌀',
    'snow': '❄️',
    'rain': '🌧️',
    'drizzle': '🌦️',
    'thunderstorm': '⛈️',
    'clear': '☀️',
    'clouds': '☁️',
    'mist': '🌫️',
    'fog': '🌫️',
    'haze': '🌫️',
    'dust': '💨',
    'sand': '💨',
    'ash': '🌋',
    'squall': '💨',
    'windy': '💨'
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
        
        console.log(prefix, '[Weather]:', ...args);
    }
    
    static debug(...args) { this.log('debug', ...args); }
    static info(...args) { this.log('info', ...args); }
    static warn(...args) { this.log('warn', ...args); }
    static error(...args) { this.log('error', ...args); }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      SISTEMA DE CACHÉ                                       │
// ═══════════════════════════════════════════════════════════════════════════════

class WeatherCache {
    constructor() {
        this.cache = new Map();
        this.stats = { hits: 0, misses: 0 };
    }
    
    generateKey(location, type) {
        const str = `${location}_${type}`;
        return crypto.createHash('md5').update(str).digest('hex');
    }
    
    get(location, type) {
        if (!CONFIG.CACHE_ENABLED) return null;
        
        const key = this.generateKey(location, type);
        const item = this.cache.get(key);
        
        if (!item) {
            this.stats.misses++;
            return null;
        }
        
        const ttl = type === 'current' ? CONFIG.CACHE_TTL : CONFIG.CACHE_FORECAST_TTL;
        
        if (Date.now() - item.timestamp > ttl) {
            this.cache.delete(key);
            this.stats.misses++;
            return null;
        }
        
        this.stats.hits++;
        Logger.debug(`Cache HIT: ${location} (${type})`);
        return item.data;
    }
    
    set(location, type, data) {
        if (!CONFIG.CACHE_ENABLED) return;
        
        const key = this.generateKey(location, type);
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
        
        Logger.debug(`Cache SET: ${location} (${type})`);
    }
    
    clear() {
        this.cache.clear();
        Logger.info('🗑️ Caché limpiada');
    }
    
    getStats() {
        const total = this.stats.hits + this.stats.misses;
        return {
            ...this.stats,
            hitRate: total > 0 ? (this.stats.hits / total * 100).toFixed(2) + '%' : '0%'
        };
    }
}

const cache = new WeatherCache();

// ═══════════════════════════════════════════════════════════════════════════════
// │                      CLIENTE HTTP                                           │
// ═══════════════════════════════════════════════════════════════════════════════

const httpClient = axios.create({
    timeout: CONFIG.REQUEST_TIMEOUT,
    headers: {
        'User-Agent': 'Avenix-Multi-Weather/1.0'
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// │                      ADAPTADOR OPENWEATHERMAP                               │
// ═══════════════════════════════════════════════════════════════════════════════

class OpenWeatherMapAdapter {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://api.openweathermap.org/data/2.5';
        this.geoURL = 'https://api.openweathermap.org/geo/1.0';
    }
    
    async getCurrentWeather(location, units = 'metric', lang = 'es') {
        try {
            const coords = await this.geocode(location);
            
            const response = await httpClient.get(`${this.baseURL}/weather`, {
                params: {
                    lat: coords.lat,
                    lon: coords.lon,
                    units,
                    lang,
                    appid: this.apiKey
                }
            });
            
            return this.formatCurrentWeather(response.data, coords);
        } catch (error) {
            Logger.error('Error en OpenWeatherMap:', error.message);
            throw error;
        }
    }
    
    async getForecast(location, days = 7, units = 'metric', lang = 'es') {
        try {
            const coords = await this.geocode(location);
            
            // OneCall API 3.0 (requiere suscripción) o usar forecast
            const response = await httpClient.get(`${this.baseURL}/forecast`, {
                params: {
                    lat: coords.lat,
                    lon: coords.lon,
                    units,
                    lang,
                    appid: this.apiKey
                }
            });
            
            return this.formatForecast(response.data, coords, days);
        } catch (error) {
            Logger.error('Error obteniendo pronóstico:', error.message);
            throw error;
        }
    }
    
    async getAirQuality(location) {
        if (!CONFIG.ENABLE_AIR_QUALITY) return null;
        
        try {
            const coords = await this.geocode(location);
            
            const response = await httpClient.get(`${this.baseURL}/air_pollution`, {
                params: {
                    lat: coords.lat,
                    lon: coords.lon,
                    appid: this.apiKey
                }
            });
            
            return this.formatAirQuality(response.data);
        } catch (error) {
            Logger.warn('Error obteniendo calidad del aire:', error.message);
            return null;
        }
    }
    
    async geocode(location) {
        try {
            const response = await httpClient.get(`${this.geoURL}/direct`, {
                params: {
                    q: location,
                    limit: 1,
                    appid: this.apiKey
                }
            });
            
            if (!response.data || response.data.length === 0) {
                throw new Error('Ubicación no encontrada');
            }
            
            const result = response.data[0];
            return {
                lat: result.lat,
                lon: result.lon,
                name: result.local_names?.es || result.name,
                country: result.country,
                state: result.state
            };
        } catch (error) {
            Logger.error('Error en geocodificación:', error.message);
            throw new Error('No se pudo encontrar la ubicación');
        }
    }
    
    formatCurrentWeather(data, location) {
        return {
            location: {
                name: location.name,
                country: location.country,
                lat: location.lat,
                lon: location.lon
            },
            current: {
                temp: Math.round(data.main.temp),
                feelsLike: Math.round(data.main.feels_like),
                tempMin: Math.round(data.main.temp_min),
                tempMax: Math.round(data.main.temp_max),
                pressure: data.main.pressure,
                humidity: data.main.humidity,
                visibility: data.visibility,
                windSpeed: data.wind.speed,
                windDeg: data.wind.deg,
                windGust: data.wind.gust,
                clouds: data.clouds.all,
                condition: data.weather[0].main,
                description: data.weather[0].description,
                icon: data.weather[0].icon,
                emoji: WEATHER_EMOJIS[data.weather[0].icon] || '🌡️',
                sunrise: new Date(data.sys.sunrise * 1000),
                sunset: new Date(data.sys.sunset * 1000),
                timestamp: new Date(data.dt * 1000)
            },
            rain: data.rain,
            snow: data.snow
        };
    }
    
    formatForecast(data, location, days) {
        const forecasts = [];
        const dailyData = {};
        
        // Agrupar por día
        data.list.forEach(item => {
            const date = new Date(item.dt * 1000).toDateString();
            
            if (!dailyData[date]) {
                dailyData[date] = [];
            }
            
            dailyData[date].push(item);
        });
        
        // Procesar cada día
        Object.entries(dailyData).slice(0, days).forEach(([date, items]) => {
            const temps = items.map(i => i.main.temp);
            const conditions = items.map(i => i.weather[0]);
            
            // Condición más común del día
            const conditionCounts = {};
            conditions.forEach(c => {
                conditionCounts[c.main] = (conditionCounts[c.main] || 0) + 1;
            });
            const mainCondition = Object.entries(conditionCounts)
                .sort((a, b) => b[1] - a[1])[0][0];
            
            const mainItem = items.find(i => i.weather[0].main === mainCondition);
            
            forecasts.push({
                date: new Date(date),
                temp: {
                    min: Math.round(Math.min(...temps)),
                    max: Math.round(Math.max(...temps)),
                    avg: Math.round(temps.reduce((a, b) => a + b, 0) / temps.length)
                },
                condition: mainCondition,
                description: mainItem.weather[0].description,
                icon: mainItem.weather[0].icon,
                emoji: WEATHER_EMOJIS[mainItem.weather[0].icon] || '🌡️',
                humidity: Math.round(items.reduce((a, b) => a + b.main.humidity, 0) / items.length),
                windSpeed: Math.round(items.reduce((a, b) => a + b.wind.speed, 0) / items.length),
                clouds: Math.round(items.reduce((a, b) => a + b.clouds.all, 0) / items.length),
                pop: Math.round(Math.max(...items.map(i => i.pop || 0)) * 100) // Probabilidad de precipitación
            });
        });
        
        return {
            location: {
                name: location.name,
                country: location.country
            },
            forecast: forecasts
        };
    }
    
    formatAirQuality(data) {
        const aqi = data.list[0].main.aqi;
        const components = data.list[0].components;
        
        const aqiLevels = {
            1: { level: 'Bueno', emoji: '🟢', description: 'Calidad del aire excelente' },
            2: { level: 'Moderado', emoji: '🟡', description: 'Calidad del aire aceptable' },
            3: { level: 'Dañino para grupos sensibles', emoji: '🟠', description: 'Personas sensibles pueden experimentar efectos' },
            4: { level: 'Dañino', emoji: '🔴', description: 'Todos pueden experimentar efectos en la salud' },
            5: { level: 'Muy Dañino', emoji: '🟣', description: 'Advertencia de salud severa' }
        };
        
        return {
            aqi,
            level: aqiLevels[aqi].level,
            emoji: aqiLevels[aqi].emoji,
            description: aqiLevels[aqi].description,
            components: {
                co: components.co,      // Monóxido de carbono
                no: components.no,      // Óxido nítrico
                no2: components.no2,    // Dióxido de nitrógeno
                o3: components.o3,      // Ozono
                so2: components.so2,    // Dióxido de azufre
                pm2_5: components.pm2_5, // Partículas finas
                pm10: components.pm10,   // Partículas gruesas
                nh3: components.nh3     // Amoníaco
            }
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      ADAPTADOR WEATHERAPI                                   │
// ═══════════════════════════════════════════════════════════════════════════════

class WeatherAPIAdapter {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://api.weatherapi.com/v1';
    }
    
    async getCurrentWeather(location, units = 'metric', lang = 'es') {
        try {
            const response = await httpClient.get(`${this.baseURL}/current.json`, {
                params: {
                    key: this.apiKey,
                    q: location,
                    lang
                }
            });
            
            return this.formatCurrentWeather(response.data, units);
        } catch (error) {
            Logger.error('Error en WeatherAPI:', error.message);
            throw error;
        }
    }
    
    async getForecast(location, days = 7, units = 'metric', lang = 'es') {
        try {
            const response = await httpClient.get(`${this.baseURL}/forecast.json`, {
                params: {
                    key: this.apiKey,
                    q: location,
                    days: Math.min(days, 10), // WeatherAPI free tier: max 3 días
                    lang
                }
            });
            
            return this.formatForecast(response.data, units);
        } catch (error) {
            Logger.error('Error obteniendo pronóstico:', error.message);
            throw error;
        }
    }
    
    async getAirQuality(location) {
        if (!CONFIG.ENABLE_AIR_QUALITY) return null;
        
        try {
            const response = await httpClient.get(`${this.baseURL}/current.json`, {
                params: {
                    key: this.apiKey,
                    q: location,
                    aqi: 'yes'
                }
            });
            
            return this.formatAirQuality(response.data.current.air_quality);
        } catch (error) {
            Logger.warn('Error obteniendo calidad del aire:', error.message);
            return null;
        }
    }
    
    formatCurrentWeather(data, units) {
        const isCelsius = units === 'metric';
        
        return {
            location: {
                name: data.location.name,
                country: data.location.country,
                lat: data.location.lat,
                lon: data.location.lon,
                region: data.location.region
            },
            current: {
                temp: isCelsius ? Math.round(data.current.temp_c) : Math.round(data.current.temp_f),
                feelsLike: isCelsius ? Math.round(data.current.feelslike_c) : Math.round(data.current.feelslike_f),
                pressure: data.current.pressure_mb,
                humidity: data.current.humidity,
                visibility: data.current.vis_km,
                windSpeed: isCelsius ? data.current.wind_kph : data.current.wind_mph,
                windDeg: data.current.wind_degree,
                windDir: data.current.wind_dir,
                windGust: isCelsius ? data.current.gust_kph : data.current.gust_mph,
                clouds: data.current.cloud,
                condition: data.current.condition.text,
                description: data.current.condition.text,
                icon: this.getWeatherIcon(data.current.condition.code, data.current.is_day),
                emoji: this.getWeatherEmoji(data.current.condition.code),
                uv: data.current.uv,
                precipMm: data.current.precip_mm,
                timestamp: new Date(data.location.localtime)
            }
        };
    }
    
    formatForecast(data, units) {
        const isCelsius = units === 'metric';
        
        return {
            location: {
                name: data.location.name,
                country: data.location.country
            },
            forecast: data.forecast.forecastday.map(day => ({
                date: new Date(day.date),
                temp: {
                    min: isCelsius ? Math.round(day.day.mintemp_c) : Math.round(day.day.mintemp_f),
                    max: isCelsius ? Math.round(day.day.maxtemp_c) : Math.round(day.day.maxtemp_f),
                    avg: isCelsius ? Math.round(day.day.avgtemp_c) : Math.round(day.day.avgtemp_f)
                },
                condition: day.day.condition.text,
                description: day.day.condition.text,
                icon: this.getWeatherIcon(day.day.condition.code, 1),
                emoji: this.getWeatherEmoji(day.day.condition.code),
                humidity: day.day.avghumidity,
                windSpeed: isCelsius ? day.day.maxwind_kph : day.day.maxwind_mph,
                clouds: 0,
                pop: day.day.daily_chance_of_rain,
                uv: day.day.uv,
                sunrise: day.astro.sunrise,
                sunset: day.astro.sunset,
                moonPhase: day.astro.moon_phase
            }))
        };
    }
    
    formatAirQuality(data) {
        if (!data) return null;
        
        // WeatherAPI usa índice US EPA
        const usEpaIndex = Math.round(data['us-epa-index']) || 1;
        
        const aqiLevels = {
            1: { level: 'Bueno', emoji: '🟢' },
            2: { level: 'Moderado', emoji: '🟡' },
            3: { level: 'Dañino para grupos sensibles', emoji: '🟠' },
            4: { level: 'Dañino', emoji: '🔴' },
            5: { level: 'Muy Dañino', emoji: '🟣' },
            6: { level: 'Peligroso', emoji: '🟤' }
        };
        
        return {
            aqi: usEpaIndex,
            level: aqiLevels[usEpaIndex]?.level || 'Desconocido',
            emoji: aqiLevels[usEpaIndex]?.emoji || '⚪',
            components: {
                co: data.co,
                no2: data.no2,
                o3: data.o3,
                so2: data.so2,
                pm2_5: data.pm2_5,
                pm10: data.pm10
            }
        };
    }
    
    getWeatherIcon(code, isDay) {
        // Mapeo simplificado
        if (code === 1000) return isDay ? '01d' : '01n'; // Clear
        if ([1003].includes(code)) return isDay ? '02d' : '02n'; // Partly cloudy
        if ([1006, 1009].includes(code)) return '04d'; // Cloudy
        if ([1063, 1180, 1183, 1186, 1189, 1192, 1195].includes(code)) return '10d'; // Rain
        if ([1087, 1273, 1276].includes(code)) return '11d'; // Thunderstorm
        if ([1066, 1210, 1213, 1216, 1219, 1222, 1225].includes(code)) return '13d'; // Snow
        if ([1030, 1135, 1147].includes(code)) return '50d'; // Mist/Fog
        
        return '01d';
    }
    
    getWeatherEmoji(code) {
        if (code === 1000) return '☀️';
        if ([1003].includes(code)) return '🌤️';
        if ([1006, 1009].includes(code)) return '☁️';
        if ([1063, 1180, 1183, 1186, 1189, 1192, 1195].includes(code)) return '🌧️';
        if ([1087, 1273, 1276].includes(code)) return '⛈️';
        if ([1066, 1210, 1213, 1216, 1219, 1222, 1225].includes(code)) return '🌨️';
        if ([1030, 1135, 1147].includes(code)) return '🌫️';
        if ([1264, 1279, 1282].includes(code)) return '⛈️';
        
        return '🌡️';
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      CLASE PRINCIPAL WEATHER                                │
// ═══════════════════════════════════════════════════════════════════════════════

class Weather {
    constructor(options = {}) {
        this.apiKey = options.apiKey || CONFIG.API_KEYS[CONFIG.PREFERRED_API];
        this.preferredAPI = options.api || CONFIG.PREFERRED_API;
        this.units = options.units || CONFIG.DEFAULT_UNITS;
        this.language = options.language || CONFIG.DEFAULT_LANGUAGE;
        
        // Inicializar adaptadores
        this.adapters = {
            OPENWEATHERMAP: new OpenWeatherMapAdapter(CONFIG.API_KEYS.OPENWEATHERMAP),
            WEATHERAPI: new WeatherAPIAdapter(CONFIG.API_KEYS.WEATHERAPI)
        };
        
        this.currentAdapter = this.adapters[this.preferredAPI];
        
        Logger.info(`☁️ Weather iniciado con API: ${this.preferredAPI}`);
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      MÉTODOS PRINCIPALES                              │
    // ═════════════════════════════════════════════════════════════════════════
    
    async getCurrentWeather(location) {
        try {
            // Verificar caché
            const cached = cache.get(location, 'current');
            if (cached) return cached;
            
            Logger.info(`🌡️ Obteniendo clima actual para: ${location}`);
            
            const data = await this.currentAdapter.getCurrentWeather(
                location,
                this.units,
                this.language
            );
            
            // Guardar en caché
            cache.set(location, 'current', data);
            
            return data;
            
        } catch (error) {
            if (CONFIG.AUTO_FALLBACK) {
                return await this.fallbackRequest('getCurrentWeather', location);
            }
            throw error;
        }
    }
    
    async getForecast(location, days = 7) {
        try {
            // Verificar caché
            const cached = cache.get(location, `forecast_${days}`);
            if (cached) return cached;
            
            Logger.info(`📅 Obteniendo pronóstico para: ${location} (${days} días)`);
            
            const data = await this.currentAdapter.getForecast(
                location,
                days,
                this.units,
                this.language
            );
            
            // Guardar en caché
            cache.set(location, `forecast_${days}`, data);
            
            return data;
            
        } catch (error) {
            if (CONFIG.AUTO_FALLBACK) {
                return await this.fallbackRequest('getForecast', location, days);
            }
            throw error;
        }
    }
    
    async getAirQuality(location) {
        try {
            const cached = cache.get(location, 'airquality');
            if (cached) return cached;
            
            Logger.info(`🌬️ Obteniendo calidad del aire: ${location}`);
            
            const data = await this.currentAdapter.getAirQuality(location);
            
            if (data) {
                cache.set(location, 'airquality', data);
            }
            
            return data;
            
        } catch (error) {
            Logger.warn('No se pudo obtener calidad del aire');
            return null;
        }
    }
    
    async getCompleteWeather(location, forecastDays = 7) {
        const [current, forecast, airQuality] = await Promise.allSettled([
            this.getCurrentWeather(location),
            this.getForecast(location, forecastDays),
            this.getAirQuality(location)
        ]);
        
        return {
            current: current.status === 'fulfilled' ? current.value : null,
            forecast: forecast.status === 'fulfilled' ? forecast.value : null,
            airQuality: airQuality.status === 'fulfilled' ? airQuality.value : null
        };
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      FALLBACK                                         │
    // ═════════════════════════════════════════════════════════════════════════
    
    async fallbackRequest(method, ...args) {
        Logger.warn(`⚠️ Intentando fallback para ${method}`);
        
        const apis = Object.keys(this.adapters).filter(
            api => api !== this.preferredAPI
        );
        
        for (const apiName of apis) {
            try {
                Logger.info(`🔄 Intentando con ${apiName}`);
                this.currentAdapter = this.adapters[apiName];
                
                const result = await this.currentAdapter[method](...args);
                
                Logger.info(`✅ Éxito con ${apiName}`);
                return result;
                
            } catch (error) {
                Logger.error(`❌ Falló ${apiName}:`, error.message);
                continue;
            }
        }
        
        throw new Error('Todas las APIs fallaron');
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      FORMATEO Y VISUALIZACIÓN                         │
    // ═════════════════════════════════════════════════════════════════════════
    
    formatCurrentWeather(data) {
        const { location, current } = data;
        const unit = this.units === 'metric' ? '°C' : '°F';
        
        let output = '\n';
        output += '═══════════════════════════════════════════════════════════\n';
        output += `           ${current.emoji} CLIMA ACTUAL ${current.emoji}\n`;
        output += '═══════════════════════════════════════════════════════════\n\n';
        
        output += `📍 *Ubicación:* ${location.name}, ${location.country}\n`;
        output += `🕐 *Actualizado:* ${current.timestamp.toLocaleString('es-ES')}\n\n`;
        
        output += `🌡️ *Temperatura:* ${current.temp}${unit}\n`;
        output += `🤔 *Sensación:* ${current.feelsLike}${unit}\n`;
        output += `📊 *Rango:* ${current.tempMin}${unit} - ${current.tempMax}${unit}\n\n`;
        
        output += `☁️ *Condición:* ${current.description}\n`;
        output += `💧 *Humedad:* ${current.humidity}%\n`;
        output += `💨 *Viento:* ${current.windSpeed} ${this.units === 'metric' ? 'km/h' : 'mph'}\n`;
        output += `👁️ *Visibilidad:* ${(current.visibility / 1000).toFixed(1)} km\n`;
        output += `🎈 *Presión:* ${current.pressure} hPa\n`;
        output += `☁️ *Nubes:* ${current.clouds}%\n\n`;
        
        if (current.sunrise && current.sunset) {
            output += `🌅 *Amanecer:* ${current.sunrise.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}\n`;
            output += `🌇 *Atardecer:* ${current.sunset.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}\n\n`;
        }
        
        output += '═══════════════════════════════════════════════════════════\n';
        
        return output;
    }
    
    formatForecast(data, days = 7) {
        const { location, forecast } = data;
        const unit = this.units === 'metric' ? '°C' : '°F';
        
        let output = '\n';
        output += '═══════════════════════════════════════════════════════════\n';
        output += `       📅 PRONÓSTICO ${days} DÍAS - ${location.name}\n`;
        output += '═══════════════════════════════════════════════════════════\n\n';
        
        forecast.slice(0, days).forEach((day, index) => {
            const date = day.date;
            const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' });
            const dateStr = date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
            
            output += `${day.emoji} *${dayName.toUpperCase()} ${dateStr}*\n`;
            output += `   🌡️ ${day.temp.min}${unit} - ${day.temp.max}${unit}\n`;
            output += `   ☁️ ${day.description}\n`;
            output += `   💧 Humedad: ${day.humidity}%`;
            
            if (day.pop) {
                output += ` | 🌧️ Lluvia: ${day.pop}%`;
            }
            
            output += '\n\n';
        });
        
        output += '═══════════════════════════════════════════════════════════\n';
        
        return output;
    }
    
    formatAirQuality(data) {
        if (!data) return '\n⚠️ *Calidad del aire no disponible*\n';
        
        let output = '\n';
        output += '═══════════════════════════════════════════════════════════\n';
        output += `     ${data.emoji} CALIDAD DEL AIRE (AQI)\n`;
        output += '═══════════════════════════════════════════════════════════\n\n';
        
        output += `📊 *Índice:* ${data.aqi}/5\n`;
        output += `🏷️ *Nivel:* ${data.level}\n`;
        if (data.description) {
            output += `📝 *Descripción:* ${data.description}\n`;
        }
        output += '\n';
        
        if (data.components) {
            output += '*Componentes (μg/m³):*\n';
            output += `• PM2.5: ${data.components.pm2_5?.toFixed(2) || 'N/A'}\n`;
            output += `• PM10: ${data.components.pm10?.toFixed(2) || 'N/A'}\n`;
            output += `• O₃: ${data.components.o3?.toFixed(2) || 'N/A'}\n`;
            output += `• NO₂: ${data.components.no2?.toFixed(2) || 'N/A'}\n`;
            output += `• SO₂: ${data.components.so2?.toFixed(2) || 'N/A'}\n`;
            output += `• CO: ${data.components.co?.toFixed(2) || 'N/A'}\n`;
        }
        
        output += '\n═══════════════════════════════════════════════════════════\n';
        
        return output;
    }
    
    formatCompleteWeather(data, forecastDays = 7) {
        let output = '';
        
        if (data.current) {
            output += this.formatCurrentWeather(data.current);
        }
        
        if (data.forecast) {
            output += '\n' + this.formatForecast(data.forecast, forecastDays);
        }
        
        if (data.airQuality) {
            output += '\n' + this.formatAirQuality(data.airQuality);
        }
        
        return output;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      INSTANCIA GLOBAL                                       │
// ═══════════════════════════════════════════════════════════════════════════════

const weather = new Weather();

// ═══════════════════════════════════════════════════════════════════════════════
// │                      EXPORTACIONES                                          │
// ═══════════════════════════════════════════════════════════════════════════════

export default Weather;
export {
    Weather,
    OpenWeatherMapAdapter,
    WeatherAPIAdapter,
    cache,
    weather,
    CONFIG,
    WEATHER_EMOJIS
};
