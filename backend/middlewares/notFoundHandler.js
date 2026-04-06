function notFoundHandler(_req, res) {
  res.status(404).json({
    error: "Endpoint tidak ditemukan.",
  });
}

module.exports = {
  notFoundHandler,
};
