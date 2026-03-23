# CADOC 3040 — SCR Operações de Crédito

**Base normativa:** Resolução CMN 3.658/2008 + Circular BCB 3.567/2011  
**Prazo:** Até o 5º dia útil do mês seguinte à data-base  
**Formato:** XML (encoding UTF-8)  
**Envio:** STA — Sistema de Transferência de Arquivos BCB

---

## Estrutura do XML

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Doc3040 xmlns="..." versao="11">
  <Cabec>
    <CNPJ>12345678</CNPJ>           <!-- 8 dígitos, sem formatação -->
    <DtBase>2026-01-31</DtBase>     <!-- YYYY-MM-DD -->
    <MetodApPE>S</MetodApPE>        <!-- S=interno, N=externo -->
    <TotalCli>1</TotalCli>
  </Cabec>
  <Cli>
    <Cd>12345678901</Cd>            <!-- CPF/CNPJ sem formatação -->
    <Op>
      <IPOC>1234567802112620117C0001</IPOC>  <!-- 24 chars -->
      <Mod>0202</Mod>               <!-- Modalidade COSIF 4 chars -->
      <NatuOp>01</NatuOp>           <!-- Natureza da operação -->
      <ClassOp>A</ClassOp>          <!-- AA, A, B, C, D, E, F, G, H -->
      <VlrContr>50000.00</VlrContr>
      <Venc>
        <Cd>110</Cd>                <!-- Código de vencimento -->
        <Val>50000.00</Val>
      </Venc>
    </Op>
  </Cli>
</Doc3040>
```

---

## IPOC — Identificador de Operação de Crédito

Estrutura do IPOC (24 caracteres):
```
CCCCCCCCMMMMAAAADDDDDNNNN
│        │   │   │    └── Nº sequencial (4 chars, alfanum)
│        │   │   └─────── Identificador de cliente (4 chars)
│        │   └─────────── Ano de contratação (4 dígitos)
│        └─────────────── Mês de contratação (2 dígitos)  
│                         + Modalidade COSIF (4 dígitos)
└──────────────────────── CNPJ da IF (8 chars)
```

---

## Modalidades Principais (COSIF)

| Código | Descrição |
|--------|-----------|
| 0202   | Crédito Pessoal Consignado Privado |
| 0203   | Crédito Pessoal Consignado Público |
| 0204   | Crédito Pessoal Rotativo (cartão) |
| 0212   | Crédito Pessoal Direto |
| 1302   | Capital de Giro |
| 1304   | Cartão de Crédito PJ |
| 2102   | Financiamento de Veículos PF |
| 2202   | Financiamento Imobiliário |

---

## Códigos de Vencimento

| Código | Descrição |
|--------|-----------|
| 110    | A vencer — até 30 dias |
| 120    | A vencer — de 31 a 60 dias |
| 130    | A vencer — de 61 a 90 dias |
| 140    | A vencer — de 91 a 180 dias |
| 150    | A vencer — de 181 a 360 dias |
| 160    | A vencer — de 1 a 2 anos |
| 170    | A vencer — de 2 a 5 anos |
| 180    | A vencer — acima de 5 anos |
| 205    | Vencido — até 14 dias |
| 210    | Vencido — de 15 a 30 dias |
| 220    | Vencido — de 31 a 60 dias |
| 230    | Vencido — de 61 a 90 dias |
| 240    | Vencido — de 91 a 180 dias |
| 250    | Vencido — de 181 a 360 dias |
| 260    | Vencido — acima de 360 dias |
| 310    | Prejuízo / Baixado |

---

## Regras de Validação Críticas

### Regras MV (Batimento COSIF)
| Regra | Descrição |
|-------|-----------|
| MV01  | Saldo total SCR = saldo COSIF 4.0.0.00.00-8 |
| MV02  | Crédito pessoal = COSIF 1.6.1.10.00-4 |
| MV03  | Financiamentos = COSIF 1.6.2.10.00-0 |
| ...   | ... (MV01–MV18) |

### Regras de Risco (R01–R09)
| Regra | ClassOp | COSIF |
|-------|---------|-------|
| R01   | AA | 3.1.1.00.00-0 |
| R02   | A  | 3.1.2.00.00-7 |
| R03   | B  | 3.1.3.00.00-4 |
| ...   | ... | ... |

### Campos Obrigatórios
- `CNPJ`, `DtBase`, `MetodApPE`, `TotalCli` no cabeçalho
- `Cd` (cliente), `IPOC`, `Mod`, `VlrContr` em cada operação
- IPOC: exatamente 24 caracteres alfanuméricos
- `DtBase`: último dia do mês de referência

---

## JSON de Entrada (API)

```json
{
  "cabecalho": {
    "CNPJ": "12345678",
    "DtBase": "2026-01-31",
    "MetodApPE": "S",
    "TotalCli": 1,
    "NomeResp": "Maria Silva",
    "EmailResp": "compliance@banco.com.br"
  },
  "clientes": [
    {
      "Cd": "12345678901",
      "operacoes": [
        {
          "IPOC": "1234567802112620117C0001",
          "Mod": "0202",
          "NatuOp": "01",
          "ClassOp": "A",
          "VlrContr": 50000.00,
          "vencimentos": [
            { "Cd": "110", "Val": 30000.00 },
            { "Cd": "120", "Val": 20000.00 }
          ]
        }
      ]
    }
  ]
}
```
