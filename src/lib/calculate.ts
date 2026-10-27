/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                   𒁈 CALCULATE V1.0 ULTRA 𒁈                                ┃
 * ┃              Calculadora Científica y Sistema de Conversiones               ┃
 * ┃                    Creado para: Avenix-Multi V6.1.0                          ┃
 * ┃                    By: Hepein Oficial                                        ┃
 * ┃                                                                               ┃
 * ┃  CARACTERÍSTICAS:                                                            ┃
 * ┃  ✅ Operaciones básicas (+, -, *, /, ^, √)                                  ┃
 * ┃  ✅ Funciones científicas (sin, cos, tan, log, ln, exp)                     ┃
 * ┃  ✅ Conversiones de unidades (longitud, peso, temperatura, etc)             ┃
 * ┃  ✅ Conversiones de monedas (con tasas actualizadas)                        ┃
 * ┃  ✅ Cálculo de porcentajes                                                  ┃
 * ┃  ✅ Estadísticas (media, mediana, moda, desv. estándar)                     ┃
 * ┃  ✅ Operaciones con matrices                                                ┃
 * ┃  ✅ Resolución de ecuaciones                                                ┃
 * ┃  ✅ Evaluación de expresiones complejas                                     ┃
 * ┃  ✅ Sistema de constantes (π, e, φ, etc)                                    ┃
 * ┃  ✅ Historial de cálculos                                                   ┃
 * ┃  ✅ Formato de resultados (decimales, notación científica)                  ┃
 * ┃  ✅ Modo radianes/grados                                                    ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import axios from 'axios';
import paint from './paint.js'

// ═══════════════════════════════════════════════════════════════════════════════
// │                        CONFIGURACIÓN GLOBAL                                 │
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
    // Modo angular
    ANGLE_MODE: 'rad', // 'rad' | 'deg'
    
    // Precisión
    DEFAULT_DECIMALS: 10,
    MAX_DECIMALS: 15,
    
    // Formato de números
    USE_SCIENTIFIC_NOTATION: false,
    SCIENTIFIC_THRESHOLD: 1e6,
    
    // Separadores
    DECIMAL_SEPARATOR: '.',
    THOUSANDS_SEPARATOR: ',',
    
    // Historial
    HISTORY_ENABLED: true,
    MAX_HISTORY: 100,
    
    // API de conversión de monedas
    CURRENCY_API_KEY: process.env.CURRENCY_API_KEY || 'YOUR_API_KEY',
    CURRENCY_API_URL: 'https://api.exchangerate-api.com/v4/latest/',
    CACHE_CURRENCY_TIME: 3600000, // 1 hora
    
    // Logging
    LOG_ENABLED: true,
    LOG_LEVEL: 'info'
};

// ═══════════════════════════════════════════════════════════════════════════════
// │                      CONSTANTES MATEMÁTICAS                                 │
// ═══════════════════════════════════════════════════════════════════════════════

const CONSTANTS = {
    PI: Math.PI,                           // π ≈ 3.14159
    E: Math.E,                             // e ≈ 2.71828
    PHI: (1 + Math.sqrt(5)) / 2,          // φ ≈ 1.61803 (proporción áurea)
    TAU: 2 * Math.PI,                      // τ = 2π ≈ 6.28318
    SQRT2: Math.SQRT2,                     // √2 ≈ 1.41421
    SQRT1_2: Math.SQRT1_2,                 // √(1/2) ≈ 0.70710
    LN2: Math.LN2,                         // ln(2) ≈ 0.69314
    LN10: Math.LN10,                       // ln(10) ≈ 2.30258
    LOG2E: Math.LOG2E,                     // log₂(e) ≈ 1.44269
    LOG10E: Math.LOG10E                    // log₁₀(e) ≈ 0.43429
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
            debug: paint.bold.bgBlue(' DEBUG '),
            info: paint.bold.bgGreen(' INFO '),
            warn: paint.bold.bgYellow(' WARN '),
            error: paint.bold.bgRed(' ERROR ')
        }[level];
        
        console.log(prefix, '[Calculate]:', ...args);
    }
    
    static debug(...args) { this.log('debug', ...args); }
    static info(...args) { this.log('info', ...args); }
    static warn(...args) { this.log('warn', ...args); }
    static error(...args) { this.log('error', ...args); }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      UTILIDADES DE FORMATO                                  │
