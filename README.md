# Distributed Wagering Processor

## Visão geral

Este projeto foi desenvolvido como solução para o desafio técnico **Distributed Wagering Processor**, proposto pela Jungle Gaming.

O objetivo do desafio se trata sobre construir uma API para processamento de transações financeiras de apostas, considerando aspectos como precisão monetária, consistência de saldo, idempotência, concorrência e rastreabilidade das movimentações.

Durante o desenvolvimento priorizei construir uma base funcional, estudar e aplicar uma stack nova e implementar as principais regras de negócio que consegui abordar dentro do tempo disponível.

**O desafio não foi concluído integralmente.** Algumas partes importantes da arquitetura distribuída e alguns endpoints ainda não foram implementados. Essas limitações estão descritas neste documento, para deixar claro o escopo entregue.

## Tecnologias

- **Bun** — runtime e gerenciamento de dependências.
- **TypeScript** — linguagem principal.
- **NestJS** — framework para construção da API.
- **PostgreSQL** — banco de dados relacional.
- **MikroORM** — mapeamento objeto-relacional e gerenciamento de migrations.
- **Decimal.js** — operações monetárias com precisão decimal.
- **Vitest** — execução dos testes automatizados.
- **Docker** — execução do PostgreSQL em ambiente de desenvolvimento.

## Arquitetura do projeto

Foi adotada uma arquitetura em camadas, com separação de responsabilidades:

```text
src/
├── application/
│   └── services/
├── business-logic/
│   ├── entities/
│   └── value-objects/
├── config/
├── data-access/
│   ├── entities/
│   └── repositories/
└── presentation/
    ├── controllers/
    └── dtos/
```

Responsabilidades principais:

- **presentation:** Receber as requisições HTTP, validar os dados de entrada e apresentar as respostas.
- **application:** Responsável por coordenar os casos de uso e a interação entre as camadas.
- **business-logic:** Aqui concentram-se as entidades, Value Objects e regras de negócio.
- **data-access:** Contém as entidades de persistência e os repositórios responsáveis pelo acesso ao banco.
- **config:** Reúne configurações da aplicação e do banco de dados.

