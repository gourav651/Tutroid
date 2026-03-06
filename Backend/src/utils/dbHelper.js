/**
 * Database helper utilities for handling connection issues
 */

/**
 * Execute a database operation with automatic retry on connection errors
 * @param {Function} operation - The database operation to execute
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} timeout - Query timeout in milliseconds
 * @returns {Promise} - Result of the operation
 */
export const withRetry = async (operation, maxRetries = 3, timeout = 10000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Add timeout to the operation
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), timeout)
      );
      
      return await Promise.race([operation(), timeoutPromise]);
    } catch (error) {
      lastError = error;
      
      // Check if it's a connection-related error or timeout
      const isConnectionError = 
        error.code === 'P1001' || // Can't reach database server
        error.code === 'P2024' || // Connection pool timeout
        error.message?.includes('connection') ||
        error.message?.includes('Closed') ||
        error.message?.includes('timeout') ||
        error.message?.includes('ECONNRESET') ||
        error.message?.includes('Query timeout');
      
      if (isConnectionError && attempt < maxRetries) {
        const delay = Math.min(500 * Math.pow(2, attempt - 1), 2000); // Faster retries: 500ms, 1s, 2s
        console.log(`🔄 Database operation failed, retrying in ${delay}ms... (attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // If it's not a connection error or we've exhausted retries, throw
      throw error;
    }
  }
  
  throw lastError;
};

/**
 * Check if an error is a Prisma connection error
 * @param {Error} error - The error to check
 * @returns {boolean} - True if it's a connection error
 */
export const isConnectionError = (error) => {
  return (
    error.code === 'P1001' ||
    error.code === 'P2024' ||
    error.message?.includes('connection') ||
    error.message?.includes('Closed') ||
    error.message?.includes('timeout') ||
    error.message?.includes('ECONNRESET')
  );
};
