# Arquitetura

O Angular apresenta o terminal. O Spring Boot executa o jogo e mantém o estado no PostgreSQL.

## Fluxo de uma ação

1. O componente envia o texto original ao serviço TerminalNetwork.
2. TerminalApi faz a requisição HTTP para /api/games/current/commands.
3. O proxy encaminha a requisição ao Spring.
4. O backend bloqueia a sessão durante a transação, valida a revisão, executa o comando e persiste o resultado.
5. O Angular apresenta o estado devolvido pelo backend.

As cifras, as respostas e o desbloqueio de conexões não são executados pelo navegador. Não existe fallback para execução local quando o servidor está indisponível.

## Organização do Angular

```text
src/app/features/terminals/
├── components/
│   ├── terminal/          Interação, histórico, estados de conexão e teclado
│   └── terminal-output/   Apresentação dos espaços das saídas cifradas
├── data/public-computers.ts Metadados públicos usados nas URLs e no prerender
├── functions/output-display.ts Apresentação de texto, sem regras do jogo
├── models/                Contratos públicos e formato do estado recebido
├── routing/               URLs por computador
├── services/
│   ├── terminal-api.service.ts     Transporte HTTP
│   ├── terminal-network.service.ts Estado reativo e coordenação dos envios
│   └── game-events.service.ts     Conexão SSE e reconexão automática
└── testing/               Auxiliares de testes da interface, sem regras do jogo

src/server/backend-proxy.ts Proxy do servidor SSR
proxy.conf.cjs              Proxy do ng serve
```

O catálogo de /api/computers atualiza os metadados exibidos. A lista pública local mantém as dez URLs disponíveis para prerender sem depender de uma API ativa durante o build. Ao adicionar um novo computador, adicione também seus metadados públicos em public-computers.ts para criar sua URL.

O motor TypeScript anterior foi removido. A pasta testing contém apenas auxiliares que fornecem estados prontos aos testes da interface; as regras do jogo são testadas no backend Java.

## Organização do Spring

Os módulos enigma e terminal são separados por funcionalidade, com controller, DTOs, serviços e modelos próprios. Apenas terminal precisa de entidades e repositórios JPA neste momento. O catálogo fica versionado no arquivo puzzles/computers.json do backend; o estado de jogo fica na tabela game_sessions.

O motor TerminalGame é independente de HTTP e persistência. GameSessionService controla a transação, concorrência, identidade da sessão e armazenamento. CipherService transforma os textos preservando as regras de Unicode das cifras anteriores.

## Sessão e erros

Todos os navegadores entram na mesma partida. POST /api/games retorna a linha compartilhada criada pela migração V2, preservando as sessões antigas. A interface recebe avisos SSE depois do commit e consulta o estado ao receber um aviso, reconectar ou recuperar foco; tokens privados antigos do sessionStorage são ignorados. Respostas de consultas anteriores a um envio são descartadas para evitar regressão visual do estado.

A mudança da identidade do processo Spring reinicia o jogo. A reconexão SSE recarrega o estado e detecta a nova identidade do servidor. Reiniciar apenas o Angular não reinicia o jogo. Falhas de rede preservam o estado exibido até uma resposta confirmada.

Os envios são sequenciais. Cada comando inclui a revisão atual e um requestId. Conflitos retornam 409. Após um envio sem confirmação, o Angular recarrega o estado e pede que o jogador confira o histórico; não repete automaticamente a ação. A interface mantém o rascunho em caso de falha e oferece reconexão.

## Rede local e produção

O navegador usa sempre /api na origem do Angular. O host encaminha para BACKEND_URL, com padrão http://127.0.0.1:8080. Isso evita que localhost seja interpretado como o celular do jogador.

ng serve usa proxy.conf.cjs; o servidor SSR usa backend-proxy.ts. Hospedagem apenas de arquivos estáticos precisa de um proxy equivalente no servidor web. Respostas de sessão não são armazenadas em cache.