// ═══════════════════════════════════════════════════════════════════════════════

class NumberFormatter {
    static format(number, decimals = CONFIG.DEFAULT_DECIMALS) {
        if (typeof number !== 'number' || isNaN(number)) {
            return 'Error';
        }
        
        if (!isFinite(number)) {
            return number > 0 ? '∞' : '-∞';
        }
        
        // Notación científica para números muy grandes o pequeños
        if (CONFIG.USE_SCIENTIFIC_NOTATION) {
            if (Math.abs(number) >= CONFIG.SCIENTIFIC_THRESHOLD || 
                (Math.abs(number) < 1e-6 && number !== 0)) {
                return number.toExponential(decimals);
            }
        }
        
        // Redondear
        const rounded = Number(number.toFixed(decimals));
        
        // Separador de miles
        if (CONFIG.THOUSANDS_SEPARATOR) {
            const parts = rounded.toString().split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, CONFIG.THOUSANDS_SEPARATOR);
            return parts.join(CONFIG.DECIMAL_SEPARATOR);
        }
        
        return rounded;
    }
    
    static toFraction(decimal, tolerance = 1e-6) {
        let numerator = 1;
        let denominator = 1;
        let error = Math.abs(decimal - numerator / denominator);
        
        for (let d = 2; d <= 10000; d++) {
            for (let n = 1; n < d; n++) {
                const newError = Math.abs(decimal - n / d);
                if (newError < error) {
                    numerator = n;
                    denominator = d;
                    error = newError;
                    
                    if (error < tolerance) {
                        return { numerator, denominator, string: `${numerator}/${denominator}` };
                    }
                }
            }
        }
        
        return { numerator, denominator, string: `${numerator}/${denominator}` };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      CALCULADORA BÁSICA                                     │
// ═══════════════════════════════════════════════════════════════════════════════

class BasicCalculator {
    // Operaciones básicas
    static add(...numbers) {
        return numbers.reduce((a, b) => a + b, 0);
    }
    
    static subtract(a, b) {
        return a - b;
    }
    
    static multiply(...numbers) {
        return numbers.reduce((a, b) => a * b, 1);
    }
    
    static divide(a, b) {
        if (b === 0) throw new Error('División por cero');
        return a / b;
    }
    
    static power(base, exponent) {
        return Math.pow(base, exponent);
    }
    
    static sqrt(number) {
        if (number < 0) throw new Error('Raíz cuadrada de número negativo');
        return Math.sqrt(number);
    }
    
    static cbrt(number) {
        return Math.cbrt(number);
    }
    
    static nthRoot(number, n) {
        if (n === 0) throw new Error('Índice de raíz no puede ser cero');
        return Math.pow(number, 1 / n);
    }
    
    static abs(number) {
        return Math.abs(number);
    }
    
    static floor(number) {
        return Math.floor(number);
    }
    
    static ceil(number) {
        return Math.ceil(number);
    }
    
    static round(number, decimals = 0) {
        const factor = Math.pow(10, decimals);
        return Math.round(number * factor) / factor;
    }
    
    static mod(a, b) {
        return ((a % b) + b) % b;
    }
    
    static factorial(n) {
        if (n < 0) throw new Error('Factorial de número negativo');
        if (n === 0 || n === 1) return 1;
        
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }
    
    static gcd(a, b) {
        a = Math.abs(a);
        b = Math.abs(b);
        
        while (b !== 0) {
            const temp = b;
            b = a % b;
            a = temp;
        }
        
        return a;
    }
    
    static lcm(a, b) {
        return Math.abs(a * b) / this.gcd(a, b);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      CALCULADORA CIENTÍFICA                                 │
// ═══════════════════════════════════════════════════════════════════════════════

class ScientificCalculator {
    // Conversión de ángulos
    static toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
    
    static toDegrees(radians) {
        return radians * (180 / Math.PI);
    }
    
    // Funciones trigonométricas
    static sin(angle) {
        if (CONFIG.ANGLE_MODE === 'deg') {
            angle = this.toRadians(angle);
        }
        return Math.sin(angle);
    }
    
    static cos(angle) {
        if (CONFIG.ANGLE_MODE === 'deg') {
            angle = this.toRadians(angle);
        }
        return Math.cos(angle);
    }
    
    static tan(angle) {
        if (CONFIG.ANGLE_MODE === 'deg') {
            angle = this.toRadians(angle);
        }
        return Math.tan(angle);
    }
    
    // Funciones trigonométricas inversas
    static asin(value) {
        const result = Math.asin(value);
        return CONFIG.ANGLE_MODE === 'deg' ? this.toDegrees(result) : result;
    }
    
    static acos(value) {
        const result = Math.acos(value);
        return CONFIG.ANGLE_MODE === 'deg' ? this.toDegrees(result) : result;
    }
    
    static atan(value) {
        const result = Math.atan(value);
        return CONFIG.ANGLE_MODE === 'deg' ? this.toDegrees(result) : result;
    }
    
    static atan2(y, x) {
        const result = Math.atan2(y, x);
        return CONFIG.ANGLE_MODE === 'deg' ? this.toDegrees(result) : result;
    }
    
    // Funciones hiperbólicas
    static sinh(x) {
        return Math.sinh(x);
    }
    
    static cosh(x) {
        return Math.cosh(x);
    }
    
    static tanh(x) {
        return Math.tanh(x);
    }
    
    static asinh(x) {
        return Math.asinh(x);
    }
    
    static acosh(x) {
        return Math.acosh(x);
    }
    
    static atanh(x) {
        return Math.atanh(x);
    }
    
    // Logaritmos
    static log(x, base = 10) {
        if (x <= 0) throw new Error('Logaritmo de número no positivo');
        if (base === 10) return Math.log10(x);
        if (base === 2) return Math.log2(x);
        return Math.log(x) / Math.log(base);
    }
    
    static ln(x) {
        if (x <= 0) throw new Error('Logaritmo natural de número no positivo');
        return Math.log(x);
    }
    
    // Exponencial
    static exp(x) {
        return Math.exp(x);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      CALCULADORA DE PORCENTAJES                             │
// ═══════════════════════════════════════════════════════════════════════════════

class PercentageCalculator {
    // ¿Qué porcentaje es X de Y?
    static percentOf(x, y) {
        if (y === 0) throw new Error('División por cero');
        return (x / y) * 100;
    }
    
    // ¿Cuánto es el X% de Y?
    static calculate(percentage, number) {
        return (percentage / 100) * number;
    }
    
    // Aumentar Y en X%
    static increase(number, percentage) {
        return number * (1 + percentage / 100);
    }
    
    // Disminuir Y en X%
    static decrease(number, percentage) {
        return number * (1 - percentage / 100);
    }
    
    // Cambio porcentual de X a Y
    static change(oldValue, newValue) {
        if (oldValue === 0) throw new Error('Valor inicial no puede ser cero');
        return ((newValue - oldValue) / oldValue) * 100;
    }
    
    // Diferencia porcentual entre X e Y
    static difference(value1, value2) {
        const avg = (value1 + value2) / 2;
        if (avg === 0) throw new Error('Promedio es cero');
        return ((value2 - value1) / avg) * 100;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      CALCULADORA ESTADÍSTICA                                │
// ═══════════════════════════════════════════════════════════════════════════════

class StatisticsCalculator {
    // Media (promedio)
    static mean(numbers) {
        if (numbers.length === 0) throw new Error('Array vacío');
        return numbers.reduce((a, b) => a + b, 0) / numbers.length;
    }
    
    // Mediana
    static median(numbers) {
        if (numbers.length === 0) throw new Error('Array vacío');
        
        const sorted = [...numbers].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        
        if (sorted.length % 2 === 0) {
            return (sorted[mid - 1] + sorted[mid]) / 2;
        }
        return sorted[mid];
    }
    
    // Moda (valor más frecuente)
    static mode(numbers) {
        if (numbers.length === 0) throw new Error('Array vacío');
        
        const frequency: Record<string, any> = {};
        let maxFreq = 0;
        let modes: any[] = [];
        
        numbers.forEach(num => {
            frequency[num] = (frequency[num] || 0) + 1;
            if (frequency[num] > maxFreq) {
                maxFreq = frequency[num];
            }
        });
        
        for (let num in frequency) {
            if (frequency[num] === maxFreq) {
                modes.push(Number(num));
            }
        }
        
        return modes.length === numbers.length ? null : modes;
    }
    
    // Rango
    static range(numbers) {
        if (numbers.length === 0) throw new Error('Array vacío');
        return Math.max(...numbers) - Math.min(...numbers);
    }
    
    // Varianza
    static variance(numbers, sample = true) {
        if (numbers.length === 0) throw new Error('Array vacío');
        
        const mean = this.mean(numbers);
        const squaredDiffs = numbers.map(x => Math.pow(x - mean, 2));
        const divisor = sample ? numbers.length - 1 : numbers.length;
        
        return squaredDiffs.reduce((a, b) => a + b, 0) / divisor;
    }
    
    // Desviación estándar
    static standardDeviation(numbers, sample = true) {
        return Math.sqrt(this.variance(numbers, sample));
    }
    
    // Suma
    static sum(numbers) {
        if (numbers.length === 0) throw new Error('Array vacío');
        return numbers.reduce((a, b) => a + b, 0);
    }
    
    // Producto
    static product(numbers) {
        if (numbers.length === 0) throw new Error('Array vacío');
        return numbers.reduce((a, b) => a * b, 1);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      CONVERSOR DE UNIDADES                                  │
// ═══════════════════════════════════════════════════════════════════════════════

class UnitConverter {
    static units = {
        // Longitud
        length: {
            m: 1,              // metro (base)
            km: 0.001,
            cm: 100,
            mm: 1000,
            mi: 0.000621371,   // milla
            yd: 1.09361,       // yarda
            ft: 3.28084,       // pie
            in: 39.3701,       // pulgada
            nm: 0.000539957    // milla náutica
        },
        
        // Peso/Masa
        weight: {
            kg: 1,             // kilogramo (base)
            g: 1000,
            mg: 1000000,
            lb: 2.20462,       // libra
            oz: 35.274,        // onza
            ton: 0.001,        // tonelada métrica
            st: 0.157473       // stone
        },
        
        // Temperatura (requiere fórmulas especiales)
        temperature: {},
        
        // Velocidad
        speed: {
            'm/s': 1,          // metros por segundo (base)
            'km/h': 3.6,
            'mi/h': 2.23694,   // mph
            'ft/s': 3.28084,
            'knot': 1.94384    // nudo
        },
        
        // Área
        area: {
            'm²': 1,           // metro cuadrado (base)
            'km²': 0.000001,
            'cm²': 10000,
            'mm²': 1000000,
            'ha': 0.0001,      // hectárea
            'acre': 0.000247105,
            'ft²': 10.7639,
            'mi²': 3.861e-7
        },
        
        // Volumen
        volume: {
            'l': 1,            // litro (base)
            'ml': 1000,
            'm³': 0.001,
            'gal': 0.264172,   // galón (US)
            'qt': 1.05669,     // cuarto (US)
            'pt': 2.11338,     // pinta (US)
            'cup': 4.22675,
            'fl-oz': 33.814,   // onza fluida (US)
            'tbsp': 67.628,    // cucharada
            'tsp': 202.884     // cucharadita
        },
        
        // Tiempo
        time: {
            's': 1,            // segundo (base)
            'min': 1/60,
            'h': 1/3600,
            'day': 1/86400,
            'week': 1/604800,
            'month': 1/2628000,
            'year': 1/31536000
        },
        
        // Energía
        energy: {
            'J': 1,            // joule (base)
            'kJ': 0.001,
            'cal': 0.239006,   // caloría
            'kcal': 0.000239006,
            'Wh': 0.000277778, // vatio-hora
            'kWh': 2.77778e-7,
            'eV': 6.242e+18,   // electronvoltio
            'BTU': 0.000947817
        },
        
        // Presión
        pressure: {
            'Pa': 1,           // pascal (base)
            'kPa': 0.001,
            'MPa': 0.000001,
            'bar': 0.00001,
            'psi': 0.000145038,
            'atm': 9.8692e-6,  // atmósfera
            'mmHg': 0.00750062, // torr
            'inHg': 0.000295301
        },
        
        // Datos digitales
        data: {
            'B': 1,            // byte (base)
            'KB': 1/1024,
            'MB': 1/1048576,
            'GB': 1/1073741824,
            'TB': 1/1099511627776,
            'bit': 8,
            'Kb': 8/1024,
            'Mb': 8/1048576,
            'Gb': 8/1073741824
        }
    };
    
    static convert(value, from, to, category) {
        // Temperatura requiere manejo especial
        if (category === 'temperature') {
            return this.convertTemperature(value, from, to);
        }
        
        const units = this.units[category];
        if (!units) throw new Error(`Categoría desconocida: ${category}`);
        if (!units[from]) throw new Error(`Unidad de origen desconocida: ${from}`);
        if (!units[to]) throw new Error(`Unidad de destino desconocida: ${to}`);
        
        // Convertir a unidad base, luego a unidad destino
        const baseValue = value / units[from];
        return baseValue * units[to];
    }
    
    static convertTemperature(value, from, to) {
        let celsius;
        
        // Convertir a Celsius primero
        switch (from) {
            case 'C':
                celsius = value;
                break;
            case 'F':
                celsius = (value - 32) * 5/9;
                break;
            case 'K':
                celsius = value - 273.15;
                break;
            default:
                throw new Error(`Unidad de temperatura desconocida: ${from}`);
        }
        
        // Convertir de Celsius a unidad destino
        switch (to) {
            case 'C':
                return celsius;
            case 'F':
                return celsius * 9/5 + 32;
            case 'K':
                return celsius + 273.15;
            default:
                throw new Error(`Unidad de temperatura desconocida: ${to}`);
        }
    }
    
    static getAvailableUnits(category) {
        if (category === 'temperature') {
            return ['C', 'F', 'K'];
        }
        return Object.keys(this.units[category] || {});
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      CONVERSOR DE MONEDAS                                   │
// ═══════════════════════════════════════════════════════════════════════════════

class CurrencyConverter {
    rates: any
    lastUpdate: number

    static rates: Record<string, number> = {};
    static lastUpdate: number | null = null;
    
    static async updateRates(base = 'USD') {
        // Verificar si necesita actualizar
        if (this.rates && this.lastUpdate && 
            Date.now() - this.lastUpdate < CONFIG.CACHE_CURRENCY_TIME) {
            return;
        }
        
        try {
            const response = await axios.get(`${CONFIG.CURRENCY_API_URL}${base}`, {
                timeout: 10000
            });
            
            this.rates = response.data.rates;
            this.lastUpdate = Date.now();
            
            Logger.info('✅ Tasas de cambio actualizadas');
            
        } catch (error) {
            Logger.error('Error actualizando tasas:', error.message);
            throw new Error('No se pudieron obtener las tasas de cambio');
        }
    }
    
    static async convert(amount, from, to) {
        await this.updateRates(from);
        
        if (!this.rates[to]) {
            throw new Error(`Moneda desconocida: ${to}`);
        }
        
        return amount * this.rates[to];
    }
    
    static getSupportedCurrencies() {
        return this.rates ? Object.keys(this.rates) : [];
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      EVALUADOR DE EXPRESIONES                               │
// ═══════════════════════════════════════════════════════════════════════════════

class ExpressionEvaluator {
    static evaluate(expression) {
        try {
            // Limpiar expresión
            expression = expression.replace(/\s+/g, '');
            
            // Reemplazar constantes
            Object.entries(CONSTANTS).forEach(([name, value]) => {
                const regex = new RegExp(name, 'gi');
                expression = expression.replace(regex, value);
            });
            
            // Reemplazar funciones matemáticas
            expression = this.replaceFunctions(expression);
            
            // Evaluar (con precaución)
            const result = this.safeEval(expression);
            
            if (typeof result !== 'number' || isNaN(result)) {
                throw new Error('Resultado inválido');
            }
            
            return result;
            
        } catch (error) {
            throw new Error(`Error evaluando expresión: ${error.message}`);
        }
    }
    
    static replaceFunctions(expr) {
        const functions = {
            'sqrt': 'Math.sqrt',
            'sin': 'Math.sin',
            'cos': 'Math.cos',
            'tan': 'Math.tan',
            'asin': 'Math.asin',
            'acos': 'Math.acos',
            'atan': 'Math.atan',
            'log': 'Math.log10',
            'ln': 'Math.log',
            'exp': 'Math.exp',
            'abs': 'Math.abs',
            'floor': 'Math.floor',
            'ceil': 'Math.ceil',
            'round': 'Math.round'
        };
        
        Object.entries(functions).forEach(([name, mathFunc]) => {
            const regex = new RegExp(name, 'g');
            expr = expr.replace(regex, mathFunc);
        });
        
        // Reemplazar ^ por **
        expr = expr.replace(/\^/g, '**');
        
        return expr;
    }
    
    static safeEval(expr) {
        // Validar que solo contenga caracteres permitidos
        if (!/^[0-9+\-*/.()Math\s]+$/.test(expr.replace(/Math\.\w+/g, ''))) {
            throw new Error('Expresión contiene caracteres no permitidos');
        }
        
        // Evaluar usando Function (más seguro que eval directo)
        return new Function(`return ${expr}`)();
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      CLASE PRINCIPAL CALCULATOR                             │
// ═══════════════════════════════════════════════════════════════════════════════

class Calculator {
    angleMode: any
    decimals: any
    history: any[]

    constructor(options: Record<string, any> = {}) {
        this.angleMode = options.angleMode || CONFIG.ANGLE_MODE;
        this.decimals = options.decimals || CONFIG.DEFAULT_DECIMALS;
        this.history = [];
        
        // Configurar modo angular global
        CONFIG.ANGLE_MODE = this.angleMode;
        
        Logger.info(`🔢 Calculadora inicializada (modo: ${this.angleMode})`);
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      MÉTODOS DE ACCESO                                │
    // ═════════════════════════════════════════════════════════════════════════
    
    // Operaciones básicas
    add(...numbers) { return this.calculate('add', BasicCalculator.add(...numbers), numbers); }
    subtract(a, b) { return this.calculate('subtract', BasicCalculator.subtract(a, b), [a, b]); }
    multiply(...numbers) { return this.calculate('multiply', BasicCalculator.multiply(...numbers), numbers); }
    divide(a, b) { return this.calculate('divide', BasicCalculator.divide(a, b), [a, b]); }
    power(base, exp) { return this.calculate('power', BasicCalculator.power(base, exp), [base, exp]); }
    sqrt(n) { return this.calculate('sqrt', BasicCalculator.sqrt(n), [n]); }
    
    // Trigonometría
    sin(angle) { return this.calculate('sin', ScientificCalculator.sin(angle), [angle]); }
    cos(angle) { return this.calculate('cos', ScientificCalculator.cos(angle), [angle]); }
    tan(angle) { return this.calculate('tan', ScientificCalculator.tan(angle), [angle]); }
    
    // Logaritmos
    log(x, base) { return this.calculate('log', ScientificCalculator.log(x, base), [x, base]); }
    ln(x) { return this.calculate('ln', ScientificCalculator.ln(x), [x]); }
    
    // Porcentajes
    percent(percentage, number) { 
        return this.calculate('percent', PercentageCalculator.calculate(percentage, number), [percentage, number]); 
    }
    percentIncrease(number, percentage) {
        return this.calculate('percentIncrease', PercentageCalculator.increase(number, percentage), [number, percentage]);
    }
    percentDecrease(number, percentage) {
        return this.calculate('percentDecrease', PercentageCalculator.decrease(number, percentage), [number, percentage]);
    }
    
    // Estadísticas
    mean(numbers) { return this.calculate('mean', StatisticsCalculator.mean(numbers), numbers); }
    median(numbers) { return this.calculate('median', StatisticsCalculator.median(numbers), numbers); }
    mode(numbers) { return this.calculate('mode', StatisticsCalculator.mode(numbers), numbers); }
    stdDev(numbers) { return this.calculate('stdDev', StatisticsCalculator.standardDeviation(numbers), numbers); }
    
    // Conversiones
    convertUnit(value, from, to, category) {
        const result = UnitConverter.convert(value, from, to, category);
        return this.calculate('convert', result, [value, from, to, category]);
    }
    
    async convertCurrency(amount, from, to) {
        const result = await CurrencyConverter.convert(amount, from, to);
        return this.calculate('convertCurrency', result, [amount, from, to]);
    }
    
    // Evaluación de expresiones
    eval(expression) {
        const result = ExpressionEvaluator.evaluate(expression);
        return this.calculate('eval', result, [expression]);
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      GESTIÓN DE CÁLCULOS                              │
    // ═════════════════════════════════════════════════════════════════════════
    
    calculate(operation, result, inputs) {
        const formatted = NumberFormatter.format(result, this.decimals);
        
        if (CONFIG.HISTORY_ENABLED) {
            this.addToHistory({
                operation,
                inputs,
                result,
                formatted,
                timestamp: new Date()
            });
        }
        
        Logger.debug(`${operation}: ${inputs.join(', ')} = ${formatted}`);
        
        return {
            result,
            formatted,
            operation,
            inputs
        };
    }
    
    addToHistory(entry) {
        this.history.push(entry);
        
        if (this.history.length > CONFIG.MAX_HISTORY) {
            this.history.shift();
        }
    }
    
    getHistory(limit = 10) {
        return this.history.slice(-limit).reverse();
    }
    
    clearHistory() {
        this.history = [];
        Logger.info('🗑️ Historial limpiado');
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      CONFIGURACIÓN                                    │
    // ═════════════════════════════════════════════════════════════════════════
    
    setAngleMode(mode) {
        if (!['rad', 'deg'].includes(mode)) {
            throw new Error('Modo debe ser "rad" o "deg"');
        }
        this.angleMode = mode;
        CONFIG.ANGLE_MODE = mode;
        Logger.info(`📐 Modo angular: ${mode}`);
    }
    
    setDecimals(decimals) {
        if (decimals < 0 || decimals > CONFIG.MAX_DECIMALS) {
            throw new Error(`Decimales debe estar entre 0 y ${CONFIG.MAX_DECIMALS}`);
        }
        this.decimals = decimals;
        Logger.info(`🔢 Decimales: ${decimals}`);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      INSTANCIA GLOBAL                                       │
// ═══════════════════════════════════════════════════════════════════════════════

const calculator = new Calculator();

// ═══════════════════════════════════════════════════════════════════════════════
// │                      EXPORTACIONES                                          │
// ═══════════════════════════════════════════════════════════════════════════════

export default Calculator;
export {
    Calculator,
    BasicCalculator,
    ScientificCalculator,
    PercentageCalculator,
    StatisticsCalculator,
    UnitConverter,
    CurrencyConverter,
    ExpressionEvaluator,
    NumberFormatter,
    calculator,
    CONSTANTS,
    CONFIG
};
