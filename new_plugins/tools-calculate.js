// plugin: calc.js
import { calculator, UnitConverter, ExpressionEvaluator } from '../lib/calculate.js';

let handler = async (m, { conn, text, command, usedPrefix }) => {
    if (!text) {
        return m.reply(`
❌ *Uso incorrecto*

*Ejemplos:*
- ${usedPrefix}calc 2 + 3 * 4
- ${usedPrefix}calc sqrt(144)
- ${usedPrefix}calc sin(90) [grados]
- ${usedPrefix}percent 20 de 500
- ${usedPrefix}convert 5 km mi
- ${usedPrefix}currency 100 USD EUR
- ${usedPrefix}stats 10 20 30 40 50
        `.trim());
    }
    
    try {
        // Calculadora básica
        if (command === 'calc' || command === 'calculate') {
            const result = calculator.eval(text);
            
            return m.reply(`
🔢 *RESULTADO*

*Expresión:* ${text}
*Resultado:* ${result.formatted}

📝 *Historial:* ${usedPrefix}history
            `.trim());
        }
        
        // Porcentajes
        if (command === 'percent' || command === 'porcentaje') {
            const [percentage, , number] = text.split(/\s+/).map(Number);
            const result = calculator.percent(percentage, number);
            
            return m.reply(`
📊 *PORCENTAJE*

*${percentage}% de ${number}* = *${result.formatted}*

*Otros cálculos:*
- Aumentar: ${calculator.percentIncrease(number, percentage).formatted}
- Disminuir: ${calculator.percentDecrease(number, percentage).formatted}
            `.trim());
        }
        
        // Conversión de unidades
        if (command === 'convert' || command === 'convertir') {
            const parts = text.split(/\s+/);
            const value = parseFloat(parts[0]);
            const from = parts[1];
            const to = parts[2];
            
            // Intentar diferentes categorías
            const categories = ['length', 'weight', 'speed', 'volume', 'area', 'time', 'energy', 'pressure', 'data'];
            let result = null;
            let category = null;
            
            for (const cat of categories) {
                try {
                    result = calculator.convertUnit(value, from, to, cat);
                    category = cat;
                    break;
                } catch {}
            }
            
            // Si no es unidad estándar, probar temperatura
            if (!result) {
                try {
                    const temp = UnitConverter.convertTemperature(value, from.toUpperCase(), to.toUpperCase());
                    result = { formatted: temp.toFixed(2) };
                    category = 'temperature';
                } catch {}
            }
            
            if (!result) {
                return m.reply(`❌ No se pudo convertir. Verifica las unidades.`);
            }
            
            return m.reply(`
🔄 *CONVERSIÓN*

*${value} ${from}* = *${result.formatted} ${to}*

📁 Categoría: ${category}
            `.trim());
        }
        
        // Conversión de monedas
        if (command === 'currency' || command === 'moneda') {
            const parts = text.split(/\s+/);
            const amount = parseFloat(parts[0]);
            const from = parts[1].toUpperCase();
            const to = parts[2].toUpperCase();
            
            await m.reply('⏳ Obteniendo tasas de cambio...');
            
            const result = await calculator.convertCurrency(amount, from, to);
            
            return m.reply(`
💱 *CONVERSIÓN DE MONEDA*

*${amount} ${from}* = *${result.formatted} ${to}*

📅 Tasa actualizada: ${new Date().toLocaleString('es-ES')}

💡 Tasas actualizadas cada hora
            `.trim());
        }
        
        // Estadísticas
        if (command === 'stats' || command === 'estadisticas') {
            const numbers = text.split(/\s+/).map(Number).filter(n => !isNaN(n));
            
            if (numbers.length < 2) {
                return m.reply('❌ Necesitas al menos 2 números');
            }
            
            const mean = calculator.mean(numbers);
            const median = calculator.median(numbers);
            const mode = calculator.mode(numbers);
            const stdDev = calculator.stdDev(numbers);
            
            return m.reply(`
📊 *ESTADÍSTICAS*

*Datos:* ${numbers.join(', ')}
*Cantidad:* ${numbers.length}

*Resultados:*
- Media: ${mean.formatted}
- Mediana: ${median.formatted}
- Moda: ${mode.result ? mode.result.join(', ') : 'No hay'}
- Desv. Est.: ${stdDev.formatted}
- Rango: ${Math.max(...numbers) - Math.min(...numbers)}
- Suma: ${numbers.reduce((a, b) => a + b, 0)}
            `.trim());
        }
        
        // Historial
        if (command === 'history' || command === 'historial') {
            const history = calculator.getHistory(10);
            
            if (history.length === 0) {
                return m.reply('📭 No hay historial');
            }
            
            let output = '📜 *HISTORIAL DE CÁLCULOS*\n\n';
            
            history.forEach((entry, index) => {
                const time = entry.timestamp.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                output += `${index + 1}. [${time}] ${entry.operation}\n`;
                output += `   Resultado: ${entry.formatted}\n\n`;
            });
            
            output += `Use ${usedPrefix}clearhist para limpiar`;
            
            return m.reply(output.trim());
        }
        
        // Limpiar historial
        if (command === 'clearhist' || command === 'limpiarhist') {
            calculator.clearHistory();
            return m.reply('✅ Historial limpiado');
        }
        
    } catch (error) {
        Logger.error('Error en calc:', error);
        
        return m.reply(`
❌ *ERROR*

${error.message}

💡 *Verifica:*
- La sintaxis de la expresión
- Que los números sean válidos
- Las unidades de conversión

📚 Usa *${usedPrefix}calc* para ver ejemplos
        `.trim());
    }
};

handler.help = [
    'calc <expresión>',
    'percent <porcentaje> de <número>',
    'convert <valor> <de> <a>',
    'currency <cantidad> <de> <a>',
    'stats <números...>',
    'history'
];
handler.tags = ['tools'];
handler.command = /^(calc|calculate|percent|porcentaje|convert|convertir|currency|moneda|stats|estadisticas|history|historial|clearhist|limpiarhist)$/i;

export default handler;
