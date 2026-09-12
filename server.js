const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.all('*', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).send('Indica el parámetro url (?url=http://...)');
  }

  try {
    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': req.query.referer || targetUrl,
      },
      responseType: 'stream',
      timeout: 10000,
    });

    res.status(response.status);
    response.data.pipe(res);
  } catch (error) {
    res.status(500).send('Error enviando petición: ' + error.message);
  }
});

app.listen(PORT, () => {
  console.log(`Servidor proxy activo en el puerto ${PORT}`);
});
