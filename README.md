# PRESOS — computadores de enigmas

Terminal Angular reutilizável com dois modos, enigmas encadeados e histórico de conversa.

## Executar

```sh
npm install
npm start
```

Abra `http://localhost:4200`. Cada nome é também uma rota: `/inno_m1nvl`, `/sultao_d`, `/tec_la`, `/nkai_a`, `/grd_s0nhadr`, `/chma_vva`, `/h_colinas`, `/caosra_st`, `/sr_grdabs` e `/fnt_primdal`.

## Comandos

Digite o comando e pressione Enter. Maiúsculas/minúsculas e espaços nas pontas são ignorados somente no reconhecimento dos comandos.

| Comando                   | Resultado                                                                                                      |
| ------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `limpa`                   | Apaga a conversa e o histórico recuperável com ↑/↓; preserva o modo e o contador da sessão.                    |
| `contexto`                | Mostra a charada, o início e a quantidade de PCs; seleciona este terminal como destino da próxima transmissão. |
| `entd`                    | Nome do computador conectado à entrada.                                                                        |
| `sda`                     | Nome do computador conectado à saída.                                                                          |
| `cncta_ent nome_do_pc`    | Conecta a saída do PC informado à entrada deste terminal.                                                      |
| `cncta_sda nome_do_pc`    | Conecta a saída deste terminal à entrada do PC informado.                                                      |
| `cncta_ent` / `cncta_sda` | Sem argumento (mesmo com espaços no final), são mensagens comuns. Com `nenhum`, desconectam aquele lado.       |
| `acordado`                | Ativa respostas narrativas aleatórias sobre a identidade do PC, sem repetir imediatamente a mesma fala.        |
| `dormindo`                | Ativa a cifra e o encaminhamento automático pela saída.                                                        |
| `/segredos`               | Lista os comandos.                                                                                             |

O terminal começa **acordado**. Cada mensagem enviada recebe uma resposta; não há respostas por tecla. Comandos de controle funcionam nos dois modos e não passam pela cifra. A lista de comandos é revelada apenas por `/segredos`. `ajuda` e `/ajuda` são mensagens comuns. `/limpar` continua aceito. Textos comuns preservam espaços, capitalização e pontuação antes de entrar na cifra.

As mensagens passam automaticamente de PC em PC. Cada máquina em `dormindo` aplica sua cifra ao resultado anterior. O emissor mostra o percurso completo; os receptores registram a entrada, a saída e a máquina de origem em seus históricos. Palavras recebidas nunca são interpretadas como comandos, mesmo que a cifra produza `limpa`, `acordado` etc.

O último `contexto` consultado seleciona o destino da transmissão. Ela para após aplicar a cifra desse PC, mesmo que ele tenha outra saída conectada. Se o início ou a quantidade de PCs não corresponder ao contexto, o emissor recebe apenas `TRANSMISSÃO INTERROMPIDA: percurso inválido.`. A palavra-resposta permanece oculta; ainda não há validação automática de vitória.

Um receptor acordado devolve uma fala e interrompe a transmissão. Coloque todos os PCs do percurso em `dormindo` antes de enviar. Uma saída desconectada também encerra o envio; se havia um destino pendente, o emissor avisa que não foi alcançado. Ciclos são interrompidos antes de processar a mesma máquina pela segunda vez. Sem contexto selecionado, a mensagem segue as saídas até uma dessas condições.

Cada PC tem uma entrada e uma saída. Alterar uma conexão atualiza os dois lados e desfaz as ligações substituídas. Nomes desconhecidos, argumentos excedentes e conexões do PC consigo mesmo são rejeitados sem alterar a rede.

Históricos, conexões, modos e destino são mantidos ao trocar de PC e recarregar **na mesma aba** por meio de `sessionStorage`. Abas e dispositivos diferentes não sincronizam a rede. Quando o navegador bloqueia o armazenamento, o jogo funciona em memória. `limpa` apaga apenas a conversa e a recuperação pelas setas do PC atual, preservando modo, conexões e contador.

## Configuração do mestre

`src/app/computers.ts` concentra as conexões, cifras, charadas e falas. As cifras e charadas são provisórias. As falas são originais, inspiradas nas entidades da campanha, sem mencionar seus nomes; todo o conteúdo pode ser editado pelo mestre. A resposta está no código para referência do mestre, mas não é exibida na interface. Como é um front-end, o código pode ser inspecionado pelo navegador.

A única sequência conectada inicialmente é `chma_vva → tec_la → fnt_primdal`. A entrada de `chma_vva` e a saída de `fnt_primdal` ficam livres; os outros sete PCs começam sem conexões. As demais ligações são feitas pelos jogadores. Sessões salvas pela versão anterior recebem essa configuração uma única vez, preservando históricos, modos e destino. Conexões criadas após a migração continuam salvas normalmente.

`PUZZLE_ORDER` define apenas os percursos de referência dos enigmas, sem conectar os computadores:

```text
inno_m1nvl → grd_s0nhadr → caosra_st → sultao_d → tec_la
→ nkai_a → chma_vva → h_colinas → sr_grdabs → fnt_primdal → inno_m1nvl
```

`createComputer(id, serial, charada, resposta, falas, quantidadeDePCs, cifra)` gera uma configuração independente. Os dois últimos argumentos são opcionais: por padrão, o percurso contém três PCs e a cifra desloca A–Z/a–z em três posições. `sultao_d` usa inversão do texto. Acentos, números e pontuação são preservados pela cifra de deslocamento.

A quantidade inclui **o primeiro computador e o destino**, entre 1 e 10. A função calcula o início do enigma pela ordem de referência dos percursos. Os comandos de conexão alteram a rede da sessão, mas não alteram o desafio definido pelo mestre. Para mudar as ligações iniciais, edite `inputFrom` e `outputTo` em `createComputer`; `PUZZLE_ORDER` afeta apenas os enigmas. Para mudar a quantidade, a cifra ou a narrativa de um PC, edite sua chamada `createComputer`. A ordem do array `COMPUTERS` determina o terminal inicial do site.

Exemplo do mestre para `caosra_st`: a resposta é `loucura`, passando por `inno_m1nvl → grd_s0nhadr → caosra_st`. Com as cifras provisórias:

```text
cfltlir → [inno_m1nvl] fiowolu → [grd_s0nhadr] ilrzrox → [caosra_st] loucura
```

Para experimentar o exemplo automaticamente, use a mesma aba:

1. Abra `/caosra_st`, execute `contexto` e `dormindo`.
2. Abra `/grd_s0nhadr`, execute `cncta_sda caosra_st` e `dormindo`.
3. Abra `/inno_m1nvl`, execute `cncta_sda grd_s0nhadr`, `dormindo` e envie `cfltlir`.
4. A saída exibirá as três etapas até `loucura`. Ao voltar a `/caosra_st`, a mensagem recebida estará no histórico.

`TerminalNetwork` em `src/app/terminal-network.ts` centraliza estado, comandos e transmissão. A interface reutilizável recebe `ComputerConfig`. As cifras devem ser síncronas e aceitar qualquer texto de até 2.000 caracteres; `awakePhrases` exige pelo menos uma fala.

## Verificar

```sh
npm run build
npm test -- --watch=false
```

## Uso no celular

- Layout adaptado a telas estreitas e ao modo paisagem, respeitando as áreas seguras da tela.
- Campo de envio separado da rolagem do histórico, com tamanho ajustado à área visível quando o teclado abre.
- Campos com fonte de 16 px, correção automática desativada e indicação de Enviar no teclado virtual.
- Botões e seletor com pelo menos 44 px de altura. Os botões ↑/↓ recuperam mensagens sem depender de teclado físico.
- Seletor no topo para trocar de PC na mesma aba e preservar a sessão.
- Sem foco automático ao abrir o terminal em dispositivos de toque; Limpar também não abre o teclado automaticamente.
- Zoom do navegador permanece habilitado. Textos longos quebram linha no histórico.

A validação de responsividade usa tamanhos simulados no navegador; o comportamento do teclado virtual do aparelho deve ser conferido também em Android/iOS.

## Acessar pelo Wi-Fi

No computador que hospeda o projeto, execute:

```sh
npm run start:lan
```

O comando detecta os IPv4 atuais do computador, autoriza esses endereços no SSR via `NG_ALLOWED_HOSTS` e mostra os links no console. O servidor aceita conexões da rede na porta 4200. No computador, use `http://localhost:4200`. Nos celulares conectados ao mesmo roteador, use `http://IP_DO_COMPUTADOR:4200` (por exemplo, `http://192.168.15.17:4200`). O computador pode estar conectado por cabo e os celulares por Wi-Fi, desde que o roteador permita a comunicação entre eles.

`localhost` no celular aponta para o próprio celular. Use o IPv4 do computador, consultável com `ipconfig` no Windows; ele pode mudar quando você trocar de rede. Mantenha o computador ligado e o servidor rodando durante a sessão.

Se o Windows solicitar acesso de rede para o Node.js, permita na rede privada usada para o jogo. Se o celular não abrir, verifique a permissão da porta TCP 4200 no firewall e se o Wi-Fi não é uma rede de convidados com isolamento entre dispositivos. Não é necessário encaminhar portas no roteador para uso na mesma rede.

Este comando compartilha o acesso ao site. O estado do jogo continua independente em cada aba/aparelho; sincronizar jogadores exige uma camada de servidor compartilhada.

## Respostas sem dicas

A interface mostra confirmações curtas de estado e mensagens de falha sem sugestões de correção. Em uma transmissão interrompida, o emissor exibe apenas o motivo da falha, sem acrescentar o percurso parcial. O histórico de cada receptor mantém os dados recebidos.

`contexto` fornece somente a charada, o início, a quantidade de PCs e o destino. `/segredos` lista somente os nomes dos comandos, sem explicações, sintaxe ou exemplos. As instruções deste README são destinadas ao mestre e não aparecem na interface dos jogadores.
