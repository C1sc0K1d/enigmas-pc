# PRESOS — RPG puzzle terminals

PRESOS is a browser-based puzzle system for a tabletop RPG. Players explore ten old computers, work out how each one changes their messages, and connect them in the right order to solve a riddle. The interface is a green terminal with a conversation history, built to work on phones as well as desktops.

This README is for the game master and anyone working on the project. It includes puzzle solutions. Commands, answers, and dialogue are kept in Portuguese, just as they appear in the game.

## Get it running

Start the Java backend and PostgreSQL first (see [backend setup](../enigmas-backend/README.md)). Then install the Angular dependencies and start the app:

```sh
npm install
npm start
```

Open `http://localhost:4200`. Use the selector at the top to move between computers in the same tab. Each computer also has its own URL, such as `/tec_la` or `/sultao_d`.

The ten computers are:

```text
inno_m1nvl    sultao_d      tec_la       nkai_a       grd_s0nhadr
chma_vva     h_colinas     caosra_st    sr_grdabs    fnt_primdal
```

### Playing over Wi-Fi

On the computer hosting the game, run:

```sh
npm run start:lan
```

The script prints the local addresses players can open on their phones. Everyone needs to be on the same local network. The host can use Ethernet while players use Wi-Fi.

Use `http://localhost:4200` on the host, and an address such as `http://192.168.15.17:4200` on the phones. On a phone, `localhost` means the phone itself. Keep the host computer running throughout the session.

If a phone cannot connect, check that Windows allows Node.js on your private network and that TCP port 4200 is accessible. Guest Wi-Fi may prevent devices from reaching each other. You do not need router port forwarding for local play.

### Starting a fresh game

**Restarting the Spring backend resets the game.** Restarting Angular alone does not. Histories, unlocked keys, counters, drafts, and the selected destination are cleared. Every computer wakes up, and the initial connections return.

