# PRESOS — RPG puzzle terminals

PRESOS is a browser-based puzzle system for a tabletop RPG. Players explore ten old computers, work out how each one changes their messages, and connect them in the right order to solve a riddle. The interface is a green terminal with a conversation history, built to work on phones as well as desktops.

This README is for the game master and anyone working on the project. It includes puzzle solutions. Commands, answers, and dialogue are kept in Portuguese, just as they appear in the game.

## Get it running

Install the dependencies, then start the app:

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

**Restarting the server resets the game.** Histories, unlocked keys, counters, drafts, and the selected destination are cleared. Every computer wakes up, and the initial connections return.

Open tabs check the server session when they load, every ten seconds, and when players return to the tab or reconnect. A temporary network failure does not erase progress; the reset happens once the browser confirms that the server has restarted.

Reloading a page during the same server session keeps progress in that tab through `sessionStorage`. Switching computers with the selector keeps it too. Each tab and device has its own game state: sharing the site over Wi-Fi does not synchronize players' connections or histories. If browser storage is unavailable, the game runs in memory.

## How the terminals work

Every computer starts **awake**. In this mode, it replies with fragments of dialogue about its identity. When it is **asleep**, it applies its cipher and sends the result through its output connection.

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

### Keys and routes

To unlock a computer, its cipher must produce the complete answer after the message has followed that puzzle's exact route, in order, with the computers asleep. The route includes both the starting computer and the destination.

Answer matching ignores case, accents, and surrounding spaces. For example, `NÓ`, `nó`, `NO`, and `no` match. It still compares the **whole answer**: `isto é um sonho` does not count as `SONHO`. Extra words, punctuation, or changes to internal spacing are not ignored. This rule applies to every computer and key.

A sleeping computer checks its cipher's output before forwarding it:

- If the answer and route are correct, it accepts the key, unlocks its connection commands, and shows its completion response.
- If the answer is correct but the route is incomplete or wrong, it shows the required route without unlocking.
- Otherwise, the message continues through the output connection, unless it has reached the destination selected by `contexto`.

Recognizing a key ends that message, **not the connection**. The links stay in place for later messages. This also works without a prior `contexto` command, or when another destination is selected farther down the chain.

An awake receiver, a missing output, or a cycle can stop an ordinary transmission. Errors are deliberately brief, without suggestions for fixing them. When a selected destination is reached, the route is checked; puzzles with a configured completion message also report an incorrect answer. A key always requires both the right answer and the full route, even for puzzles without custom completion text.

The sender normally sees the sequence of cipher results. Each receiver keeps its incoming text, output, and source in its own history. On a transmission error, the sender sees only the error message.

## Setting up your campaign

Each computer has a configuration file in [src/app/features/terminals/data/computers](src/app/features/terminals/data/computers). Edit its riddle, answer, dialogue, cipher, and puzzle route there.

The custom puzzles for `inno_m1nvl`, `tec_la`, and `sultao_d` are in place. The remaining ciphers and riddles are placeholders. Dialogue is original and inspired by the campaign's entities without naming them directly.

The puzzle routes and the live connections are separate. Changing a connection during play does not change the route needed to solve a puzzle.

| What you want to change                          | Where to look                                                 |
| ------------------------------------------------ | ------------------------------------------------------------- |
| A computer's riddle, answer, dialogue, or cipher | `src/app/features/terminals/data/computers/<id>.ts`           |
| Initial connections                              | `INITIAL_CONNECTION_CHAIN` in `config/initial-connections.ts` |
| Puzzle routes and the default route order        | `config/puzzle-routes.ts`                                     |
| Storage settings and connection migrations       | `config/network.config.ts`                                    |
| The computer list and default opening terminal   | `data/computers.ts`                                           |

Paths in the last four rows are relative to `src/app/features/terminals/`.

`chma_vva` has a one-computer puzzle: itself. Every other puzzle route includes `tec_la` exactly once. The computer factory inserts it when needed, without creating any live connections. Route length includes the first and last computer.

By default, `createComputer` starts with a three-computer route and uses a Caesar shift of +3 for A–Z/a–z. Adding the required `tec_la` step may make the route longer. Accents, numbers, and punctuation are preserved by that default cipher. Explicit routes override the generated route; `chma_vva` opts out of the required step.

Answers are hidden from the terminal's riddle display, but they are part of the client-side code. The interface intentionally offers little guidance: `/segredos` lists names only, and the cipher explanations below are for the game master.

## Cipher reference and solutions

These examples use the current placeholder ciphers. Full-route inputs will need updating as the remaining computers get their own ciphers.

