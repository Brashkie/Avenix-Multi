// plugin: weather.js (clima)
import { weather } from '../lib/weather.js';
import type { PluginHandler } from '../types/index.js'

const handler: PluginHandler = async (m, { conn, text, command, usedPrefix }) => {
    if (!text) {
        return m.reply(`
❌ *Uso incorrecto*

*Ejemplos:*
- ${usedPrefix}clima Lima
- ${usedPrefix}clima New York, USA
- ${usedPrefix}clima Tokyo, Japan

- ${usedPrefix}pronostico Madrid 7
- ${usedPrefix}calidad Ciudad de México
        `.trim());
    }
    
    try {
        // Comando: clima actual
        if (command === 'clima' || command === 'weather') {
            await m.reply('⏳ Obteniendo clima...');
            
            const data = await weather.getCurrentWeather(text);
            const formatted = weather.formatCurrentWeather(data);
            
            return conn.reply(m.chat, formatted, m);
        }
        
        // Comando: pronóstico
        if (command === 'pronostico' || command === 'forecast') {
            const [location, ...daysArr] = text.split(' ');
            const days = parseInt(daysArr[0]) || 7;
            
            await m.reply(`⏳ Obteniendo pronóstico ${days} días...`);
            
            const data = await weather.getForecast(location, days);
            const formatted = weather.formatForecast(data, days);
            
            return conn.reply(m.chat, formatted, m);
        }
        
        // Comando: calidad del aire
        if (command === 'calidad' || command === 'aqi') {
            await m.reply('⏳ Obteniendo calidad del aire...');
            
            const data = await weather.getAirQuality(text);
            const formatted = weather.formatAirQuality(data);
            
            return conn.reply(m.chat, formatted, m);
        }
        
        // Comando: completo
        if (command === 'climacompleto' || command === 'weatherfull') {
            await m.reply('⏳ Obteniendo información completa...');
            
            const data = await weather.getCompleteWeather(text, 5);
            const formatted = weather.formatCompleteWeather(data, 5);
            
            return conn.reply(m.chat, formatted, m);
        }
        
    } catch (error) {
        console.error('Error en comando weather:', error);
        
        return m.reply(`
❌ *Error al obtener clima*

${error.message}

*Posibles causas:*
- Ubicación no encontrada
- API no disponible
- Sin créditos API

💡 *Intenta:*
- Verificar la ortografía
- Agregar país: "Lima, Peru"
- Usar coordenadas: "40.7128,-74.0060"
        `.trim());
    }
};

handler.help = [
    'clima <ubicación>',
    'pronostico <ubicación> [días]',
    'calidad <ubicación>',
    'climacompleto <ubicación>'
];
handler.tags = ['tools'];
handler.command = /^(clima|weather|pronostico|forecast|calidad|aqi|climacompleto|weatherfull)$/i;

export default handler;
