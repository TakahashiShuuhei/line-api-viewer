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
    requestInterceptor: (req: any) => {
      console.log('Request interceptor called:', req);
      return req;
    }
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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

