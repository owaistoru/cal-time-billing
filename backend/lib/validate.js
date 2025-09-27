// backend/middleware/validate.js
const validate = (schema) => async (req, res, next) => {
  try {
    const parsed = await schema.parseAsync(req.body);
    req.body = parsed; // eslint-disable-line no-param-reassign
    next();
  } catch (err) {
    res.status(400).json({ msg: err?.errors?.[0]?.message || 'Invalid input' });
  }
};
module.exports = { validate };
