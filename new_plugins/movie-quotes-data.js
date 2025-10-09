/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                   PLANTILLA DE CITAS DE PELÍCULAS                           ┃
 * ┃                                                                               ┃
 * ┃  IMPORTANTE: Esta es una plantilla VACÍA                                    ┃
 * ┃  Debes agregar tus propias citas respetando derechos de autor               ┃
 * ┃                                                                               ┃
 * ┃  OPCIONES PARA OBTENER CITAS LEGALMENTE:                                    ┃
 * ┃  1. APIs oficiales (TMDb, OMDb) con tu API key                              ┃
 * ┃  2. Bases de datos públicas (con licencia)                                  ┃
 * ┃  3. Contribuciones de usuarios de tu comunidad                              ┃
 * ┃  4. Citas de dominio público (películas antiguas)                           ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import { addCustomQuote } from '../movie-quotes.js';

// ═══════════════════════════════════════════════════════════════════════════════
// │                          ESTRUCTURA DE UNA CITA                             │
// ═══════════════════════════════════════════════════════════════════════════════

const QUOTE_TEMPLATE = {
    // Requeridos
    quote: "Texto de la cita exacta de la película",
    movie: "Título de la Película",
    year: 2020,
    genre: ["Drama", "Acción"], // Puede tener múltiples géneros
    difficulty: "medium", // easy | medium | hard | expert
    
    // Opcionales pero recomendados
    director: "Director de la película",
    actors: ["Actor Principal", "Actriz Principal"],
    alternativeTitles: ["Título Alternativo", "Título en Inglés"],
    rating: 8.5, // Rating de 0 a 10
    trivia: "Dato curioso sobre la película o esta escena específica",
    language: "es", // Idioma de la cita
    
    // Metadatos adicionales
    oscars: 0, // Número de oscars ganados
    budget: "100 millones USD",
    boxOffice: "500 millones USD"
};

// ═══════════════════════════════════════════════════════════════════════════════
// │                          EJEMPLOS DE USO                                    │
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * EJEMPLO 1: Agregar una cita manualmente
 */
