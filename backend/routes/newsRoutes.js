import express from 'express';
import newsService from '../services/newsService.js';

const router = express.Router();

// GET /api/news - جلب الأخبار
router.get("/", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 12;
    const news = await newsService.getNews(limit);
    
    res.json({
      success: true,
      count: news.length,
      news: news
    });
  } catch (error) {
    console.error("Error fetching news:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch news",
      news: newsService.getFallbackNews()
    });
  }
});

// POST /api/news/refresh - تحديث يدوي
router.post("/refresh", async (req, res) => {
  try {
    newsService.clearCache();
    const news = await newsService.getNews();
    
    res.json({
      success: true,
      message: "News refreshed successfully",
      count: news.length,
      news: news
    });
  } catch (error) {
    console.error("Error refreshing news:", error);
    res.status(500).json({
      success: false,
      error: "Failed to refresh news"
    });
  }
});

// GET /api/news/:id - جلب خبر واحد (للتوافق)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const news = await newsService.getNews();
    const article = news.find(item => item.id === parseInt(id));
    
    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Article not found'
      });
    }
    
    res.json({
      success: true,
      data: article
    });
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch article',
      message: error.message
    });
  }
});

export default router;
