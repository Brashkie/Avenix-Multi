/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                            𒁈 AVENIX-MULTI V2.0.0 𒁈                         ┃
 * ┃                   LIB/AI.JS - INTEGRACIONES CON SERVICIOS DE IA             ┃
 * ┃                          Creado por: Hepein Oficial                          ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import fetch from 'node-fetch'
import chalk from 'chalk'
import { fetchWithRetry } from './functions.js'

// ═══════════════════════════════════════════════════════════════════════════════
// │                        CLASE PRINCIPAL DE IA                                │
// ═══════════════════════════════════════════════════════════════════════════════

class AvenixAI {
    constructor() {
        this.models = {
            gpt: {
                name: 'ChatGPT',
                endpoint: 'https://api.openai.com/v1/chat/completions',
                key: process.env.OPENAI_API_KEY,
                maxTokens: 2000,
                model: 'gpt-3.5-turbo'
            },
            claude: {
                name: 'Claude',
                endpoint: 'https://api.anthropic.com/v1/messages',
                key: process.env.ANTHROPIC_API_KEY,
                maxTokens: 2000,
                model: 'claude-3-haiku-20240307'
            },
            gemini: {
                name: 'Gemini',
                endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
                key: process.env.GEMINI_API_KEY,
                maxTokens: 2000
            }
        }
        
        this.conversationHistory = new Map() // JID -> conversación
        this.maxHistoryLength = 10 // Máximo de mensajes en historial
        this.requestCount = new Map() // Rate limiting por usuario
        this.maxRequestsPerHour = 20
        
        console.log(chalk.green('𒁈 AI engine inicializado'))
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                           FUNCIONES DE UTILIDAD                             │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    checkRateLimit(userId) {
        const now = Date.now()
        const hourAgo = now - (60 * 60 * 1000)
        
        if (!this.requestCount.has(userId)) {
            this.requestCount.set(userId, [])
        }
        
        const userRequests = this.requestCount.get(userId)
        
        // Limpiar requests antiguos
        const recentRequests = userRequests.filter(time => time > hourAgo)
        this.requestCount.set(userId, recentRequests)
        
        if (recentRequests.length >= this.maxRequestsPerHour) {
            return {
                allowed: false,
                remaining: 0,
                resetTime: Math.min(...recentRequests) + (60 * 60 * 1000)
            }
        }
        
        // Agregar request actual
        recentRequests.push(now)
        this.requestCount.set(userId, recentRequests)
        
        return {
            allowed: true,
            remaining: this.maxRequestsPerHour - recentRequests.length,
            resetTime: now + (60 * 60 * 1000)
        }
    }
    
    getConversationHistory(userId) {
        if (!this.conversationHistory.has(userId)) {
            this.conversationHistory.set(userId, [])
        }
        return this.conversationHistory.get(userId)
    }
    
    addToHistory(userId, role, content) {
        const history = this.getConversationHistory(userId)
        history.push({ role, content, timestamp: Date.now() })
        
        // Mantener solo los últimos N mensajes
        if (history.length > this.maxHistoryLength) {
            history.splice(0, history.length - this.maxHistoryLength)
        }
        
        this.conversationHistory.set(userId, history)
    }
    
    clearHistory(userId) {
        this.conversationHistory.delete(userId)
        return true
    }
    
    sanitizeInput(text) {
        // Remover caracteres peligrosos y limitar longitud
        return text
            .replace(/[<>]/g, '')
            .substring(0, 4000)
            .trim()
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                             CHATGPT INTEGRATION                             │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async chatGPT(prompt, userId, options = {}) {
        try {
            const model = this.models.gpt
            
            if (!model.key) {
                return {
                    success: false,
                    error: 'API key de OpenAI no configurada'
                }
            }
            
            // Verificar rate limiting
            const rateLimit = this.checkRateLimit(userId)
            if (!rateLimit.allowed) {
                return {
                    success: false,
                    error: `Límite de solicitudes alcanzado. Reinicia en: ${new Date(rateLimit.resetTime).toLocaleTimeString()}`,
                    rateLimited: true
                }
            }
            
            console.log(chalk.cyan(`𒁈 Consultando ChatGPT para usuario: ${userId}`))
            
            const sanitizedPrompt = this.sanitizeInput(prompt)
            
            // Preparar mensajes con historial
            const history = this.getConversationHistory(userId)
            const messages = [
                {
                    role: 'system',
                    content: `Eres un asistente útil integrado en Avenix-Multi, un bot de WhatsApp creado por Hepein Oficial. Responde de manera amigable, concisa y útil. Si te preguntan sobre el bot, menciona que fue creado por Hepein Oficial.`
                },
                ...history.slice(-6).map(h => ({ role: h.role, content: h.content })),
                {
                    role: 'user',
                    content: sanitizedPrompt
                }
            ]
            
            const requestBody = {
                model: options.model || model.model,
                messages: messages,
                max_tokens: options.maxTokens || model.maxTokens,
                temperature: options.temperature || 0.7,
                top_p: options.topP || 1,
                frequency_penalty: options.frequencyPenalty || 0,
                presence_penalty: options.presencePenalty || 0
            }
            
            const response = await fetchWithRetry(model.endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${model.key}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody),
                timeout: 30000
            })
            
            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`API Error: ${response.status} - ${errorText}`)
            }
            
