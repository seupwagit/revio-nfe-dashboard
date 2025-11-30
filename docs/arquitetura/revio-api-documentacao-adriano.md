# Revio NFE API --- Documentação Oficial para Integração (Markdown Único, Otimizado para LLMs e Devs)

> Documentação completa otimizada para uso com LLMs e integração
> TypeScript/Vite.\
> Inclui exemplos reais, uso da rota de manifestação, fetch API, Axios,
> tratamento de erros, diagrama Mermaid e recomendações oficiais.

------------------------------------------------------------------------

# 1. Visão Geral da Plataforma

A Revio NFE API expõe dados fiscais estruturados em coleções MongoDB:

  Documento   Coleção
  ----------- -------------
  NFe         tbl_nfe_100
  CFe/SAT     tbl_cfe_100
  CTe         tbl_cte_100

Principais rotas:

-   `GET /api/WebView/Consultar`\
-   `GET /api/WebView/ContadorConsulta`\
-   `GET /api/WebView/RealizaManifestacao`

------------------------------------------------------------------------

# 2. Endpoint: /api/WebView/Consultar

    GET https://apinfe.revio.digital/api/WebView/Consultar

## Parâmetros aceitos

  Parâmetro    Tipo     Obrigatório
  ------------ -------- -------------
  host         string   ✔
  database     string   ✔
  collection   string   ✔
  cnpjEmit     string   opc
  cnpjDest     string   opc
  dtIni        date     opc
  dtFin        date     opc
  pg           int      opc
  size         int      opc

## Estrutura de resposta

``` json
{
  "status": "sucesso",
  "lista": [ ... ]
}
```

------------------------------------------------------------------------

# 3. Estruturas de Retorno por Coleção

## 3.1 tbl_nfe_100 (NFe)

``` json
{
  "_id": "string",
  "CHV_NFE": "string",
  "CNPJ_EMIT": "string",
  "NOME_EMIT": "string",
  "IE": "string",
  "IND_OPER": "string|number",
  "DT_DOC": "date",
  "VL_DOC": "number",
  "PROTOCOLADA": "Sim|Não",
  "TIPO": "Entrada|Recebida|Saída",
  "ORIGEM": "string",
  "STATUS_MANIFESTACAO": "string"
}
```

## 3.2 tbl_cfe_100 (CFe/SAT)

*(estrutura mantida conforme documentação anterior)*

## 3.3 tbl_cte_100 (CTe)

*(estrutura mantida conforme documentação anterior)*

------------------------------------------------------------------------

# 4. Endpoint: /api/WebView/ContadorConsulta

    GET https://apinfe.revio.digital/api/WebView/ContadorConsulta

### Exemplo real

``` json
{
  "contador": 2495,
  "status": "sucesso"
}
```

------------------------------------------------------------------------

# 5. Endpoint: /api/WebView/RealizaManifestacao

    GET https://apinfe.revio.digital/api/WebView/RealizaManifestacao

## Parâmetros

  Parâmetro   Tipo     Obrigatório
  ----------- -------- -------------
  database    string   ✔
  lstChvs     string   ✔
  type        int      ✔

### Exemplos de resposta:

#### Sucesso

``` json
{ "status": "sucesso" }
```

#### Erro

``` json
{ "status": "erro" }
```

------------------------------------------------------------------------

# 6. Uso em TypeScript --- Recomendação Oficial

## ⚡ **Recomendação: Usar Fetch API**

**Vantagens:** - API nativa, leve e moderna\
- Melhor suporte futuro (WHATWG Standard)\
- Sem dependências extras\
- Trabalha naturalmente com `Response`, Streams e Web APIs\
- Mais performático em bundlers como Vite

------------------------------------------------------------------------

# 7. Exemplo TS: Manifestação do Destinatário (fetch)

``` ts
export async function manifestarNFe(chaves: string[], tipo: number) {
  try {
    const url = new URL("https://apinfe.revio.digital/api/WebView/RealizaManifestacao");

    url.search = new URLSearchParams({
      database: "C67624577000145",
      lstChvs: chaves.join(";"),
      type: String(tipo)
    }).toString();

    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Erro HTTP: ${res.status}`);
    }

    const body = await res.json();

    if (body.status !== "sucesso") {
      throw new Error("Manifestação não concluída");
    }

    return body;
  } catch (err: any) {
    console.error("Erro ao manifestar:", err.message);
    throw err;
  }
}
```

------------------------------------------------------------------------

# 8. Exemplo TS: Manifestação usando Axios (não recomendado, mas incluído)

> **Recomendação oficial: Prefira `fetch`**\
> Axios adiciona: dependência extra, bundle maior e overhead
> desnecessário em Vite.\
> Ainda assim, segue exemplo completo:

``` ts
import axios from "axios";

export async function manifestarComAxios(chaves: string[], tipo: number) {
  try {
    const { data } = await axios.get(
      "https://apinfe.revio.digital/api/WebView/RealizaManifestacao",
      {
        params: {
          database: "C67624577000145",
          lstChvs: chaves.join(";"),
          type: tipo
        }
      }
    );

    if (data.status !== "sucesso") {
      throw new Error("Erro na manifestação");
    }

    return data;
  } catch (err: any) {
    console.error("Erro Axios:", err.message);
    throw err;
  }
}
```

------------------------------------------------------------------------

# 9. Exemplo TS com Tratamento de Erro Tipado

``` ts
interface ManifestacaoResponse {
  status: "sucesso" | "erro";
}

class ManifestacaoError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "ManifestacaoError";
  }
}

export async function manifestarSeguro(chaves: string[]): Promise<ManifestacaoResponse> {
  const url = new URL("https://apinfe.revio.digital/api/WebView/RealizaManifestacao");

  url.search = new URLSearchParams({
    database: "C67624577000145",
    lstChvs: chaves.join(";"),
    type: "1"
  }).toString();

  const res = await fetch(url);
  if (!res.ok) {
    throw new ManifestacaoError(`Falha HTTP: ${res.status}`);
  }

  const json = await res.json();
  if (json.status !== "sucesso") {
    throw new ManifestacaoError("A SEFAZ retornou erro na manifestação");
  }

  return json;
}
```

------------------------------------------------------------------------

# 10. Diagrama Mermaid --- Fluxo de Manifestação

``` mermaid
flowchart TD
    A[Início] --> B[Selecionar chaves NFe]
    B --> C[Chamar API /RealizaManifestacao]
    C --> D{Status}
    D -->|sucesso| E[Atualizar Grid / Interface]
    D -->|erro| F[Exibir alerta ao usuário]
    E --> G[Fim]
    F --> G
```

------------------------------------------------------------------------

# ✔ Documento atualizado com:

-   Uso TS da rota de manifestação\
-   Exemplos de Axios\
-   Recomendação clara de Fetch API\
-   Tratamento de erro tipado\
-   Diagrama Mermaid\
-   Regerado em markdown standalone
