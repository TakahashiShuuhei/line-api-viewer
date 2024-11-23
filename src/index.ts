import express from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { getAccessToken } from './line/token';
import axios from 'axios';

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const openApiSpec = YAML.load(path.join(__dirname, '../static/line-messaging-api.yml'));
// const openApiSpec = YAML.load(path.join(__dirname, '../static/hoge.yml'));
const swaggerOptions = {
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    tryItOutEnabled: true,
    requestSnippetsEnabled: true,
    url: '/',
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

// テスト用APIエンドポイントを追加
app.get('/test-api/:a/:b', (req, res) => {
  console.log('Test API called');
  const a = parseInt(req.params.a);
  const b = parseInt(req.params.b);
  res.json({
    message: 'Test API works!',
    input: {
      a: a,
      b: b
    },
    sum: a + b,
    timestamp: new Date().toISOString()
  });
});

// プロキシエンドポイントの実装
app.use('/line-proxy/*', async (req, res) => {
  console.log('Line proxy called');
  console.log(req);
  try {
    // アクセストークンを取得
    const accessToken = await getAccessToken();
    
    // LINE APIのベースURL
    const LINE_API_BASE = 'https://api.line.me/v2';
    
    // プロキシパスを取得（/line-proxy/を除去）
    const targetPath = req.url.replace('/line-proxy', '');
    
    // LINEのAPIにリクエストを転送
    const response = await axios({
      method: req.method,
      url: `${LINE_API_BASE}${targetPath}`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        ...req.headers,
        host: 'api.line.me'
      },
      data: req.body
    });

    // レスポンスを返す
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error('Proxy error:', error);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