function ejemploAgregarCita() {
    try {
        const quoteId = addCustomQuote({
            quote: "[Tu cita aquí - Recuerda respetar derechos de autor]",
            movie: "[Título de la película]",
            year: 2020,
            director: "[Director]",
            genre: ["Acción"],
            actors: ["Actor 1", "Actor 2"],
            difficulty: "medium",
            rating: 8.0,
            trivia: "[Dato curioso]"
        });
        
        console.log(`✅ Cita agregada con ID: ${quoteId}`);
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

/**
 * EJEMPLO 2: Cargar citas desde un archivo JSON
 */
async function cargarCitasDesdeJSON(filePath) {
    try {
        const fs = await import('fs/promises');
        const data = await fs.readFile(filePath, 'utf-8');
        const quotes = JSON.parse(data);
        
        let added = 0;
        for (const quote of quotes) {
            try {
                addCustomQuote(quote);
                added++;
            } catch (error) {
                console.error(`Error agregando cita de "${quote.movie}":`, error.message);
            }
        }
        
        console.log(`✅ ${added} citas agregadas exitosamente`);
    } catch (error) {
        console.error('❌ Error cargando archivo:', error.message);
    }
}

/**
 * EJEMPLO 3: Obtener citas desde TMDb API
 */
async function obtenerCitasDesdeTMDb(apiKey) {
    try {
        const axios = (await import('axios')).default;
        
        // Ejemplo: Obtener películas populares
        const response = await axios.get(
            'https://api.themoviedb.org/3/movie/popular',
            {
                params: {
                    api_key: apiKey,
                    language: 'es-ES'
                }
            }
        );
        
        console.log('✅ Películas obtenidas:', response.data.results.length);
        
        // Aquí deberías tener otra API que te dé las citas
        // TMDb no proporciona citas directamente
        
        return response.data.results;
    } catch (error) {
        console.error('❌ Error obteniendo de TMDb:', error.message);
        return [];
    }
}

/**
 * EJEMPLO 4: Permitir que usuarios agreguen citas
 */
function crearCitaDeUsuario(userData) {
    // Validar datos del usuario
    const requiredFields = ['quote', 'movie', 'year', 'genre'];
    
    for (const field of requiredFields) {
        if (!userData[field]) {
            throw new Error(`Campo requerido: ${field}`);
        }
    }
    
    // Agregar metadatos
    const quote = {
        ...userData,
        submittedBy: userData.userId,
        submittedAt: new Date().toISOString(),
        verified: false, // Requiere verificación del admin
        difficulty: userData.difficulty || 'medium'
    };
    
    return addCustomQuote(quote);
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                          CITAS PRE-CARGADAS                                 │
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * AQUÍ PUEDES AGREGAR TUS CITAS
 * 
 * Recuerda:
 * - Verifica que tienes derecho a usar las citas
 * - Cita la fuente original
 * - Respeta las leyes de copyright de tu país
 * - Considera usar APIs oficiales con licencia
 */

export const CITAS_PRECARGADAS = [
    // Agrega tus citas aquí siguiendo el formato:
    /*
    {
        quote: "Tu cita aquí",
        movie: "Nombre de la película",
        year: 2020,
        director: "Director",
        genre: ["Género"],
        actors: ["Actor 1", "Actor 2"],
        difficulty: "medium",
        rating: 8.5,
        trivia: "Dato curioso"
    },
    */
];

// ═══════════════════════════════════════════════════════════════════════════════
// │                          FUNCIÓN DE INICIALIZACIÓN                          │
// ═══════════════════════════════════════════════════════════════════════════════

export async function inicializarCitas() {
    console.log('🎬 Inicializando base de datos de citas...');
    
    let total = 0;
    
    // Cargar citas pre-cargadas
    for (const cita of CITAS_PRECARGADAS) {
        try {
            addCustomQuote(cita);
            total++;
        } catch (error) {
            console.error(`Error agregando "${cita.movie}":`, error.message);
        }
    }
    
    // Intentar cargar desde archivo externo si existe
    try {
        await cargarCitasDesdeJSON('./data/movie-quotes.json');
    } catch (error) {
        console.log('📝 Archivo movie-quotes.json no encontrado, usando solo pre-cargadas');
    }
    
    console.log(`✅ ${total} citas cargadas exitosamente`);
    
    return total;
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                          RECURSOS RECOMENDADOS                              │
// ═══════════════════════════════════════════════════════════════════════════════

export const RECURSOS = {
    apis: {
        tmdb: {
            url: 'https://www.themoviedb.org/documentation/api',
            descripcion: 'The Movie Database - API gratuita con info de películas',
            requiereAPIKey: true,
            gratuito: true
        },
        omdb: {
            url: 'http://www.omdbapi.com/',
            descripcion: 'Open Movie Database - Info de películas',
            requiereAPIKey: true,
            limiteFree: '1000 requests/día'
        },
        quotable: {
            url: 'https://github.com/lukePeavey/quotable',
            descripcion: 'API de citas (no específicas de películas)',
            requiereAPIKey: false,
            gratuito: true
        }
    },
    
    basesPublicas: {
        imdb: {
            url: 'https://www.imdb.com/interfaces/',
            descripcion: 'IMDb Datasets - Datos públicos de películas',
            formato: 'TSV',
            licencia: 'Uso no comercial'
        },
        wikipedia: {
            url: 'https://en.wikipedia.org/wiki/AFI%27s_100_Years...100_Movie_Quotes',
            descripcion: 'Lista de citas famosas (solo referencia)',
            nota: 'Usar solo como inspiración, no copiar directamente'
        }
    },
    
    recomendaciones: [
        '✅ Usa APIs oficiales con tu propia API key',
        '✅ Permite que tu comunidad contribuya con citas',
        '✅ Verifica siempre la fuente original',
        '✅ Respeta las leyes de copyright',
        '✅ Considera películas de dominio público',
        '❌ NO copies grandes bases de datos sin permiso',
        '❌ NO uses citas sin citar la fuente',
        '❌ NO distribuyas contenido con copyright'
    ]
};

// ═══════════════════════════════════════════════════════════════════════════════
// │                          EXPORTACIONES                                      │
// ═══════════════════════════════════════════════════════════════════════════════

export default {
    QUOTE_TEMPLATE,
    CITAS_PRECARGADAS,
    RECURSOS,
    inicializarCitas,
    ejemploAgregarCita,
    cargarCitasDesdeJSON,
    obtenerCitasDesdeTMDb,
    crearCitaDeUsuario
};
