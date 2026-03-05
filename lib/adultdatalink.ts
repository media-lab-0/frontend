import axios from 'axios';

const ADULTDATALINK_API_KEY = process.env.ADULTDATALINK_API_KEY;
const BASE_URL = 'https://api.adultdatalink.com';

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${ADULTDATALINK_API_KEY}`,
  },
});

export const adultDataLink = {
  // PornPics Endpoints
  pornpics: {
    getTags: async () => {
      const response = await client.get('/pornpics/tags');
      return response.data;
    },
    getTagImageLinks: async (tag: string) => {
      const response = await client.get('/pornpics/tag-image-links', {
        params: { tag },
      });
      return response.data;
    },
    getGalleries: async (params: { category?: string; filter_type?: string; time?: string; offset?: number; limit?: number }) => {
      const response = await client.get('/pornpics/filter', { params });
      return response.data;
    },
    getGalleryImages: async (galleryUrl: string) => {
      // The API expects 'gallery' as the parameter for the full PornPics URL
      const response = await client.get('/pornpics/gallery-image-links', {
        params: { gallery: galleryUrl },
      });
      return response.data;
    },
    search: async (query: string, offset = 0, limit = 20) => {
      const response = await client.get('/pornpics/search', {
        params: { query, offset, limit },
      });
      return response.data;
    },
    getPornstars: async (params: { 
      orientation?: string; 
      gender?: string; 
      body?: string; 
      hair?: string; 
      tits?: string; 
      ethnicity?: string; 
      nationality?: string; 
      age?: string; 
      sort?: string; 
      page?: number 
    }) => {
      const response = await client.get('/pornpics/pornstars', { params });
      return response.data;
    },
    getPornstarList: async (params: { letter?: string; orientation?: string }) => {
      const response = await client.get('/pornpics/pornstar-list', { params });
      return response.data;
    },
    getChannels: async (offset = 0, limit = 40) => {
      const response = await client.get('/pornpics/search', {
        params: { query: 'channels', offset, limit },
      });
      return response.data;
    },
  },
  
  // Pornstar Specific Data (External)
  pornstar: {
    getPornstarData: async (name: string) => {
      const response = await client.get('/pornstar/pornstar-data', {
        params: { name },
      });
      return response.data;
    },
  },

  // General Functions
  functions: {
    streamVideo: async (url: string) => {
      const response = await client.get('/functions/stream-video', {
        params: { url },
      });
      return response.data;
    },
  },

  // Eporner Endpoints
  eporner: {
    search: async (params: { query?: string; per_page?: number; page?: number; order?: string; gay?: number; lq?: number; hd?: number }) => {
      const response = await client.get('/eporner/search', { params });
      return response.data;
    },
    getVideo: async (id: string) => {
      const response = await client.get('/eporner/video', { params: { id } });
      return response.data;
    },
    getModelInfo: async (name: string) => {
      const response = await client.get('/eporner/model-information', { params: { name } });
      return response.data;
    },
  },

  // XHamster Endpoints
  xhamster: {
    search: async (params: { query?: string; page?: number }) => {
      const response = await client.get('/xhamster/search', { params });
      return response.data;
    },
    getVideos: async (params: { page?: number; category?: string }) => {
      const response = await client.get('/xhamster/videos', { params });
      return response.data;
    },
    getVideoInfo: async (url: string) => {
      const response = await client.get('/xhamster/video-information', { params: { url } });
      return response.data;
    },
  },

  // RedTube Endpoints
  redtube: {
    search: async (params: { query?: string; page?: number; category?: string; order?: string }) => {
      const response = await client.get('/redtube/search', { params });
      return response.data;
    },
    getVideo: async (id: string) => {
      const response = await client.get('/redtube/video', { params: { id } });
      return response.data;
    },
  },

  // LetsJerkTV Endpoints
  letsjerktv: {
    getFeed: async (params: { page?: number } = {}) => {
      const response = await client.get('/letsjerktv/feed', { params });
      return response.data;
    },
    getCategories: async (params: { page?: number } = {}) => {
      const response = await client.get('/letsjerktv/categories', { params });
      return response.data;
    },
    getCategoryVideos: async (params: { category: string; page?: number }) => {
      const response = await client.get('/letsjerktv/category-videos', { params });
      return response.data;
    },
    getVideoInfo: async (videoUrl: string) => {
      const response = await client.get('/letsjerktv/video-information', { params: { video_url: videoUrl } });
      return response.data;
    },
    getPornstars: async (params: { page?: number } = {}) => {
      const response = await client.get('/letsjerktv/pornstars', { params });
      return response.data;
    },
    getPornstarVideos: async (params: { pornstar: string; page?: number }) => {
      const response = await client.get('/letsjerktv/pornstar-videos', { params });
      return response.data;
    },
    search: async (params: { query: string; page?: number }) => {
      const response = await client.get('/letsjerktv/search', { params });
      return response.data;
    },
  },

  // Other sites can be added here as needed
};
