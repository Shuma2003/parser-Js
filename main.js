const axios = require('axios');
const cheerio = require('cheerio');

async function parseTassNews() {
    try {
        console.log('Начинаем парсинг TASS...');
        
        const response = await axios.get('https://tass.ru/ekonomika', {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const $ = cheerio.load(response.data);
        const news = [];
        
        // Парсим заголовки новостей с TASS
        // Попробуем разные возможные селекторы
        $('.news-line__item, .card-news, .news-list__item, a.news-line__link').each((index, element) => {
            if (index < 15) {
                const title = $(element).text().trim();
                let link = $(element).attr('href');
                
                // Если ссылка относительная, делаем ее абсолютной
                if (link && !link.startsWith('http')) {
                    link = 'https://tass.ru' + link;
                }
                
                if (title && title.length > 10) { // Фильтруем слишком короткие тексты
                    news.push({
                        title: title,
                        link: link || 'Ссылка не найдена'
                    });
                }
            }
        });
        
        console.log(`Найдено новостей: ${news.length}`);
        
        if (news.length > 0) {
            console.log('\nПоследние новости с TASS:');
            news.forEach((item, index) => {
                console.log(`${index + 1}. ${item.title}`);
                console.log(`   Ссылка: ${item.link}\n`);
            });
            
            // Сохраняем в файл для удобства
            const fs = require('fs');
            fs.writeFileSync('tass_news.json', JSON.stringify(news, null, 2));
            console.log('\nРезультаты сохранены в tass_news.json');
        } else {
            console.log('Новости не найдены. Попробуем альтернативные селекторы...');
            await tryAlternativeSelectors($);
        }
        
    } catch (error) {
        console.error('Ошибка при парсинге:', error.message);
    }
}

// Функция для поиска альтернативных селекторов
async function tryAlternativeSelectors($) {
    console.log('\n=== ПОИСК АЛЬТЕРНАТИВНЫХ СЕЛЕКТОРОВ ===');
    
    const selectors = [
        'h1', 'h2', 'h3', 'h4', 
        '.title', '.headline', '.news-title',
        'a[href*="/ekonomika/"]',
        '.news-item', '.article-preview'
    ];
    
    selectors.forEach(selector => {
        const elements = $(selector);
        if (elements.length > 0) {
            console.log(`\nСелектор "${selector}": найдено ${elements.length} элементов`);
            elements.each((index, el) => {
                if (index < 3) {
                    console.log(`  - ${$(el).text().trim().substring(0, 100)}...`);
                }
            });
        }
    });
}

// Запускаем функцию
parseTassNews();