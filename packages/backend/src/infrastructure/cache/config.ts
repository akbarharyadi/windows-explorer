/**
 * Cache configuration for TTL and key patterns
 * Centralizes all cache-related constants
 */
export const CacheConfig = {
  /**
   * Time-to-Live (TTL) settings in seconds
   */
  TTL: {
    FOLDER_TREE: parseInt(process.env.CACHE_TTL_FOLDER_TREE || '300'), // 5 minutes
    FOLDER_CHILDREN: parseInt(process.env.CACHE_TTL_FOLDER_CHILDREN || '120'), // 2 minutes
    FOLDER_BY_ID: parseInt(process.env.CACHE_TTL_FOLDER_BY_ID || '180'), // 3 minutes
    SEARCH_RESULTS: parseInt(process.env.CACHE_TTL_SEARCH || '60'), // 1 minute
    FILE_LIST: parseInt(process.env.CACHE_TTL_FILE_LIST || '120'), // 2 minutes
  },

  /**
   * Cache key patterns and builders
   */
  KEYS: {
    FOLDER_TREE: 'folder:tree',
    FOLDER_BY_ID: (id: string) => `folder:${id}`,
    FOLDER_CHILDREN: (id: string) => `folder:${id}:children`,
    SEARCH_RESULTS: (query: string) => `search:${query.toLowerCase()}`,
    FILE_LIST: (folderId: string) => `folder:${folderId}:files`,
    FILE_BY_ID: (id: string) => `file:${id}`,
  },
}
