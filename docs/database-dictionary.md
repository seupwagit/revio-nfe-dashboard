# Dicionário de Dados e Regras de Negócio (Revi-O Dashboard)

Este documento detalha a origem dos dados, o mapeamento entre o banco de dados e o frontend, e as fórmulas utilizadas para os cálculos dos indicadores no Dashboard.

## 1. Origem dos Dados (Database)

Os dados são ingeridos originalmente de um banco **SQL Server** e replicados/transformados para coleções **MongoDB**.

### Coleções Principais
| Coleção | Tipo de Documento | Descrição |
| :--- | :--- | :--- |
| `tbl_nfe_100` | NF-e | Nota Fiscal Eletrônica |
| `tbl_cfe_100` | CF-e | Cupom Fiscal Eletrônico (SAT) |
| `tbl_cte_100` | CT-e | Conhecimento de Transporte Eletrônico |

---

## 2. Mapeamento de Campos (Nesting)

O `DocumentTransformer.ts` no backend é responsável por transformar os campos "flats" do banco em objetos estruturados (aninhados) para o frontend.

### Campos de Raiz
| Campo Banco (Raw) | Propriedade Frontend | Descrição |
| :--- | :--- | :--- |
| `_id` | `id` | Identificador único do documento |
| `NUM_DOC` / `NUMERO` | `numero` | Número do documento fiscal |
| `SER` / `SERIE` | `serie` | Série do documento |
| `COD_MOD` / `MODELO` | `modelo` | Modelo fiscal (ex: 55, 65, 57) |
| `DT_DOC` | `dataEmissao` | Data de emissao (formato ISO) |
| `VL_DOC` / `VALOR_TOTAL` | `valorTotal` | Valor total líquido do documento |
| `STATUS` | `status` | Status (Autorizada, Cancelada, etc) |
| `PROTOCOLADA` | `protocolada` | Sim/Não (Indica se houve protocolo SEFAZ) |
| `NAT_OP` / `NAT_OPER` | `naturezaOperacao` | Natureza da operação (ex: Venda de mercadoria) |
| `IND_OPER` | `tipoOperacao` | 0 = Entrada, 1 = Saída |
| `CHV_NFE` / `CHV_CTE` | `chaveAcesso` | Chave de acesso de 44 dígitos |

### Objetos Aninhados
| Objeto | Campos Banco Origem |
| :--- | :--- |
| `totais` | `VL_BC_ICMS`, `VL_ICMS`, `VL_IPI`, `VL_PIS`, `VL_COFINS`, `VL_FRT`, `VL_SEG`, `VL_DESC` |
| `emitente` | `CNPJ_EMIT`, `RAZAO_EMIT`, `NM_FANTASIA_EMIT`, `UF_EMIT`, `MUNICIPIO_EMIT` |
| `destinatario` | `CNPJ_DEST`, `RAZAO_DEST`, `UF_DEST`, `MUNICIPIO_DEST` |

---

## 3. Cálculos do Dashboard (Backend)

Os indicadores principais são calculados via **Aggregation Pipeline** do MongoDB no arquivo `FiscalDocumentsService.ts`.

| Indicador | Lógica de Cálculo (MongoDB) |
| :--- | :--- |
| **Total Notas** | `$sum: 1` |
| **Valor Total** | `$sum: $VL_DOC` |
| **Total Entradas** | `$sum: { $cond: [{ $eq: ['$IND_OPER', '0'] }, '$VL_DOC', 0] }` |
| **Total Saídas** | `$sum: { $cond: [{ $eq: ['$IND_OPER', '1'] }, '$VL_DOC', 0] }` |
| **Notas Autorizadas**| Count onde `STATUS` in ('autorizada', '100') ou `PROTOCOLADA` == 'Sim' |
| **Notas Canceladas** | Count onde `STATUS` in ('cancelada', '101') |
| **Maior/Menor Nota** | `$max: $VL_DOC` / `$min: $VL_DOC` |
| **Impostos** | Soma bruta de `VL_ICMS`, `VL_IPI`, `VL_PIS`, `VL_COFINS` |

---

## 4. Indicadores Gerenciais (Frontend)

Calculados no `Dashboard.tsx` a partir dos dados agregados vindos do backend.

### Fórmulas de Business Intelligence
- **Saldo Operacional**: `Valor Total Saídas - Valor Total Entradas`
- **Carga Tributária (%)**: `(ICMS + IPI + PIS + COFINS) / Valor Total * 100`
- **Ticket Médio**: `Valor Total / Total de Notas`
- **Taxa de Autorização**: `(Notas Autorizadas / Total Notas) * 100`
- **Taxa de Cancelamento**: `(Notas Canceladas / Total Notas) * 100`
- **Documentos Pendentes**: `Total Notas - (Autorizadas + Canceladas)`

---

## 5. Filtros e Pesquisa
Os filtros de coluna na grid aplicam mapeamentos para garantir que a consulta MongoDB use os índices corretos:
- `id` -> `_id`
- `serie` -> `SER`
- `modelo` -> `COD_MOD`
- `emitente.razaoSocial` -> `NOME_EMIT`
- `destinatario.razaoSocial` -> `NOME_DEST`
