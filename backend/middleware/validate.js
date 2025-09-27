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
      // Format Zod errors into a user-friendly message string
      const msg = out.error.issues
        .map(i => {
          const p = i.path && i.path.length > 0 ? `${i.path.join('.')}: ` : '';
          return `${p}${i.message}`;
        })
        .join('; ');
      return res.status(400).json({ msg });
    }
    // Important: Overwrite the request data with the parsed (and possibly transformed) data
    req[where] = out.data;
    return next();
  };
}

module.exports = { validate };