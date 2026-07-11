## ui-tests

- Este pacote é um módulo do `app-community` para a visão ADMIN do playground de resultados de testes.
- Não reintroduzir app standalone, TypeScript, Vite ou HTML manual.
- A API compartilhada deve vir de `@controleonline/ui-common/src/api`.
- Os formatadores compartilhados devem vir de `@controleonline/ui-common/src/utils/formatter`.
- O store do módulo deve usar o runtime compartilhado de `@store`; manter apenas o store de domínio `src/store/tests.js`, agregado no store raiz do `app-community`.
- A configuração local do dashboard fica em `src/smokeConfig.js`.
- O índice público chega com `types[]` e `suites[]`; a interface deve separar browser smoke, phpunit e outros tipos.
- O dashboard continua read-only; a execução dos testes fica no backend.
- Sempre manter a UI dividida em blocos pequenos e reutilizáveis.
- `ui-tests` é um módulo plugável. Não adicionar `app.json`, tela local de login ou bootstrap próprio de sessão aqui; a autenticação e a montagem da entrada ficam no shell/`ui-login` do host.
