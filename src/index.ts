import express from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { getAccessToken } from './line/token';
const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const openApiSpec = YAML.load(path.join(__dirname, '../static/line-messaging-api.yml'));

const swaggerOptions = {
  swaggerOptions: {
    displayRequestDuration: true,
    tryItOutEnabled: true,
    requestSnippetsEnabled: true,
    defaultModelRendering: 'model',
    defaultModelsExpandDepth: 1,
    defaultModelExpandDepth: 1,
  },
  explorer: true
};

// CORSの設定を追加
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, swaggerOptions));

// プロキシエンドポイントの実装
app.use('/line-proxy/*', async (req, res) => {
  try {
    const accessToken = await getAccessToken();
    const LINE_API_BASE = 'https://api.line.me';

    const targetPath = req.originalUrl.replace('/line-proxy', '');

    const response = await fetch(`${LINE_API_BASE}${targetPath}`, {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body)
    });

    const data = await response.json();

    res.status(response.status).json(data);
  } catch (error: any) {
    console.error('Proxy error:', error);
    res.status(error.status || 500).json({
      error: error.message
    });
  }
});

// Webhook エンドポイント
app.post('/webhook', (req, res) => {
  console.log('Webhook received:');
  console.log('Headers:', req.headers);
  console.log('Body:', JSON.stringify(req.body, null, 2));
  
  // LINE Webhookの仕様に従って200を返す
  res.status(200).end();
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