A estrutura busca manter as regras de negócio independentes dos detalhes de transporte HTTP e persistência. Mais detalhes estão em [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Funcionalidades implementadas

### Processamento de transações

Foi implementado o fluxo principal de processamento de transações de apostas, contemplando os seguintes tipos:

- `BET`: debita o valor da carteira.
- `WIN`: credita o valor da premiação.
- `LOSS`: registra o resultado sem movimentar o saldo.
- `REFUND`: devolve o valor de uma aposta processada.
- `ROLLBACK`: realiza a operação inversa de uma transação elegível.
- `OPENING`: representa a movimentação inicial de abertura da carteira.

Também foram implementados estados para representar o processamento, como `PENDING`, `PENDING_REFERENCE`, `PROCESSED`, `REJECTED` e `FAILED`.

### Precisão monetária

Foi criado o Value Object `Money`, utilizando `Decimal.js` para evitar problemas de precisão associados a operações com ponto flutuante, e seguir os requisitos do desafio proposto.

O objeto encapsula o valor e a moeda, com validações para:

- Valores negativos.
- Mais de duas casas decimais.
- Notação científica.
- Moedas não suportadas.

A representação monetária é mantida como string, evitando utilizar `number` como representação de valores financeiros nas regras de negócio.

### Carteiras e saldo

A entidade `Wallet` concentra as operações de débito e crédito e protege as invariantes do saldo.

O processamento utiliza bloqueio pessimista de escrita (`PESSIMISTIC_WRITE`) ao buscar a carteira para movimentação, buscando evitar que operações concorrentes atualizem o mesmo saldo de maneira inconsistente.

### Ledger

Foi implementada a entidade `WalletLedgerEntry` para registrar as movimentações financeiras associadas às transações.

As operações que alteram o saldo são persistidas junto com a transação e o registro do ledger, dentro de uma transação do banco de dados.

A operação `LOSS`, por não movimentar o saldo, não gera uma entrada de ledger.

### Idempotência

Foi implementado o uso do header `Idempotency-Key`.

A chave e o hash do payload são persistidos no banco de dados. O comportamento implementado é o seguinte:

- Mesma chave e mesmo payload: retorna o resultado da transação original, sem repetir a movimentação.
- Mesma chave e payload diferente: retorna conflito (`409 Conflict`).

A persistência no banco evita depender de cache em memória como garantia de idempotência.

### Validação de referências

As operações `REFUND` e `ROLLBACK` validam a transação de referência, incluindo informações como tipo da operação, jogador, provedor, carteira, moeda, rodada e valor.

Quando a referência não é encontrada ou ainda não está processada, a transação pode ser registrada como `PENDING_REFERENCE`.

**Limitação:** o mecanismo de reprocessamento automático dessas transações pendentes ainda não foi implementado.

## API implementada

O endpoint de processamento implementado é:

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/wagering/transactions` | Processa uma transação de aposta. |

A requisição utiliza o header `Idempotency-Key`.

Exemplo simplificado:

```http
POST /wagering/transactions
Content-Type: application/json
Idempotency-Key: bet-player-001-001
```

```json
{
  "providerId": "provider-001",
  "playerId": "player-001",
  "walletId": "UUID-DA-CARTEIRA",
  "externalTransactionId": "bet-001",
  "roundId": "round-001",
  "kind": "BET",
  "amount": "10.00",
  "currency": "BRL"
}
```

O formato acima representa um exemplo de requisição; os campos devem seguir o DTO implementado no projeto.

A resposta apresenta informações da transação, status, eventual código de falha, saldo resultante e indicação de replay idempotente.

Outros endpoints previstos no desafio, como consulta de carteira, consulta de ledger, consulta de transações e reconciliação, não foram concluídos nesta entrega.

## Persistência e migrations

O PostgreSQL é utilizado como fonte de persistência dos dados.

O MikroORM é responsável por mapear das entidades e gerenciar as migrations.

As migrations criadas pelo projeto permitem versionar a estrutura do banco de dados e aplicar as alterações controladamente.

## Testes

Foram desenvolvidos testes automatizados para regras de negócio, Value Objects e serviços.

No último checkpoint de execução, a suíte apresentou **112 testes passando**, distribuídos em 5 arquivos de teste. A verificação de tipos com `bunx tsc --noEmit` também havia sido executada com sucesso naquele checkpoint.

Além dos testes automatizados, foram realizados testes manuais da API utilizando Postman e consultas ao PostgreSQL para verificar os resultados persistidos.

Os fluxos manuais verificados incluíram:

- Abertura de carteira e movimentações.
- Débito com `BET`.
- Crédito com `WIN`.
- Registro de `LOSS` sem alteração do saldo.
- Rejeição de aposta com saldo insuficiente.
- Replay idempotente e conflito por reutilização da chave com payload diferente.
- `REFUND` e `ROLLBACK` com referências válidas.
- Rejeição de referências incompatíveis e tentativas de reversão duplicadas.
- Conferência das entradas do ledger no banco de dados.

Os testes manuais não substituem os testes de concorrência e integração distribuída exigidos pelo desafio, os quais, infelizmente, não foram realizados.

## Configuração e execução

### Pré-requisitos

- Bun instalado.
- Docker instalado e em execução.
- PostgreSQL disponível para a aplicação.

### Instalação

```bash
bun install
```

### Variáveis de ambiente

Configure as variáveis utilizadas em `src/config/database.config.ts` para conectar a aplicação ao PostgreSQL.

Crie um arquivo `.env` na raiz do projeto com os valores correspondentes ao seu ambiente. Os nomes das variáveis devem seguir exatamente os utilizados na configuração do banco de dados.

### Migrations

Criar uma migration:

```bash
bun run db:migration:create
```

Aplicar migrations pendentes:

```bash
bun run db:migration:up
```

Consultar o status das migrations:

```bash
bun run db:migration:list
```

### Executar a aplicação

Modo de desenvolvimento:

```bash
bun run start:dev
```

### Executar os testes

```bash
bun run test
```

Verificar os tipos TypeScript:

```bash
bunx tsc --noEmit
```

## Limitações e funcionalidades não concluídas

O desafio propõe uma arquitetura distribuída mais abrangente do que a implementação alcançada. Os seguintes itens permaneceram pendentes:

- Integração com SQS e ambiente local de mensageria.
- Padrões **Transactional Outbox** e **Inbox**.
- Consumidores de mensagens, confirmação após commit, política de retries e Dead Letter Queue (DLQ).
- Reprocessamento automático de transações com `PENDING_REFERENCE`, incluindo backoff e expiração.
- Endpoints de consulta de carteiras, ledger e transações.
- Endpoint de reconciliação de saldo e ledger.
- Endpoints de health check.
- Observabilidade estruturada, métricas e logs específicos do processamento.
- Testes de concorrência e execução com múltiplas instâncias/processos conforme os cenários do desafio.
- Autenticação.

A autenticação era opcional no desafio, e ela não foi implementada nesta versão.

Também existem cenários de concorrência e recuperação que ainda precisam de testes de integração específicos. Com isso o uso de transações SQL e bloqueio pessimista representa uma implementação inicial de proteção de consistência, mas não pode garantir validação de todos os cenários distribuídos exigidos no desafio.

## Considerações finais

Com o tempo disponível em relação a meus conhecimentos atuais, não foi possível concluir todos os requisitos do desafio. Mesmo assim, procurei entregar uma implementação que fosse funcional sobre as principais regras de processamento financeiro, com atenção especial à precisão monetária, consistência do saldo, persistência, idempotência e rastreabilidade por meio do ledger.

Outro objetivo importante foi estudar e aplicar tecnologias com as quais eu ainda não tinha experiência prática suficiente, especialmente Bun, NestJS e MikroORM, além de aprofundar meus conhecimentos sobre transações de banco de dados, concorrência e arquitetura de sistemas financeiros.

Essa implementação representa o que consegui desenvolver e validar dentro do período disponível. As funcionalidades pendentes estão documentadas para facilitar a continuidade do trabalho e indicar os próximos passos necessários para aproximar o projeto de todos os requisitos do desafio.