            const data = await response.json()
            
            if (!data.choices || data.choices.length === 0) {
                throw new Error('Respuesta vacía de la API')
            }
            
            const aiResponse = data.choices[0].message.content.trim()
            
            // Agregar al historial
            this.addToHistory(userId, 'user', sanitizedPrompt)
            this.addToHistory(userId, 'assistant', aiResponse)
            
            console.log(chalk.green(`𒁈 ChatGPT respondió exitosamente`))
            
            return {
                success: true,
                response: aiResponse,
                model: requestBody.model,
                tokensUsed: data.usage?.total_tokens || 0,
                remaining: rateLimit.remaining - 1
            }
            
        } catch (error) {
            console.error(chalk.red('𒁈 Error en ChatGPT:'), error)
            return {
                success: false,
                error: error.message
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                             CLAUDE INTEGRATION                              │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async claude(prompt, userId, options = {}) {
        try {
            const model = this.models.claude
            
            if (!model.key) {
                return {
                    success: false,
                    error: 'API key de Anthropic no configurada'
                }
            }
            
            const rateLimit = this.checkRateLimit(userId)
            if (!rateLimit.allowed) {
                return {
                    success: false,
                    error: `Límite de solicitudes alcanzado. Reinicia en: ${new Date(rateLimit.resetTime).toLocaleTimeString()}`,
                    rateLimited: true
                }
            }
            
            console.log(chalk.cyan(`𒁈 Consultando Claude para usuario: ${userId}`))
            
            const sanitizedPrompt = this.sanitizeInput(prompt)
            
            const history = this.getConversationHistory(userId)
            const messages = [
                ...history.slice(-6).map(h => ({ role: h.role, content: h.content })),
                {
                    role: 'user',
                    content: sanitizedPrompt
                }
            ]
            
            const requestBody = {
                model: options.model || model.model,
                max_tokens: options.maxTokens || model.maxTokens,
                temperature: options.temperature || 0.7,
                messages: messages,
                system: "Eres un asistente útil integrado en Avenix-Multi, un bot de WhatsApp creado por Hepein Oficial. Responde de manera amigable, concisa y útil."
            }
            
            const response = await fetchWithRetry(model.endpoint, {
                method: 'POST',
                headers: {
                    'x-api-key': model.key,
                    'Content-Type': 'application/json',
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify(requestBody),
                timeout: 30000
            })
            
            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`API Error: ${response.status} - ${errorText}`)
            }
            
            const data = await response.json()
            
            if (!data.content || data.content.length === 0) {
                throw new Error('Respuesta vacía de Claude')
            }
            
            const aiResponse = data.content[0].text.trim()
            
            this.addToHistory(userId, 'user', sanitizedPrompt)
            this.addToHistory(userId, 'assistant', aiResponse)
            
            console.log(chalk.green(`𒁈 Claude respondió exitosamente`))
            
            return {
                success: true,
                response: aiResponse,
                model: requestBody.model,
                tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens || 0,
                remaining: rateLimit.remaining - 1
            }
            
        } catch (error) {
            console.error(chalk.red('𒁈 Error en Claude:'), error)
            return {
                success: false,
                error: error.message
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                             GEMINI INTEGRATION                              │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async gemini(prompt, userId, options = {}) {
        try {
            const model = this.models.gemini
            
            if (!model.key) {
                return {
                    success: false,
                    error: 'API key de Gemini no configurada'
                }
            }
            
            const rateLimit = this.checkRateLimit(userId)
            if (!rateLimit.allowed) {
                return {
                    success: false,
                    error: `Límite de solicitudes alcanzado. Reinicia en: ${new Date(rateLimit.resetTime).toLocaleTimeString()}`,
                    rateLimited: true
                }
            }
            
            console.log(chalk.cyan(`𒁈 Consultando Gemini para usuario: ${userId}`))
            
            const sanitizedPrompt = this.sanitizeInput(prompt)
            
            const requestBody = {
                contents: [{
                    parts: [{
                        text: `Eres un asistente útil integrado en Avenix-Multi, un bot de WhatsApp creado por Hepein Oficial. Responde de manera amigable, concisa y útil.\n\nUsuario: ${sanitizedPrompt}`
                    }]
                }],
                generationConfig: {
                    temperature: options.temperature || 0.7,
                    maxOutputTokens: options.maxTokens || model.maxTokens,
                    topP: options.topP || 1,
                    topK: options.topK || 40
                }
            }
            
            const url = `${model.endpoint}?key=${model.key}`
            
            const response = await fetchWithRetry(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody),
                timeout: 30000
            })
            
            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`API Error: ${response.status} - ${errorText}`)
            }
            
            const data = await response.json()
            
            if (!data.candidates || data.candidates.length === 0) {
                throw new Error('Respuesta vacía de Gemini')
            }
            
            const candidate = data.candidates[0]
            if (!candidate.content || !candidate.content.parts) {
                throw new Error('Formato de respuesta inválido')
            }
            
            const aiResponse = candidate.content.parts[0].text.trim()
            
            this.addToHistory(userId, 'user', sanitizedPrompt)
            this.addToHistory(userId, 'assistant', aiResponse)
            
            console.log(chalk.green(`𒁈 Gemini respondió exitosamente`))
            
            return {
                success: true,
                response: aiResponse,
                model: 'gemini-pro',
                remaining: rateLimit.remaining - 1
            }
            
        } catch (error) {
            console.error(chalk.red('𒁈 Error en Gemini:'), error)
            return {
                success: false,
                error: error.message
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                             IA AUTOMÁTICA                                   │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async chat(prompt, userId, options = {}) {
        try {
            // Intentar con el modelo preferido o el primer disponible
            const preferredModel = options.model || 'gpt'
            
            let result
            
            switch (preferredModel) {
                case 'gpt':
                case 'chatgpt':
                    result = await this.chatGPT(prompt, userId, options)
                    if (!result.success && !result.rateLimited) {
                        result = await this.gemini(prompt, userId, options)
                    }
                    break
                    
                case 'claude':
                    result = await this.claude(prompt, userId, options)
                    if (!result.success && !result.rateLimited) {
                        result = await this.chatGPT(prompt, userId, options)
                    }
                    break
                    
                case 'gemini':
                    result = await this.gemini(prompt, userId, options)
                    if (!result.success && !result.rateLimited) {
                        result = await this.chatGPT(prompt, userId, options)
                    }
                    break
                    
                default:
                    // Probar en orden de disponibilidad
                    result = await this.chatGPT(prompt, userId, options)
                    if (!result.success && !result.rateLimited) {
                        result = await this.gemini(prompt, userId, options)
                    }
                    if (!result.success && !result.rateLimited) {
                        result = await this.claude(prompt, userId, options)
                    }
            }
            
            return result
            
        } catch (error) {
            console.error(chalk.red('𒁈 Error en chat automático:'), error)
            return {
                success: false,
                error: error.message
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                             FUNCIONES ESPECIALES                            │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async generateImage(prompt, userId, options = {}) {
        try {
            const model = this.models.gpt
            
            if (!model.key) {
                return {
                    success: false,
                    error: 'API key de OpenAI no configurada'
                }
            }
            
            const rateLimit = this.checkRateLimit(userId)
            if (!rateLimit.allowed) {
                return {
                    success: false,
                    error: 'Límite de solicitudes alcanzado',
                    rateLimited: true
                }
            }
            
            console.log(chalk.cyan(`𒁈 Generando imagen con DALL-E`))
            
            const requestBody = {
                prompt: this.sanitizeInput(prompt),
                n: options.count || 1,
                size: options.size || "1024x1024",
                model: "dall-e-3"
            }
            
            const response = await fetchWithRetry('https://api.openai.com/v1/images/generations', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${model.key}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody),
                timeout: 60000
            })
            
            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`API Error: ${response.status} - ${errorText}`)
            }
            
            const data = await response.json()
            
            if (!data.data || data.data.length === 0) {
                throw new Error('No se generaron imágenes')
            }
            
            const images = data.data.map(img => ({
                url: img.url,
                revised_prompt: img.revised_prompt
            }))
            
            console.log(chalk.green(`𒁈 ${images.length} imagen(es) generada(s)`))
            
            return {
                success: true,
                images: images,
                prompt: prompt,
                remaining: rateLimit.remaining - 1
            }
            
        } catch (error) {
            console.error(chalk.red('𒁈 Error generando imagen:'), error)
            return {
                success: false,
                error: error.message
            }
        }
    }
    
    async translateText(text, targetLang = 'es', sourceLang = 'auto') {
        try {
            // Usar API gratuita de traducción
            const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`
            
            const response = await fetchWithRetry(url, {
                timeout: 10000
            })
            
            const data = await response.json()
            
            if (data.responseStatus !== 200) {
                throw new Error('Error en servicio de traducción')
            }
            
            return {
                success: true,
                original: text,
                translated: data.responseData.translatedText,
                sourceLang: sourceLang,
                targetLang: targetLang,
                confidence: data.responseData.match || 1
            }
            
        } catch (error) {
            console.error(chalk.red('𒁈 Error en traducción:'), error)
            return {
                success: false,
                error: error.message
            }
        }
    }
    
    async summarizeText(text, userId, maxLength = 150) {
        try {
            const prompt = `Resume el siguiente texto en máximo ${maxLength} caracteres, manteniendo las ideas principales:\n\n${text}`
            
            const result = await this.chat(prompt, userId, {
                maxTokens: Math.ceil(maxLength * 1.5),
                temperature: 0.3
            })
            
            return result
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                           GESTIÓN DE CONVERSACIONES                         │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    getStats(userId) {
        const history = this.getConversationHistory(userId)
        const rateLimit = this.checkRateLimit(userId)
        
        return {
            conversationLength: history.length,
            totalRequests: this.requestCount.get(userId)?.length || 0,
            remaining: rateLimit.remaining,
            resetTime: new Date(rateLimit.resetTime).toLocaleTimeString()
        }
    }
    
    async moderateContent(text) {
        try {
            // Palabras y frases potencialmente problemáticas
            const inappropriateContent = [
                // Agregar palabras según sea necesario
                'contenido_inapropiado_ejemplo'
            ]
            
            const textLower = text.toLowerCase()
            const hasInappropriate = inappropriateContent.some(word => 
                textLower.includes(word)
            )
            
            return {
                safe: !hasInappropriate,
                flagged: hasInappropriate,
                categories: hasInappropriate ? ['inappropriate'] : []
            }
            
        } catch (error) {
            return {
                safe: true,
                flagged: false,
                categories: [],
                error: error.message
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                           FUNCIONES DE ADMINISTRACIÓN                       │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    clearAllHistory() {
        this.conversationHistory.clear()
        return true
    }
    
    clearRateLimit(userId) {
        this.requestCount.delete(userId)
        return true
    }
    
    getActiveUsers() {
        return {
            conversationUsers: this.conversationHistory.size,
            rateLimitedUsers: this.requestCount.size
        }
    }
    
    cleanup() {
        const now = Date.now()
        const dayAgo = now - (24 * 60 * 60 * 1000)
        
        // Limpiar conversaciones muy antiguas
        for (const [userId, history] of this.conversationHistory.entries()) {
            const recentMessages = history.filter(msg => msg.timestamp > dayAgo)
            if (recentMessages.length === 0) {
                this.conversationHistory.delete(userId)
            } else {
                this.conversationHistory.set(userId, recentMessages)
            }
        }
        
        // Limpiar rate limits antiguos
        for (const [userId, requests] of this.requestCount.entries()) {
            const recentRequests = requests.filter(time => time > dayAgo)
            if (recentRequests.length === 0) {
                this.requestCount.delete(userId)
            } else {
                this.requestCount.set(userId, recentRequests)
            }
        }
        
        console.log(chalk.cyan('𒁈 AI: Cache limpiado'))
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                              INSTANCIA GLOBAL                               │
// ═══════════════════════════════════════════════════════════════════════════════

const ai = new AvenixAI()

// Limpieza automática cada 6 horas
setInterval(() => {
    ai.cleanup()
}, 6 * 60 * 60 * 1000)

export default ai
