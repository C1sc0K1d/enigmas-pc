# Organização do projeto

O shell e a configuração do Angular ficam em `src/app/`. O jogo fica em `src/app/features/terminals/`.

```text
src/app/
├── app.ts / app.html / app.scss / app.spec.ts
├── app.config.ts / app.config.server.ts
├── app.routes.ts / app.routes.server.ts
└── features/terminals/
    ├── ciphers/                 # Cifras e testes unitários
    ├── components/terminal/     # Interface, estilos e testes do componente
    ├── config/                 # Percursos, conexões iniciais e armazenamento
    ├── data/
    │   ├── computers.ts        # Catálogo e ordem do seletor
    │   ├── computers.spec.ts   # Consistência do catálogo
    │   └── computers/          # Uma configuração por PC
    ├── functions/              # Funções puras e seus testes
    ├── models/                 # Tipos dos computadores, sessões e rede
    ├── routing/                # Geração das URLs e testes de navegação
    └── services/               # Estado reativo, comandos e transmissão
scripts/start-lan.mjs            # Inicialização para a rede local
```

## Rotas de navegação e percursos dos enigmas

| Responsabilidade | Onde alterar |
| --- | --- |
| URLs, terminal inicial e títulos das páginas | `routing/create-terminal-routes.ts`, usado por `app.routes.ts` |
| Percursos dos enigmas e ordem de SONHO | `config/puzzle-routes.ts` |
| PCs conectados ao abrir uma sessão | `config/initial-connections.ts` |
| Versão das conexões salvas | `config/network.config.ts` |

`createTerminalRoutes(computers, options)` gera uma URL por PC, associa sua configuração ao componente reutilizável e inclui redirecionamentos. As opções `defaultComputerId` e `titleSuffix` permitem escolher o terminal inicial e o sufixo do título. Listas vazias, IDs duplicados e um PC inicial inexistente são rejeitados. `withComponentInputBinding()` em `app.config.ts` entrega a configuração da rota ao componente.

`createPuzzleRoute(order, destination, steps)` monta um percurso circular incluindo início e destino. `matchesPuzzleRoute(actual, expected)` verifica toda a sequência em ordem. A rota especial de dez PCs é `SULTAO_ROUTE`. `includeRequiredComputer(route, id)` inclui a etapa obrigatória sem duplicá-la nem alterar o destino. A fábrica aplica essa regra tanto a percursos gerados quanto a rotas explícitas. A campanha define `REQUIRED_PUZZLE_COMPUTER = "tec_la"` em `config/puzzle-routes.ts`; a opção `requiredComputerId` pode definir outro PC ou `null`. O terminal `chma_vva` usa `CHAMA_ROUTE = ["chma_vva"]` e `requiredComputerId: null` para manter seu percurso local. A quantidade exibida vem sempre da rota final, que pode crescer uma etapa além de `steps`.

`getOutputChain(origin, next)` percorre as saídas atuais, sem repetir PCs, e informa onde existe um ciclo. `TerminalNetwork.sendNetworkCommand` usa essa função para colocar todos os PCs alcançados em modo dormindo ou consultar exclusivamente o contexto do último PC. Esses comandos digitados não passam pelas cifras, não dependem do modo dos receptores e não são disparados por texto produzido pelas cifras. Em ciclos, `contexto` não escolhe um destino arbitrário; `dormindo` alcança cada PC uma vez e informa o ciclo.

`getChainConnections(id, chain)` calcula entrada e saída. Os extremos ficam abertos e PCs fora da sequência ficam desconectados. Essa função não altera os percursos dos enigmas.

## Configurar ou adicionar um PC

Edite o arquivo do PC em `data/computers/`. A fábrica usa propriedades nomeadas e recebe a função de cifra importada de `ciphers/`. Exemplo:

```typescript
import { createComputer } from '../../functions/create-computer';
import { encodeCaesar } from '../../ciphers/caesar';

export const arquivo = createComputer({
  id: 'arquivo',
  serial: 11,
  name: 'Arquivo',
  riddle: 'O que permanece quando a voz se cala?',
  answer: 'memoria',
  awakePhrases: ['Ainda guardo o que vocês esqueceram.'],
  encode: encodeCaesar,
  context: { route: ['chma_vva', 'tec_la', 'arquivo'] },
});
```

Importe a configuração e acrescente-a ao catálogo `data/computers.ts`. As URLs e o seletor usam esse catálogo automaticamente. Para gerar o percurso padrão, use `steps` e inclua o PC em `PUZZLE_ORDER`; para um percurso explícito, use `context.route`. `context.successMessage` define uma conclusão que exige a resposta correta após toda a travessia. `matchesAnswer(actual, expected)` centraliza a comparação: ignora maiúsculas/minúsculas, acentos (inclusive marcas Unicode combinantes) e espaços externos. A normalização é aplicada apenas ao validar a resposta ou consultar o percurso pela palavra-chave; cifras, espaços internos, pontuação e histórico continuam preservados.

