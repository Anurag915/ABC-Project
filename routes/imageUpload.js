const upload = require('./middlewares/upload');

app.post('/api/employees/:id/upload-photo', upload.single('image'), async (req, res) => {
  const imageUrl = `/uploads/employees/${req.file.filename}`;
  await User.findByIdAndUpdate(req.params.id, { photo: imageUrl });
  res.json({ message: 'Photo uploaded', imageUrl });
});
