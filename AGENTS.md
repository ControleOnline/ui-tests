## ui-tests

- Este pacote é um módulo do `app-community` para a visão ADMIN de smoke tests.
- Não reintroduzir app standalone, TypeScript, Vite ou HTML manual.
- A API compartilhada deve vir de `@controleonline/ui-common/src/api`.
- Os formatadores compartilhados devem vir de `@controleonline/ui-common/src/utils/formatter`.
- O store do módulo deve usar o runtime compartilhado de `@store`; manter apenas o store de domínio `src/store/tests.js`, agregado no store raiz do `app-community`.
- A configuração local do dashboard fica em `src/smokeConfig.js`.
- O índice público chega com `types[]` e `suites[]`; a interface deve separar browser smoke, phpunit e outros tipos.
- O dashboard continua read-only; a execução dos smoke tests fica no backend.
- Sempre manter a UI dividida em blocos pequenos e reutilizáveis.
