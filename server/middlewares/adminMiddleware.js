module.exports = (req, res, next) => {
  if (req.user?.role !== 'manager' && req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admins only' });
  }
  next();
};