### `tec_la` — the Web Cipher

The Web Cipher rearranges characters without replacing them. It takes the characters in odd-numbered positions in their original order, then appends the even-positioned characters in reverse order.

```text
PORTA    → PRATO
SOOHN    → SONHO
ABCDEFGH → ACEGHFDB
```

Every character counts, including spaces, punctuation, accents, and emoji. Positions are counted as Unicode code points, so a combining accent can move separately from its letter. The inverse restores the original sequence exactly.

The implementation is in [web.ts](src/app/features/terminals/ciphers/web.ts). `weaveText` is the terminal's cipher; `unweaveText` is available for tools and tests, not as a player command.

**Answer:** `TODO FIO ENCONTRA O MESMO NÓ`\
**Route:** `chma_vva → tec_la`

With the current `chma_vva` cipher, enter this at `chma_vva`:

```text
QÓLKA LL JCPFBLJ  BLK ZXLOKQ
```

The text reaching `tec_la` is:

```text
TÓOND OO MFSIEOM  EON CAORNT
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

See [mask.ts](src/app/features/terminals/ciphers/mask.ts).

**Answer:** `PALCO`\
**Route:** `sr_grdabs → tec_la → inno_m1nvl`

With the current ciphers:

```text
LMNKWAYYHJ → OPQNZDBBKM → OQZBKMBDNP → PALCO
```

A correct full-route answer shows:

> O papel estava vazio. Agora ele pertence a você.

Producing `PALCO` locally shows the route without unlocking the key.

### `sultao_d` — the Chaotic Core Cipher

The terminal decodes an inscription using two repeating rhythms:

1. Keep groups of 2, 3, then 1 characters, discarding one character after each group.
2. Shift the surviving ASCII letters backward by 1, 3, then 5 positions.

Both rhythms restart for every message. Discarded characters can be anything. The grouping counts Unicode code points; surviving spaces, punctuation, and accents remain unchanged and do not advance the letter-shift rhythm. An incomplete final group is read as-is.

```text
FQQYSDDWW → ENTRAR
TRRSIRR   → SONHO
```

See [chaotic-core.ts](src/app/features/terminals/ciphers/chaotic-core.ts).

**Answer:** `SONHO`\
**Route:** all ten computers, in this order:

```text
chma_vva → tec_la → fnt_primdal → nkai_a → h_colinas
→ sr_grdabs → inno_m1nvl → grd_s0nhadr → caosra_st → sultao_d
```

Once the links are set up and the computers are asleep, entering `XXZVVXXVVOXMWY` at `chma_vva` sends `TRRSIRR` into `sultao_d`, which decodes it to `SONHO`.

Typing `sonho` directly at a sleeping `sultao_d` is a special route lookup: it shows the ten required computers without forwarding the message or unlocking anything. Decoding `SONHO` locally also shows the route. The key requires the full journey in one transmission.

Completing it shows these lines at the destination and the sender:

> A primeira mentira foi aceita.\
> Aquilo que não existe agora conhece teu nome.\
> Não desperte ainda.

### Another route to try

The current `caosra_st` puzzle has the answer `loucura` and this route:

```text
inno_m1nvl → tec_la → grd_s0nhadr → caosra_st
```

With those links in place and all four computers asleep, entering `egtvhjkmnpnpvx` at `inno_m1nvl` gives:

```text
egtvhjkmnpnpvx → fuiloow → fiowolu → ilrzrox → loucura
```

The computers used to set up the links must already have their connection commands unlocked.

## Working on the project

The app uses Angular 22. Most game code lives in `src/app/features/terminals/`:

- `data/` and `config/` hold the computers, routes, and initial connections.
- `ciphers/` contains the text transformations.
- `functions/` contains reusable logic for routes, connections, and answer matching.
- `services/` handles game state, commands, transmission, and server-session checks.
- `components/terminal/` contains the shared interface and its BEM-style SCSS.
- `routing/` builds the URL routes from the computer list.

Unit tests live alongside the code they cover. The [architecture guide](docs/architecture.md), currently in Portuguese, explains the factories, route helpers, and how to add a computer. Ciphers are synchronous and should handle any input up to the terminal's 2,000-character limit.

The phone layout keeps the input separate from the scrolling history, provides touch buttons for recalling previous messages, and leaves browser zoom enabled. The terminal avoids opening the keyboard automatically on touch devices. Check the virtual keyboard on a real Android or iOS device when changing the layout.

To run the checks:

```sh
npm test -- --watch=false
npm run test:server
npm run build
```

These commands finish after checking or building. Start the game separately with `npm start` or `npm run start:lan`.
