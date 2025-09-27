// backend/middleware/validate.js
'use strict';

/**
 * Zod validation middleware.
 * Usage: router.post('/path', validate(schema), handler)
 * Optionally validate req.query or req.params: validate(schema, 'query')
 */
function validate(schema, where = 'body') {
  return (req, res, next) => {
    const data = req[where];
    const out = schema.safeParse(data);
    if (!out.success) {
      const msg = out.error.issues
        .map(i => {
          const p = i.path && i.path.length ? `${i.path.join('.')}: ` : '';
          return `${p}${i.message}`;
        })
        .join('; ');
      return res.status(400).json({ msg });
    }
    // replace with parsed/coerced data
    req[where] = out.data;
    return next();
  };
}

module.exports = { validate };