## Testes

- remote-network.spec.ts verifica transporte, restauração, indisponibilidade e ausência de repetição automática.
- Os testes de componentes verificam a apresentação e a interação.
- testing contém estados simulados para os testes da interface, sem executar cifras ou enigmas.
- backend-proxy.test.mjs verifica encaminhamento de caminhos, headers, corpo e erros.
- O backend compara 29 cenários de jogo e 70 exemplos de cifras com resultados da implementação original, além de testar a API e o banco H2.
- A inicialização local com PostgreSQL 18.6, a migração Flyway e a resposta de /api/session foram verificadas.

```sh
npm test -- --watch=false
npm run test:server
npm run build
```

## Texto e estilos

TerminalOutput desenha um ponto visual para cada espaço cifrado. O texto original permanece intacto para cópia, leitura assistiva e transmissão. outputParts diferencia a cifra de avisos, falas e rótulos.

Os componentes usam BEM: terminal, terminal__elemento e terminal--modificador. O bloco terminal-output possui seus próprios estilos. Estados de erro e envio são apresentados na interface, sem revelar detalhes internos do servidor.

## Atualizações e concorrência

GET /api/games/events mantém uma conexão SSE para a partida compartilhada. GameEvents publica avisos depois do commit, envia heartbeat a cada dez segundos e remove conexões encerradas. Cada abertura/reconexão provoca a leitura completa do estado, sem depender de replay de eventos. O proxy deve transmitir o fluxo sem buffering; seu timeout de inatividade é maior que o intervalo do heartbeat.

O Angular agrupa avisos recebidos durante uma consulta ou envio e busca o estado novamente ao terminar. As notificações não executam comandos. Um conflito HTTP 409 mantém o rascunho e informa que o comando não foi aplicado; uma falha de rede informa que o resultado é incerto, sem reenvio automático.

O bloqueio da linha serializa as alterações, e a revisão global impede executar comandos sobre um estado antigo. Isso também pode rejeitar comandos simultâneos em terminais diferentes, pois as conexões propagam efeitos entre eles. O SSE atual atende uma instância do backend; múltiplas instâncias exigiriam distribuição dos eventos entre processos.

## Reset do mestre

O script scripts/reset-game.ps1, no projeto Java, pede a confirmação REINICIAR e chama POST /api/master/reset diretamente em 127.0.0.1. O endpoint exige uma origem loopback e a chave master.reset-token do arquivo local .env.properties, ignorado pelo Git. A chave também é obrigatória porque o proxy Angular acessa o Java a partir do próprio computador.

O reset bloqueia a linha da partida, restaura o estado inicial, zera a revisão, apaga o identificador do último comando e cria uma nova identidade de ciclo. O epoch da linha continua identificando o processo Spring; serverSessionId no estado identifica o ciclo da partida. Essa distinção permite resetar sem reiniciar Java e rejeitar comandos atrasados, mesmo quando a revisão coincide. O aviso SSE sai após o commit. As definições dos enigmas e os registros antigos não são apagados.

## Modo transe

As seis falas de cada terminal ficam em trancePhrases no catálogo Java. O estado opcional trance registra nextIndex e nextAt na sessão persistida. TranceScheduler verifica a partida compartilhada a cada 250 ms; cada fala fica elegível após 2 segundos. A transação bloqueia a mesma linha usada pelos comandos e pelo reset, avança no máximo uma fala por terminal, incrementa a revisão e publica o aviso SSE após o commit.

O comando transe inicia apenas o terminal atual. Ao terminar, ele permanece em transe aguardando uma mensagem comum para reiniciar. Mensagens durante a sequência são descartadas sem alteração do estado, inclusive se a revisão estiver atrasada, mas comandos de ciclos anteriores continuam rejeitados. Comandos de controle permanecem sujeitos à revisão atual. Acordar, dormir e resetar removem o progresso pendente. Nenhum temporizador de diálogo é criado no Angular.
