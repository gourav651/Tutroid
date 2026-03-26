import client from '../db.js';

/**
 * Batch query executor to reduce database round trips
 */
export class QueryBatcher {
  constructor() {
    this.queue = [];
    this.processing = false;
  }

  async add(queryFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ queryFn, resolve, reject });
      this.process();
    });
  }

  async process() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    const batch = this.queue.splice(0, 10); // Process 10 at a time
    
    try {
      const results = await Promise.all(
        batch.map(({ queryFn }) => queryFn())
      );
      
      batch.forEach(({ resolve }, index) => {
        resolve(results[index]);
      });
    } catch (error) {
      batch.forEach(({ reject }) => {
        reject(error);
      });
    }
    
    this.processing = false;
    
    if (this.queue.length > 0) {
      setImmediate(() => this.process());
    }
  }
}

export const queryBatcher = new QueryBatcher();

/**
 * Optimized pagination helper
 */
export const paginateQuery = async (model, options = {}) => {
  const {
    where = {},
    select,
    include,
    orderBy,
    page = 1,
    limit = 20,
  } = options;

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    client[model].findMany({
      where,
      ...(select && { select }),
      ...(include && { include }),
      orderBy,
      skip,
      take: limit,
    }),
    client[model].count({ where }),
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasMore: skip + limit < total,
    },
  };
};

/**
 * DataLoader-style batching for related data
 */
export class DataLoader {
  constructor(batchLoadFn, options = {}) {
    this.batchLoadFn = batchLoadFn;
    this.cache = new Map();
    this.queue = [];
    this.maxBatchSize = options.maxBatchSize || 100;
  }

  async load(key) {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    return new Promise((resolve, reject) => {
      this.queue.push({ key, resolve, reject });
      
      if (this.queue.length === 1) {
        process.nextTick(() => this.dispatch());
      }
    });
  }

  async dispatch() {
    const queue = this.queue.splice(0, this.maxBatchSize);
    if (queue.length === 0) return;

    const keys = queue.map(q => q.key);
    
    try {
      const results = await this.batchLoadFn(keys);
      
      queue.forEach(({ key, resolve }, index) => {
        const result = results[index];
        this.cache.set(key, result);
        resolve(result);
      });
    } catch (error) {
      queue.forEach(({ reject }) => reject(error));
    }
  }

  clear() {
    this.cache.clear();
  }
}