Open tabs receive live updates from the server through SSE. After a change or reconnection, they fetch the latest game state. Losing the connection does not erase progress. To reset during play without restarting Java, see [Resetting the game](#resetting-the-game).

All browsers join the same shared campaign. Actions, history, modes and connections are synchronized through SSE notifications sent after database commit. Reloading rejoins the same game, without relying on browser storage. Old private sessions remain in the database but are no longer joined by the UI. Each computer retains its latest 500 history entries and commands. If a player submits from an outdated state, the UI refreshes and asks them to check the history before resending.

## How the terminals work

Every computer starts **awake**. In this mode, it replies with fragments of dialogue about its identity. When it is **asleep**, it applies its cipher and sends the result through its output connection. In **trance**, it delivers a fixed sequence of six lines, then waits for another message.

Initially, only these three computers are connected:

```text
chma_vva → tec_la → fnt_primdal
```

The other seven are disconnected. The input of `chma_vva` and the output of `fnt_primdal` are empty.

A computer has one input and one output. Changing a connection updates both ends and removes any connection it replaces. Clearing an input or output leaves that side empty; players can reconnect it later.

### Commands

Type a command and submit it. Command names are case-insensitive, and spaces at the beginning or end are ignored.

| Command          | What it does                                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `limpa`          | Clears this computer's conversation and recalled input history. Keeps its mode, connections, unlocked key, and counter.                    |
| `contexto`       | Shows only the last computer's riddle in the output chain and selects it as the destination. With no output, shows this computer's riddle. |
| `entd`           | Shows the computer connected to this terminal's input.                                                                                     |
| `sda`            | Shows the computer connected to its output.                                                                                                |
| `cncta_ent <pc>` | Connects the named computer's output to this terminal's input.                                                                             |
| `cncta_sda <pc>` | Connects this terminal's output to the named computer's input.                                                                             |
| `lbr_ent`        | Removes the input connection, leaving it empty.                                                                                            |
| `lbr_sda`        | Removes the output connection, leaving it empty.                                                                                           |
| `acordado`       | Wakes up this computer and enables its dialogue responses.                                                                                 |
| `dormindo`       | Puts this computer and every computer reachable through its output to sleep, including awake or locked computers.                          |
| `transe`         | Starts this computer's six-line trance sequence.                                                                                           |
| `/segredos`      | Lists the command names.                                                                                                                   |

Connection and disconnection commands require the key of the computer where they are entered. An unlocked computer can still connect to a locked one. Existing connections work while locked.

A blocked attempt returns:

```text
Chave não encontrada ou não digitada nos ultimos 30 dias.
```

The thirty-day limit is part of the message; there is no timer or expiration rule.

A few details matter during play:

- `cncta_ent` and `cncta_sda` without a computer name are ordinary messages, even with trailing spaces. Using `nenhum` as the argument disconnects that side, just like the corresponding `lbr_` command.
- `/limpar` is also accepted. `ajuda` and `/ajuda` are ordinary messages.
- `contexto` works whether computers are awake or asleep. The final computer answers, and its response appears in its own history and at the sender. Intermediate computers do not provide riddles.
- In a circular network, `contexto` reports the cycle and keeps the previous destination. `dormindo` puts each reachable computer to sleep once, then reports the cycle.
- Only commands typed by a player execute as commands. If a cipher produces the text `dormindo`, `contexto`, or `limpa`, the next computer treats it as cipher input.

### Trance mode

Type `transe` at a terminal to start its sequence. The first line arrives after two seconds, followed by one line every two seconds. Each computer has six lines, delivered in the order listed in the backend catalog. After the sixth line, it stays in trance and waits. Send an ordinary message to start the sequence again from the first line.

Messages sent while the sequence is running are ignored: they do not appear in history, restart the sequence, or queue another round. Repeating `transe` during a running sequence is also ignored. Other commands remain available. `acordado` stops the sequence at that terminal; `dormindo` stops it on every computer reached by that command. `limpa` clears history but lets the sequence continue.

The Java server controls the timing and shares each line through SSE. Reloading the page, changing terminals, or closing a browser does not start an extra sequence. Different computers can run their sequences independently. If the server is delayed, it sends the next line when it can and leaves another two seconds before the following line, rather than sending missed lines all at once.

A terminal in trance does not run its cipher or forward dialogue. A cipher transmission that reaches it stops there and does not start a trance sequence. Resetting the game cancels all pending lines and restores the initial awake state.

### Keys and routes

To unlock a computer, its cipher must produce the complete answer after the message has followed that puzzle's exact route, in order, with the computers asleep. The route includes both the starting computer and the destination.

Answer matching ignores case, accents, and surrounding spaces. For example, `NÓ`, `nó`, `NO`, and `no` match. It still compares the **whole answer**: `isto é um sonho` does not count as `SONHO`. Extra words, punctuation, or changes to internal spacing are not ignored. This rule applies to every computer and key.

A sleeping computer checks its cipher's output before forwarding it:

- If the answer and route are correct, it accepts the key, unlocks its connection commands, and shows its completion response.
- If the answer is correct but the route is incomplete or wrong, it shows the required route without unlocking.
- Otherwise, the message continues through the output connection, unless it has reached the destination selected by `contexto`.

Recognizing a key ends that message, **not the connection**. The links stay in place for later messages. This also works without a prior `contexto` command, or when another destination is selected farther down the chain.

An awake receiver, a missing output, or a cycle can stop an ordinary transmission. Errors are deliberately brief, without suggestions for fixing them. When a selected destination is reached, the route is checked; puzzles with a configured completion message also report an incorrect answer. A key always requires both the right answer and the full route, even for puzzles without custom completion text.

Spaces in cipher results are shown as small middle dots (`·`), including repeated and trailing spaces. These dots are visual only: copying, forwarding, and answer matching still use real spaces. Dialogue, riddles, and system messages keep their usual spacing.

The sender normally sees the sequence of cipher results. Each receiver keeps its incoming text, output, and source in its own history. On a transmission error, the sender sees only the error message.

## Setting up your campaign

The puzzle catalog is [computers.json](../enigmas-backend/src/main/resources/puzzles/computers.json) in the Java backend. Edit riddles, answers, dialogue, routes and initial connections there. Cipher implementations live in the backend CipherService. Restart Spring after changing campaign content.

All ten terminals have their own riddles and ciphers. Puzzle routes and live connections are separate.

The browser receives public metadata and the results of submitted commands; it does not receive answer definitions or execute cipher rules. Game rules are tested in the Java backend. Frontend tests use supplied server snapshots, without a duplicate game engine.

To add a new computer, add its backend definition and public route metadata in src/app/features/terminals/data/public-computers.ts. Never put answers in public metadata.

## Backend connection

All browser requests use /api on the Angular origin. The development proxy and the production SSR server forward them to http://127.0.0.1:8080. Set BACKEND_URL on the Angular host before starting it to use another backend address. Phones continue to open the Angular LAN address; they do not connect directly to port 8080.

The interface waits for the backend before accepting commands, displays connection errors and offers Reconectar. A failed or uncertain send keeps the draft and reloads server state; check the history before resending. There is no offline execution mode.

For the production Node SSR server, set NG_ALLOWED_HOSTS to the explicit hostnames/IPs serving the app (for example localhost,127.0.0.1). The LAN development launcher already configures its local addresses. For static-only hosting, configure an equivalent /api reverse proxy on the web server.

## Cipher reference and solutions

These examples match the current campaign. If you change a cipher or route, update its solution and any other routes that pass through that computer.

### `chma_vva` — the Voracious Flame Cipher

Keep one character, then burn the next one. Keep another, then burn two. Keep another, then burn three. Repeat the 1, 2, 3 burn cycle until the message ends. Each new message starts with a burn of one; spaces do not restart the cycle.

```text
PORTA         → PR
PPOOORRRRTTAAA → PORTA
PXOYZRABCTQAMN → PORTA
```

Every Unicode code point counts, including spaces, accents, punctuation, digits, and emoji. Surviving characters are returned unchanged. A final survivor is kept even if there is not enough fuel after it. Combining accents count separately from their letters.

To produce a chosen output, insert one, two, then three disposable characters after successive survivors. Repeating the survivor is one convenient option. There is no unique inverse because the discarded characters can be anything. The transformation is implemented in [CipherService.java](../enigmas-backend/src/main/java/br/com/enigmas/backend/enigma/service/CipherService.java).

**Answer:** `A LUZ TAMBÉM DEVORA`\
**Route:** `chma_vva` only.

With the computer asleep, enter this inscription (the repeated spaces matter):

```text
AA   LLLLUUZZZ    TTAAAMMMMBBÉÉÉMMMM  DDDEEEEVVOOORRRRAA
```

A correct answer unlocks its connection commands and shows:

> Aquilo que iluminou seu caminho também aprendeu a consumi-lo.

The message stops locally even when its output is connected. Those links stay in place. The same answer arriving through another computer reveals the required route without unlocking it.

### `tec_la` — the Web Cipher

The Web Cipher rearranges characters without replacing them. It takes the characters in odd-numbered positions in their original order, then appends the even-positioned characters in reverse order.

```text
PORTA    → PRATO
SOOHN    → SONHO
ABCDEFGH → ACEGHFDB
```

Every character counts, including spaces, punctuation, accents, and emoji. Positions are counted as Unicode code points, so a combining accent can move separately from its letter. The inverse restores the original sequence exactly.

The transformation is implemented in [CipherService.java](../enigmas-backend/src/main/java/br/com/enigmas/backend/enigma/service/CipherService.java).

**Answer:** `TODO FIO ENCONTRA O MESMO NÓ`\
**Route:** `sr_grdabs → tec_la`

With the Abyss Carriers cipher, enter this at `sr_grdabs`:

```text
FTBOC AO HMKSQEL  QEM CCXOUN
```

The text reaching `tec_la` is:

```text
TOOND OO MFSIEOM  EON CAORNT
```

The double spaces are intentional. The Web Cipher then produces the answer. The message stops at `tec_la`, even if its output is still connected to `fnt_primdal`.

Producing the same answer directly at `tec_la` reveals the required route instead of unlocking it. Completing the route shows:

> O nó foi fechado.\
> O caminho que entrou já não é o caminho que sai.

Its awake dialogue includes: “Nenhum fio é criado. Nenhum fio é perdido. Apenas o caminho muda.”

### `inno_m1nvl` — the Mask Cipher

The Mask Cipher reads pairs of letters. Starting at the first letter, it moves forward around the alphabet to the second and returns the letter halfway along that path, rounding down.

Order matters:

```text
RT → S    TR → F    PO → B
BA → N    AZ → M
```

Adjacent forward pairs such as `AB`, `BC`, and `ZA` produce a space. Equal pairs do too. An unpaired letter is treated as a duplicate pair, so it also produces a space.

```text
PORTA → "BS "
```

The final space is part of the result. Each pair uses the case of its first letter. Non-ASCII letters, spaces, punctuation, numbers, and emoji are preserved and separate runs of letters; pairs never cross those boundaries.

See [CipherService.java](../enigmas-backend/src/main/java/br/com/enigmas/backend/enigma/service/CipherService.java).

**Answer:** `PALCO`\
**Route:** `h_colinas → inno_m1nvl`

With the current ciphers:

```text
QWXDEKDJNT → OQZBKMBDNP → PALCO
```

A correct full-route answer shows:

> O papel estava vazio. Agora ele pertence a você.

Producing `PALCO` locally shows the route without unlocking the key.

### `sr_grdabs` — the Abyss Carriers Cipher

Split each word into pairs. For each pair `(a, b)`, emit the second letter unchanged, then the forward circular distance `(b - a) mod 26`, encoded using A=0 through Z=25. An unpaired final letter advances by one, wrapping Z to A.

```text
PORTA     → OZTCB
BPYRZ     → PORTA
TRAVESSIA → RYVVSOIQB
CTFAMEKSZ → TRAVESSIA
```

The forward transform is not its own inverse. For an output pair `(b, distance)`, reconstruct `(b - distance mod 26, b)`; shift an odd final letter back by one.

Words are consecutive A–Z/a–z runs, matching the other word-based ciphers. Spaces, punctuation, digits, accented characters and emoji stay unchanged and separate runs. Pairing restarts for each run. The surviving second letter keeps its case; the distance uses the first letter's case, and the odd final letter keeps its case.

**Riddle:**

> Não sou a origem.
>
> Também não sou o destino.
>
> Só existo quando um já foi deixado para trás, mas o outro ainda não foi alcançado.
>
> Posso durar um passo ou uma vida inteira.
>
> O vazio não desaparece por minha causa.
>
> Apenas deixa de impedir.
>
> Nomeie o que existe entre partir e chegar.

**Answer:** `TRAVESSIA`.
**Route:** `inno_m1nvl → chma_vva → sr_grdabs`.

With the three computers connected and asleep, enter `BDBDSUSUSUEGEGEGEGZBZBLNLNLNDFDFDFDFJLJLRTRTRTYAYAYAYA` at `inno_m1nvl`. The mask produces `CCTTTFFFFAAMMMEEEEKKSSSZZZZ`, the flame produces `CTFAMEKSZ`, and the final cipher produces `TRAVESSIA`. Producing the answer locally or via a different route does not unlock the key.

> O abismo não foi vencido. Algo apenas concordou em carregá-lo.

### `h_colinas` — the Impossible Form Cipher

The 27 symbols A–Z and space occupy a 3 × 3 × 3 cube, read by rows within each layer:

```text
Layer 1   Layer 2   Layer 3
A B C     J K L     S T U
D E F     M N O     V W X
G H I     P Q R     Y Z [space]
```

X is the column, Y the row, and Z the layer. The transformation `(X, Y, Z) → (Y, Z, X)` cycles the dimensions. Applying it twice is the inverse; applying it three times restores the normalized input. Some symbols, including A and space, remain unchanged.

```text
PORTA → FWXPA → TQZFA → PORTA
TZQBMGAQ → PROJECAO
```

Lowercase ASCII letters become uppercase and accents are removed before transformation, so `projeção` uses `PROJECAO`. Punctuation, digits, line breaks and emoji pass through. Space is a cube symbol and is preserved, including leading, trailing and repeated spaces.

**Riddle:**

> Posso crescer sem ganhar matéria.
>
> Posso ocupar uma parede inteira sem possuir espessura.
>
> Quando aquilo que me origina muda de posição, minha forma também muda, embora minha origem permaneça a mesma.
>
> Posso parecer maior, menor ou deformada sem que aquilo que me produz tenha sofrido qualquer alteração.
>
> Aquilo que você vê é apenas uma parte do que existe.

**Answer:** `PROJEÇÃO` (the cipher produces `PROJECAO`).
**Route:** `chma_vva → h_colinas`.

With both computers connected and asleep, enter `TTZZZQQQQBBMMMGGGGAAQQQ` at `chma_vva`. The flame produces `TZQBMGAQ`, and the cube produces `PROJECAO`. Only the full route unlocks the connection key; producing the answer locally only reveals the required route.

> Você reconheceu a forma. Mas ainda não viu aquilo que a projeta.

Two more route solutions you can use during play:

- `inno_m1nvl → chma_vva → sr_grdabs`: enter `BDBDSUSUSUEGEGEGEGZBZBLNLNLNDFDFDFDFJLJLRTRTRTYAYAYAYA` at `inno_m1nvl` to produce `TRAVESSIA`.
- `chma_vva → tec_la → fnt_primdal`: enter `RRXXXIIIIZZNNNRRRRXX` at `chma_vva` to produce `RETORNO`.

### `nkai_a` — the Sleeper Cipher

For each word, move the first letter to the end, then shift every letter forward by the word's length, wrapping around the alphabet.

```text
PORTA → TWYFU    VKJMO → PORTA
SONHO → TSMTX    JNJIC → SONHO
```

Here, a word is a consecutive run of A–Z/a–z. Spaces, punctuation, digits, accented characters, and emoji stay in place and separate those runs. Each letter keeps its case when it moves. The cipher does not add or remove characters.

To find the input for a desired output, shift its letters backward by the word's length, then move the last letter to the front. See [CipherService.java](../enigmas-backend/src/main/java/br/com/enigmas/backend/enigma/service/CipherService.java).

**Answer:** `A FOME SABE ESPERAR`\
**Route:** `chma_vva → h_colinas → tec_la → nkai_a`

With the current ciphers, enter this at `chma_vva` after setting up the four-computer route and putting it to sleep:

```text
XXFFF    EEAAARRRRDDYYYEEEEHHYYYRRRR  EEEAAAA  QQQRRRROO
```

The text reaching `nkai_a` is `Z ABKI AOWX KXLIXKT`, which produces the answer. Entering that text locally shows the required route without unlocking the key. Only the complete route accepts the answer, with `h_colinas` visited once. Extra words do not count as the answer, and accepting it keeps any existing connections in place.

Completing the route shows:

> Você não encontrou o caminho até ele. Apenas chegou onde ele sempre esperou.

### `grd_s0nhadr` — the Deep Mist Cipher

Each word sinks one letter at a time: shift its first letter by +1, its second by +2, and so on, wrapping around the alphabet. Then reverse the shifted word. The depth starts over for each word.

```text
PORTA → FXUQQ    ZROKK → PORTA
SONHO → TLQQT    NFKKN → SONHO
```

To produce a chosen output, reverse it first, then subtract each letter's depth. The forward cipher is not its own inverse. As with the Sleeper Cipher, words are consecutive runs of A–Z/a–z. Spaces, punctuation, digits, accents, and emoji stay in place and separate those runs. Each letter keeps its case when it moves.

See [CipherService.java](../enigmas-backend/src/main/java/br/com/enigmas/backend/enigma/service/CipherService.java).

**Answer:** `CHAMADO`\
**Route:** `h_colinas → inno_m1nvl → sr_grdabs → tec_la → grd_s0nhadr`

Once all five computers are connected and asleep, enter `ZFKQXDAGDJOUSY` at `h_colinas`. The text reaching `grd_s0nhadr` is `NBXIVBV`, which produces `CHAMADO`.

Completing the route unlocks the key and shows:

> Ele não chamou por você. Você apenas conseguiu ouvir.

Producing the answer locally or through the wrong route only shows the required route. A longer phrase containing `CHAMADO` does not unlock it. Existing connections stay in place after the key is accepted.

### `sultao_d` — the Chaotic Core Cipher

The terminal decodes an inscription using two repeating rhythms:

1. Keep groups of 2, 3, then 1 characters, discarding one character after each group.
2. Shift the surviving ASCII letters backward by 1, 3, then 5 positions.

Both rhythms restart for every message. Discarded characters can be anything. The grouping counts Unicode code points; surviving spaces, punctuation, and accents remain unchanged and do not advance the letter-shift rhythm. An incomplete final group is read as-is.

```text
FQQYSDDWW → ENTRAR
TRRSIRR   → SONHO
```

See [CipherService.java](../enigmas-backend/src/main/java/br/com/enigmas/backend/enigma/service/CipherService.java).

**Answer:** `SONHO`\
**Route:** all ten computers, in this order:

```text
chma_vva → sr_grdabs → h_colinas → inno_m1nvl → tec_la
→ fnt_primdal → nkai_a → grd_s0nhadr → caosra_st → sultao_d
```

Once the links are set up and the computers are asleep, entering `UUVVVUUUUHHUUUZZZZUUBBBUUUUTTUUUHHHHUUGGG` at `chma_vva` sends `TRRSIRR` into `sultao_d`, which decodes it to `SONHO`.

Typing `sonho` directly at a sleeping `sultao_d` is a special route lookup: it shows the ten required computers without forwarding the message or unlocking anything. Decoding `SONHO` locally also shows the route. The key requires the full journey in one transmission.

Completing it shows these lines at the destination and the sender:

> A primeira mentira foi aceita.\
> Aquilo que não existe agora conhece teu nome.\
> Não desperte ainda.

### `caosra_st` — the Crawling Chaos Cipher

Arrange each word in a circle. Starting with its first letter, skip one letter and remove the next. Resume counting at the letter immediately after the one removed, wrapping around the shrinking circle. Return the letters in removal order.

For five letters, the positions are removed in this order: 2, 4, 1, 5, 3. For six letters, the order is 2, 4, 6, 3, 1, 5.

```text
PORTA  → OTPAR
RPAOT  → PORTA
ENGANO → NAOGEN
NEANOG → ENGANO
```

To work backward, place the desired output letters into those removal positions. Applying the forward cipher again does not generally recover the original word.

Each consecutive run of A–Z/a–z forms its own circle. Letters keep their case. Spaces, punctuation, digits, accented characters and emoji remain in place and separate the runs, as in the other word-based ciphers.

One of the computer's awake responses gives the mechanical clue:

> Siga em frente. Ignore o primeiro. Tome o segundo. Continue de onde ele desapareceu.

**Riddle:**

> Pode dizer apenas verdades e ainda levá-lo ao lugar errado.
>
> Precisa parecer seguro antes que alguém aceite segui-lo.
>
> Quando finalmente é percebido, muitas vezes já cumpriu sua função.
>
> Sua força não está em esconder o caminho.
>
> Está em fazê-lo acreditar que escolheu corretamente.
>
> Nomeie aquilo que transforma confiança em erro.

**Answer:** `ENGANO`.
**Route:** `h_colinas → tec_la → caosra_st`.

Connect the three computers in that order and put them to sleep. Enter `NSMQAN` at `h_colinas`:

```text
NSMQAN → NGEOAN → NEANOG → ENGANO
```

Completing the route unlocks the key and shows:

> Você chegou exatamente onde deveria. A dúvida é, segundo quem?

Producing `ENGANO` locally or through a different route only shows the required route. The computers used to set up the links must already have their connection commands unlocked.

### `fnt_primdal` — the Primordial Source Cipher

Build a second alphabet by alternating letters from the beginning and end of the normal alphabet, moving inward until they meet. Replace each letter with the one in the same position in that second row:

```text
Normal:     ABCDEFGHIJKLMNOPQRSTUVWXYZ
Primordial: AZBYCXDWEVFUGTHSIRJQKPLOMN
```

```text
PORTA   → SHRQA
SHRQA   → JWRIA
VXRNA   → PORTA
RETORNO → RCQHRTH
RINXRZX → RETORNO
```

To find the input for a chosen output, look up each letter in the primordial row and take the letter above it. Applying the forward substitution twice does not undo it. Uppercase and lowercase letters keep their case; spaces, accents, punctuation, digits and emoji stay unchanged.

**Riddle:**

> Pode-se partir tão longe que o início deixa de ter nome.
>
> A forma muda.\
> A memória desaparece.\
> Aquilo que veio depois passa a acreditar que sempre existiu assim.
>
> Mas seguir para trás o bastante não leva a um lugar novo.
>
> Leva ao ponto anterior a todas as diferenças.
>
> Nomeie aquilo que termina exatamente onde começou.

**Answer:** `RETORNO`.
**Route:** `chma_vva → tec_la → fnt_primdal`.

With the three computers connected and asleep, enter `RRXXXIIIIZZNNNRRRRXX` at `chma_vva`:

```text
RRXXXIIIIZZNNNRRRRXX → RXIZNRX → RINXRZX → RETORNO
```

The full route unlocks the key and shows:

> Você chamou isso de chegada. Aqui, chamam de retorno.

Producing `RETORNO` locally or without the full route shows the required route without unlocking the key.

## Working on the project

The app uses Angular 22. Production UI code lives in src/app/features/terminals/:

- components/ contains the terminal and output presentation.
- services/ contains the HTTP client, shared game state, and SSE connection.
- models/ describes public API data.
- data/public-computers.ts and routing/ define public URLs.
- functions/output-display.ts preserves copyable spaces in cipher results.
- testing/ contains UI test helpers with supplied snapshots and no game rules.

The Java backend owns game rules and persistence. See the [architecture guide](docs/architecture.md) for package boundaries and the request flow.
The phone layout keeps the input separate from the scrolling history, provides touch buttons for recalling previous messages, and leaves browser zoom enabled. The terminal avoids opening the keyboard automatically on touch devices. Check the virtual keyboard on a real Android or iOS device when changing the layout.

To run the checks:

```sh
npm test -- --watch=false
npm run test:server
npm run build
```

These commands finish after checking or building. Start the game separately with `npm start` or `npm run start:lan`.

## Resetting the game

For a time-loop reset during play, run `powershell -File .\scripts\reset-game.ps1` from the **backend project folder**, then type `REINICIAR`. The script uses the local master key from the backend's ignored `.env.properties`. Restart the backend after setting up the master key. Once it is running, you can reset the game as often as needed without restarting Java.

All players return to the initial state through SSE. A new cycle identifier also clears browser drafts and rejects delayed commands from the previous cycle. Restarting Spring still resets the game; restarting Angular alone does not.

This resets progress, connections, modes, and terminal history; it does not delete database rows or change puzzle definitions. The terminal command `limpa` only clears its history and does not reset game progress.

## Current puzzle routes

| Destination | Required route                                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------------ |
| inno_m1nvl  | h_colinas → inno_m1nvl                                                                                             |
| sultao_d    | chma_vva → sr_grdabs → h_colinas → inno_m1nvl → tec_la → fnt_primdal → nkai_a → grd_s0nhadr → caosra_st → sultao_d |
| tec_la      | sr_grdabs → tec_la                                                                                                 |
| nkai_a      | chma_vva → h_colinas → tec_la → nkai_a                                                                             |
| grd_s0nhadr | h_colinas → inno_m1nvl → sr_grdabs → tec_la → grd_s0nhadr                                                          |
| chma_vva    | chma_vva                                                                                                           |
| h_colinas   | chma_vva → h_colinas                                                                                               |
| caosra_st   | h_colinas → tec_la → caosra_st                                                                                     |
| sr_grdabs   | inno_m1nvl → chma_vva → sr_grdabs                                                                                  |
| fnt_primdal | chma_vva → tec_la → fnt_primdal                                                                                    |
