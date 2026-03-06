/**
 * Request timeout middleware
 * Prevents requests from hanging indefinitely
 */

export const requestTimeout = (timeoutMs = 30000) => {
  return (req, res, next) => {
    // Set timeout for the request
    req.setTimeout(timeoutMs, () => {
      console.error(`⏱️ Request timeout: ${req.method} ${req.url}`);
      
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          message: 'Request timeout. Please try again.',
        });
      }
    });

    // Set timeout for the response
    res.setTimeout(timeoutMs, () => {
      console.error(`⏱️ Response timeout: ${req.method} ${req.url}`);
      
      if (!res.headersSent) {
        res.status(504).json({
          success: false,
          message: 'Gateway timeout. Please try again.',
        });
      }
    });

    next();
  };
};
