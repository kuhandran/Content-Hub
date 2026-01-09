/**
 * API Router Helper
 * Automatically routes requests to either static content or API gateway
 * based on file extension
 */

class APIRouter {
  constructor(configPath = '/config/apiRouting.json') {
    this.configPath = configPath;
    this.config = null;
    this.staticExtensions = ['.json', '.png', '.webp', '.pdf'];
  }

  /**
   * Load configuration from JSON file
   */
  async loadConfig() {
    try {
      const response = await fetch(this.configPath);
      this.config = await response.json();
      this.staticExtensions = this.config.staticContentExtensions || this.staticExtensions;
    } catch (error) {
      console.warn('Could not load API routing config, using defaults', error);
    }
  }

  /**
   * Check if a path is a static content request
   * @param {string} path - Request path
   * @returns {boolean}
   */
  isStaticContent(path) {
    return this.staticExtensions.some(ext => path.toLowerCase().endsWith(ext));
  }

  /**
   * Get the full URL for a request
   * @param {string} path - Request path
   * @returns {string} - Full URL
   */
  getUrl(path) {
    // Ensure path starts with /
    const normalizedPath = path.startsWith('/') ? path : '/' + path;

    if (this.isStaticContent(normalizedPath)) {
      // Static content - serve from public folder
      return normalizedPath;
    } else {
      // API call - route to gateway
      const apiGateway = this.config?.apiGateway || 'https://api-gateway-9unh.onrender.com';
      return apiGateway + normalizedPath;
    }
  }

  /**
   * Make a request with automatic routing
   * @param {string} path - Request path
   * @param {object} options - Fetch options
   * @returns {Promise}
   */
  async request(path, options = {}) {
    const url = this.getUrl(path);
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`);
      }

      // Return raw response for JSON or Blob
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      } else if (contentType?.includes('image/') || contentType?.includes('application/pdf')) {
        return response;
      }

      return response;
    } catch (error) {
      console.error(`API Router error for ${path}:`, error);
      throw error;
    }
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = APIRouter;
}
