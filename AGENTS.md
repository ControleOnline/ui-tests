## ui-tests

- Este pacote compartilha a UI de resultados de testes entre o app standalone e o `app-community`.
- Não reintroduzir TypeScript, Vite ou HTML manual.
- A fonte de configuração local é `config/env.local.js`, com `config/env.local.sample` como template.
- O app consome `GET /tests/index.json` e artefatos autenticados com `X-API-KEY`.
- O índice público chega com `types[]` e `suites[]`; a interface deve separar browser smoke, phpunit e outros tipos.
- O dashboard continua read-only; a execução dos smoke tests fica no backend.
- Sempre manter a UI dividida em blocos pequenos e reutilizáveis.
- Qualquer alteração visível no browser deve continuar funcionando em `expo export --platform web`.
