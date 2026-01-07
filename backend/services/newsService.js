import axios from 'axios';
import { ENV } from '../config/env.js';
import Parser from 'rss-parser';

const GNEWS_API_KEY = ENV.GNEWS_API_KEY;
const rssParser = new Parser();

class NewsService {
  constructor() {
    this.cache = {
      data: [],
      lastFetch: null,
      ttl: 30 * 60 * 1000 // 30 دقيقة
    };
    
    // RSS feeds للمصادر الفلسطينية
    this.rssSources = [
      { name: 'وكالة وفا', url: 'https://www.wafa.ps/Pages/RSS/Arabic.xml' },
      { name: 'وكالة معاً', url: 'https://www.maannews.net/rss' },
      { name: 'صفا', url: 'https://safa.ps/rss' }
    ];
  }

  // جلب أخبار من RSS feeds
  async fetchFromRSS() {
    const allRSSNews = [];
    
    for (const source of this.rssSources) {
      try {
        console.log(`📡 Fetching RSS from ${source.name}...`);
        const feed = await rssParser.parseURL(source.url);
        
        // تحويل RSS items إلى صيغة موحدة
        const articles = feed.items.slice(0, 15).map(item => ({
          title: item.title,
          description: item.contentSnippet || item.content || item.description,
          content: item.content || item.contentSnippet || item.description,
          publishedAt: item.pubDate || item.isoDate,
          source: { name: source.name },
          url: item.link
        }));
        
        allRSSNews.push(...articles);
        console.log(`✅ Got ${articles.length} articles from ${source.name}`);
      } catch (err) {
        console.warn(`Failed to fetch RSS from ${source.name}:`, err.message);
      }
    }
    
    return allRSSNews;
  }

  // جلب أخبار فلسطينية من GNews API
  async fetchPalestinianNews() {
    try {
      // كلمات بحث متنوعة (عربية وإنجليزية) للحصول على نتائج أفضل
      const keywords = [
        'فلسطين القضاء',
        'المحكمة الفلسطينية',
        'وزارة العدل الفلسطينية',
        'القانون الفلسطيني',
        'القضاء الفلسطيني',
        'محكمة فلسطين',
        'فلسطين',
        'القدس',
        'غزة'
      ];

      const allNews = [];

      // جلب أخبار من كل كلمة مفتاحية
      for (const keyword of keywords) {
        try {
          const response = await axios.get('https://gnews.io/api/v4/search', {
            params: {
              q: keyword,
              lang: 'ar',
              max: 5,
              apikey: GNEWS_API_KEY,
              sortby: 'publishedAt'
            },
            timeout: 10000
          });

          if (response.data && response.data.articles) {
            allNews.push(...response.data.articles);
          }
        } catch (err) {
          console.warn(`Failed to fetch news for keyword: ${keyword}`, err.message);
        }
      }

      return allNews;

    } catch (error) {
      console.error('Error fetching Palestinian news:', error.message);
      return [];
    }
  }

  // إزالة الأخبار المكررة
  removeDuplicates(articles) {
    const seen = new Set();
    return articles.filter(article => {
      const key = article.title + article.source.name;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // تنسيق الأخبار لتتناسب مع frontend
  formatNews(articles) {
    return articles.map((article, index) => ({
      id: index + 1,
      title: article.title,
      description: article.description || article.content?.substring(0, 150) + '...',
      fullContent: article.content || article.description,
      date: new Date(article.publishedAt),
      source: article.source.name,
      category: this.categorizeNews(article.title + ' ' + (article.description || '')),
      url: article.url
    }));
  }

  // تصنيف الأخبار
  categorizeNews(text) {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('حكم') || lowerText.includes('قرار') || lowerText.includes('محكمة')) {
      return 'أحكام قضائية';
    } else if (lowerText.includes('تعيين') || lowerText.includes('قاضي') || lowerText.includes('وزير')) {
      return 'تعيينات';
    } else if (lowerText.includes('إلكترون') || lowerText.includes('رقم') || lowerText.includes('تطور')) {
      return 'تطوير';
    } else if (lowerText.includes('ورشة') || lowerText.includes('تدريب') || lowerText.includes('دورة')) {
      return 'ورش عمل';
    } else if (lowerText.includes('تجار') || lowerText.includes('اقتصاد')) {
      return 'قضايا تجارية';
    } else if (lowerText.includes('دولي') || lowerText.includes('اتفاق')) {
      return 'تعاون دولي';
    }
    
    return 'أخبار عامة';
  }

  // جلب الأخبار مع cache (دمج GNews + RSS)
  async getNews(limit = 12) {
    const now = Date.now();
    
    // استخدام cache إذا كان ما زال صالحاً
    if (this.cache.data.length > 0 && 
        this.cache.lastFetch && 
        (now - this.cache.lastFetch) < this.cache.ttl) {
      console.log('📰 Returning cached news');
      return this.cache.data.slice(0, limit);
    }

    console.log('🔄 Fetching fresh news from multiple sources...');
    
    // جلب الأخبار من GNews و RSS بالتوازي
    const [gNewsArticles, rssArticles] = await Promise.all([
      this.fetchPalestinianNews(),
      this.fetchFromRSS()
    ]);
    
    console.log(`✅ GNews: ${gNewsArticles.length} articles`);
    console.log(`✅ RSS: ${rssArticles.length} articles`);
    
    // دمج الأخبار من المصدرين
    const allArticles = [...gNewsArticles, ...rssArticles];
    
    // إزالة التكرارات
    const uniqueNews = this.removeDuplicates(allArticles);
    
    // تنسيق البيانات
    const formattedNews = this.formatNews(uniqueNews);
    
    // تحديث cache
    this.cache.data = formattedNews;
    this.cache.lastFetch = now;

    console.log(`📊 Total unique news: ${formattedNews.length}`);
    return formattedNews.slice(0, limit);
  }

  // مسح cache يدوياً
  clearCache() {
    this.cache.data = [];
    this.cache.lastFetch = null;
    console.log('🗑️ News cache cleared');
  }
}

export default new NewsService();
