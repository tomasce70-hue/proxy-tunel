const express = require('express');
const axios = require('axios');
const dns = require('dns').promises; // Módulo para resolver IP numérica
const app = express();
const PORT = process.env.PORT || 3000;

// 1. NUEVA RUTA: Recibe una URL, resuelve su IP numérica y devuelve la URL limpia
app.get('/api/get-stream-ip', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).json({ success: false, message: 'Indica el parámetro url (?url=http://...)' });
  }

  try {
    const parsedUrl = new URL(targetUrl);
    const domain = parsedUrl.hostname; // Extrae automáticamente "abdjrpes.top" o el dominio que sea

    // Render resuelve la IP numérica real desde la nube
    const addresses = await dns.resolve4(domain);
    const ip = addresses[0];

    // Reemplaza el dominio por la IP en la URL
    parsedUrl.hostname = ip;

    return res.json({
      success: true,
      ip: ip,
      cleanUrl: parsedUrl.toString() // Devuelve ej: http://185.x.x.x:8080/usuario/pass/canal.ts
    });
  } catch (error) {
    console.error('Error resolviendo DNS:', error);
    return res.status(500).json({
      success: false,
      message: 'Error resolviendo la IP: ' + error.message,
      fallbackUrl: targetUrl // Devuelve la original por si acaso falla la DNS
    });
  }
});

// 2. RUTA PROXY WILDCARD (Mantiene intacto lo que ya tenías funcionando)
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