`createComputer(definition, { puzzleOrder, initialConnectionChain, requiredComputerId })` permite usar outras sequências. Alterar conexões iniciais não reconecta sessões salvas da mesma versão. Para migrar essas sessões intencionalmente, incremente `CONNECTIONS_VERSION`.

A opção `context.revealRouteOnLocalAnswer` permite consultar o percurso digitando a resposta diretamente no PC. Está ativada apenas em `sultao_d`. A consulta usa `describeRoute`, também reutilizada por `describeContext`, e funciona somente no modo dormindo, sem encaminhar a mensagem. Acordado, a palavra recebe uma fala aleatória normal. Palavras recebidas pela rede continuam sendo tratadas como dados da cifra. A conclusão ainda exige a travessia completa e ordenada na mesma transmissão. Em qualquer PC dormindo, reconhecer a palavra-chave na saída da cifra interrompe o encaminhamento antes de consultar a próxima conexão: percurso correto libera a chave; percurso incompleto ou errado retorna `describeRoute` no receptor e no emissor. O destino selecionado e as conexões existentes não impedem esse reconhecimento; as conexões não são removidas.

## Estado e interface

`models/` define contratos sem dependência do Angular. As cifras e funções puras recebem dados e retornam resultados sem acessar DOM, signals ou armazenamento.

`createNetworkState` inicializa as sessões com `connectionsUnlocked: false`. A conexão consulta somente a chave do PC que executa o comando; o destino pode estar bloqueado. `TerminalNetwork.transmit` libera a chave ao validar resposta, percurso completo e modo dormindo, independentemente de haver uma mensagem de conclusão. `restoreNetworkState` valida dados salvos e migra conexões. O serviço `TerminalNetwork` cuida do armazenamento no navegador, estado reativo, comandos, respostas e transmissão. O componente cuida da digitação, histórico visual, troca de PC, foco e adaptação ao teclado do celular.

A chave de armazenamento e sua versão foram preservadas nesta reorganização. O estado continua independente por aba e aparelho. As chaves liberadas também ficam no `sessionStorage`, sem prazo de expiração. `src/server/session.ts` fornece `GET /api/session` com `Cache-Control: no-store` e uma identificação aleatória por processo, preservada durante recompilações do servidor de desenvolvimento. `ServerSession` consulta essa identificação ao carregar, a cada 10 segundos, ao recuperar a conexão e ao retomar a aba. O serviço `TerminalNetwork` compara a identificação com `serverSessionId` no estado salvo: uma mudança recria a rede inteira com os valores iniciais e sobrescreve o armazenamento. Falhas de rede preservam o jogo até uma confirmação válida. Estados antigos sem identificação também são zerados na primeira confirmação.

## Testes

Os arquivos `*.spec.ts` ficam junto do módulo correspondente. O padrão `src/**/*.spec.ts` em `tsconfig.spec.json` descobre todos eles.

- `ciphers/`: exemplos, pulsos, descartes e retorno circular no alfabeto.
- `functions/`: percursos, conexões, fábrica, contexto e validação de estado.
- `routing/`: URLs e navegação real com binding da configuração ao terminal.
- `components/terminal/`: digitação, histórico, modos, limpeza e apresentação segura de texto.
- `services/`: comandos, transmissão, restauração de sessões e conclusão do enigma de SONHO.
- `data/`: consistência das configurações dos PCs.
- `app.spec.ts`: criação do shell.

```sh
npm test -- --watch=false
npm run test:server
npm run build
```

Esses comandos encerram após a verificação. Para servir o projeto na rede local, execute separadamente `npm run start:lan`.

## Estilos BEM

O bloco `terminal` fica no elemento host do componente. Elementos usam `terminal__elemento` (por exemplo, `terminal__screen` e `terminal__result-content`). Modificadores usam `--`: `terminal--compact` controla o layout compacto e `terminal__button--send`, `terminal__button--clear` e `terminal__button--history` distinguem os botões. Todo modificador acompanha a classe base correspondente.

Os estilos do componente usam classes explícitas, sem depender de seletores como `div > span` ou `toolbar button`. As regras responsivas usam os mesmos nomes BEM. O bloco global `visually-hidden` mantém rótulos acessíveis ocultos visualmente; os seletores globais de HTML e os resets continuam em `src/styles.scss`.
