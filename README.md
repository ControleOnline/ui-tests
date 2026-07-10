# @controleonline/ui-tests

Frontend Expo/Metro em JavaScript para consumir o `index.json` publicado pela API de smoke tests.

Este pacote atende dois usos:

- app standalone em Expo/Metro
- tela compartilhada do `app-community` para o `app_type=ADMIN`

## O que ele faz

- lê `GET /tests/index.json`
- mostra tipos, suites, testes, etapas e estados
- autentica a sessão com `@controleonline/ui-login`
- carrega screenshots por URL autenticada
- envia `Authorization: Basic ...` quando `HTACCESS_USER` e `HTACCESS_PASSWORD` estiverem configurados
- abre os prints em `blob:` URL no navegador

O dashboard separa automaticamente os resultados por tipo, como `browser-smoke`, `phpunit` e outros conjuntos publicados pela API.

## Estrutura de configuração

O app segue o padrão do `app-community`:

- `config/env.local.sample` é o template local
- `config/env.local.js` é o arquivo real usado pelo app
- o workflow do GitHub Actions cria `config/env.local.js` antes do build

## Configuração local

Crie `config/env.local.js` com base em `config/env.local.sample`:

```js
const env = {
  API_ENTRYPOINT: 'https://api.example.test',
  HTACCESS_USER: '',
  HTACCESS_PASSWORD: '',
};

module.exports = { env };
```

## Scripts

```bash
npm install
npm run web
npm run build
npm test
```

## Publicação

O workflow `.github/workflows/web-deploy-web.yml`:

- cria `config/env.local.js`
- instala dependências com Node 20
- executa `npx expo install --fix`
- exporta a web com `npx expo export --platform web`
- publica a pasta `dist` via FTP

## Variáveis esperadas no deploy

- `API_ENTRYPOINT`
- `HTACCESS_USER` e `HTACCESS_PASSWORD` quando o backend estiver protegido por basic auth
- `FTP_HOST`
- `FTP_USER`
- `FTP_PASS`
