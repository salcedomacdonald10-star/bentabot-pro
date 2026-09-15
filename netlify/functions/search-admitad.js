const https = require('https');

// Netlify Function: Search Admitad Products
exports.handler = async (event) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
          return {
                  statusCode: 405,
                  body: JSON.stringify({ error: 'Method not allowed' })
          };
    }

    try {
          const { query, limit = 10 } = JSON.parse(event.body);

      if (!query) {
              return {
                        statusCode: 400,
                        body: JSON.stringify({ error: 'Query parameter required' })
              };
      }

      // Get API credentials from environment variables
      const API_KEY = process.env.ADMITAD_API_KEY;
          const API_SECRET = process.env.ADMITAD_API_SECRET;

      if (!API_KEY || !API_SECRET) {
              return {
                        statusCode: 500,
                        body: JSON.stringify({ error: 'API credentials not configured' })
              };
      }

      // Call Admitad API
      const searchUrl = `https://api.admitad.com/v2/search/?token=${API_KEY}&query=${encodeURIComponent(query)}&limit=${limit}`;

      const products = await fetchAdmitadProducts(searchUrl);

      return {
              statusCode: 200,
              headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({
                        success: true,
                        count: products.length,
                        products: products.map(p => ({
                                    id: p.id,
                                    name: p.name,
                                    price: p.price,
                                    currency: p.currency,
                                    image: p.image,
                                    rating: p.rating,
                                    reviews: p.reviews_count,
                                    url: p.url,
                                    commission: p.commission,
                                    advertiser: p.advertiser
                        }))
              })
      };
    } catch (error) {
          console.error('Error:', error.message);
          return {
                  statusCode: 500,
                  body: JSON.stringify({
                            error: 'Failed to fetch products',
                            message: error.message
                  })
          };
    }
};

// Helper function to fetch from Admitad API
function fetchAdmitadProducts(url) {
    return new Promise((resolve, reject) => {
          https.get(url, (res) => {
                  let data = '';

                          res.on('data', (chunk) => {
                                    data += chunk;
                          });

                          res.on('end', () => {
                                    try {
                                                const json = JSON.parse(data);

                                      // Handle Admitad API response
                                      if (json.results && Array.isArray(json.results)) {
                                                    resolve(json.results);
                                      } else if (Array.isArray(json)) {
                                                    resolve(json);
                                      } else {
                                                    reject(new Error('Invalid API response format'));
                                      }
                                    } catch (e) {
                                                reject(new Error(`Failed to parse response: ${e.message}`));
                                    }
                          });
          }).on('error', reject);
    });
}
