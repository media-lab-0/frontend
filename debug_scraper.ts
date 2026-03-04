import axios from 'axios';
import * as cheerio from 'cheerio';

async function debugScraper() {
    try {
        console.log('Fetching https://www.pornpics.com/channels/list/ ...');
        const { data: html } = await axios.get('https://www.pornpics.com/channels/list/', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
        });
        
        console.log('HTML Length:', html.length);
        const $ = cheerio.load(html);
        
        // The list is likely inside a container with site links
        const listItems = $('a[href*="/channels/"]');
        console.log('Found tags with href containing /channels/:', listItems.length);
        
        listItems.each((i, el) => {
            if (i < 10) {
                console.log(`Item ${i}: ${$(el).text()} -> ${$(el).attr('href')}`);
            }
        });

    } catch (e: any) {
        console.error('Scraper fail:', e.message);
    }
}

debugScraper();
