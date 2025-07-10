# MiniMoni: Combining HLS with Payword

Existing micropayment systems struggle to achieve widespread adoption for continuous video streaming due to scalability limitations, security vulnerabilities related to token management, and tight coupling with specific video players. MiniMoni addresses these challenges by integrating the widely supported HTTP Live Streaming (HLS) protocol with PayWord, embedding payments directly into segment HTTP requests for atomic payment and delivery. The solution is implemented using player-agnostic integration and a secure browser extension for isolated token management, along with a three-step relay mechanism for secure inter-component communication. As such, MiniMoni provides a scalable and secure approach to continuous streaming monetization without requiring player-specific modifications.

## Estrutura do README.MD

Este README está organizado nas seguintes seções:

1. **[Introdução](#minimoni-combining-hls-with-payword)** - Visão geral do projeto MiniMoni
2. **[Selos Considerados](#selos-considerados)** - Selos de avaliação acadêmica
3. **[Informações Básicas](#informações-básicas)** - Requisitos de hardware e software
4. **[Dependências](#dependências)** - Docker, Docker Compose e MetaMask
5. **[Preocupações com Segurança](#preocupações-com-segurança)** - Avaliação de riscos
6. **[Instalação](#instalação)** - Guia passo a passo completo
7. **[Teste Mínimo](#teste-mínimo)** - Validação básica do sistema
8. **[Experimentos](#experimentos)** - Três reivindicações principais com procedimentos de validação
9. **[LICENSE](#license)** - Licença MIT do projeto

## Selos Considerados

Os selos considerados são:

- **Artefatos Disponíveis (SeloD)**
- **Artefatos Funcionais (SeloF)**
- **Artefatos Sustentáveis (SeloS)**
- **Experimentos Reprodutíveis (SeloR)**

## Informações básicas

Este projeto implementa um sistema completo de streaming de vídeo com micropagamentos usando blockchain Ethereum. O ambiente de execução requer:

**Requisitos de Hardware:**

- Memória RAM: Mínimo 4GB, recomendado 8GB
- Armazenamento: 2GB livres
- Conexão com internet estável

**Requisitos de Software:**

- Sistema Operacional: Linux, macOS ou Windows
- Docker version 28.2.2 ou superior
- Docker Compose version v2.36.2 ou superior

## Dependências

**Dependências principais:**

- Docker: 28.2.2+
- Docker Compose: v2.36.2+

**Recursos de terceiros:**

- MetaMask deve ser instalado manualmente do site oficial: https://metamask.io/download
- Todos os outros recursos são obtidos automaticamente via Docker

## Preocupações com segurança

Não há riscos de segurança para os revisores.

## Instalação

1. **Clone o repositório:**

   ```bash
   git clone https://github.com/otaviootavio/sbseg-sf-minimoni/
   cd sbseg-sf-minimoni
   ```

2. **Instale o Docker e Docker Compose:**

   - Siga as instruções oficiais para o seu sistema operacional
   - Verifique as versões: `docker --version` e `docker compose version`

3. **Instale o MetaMask:**

   - Acesse https://metamask.io/download
   - Instale a extensão no seu navegador
   - Crie uma carteira ou importe uma existente

4. **Inicie o ambiente completo:**

   ```bash
   docker compose up
   ```

5. **Construa a extensão do navegador:**

   ```bash
   cd vite-web-extension
   docker build --output type=local,dest=. .
   ```

6. **Carregue a extensão no navegador:**
   - **Chrome**: Acesse `chrome://extensions/`, habilite "Modo do desenvolvedor", clique em "Carregar sem compactação" e selecione a pasta `dist_chrome`

# Teste mínimo

Execute este teste para verificar se o sistema está funcionando corretamente:

1. **Inicie todos os serviços:**
   ```bash
   docker compose up
   ```
2. **Aguarde até ver as mensagens de inicialização:**

   - Hardhat: "Started HTTP and WebSocket JSON-RPC server at http://localhost:8545/"
   - Vendor API: "Server is running on port 3000"
   - Frontend: "Local: http://localhost:5173"

3. **Configure o MetaMask:**

   - Abra o MetaMask
   - Adicione a rede Hardhat
     - Nome: Hardhat
     - RPC URL: http://localhost:8545
     - Chain ID: 31337
     - Símbolo: ETH
   - Importe uma conta de teste usando uma das chaves privadas exibidas nos logs

   > **Nota:** O Hardhat gera automaticamente contas de teste com saldo de 10.000 ETH na rede local. Os endereços e chaves privadas padrão mais comuns são:
   >
   > - **Conta #0:**  
   >   Endereço: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`  
   >   Chave privada: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   > - **Conta #1:**  
   >   Endereço: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`  
   >   Chave privada: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
   >
   > Sugerimos que importe ambas para simular um Vendedor e um Usuário.

4. **Acesse a aplicação:**

   - Frontend: http://localhost:5173
   - API: http://localhost:3000
   - Swagger: http://localhost:3000/swagger

5. **Conectando-se ao frontend:**

   - Acesse o frontend (http://localhost:5173)
   - Conecte o MetaMask por meio do botão (Connect Wallet)
   - Conecte a extensão do MiniMoni (clique no botão Connect MiniMoni Wallet e em seguida aceite o popup)

6. **Cadastrar um Vendedor:**

   - Clique no botão "Switch to Vendor Mode"
   - Clique no botão "Create Vendor Profile"
   - O formulário deve estar parcialmente preenchido; preencha-o com a quantidade de Ether para cada hash (para fins de demonstração, sugerimos 1 ETH)
   - Para voltar à página inicial, clique em "Switch to User Mode"

7. **Importar carteira do Usuário:**

   - Para simular um cenário de Usuário e Vendedor, é necessário trocar para outro endereço de carteira
   - Veja o passo (3), onde ocorre a importação de um endereço gerado pelo Hardhat no MetaMask

8. **Abertura de um canal de pagamento:**

   - Importe os dados do Vendedor por meio do botão "Import"
   - Os dados do vendedor devem estar visíveis na extensão, que pode ser acessada clicando no ícone dela, junto ao painel de extensões
   - O painel "2. Open the channel!" deve estar visível, ele permite que o usuário selecione o tamanho da hashchain (portanto, quanto tempo de vídeo estará disponível ao usuário)
   - Sugerimos, para fins de testes, que sejam selecionados 100 hashes
   - Após isso, pressione o botão "Open Channel" e confirme a transação pelo MetaMask

9. **Envie pagamentos enquanto assiste vídeo:**
   - Na aba "My Channels" estão visíveis todos os canais, armazenados no backend
   - Na aba "Video" ocorrerá o streaming dos vídeos. Para realizar o streaming de vídeo, é necessário autorizar o acesso da página à extensão por certo tempo. Para fins de demonstração, sugerimos que dê permissão pelo máximo de tempo possível
   - Por fim, é possível dar play no vídeo

**Resultado esperado:** O sistema deve carregar completamente, o MetaMask deve conectar com sucesso, e o streaming de vídeo deve estar disponível.

# Experimentos

Esta seção descreve como reproduzir os principais experimentos e funcionalidades do sistema.

## Reivindicação #1: Integração do Protocolo PayWord com HLS para Pagamento e Entrega Atômicos

**Objetivo da Reivindicação**: Demonstrar que o sistema integra o protocolo PayWord com o streaming HLS de forma que cada segmento de vídeo seja entregue somente após a validação de um pagamento válido, garantindo atomicidade entre pagamento e entrega de conteúdo.

### Procedimento de Validação de Pagamentos

**Propósito**: Verificar que o sistema processa pagamentos PayWord sincronizados com requisições HLS, demonstrando que cada segmento de vídeo requer um token válido para ser entregue.

#### Monitoramento via Terminal do Navegador

**Função**: Observar o comportamento do frontend durante o streaming para confirmar geração e uso de tokens PayWord.

1. Acesse o console do navegador através de F12
2. Navegue até a aba "Console"
3. Execute o streaming de vídeo na aplicação
4. Observe as mensagens de log que indicam:

- **Interceptação de requisições HLS**: Mensagens `[SW]: Intercepting request` seguidas da URL do segmento de vídeo
- **Comunicação entre componentes**: Troca de mensagens entre service worker, content script e background script
- **Recuperação de hashchain ativa**: Logs indicando `GET_SELECTED_HASHCHAIN` com ID da hashchain
- **Geração sequencial de tokens**: Mensagens `GET_NEXT_HASH` seguidas do hash PayWord específico
- **Índice incremental**: Cada segmento deve ter um índice sequencial único (ex: `index: 4`, `index: 5`)
- **Validação do contrato**: Endereço do contrato blockchain sendo verificado consistentemente
- **Fluxo completo**: Para cada segmento, deve haver uma sequência completa de interceptação → busca de hashchain → geração de token → resposta ao service worker


#### Análise de Tráfego HTTP no Navegador

**Função**: Examinar o protocolo HTTP para verificar que headers PayWord são incluídos em cada requisição e que a entrega é condicional à validação.

1. Acesse as ferramentas de desenvolvimento do navegador (F12)
2. Navegue até a aba "Network"
3. Inicie o streaming de vídeo
4. Examine as requisições HTTP para endpoints `/hls/segment*.ts`
5. Verifique headers de autenticação PayWord em cada requisição:
   - Presença de token PayWord no header
   - Valor único do token para cada segmento
   - Correlação entre ordem dos tokens e sequência de segmentos

#### Monitoramento via Console do Docker Compose

**Função**: Confirmar que o servidor processa e valida tokens para cada requisição de segmento HLS.

1. Execute, caso ainda não tenha feito, o comando `docker compose up` no terminal
2. Monitore as saídas dos containers:
   - Container `vendor-api`: Logs de validação de tokens PayWord recebidos
   - Container `hardhat`: Logs de transações blockchain relacionadas aos canais
3. Identifique mensagens de processamento de pagamentos sincronizadas com requisições HLS
4. Verifique que cada requisição de segmento gera uma validação de token correspondente

## Reivindicação #2: Integração Agnóstica com Múltiplas Implementações de Player de Vídeo

**Objetivo da Reivindicação**: Demonstrar que o sistema de pagamento PayWord funciona independentemente da implementação específica do player de vídeo, mantendo a funcionalidade de micropagamentos mesmo quando diferentes tecnologias de reprodução são utilizadas.

### Procedimento para Teste de Compatibilidade

**Propósito**: Verificar que o mecanismo de pagamento PayWord permanece funcional ao alternar entre diferentes implementações de player de vídeo, comprovando que a solução é independente da tecnologia de reprodução.

#### Preparação do Ambiente

**Função**: Estabelecer um ambiente controlado onde diferentes players podem ser testados com as mesmas condições de pagamento.

1. Acesse a aplicação em `http://localhost:5173`
2. Navegue até a aba "Video"
3. Certifique-se de que a extensão MiniMoni esteja conectada e um canal de pagamento esteja aberto
4. Verifique que o saldo do canal é suficiente para reprodução contínua

#### Execução do Teste

**Função**: Comparar o comportamento do sistema de pagamento ao utilizar diferentes implementações de player de vídeo.

1. Selecione o primeiro player de vídeo (HLS.js)
2. Inicie a reprodução do vídeo
3. Abra o console do navegador (F12) e observe os logs de pagamento
4. Reproduza pelo menos 30 segundos para gerar múltiplas transações
5. Pause o vídeo e selecione o segundo player (Video.js)
6. Retome a reprodução do vídeo no mesmo ponto
7. Compare os logs de pagamento entre os dois players
8. Verifique se a contagem de tokens continua corretamente

#### Critérios de Validação

**Significado**: Confirmação de que o sistema de pagamento é independente da tecnologia de reprodução de vídeo.

- **Estrutura de logs de pagamento idêntica entre players**: Mesmo formato e conteúdo das mensagens de transação
- **Continuidade do fluxo de dados PayWord independente do player**: Tokens continuam sendo gerados e validados consistentemente
- **Manutenção da funcionalidade de pagamento por segmento**: Cada segmento HLS continua requerendo um token válido
- **Ausência de erros específicos de player no console**: Nenhum erro relacionado à implementação particular do player
- **Continuidade da contagem de tokens**: Sequência numérica dos tokens permanece íntegra ao trocar players

## Reivindicação #3: Análise de Performance e Preservação da Experiência do Usuário

**Objetivo da Reivindicação**: Demonstrar que o sistema MiniMoni opera com overhead mínimo durante o streaming HLS, coletando métricas de performance para validar que o processamento de pagamentos PayWord não impacta negativamente a experiência do usuário.

### Procedimento de Coleta de Dados de Performance

**Propósito**: Medir e analisar o overhead de processamento do sistema MiniMoni, coletando dados tanto do lado cliente (navegador) quanto do servidor para reconstruir as tabelas de performance.

#### Preparação do Ambiente de Teste

**Função**: Estabelecer condições controladas para medição precisa de performance.

1. Acesse a aplicação em `http://localhost:5173`
2. Navegue até a aba "Video"
3. Certifique-se de que a extensão MiniMoni esteja conectada e um canal de pagamento esteja aberto
4. Verifique que o saldo do canal é suficiente para reprodução contínua (recomendado: canal com pelo menos 100 tokens)

#### Coleta de Dados do Cliente (Service Worker Performance)

**Função**: Coletar métricas de performance do lado cliente para reconstruir a Tabela 1 - Service Worker Performance Metrics.

1. **Preparação para coleta**:
   - Abra o console do navegador através de F12
   - Navegue até a aba "Console"
   - **Dica**: Para filtrar apenas os logs de performance, digite `[SW-BENCHMARK]` na barra de filtro do console
   - Prepare uma planilha ou documento para registrar os dados manualmente

2. **Execução da coleta de dados normais**:
   - Inicie a reprodução do vídeo
   - Durante alguns minutos, pule para diferentes pontos do vídeo usando os controles do player
   - Para cada requisição de segmento, registre os seguintes dados dos logs:
     - **Message Response Time**: Procure logs `[SW-BENCHMARK]: Message response time: X.XXms`
     - **HLS Fetch Request Time**: Procure logs `[SW-BENCHMARK]: HLS fetch request time: X.XXms`
     - **Total Processing Time**: Procure logs `[SW-BENCHMARK]: Total request processing time: X.XXms`
   - Registre pelo menos 10 amostras de cada métrica

3. **Teste de Cold Start (overhead elevado)**:
   - Pause o vídeo por 60 segundos
   - Retome a reprodução
   - Registre as primeiras 5 requisições após a pausa (a primeira deve mostrar um valor mais alto)

4. **Cálculo das métricas**:
   - Para cada categoria, calcule: Mínimo, Máximo, Média, Desvio Padrão

#### Coleta de Dados do Servidor (Server-Side Performance)

**Função**: Coletar métricas de performance do lado servidor para reconstruir a Tabela 2 - Server-Side HLS Access Validation Performance.

1. **Preparação para coleta**:
   - No terminal onde executou `docker compose up`, monitore os logs do container `vendor-api`
   - Prepare uma planilha ou documento para registrar os dados manualmente

2. **Execução da coleta de dados**:
   - Durante a reprodução do vídeo com os pulos de segmento, registre os seguintes dados dos logs do servidor:
     - **Data validation**: Tempo de validação dos dados da requisição
     - **Channel query**: Tempo de consulta do canal no banco de dados
     - **Double-spend check**: Tempo de verificação de gasto duplo
     - **Latest payment query**: Tempo de consulta do último pagamento
     - **Hashchain validation**: Tempo de validação do hash
     - **Payment creation & storage**: Tempo de criação e armazenamento do pagamento
   - Registre pelo menos 10 amostras de cada métrica

3. **Cálculo das métricas**:
   - **Total Validation Time**: Soma de todas as operações de validação
   - Para cada categoria, calcule: Mínimo, Máximo, Média, Desvio Padrão

#### Reconstrução das Tabelas de Performance

**Função**: Organizar os dados coletados para reproduzir as tabelas de performance apresentadas na análise.

1. **Tabela 1 - Service Worker Performance Metrics**:
   ```
   +------------------------+----------+----------+----------+----------+
   | Category               | Min (ms) | Max (ms) | Mean (ms)| Std. Dev.|
   +------------------------+----------+----------+----------+----------+
   | Message Response Time  |    X     |    X     |    X     |    X     |
   | HLS Fetch Request Time |    X     |    X     |    X     |    X     |
   +------------------------+----------+----------+----------+----------+
   | Total Processing Time  |    X     |    X     |    X     |    X     |
   +------------------------+----------+----------+----------+----------+
   ```

2. **Tabela 2 - Server-Side HLS Access Validation Performance**:
   ```
   +---------------------------+----------+----------+----------+----------+
   | Category                  | Min (ms) | Max (ms) | Mean (ms)| Std. Dev.|
   +---------------------------+----------+----------+----------+----------+
   | Data validation           |    X     |    X     |    X     |    X     |
   | Channel query             |    X     |    X     |    X     |    X     |
   | Double-spend check        |    X     |    X     |    X     |    X     |
   | Latest payment query      |    X     |    X     |    X     |    X     |
   | Hashchain validation      |    X     |    X     |    X     |    X     |
   | Payment creation & storage|    X     |    X     |    X     |    X     |
   +---------------------------+----------+----------+----------+----------+
   | Total Validation Time     |    X     |    X     |    X     |    X     |
   +---------------------------+----------+----------+----------+----------+
   ```

#### Critérios de Validação

**Significado**: Confirmação de que o sistema MiniMoni opera com overhead aceitável para streaming HLS.

- **Overhead total por segmento**: Deve permanecer consistentemente abaixo de 150ms
- **Transparência na reprodução**: Vídeo não trava, pausa ou congela durante o streaming
- **Absorção pelo buffer**: Para segmentos HLS típicos de 5-10 segundos, o delay deve ser imperceptível
- **Identificação de cold start**: Valores mais altos após pausas prolongadas (60+ segundos)
- **Consistência das métricas**: Dados coletados devem mostrar padrões similares aos valores de referência

## LICENSE

Este projeto está licenciado sob a licença MIT.

```
MIT License

Copyright (c) 2024 Eth-PayWord Project

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
