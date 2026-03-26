'use client'
import { useState, useRef, useCallback, useEffect } from 'react'

// ══════════════════════════════════════════════════════════════════
// SCR3040 RULES DATABASE — extraído de SCR3040_Criticas.xls e
// SCR3040_RegrasValidacaoBacen_1.xls (315 regras BCB oficiais)
// ══════════════════════════════════════════════════════════════════
const SCR3040_RULES: Record<string,{cat:string,r:string,d:string}> = {
  'B01':{cat:'Básicas',r:'Erro XML',d:'O arquivo XML deve atender às regras gerais de formatação XML e às regras de formato do XSD disponível dentro do aplicativo validador, considerado para a data-base referida no arquivo. O XSD considerado terá data-base igual ou anterior a data-base re'},
  'B02':{cat:'Básicas',r:'Arquivo .ZIP deve ser gerado pelo aplicativo validador',d:'O documento 3040/3042 enviado ao Banco Central deve ser um arquivo .ZIP gerado pelo aplicativo validador. Qualquer arquivo. ZIP gerado através de outro aplicativo será rejeitado.'},
  'B03':{cat:'Básicas',r:'Instituição remetente deve possuir autorização',d:'Para enviar o documento 3040/3042 que não seja de sua propriedade uma instituição deverá dispor de uma autorização de envio específica para fazê-lo.'},
  'B04':{cat:'Básicas',r:'Documento fora do período de admissão',d:'Somente podem ser enviados ao SCR documentos cujas datas-base estejam dentro do horizonte permitidos (24 datas-base).'},
  'B05':{cat:'Básicas',r:'Documentos não esperado',d:'Para o envio de documentos novos, uma instituição deverá estar cadastrada na lista de documentos esperados do sistema para a data-base a qual deseja proceder o envio. Um documento enviado e não esperado será rejeitado. A declaração de dispensa de env'},
  'B06':{cat:'Básicas',r:'Número de remessa incompatível',d:'O envio de uma nova remessa (ou seja, uma substituição) do documento 3040 deve conter um novo número de remessa no cabeçalho do documento. Caso seja enviada uma remessa e uma parte repetida, o documento será rejeitado. (Para maiores informações sobre'},
  'B07':{cat:'Básicas',r:'Composição da remessa (número de parte e final de remessa)',d:'Uma remessa do documento 3040 deve ser composta de N partes, onde N >= 1. As partes devem ser numeradas de 1 a N sem repetição de número e tendo a parte N, além do seu número, um marcador de final de remessa <Doc3040 TpArq="F">.'},
  'B08':{cat:'Básicas',r:'Remessa com parte rejeitada',d:'Se uma remessa do documento 3040 já tiver ao menos uma parte rejeitada, qualquer outra parte recebida da mesma remessa será rejeitada.'},
  'B09':{cat:'Básicas',r:'Número máximo de erros',d:'O aplicativo validador possui um limite máximo de registros de erros possíveis. Se o número máximo de erros for atingido, a validação será interrompida e o arquivo será rejeitado com os erros registrados até então. Neste caso, os erros adicionais que'},
  'B10':{cat:'Básicas',r:'Número máximo de avisos',d:'O aplicativo validador possui um limite máximo de registros de avisos possíveis. Se o número máximo de avisos for atingido, a validação continuará, mas avisos adicionais não serão registrados no log. Neste caso, os avisos adicionais que possam existi'},
  'B11':{cat:'Básicas',r:'Documento não aceito na data-base anterior',d:'Caso a instituição não possua um documento 3040 aceito na data-base anterior, o envio de um novo documento na data-base atual será rejeitado.'},
  'B12':{cat:'Básicas',r:'Atributo TpFundo no cabeçalho do xml obrigatório apenas para FIDCs a partir da data-base de março/20',d:'Caso a instituição remetente seja um Fundo de Investimento em Direitos Creditórios - FIDC, o atributo "TpFundo" no cabeçalho do Cadoc 3040 deverá ser preenchido pelos códigos: 36 - FIDC, 46 - FIDC-NP ou 41 - FIDC PIPS.   Importante!! Demais instituiç'},
  'B13':{cat:'Básicas',r:'IF não é FIDC',d:'Instituição deve ser FIDC e TpFundo deve assumir valores: 36, 46 ou 41.'},
  'B14':{cat:'Básicas',r:'Excedida a quantidade de operações divergentes no 3042',d:'A quantidade de operações informada excedeu o limite máximo.'},
  'B15':{cat:'Básicas',r:'Excedida a quantidade de operações divergentes no 3040',d:'A quantidade de operações informada excedeu o limite máximo.'},
  'B16':{cat:'Básicas',r:'Inclusão de cliente sem operação no documento 3042',d:'Inclusão de cliente sem operação no documento 3042.'},
  'B17':{cat:'Básicas',r:'Arquivo vazio',d:'Arquivo deve conter clientes <Cli> ou operações <Agreg>.'},
  'B20':{cat:'Básicas',r:'Correção via web em andamento',d:'Não é possível remeter arquivo de substituição parcial - 3042 enquanto houver protocolo de correção via web em andamento.'},
  'B21':{cat:'Básicas',r:'Envios concorrentes do documento 3042',d:'Um primeiro 3042 foi enviado (e aguardando processamento) e posteriormente o segundo 3042 foi enviado para mesma IF e data-base. Neste caso, o primeiro 3042 é desconsiderado. Ou o primeiro 3042 foi enviado e estava em processamento, então o segundo 3'},
  'C01':{cat:'Campos Obrigatórios',r:'Campos obrigatórios somente para pessoa jurídica',d:'Tipo de controle Se Tp="2" - pessoa jurídica com CNPJ - é obrigatório Detalhamento do Cliente'},
  'C02':{cat:'Campos Obrigatórios',r:'Campos não obrigatórios',d:'Conglomerado econômico Característica especial'},
  'C03':{cat:'Campos Obrigatórios',r:'Garantias não fidejussórias',d:'O campo Valor original da garantia é obrigatório, para garantias não fidejussórias (garantias <> 09), os campos Identificação do garantidor e Percentual garantido é proibido para garantias não fidejussórias'},
  'C04':{cat:'Campos Obrigatórios',r:'Garantias fidejussórias',d:'Os campos Identificação do garantidor e Percentual garantido são obrigatórios, para garantias fidejussórias (garantias == 09), dispensada a obrigatoriedade do campo Identificação do garantidor quando a garantia fidejussória for 0903 (PF no exterior) '},
  'C05':{cat:'Campos Obrigatórios',r:'Cessões com coobrigação entre instituições financeiras (informação de cessionário).',d:'Para Inf==0101 (informação de cessionário), campos obrigatórios: data de cessão (Cd), percentual (Perc) e valor negociado (Valor).'},
  'C06':{cat:'Campos Obrigatórios',r:'Cessões com coobrigação entre instituições financeiras (informação de cedente)',d:'Para Inf==0102, 0103 ou 0104 (informação de cedente), campos obrigatórios: data de cessão (Cd), cessionário (Ident), percentual de coobrigação (Perc) e valor negociado (Valor).'},
  'C07':{cat:'Campos Obrigatórios',r:'Porte do cliente PJ',d:'Deve assumir valores do Anexo 24 para PJ'},
  'C08':{cat:'Campos Obrigatórios',r:'Porte do cliente PF',d:'Deve assumir valores do Anexo 25 para PF para operações concedidas a partir da data-base de julho/2011'},
  'C09':{cat:'Campos Obrigatórios',r:'Campos proibidos para pessoa física',d:'Tipo de controle Detalhamento do cliente Porte do Cliente, até habilitação da regra C08'},
  'C10':{cat:'Campos Obrigatórios',r:'Campos de reavaliação de garantia',d:'Se houver reavaliação de garantia, deverão ser informados ambos os campos de reavaliação, Data e Valor de reavaliação, ou seja, caso haja o atributo DtReav na tag <Gar>, o atributo VlrData é obrigatório.'},
  'C11':{cat:'Campos Obrigatórios',r:'Data de vencimento',d:'A data de vencimento da operação é obrigatória para todas as operações, exceto para aquelas que possuem vencimentos v199.'},
  'C13':{cat:'Campos Obrigatórios',r:'Saídas (operações cedidas sem coobrigação)',d:'Para Inf==0303 ou 0304, campos obrigatórios: data da cessão (Cd), cessionário (Ident) e valor negociado (Valor)'},
  'C14':{cat:'Campos Obrigatórios',r:'Saídas (operações renegociadas)',d:'Para Inf==0305, campos obrigatórios: novo contrato (Cd), modalidade e submodalidade (Ident) e valor renegociado (Valor)'},
  'C16':{cat:'Campos Obrigatórios',r:'Saídas (alteração de código de contrato)',d:'Para Inf==0307, campos obrigatórios: novo contrato (Cd), modalidade e submodalidade (Ident)'},
  'C17':{cat:'Campos Obrigatórios',r:'Títulos representativos de operações de crédito',d:'Para Inf=04XX, campos obrigatórios: código do instrumento (Cd)'},
  'C18':{cat:'Campos Obrigatórios',r:'Certificados agregadores de títulos representativos de operações de crédito',d:'Para Inf=05XX, campo obrigatório: código do instrumento (Cd)'},
  'C19':{cat:'Campos Obrigatórios',r:'Cessões com coobrigação para instituições não financeiras (informação de cessionário)',d:'Para Inf==0701 (informação de cessionário), campos obrigatórios: data da cessão (Cd), percentual de coobrigação (Perc) e valor negociado (Valor).'},
  'C20':{cat:'Campos Obrigatórios',r:'Cessões com coobrigação para instituições não financeiras (informação de cedente)',d:'Para Inf==0702, 0703  ou 0704 (informação de cedente), campos obrigatórios: data da cessão (Cd), cessionário (Ident), percentual de coobrigação (Perc) e valor negociado (Valor).'},
  'C21':{cat:'Campos Obrigatórios',r:'Cessões com coobrigação para instituições não financeiras (tipo de transferência)',d:'Para Inf=0705, 0706 ou 0707, campos obrigatórios: data da transferência (Cd), cessionário (Ident), percentual de risco (Perc) e valor negociado (Valor). O percentual de risco só é obrigatório para operações de natureza 15.'},
  'C23':{cat:'Campos Obrigatórios',r:'Cessões de operações sem coobrigação (informação de cessionário)',d:'Para Inf=1001 ou 1002 (informação de cessionário), campos obrigatórios: data de aquisição (Cd), valor negociado (Valor) e cedente (Ident).'},
  'C24':{cat:'Campos Obrigatórios',r:'Cessões de operações sem coobrigação (informação de cedente)',d:'Para Inf=1003 (informação de cedente), campos obrigatórios: data de transferência (Cd), cessionária (Ident) e valor negociado (Valor).'},
  'C25':{cat:'Campos Obrigatórios',r:'Derivativos',d:'Para Inf=11XX, campos obrigatórios: código do instrumento (Cd), contraparte (Ident).'},
  'C26':{cat:'Campos Obrigatórios',r:'Saídas (recompra de operação)',d:'Para Inf==0309, campos obrigatórios: valor de recompra (Valor).'},
  'C27':{cat:'Campos Obrigatórios',r:'Saídas (portabilidade)',d:'Para Inf==0311, campo obrigatório: instituição para a qual operação foi portada (Ident)'},
  'C28':{cat:'Campos Obrigatórios',r:'Valor contratado - obrigatoriedade',d:'Valor contratado é obrigatório para todas as modalidades não rotativas (todas exceto 0101, 0210, 0213, 0214, 0217, 0406, 1304, 19XX) que possuam vencimentos maiores que 80.'},
  'C29':{cat:'Campos Obrigatórios',r:'Saídas (incorporação)',d:'Para Inf==0312, campo obrigatório: instituição incorporadora (Ident), novo contrato (Cd), modalidade e submodalidade (Qtd)'},
  'C31':{cat:'Campos Obrigatórios',r:'Faturamento Anual - Compatibilidade de data e obrigatoriedade',d:'O campo Faturamento Anual é obrigatório para operações concedidas a partir da data-base julho/2011 e para operações concedidas para pessoa jurídica'},
  'C32':{cat:'Campos Obrigatórios',r:'Percentual do Indexador - Compatibilidade de data',d:'O campo Percentual do Indexador é obrigatório para operações concedidas a partir da data-base setembro/2011'},
  'C33':{cat:'Campos Obrigatórios',r:'Aplicabilidade de Dias de Atraso',d:'O campo Dias de Atraso é obrigatório apenas para operações vencidas (código de vencimento 205 a 330, inclusive)'},
  'C34':{cat:'Campos Obrigatórios',r:'Registro adicional de coobrigação - Informações adicionais obrigatórias',d:'Para Inf==1201, campo obrigatório: valor da coobrigação (Valor) e do percentual de coobrigação (Perc).'},
  'C35':{cat:'Campos Obrigatórios',r:'Informações adicionais referentes ao registro adicional de coobrigação',d:'As operações de modalidade 1511, 1512, 2001 ou 2002 devem possuir informação adicional Tp="1201". Nenhuma outra modalidade poderá possuir informação adicional Tp="1201". (vide observações no HistóricoAtualizações)'},
  'C36':{cat:'Campos Obrigatórios',r:'Informação de identificação do cedente em cessões de crédito pelo cessionário',d:'Para Inf==0101 e 0701 o atributo Ident (CNPJ Cedente) somente é obrigatório a partir da data-base de março/2012'},
  'C37':{cat:'Campos Obrigatórios',r:'Operações originais em cessão de crédito - cedente - Informações adicionais obrigatórias',d:'Para Inf==1202, campo obrigatório: código do contrato de cessão (Cd)'},
  'C38':{cat:'Campos Obrigatórios',r:'Coobrigação Assumida – Cedente - Obrigatoriedade da Informação Adicional',d:'Para cada pacote de registro adicional com modalidade 1512 (cessão com coobrigação para não SFN, controlada ou não, ou para fundo) deve se registrado informação adicional 1203.'},
  'C39':{cat:'Campos Obrigatórios',r:'Coobrigação Assumida – Cedente – Identificação CNPJ',d:'Para Inf==1203, campo obrigatório: cedente da operação (Ident)'},
  'C40':{cat:'Campos Obrigatórios',r:'Operações originais em cessão de crédito - cedente - Informações adicionais obrigatórias',d:'Para Inf==1201, campo obrigatório: data (Cd) e modalidade e submodalidade (Ident)'},
  'C41':{cat:'Campos Obrigatórios',r:'Obrigatoriedade de adoção da Resolução nº 3.533',d:'Operações de naturezas 04, 05, 11, 13, 14 ou 15 ou de modalidade 1511, 1512,1513, 2001 ou 2002 e natureza 01 cuja data de cessão (<Inf Cd="">) sejam maiores do que 01/01/2012 devem possuir característica especial 35'},
  'C42':{cat:'Campos Obrigatórios',r:'Aplicabilidade da Resolução nº 3.533',d:'Se uma operação for marcada com a característica especial 35, então deverá satisfazer cumulativamente às 2 condições: 1) ter natureza 04, 05, 11, 13, 14 ou 15 ou modalidade 1511, 1512, 1513, 2001 ou 2002 e natureza 01; 2) ter pelo menos uma informaçã'},
  'C43':{cat:'Campos Obrigatórios',r:'Validação de modalidade/submodalidade em Informações Adicionais',d:'O atributo "Ident" é campo obrigatório da Informações Adicional "1201" e deve assumir um dos valores possíveis segundo o anexo 3 do Leiaute do doc.3040.'},
  'C44':{cat:'Campos Obrigatórios',r:'Verificação de formatação de data em Informações Adicionais',d:'O atributo "Ident" das Informações Adicionais 0402, 0405, 0407, 0408, 0409, 0410 e 0411 deve ser informado no formato AAAA-MM-DD, onde AAAA equivale aos 4 dígitos do ano, MM aos 2 dígitos correspondentes ao mês e DD aos 2 dígitos correspondentes ao d'},
  'C45':{cat:'Campos Obrigatórios',r:'Campo Renda Mensal - Compatibilidade de data e obrigatoriedade (Pessoa Física)',d:'O campo Renda Mesal informado por meio do atributo \'FatAnual\' na tag \'Cli\' quando se tratar de Pessoa Física é obrigatório para operações concedidas a partir da data-base julho/2011 para \'Tp\' igual a \'1\', \'3\' ou \'5\' na tag \'Cli\'.'},
  'C46':{cat:'Campos Obrigatórios',r:'Obrigatoriedade dos atributos \'Ident\'  ou \'Cd\' na Inf Adicional \'15xx\'.',d:'O preenchimento dos atributos \'Ident\' é obrigatório para \'Tp\' igual a \'15XX\', exceto quando se tratar de operação já desconsignada, quando deverá ser preenchido o atributo \'Cd\' com valor "1".'},
  'C47':{cat:'Campos Obrigatórios',r:'Obrigatoriedade do atributo TotalCli',d:'O preenchimento do atributo \'TotalCli\' no cabeçalho do documento é obrigatório'},
  'C48':{cat:'Campos Obrigatórios',r:'Obrigatoriedade do Código de Portabilidade atributo \'Cd\' na Informação Adicional de Saída por Portab',d:'O preenchimento do atributo \'Cd\' para a Inf Tp="0311" (Clientes PF) é obrigatório para Operações a partir de maio/2014.'},
  'C49':{cat:'Campos Obrigatórios',r:'Títulos representativos de operações de crédito',d:'Para Inf=04XX, campos obrigatórios: código do instrumento (Cd). Nota: A informação adicional 0401 deverá conter em <Cd> o chassi do veículo ou em <Ident> o valor “1” nos casos de operação sem chassi.'},
  'C50':{cat:'Campos Obrigatórios',r:'Correspondentes Bancários',d:'Para Informação de Correspondentes Bancários, campo obrigatório: \'Ident\'. O atributo \'Ident\' deverá ser preenchido com CNPJ válido (14 dígitos).'},
  'C51':{cat:'Campos Obrigatórios',r:'Saídas (assunção de dívida)',d:'Para Inf=0313, campos obrigatórios: \'Cd\' e \'Ident\'. O tipo de pessoa (Cd) deve ser 1, 2, 3, 4, 5, ou 6, ou seja, se <Inf="0313">, então (<Cd="1">, ou <Cd="2">, ou <Cd="3">, ou <Cd="4">, ou <Cd="5">, ou <Cd="6"> ). O atributo \'Ident\' deverá conter o C'},
  'C52':{cat:'Campos Obrigatórios',r:'Títulos representativos de operações de crédito',d:'Para Informações Adicionais 0401, 0402, 0403, 0405, 0407, 0408, 0409, 0410 e 0411, campo obrigatório: código do instrumento (Cd). Nota: A informação adicional 0401 deverá conter em <Cd> o chassi do veículo ou em <Ident> os valores "1" ou "2" nos caso'},
  'C53':{cat:'Campos Obrigatórios',r:'Campos obrigatórios somente para pessoa jurídica no exterior',d:'Para clientes pessoa jurídica no exterior - <Cli> <Tp=”4”>, é obrigatório o preenchimentos dos campos “NomeCli”, “TpIdentExt”, “CodExt” e “IdPais”.'},
  'C54':{cat:'Campos Obrigatórios',r:'Obrigatoriedade do atributo \'Cd\' na Inf Adicional \'18xx\'',d:'O preenchimento do atributo \'Cd\' é obrigatório para \'Tp\' igual a \'18XX\'.'},
  'C55':{cat:'Campos Obrigatórios',r:'Obrigatoriedade do atributo \'Cd\' na Inf Adicional \'1999\'',d:'O preenchimento do atributo \'Cd\' é obrigatório para \'Tp\' igual a \'1999\'.'},
  'C56':{cat:'Campos Obrigatórios',r:'Obrigatoriedade de informação de credores',d:'Para <Inf Tp="2101">, são obrigatórios os campos \'Cd\', \'Ident\' e \'Perc\'.'},
  'C57':{cat:'Campos Obrigatórios',r:'Característica especial de operação vinculada',d:'Para as modalidades 1501, 1502, 1503, 1504 e 1599, não poderá ser informada a característica especial 10, ou seja, se <Mod="1501">, <Mod="1502">, <Mod="1503">, <Mod="1504">, ou <Mod="1599">, então <CaracEsp≠"10">.'},
  'C58':{cat:'Campos Obrigatórios',r:'Fundos Administrados',d:'Para natureza de operação 34, é obrigatória a informação adicional 2202. Ou seja, para <NatuOp = "34">, então <InfTp = "2202">.'},
  'C59':{cat:'Campos Obrigatórios',r:'Entidades Assemelhadas - Conglomerado Prudencial',d:'Para natureza de operação 33, é obrigatória a informação adicional 2201. Ou seja, para <NatuOp = "33">, então <InfTp = "2201">.'},
  'C60':{cat:'Campos Obrigatórios',r:'Tag Sicor',d:'Os campos "Saldo médio diário total" e "Saldo médio diário vincendo total" da tag Sicor são obrigatórios, exceto para operações que apresentem vértices de vencimento em prejuízo <v3XX>. Ou seja, se <Sicor> e <v3XX>, então <VlrSaldoTot> e <VlrSaldoVin'},
  'C61':{cat:'Campos Obrigatórios',r:'Obrigatoriedade do atributo \'Ident\' nas informações adicionais \'2201\' e \'2202\'.',d:'O preenchimento do atributo \'Ident\' na informação adicional é obrigatório para <Inf Tp="2201"> ou <Inf Tp="2202">.'},
  'C62':{cat:'Campos Obrigatórios',r:'Obrigatoriedade do atributo \'Ident\' na informação adicional \'1408\'',d:'O preenchimento do atributo \'Ident\' na informação adicional é obrigatório para <Inf Tp="1408"> e deve assumir um dos valores possíveis segundo o anexo 37 do leiaute do Documento 3040, no formato de dois dígitos.'},
  'C63':{cat:'Campos Obrigatórios',r:'Sistema de Amortização',d:'As operações de modalidade 0901, 0902, 0903 ou 0990 devem possuir informação adicional do Sistema de Amortização (Tp="2301", Tp="2302", Tp="2303" ou Tp="2399"). Nenhuma outra modalidade poderá possuir informação adicional Tp="23XX".'},
  'C64':{cat:'Campos Obrigatórios',r:'Contabilização de Instrumentos Financeiros',d:'As operações de modalidade 1803 ("Debêntures") devem possuir a tag <ContInstFin>. Nenhuma outra modalidade poderá possuir a tag <ContInstFin>.'},
  'C65':{cat:'Campos Obrigatórios',r:'Contabilização de Instrumentos Financeiros - Valor de Mercado',d:'O atributo \'VlrMercado\' da tag <ContInstFin> é obrigatório para as categorias contábeis 02-Mantido para negociação, e 03-Disponível para venda.'},
  'C66':{cat:'Campos Obrigatórios',r:'Ativo registrado como lastro ou componente de cesta de Instrumento de Cessão Fiduciária',d:'Os atributos \'Cd\' (Tipo de Instrumento) e \'Ident\' (Número do Instrumento de Cessão Fiduciária) são obrigatórios para Informação Adicional 06XX, e \'Cd\' deve assumir um dos valores segundo o anexo 36 do leiaute do Documento 3040.'},
  'C67':{cat:'Campos Obrigatórios',r:'Tag Sicor - Financiamentos rurais',d:'Sempre que a modalidade da operação for 08XX ("Financiamentos rurais") e a data de contratação for a partir de 2013 e a operação não possuir a Característica Especial 38, a tag <Sicor> deverá ser informada. Nenhuma outra modalidade poderá possuir a t'},
  'C68':{cat:'Campos Obrigatórios',r:'Informação Complementar para Apuração do RWA',d:'O atributo \'Cd\' é obrigatório para Informação Adicional 2405 e 2406, e \'Cd\' deve assumir um dos valores do Anexo 45 ou 46, respectivamente, do leiaute do Documento 3040.'},
  'C69':{cat:'Campos Obrigatórios',r:'Preenchimento obrigatório para o campo Metodologia de Apuração da Provisão para Perdas Esperadas e M',d:'Se TpFundo = Vazio (não Fundo), então preenchimento obrigatório do campo MetodApPE em "C" ou "S" e campo MetodDifTJE em "S" ou "N"'},
  'C70':{cat:'Campos Obrigatórios',r:'Preenchimento obrigatório para o campo Classificação do Ativo Financeiro (ClasAtFin)',d:'Se TpFundo = Vazio (não Fundo), então preenchimento obrigatório do campo ClasAtFin da tag <ContInstFinRes4966> para as operações nas modalidades 1 a 11, 13, 14 e 18 e Naturezas 1,2,3,11,13,14,15 e 32. Exceção: operações com Informação Adicional de sa'},
  'C71':{cat:'Campos Obrigatórios',r:'Preenchimento obrigatório para o campo Estágio do Instrumento Financeiro (EstInstFin)',d:'Se Metodologia de Apuração da Perda Esperada = Completa (MetodApPE = "C"), então preenchimento obrigatório do campo EstInstFin da tag <ContInstFinRes4966> para as Naturezas 1,2,3,11,13,14,15 e 32 e seguintes modalidades:  1 a 14; 15 com exceção das s'},
  'C72':{cat:'Campos Obrigatórios',r:'Preenchimento proibido para o campo Estágio do Instrumento Financeiro (EstInstFin)',d:'Se Metodologia de Apuração da Perda Esperada for Simplificada (MetodApPE = "S"), então preenchimento do campo EstInstFin da tag <ContInstFinRes4966> é proibido.'},
  'C73':{cat:'Campos Obrigatórios',r:'Preenchimento obrigatório para o campo Taxa de juros efetiva (TJE)',d:'Se metodologia TJE pura (MetodDifTJE = "N") e Classificação do Ativo Financeiro do tipo CA ou VJORA  (ClasAtFin = 1 ou 2), então preenchimento obrigatório do campo TJE da tag <ContInstFinRes4966> para as modalidades de 1 a 11, 13, 14 e 18 para operaç'},
  'C74':{cat:'Campos Obrigatórios',r:'Preenchimento obrigatório para o campo Carteira Provisão Mínima (CartProvMin)',d:'Se TpFundo = Vazio (não Fundo), então preenchimento obrigatório "C1", "C2", "C3", "C4" ou "C5" do campo CartProvMin da tag <ContInstFinRes4966> para as modalidades de 1 a 14 e 18 e operações de naturezas 1,2,3,11,13,14,15 e 32.  Exceção: operações co'},
  'C75':{cat:'Campos Obrigatórios',r:'Preenchimento obrigatório para o campo Quantidade de Instrumento (QtdInst)',d:'Se TpFundo = Vazio (não Fundo), então preenchimento obrigatório do campo QtdInst da tag <ContInstFinRes4966> para a modalidade 18xx.  Exceção: operações com Informação Adicional de saída 03xx.'},
  'C76':{cat:'Campos Obrigatórios',r:'Preenchimento proibido para o campo Quantidade de Instrumento (QtdInst)',d:'Se modalidade diferente de 18xx, o preenchimento do campo QtdInst da tag <ContInstFinRes4966> é proibido.'},
  'C77':{cat:'Campos Obrigatórios',r:'Preenchimento obrigatório para o campo Valor Justo (VlrJusto)',d:'Se Classificação do Ativo Financeiro = Valor Justo em Outros Resultados Abrangentes - VJORA ou Valor Justo no Resultado - VJR (ClasAtFin = 2 ou 3), então preenchimento obrigatório do campo VlrJusto da tag <ContInstFinRes4966> para operações das modal'},
  'C78':{cat:'Campos Obrigatórios',r:'Classificação contábil VJORA permitida apenas nas modalidades 14 e 18 sem característica de concessã',d:'A Classificação do Ativo Financeiro do tipo VJORA (ClasAtFin  = 2) só é permitida nas modalidades 14 e 18 (desde que não tenha característica especial 39 - com caracteristica de concessão de crédito)'},
  'C79':{cat:'Campos Obrigatórios',r:'Preenchimento obrigatório para o campo Valor Contábil Bruto (VlrContBr)',d:'Se TpFundo = Vazio (não Fundo), então preenchimento obrigatório do campo VlrContBr da tag <ContInstFinRes4966> para as operações nas modalidades 1 a 11, 13, 14 e 18 e naturezas de 1,2,3,11,13,14,15 e 32.   Exceção: operações com Informação Adicional '},
  'F01':{cat:'Formato',r:'Taxa efetiva anual',d:'Forma de taxa percentual anual, em uma base centesimal, com a utilização de duas a sete casas decimais depois da vírgula e arredondada mediante a aplicação da regra estabelecida pela Associação Brasileira de Normas Técnicas (ABNT).'},
  'F02':{cat:'Formato',r:'Datas',d:'As datas deverão obedecer o formato AAAA-MM-DD, onde AAAA equivale aos 4 dígitos do ano, MM aos 2 dígitos correspondentes ao mês e DD aos 2 dígitos correspondentes ao dia.'},
  'F03':{cat:'Formato',r:'Código do contrato',d:'O código do contrato não pode ser preenchido apenas com espaços em branco.'},
  'F04':{cat:'Formato',r:'Conglomerado econômico',d:'O código alfanumérico do conglomerado não pode ser igual a "0" (zero).'},
  'F05':{cat:'Formato',r:'Formato do campo RefBacen na tag Sicor',d:'Para operações de crédito contratadas a partir de janeiro de 2013, os quatro primeiros dígitos do atributo \'RefBacen\', na tag <Sicor>, devem corresponder a um ano a partir de 2013.'},
  'S01':{cat:'Semântica',r:'Detalhamento do cliente',d:'O campo de “Detalhamento de Cliente” (DetCli) deverá possuir os 8 primeiros números iguais à “Identificação do Cliente” (atributo Cd em <Cli>).'},
  'S02':{cat:'Semântica',r:'Vendor - Necessidade de informação adicional',d:'Se modalidade de operação == 0404 ou 0207 então Tipo de informação adicional == 0201 (e suas implicações de campos de Informação Adicional)  Habilitado para data-base fevereiro de 2011.'},
  'S03':{cat:'Semântica',r:'Ocultação de operação em prejuízo há mais de 48 meses',d:'Se houver código de vencimento 330, deve haver característica especial 11  Habilitado para data-base fevereiro de 2011.'},
  'S04':{cat:'Semântica',r:'Crédito a liberar - não aplicabilidade',d:'Não poderão ter preenchidos os vencimentos de crédito a liberar (vencimentos 60 e 80) as modalidades “crédito rotativo vinculado a cartão de crédito” (0204), “cartão de crédito - compra parcelada” (0210), “cartão de crédito - compra à vista” (1304), '},
  'S05':{cat:'Semântica',r:'Limite de crédito - vencimentos possíveis',d:'A modalidade “Limite de Crédito” (19) só pode ter vencimentos de limite (20 e 40). Nenhum outro vencimento pode ser aceito quando esta modalidade for informada.'},
  'S06':{cat:'Semântica',r:'Vencimentos 20 e 40 - modalidade possível',d:'Os vencimentos 20 e 40 só podem ser preenchidos com a modalidade “Limite de Crédito” (19).'},
  'S08':{cat:'Semântica',r:'Natureza 11 - informação adicional necessária',d:'Exceto nos casos de informação adicional de saída, se a natureza for 11, deve haver pelo menos uma Informação Adicional sobre “cessão com coobrigação entre instituições financeiras – informação de cedente” (InfoAdicional == 0102 ou 0103 ou 0104)'},
  'S09':{cat:'Semântica',r:'Natureza 04 - informação adicional necessária',d:'Exceto nos casos de informação adicional de saída, se a natureza for 04, deve haver uma (e apenas uma) Informação Adicional sobre “cessão com coobrigação entre instituições financeiras – informação de cessionário” (InfoAdicional == 0101 ou 0105).'},
  'S10':{cat:'Semântica',r:'Verificação de CNPJ e CPF',d:'Verificação de CNPJ 14 para Tp=“2” e CPF 11 para Tp=“1”'},
  'S12':{cat:'Semântica',r:'Compatibilidade entre data de vencimento e valor dos vencimentos distribuídos no fluxo',d:'A data de vencimento da operação “DtVencOp” deve ser compatível com o máximo fluxo de vencimento informado nas parcelar a vencer, ou seja, a data de vencimento tem que ser menor ou igual ao maior código onde houver informação (códigos v110 a v190). S'},
  'S13':{cat:'Semântica',r:'Garantidor fidejussório não pode ser cliente principal',d:'Dentro de uma operação, um garantidor fidejussório não pode ser o próprio cliente. Para pessoas físicas, <Cli Cd=""> deve ser diferente de <Gar Ident="">. Para pessoas jurídicas, <Op DetCli=""> deve ser diferente de <Gar Ident=""> - para pessoa juríd'},
  'S14':{cat:'Semântica',r:'Compatibilidade entre data de vencimento e data de contratação de uma operação',d:'A data de vencimento da operação “DtVencOp”, quando houver, deve ser maior ou igual à data de contratação da operação “DtContr”. Regra não aplicada nas operações com informação adicional de saída e nas operações adquiridas de naturezas 02 a 05 com cr'},
  'S15':{cat:'Semântica',r:'Compatibilidade de data de contratação',d:'Data de contratação da operação (DtContr) tem de ser menor ou igual do que data atual (hoje()).'},
  'S17':{cat:'Semântica',r:'Compatibilidade de tipo de cliente e identificação do cliente',d:'Se TpCli=1, Cd deve ter 11 dígitos. Se TpCli=2, Cd deve ter 8 dígitos.'},
  'S19':{cat:'Semântica',r:'Data-base anterior à menor data-base admissível',d:'A data-base do documento deve ser igual ou posterior à data-base 09/2010.'},
  'S20':{cat:'Semântica',r:'Distribuição de vencimentos de créditos baixados como prejuízo com Classificação de risco incompatív',d:'Exceto para operações de natureza 34, quando vencimentos = 310, 320 e 330, ClassOp deve ser HH.'},
  'S21':{cat:'Semântica',r:'Coobrigação com distribuição de vencimentos incompatíveis',d:'As operações com modalidade de operação 15 (Mod=15XX) não podem ter códigos de vencimento igual a 310, 320 e 330'},
  'S22':{cat:'Semântica',r:'Coobrigação com tipo de pessoa incompatível',d:'Operações com a modalidade 1511 não podem ser ter pessoa física como devedor.'},
  'S23':{cat:'Semântica',r:'Incompatibilidade de tipo de pessoa em aquisição de operações',d:'Operações de natureza 04 não podem ter pessoa física como devedor'},
  'S25':{cat:'Semântica',r:'Não pode haver autocessão',d:'Uma instituição não pode fazer cessões de crédito para ela mesma, ou seja, o CNPJ do cabeçalho não pode ser igual a nenhum código de informações adicionais do tipo 0102 ou 0103 ou 0104 (<Doc3040 CNPJ=""> deve ser diferente de <Inf Ident=""> quando <I'},
  'S26':{cat:'Semântica',r:'Natureza 02 - informação adicional necessária',d:'Exceto nos casos de informação adicional de saída, se a natureza for 02, deve haver pelo menos uma Informação Adicional sobre “Aquisição de operações sem retenção de risco - de pessoa integrante do SFN” (InfoAdicional == 1001).'},
  'S27':{cat:'Semântica',r:'Natureza 03 - informação adicional necessária',d:'Exceto nos casos de informação adicional de saída, se a natureza for 03, deve haver pelo menos uma Informação Adicional sobre “Aquisição de operações sem retenção de risco - de pessoa não integrante do SFN” (InfoAdicional == 1002).'},
  'S28':{cat:'Semântica',r:'Dias de atraso da parcela mais atrasada de operações vencidas deve ser compatível com vencimentos',d:'Se 0 < DiaAtraso <= 14, não pode haver vencimentos de v210 a 290 Se 15 =< DiaAtraso <= 30, não pode haver vencimentos de v220 a 290  Se 31 =< DiaAtraso <= 60, não pode haver vencimentos de v230 a 290  Se 61 =< DiaAtraso <= 90, não pode haver vencimen'},
  'S29':{cat:'Semântica',r:'Dias de atraso da parcela mais atrasada de operações em prejuízo deve ser compatível com vencimentos',d:'Se houver vencimento 310, DiaAtraso deve ser maior do que 180 Se houver vencimento 320, DiaAtraso deve ser maior do que 540 Se houver vencimento 330, DiaAtraso deve ser maior do que 1620'},
  'S30':{cat:'Semântica',r:'Natureza 05 - informação adicional necessária',d:'Exceto nos casos de informação adicional de saída, se a natureza for 05, deve haver uma (e apenas uma) Informação Adicional sobre “Negociação de operações com pessoa não integrante do SFN com retenção de risco - Informação de cessionário” ou "Cessão '},
  'S31':{cat:'Semântica',r:'Natureza 12 e 16 - informação adicional necessária',d:'Exceto nos casos de informação adicional de saída, se a natureza for 12 ou 16, deve haver pelo menos uma Informação Adicional sobre “Negociação de operações sem retenção de risco - Transferido a pessoa não integrante do SFN” (InfoAdicional == 1003).'},
  'S32':{cat:'Semântica',r:'Natureza 13, 14 e 15 - informação adicional necessária',d:'Exceto nos casos de informação adicional de saída, se a natureza for 13 ou 14 ou 15, deve haver pelo menos uma Informação Adicional sobre “Negociação de operações com pessoa não integrante do SFN com retenção de risco - transferidor de operação" (Inf'},
  'S33':{cat:'Semântica',r:'Compatibilidade entre informações adicionais e naturezas',d:'Informações adicionais de negociação de operações exigem a correta natureza de operação: Se InfoAdicional = 0101 ou 0105, natureza de operação deve ser 04 ou 11 a 16 Se InfoAdicional = 0102 ou 0103 ou 0104, natureza de operação deve ser 11 Se InfoAdi'},
  'S34':{cat:'Semântica',r:'Compatibilidade de código de contrato de cessão',d:'Numa operação cedida:   1) o código do contrato de cessão, instruído na informação adicional <Inf Tp="1202">, deve referenciar a operação de cessão no documento 3040. Assim, o atributo "Cd" da informação adicional <Inf Tp="1202"> da operação cedida d'},
  'S35':{cat:'Semântica',r:'Compatibilidade de modalidade em contrato de cessão',d:'Consolidação da regra na Regra S34. A modalidade informada na operação cedida deve ser igual a informada na informação adicional <Inf Tp="1201"> do respectivo contrato de cessão. Ou seja, o atributo "Mod" da” tag” <Op> da operação cedida que possui i'},
  'S36':{cat:'Semântica',r:'Compatibilidade de valores informados em contrato de cessão',d:'O valor original das operações, informado na informação adicional <Inf Tp="1201"> do contrato de cessão, deve ser maior ou igual à somatória dos vencimentos das respectivas operações cedidas. Ou seja, o atributo "Valor" da informação adicional <Inf T'},
  'S37':{cat:'Semântica',r:'Compatibilidade de nível de risco informado em contrato de cessão',d:'Eliminação da regra. A classificação de risco no contrato de cessão deve ser equivalente à classificação de risco ponderada das operações que possuam o mesmo código de contrato informado no atributo nas InfoAdicionais. Ou seja, quando o atributo "Cd"'},
  'S38':{cat:'Semântica',r:'Compatibilidade de datas em contrato de cessão',d:'A data informada na informação adicional <Inf Tp="0102 ou 0103 ou 0104 ou 0702 ou 0703 ou 0704 ou 0705 ou 0706 ou 0707"> da operação cedida deve ser igual a informada na informação adicional <Inf Tp="1201"> do respectivo contrato de cessão. Ou seja, '},
  'S39':{cat:'Semântica',r:'Compatibilidade de cessionário informados em contrato de cessão',d:'Consolidação da regra na Regra S34. O cessionário informado na informação adicional <Inf Tp="0102 ou 0103 ou 0104 ou 0702 ou 0703 ou 0704 ou 0705 ou 0706 ou 0707"> da operação cedida deve ser igual ao informado no respectivo contrato de cessão. Ou se'},
  'S40':{cat:'Semântica',r:'Informações completas de cessão nas operações originais',d:'Exceto nos casos de informação adicional de saída, Quando houver informações adicionais 0102 ou 0103 ou 0104 ou 0702 ou 0703 ou 0704 ou 0705 ou 0706 ou 0707 deve haver informação adicional 1202.'},
  'S41':{cat:'Semântica',r:'Verificação de formatação de CNPJ',d:'O atributo “Ident” das informações adicionais 01 (exceto 0105), 0303, 1001 e 1203 devem ser CNPJs de 8 dígitos.'},
  'S42':{cat:'Semântica',r:'Compatibilidade de informação de cedente de operação - cedente',d:'O informante do documento deve ser igual ao cedente de operações de modalidade 1512. Ou seja, se <Inf Tp="1203">, o atributo <Inf Tp="1203" Ident=""> deve ser igual a <Doc3040 CNPJ="">'},
  'S43':{cat:'Semântica',r:'Compatibilidade de informação de cedente de operação - cessionário',d:'O cedente informado nas informações adicionais de tipo 0101 ou 0701 deve ser igual ao cliente dessa operação. Ou seja, se <Inf Tp="0101"> ou <Inf Tp="0701">, o atributo <Inf Tp="0101" Ident=""> ou <Inf Tp="0701" Ident=""> deve ser igual a <Cli Cd="">'},
  'S44':{cat:'Semântica',r:'Característica especial “35” para operações cedidas a partir de 01/01/12',d:'A característica especial “35” só pode ser utilizada para marcar operações cedidas ou adquiridas, ou seja, para operações que sejam: de naturezas 04, 05, 11 e 13 a 15 e modalidades 01 a 13, 1402 ou 1403; ou natureza 01 e modalidade 1511 ou 1512 ou 15'},
  'S45':{cat:'Semântica',r:'Verificação de formatação de CNPJ e CPF',d:'O atributo “Ident” das informações adicionais 0304, 07, 1002, 1003 e 2101 devem ser CPFs válidos de 11 dígitos ou CNPJs de 8 dígitos.'},
  'S46':{cat:'Semântica',r:'Verificação de formatação de data em Informações Adicionais',d:'O atributo "Cd" das Informações Adicionais 01, 0303, 0304, 07, 10, 1201 e 1701 deve ser informado no formato AAAA-MM-DD, onde AAAA equivale aos 4 dígitos do ano, MM aos 2 dígitos correspondentes ao mês e DD aos 2 dígitos correspondentes ao dia.'},
  'S47':{cat:'Semântica',r:'Proibição de Modalidades excluídas',d:'As modalidades 0201 (cheque especial e conta garantida), 0205 (capital de giro com prazo de vencimento inferior a 30 d) e 0206 (capital de giro com prazo vencim. igual ou superior 30 d) são proibidas a partir da database fev/2014. Exceção: “Na databa'},
  'S48':{cat:'Semântica',r:'Obrigatoriedade da informação do SNG para modalidades “0401” e “1206”',d:'Exceto em casos de Informação Adicional de Saída, as modalidades “0401” (aquisição de bens – veículos automotores) e “1206” (arrendamento financeiro de veículos automotores) requerem a Informação Adicional Inf Tp=”0401” (Registro do Chassi do veículo'},
  'S49':{cat:'Semântica',r:'Compatibilidade de informação de cessionário de operação - cedente',d:'O cedente informado nas informações adicionais de tipo 1001 ou 1002 deve ser diferente do cliente dessa operação. Ou seja, se <Inf Tp="1001"> ou <Inf Tp="1002">, o atributo <Inf Tp="1001" Ident=""> ou <Inf Tp="1002" Ident=""> deve ser diferente do <C'},
  'S50':{cat:'Semântica',r:'Compatibilidade de informação de cliente - crédito pessoal',d:'Na carteira ativa, as submodalidades 0202 e 0203 de Naturezas de 1 a 3, o tipo de cliente informado deve ser 1, 3 ou 5, ou seja, para operações  com código de vencimento “vCOD” entre “v110” e “v290”, se (<Op NatuOp="x">, onde x pode assumir os valore'},
  'S51':{cat:'Semântica',r:'Compatibilidade de informação de cliente - repasses',d:'Para a submodalidade 1401, o tipo de cliente informado deve ser 2, 4 ou 6, ou seja, se <Op Mod="1401">, então (<Cli Tp="2"> ou <Cli Tp="4"> ou <Cli Tp="6">).'},
  'S52':{cat:'Semântica',r:'Compatibilidade de informação de taxa de juros - cartão de crédito - compra à vista e parcelado loji',d:'Para a submodalidade 1304, a taxa de juros informada deve ser 0 (zero), ou seja, se <Op Mod="1304">, então <Op TaxEft=0>.'},
  'S53':{cat:'Semântica',r:'Crédito a liberar - não aplicabilidade',d:'Não poderão ter preenchidos os vencimentos de crédito a liberar (vencimentos 60 e 80) as modalidades "adiantamento a depositantes"  (0101), “crédito rotativo vinculado a cartão de crédito” (0204), “cartão de crédito - compra parcelada” (0210), “cartã'},
  'S54':{cat:'Semântica',r:'Natureza 11 - informação adicional necessária',d:'Exceto nos casos de informação adicional de saída, se a natureza for 11, deve haver uma (e apenas uma) Informação Adicional sobre “cessão com coobrigação entre instituições financeiras – informação de cedente” (InfoAdicional == 0102 ou 0103 ou 0104)'},
  'S55':{cat:'Semântica',r:'Natureza 13, 14 e 15 - informação adicional necessária',d:'Exceto nos casos de informação adicional de saída, se a natureza for 13 ou 14 ou 15, deve haver uma (e somente uma) Informação Adicional sobre “Negociação de operações com pessoa não integrante do SFN com retenção de risco - transferidor de operação"'},
  'S56':{cat:'Semântica',r:'Mapeamento de Vencimentos de Operação de Risco HH',d:'Exceto em casos de informação adicional de saída, quando ClassOp= HH , é necessário que haja vencimentos em algum dos vértices de prejuízo (v310, v320 ou v330).'},
  'S57':{cat:'Semântica',r:'Falta de percentual de coobrigação',d:'Nas informações adicionais 0101 a 0105 e 0702 a 0704, o percentual não pode ser igual a zero. Ou seja, se  <Inf Tp=“0101”> ou <Inf Tp=“0102”> ou <Inf Tp=“0103”> ou <Inf Tp=“0104”> ou <Inf Tp=“0105”> ou <Inf Tp=“0702”> ou <Inf Tp=“0703”> ou <Inf Tp=“0'},
  'S58':{cat:'Semântica',r:'Cliente é a própria IF',d:'Com exceção das modalidades 0204, 0406, 1304, 1403, 1501, 1502, 1599, 19XX, o cliente não pode ser igual ao CNPJ da instituição informante. Ou seja, se <Cli Cd= "XXXXXXXX", onde XXXXXXXX é o CNPJ da IF, então <Op Mod=“0204”> ou <Op Mod=“0406”> ou <Op'},
  'S59':{cat:'Semântica',r:'Garantia FGTS',d:'Só é permitida garantia de FGTS para operações de crédito pessoal – com ou sem consignação em folha de pagamento. Ou seja, se <Gar Tp="0889">, então <Op Mod="0202"> ou <Op Mod="0203">.'},
  'S60':{cat:'Semântica',r:'Crédito rotativo - não migrado',d:'Para operações cuja modalidade é 0218, não é permitida a característica especial 18. Ou seja,  se <Op Mod = "0218">, então <CaracEspecial ≠ 18>.'},
  'S61':{cat:'Semântica',r:'Obrigatoriedade do campo valor contratado para as modalidades 0210 e 0406 provenientes de saldo rema',d:'Para operações cujas modalidades são 0210 ou 0406 e característica especial 18, é obrigatório o campo valor contratado da operação. Ou seja, se <Op Mod = "0210"> ou <Op Mod = "0406"> e <CaracEspecial = "18">, então <VlrContr ≠ 0>.'},
  'S62':{cat:'Semântica',r:'Proibição da informação adicional 0308 - saída por baixa de limite de identificação - para clientes ',d:'Clientes informados de forma individualizada não podem apresentar operações com motivo de saída por baixa de limite de identificação (0308) e valores no vértice de vencimentos de outra operação pertencente a eles, exceto para operações de natureza 32'},
  'S63':{cat:'Semântica',r:'Compatibilidade de informação entre Porte e Faturamento',d:'Clientes informados com porte igual a zero não podem apresentar faturamento maior que 1. Ou seja, para tag <Cli>, se <PorteCli=0>, então <FatAnual<=1>.'},
  'S64':{cat:'Semântica',r:'Campos existentes somente para pessoa jurídica no exterior',d:'Para clientes diferentes de pessoa jurídica no exterior - <Cli> <Tp≠"4">, não é permitido o preenchimentos dos campos “NomeCli”, “TpIdentExt”, “CodExt”, IdLiderBR” e “IdPais”'},
  'S65':{cat:'Semântica',r:'Verificação de formatação de CNPJ - Informação Adicional 0201 - Vendor/Interveniência',d:'O atributo “Ident” da informação adicional 0201 - Vendor/Interveniência deve ser informado com CNPJ de 8 dígitos.'},
  'S66':{cat:'Semântica',r:'Aquisição de Recebíveis',d:'Para a modalidade 1350, deverão ser aceitas todas as naturezas de operação, com exceção da 01. Ou seja, para <Mod="1350">, então <NatuOp≠"01">.'},
  'S67':{cat:'Semântica',r:'Natureza da operação - Recebíveis de Arranjo de Pagamento',d:'Para a modalidade 1402, deverão ser aceitas apenas as naturezas de operação 01, 02 e 03. Ou seja, para <Mod="1402">, então <NatuOp="01">, <NatuOp="02"> ou <NatuOp="03">.'},
  'S68':{cat:'Semântica',r:'Compatibilidade de informação entre Porte e Faturamento',d:'Clientes informados com faturamento menor ou igual a 1,  só poderão apresentar porte igual a zero ou 1. Ou seja, para tag <Cli>, se <FatAnual<=1>, então <PorteCli=0>, ou <PorteCli=1>.'},
  'S69':{cat:'Semântica',r:'Compatibilidade de informação entre classificação de risco e provisão constituída',d:'Para operações classificadas como prejuízo, o valor da provisão constituída deve ser zero. Ou seja, se <ClassOp>=HH, então <ProvConsttd>=0.00.'},
  'S70':{cat:'Semântica',r:'Compatibilidade entre a data da contratação e a data-base para operações intramês',d:'Para operações intramês, originadas e cedidas dentro do mesmo mês, a data da contratação deve ser igual à data-base. Ou seja, se <CaracEspecial> = 22, então <DtContr> = <DtBase>'},
  'S71':{cat:'Semântica',r:'Ente Consignante',d:'O atributo "Ident" da informação adicional de Ente Consignante não pode ser igual ao Cliente da operação. Ou seja, para <Inf Tp> = 15XX, <Ident> ≠ <Cli Cd>.'},
  'S72':{cat:'Semântica',r:'Correspondente Bancário',d:'O atributo "Ident" da informação adicional de Correspondente Bancário não pode ser igual ao Cliente da operação. Ou seja, para <Inf Tp> = 1601, <Ident> ≠ <DetCli>.'},
  'S73':{cat:'Semântica',r:'Saídas por cessão sem retenção de riscos e benefícios',d:'O atributo "Ident" das informações adicionais de saída por cessão sem retenção de riscos a pessoa integrante ou não do SFN não pode ser igual ao Cliente da operação. Ou seja, para <Inf Tp> = 0303 ou <Inf Tp> = 0304, <Ident> ≠ <Cli Cd>.'},
  'S74':{cat:'Semântica',r:'Ativo Problemático',d:'Operações que apresentem informação adicional de Reestruturação, e/ou vértice de vencimento acima de 240, e/ou classificação da operação de E a H, devem ser acompanhadas da característica especial de Ativo Problemático. Ou seja, se <Inf Tp = "1701">,'},
  'S75':{cat:'Semântica',r:'Duplicidade de Informações Adicionais',d:'Para cada operação, a mesma informação adicional não pode ser repetida, caso possua exatamente os mesmos atributos.'},
  'S76':{cat:'Semântica',r:'Formato do campo CEP para operações realizadas em dependências no exterior',d:'Para operações de natureza 32, o campo CEP deve assumir um dos valores relacionados no Anexo 30 do Leiaute do Documento 3040, no formato "00000XXX".'},
  'S77':{cat:'Semântica',r:'Formato do campo Localização para operações realizadas em dependências no exterior',d:'Para operações de natureza 32, o campo Localização deve assumir um dos valores relacionados no Anexo 30 do Leiaute do Documento 3040, no formato "00XXX".'},
  'S78':{cat:'Semântica',r:'Correspondente Bancário',d:'O atributo \'Ident\' da informação adicional não pode ser igual ao Cliente da operação, nem sua raiz (oito primeiros dígitos do atributo \'Ident\') pode coincidir com o CNPJ da instituição. Ou seja, para <Inf Tp> = 1601, <Ident> ≠ <Detcli> e <Ident>(raiz'},
  'S79':{cat:'Semântica',r:'Saídas - Alteração do IPOC',d:'Nas declarações de saída de IPOC (Inf Tp> = “0316”), os campos <Cd> e <Qtd> são de preenchimento obrigatório, sendo o atributo <Cd> o “IPOC” de uma outra operação informada na mesma remessa. Ou seja, se <Inf Tp> = “0316”, então <Cd> = <IPOC> de outra'},
  'S80':{cat:'Semântica',r:'Concatenação IPOC - data da contratação',d:'Na data da contratação da operação, os elementos da concatenação do campo "IPOC" devem corresponder aos valores informados para a operação. Ou seja, se <DtContr> = <DtBase>, então <IPOC> = "CNPJModCliTpCliCdContrt"'},
  'S81':{cat:'Semântica',r:'Concatenação IPOC - data posterior à de contratação',d:'Na data posterior à de contratação da operação, os elementos CNPJ da instituição e Cliente da operação da concatenação do campo "IPOC" devem corresponder aos respectivos valores informados para a operação. Adicionalmente, a A submodalidade, outro com'},
  'S82':{cat:'Semântica',r:'Concatenação IPOC - – tratamento do estoque até Novembro/2020',d:'Os elementos da concatenação do campo "IPOC" do estoque da IF devem corresponder aos valores informados para cada operação. Ou seja, se <DtBase> = “202011”, então <IPOC> = "CNPJModCliTpCliCdContrt".'},
  'S83':{cat:'Semântica',r:'Compatibilidade de tipo de cliente e identificação do cliente',d:'O número de dígitos informados para a identificação do cliente deve ser compatível com seu tipo. Ou seja, se Cli Tp = 1, Cli Cd deve ter 11 dígitos, se Cli Tp = 2, Cli Cd deve ter 8 dígitos e se Cli Tp = 3, 4, 5 ou 6, Cli Cd deve ter 14 dígitos'},
  'S84':{cat:'Semântica',r:'Operação não própria',d:'O atributo \'Ident\' na informação adicional <Inf Tp="2201"> ou <Inf Tp="2202"> deve ser um CNPJ válido com 14 dígitos, não pode coincidir com o detalhamento do cliente na operação, nem sua raiz (oito primeiros dígitos do atributo \'Ident\') pode coincid'},
  'S85':{cat:'Semântica',r:'Data da próxima prestação a vencer',d:'A data da próxima prestação a vencer (atributo "DtaProxParcela" da tag <Op>) não pode ser anterior à data de contratação da operação (atributo "DtContr" da tag <Op>) e não pode ser anterior à data de início do relacionamento com o cliente (atributo "'},
  'S86':{cat:'Semântica',r:'Característica especial “25” para operações de modalidade "19 - Limite".',d:'A característica especial “25” só pode ser utilizada para marcar operações de modalidade "19 - Limite", ou seja, 1901 até 1910, ou 1999.'},
  'S87':{cat:'Semântica',r:'Conexão de IPOCs - Unicidade',d:'O IPOC informado através do atributo "ipoc" da tag "<ipocCon>" não deve ser informado mais de uma vez dentro da mesma tag "<ConIpocs>" ou dentro de outra tag "<ConIpocs>".'},
  'S88':{cat:'Semântica',r:'Conexão de IPOCs - Integridade',d:'O IPOC informado através do atributo "ipoc" da tag "<ipocCon>" deve estar presente no documento 3040. Ou seja, deve ser informado em alguma operação através do atributo "IPOC" da tag "<Op>".'},
  'S89':{cat:'Semântica',r:'Penhor Civil',d:'O exercício de operações com garantia do tipo \'Penhor Civil\' é monopólio da Caixa Econômica Federal, segundo o artigo 2º, alínea "e" do Decreto-Lei nº 759, de 12 de agosto de 1969. Ou seja, se <Gar Tp="0350" ... />, então CNPJ da IF deve ser "0036030'},
  'S90':{cat:'Semântica',r:'Tag Sicor - Créditos a liberar',d:'Sempre que a modalidade da operação for 08XX ("Financiamentos rurais") e a operação for exclusiva de créditos a liberar (tiver somente vértices v60 e/ou v80), a tag <Sicor> não poderá ser informada.'},
  'S91':{cat:'Semântica',r:'Tag Sicor - Outras modalidades',d:'Sempre que a modalidade da operação for diferente de 08XX ("Financiamentos rurais"), a tag <Sicor> não poderá ser informada.'},
  'S92':{cat:'Semântica',r:'Tag Sicor - Situação de Crédito Rural',d:'Exceto nos casos de informação adicional de saída, a operação de crédito rural deve observar as seguintes condições em relação à situação informada na tag <Sicor> (Anexo 32 do leiaute do Documento 3040): a) Se situação SOR01, SOR03 a SOR06, SOR11 ou '},
  'S93':{cat:'Semântica',r:'Marcação Ativo Problemático operações vencidas acima de 90 dias',d:'Se operação vencida acima de 90 dias, a marcação de Ativo Problemático é obrigatória. Se (V240 + V245 + V250 + V255 + V260 + V270 + V280 + V290) > 0, então característica especial 19 é obrigatória.'},
  'S94':{cat:'Semântica',r:'Marcação Ativo Problemático para operações reestruturadas',d:'Reestruturação ocorrida na data-base, marcação do Ativo Problemático é obrigatória. Se "Inf" = 1701 e campo "Cd" / data da reestruturação contida na data-base, então característica especial 19 é obrigatória. Obs.: a marcação de reestruturação Inf 170'},
  'S95':{cat:'Semântica',r:'Estágio 1 e 2 não pode haver Ativo Problemático',d:'Para operações classificadas como Estágio 1 e 2, não poderá haver marcação de Ativo Problemático. Se EstFin = 1/2, então característíca especial 19 é proibida.'},
  'S96':{cat:'Semântica',r:'Marcação Ativo Problemático operações no Estágio 3',d:'Para operações classificadas como Estágio 3, marcação de Ativo Problemático obrigatória. Se EstFin = 3, então característíca especial 19 é obrigatória.'},
  'S97':{cat:'Semântica',r:'Se atraso superior a 60 dias, não pode ser classificada como Estágio 1',d:'Se metodologia de apuração da provisão para perdas esperadas = Completa e atraso superior a 60 dias, não pode estar classificada em Estágio 1. Se MetodApPE = \'C\' e (V230 + V240 + V245 + V250 + V255 + V260 + V270 + V280 + V290) > 0, então o EstInstFin'},
  'S98':{cat:'Semântica',r:'Uso da Característica Especial 39 (TVM com característica de concessão de crédito) exclusivo para TV',d:'Somente a modalidade 18xx pode conter a característica especial 39 - Ttulos com característica de concessão de crédito.   Exceção: operações com Informação Adicional de saída 03xx.'},
  'S99':{cat:'Semântica',r:'Exigência de valor no vértice vencido correspondente aos dias de atraso da parcela mais atrasada (Di',d:'Se 1 =< DiaAtraso <= 14, deve haver valor em v205 Se 15 =< DiaAtraso <= 30, deve haver valor em v210 Se 31 =< DiaAtraso <= 60, deve haver valor em v220 Se 61 =< DiaAtraso <= 90, deve haver valor em v230 Se 91 =< DiaAtraso <= 120, deve haver valor em '},
  'S100':{cat:'Semântica',r:'Modalidade de Crédito Consignado é obrigatório o Ente Consignante',d:'Se modalidade de operação = 0202 - Crédito Consignado, então Informação Adicional 1501, 1502 ou 1503 - Ente Consignante é obrigatória.'},
  'S101':{cat:'Semântica',r:'Se Ente Consignante INSS, CNPJ indicado deve ser do INSS ou Fundo Previdência',d:'Se Informação Adicional = 1503 - Ente Consignante INSS e campo "Cd" diferente de 1, então campo "Ident" deve ser 29979036000140 ou 16727230000197.'},
  'S102':{cat:'Semântica',r:'Se modalidade 1899 - Outros TVMs, obrigatória marcação com característica de concessão de crédito',d:'Se modalidade = 1899 - TVM Outros, então obrigatória a característica especial 39 - com característica de concessão de crédito.'},
  'S103':{cat:'Semântica',r:'Se operação baixada para prejuízo, não deve haver valor de carteira nem provisão constituída',d:'Se v3xx > 0, então demais vértices devem ser = zero e Valor de Provisão Constituída deve ser = zero.'},
  'S104':{cat:'Semântica',r:'Valor de provisão constituída deve ser menor igual ao VCB + crédito a liberar',d:'Se TpFundo = Vazio (não Fundo) e operações nas modalidades 1 a 11, 13, 14 e 18 e naturezas de 1,2,3,11,13,14,15 e 32 e sem informação adicional de saída, então Valor da provisão constituída (ProvConsttd) <= Valor Contábil Bruto (VlrContBr) + Valor do'},
  'S105':{cat:'Semântica',r:'Se operação contratada no âmbito do Programa EcoInvest, informar o número do leilão.',d:'Se Informação Adicional = 1408 e campo "Ident" = 11, então campo "Valor" deve ser preenchido.'},
  'I01':{cat:'Individualizadas',r:'Mapeamento de Classificação da Operação x Provisão Constituída, exceto para a modalidade 19XX',d:'Exceto quando se tratar das modalidades 19XX: Quando ClassOp= AA, 0% <= ProvConsttd < 0,5% * ∑VlrVenc Quando ClassOp= A, 0,5% <= ProvConsttd < 1% * ∑VlrVenc Quando ClassOp= B, 1% <= ProvConsttd < 3% * ∑VlrVenc Quando ClassOp= C, 3% <= ProvConsttd < 1'},
  'I02':{cat:'Individualizadas',r:'Mapeamento de Classificação da Operação x Vencimentos, quando o prazo a decorrer da operação for inf',d:'Quando ClassOp= AA , Não pode haver vencimentos >= 210 Quando ClassOp= A , Não pode haver vencimentos >= 210 Quando ClassOp= B , Não pode haver vencimentos >= 220 Quando ClassOp= C , Não pode haver vencimentos >=230 Quando ClassOp= D , Não pode haver'},
  'I03':{cat:'Individualizadas',r:'Cliente informado mais de uma vez',d:'Não é admitida repetição, simultânea, de código do cliente (atributo Cd da tag Cli) e tipo do cliente (atributo TpCli da tag Cli) em uma mesma parte de remessa do documento.'},
  'I04':{cat:'Individualizadas',r:'Operação informada mais de uma vez para o mesmo cliente',d:'Não é admitida repetição, simultânea, de código de contrato (atributo Contrt da tag Op) e modalidade (atributo Mod da Tag Op) para um mesmo cliente (atributo Cd da tag Cli) em uma mesma parte de remessa do documento e na remessa completa do documento'},
  'I05':{cat:'Individualizadas',r:'Código de vencimento informado mais de uma vez na operação',d:'Não é admitida, em uma única operação, a repetição de vencimentos, tanto em cada parte, como na remessa completa de um documento.'},
  'I06':{cat:'Individualizadas',r:'Garantidor fidejussório informado mais de uma vez na mesma operação',d:'Não é admitida, em uma única operação, a repetição do garantidor fidejussório (atributo Ident da tag Gar) tanto em cada parte, como na remessa completa de um documento.'},
  'I07':{cat:'Individualizadas',r:'Mapeamento de Classificação da Operação x Vencimentos, quando o prazo a decorrer da operação for sup',d:'Quando ClassOp= AA , Não pode haver vencimentos >= 220 Quando ClassOp= A , Não pode haver vencimentos >= 220 Quando ClassOp= B , Não pode haver vencimentos >= 240 Quando ClassOp= C , Não pode haver vencimentos >=250 Quando ClassOp= D , Não pode haver'},
  'I08':{cat:'Individualizadas',r:'Garantidor fidejussório deve ser compatível com o tipo de garantidor informado',d:'Se o garantidor fidejussório for pessoa física (0901), o atributo Ident deve obrigatoriamente ter 11 dígitos verificados. Se o garantidor fidejussório for pessoa jurídica (0902), o atributo Ident deve obrigatoriamente ter 14 dígitos verificados.'},
  'I09':{cat:'Individualizadas',r:'Conjunto de operações do cliente não pode ser inferior a R$1.000,00',d:'Exceto nos casos de informação adicional de saída, o somatório dos vencimentos de todas as operações de um cliente deve ser igual ou superior a R$1.000,00. Não são considerados os códigos de vencimento: 20, 40, 60 e 80 na composição do limite de iden'},
  'I10':{cat:'Individualizadas',r:'Compatibilidade de informações de saída e valores',d:'É obrigatório informar os vencimentos, provisão constituída e classificação da operação para as operações de crédito com exceção das saídas de operação. Nas saídas de operação é proibido informar os vencimentos, provisão constituída e garantia.'},
  'I11':{cat:'Individualizadas',r:'Impede a identificação de operações de natureza 32',d:'Operações individualizadas (tag <Cli>) não podem ter natureza de operação 32'},
  'I12':{cat:'Individualizadas',r:'Conjunto de operações do cliente não pode ser inferior a R$ 200,00',d:'Exceto nos casos de informação adicional de saída, o somatório dos vencimentos de todas as operações de um cliente deve ser igual ou superior a R$ 200,00. Não são considerados os códigos de vencimento: 20, 40, 60 e 80 na composição do limite de ident'},
  'I13':{cat:'Individualizadas',r:'Clientes com responsabilidade total acima de R$ 200,00 devem ser informados de forma individualizada',d:'Exceto nos casos de informação adicional de saída, o somatório dos vencimentos de todas as operações de um cliente deve ser igual ou superior a R$ 200,00. Passam a ser considerados todos os domínios do Anexo 1 na composição do limite de identificação'},
  'I14':{cat:'Individualizadas',r:'IPOC informado mais de uma vez',d:'Não é admitida repetição de número de IPOC em uma mesma remessa do documento.'},
  'I15':{cat:'Individualizadas',r:'Compatibilidade de informações de saída e valores',d:'É obrigatório informar os vencimentos, provisão constituída. Nas saídas de operação é proibido informar os vencimentos, provisão constituída e garantia.'},
  'A01':{cat:'Agregadas',r:'Mapeamento de Classificação da Operação x Provisão Constituída',d:'Quando ClassOp= AA, 0% * ∑VlrVenc <= ProvConsttd < 0,5% * ∑VlrVenc Quando ClassOp= A, 0,5% * ∑VlrVenc <= ProvConsttd < 1% * ∑VlrVenc Quando ClassOp= B, 1% * ∑VlrVenc <= ProvConsttd < 3% * ∑VlrVenc Quando ClassOp= C, 3% * ∑VlrVenc <= ProvConsttd < 10%'},
  'A02':{cat:'Agregadas',r:'Mapeamento de Classificação da Operação x Vencimentos, quando não houver Prazo em Dobro para Provisi',d:'Quando ClassOp= AA , Não pode haver vencimentos >= 210 Quando ClassOp= A , Não pode haver vencimentos >= 210 Quando ClassOp= B , Não pode haver vencimentos >= 220 Quando ClassOp= C , Não pode haver vencimentos >=230 Quando ClassOp= D , Não pode haver'},
  'A03':{cat:'Agregadas',r:'Mapeamento de Classificação da Operação x Vencimentos, quando houver Prazo em Dobro para Provisionam',d:'Quando ClassOp= AA , Não pode haver vencimentos >= 220 Quando ClassOp= A , Não pode haver vencimentos >= 220 Quando ClassOp= B , Não pode haver vencimentos >= 240 Quando ClassOp= C , Não pode haver vencimentos >=250 Quando ClassOp= D , Não pode haver'},
  'A04':{cat:'Agregadas',r:'Cada agregação deve conter pelo menos um vencimento',d:'Não é admitida Agregação sem vencimentos.'},
  'A05':{cat:'Agregadas',r:'Compatibilidade entre natureza e localização para operações no exterior',d:'A natureza 32 (NatuOp=“32”) exige localização 10100 (Localiz=“10100”).'},
  'A06':{cat:'Agregadas',r:'Compatibilidade entre desempenho da operação somente e vencimentos correspondentes',d:'Quando DesempOp= 01 - Operações a Vencer, não pode haver vencimentos > 205 Quando DesempOp= 02 - Operações Vencidas de 15 a 30 dias, não pode haver vencimentos >= 220 e deve haver vencimento = 210 Quando DesempOp= 03 - Operações Vencidas de 31 a 60 d'},
  'A07':{cat:'Agregadas',r:'Agregado informado mais de uma vez',d:'Não é admitida repetição, simultânea, de Natureza da operação (NatuOp), Modalidade da operação (Mod), Origem dos recursos (OrigemRec), Vinculação à moeda estrangeira (VincME), Classificação de risco da operação (ClassOp), Faixa de valor (FaixaVlr), P'},
  'A09':{cat:'Agregadas',r:'Faixa de valor compatível com a média de valor das operações',d:'A faixa de valor deve ser compatível com a média das operações informadas, ou seja, o atributo FaixaVlr deve ser compatível com a soma do vencimento das operações ponderada pela quantidade de operações: Para FaixaVlr=1, 0 < (∑VlrVenc/QtdOperações) < '},
  'A10':{cat:'Agregadas',r:'Número de operações compatíveis com o número de clientes',d:'Em cada uma das agregações, o número de operações deve ser maior ou igual ao número de clientes.'},
  'A11':{cat:'Agregadas',r:'No agregado, o somatório de vencimentos v110 a v330 dividido pela quantidade de operações só pode se',d:'É proibido informar faixa de valor 4 ou 5 para agregados cujo somatório dos vencimentos v110 a v330 dividido pela quantidade de operações seja maior ou igual a 1000,00.'},
  'A12':{cat:'Agregadas',r:'No agregado, o somatório de vencimentos v110 a v330 dividido pela quantidade de operações só pode se',d:'É proibido informar faixa de valor 4 ou 5 para agregados cujo somatório dos vencimentos v110 a v330 dividido pela quantidade de operações seja maior ou igual a 200,00.'},
  'A13':{cat:'Agregadas',r:'Risco direto médio menor que R$ 200,00 deve ser informado no agregado',d:'No agregado, exceto para operações de natureza 32, o somatório de vencimentos v20 a v330 dividido pela quantidade de operações deve ser menor que R$ 200,00. Ou seja, (∑Venc v20 a v330/QtdOperações) < R$ 200,00, se Natuop ≠ 32.'},
  'A14':{cat:'Agregadas',r:'Formato do campo Localização para operações realizadas em dependências no exterior',d:'Para operações de natureza 32, o campo Localização deve assumir um dos valores relacionados no Anexo 30 do Leiaute do Documento 3040, no formato "00XXX".'},
  'A15':{cat:'Agregadas',r:'Agregado informado mais de uma vez',d:'Não é admitida repetição, simultânea, de Natureza da operação (NatuOp), Modalidade da operação (Mod), Origem dos recursos (OrigemRec), Vinculação à moeda estrangeira (VincME),Faixa de valor (FaixaVlr), Localização (Localiz), Tipo de cliente (TpCli), '},
  'MV01':{cat:'Vertices por Modalid',r:'Divergência entre Adiantamentos a Depositantes o Saldo Contratual contabilizado no Doc 4010',d:'A soma das operações individualizadas e agregadas da Modalidade de Operação "01" (Adiantamento a Depositantes), Código de Vencimento de "110" até "290" (a Vencer e Vencidos) e Naturezas da Operação "01", "02", "03", "11", "13", "14" e "15" deve ser i'},
  'MV02':{cat:'Vertices por Modalid',r:'Divergência entre Empréstimos e o Saldo Contratual contabilizado no Doc 4010',d:'A soma das operações individualizadas e agregadas da Modalidade de Operação "02" (Empréstimos), Código de Vencimento de "110" até "290" (a Vencer e Vencidos) e Naturezas da Operação "01", "02", "03", "11", "13", "14" e "15" deve ser igual ao saldo da'},
  'MV03':{cat:'Vertices por Modalid',r:'Divergência entre Títulos Descontados e o Saldo Contratual contabilizado no Doc 4010',d:'A soma das operações individualizadas e agregadas da Modalidade de Operação "03" (Títulos Descontados), Código de Vencimento de "110" até "290" (a Vencer e Vencidos) e Naturezas da Operação "01", "02", "03", "11", "13", "14" e "15" deve ser igual ao '},
  'MV04':{cat:'Vertices por Modalid',r:'Divergência entre Financiamentos e o Saldo Contratual contabilizado no Doc 4010',d:'A soma das operações individualizadas e agregadas das Modalidades de Operação "04" (Financiamentos) e "07" (Financiamento com Interveniência), Código de Vencimento de "110" até "290" (a Vencer e Vencidos) e Naturezas da Operação "01", "02", "03", "11'},
  'MV05A':{cat:'Vertices por Modalid',r:'Divergência entre Financimentos à Exportação e o Saldo Contratual contabilizado no Doc 4010',d:'A soma das operações individualizadas e agregadas das Submodalidades de Operação "0501", "0504", "0590" e "0599", Código de Vencimento de "110" até "290" (a Vencer e Vencidos) e Naturezas da Operação "01", "02", "03", "11", "13", "14" e "15" deve ser'},
  'MV05B':{cat:'Vertices por Modalid',r:'Divergência entre Adiantamento a Contrato de Câmbio e o Saldo Contratual contabilizado no Doc 4010',d:'A soma das operações individualizadas e agregadas das Submodalidades de Operação "0502" (ACC) e "0503" (ACE), Código de Vencimento de "110" até "290" (a Vencer e Vencidos) e Naturezas da Operação "01", "02", "03", "11", "13", "14" e "15" deve ser igu'},
  'MV06':{cat:'Vertices por Modalid',r:'Divergência entre Financiamentos à Importação e o Saldo Contratual contabilizado no Doc 4010',d:'A soma das operações individualizadas e agregadas da Modalidade de Operação "06" (Financiamento à importação), Código de Vencimento de "110" até "290" (a Vencer e Vencidos) e Naturezas da Operação "01", "02", "03", "11", "13", "14" e "15" deve ser ig'},
  'MV08':{cat:'Vertices por Modalid',r:'Divergência entre Financimento Rural e o Saldo Contratual contabilizado no Doc 4010',d:'A soma das operações individualizadas e agregadas da Modalidade de Operação "08" (Financiamento rural), Código de Vencimento de "110" até "290" (a Vencer e Vencidos) e Naturezas da Operação "01", "02", "03", "11", "13", "14" e "15" deve ser igual à s'},
  'MV09':{cat:'Vertices por Modalid',r:'Divergência entre Financimento Imobiliário e o Saldo Contratual contabilizado no Doc 4010',d:'A soma das operações individualizadas e agregadas da Modalidade de Operação "09" (Financiamento imobiliário), Código de Vencimento de "110" até "290" (a Vencer e Vencidos) e Naturezas da Operação "01", "02", "03", "11", "13", "14" e "15" deve ser igu'},
  'MV10':{cat:'Vertices por Modalid',r:'Divergência entre Financiamento de TVM e o Saldo Contratual contabilizado no Doc 4010',d:'A soma das operações individualizadas e agregadas da Modalidade de Operação "10" (Financiamento de Títulos e Valores Mobiliários), Código de Vencimento de "110" até "290" (a Vencer e Vencidos) e Naturezas da Operação "01", "02", "03", "11", "13", "14'},
  'MV11':{cat:'Vertices por Modalid',r:'Divergência entre Financiamentos de Infra-Estrutura e Desenvolvimento e o Saldo Contratual contabili',d:'A soma das operações individualizadas e agregadas da Modalidade de Operação "11" (Financiamento de Infra-estrutura e Desenvolvimento), Código de Vencimento de "110" até "290" (a Vencer e Vencidos) e Naturezas da Operação "01", "02", "03", "11", "13",'},
  'MV12':{cat:'Vertices por Modalid',r:'Divergência entre Arrendamento mercantil e o Saldo Contratual contabilizado no Doc 4010',d:'A soma das operações individualizadas e agregadas da Modalidade de Operação "12" (Operações de Arrendamento), Código de Vencimento de "110" até "290" (a Vencer e Vencidos) e Naturezas da Operação "01", "02", "03", "11", "13", "14" e "15" deve ser igu'},
  'MV13A':{cat:'Vertices por Modalid',r:'Divergência entre Cartão de crédito (fatura) e o Saldo Contratual contabilizado no Doc 4010',d:'A soma das operações individualizadas e agregadas da Submodalidade de Operação "1304" (cartão de crédito - compra à vista e parcelado lojista), Código de Vencimento de "110" até "290" (a Vencer e Vencidos) e Naturezas da Operação "01", "02", "03", "1'},
  'MV13B':{cat:'Vertices por Modalid',r:'Divergência entre Avais e Fianças Honrados e o Saldo Contratual contabilizado no Doc 4010',d:'A soma das operações individualizadas e agregadas da Submodalidade de Operação "1301" (avais e fianças honrados), Código de Vencimento de "110" até "290" (a Vencer e Vencidos) e Naturezas da Operação "01", "02", "03", "11", "13", "14" e "15" deve ser'},
  'MV13C':{cat:'Vertices por Modalid',r:'Divergência entre Outros créditos e o Saldo Contratual contabilizado no Doc 4010',d:'A soma das operações individualizadas e agregadas das Submodalidades de Operação "1302" (devedores por compra de valores e bens), "1303" (títulos e créditos a receber), "1350" (recebíveis adquiridos), "1390" (financiamento de projeto) e "1399" (outro'},
  'MV14A':{cat:'Vertices por Modalid',r:'Divergência entre repasses interfinanceiros e o Saldo Contratual contabilizado no Doc 4010',d:'A soma das operações individualizadas e agregadas da Submodalidade de Operação "1401" (repasses interfinanceiros), Código de Vencimento de "110" até "290" (a Vencer e Vencidos) e Naturezas da Operação "01", "02", "03", "11", "13", "14" e "15" deve se'},
  'MV14B':{cat:'Vertices por Modalid',r:'Divergência entre recebíveis de arranjos de pagamento e o Saldo Contratual contabilizado no Doc 4010',d:'A soma das operações individualizadas e agregadas das Submodalidades de Operação "1402" (recebíveis de arranjo de pagamento) e "1403" (outros valores a receber relativos a transações de pagamento), Código de Vencimento de "110" até "290" (a Vencer e '},
  'MV15A':{cat:'Vertices por Modalid',r:'Divergência entre Carta de Crédito de importação e o Saldo Contratual contabilizado no Doc 4010',d:'A soma das operações individualizadas e agregadas das Submodalidades de Operação "1505" (carta de crédito de importação), Código de Vencimento de "110" até "290" (a Vencer e Vencidos) e Naturezas da Operação "01", "02", "03", "11", "13", "14" e "15" '},
  'MV18':{cat:'Vertices por Modalid',r:'Divergência entre TVMs e o Saldo Contratual contabilizado no Doc 4010',d:'A soma das operações individualizadas e agregadas das Submodalidades de Operação "1801" (CPR - Cédula de Produto Rural), "1802" (EN - Nota de Exportação), "1803" (Debêntures) e "1804" (Notas Comerciais) e "1899" (Outros) com característica de concess'},
  'MB01':{cat:'Vlr Contabil Bruto p',r:'Divergência entre Adiantamentos a Depositantes e o Valor Contábil Bruto contabilizado no Doc 4010',d:'O somatório do Valor Contábil Bruto do Instrumento Financeiro ("VlrContBr") da Modalidade de Operação "01" (Adiantamento a Depositantes), excluindo operações em prejuízo, ou seja, Código de Vencimento de "110" até "290" (a Vencer e Vencidos) e Nature'},
  'MB02':{cat:'Vlr Contabil Bruto p',r:'Divergência entre Empréstimos e o Valor Contábil Bruto contabilizado no Doc 4010',d:'O somatório do Valor Contábil Bruto do Instrumento Financeiro ("VlrContBr") da Modalidade de Operação "02" (Empréstimos),  excluindo operações em prejuízo, ou seja, Código de Vencimento de "110" até "290" (a Vencer e Vencidos) e Naturezas da Operação'},
  'MB03':{cat:'Vlr Contabil Bruto p',r:'Divergência entre Títulos Descontados e o Valor Contábil Bruto contabilizado no Doc 4010',d:'O somatório do Valor Contábil Bruto do Instrumento Financeiro ("VlrContBr") da Modalidade de Operação "03" (Títulos Descontados),  excluindo operações em prejuízo, ou seja, Código de Vencimento de "110" até "290" (a Vencer e Vencidos) e Naturezas da '},
  'MB04':{cat:'Vlr Contabil Bruto p',r:'Divergência entre Financiamentos e o Valor Contábil Bruto contabilizado no Doc 4010',d:'O somatório do Valor Contábil Bruto do Instrumento Financeiro ("VlrContBr") das Modalidades de Operação "04" (Financiamentos) e "07" (Financiamento com Interveniência),  excluindo operações em prejuízo, ou seja, Código de Vencimento de "110" até "290'},
  'MB05A':{cat:'Vlr Contabil Bruto p',r:'Divergência entre Financimentos à Exportação e o Valor Contábil Bruto contabilizado no Doc 4010',d:'O somatório do Valor Contábil Bruto do Instrumento Financeiro ("VlrContBr") das Submodalidades de Operação "0501", "0504", "0590" e "0599", excluindo operações em prejuízo, ou seja, Código de Vencimento de "110" até "290" (a Vencer e Vencidos) e Natu'},
  'MB05B':{cat:'Vlr Contabil Bruto p',r:'Divergência entre Adiantamento a Contrato de Câmbio e o Valor Contábil Bruto contabilizado no Doc 40',d:'O somatório do Valor Contábil Bruto do Instrumento Financeiro ("VlrContBr") das Submodalidades de Operação "0502" (ACC) e "0503" (ACE), Código de Vencimento de "110" até "290" (a Vencer e Vencidos) e Naturezas da Operação "01", "02", "03", "11", "13"'},
  'MB06':{cat:'Vlr Contabil Bruto p',r:'Divergência entre Financiamentos à Importação e o Valor Contábil Bruto contabilizado no Doc 4010',d:'O somatório do Valor Contábil Bruto do Instrumento Financeiro ("VlrContBr") da Modalidade de Operação "06" (Financiamento à importação), excluindo operações em prejuízo, ou seja, Código de Vencimento de "110" até "290" (a Vencer e Vencidos) e Naturez'},
  'MB08':{cat:'Vlr Contabil Bruto p',r:'Divergência entre Financimento Rural e o Valor Contábil Bruto contabilizado no Doc 4010',d:'O somatório do Valor Contábil Bruto do Instrumento Financeiro ("VlrContBr") da Modalidade de Operação "08" (Financiamento rural), excluindo operações em prejuízo, ou seja, Código de Vencimento de "110" até "290" (a Vencer e Vencidos) e Naturezas da O'},
  'MB09':{cat:'Vlr Contabil Bruto p',r:'Divergência entre Financimento Imobiliário e o Valor Contábil Bruto contabilizado no Doc 4010',d:'O somatório do Valor Contábil Bruto do Instrumento Financeiro ("VlrContBr") da Modalidade de Operação "09" (Financiamento imobiliário), excluindo operações em prejuízo, ou seja, Código de Vencimento de "110" até "290" (a Vencer e Vencidos) e Natureza'},
  'MB11':{cat:'Vlr Contabil Bruto p',r:'Divergência entre Financiamentos de Infra-Estrutura e Desenvolvimento e o Valor Contábil Bruto conta',d:'O somatório do Valor Contábil Bruto do Instrumento Financeiro ("VlrContBr") da Modalidade de Operação "11" (Financiamento de Infra-estrutura e Desenvolvimento), excluindo operações em prejuízo, ou seja, Código de Vencimento de "110" até "290" (a Venc'},
  'MB12':{cat:'Vlr Contabil Bruto p',r:'Divergência entre Arrendamento mercantil e o Valor Contábil Bruto contabilizado no Doc 4010',d:'O somatório do Valor Contábil Bruto do Instrumento Financeiro ("VlrContBr") da Modalidade de Operação "12" (Operações de Arrendamento) e Naturezas da Operação "01", "02", "03", "11", "13", "14" e "15" deve ser menor ou igual ao somatório dos saldos d'},
  'MB13B':{cat:'Vlr Contabil Bruto p',r:'Divergência entre Avais e Fianças Honrados e o Valor Contábil Bruto contabilizado no Doc 4010',d:'O somatório do Valor Contábil Bruto do Instrumento Financeiro ("VlrContBr") da Submodalidade de Operação "1301" (avais e fianças honrados), excluindo operações em prejuízo, ou seja, Código de Vencimento de "110" até "290" (a Vencer e Vencidos) e Natu'},
  'MB13C':{cat:'Vlr Contabil Bruto p',r:'Divergência entre Outros créditos e o Valor Contábil Bruto contabilizado no Doc 4010',d:'O somatório do Valor Contábil Bruto do Instrumento Financeiro ("VlrContBr") das Submodalidades de Operação "1302" (devedores por compra de valores e bens), "1303" (títulos e créditos a receber), "1350" (recebíveis adquiridos), "1390" (financiamento d'},
  'P01':{cat:'Prov Const por Modal',r:'Divergência entre Provisão Constituída a Adiantamentos a Depositantes e o contabilizado no Doc 4010',d:'A soma do Valor da Provisão Constituída ("ProvConsttd") das operações individualizadas e agregadas da Modalidade de Operação "01" (Adiantamento a Depositantes) e Naturezas da Operação "01", "02", "03", "11", "13", "14" e "15" deve ser igual à soma do'},
  'P02':{cat:'Prov Const por Modal',r:'Divergência entre Provisão Constituída a Empréstimos e o contabilizado no Doc 4010',d:'A soma do Valor da Provisão Constituída ("ProvConsttd") das operações individualizadas e agregadas da Modalidade de Operação "02" (Empréstimos) e Naturezas da Operação "01", "02", "03", "11", "13", "14" e "15" deve ser igual à soma do saldo das rubri'},
  'P03':{cat:'Prov Const por Modal',r:'Divergência entre Provisão Constituída de Títulos Descontados e o contabilizado no Doc 4010',d:'A soma do Valor da Provisão Constituída ("ProvConsttd") das operações individualizadas e agregadas da Modalidade de Operação "03" (Títulos Descontados) e Naturezas da Operação "01", "02", "03", "11", "13", "14" e "15" deve ser igual à soma do saldo d'},
  'P04':{cat:'Prov Const por Modal',r:'Divergência entre Provisão Constituída de Financiamentos e o contabilizado no Doc 4010',d:'A soma do Valor da Provisão Constituída ("ProvConsttd") das operações individualizadas e agregadas das Modalidades de Operação "04" (Financiamentos) e "07" (Financiamento com interveniência) e Naturezas da Operação "01", "02", "03", "11", "13", "14" '},
  'P05A':{cat:'Prov Const por Modal',r:'Divergência entre Provisão Constituída a Financimentos à Exportação e o contabilizado no Doc 4010',d:'A soma do Valor da Provisão Constituída ("ProvConsttd") das operações individualizadas e agregadas das Submodalidades de Operação "0501", "0504", "0590" e "0599", e Naturezas da Operação "01", "02", "03", "11", "13", "14" e "15" deve ser igual à soma'},
  'P05B':{cat:'Prov Const por Modal',r:'Divergência entre Provisão Constituída de Adiantamento a Contrato de Câmbio e o contabilizado no Doc',d:'A soma do Valor da Provisão Constituída ("ProvConsttd") das operações individualizadas e agregadas das Submodalidades de Operação "0502" (ACC) e "0503" (ACE), e Naturezas da Operação "01", "02", "03", "11", "13", "14" e "15" deve ser igual à soma do '},
  'P06':{cat:'Prov Const por Modal',r:'Divergência entre Provisão Constituída à Importação e o contabilizado no Doc 4010',d:'A soma do Valor da Provisão Constituída ("ProvConsttd") das operações individualizadas e agregadas da Modalidade de Operação "06" (Financiamento à importação) e Naturezas da Operação "01", "02", "03", "11", "13", "14" e "15" deve ser igual à soma do '},
  'P08':{cat:'Prov Const por Modal',r:'Divergência entre Provisão Constituída a Financimento Rural e o contabilizado no Doc 4010',d:'A soma do Valor da Provisão Constituída ("ProvConsttd") das operações individualizadas e agregadas da Modalidade de Operação "08" (Financiamento rural) e Naturezas da Operação "01", "02", "03", "11", "13", "14" e "15" deve ser igual à soma dos saldos'},
  'P09':{cat:'Prov Const por Modal',r:'Divergência entre Provisão Constituída a Financimento Imobiliário e o contabilizado no Doc 4010',d:'A soma do Valor da Provisão Constituída ("ProvConsttd") das operações individualizadas e agregadas da Modalidade de Operação "09" (Financiamento imobiliário) e Naturezas da Operação "01", "02", "03", "11", "13", "14" e "15" deve ser igual à soma dos '},
  'P11':{cat:'Prov Const por Modal',r:'Divergência entre Provisão Constituída a Financiamentos de Infra-Estrutura e Desenvolvimento e o Sal',d:'A soma do Valor da Provisão Constituída ("ProvConsttd") das operações individualizadas e agregadas da Modalidade de Operação "11" (Financiamento de Infra-estrutura e Desenvolvimento) e Naturezas da Operação "01", "02", "03", "11", "13", "14" e "15" d'},
  'P13A':{cat:'Prov Const por Modal',r:'Divergência entre Provisão Constituída a Cartão de crédito (fatura) e o contabilizado no Doc 4010',d:'A soma do Valor da Provisão Constituída ("ProvConsttd") das operações individualizadas e agregadas da Submodalidade de Operação "1304" (cartão de crédito - compra à vista e parcelado lojista) e Naturezas da Operação "01", "02", "03", "11", "13", "14"'},
  'P13B':{cat:'Prov Const por Modal',r:'Divergência entre Provisão Constituída a Avais e Fianças Honrados e o contabilizado no Doc 4010',d:'A soma do Valor da Provisão Constituída ("ProvConsttd") das operações individualizadas e agregadas da Submodalidade de Operação "1301" (avais e fianças honrados) e Naturezas da Operação "01", "02", "03", "11", "13", "14" e "15" deve ser igual ao sald'},
  'T01':{cat:'Batimento - Totais',r:'O somatório das operações individualizadas com as operações agregadas para as quais sejam informados',d:'sim'},
  'T02':{cat:'Batimento - Totais',r:'O somatório das operações individualizadas com as operações agregadas para as quais sejam informados',d:'sim'},
  'T03':{cat:'Batimento - Totais',r:'O somatório das operações individualizadas com as operações agregadas para as quais sejam informados',d:'sim'},
  'T04':{cat:'Batimento - Totais',r:'O somatório das operações individualizadas com as operações agregadas para as quais sejam informados',d:'sim'},
  'T05':{cat:'Batimento - Totais',r:'O somatório das operações individualizadas com as operações agregadas para as quais sejam informados',d:'não'},
  'T06':{cat:'Batimento - Totais',r:'O somatório das operações individualizadas com as operações agregadas para as quais sejam informados',d:'sim'},
  'T07':{cat:'Batimento - Totais',r:'O somatório das operações individualizadas com as operações agregadas para as quais sejam informados',d:'sim'},
  'T08':{cat:'Batimento - Totais',r:'O somatório das operações individualizadas com as operações agregadas para as quais sejam informados',d:'não'},
  'T09':{cat:'Batimento - Totais',r:'O somatório das operações individualizadas com as operações agregadas para as quais sejam informados',d:'não'},
  'T10':{cat:'Batimento - Totais',r:'O somatório das operações individualizadas com as operações agregadas para as quais sejam informados',d:'não'},
  'R01':{cat:'Batimento - Nível de',r:'O somatório das operações individualizadas com as operações agregadas para as quais sejam informados',d:'sim'},
  'R02':{cat:'Batimento - Nível de',r:'O somatório das operações individualizadas com as operações agregadas para as quais sejam informados',d:'sim'},
  'R03':{cat:'Batimento - Nível de',r:'O somatório das operações individualizadas com as operações agregadas para as quais sejam informados',d:'sim'},
  'R04':{cat:'Batimento - Nível de',r:'O somatório das operações individualizadas com as operações agregadas para as quais sejam informados',d:'sim'},
  'R05':{cat:'Batimento - Nível de',r:'O somatório das operações individualizadas com as operações agregadas para as quais sejam informados',d:'sim'},
  'R06':{cat:'Batimento - Nível de',r:'O somatório das operações individualizadas com as operações agregadas para as quais sejam informados',d:'sim'},
  'R07':{cat:'Batimento - Nível de',r:'O somatório das operações individualizadas com as operações agregadas para as quais sejam informados',d:'sim'},
  'R08':{cat:'Batimento - Nível de',r:'O somatório das operações individualizadas com as operações agregadas para as quais sejam informados',d:'sim'},
  'R09':{cat:'Batimento - Nível de',r:'O somatório das operações individualizadas com as operações agregadas para as quais sejam informados',d:'sim'},
  'M01':{cat:'Batimento - Modalida',r:'O somatório das operações individualizadas com as operações agregadas para as quais sejam informados',d:'sim'},
  'M02':{cat:'Batimento - Modalida',r:'O somatório das operações individualizadas com as operações agregadas para as quais sejam informados',d:'não'},
  'M03':{cat:'Batimento - Modalida',r:'O somatório das operações individualizadas com as operações agregadas para as quais sejam informados',d:'não'},
  'M04':{cat:'Batimento - Modalida',r:'O somatório das operações individualizadas com as operações agregadas para as quais sejam informados',d:'sim'},
  'M05':{cat:'Batimento - Modalida',r:'O somatório das operações individualizadas com as operações agregadas para as quais sejam informados',d:'sim'},
  'M06':{cat:'Batimento - Modalida',r:'O somatório das operações individualizadas com as operações agregadas para as quais sejam informados',d:'sim'},
  'M07':{cat:'Batimento - Modalida',r:'O somatório das operações individualizadas com as operações agregadas para as quais sejam informados',d:'sim'},
  'M08':{cat:'Batimento - Modalida',r:'O somatório das operações individualizadas com as operações agregadas para as quais sejam informados',d:'sim'},
  'M09':{cat:'Batimento - Modalida',r:'O somatório das operações individualizadas com as operações agregadas para as quais sejam informados',d:'sim'},
  'M10':{cat:'Batimento - Modalida',r:'O somatório das operações individualizadas com as operações agregadas para as quais sejam informados',d:'sim'},
  'M11':{cat:'Batimento - Modalida',r:'O somatório das operações individualizadas com as operações agregadas para as quais sejam informados',d:'sim'},
  'M12':{cat:'Batimento - Modalida',r:'O somatório das operações individualizadas com as operações agregadas para as quais sejam informados',d:'sim'},
  'M13':{cat:'Batimento - Modalida',r:'O somatório das operações individualizadas com as operações agregadas para as quais sejam informados',d:'não'},
  'M14':{cat:'Batimento - Modalida',r:'O somatório das operações individualizadas com as operações agregadas para as quais sejam informados',d:'sim'},
  'M15':{cat:'Batimento - Modalida',r:'O somatório das operações individualizadas com as operações agregadas para as quais sejam informados',d:'não'},
  'M16':{cat:'Batimento - Modalida',r:'O somatório das operações individualizadas com as operações agregadas para as quais sejam informados',d:'não'},
  'M17':{cat:'Batimento - Modalida',r:'O somatório das operações individualizadas com as operações agregadas para as quais sejam informados',d:'não'},
  'M18':{cat:'Batimento - Modalida',r:'O somatório das operações individualizadas com as operações agregadas para as quais sejam informados',d:'sim'},
  'M19':{cat:'Batimento - Modalida',r:'O somatório das operações individualizadas com as operações agregadas para as quais sejam informados',d:'sim'},
  'M20':{cat:'Batimento - Modalida',r:'O somatório das operações individualizadas com as operações agregadas para as quais sejam informados',d:'sim'},
  'M21':{cat:'Batimento - Modalida',r:'O somatório das operações individualizadas com as operações agregadas para as quais sejam informados',d:'não'},
  'M22':{cat:'Batimento - Modalida',r:'O somatório das operações individualizadas com as operações agregadas para as quais sejam informados',d:'não'},
  'M23':{cat:'Batimento - Modalida',r:'O somatório das operações individualizadas com as operações agregadas para as quais sejam informados',d:'sim'},
  'M24':{cat:'Batimento - Modalida',r:'O somatório das operações individualizadas com as operações agregadas para as quais sejam informados',d:'sim'},
}

type CadocCode = '3040'|'3044'|'3060'|'4010'|'6334'
interface ValErr { cod:string; msg:string; op?:string; tipo?:string; ruleRef?:string }
interface AuditEntry { ts:string; acao:string; cadoc:string; cnpj:string; dtBase:string; status:string; nErros:number; nAvisos:number }

const C = {
  grn:'#0a7c5c',grnb:'rgba(10,124,92,.08)',grnbrd:'rgba(10,124,92,.2)',
  txt:'#0d1117',txt2:'#1e3a5f',txt3:'#5a6e8a',
  bg:'#f5f6f8',bg2:'#fff',bg3:'#eef0f3',brd:'#dde1e9',brd2:'#c8cdd8',
  blu:'#1d5fcc',blub:'rgba(29,95,204,.08)',blubrd:'rgba(29,95,204,.18)',
  amb:'#b45309',ambb:'rgba(180,83,9,.08)',ambbrd:'rgba(180,83,9,.2)',
  red:'#c0392b',redb:'rgba(192,57,43,.06)',redbrd:'rgba(192,57,43,.18)',
  pnk:'#7c3aed',pnkb:'rgba(124,58,237,.06)',pnkbrd:'rgba(124,58,237,.18)',
  cyn:'#0e7490',cynb:'rgba(14,116,144,.06)',cynbrd:'rgba(14,116,144,.18)',
}

const CADOCS_LIST = [
  {code:'3040' as CadocCode, label:'SCR Operações de Crédito', icon:'📊', color:C.blu, per:'Mensal · D+5', desc:'Posições individualizadas e agregadas de crédito. Validações: B01-B19, C01-C75, S01-S100, I01-I15, A01-A14, MV01-MV19, MB01-MB13, M01-M24'},
  {code:'3044' as CadocCode, label:'SCR Eventos de Crédito',   icon:'⚡', color:C.pnk, per:'Por evento · D+5',desc:'Pagamentos, concessões, cessões e aquisições de crédito. Regras T01-T13, B01.'},
  {code:'3060' as CadocCode, label:'SCR Taxas de Juros',       icon:'📈', color:C.grn, per:'Semanal · D+5',  desc:'Percentis de taxas de juros por modalidade. Validação de estrutura e domínios.'},
  {code:'4010' as CadocCode, label:'Balancete COSIF',          icon:'🏦', color:C.amb, per:'Mensal · D+9',  desc:'Balancete patrimonial no Plano COSIF. Reconciliação inter-CADOC com 3040.'},
  {code:'6334' as CadocCode, label:'Cartões / Credenciadores', icon:'💳', color:C.cyn, per:'Trimestral',    desc:'ASPB034 — 10 arquivos TXT posicionais ISO-8859-1. Valida leiaute e domínios.'},
]

// ── Templates ─────────────────────────────────────────────────────────────────
const TEMPLATES:Record<CadocCode,object> = {
'3044':{cnpjIF:'17887874',dataHoraRemessa:'2026-03-17 10:00:00',envia3050:'N',operacoes:[
  {_c:'Pagamento normal',acao:1,ipoc:'1788787402112620317C0001',saldoDevedor:45000,dataSaldoDevedor:'2026-03-14',atraso:'N',pagamentos:[{acao:1,data:'2026-03-14',valor:5000}]},
  {_c:'Concessão nova op.',acao:1,ipoc:'1788787402112620317C0002',saldoDevedor:80000,dataSaldoDevedor:'2026-03-12',atraso:'N',concessoes:[{acao:1,data:'2026-03-12',valor:80000}]},
  {_c:'Pagamento c/ atraso',acao:1,ipoc:'1788787402112620317C0003',saldoDevedor:12000,dataSaldoDevedor:'2026-03-11',atraso:'S',pagamentos:[{acao:1,data:'2026-03-11',valor:1500}]},
  {_c:'Liquidação total',acao:1,ipoc:'1788787402112620317C0004',saldoDevedor:0,dataSaldoDevedor:'2026-03-15',atraso:'N',pagamentos:[{acao:1,data:'2026-03-15',valor:2500}]},
  {_c:'Exclusão de IPOC',acao:2,ipoc:'1788787402112620317C9999'},
]},
'3040':{
  cabecalho:{CNPJ:'12345678',DtBase:'2026-01-31',Parte:'1',Remessa:'1',TpArq:'M',NomeResp:'João Silva',EmailResp:'joao.silva@banco.com.br',TelResp:'11999990000',TotalCli:2,MetodApPE:'S',MetodDifTJE:'N'},
  clientes:[
    {Cd:'12345678000190',Tp:'2',IniRelactCli:'2020-01-01',Autorzc:'S',ClassCli:'A',TpCtrl:'1',PorteCli:'3',FatAnual:5000000,operacoes:[
      {IPOC:'1234567800019020200101001',Contrt:'CONT-2024-001',Mod:'0202',NatuOp:'01',OrigemRec:'1',Indx:'3',VarCamb:'0',CEP:'01310100',TaxEft:18.5,DtContr:'2024-06-01',DtVencOp:'2027-06-01',VlrContr:50000,ClassOp:'A',ProvConsttd:500,DiaAtraso:0,vencimentos:{v110:12000,v120:12000,v130:12000,v140:12000,v150:2000},ContInstFinRes4966:{ClasAtFin:'1',CartProvMin:'A',VlrContBr:50000,VlrPerdaAcum:0}}
    ]},
    {Cd:'98765432100',Tp:'1',IniRelactCli:'2021-03-15',Autorzc:'S',ClassCli:'AA',operacoes:[
      {IPOC:'1234567800019020210315002',Contrt:'CONT-2024-002',Mod:'0202',NatuOp:'01',OrigemRec:'1',Indx:'3',VarCamb:'0',CEP:'01310100',TaxEft:12,DtContr:'2024-01-15',DtVencOp:'2026-01-15',VlrContr:15000,ClassOp:'AA',ProvConsttd:0,DiaAtraso:0,vencimentos:{v110:5000,v120:5000,v130:5000},ContInstFinRes4966:{ClasAtFin:'1',CartProvMin:'AA',VlrContBr:15000,VlrPerdaAcum:0}}
    ]}
  ]},
'3060':{dataBase:'202601',codigoDocumento:'3060',cnpj:'37485267',tipoEnvio:'I',percentil25:12.5,percentil50:28.75,percentil75:65.3,percentil100:98.45},
'4010':{cabecalho:{codigoDocumento:'4010',cnpj:'12345678',dataBase:'202601',tipoRemessa:'N'},contas:[{codigoConta:'1.0.0.00.00-0',saldo:1500000},{codigoConta:'1.1.0.00.00-1',saldo:800000},{codigoConta:'2.0.0.00.00-3',saldo:1200000},{codigoConta:'3.0.0.00.00-6',saldo:250000}]},
'6334':{database:{dataGeracao:'20260301',ispb:'17887874',dataBase:'202603'},segmentos:[{nome:'Bares e Restaurantes',descricao:'Restaurantes, bares, pubs e fast food',codigo:'402'}],conccred:[{ano:2026,trimestre:1,bandeira:'01',funcao:'C',qtdCredenciados:1000,qtdAtivos:800,vlrTransacoes:42500000,qtdTransacoes:14}],intercam:[{ano:2026,trimestre:1,produto:'32',modalidade:'P',funcao:'H',bandeira:'99',formaCaptura:'1',parcelas:'01',segmento:'402',tarifaIntercambio:'1014',vlrTransacoes:'000004863349100',qtdTransacoes:'000000014271'}],desconto:[{ano:2026,trimestre:1,funcao:'C',bandeira:'02',formaCaptura:'1',parcelas:'01',segmento:'402',txMedia:'0297',txMin:'0300',txMax:'0300',txDesvioPad:'0003',vlrTransacoes:'000000000029700',qtdTransacoes:'000000000003'}],infresta:[{ano:2026,trimestre:1,uf:'SC',totalEstab:1,capManual:0,capElet:1,capRemota:0}],infrterm:[{ano:2026,trimestre:1,uf:'SC',totalPOS:1,posComp:0,posChip:0,totalPDV:0}],lucrcred:[{ano:2026,trimestre:1,recTaxaDesc:'000000000000',recAlugEquip:'000000000000',recOutras:'000000000000',custIntercambio:'000000000000',custMktProp:'000000000000',custBandeiras:'000000000000',custRiscos:'000000000000',custFrontBack:'000000000000',custOutros:'000000000000'}],ranking:[],contatos:[{ano:2026,trimestre:1,tipo:'D',nome:'João Silva Santos',cargo:'Diretor Executivo',telefone:'+5511999990000',email:'joao.silva@banco.com.br'},{ano:2026,trimestre:1,tipo:'T',nome:'Maria Costa',cargo:'Gerente Tecnologia',telefone:'+5511999991111',email:'maria.costa@banco.com.br'},{ano:2026,trimestre:1,tipo:'I',nome:'',cargo:'',telefone:'',email:'contato@banco.com.br'}]},
}

// ══════════════════════════════════════════════════════════════════
// SCR3040 VALIDATION ENGINE — aplica criticas BCB reais
// ══════════════════════════════════════════════════════════════════
function validate3040(obj: any): ValErr[] {
  const erros: ValErr[] = []
  const e = (cod:string, msg:string, op?:string) => {
    const rule = SCR3040_RULES[cod]
    erros.push({cod, msg, op, tipo:'erro', ruleRef: rule ? `${rule.cat}: ${rule.r}` : undefined })
  }
  const w = (cod:string, msg:string, op?:string) => {
    const rule = SCR3040_RULES[cod]
    erros.push({cod, msg, op, tipo:'aviso', ruleRef: rule ? `${rule.cat}: ${rule.r}` : undefined })
  }

  // B01 — estrutura XML
  if (!obj.cabecalho) { e('B01','Elemento raiz <Doc3040> / cabecalho ausente'); return erros }
  const h = obj.cabecalho
  if (!h.CNPJ)      e('B01','cabecalho.CNPJ ausente — campo obrigatório XSD')
  if (!h.DtBase)    e('B01','cabecalho.DtBase ausente')
  if (!h.MetodApPE) e('B01','cabecalho.MetodApPE ausente')

  // B04 — data-base no horizonte permitido (24 meses)
  if (h.DtBase) {
    const dtBase = new Date(h.DtBase + 'T00:00:00')
    const lim = new Date(); lim.setMonth(lim.getMonth()-24)
    if (dtBase < lim) e('B04',`DtBase ${h.DtBase} fora do horizonte permitido (24 meses)`)
  }

  // B07 — composição da remessa
  if (h.Parte && h.Remessa) {
    const parte = parseInt(h.Parte), remessa = parseInt(h.Remessa)
    if (parte < 1) e('B07','Parte deve ser >= 1')
    if (remessa < 1) e('B07','Remessa deve ser >= 1')
  }

  if (!Array.isArray(obj.clientes)) { e('B01','clientes deve ser array'); return erros }

  // I03 — cliente não pode ser duplicado
  const cliKeys = new Set<string>()
  obj.clientes.forEach((cli:any, ci:number) => {
    const lbl = `Cli#${ci+1} Cd=${cli.Cd||'?'}`
    const cliKey = `${cli.Cd}|${cli.Tp}`
    if (cliKeys.has(cliKey)) e('I03',`Cliente duplicado: Cd=${cli.Cd} Tp=${cli.Tp}`,lbl)
    cliKeys.add(cliKey)

    // C01 — campos obrigatórios PJ
    if (cli.Tp === '2' && !cli.Cd?.match(/\d{14}/)) w('C01','PJ (Tp=2) deve ter CNPJ (14 dígitos) em Cd',lbl)
    if (!cli.Tp) e('B01','Tipo do cliente (Tp) ausente',lbl)
    if (!cli.ClassCli) e('B01','Classificação do cliente (ClassCli) ausente',lbl)

    if (!Array.isArray(cli.operacoes)) { e('B01','operacoes deve ser array',lbl); return }

    const opKeys = new Set<string>()
    cli.operacoes.forEach((op:any, oi:number) => {
      const olbl = `${lbl} Op#${oi+1} IPOC=${op.IPOC||'?'}`

      // I04 — operação duplicada
      const opKey = `${op.Contrt}|${op.Mod}`
      if (opKeys.has(opKey)) e('I04',`Operação duplicada: Contrt=${op.Contrt} Mod=${op.Mod}`,olbl)
      opKeys.add(opKey)

      // B01 campos obrigatórios da operação
      if (!op.IPOC)    e('B01','IPOC ausente',olbl)
      if (!op.Mod)     e('B01','Modalidade (Mod) ausente',olbl)
      if (!op.NatuOp)  e('B01','Natureza da Operação (NatuOp) ausente',olbl)
      if (op.VlrContr === undefined) e('B01','Valor do Contrato (VlrContr) ausente',olbl)
      if (!op.DtContr) e('B01','Data do Contrato (DtContr) ausente',olbl)
      if (!op.ClassOp) e('B01','Classificação da Operação (ClassOp) ausente',olbl)
      if (op.TaxEft === undefined) w('C02','Taxa Efetiva (TaxEft) não informada',olbl)

      // F01 — taxa efetiva anual formato
      if (op.TaxEft !== undefined && (op.TaxEft < 0 || op.TaxEft > 9999)) e('F01',`TaxEft=${op.TaxEft} fora do intervalo permitido (0-9999%aa)`,olbl)

      // F02 — datas formato AAAA-MM-DD
      const dateFields: [string,string][] = [['DtContr',op.DtContr],['DtVencOp',op.DtVencOp]]
      dateFields.forEach(([fn,fv]) => {
        if (fv && !/^\d{4}-\d{2}-\d{2}$/.test(fv)) e('F02',`${fn}="${fv}" deve ter formato AAAA-MM-DD`,olbl)
      })

      // S01 — DetCli deve ter 8 primeiros dígitos = Cd do cliente
      if (op.DetCli && cli.Cd && !op.DetCli.startsWith(cli.Cd.substring(0,8))) e('S01',`DetCli="${op.DetCli}" — 8 primeiros dígitos devem ser = Cd do cliente "${cli.Cd.substring(0,8)}"`,olbl)

      // S05 — Limite de Crédito (mod 19xx) só pode ter vencimentos 20 e 40
      if (op.Mod && op.Mod.startsWith('19') && op.vencimentos) {
        const vencKeys = Object.keys(op.vencimentos)
        const invalid = vencKeys.filter(k => !k.startsWith('v20') && !k.startsWith('v40'))
        if (invalid.length) e('S05',`Modalidade 19xx (Limite de Crédito) só admite vencimentos 20 e 40 — encontrado: ${invalid.join(',')}`,olbl)
      }

      // I01 — ClassOp x ProvConsttd
      if (op.ClassOp && op.ProvConsttd !== undefined && op.VlrContr) {
        const ratios: Record<string,number> = {AA:0,A:0.005,B:0.01,C:0.03,D:0.1,E:0.3,F:0.5,G:0.7,H:1}
        const minPct = ratios[op.ClassOp] ?? 0
        const minProv = minPct * op.VlrContr
        if (op.ProvConsttd < minProv * 0.99) e('I01',`ClassOp=${op.ClassOp} exige ProvConsttd >= ${(minPct*100).toFixed(1)}% × VlrContr (${minProv.toFixed(2)}) — informado: ${op.ProvConsttd}`,olbl)
      }

      // I02 — ClassOp x vencimentos
      if (op.ClassOp && op.vencimentos) {
        const vencNums = Object.keys(op.vencimentos).map(k => parseInt(k.replace('v','')))
        if (['E','F','G','H'].includes(op.ClassOp)) {
          if (vencNums.some(v => v >= 210)) w('I02',`ClassOp=${op.ClassOp} (alto risco) não deveria ter vencimentos >= 210`,olbl)
        }
      }

      // S02 — Vendor precisa de informação adicional
      if (['0404','0207'].includes(op.Mod||'')){
        const hasInf0201 = (op.infAdicionais||[]).some((i:any)=>i.Tp==='0201')
        if (!hasInf0201) e('S02',`Modalidade ${op.Mod} (Vendor) requer InfAdicional Tp=0201`,olbl)
      }

      // MV batimento 3040 × 4010 (alerta — requer dados externos)
      const modToMV: Record<string,string> = {'01':'MV01','02':'MV02','03':'MV03','04':'MV04','05':'MV05A'}
      if (op.Mod && modToMV[op.Mod.substring(0,2)]) {
        w(modToMV[op.Mod.substring(0,2)], `Batimento 3040×4010: somatório da Mod ${op.Mod} deve bater com COSIF correspondente no Doc 4010`,olbl)
      }
    })
  })
  return erros
}

function validate3044(text:string): ValErr[] {
  const erros: ValErr[] = []
  const e=(cod:string,msg:string,op?:string)=>{const r=SCR3040_RULES[cod];erros.push({cod,msg,op,tipo:'erro',ruleRef:r?`${r.cat}: ${r.r}`:undefined})}
  const w=(cod:string,msg:string,op?:string)=>{const r=SCR3040_RULES[cod];erros.push({cod,msg,op,tipo:'aviso',ruleRef:r?`${r.cat}: ${r.r}`:undefined})}
  let doc:any; try{doc=JSON.parse(text)}catch(ex:any){e('B01','JSON inválido: '+ex.message);return erros}
  const cnpjIF=String(doc.cnpjIF||''). trim()
  const dhr=String(doc.dataHoraRemessa||''). trim()
  const env=String(doc.envia3050||''). trim()
  if(!cnpjIF)e('B01','cnpjIF ausente')
  else if(!/^\d{8}$/.test(cnpjIF))e('B01','cnpjIF deve ter 8 dígitos — encontrado: '+cnpjIF)
  if(!dhr)e('B01','dataHoraRemessa ausente')
  else{const dt=new Date(dhr.replace(' ','T'));if(!isNaN(dt.getTime())&&dt>new Date())e('T04','dataHoraRemessa futura: '+dhr)}
  if(!env)e('B01','envia3050 ausente')
  else if(!['S','N'].includes(env))e('B01','envia3050 deve ser S ou N')
  const ops=Array.isArray(doc.operacoes)?doc.operacoes:[]
  if(!ops.length)w('B01','Lista de operações vazia')
  const pD=(s:string)=>s?new Date(s+'T00:00:00'):null
  const is24m=(d:Date)=>{const l=new Date();l.setMonth(l.getMonth()-24);return d>=l}
  const pagK:Record<string,number>={},conK:Record<string,number>={}
  ops.forEach((op:any,i:number)=>{
    const acao=op.acao,ipoc=String(op.ipoc||''). trim(),lbl=`#${i+1} IPOC ${ipoc.substring(0,16)}…`
    if(!acao)e('B01','acao ausente',lbl)
    if(acao===2){if(!ipoc)e('B01','acao=2 requer ipoc',lbl);return}
    if(acao===1){
      if(!ipoc)e('B01','ipoc ausente',lbl)
      if(op.saldoDevedor===undefined)e('B01','saldoDevedor ausente',lbl)
      if(!op.dataSaldoDevedor)e('B01','dataSaldoDevedor ausente',lbl)
      if(!op.atraso)e('B01','atraso ausente (S ou N)',lbl)
      else if(!['S','N'].includes(op.atraso))e('B01','atraso inválido: '+op.atraso,lbl)
      if(env==='S'&&!op.class3050)e('T08','class3050 obrigatório quando envia3050=S',lbl)
      if(env==='N'&&op.class3050)e('T07','class3050 proibido quando envia3050=N',lbl)
    }
    const dtS=pD(op.dataSaldoDevedor)
    if(dtS&&!is24m(dtS))e('T13','dataSaldoDevedor fora dos últimos 24 meses: '+op.dataSaldoDevedor,lbl)
    if(dtS&&dhr){const dR=new Date(dhr.replace(' ','T'));if(!isNaN(dR.getTime())&&dR<dtS)e('T01','dataHoraRemessa anterior a dataSaldoDevedor',lbl)}
    ;(op.pagamentos||[]).forEach((p:any,pi:number)=>{
      const pl=lbl+' pag#'+(pi+1)
      if((p.acao===1||p.acao===3)&&(!p.data||p.valor===undefined)){if(!p.data)e('B01','data ausente no pagamento',pl);if(p.valor===undefined)e('B01','valor ausente no pagamento',pl)}
      const dp=pD(p.data)
      if(dp&&!is24m(dp))e('T11','data de pagamento fora dos últimos 24 meses',pl)
      if(dp&&dtS&&dp>dtS)e('T02','pagamento posterior a dataSaldoDevedor',pl)
      if(p.data&&p.acao!==2){const k=ipoc+'|'+p.data;pagK[k]=(pagK[k]||0)+1;if(pagK[k]>1)e('T05','mais de um pagamento para o mesmo IPOC na data '+p.data,pl)}
    })
    ;(op.concessoes||[]).forEach((c:any,ci:number)=>{
      const cl=lbl+' con#'+(ci+1)
      const dc=pD(c.data)
      if(dc&&!is24m(dc))e('T12','data de concessão fora dos últimos 24 meses',cl)
      if(dc&&dtS&&dc>dtS)e('T03','concessão posterior a dataSaldoDevedor',cl)
      if(c.data&&c.acao===1){const k=ipoc+'|'+c.data;conK[k]=(conK[k]||0)+1;if(conK[k]>1)e('T06','mais de uma concessão na data '+c.data,cl)}
    })
  })
  return erros
}

function validate3060(obj:any):ValErr[]{
  const erros:ValErr[]=[]
  const e=(cod:string,msg:string)=>erros.push({cod,msg,tipo:'erro'})
  const w=(cod:string,msg:string)=>erros.push({cod,msg,tipo:'aviso'})
  if(!obj.cnpj)e('B01','cnpj ausente')
  if(!obj.dataBase)e('B01','dataBase ausente')
  if(obj.percentil25===undefined)e('B01','percentil25 ausente')
  if(obj.percentil50===undefined)e('B01','percentil50 ausente')
  if(obj.percentil75===undefined)e('B01','percentil75 ausente')
  if(obj.percentil100===undefined)e('B01','percentil100 ausente')
  if(obj.percentil25!==undefined&&obj.percentil50!==undefined&&obj.percentil25>obj.percentil50)e('F01',`percentil25 (${obj.percentil25}) > percentil50 (${obj.percentil50}) — inválido`)
  if(obj.percentil75!==undefined&&obj.percentil100!==undefined&&obj.percentil75>obj.percentil100)e('F01',`percentil75 (${obj.percentil75}) > percentil100 (${obj.percentil100}) — inválido`)
  if(obj.percentil100!==undefined&&obj.percentil100>999)w('F01','percentil100 > 999% — valor incomum')
  return erros
}

function validate4010(obj:any):ValErr[]{
  const erros:ValErr[]=[]
  const e=(cod:string,msg:string)=>erros.push({cod,msg,tipo:'erro'})
  if(!obj.cabecalho)e('B01','cabecalho ausente')
  else{if(!obj.cabecalho.cnpj)e('B01','cabecalho.cnpj ausente');if(!obj.cabecalho.dataBase)e('B01','cabecalho.dataBase ausente')}
  if(!Array.isArray(obj.contas))e('B01','contas deve ser array')
  else if(!obj.contas.length)erros.push({cod:'W01',msg:'contas está vazia',tipo:'aviso'})
  else obj.contas.forEach((c:any,i:number)=>{
    if(!c.codigoConta)e('B01',`contas[${i}].codigoConta ausente`)
    if(c.saldo===undefined)e('B01',`contas[${i}].saldo ausente`)
    if(c.saldo!==undefined&&isNaN(Number(c.saldo)))e('F01',`contas[${i}].saldo="${c.saldo}" não é número`)
    // Valida formato COSIF X.X.X.XX.XX-X
    if(c.codigoConta&&!/^\d\.\d\.\d\.\d{2}\.\d{2}-\d$/.test(c.codigoConta))erros.push({cod:'F03',msg:`codigoConta="${c.codigoConta}" não segue formato COSIF (X.X.X.XX.XX-X)`,tipo:'aviso'})
  })
  return erros
}

function validate6334(obj:any):ValErr[]{
  const erros:ValErr[]=[]
  const e=(cod:string,msg:string)=>erros.push({cod,msg,tipo:'erro'})
  const w=(cod:string,msg:string)=>erros.push({cod,msg,tipo:'aviso'})
  if(!obj.database?.dataBase)e('B01','database.dataBase ausente')
  if(!obj.database?.ispb)e('B01','database.ispb ausente')
  const mesDB=parseInt(String(obj.database?.dataBase||''). substring(4,6)||'0')
  if(![3,6,9,12].includes(mesDB))e('VCRD0029',`dataBase mês=${mesDB} deve ser 03/06/09/12 (trimestral)`)
  if(!obj.contatos?.length)e('C47','CONTATOS obrigatório: 1 Diretor (D) + 2 Técnicos (T) + 1 e-mail institucional (I)')
  else{
    if(!obj.contatos.some((c:any)=>c.tipo==='D'))e('C47','Falta contato Diretor (tipo=D)')
    if(!obj.contatos.some((c:any)=>c.tipo==='I'))w('C47','Falta e-mail institucional (tipo=I)')
    if(obj.contatos.filter((c:any)=>c.tipo==='T').length<2)w('C47',`Apenas ${obj.contatos.filter((c:any)=>c.tipo==='T').length} Técnico(s) — recomendado 2`)
    obj.contatos.forEach((c:any,i:number)=>{
      if(c.tipo==='I'&&c.email&&!c.email.includes('@'))e('C47',`contatos[${i}] tipo=I email "${c.email}" inválido (sem @)`)
    })
  }
  if(!obj.conccred?.length)w('B17','CONCCRED sem registros')
  else{
    const BV=['01','02','03','04','05','06','07','08','99']
    obj.conccred.forEach((r:any,i:number)=>{
      if(!BV.includes(String(r.bandeira)))w('VCRD',`conccred[${i}].bandeira="${r.bandeira}" fora do domínio`)
      if(r.qtdAtivos>r.qtdCredenciados)e('VCRD',`conccred[${i}] qtdAtivos (${r.qtdAtivos}) > qtdCredenciados (${r.qtdCredenciados})`)
    })
  }
  const MESES_TRIM=[3,6,9,12]
  ;[...( obj.intercam||[]),...(obj.desconto||[]),...(obj.conccred||[])].forEach((r:any,i:number)=>{
    if(r.trimestre&&![1,2,3,4].includes(r.trimestre))w('VCRD',`registro ${i} trimestre=${r.trimestre} deve ser 1/2/3/4`)
  })
  return erros
}

// ── Generators (XML/TXT) ────────────────────────────────────────────────────
const xa=(n:string,v:any)=>v!==undefined&&v!==null&&v!=='' ? ` ${n}="${String(v).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;')}"` : ''
function gen3040(obj:any):string{const h=obj.cabecalho||{};let x=`<?xml version="1.0" encoding="UTF-8"?>\n<Doc3040`+xa('CNPJ',h.CNPJ)+xa('DtBase',h.DtBase)+xa('Parte',h.Parte||'1')+xa('Remessa',h.Remessa||'1')+xa('TpArq',h.TpArq||'M')+xa('NomeResp',h.NomeResp)+xa('EmailResp',h.EmailResp)+xa('TelResp',h.TelResp)+xa('TotalCli',(obj.clientes||[]).length)+xa('MetodApPE',h.MetodApPE||'S')+xa('MetodDifTJE',h.MetodDifTJE||'N')+'>\n'
;(obj.clientes||[]).forEach((cli:any)=>{x+='  <Cli'+xa('Cd',cli.Cd)+xa('Tp',cli.Tp)+xa('IniRelactCli',cli.IniRelactCli)+xa('Autorzc',cli.Autorzc)+xa('ClassCli',cli.ClassCli)+(cli.TpCtrl?xa('TpCtrl',cli.TpCtrl):'')+(cli.PorteCli?xa('PorteCli',cli.PorteCli):'')+(cli.FatAnual!==undefined?xa('FatAnual',cli.FatAnual):'')+'>\n'
;(cli.operacoes||[]).forEach((op:any)=>{x+='    <Op'+xa('IPOC',op.IPOC)+xa('Contrt',op.Contrt)+xa('Mod',op.Mod)+xa('NatuOp',op.NatuOp)+xa('OrigemRec',op.OrigemRec)+xa('Indx',op.Indx)+xa('VarCamb',op.VarCamb)+xa('CEP',op.CEP)+xa('TaxEft',op.TaxEft)+xa('DtContr',op.DtContr)+(op.VlrContr!==undefined?xa('VlrContr',op.VlrContr):'')+xa('DtVencOp',op.DtVencOp)+xa('ClassOp',op.ClassOp)+(op.ProvConsttd!==undefined?xa('ProvConsttd',op.ProvConsttd):'')+'>\n'
const v=op.vencimentos||{};if(Object.keys(v).length>0){x+='      <Venc';Object.entries(v).forEach(([k,vv])=>{x+=` ${k}="${vv}"`});x+=' />\n'}
const cif=op.ContInstFinRes4966;if(cif)x+='      <ContInstFinRes4966'+xa('ClasAtFin',cif.ClasAtFin)+xa('CartProvMin',cif.CartProvMin)+(cif.VlrContBr!==undefined?xa('VlrContBr',cif.VlrContBr):'')+(cif.VlrPerdaAcum!==undefined?xa('VlrPerdaAcum',cif.VlrPerdaAcum):'')+' />\n'
x+='    </Op>\n'});x+='  </Cli>\n'});return x+'</Doc3040>'}
function gen3060(obj:any):string{const e=(s:any)=>String(s||''). replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');return `<?xml version="1.0" encoding="iso-8859-1" ?>\n<documento dataBase="${e(obj.dataBase)}" codigoDocumento="${e(obj.codigoDocumento||'3060')}" cnpj="${e(obj.cnpj)}" tipoEnvio="${e(obj.tipoEnvio||'I')}">\n  <percentil25>${obj.percentil25}</percentil25>\n  <percentil50>${obj.percentil50}</percentil50>\n  <percentil75>${obj.percentil75}</percentil75>\n  <percentil100>${obj.percentil100}</percentil100>\n</documento>`}
function gen4010(obj:any):string{const e=(s:any)=>String(s||''). replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');const h=obj.cabecalho||{};let x=`<?xml version="1.0" encoding="UTF-8"?>\n<documento codigoDocumento="${e(h.codigoDocumento||'4010')}" cnpj="${e(h.cnpj)}" dataBase="${e(h.dataBase)}" tipoRemessa="${e(h.tipoRemessa||'N')}">\n  <contas>\n`;(obj.contas||[]).forEach((c:any)=>{x+=`    <conta codigoConta="${e(c.codigoConta)}" saldo="${c.saldo}" />\n`});return x+'  </contas>\n</documento>'}
function gen6334(obj:any):Record<string,string>{
  const pad=(s:any,n:number)=>String(s||''). padEnd(n).substring(0,n)
  const dg=obj.database||{},dtG=String(dg.dataGeracao||new Date().toISOString().slice(0,10).replace(/-/g,'')).substring(0,8)
  const ispb=String(dg.ispb||''). padStart(8,'0').substring(0,8),dtB=String(dg.dataBase||'')
  const T:Record<string,string>={}
  T['DATABASE']=`DATABASE${dtG}${ispb}${dtB}  `
  const segs=obj.segmentos||[];let sT=`SEGMENTO${dtG}${ispb}${String(segs.length).padStart(8,'0')}\n`
  segs.forEach((s:any)=>{sT+=pad(s.nome||'',50)+pad(s.descricao||'',250)+String(s.codigo||''). padStart(3,'0')+'\n'})
  T['SEGMENTO']=sT.trimEnd()
  const ccs=obj.conccred||[];let cT=`CONCCRED${dtG}${ispb}${String(ccs.length).padStart(8,'0')}\n`
  ccs.forEach((r:any)=>{cT+=String(r.ano||2026)+String(r.trimestre||1)+String(r.bandeira||'99'). padStart(2,'0')+String(r.funcao||'C')+String(r.qtdCredenciados||0).padStart(9,'0')+String(r.qtdAtivos||0).padStart(9,'0')+String(Math.round((r.vlrTransacoes||0)*100)).padStart(15,'0')+String(r.qtdTransacoes||0).padStart(12,'0')+'\n'})
  T['CONCCRED']=cT.trimEnd()
  const lcs=obj.lucrcred||[{}];let lT=`LUCRCRED${dtG}${ispb}${String(lcs.length).padStart(8,'0')}\n`
  lcs.forEach((r:any)=>{lT+=String(r.ano||2026)+String(r.trimestre||1)+String(r.recTaxaDesc||'000000000000')+String(r.recAlugEquip||'000000000000')+String(r.recOutras||'000000000000')+String(r.custIntercambio||'000000000000')+String(r.custMktProp||'000000000000')+String(r.custBandeiras||'000000000000')+String(r.custRiscos||'000000000000')+String(r.custFrontBack||'000000000000')+String(r.custOutros||'000000000000')+'\n'})
  T['LUCRCRED']=lT.trimEnd()
  const ds=obj.desconto||[];let dT=`DESCONTO${dtG}${ispb}${String(ds.length).padStart(8,'0')}\n`
  ds.forEach((r:any)=>{dT+=String(r.ano||2026)+String(r.trimestre||1)+String(r.funcao||'C')+String(r.bandeira||'99'). padStart(2,'0')+String(r.formaCaptura||'1')+String(r.parcelas||'01'). padStart(2,'0')+String(r.segmento||'401'). padStart(3,'0')+String(r.txMedia||'0000'). padStart(4,'0')+String(r.txMin||'0000'). padStart(4,'0')+String(r.txMax||'0000'). padStart(4,'0')+String(r.txDesvioPad||'0000'). padStart(4,'0')+String(r.vlrTransacoes||'000000000000000'). padStart(15,'0')+String(r.qtdTransacoes||'000000000000'). padStart(12,'0')+'\n'})
  T['DESCONTO']=dT.trimEnd()
  const ics=obj.intercam||[];let iT=`INTERCAM${dtG}${ispb}${String(ics.length).padStart(8,'0')}\n`
  ics.forEach((r:any)=>{iT+=String(r.ano||2026)+String(r.trimestre||1)+String(r.produto||'32'). padStart(2,'0')+String(r.modalidade||'P')+String(r.funcao||'H')+String(r.bandeira||'99'). padStart(2,'0')+String(r.formaCaptura||'1')+String(r.parcelas||'01'). padStart(2,'0')+String(r.segmento||'401'). padStart(3,'0')+String(r.tarifaIntercambio||'0000'). padStart(4,'0')+String(r.vlrTransacoes||'000000000000000'). padStart(15,'0')+String(r.qtdTransacoes||'000000000000'). padStart(12,'0')+'\n'})
  T['INTERCAM']=iT.trimEnd()
  const ies=obj.infresta||[];let ieT=`INFRESTA${dtG}${ispb}${String(ies.length).padStart(8,'0')}\n`
  ies.forEach((r:any)=>{ieT+=String(r.ano||2026)+String(r.trimestre||1)+pad(r.uf||'SP',2)+String(r.totalEstab||0).padStart(8,'0')+String(r.capManual||0).padStart(8,'0')+String(r.capElet||0).padStart(8,'0')+String(r.capRemota||0).padStart(8,'0')+'\n'})
  T['INFRESTA']=ieT.trimEnd()
  const its=obj.infrterm||[];let itT=`INFRTERM${dtG}${ispb}${String(its.length).padStart(8,'0')}\n`
  its.forEach((r:any)=>{itT+=String(r.ano||2026)+String(r.trimestre||1)+pad(r.uf||'SP',2)+String(r.totalPOS||0).padStart(8,'0')+String(r.posComp||0).padStart(8,'0')+String(r.posChip||0).padStart(8,'0')+String(r.totalPDV||0).padStart(8,'0')+'\n'})
  T['INFRTERM']=itT.trimEnd()
  const cts=obj.contatos||[];let ctT=`CONTATOS${dtG}${ispb}${String(cts.length).padStart(8,'0')}\n`
  cts.forEach((r:any)=>{ctT+=String(r.ano||2026)+String(r.trimestre||1)+String(r.tipo||'T')+pad(r.nome||'',50)+pad(r.cargo||'',50)+pad(r.telefone||'',50)+pad(r.email||'',50)+'\n'})
  T['CONTATOS']=ctT.trimEnd()
  T['RANKING ']=`RANKING ${dtG}${ispb}00000000`
  return T
}

function processCADOC(cadoc:CadocCode,obj:any):{erros:ValErr[],content:string,filename:string,txts?:Record<string,string>}{
  let erros:ValErr[]=[],content=''
  const cnpj=String(obj.cnpjIF||obj.cabecalho?.CNPJ||obj.cabecalho?.cnpj||obj.cnpj||obj.database?.ispb||'0').replace(/\D/g,'')
  const db=String(obj.dataHoraRemessa||obj.cabecalho?.DtBase||obj.cabecalho?.dataBase||obj.dataBase||obj.database?.dataBase||''). substring(0,10).replace(/-/g,'')
  let txts:Record<string,string>|undefined
  if(cadoc==='3040'){content=gen3040(obj);erros=validate3040(obj)}
  else if(cadoc==='3044'){const clean=JSON.parse(JSON.stringify(obj));(clean.operacoes||[]).forEach((o:any)=>delete o._c);content=JSON.stringify(clean,null,2);erros=validate3044(JSON.stringify(obj))}
  else if(cadoc==='3060'){content=gen3060(obj);erros=validate3060(obj)}
  else if(cadoc==='4010'){content=gen4010(obj);erros=validate4010(obj)}
  else if(cadoc==='6334'){txts=gen6334(obj);content=Object.entries(txts).map(([k,v])=>`=== ${k.trim()}.TXT ===\n${v}`).join('\n\n');erros=validate6334(obj)}
  const ext=cadoc==='3044'?'json':cadoc==='6334'?'zip':'xml'
  return{erros,content,txts,filename:`cadoc${cadoc}_${cnpj}_${db}.${ext}`}
}

function liveValidate(json:string,cadoc:CadocCode):{state:string,msg:string,errors:ValErr[]}{
  if(!json.trim())return{state:'idle',msg:'Aguardando entrada JSON…',errors:[]}
  let obj:any;try{obj=JSON.parse(json)}catch(e:any){return{state:'err',msg:'✗ JSON inválido — '+e.message.substring(0,60),errors:[{cod:'SYN',msg:e.message,tipo:'erro'}]}}
  let erros:ValErr[]=[]
  if(cadoc==='3040')erros=validate3040(obj)
  else if(cadoc==='3044')erros=validate3044(json)
  else if(cadoc==='3060')erros=validate3060(obj)
  else if(cadoc==='4010')erros=validate4010(obj)
  else if(cadoc==='6334')erros=validate6334(obj)
  const kb=(new TextEncoder().encode(json).length/1024).toFixed(1)
  const fatais=erros.filter(e=>e.tipo!=='aviso')
  if(fatais.length>0)return{state:'err',msg:`✗ ${fatais.length} erro(s) — ${fatais[0].msg.substring(0,55)}`,errors:erros}
  const avisos=erros.filter(e=>e.tipo==='aviso')
  if(avisos.length>0)return{state:'warn',msg:`⚠ ${avisos.length} aviso(s) · ${kb} KB`,errors:erros}
  const sum:Record<string,string>={'3044':`${obj.operacoes?.length??0} operações · CNPJ ${obj.cnpjIF??'?'}`,'3040':`${obj.clientes?.length??0} cliente(s) · ${obj.clientes?.reduce((s:number,c:any)=>s+(c.operacoes?.length??0),0)??0} op(s)`,'3060':`p25=${obj.percentil25} p50=${obj.percentil50}`,'4010':`${obj.contas?.length??0} conta(s) COSIF`,'6334':`OK · ${kb} KB`}
  return{state:'ok',msg:`✓ JSON válido — ${sum[cadoc]||'OK'} · ${kb} KB`,errors:[]}
}


// ── Type aliases (needed for SWC JSX parser compatibility) ──────
type CadocResult = {erros:ValErr[];content:string;filename:string;txts?:Record<string,string>}
type ResTabId = 'resumo'|'erros'|'preview'|'rules'
type LiveVal = {state:string;msg:string;errors:ValErr[]}
type TimerH = ReturnType<typeof setTimeout>|null
// ══════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════
export default function CadocsPage(){
  const[sel,setSel]=useState<CadocCode>('3044')
  const[json,setJson]=useState(()=>JSON.stringify(TEMPLATES['3044'],null,2))
  const[step,setStep]=useState(1)
  const[busy,setBusy]=useState(false)
  const[loadMsg,setLoadMsg]=useState('')
  const[result,setResult]=useState<CadocResult|null>(null)
  const[parseErr,setParseErr]=useState('')
  const[resTab,setResTab]=useState<ResTabId>('resumo')
  const[audit,setAudit]=useState<AuditEntry[]>([])
  const[lv,setLv]=useState<LiveVal>({state:'idle',msg:'Aguardando entrada JSON…',errors:[]})
  const[showRulesRef,setShowRulesRef]=useState(false)
  const[rulesSearch,setRulesSearch]=useState('')
  const lvTimer=useRef<TimerH>(null)
  const m=CADOCS_LIST.find(c=>c.code===sel)!

  const pick=(code:CadocCode)=>{setSel(code);setJson(JSON.stringify(TEMPLATES[code],null,2));setStep(1);setResult(null);setParseErr('');setLv({state:'idle',msg:'Aguardando entrada JSON…',errors:[]})}
  const onChange=(v:string)=>{setJson(v);setStep(1);setResult(null);setParseErr('');if(lvTimer.current)clearTimeout(lvTimer.current);lvTimer.current=setTimeout(()=>setLv(liveValidate(v,sel)),350)}

  const generate=async()=>{
    setParseErr('');setBusy(true);setLoadMsg(`Convertendo JSON → CADOC ${sel}…`);setStep(2)
    await new Promise(r=>setTimeout(r,150))
    let obj:any;try{obj=JSON.parse(json)}catch(e:any){setParseErr('JSON inválido: '+e.message);setStep(1);setBusy(false);return}
    setLoadMsg(`Aplicando ${sel==='3040'?'315':sel==='3044'?'regras T01-T13':'regras BCB'} regras de validação…`);await new Promise(r=>setTimeout(r,250))
    const res=processCADOC(sel,obj);setResult(res);setStep(3);setResTab(res.erros.filter(e=>e.tipo!=='aviso').length>0?'erros':'resumo')
    const status=res.erros.filter(e=>e.tipo!=='aviso').length>0?'REPROVADO':res.erros.filter(e=>e.tipo==='aviso').length>0?'COM_ALERTAS':'APROVADO'
    const cnpj=String(obj.cnpjIF||obj.cabecalho?.CNPJ||obj.cabecalho?.cnpj||obj.cnpj||obj.database?.ispb||'?')
    const dtBase=String(obj.dataHoraRemessa||obj.cabecalho?.DtBase||obj.cabecalho?.dataBase||obj.dataBase||obj.database?.dataBase||'?').substring(0,10)
    setAudit(prev=>[{ts:new Date().toLocaleString('pt-BR'),acao:`Geração + Validação CADOC ${sel}`,cadoc:sel,cnpj,dtBase,status,nErros:res.erros.filter(e=>e.tipo!=='aviso').length,nAvisos:res.erros.filter(e=>e.tipo==='aviso').length},...prev].slice(0,50))
    setBusy(false)
  }

  const download=()=>{
    if(!result)return
    if(sel==='6334'&&result.txts){Object.entries(result.txts).forEach(([k,v],i)=>{setTimeout(()=>{const b=new Blob([v],{type:'text/plain;charset=iso-8859-1'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=k.trim()+'.TXT';a.click();URL.revokeObjectURL(a.href)},i*80)})}
    else{const b=new Blob([result.content],{type:(sel==='3044'?'application/json':'application/xml')+';charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=result.filename;a.click();URL.revokeObjectURL(a.href)}
    setStep(4);setAudit(prev=>[{ts:new Date().toLocaleString('pt-BR'),acao:`Download CADOC ${sel}`,cadoc:sel,cnpj:'',dtBase:'',status:'EXPORTADO',nErros:0,nAvisos:0},...prev].slice(0,50))
  }

  const nErros=result?.erros.filter(e=>e.tipo!=='aviso').length??0
  const nAvisos=result?.erros.filter(e=>e.tipo==='aviso').length??0
  const stC=!result?C.grn:nErros>0?C.red:nAvisos>0?C.amb:C.grn
  const stL=!result?'':`${nErros>0?'✗':nAvisos>0?'⚠':'✓'} ${nErros>0?`${nErros} erro(s)`:nAvisos>0?`${nAvisos} aviso(s)`:'APROVADO'}`
  const lvcMap:Record<string,{bg:string,brd:string,col:string}>={idle:{bg:'#f9fafb',brd:C.brd,col:C.txt3},ok:{bg:'#f0fdf4',brd:'#22c55e',col:'#166534'},warn:{bg:'#fffbeb',brd:'#f59e0b',col:'#92400e'},err:{bg:'#fef2f2',brd:C.red,col:'#991b1b'}}
  const lvc=lvcMap[lv.state]||lvcMap.idle

  // Rules reference filtered
  const allRulesFlat=Object.entries(SCR3040_RULES).filter(([cod,r])=>{if(!rulesSearch)return true;const q=rulesSearch.toLowerCase();return cod.toLowerCase().includes(q)||r.r.toLowerCase().includes(q)||r.cat.toLowerCase().includes(q)})

  const STEPS=[{n:1,t:'Entrada JSON',d:sel==='3044'?'JSON BCB do 3044':'JSON estruturado com dados'},{n:2,t:sel==='3044'?'Validação T01-T13':'Geração XML/TXT BCB',d:sel==='3040'?'315 regras SCR3040 BCB':'Regras de validação'},{n:3,t:'Críticas BCB',d:'Erros, avisos e ref. regulatória'},{n:4,t:'Exportação',d:'Download + trilha auditoria'},{n:5,t:'Auditoria',d:'Registro de todas as ações'}]

  return(
    <div style={{display:'flex',height:'100%',overflow:'hidden',background:C.bg}}>
      {/* Left steps + info */}
      <div style={{width:188,flexShrink:0,borderRight:`1px solid ${C.brd}`,background:'#f9fafb',display:'flex',flexDirection:'column',overflow:'hidden'}}>
        {/* Steps */}
        <div style={{flex:1,overflowY:'auto',padding:'10px 6px'}}>
          <div style={{fontSize:8,letterSpacing:2,textTransform:'uppercase',color:C.txt3,padding:'4px 8px 6px',fontFamily:'monospace',fontWeight:600}}>FLUXO DE TRABALHO</div>
          {STEPS.map((s,i)=>{
            const done=step>s.n||(s.n===5&&audit.length>0),act=step===s.n,isErr=!!parseErr&&s.n===1
            const col=isErr?C.red:done?C.grn:act?m.color:'#cbd5e1'
            return(<div key={s.n} style={{display:'flex',gap:8,padding:'9px 10px',borderBottom:i<STEPS.length-1?`1px solid ${C.brd}`:'',background:act?m.color+'08':'transparent'}}>
              <div style={{width:20,height:20,borderRadius:'50%',background:done||act||isErr?col:'#f1f5f9',color:done||act||isErr?'#fff':C.txt3,display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:800,flexShrink:0}}>{done&&!isErr?'✓':isErr?'✕':s.n}</div>
              <div><div style={{fontSize:11,fontWeight:700,color:done||act?C.txt:C.txt3}}>{s.t}</div><div style={{fontSize:9,color:C.txt3,lineHeight:1.4,marginTop:1}}>{s.d}</div></div>
            </div>)
          })}
        </div>
        {/* RegRef toggle */}
        <div style={{borderTop:`1px solid ${C.brd}`,padding:'8px 6px'}}>
          <button onClick={()=>setShowRulesRef(!showRulesRef)} style={{width:'100%',padding:'6px 10px',borderRadius:6,border:`1px solid ${C.brd}`,background:showRulesRef?C.grn:'#fff',color:showRulesRef?'#fff':C.txt2,fontSize:10,fontWeight:600,cursor:'pointer',outline:'none'}}>
            {showRulesRef?'✕ Fechar':'📖'} Regras BCB ({Object.keys(SCR3040_RULES).length})
          </button>
        </div>
        {/* CADOC info */}
        <div style={{padding:'10px 12px',borderTop:`1px solid ${C.brd}`,fontSize:9.5,color:C.txt3,lineHeight:1.8,flexShrink:0}}>
          {sel==='3044'&&<><strong style={{color:C.txt}}>CADOC 3044</strong><br/>T01–T13 · B01<br/>Res. CMN 5.037/2022<br/>STA: ASCR344</>}
          {sel==='3040'&&<><strong style={{color:C.txt}}>CADOC 3040</strong><br/>B01-B19 · C01-C75<br/>S01-S100 · I01-I15<br/>A01-A14 · MV01-MV19<br/>MB01-MB13 · M01-M24</>}
          {sel==='4010'&&<><strong style={{color:C.txt}}>CADOC 4010</strong><br/>Plano COSIF<br/>Batimento com 3040<br/>D+9 úteis</>}
          {sel==='3060'&&<><strong style={{color:C.txt}}>CADOC 3060</strong><br/>Circ. BCB 4.019/2020<br/>Taxas por modalidade<br/>Semanal D+5</>}
          {sel==='6334'&&<><strong style={{color:C.txt}}>CADOC 6334</strong><br/>ASPB034 · 10 TXTs<br/>ISO-8859-1<br/>Trimestral</>}
        </div>
      </div>

      {/* Main scrollable area */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minWidth:0}}>
        {/* Rules reference panel */}
        {showRulesRef&&(
          <div style={{borderBottom:`1px solid ${C.brd}`,background:'#fff',padding:'10px 14px',flexShrink:0,maxHeight:240,overflow:'hidden',display:'flex',flexDirection:'column'}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
              <span style={{fontSize:12,fontWeight:700,color:C.txt}}>📖 Base de Regras SCR3040 — {Object.keys(SCR3040_RULES).length} regras BCB oficiais</span>
              <input value={rulesSearch} onChange={e=>setRulesSearch(e.target.value)} placeholder="Buscar por código ou regra…" style={{flex:1,padding:'5px 10px',border:`1px solid ${C.brd}`,borderRadius:6,fontSize:11,outline:'none',fontFamily:'monospace'}}/>
              <span style={{fontSize:9,color:C.txt3,fontFamily:'monospace'}}>{allRulesFlat.length} resultado(s)</span>
            </div>
            <div style={{overflowY:'auto',display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))',gap:4}}>
              {allRulesFlat.slice(0,40).map(([cod,r])=>(
                <div key={cod} style={{padding:'5px 8px',background:C.bg3,borderRadius:5,border:`1px solid ${C.brd}`,display:'flex',gap:8,alignItems:'flex-start'}}>
                  <span style={{fontFamily:'monospace',fontSize:10,fontWeight:800,color:C.cyn,minWidth:44,flexShrink:0}}>{cod}</span>
                  <div>
                    <div style={{fontSize:10,fontWeight:600,color:C.txt,lineHeight:1.3}}>{r.r.substring(0,70)}{r.r.length>70?'…':''}</div>
                    <div style={{fontSize:8.5,color:C.txt3,marginTop:1}}>{r.cat}</div>
                  </div>
                </div>
              ))}
              {allRulesFlat.length>40&&<div style={{padding:'5px 8px',fontSize:9,color:C.txt3,fontFamily:'monospace'}}>…e mais {allRulesFlat.length-40} regras</div>}
            </div>
          </div>
        )}

        {/* CADOC picker */}
        <div style={{padding:'12px 16px',borderBottom:`1px solid ${C.brd}`,background:'#fff',flexShrink:0}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8}}>
            {CADOCS_LIST.map(c=>(
              <button key={c.code} onClick={()=>pick(c.code)} style={{padding:'10px 8px',borderRadius:8,cursor:'pointer',textAlign:'left',outline:'none',border:`2px solid ${sel===c.code?c.color:C.brd}`,background:sel===c.code?c.color+'18':C.bg3,transition:'all .15s'}}>
                <div style={{fontSize:17,marginBottom:3}}>{c.icon}</div>
                <div style={{fontSize:11,fontWeight:800,color:sel===c.code?c.color:C.txt,fontFamily:'monospace'}}>{c.code}</div>
                <div style={{fontSize:9,color:C.txt3,marginTop:2,lineHeight:1.3}}>{c.label.replace(/^.+?—\s*/,'')}</div>
                <div style={{fontSize:8,color:sel===c.code?c.color:C.txt3,marginTop:3,fontFamily:'monospace'}}>{c.per}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{flex:1,overflowY:'auto',padding:'14px 16px'}}>
          {/* JSON Editor */}
          <div style={{background:'#fff',border:`1px solid ${C.brd}`,borderRadius:10,overflow:'hidden',marginBottom:10}}>
            <div style={{padding:'9px 12px',borderBottom:`1px solid ${C.brd}`,display:'flex',alignItems:'center',justifyContent:'space-between',background:'#f9fafb',flexWrap:'wrap',gap:6}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:9,fontFamily:'monospace',background:m.color,color:'#fff',padding:'2px 8px',borderRadius:4,fontWeight:700}}>JSON API</span>
                <span style={{fontSize:12,fontWeight:600,color:C.txt}}>📥 Entrada de Dados — CADOC {sel}</span>
              </div>
              <div style={{display:'flex',gap:5}}>
                <button onClick={()=>{setJson(JSON.stringify(TEMPLATES[sel],null,2));setStep(1);setResult(null);setParseErr('');setLv({state:'idle',msg:'Aguardando entrada JSON…',errors:[]})}} style={{fontSize:10,padding:'3px 9px',borderRadius:5,border:`1px solid ${C.brd}`,background:'#fff',cursor:'pointer',color:C.txt2,outline:'none'}}>↺ Template</button>
                <button onClick={()=>{setJson('');setStep(1);setResult(null)}} style={{fontSize:10,padding:'3px 9px',borderRadius:5,border:`1px solid ${C.brd}`,background:'#fff',cursor:'pointer',color:C.txt2,outline:'none'}}>🗑 Limpar</button>
              </div>
            </div>
            <textarea value={json} onChange={e=>onChange(e.target.value)} spellCheck={false}
              style={{width:'100%',height:240,padding:'12px 14px',fontFamily:'"JetBrains Mono","Courier New",monospace',fontSize:11.5,background:'#0f172a',color:'#e2e8f0',border:'none',outline:'none',resize:'vertical',boxSizing:'border-box',lineHeight:1.6,display:'block'}}/>
            <div style={{padding:'6px 12px',background:lvc.bg,borderTop:`1px solid ${lvc.brd}`,fontSize:10.5,color:lvc.col,fontFamily:'monospace',display:'flex',alignItems:'center',gap:8}}>
              <div style={{width:6,height:6,borderRadius:'50%',background:lvc.col,flexShrink:0,opacity:lv.state==='idle'?.4:1}}/>
              {lv.msg}
            </div>
            {lv.errors.length>0&&lv.state==='err'&&(
              <div style={{padding:'6px 12px',borderTop:`1px solid ${C.brd}`,background:'#fff5f5'}}>
                {lv.errors.slice(0,4).map((e,i)=>(
                  <div key={i} style={{display:'flex',gap:8,padding:'2px 0',fontSize:10}}>
                    <span style={{fontFamily:'monospace',fontWeight:700,color:C.red,minWidth:40}}>{e.cod}</span>
                    <span style={{color:C.txt}}>{e.msg}</span>
                    {e.ruleRef&&<span style={{fontSize:8.5,color:C.txt3,fontFamily:'monospace',marginLeft:'auto'}}>↳ {e.ruleRef.substring(0,60)}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {parseErr&&<div style={{padding:'10px 14px',background:'#fef2f2',border:`1px solid ${C.redbrd}`,borderRadius:8,fontSize:12,color:C.red,marginBottom:10}}>❌ {parseErr}</div>}

          {/* Result panel */}
          {result&&(
            <div style={{background:'#fff',border:`1px solid ${stC}40`,borderRadius:10,overflow:'hidden',marginBottom:10}}>
              <div style={{padding:'10px 14px',background:stC+'10',borderBottom:`1px solid ${stC}30`,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:12,fontWeight:800,color:C.txt}}>Resultado — CADOC {sel}</span>
                  <span style={{fontSize:10,fontFamily:'monospace',color:C.txt3}}>{result.filename}</span>
                </div>
                <span style={{fontSize:11,fontWeight:800,color:stC,padding:'3px 10px',background:stC+'15',borderRadius:5,border:`1px solid ${stC}40`}}>{stL}</span>
              </div>
              <div style={{display:'flex',background:C.bg3,borderBottom:`1px solid ${C.brd}`}}>
                {(['resumo','erros','preview','rules'] as const).map(tab=>(
                  <button key={tab} onClick={()=>setResTab(tab)} style={{flex:1,padding:'7px 4px',textAlign:'center',fontSize:9,fontWeight:600,color:resTab===tab?C.grn:C.txt3,cursor:'pointer',border:'none',borderBottom:resTab===tab?`2px solid ${C.grn}`:'2px solid transparent',background:'transparent',letterSpacing:'.4px',textTransform:'uppercase',outline:'none'}}>
                    {tab==='resumo'?'Resumo':tab==='erros'?`Erros/Avisos (${nErros+nAvisos})`:tab==='preview'?sel==='6334'?'10 TXTs':'Preview XML':'Regras BCB'}
                  </button>
                ))}
              </div>
              <div style={{padding:12}}>
                <div style={{display:'flex',gap:16,marginBottom:10,alignItems:'center',flexWrap:'wrap'}}>
                  {(['Erros',nErros,nErros>0?C.red:C.grn],['Avisos',nAvisos,nAvisos>0?C.amb:C.grn]) .map(([l,v,c])=>(
                    <div key={l as string} style={{textAlign:'center',minWidth:50}}>
                      <div style={{fontSize:22,fontWeight:900,color:c as string,fontFamily:'monospace'}}>{v as number}</div>
                      <div style={{fontSize:9,color:C.txt3}}>{l as string}</div>
                    </div>
                  ))}
                  {(nErros>0||nAvisos>0)&&<button onClick={()=>{
                    const rows=[['Severidade','Código','Mensagem','Operação','Referência BCB'].join(';'),...(result.erros||[]).map(e=>`"${e.tipo==='erro'?'ERRO':'AVISO'}";"${e.cod}";"${e.msg.replace(/"/g,'''''"''''')}";"${e.op||''}";"${e.ruleRef||''}"`)];const b=new Blob(['\uFEFF'+rows.join('\n')],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`criticas_scr3040_${sel}.csv`;a.click();URL.revokeObjectURL(a.href)}} style={{marginLeft:'auto',fontSize:10,padding:'4px 10px',borderRadius:5,border:`1px solid ${C.grn}`,background:C.grnb,cursor:'pointer',color:C.grn,outline:'none'}}>⬇ CSV Críticas BCB</button>}
                </div>
                {resTab==='resumo'&&<div style={{fontSize:11,color:C.txt3}}>{nErros===0&&nAvisos===0?<span style={{color:C.grn,fontWeight:700}}>✓ Arquivo válido — nenhuma crítica encontrada. Pronto para envio ao STA.</span>:<span>Ver aba <strong>Erros/Avisos</strong> para detalhamento das críticas BCB.</span>}</div>}
                {resTab==='erros'&&(
                  <div style={{maxHeight:300,overflowY:'auto'}}>
                    {nErros===0&&nAvisos===0&&<div style={{padding:16,textAlign:'center',color:C.grn,fontSize:11}}>✓ Nenhuma crítica BCB encontrada — arquivo pronto para envio!</div>}
                    {(result.erros||[]).map((e,i)=>(
                      <div key={i} style={{padding:'7px 10px',borderBottom:`1px solid #f5f5f5`,background:e.tipo==='erro'?'#fff5f5':'#fffbeb',borderLeft:`3px solid ${e.tipo==='erro'?C.red:C.amb}`}}>
                        <div style={{display:'flex',gap:8,alignItems:'flex-start',marginBottom:e.ruleRef?3:0}}>
                          <span style={{fontFamily:'monospace',fontWeight:800,fontSize:10,color:e.tipo==='erro'?C.red:C.amb,minWidth:44,flexShrink:0}}>{e.cod}</span>
                          <div style={{flex:1}}>
                            <span style={{fontSize:10.5,color:C.txt}}>{e.op&&<strong>{e.op}: </strong>}{e.msg}</span>
                          </div>
                        </div>
                        {e.ruleRef&&<div style={{fontSize:8.5,color:C.txt3,fontFamily:'monospace',marginTop:3,paddingLeft:52,lineHeight:1.4}}>📖 {e.ruleRef.substring(0,100)}</div>}
                      </div>
                    ))}
                  </div>
                )}
                {resTab==='preview'&&(
                  <div>
                    {sel==='6334'&&result.txts&&<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:6,marginBottom:10}}>{Object.entries(result.txts).map(([k,v])=><div key={k} style={{padding:'7px 10px',background:C.bg3,border:`1px solid ${C.grn}`,borderRadius:6,display:'flex',alignItems:'center',gap:6}}><span>✅</span><div><div style={{fontFamily:'monospace',fontSize:9.5,fontWeight:700,color:C.txt}}>{k.trim()}.TXT</div><div style={{fontSize:8,color:C.txt3}}>{v.split('\n').filter(l=>l.trim()).length} linha(s)</div></div></div>)}</div>}
                    {sel!=='6334'&&<pre style={{padding:'10px',fontFamily:'"JetBrains Mono","Courier New",monospace',fontSize:10,color:'#94a3b8',background:'#0f172a',borderRadius:8,maxHeight:220,overflowY:'auto',lineHeight:1.6,margin:0,whiteSpace:'pre-wrap',wordBreak:'break-all'}}>{result.content.substring(0,2500)}{result.content.length>2500?'\n…':''}</pre>}
                  </div>
                )}
                {resTab==='rules'&&(
                  <div style={{maxHeight:300,overflowY:'auto'}}>
                    <div style={{fontSize:10,color:C.txt3,marginBottom:8}}>Regras BCB aplicadas nesta validação ({sel==='3040'?'B,C,F,S,I,A,MV,MB,P,T,R,M':sel==='3044'?'T01-T13,B01':'B01,F01,F02'}):</div>
                    {Object.entries(SCR3040_RULES).filter(([cod])=>{
                      const pfx={'3040':['B','C','F','S','I','A','MV','MB','P','T','R','M'],'3044':['T','B'],'3060':['B','F'],'4010':['B','F'],'6334':['B','C']}[sel]||[]
                      return pfx.some(p=>cod.startsWith(p))
                    }).slice(0,50).map(([cod,r])=>(
                      <div key={cod} style={{display:'flex',gap:8,padding:'5px 8px',borderBottom:`1px solid ${C.brd}`,alignItems:'flex-start'}}>
                        <span style={{fontFamily:'monospace',fontWeight:800,fontSize:10,color:C.cyn,minWidth:44,flexShrink:0}}>{cod}</span>
                        <div>
                          <div style={{fontSize:10.5,fontWeight:600,color:C.txt}}>{r.r.substring(0,80)}{r.r.length>80?'…':''}</div>
                          <div style={{fontSize:8.5,color:C.txt3,marginTop:1}}>{r.cat}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap',marginBottom:14}}>
            <button onClick={generate} disabled={busy||!json.trim()} style={{padding:'9px 22px',borderRadius:8,border:'none',cursor:busy||!json.trim()?'not-allowed':'pointer',background:busy||!json.trim()?'#94a3b8':m.color,color:'#fff',fontSize:12,fontWeight:700,display:'flex',alignItems:'center',gap:8,outline:'none'}}>
              {busy?<><span style={{display:'inline-block',width:12,height:12,border:'2px solid #fff',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>{loadMsg}</> :`⚙ Gerar + Validar ${sel==='3044'?'JSON':'XML'}`}
            </button>
            {result&&step>=3&&<button onClick={download} style={{padding:'9px 22px',borderRadius:8,border:`1px solid ${C.grn}`,cursor:'pointer',background:C.grnb,color:C.grn,fontSize:12,fontWeight:700,outline:'none'}}>⬇ {sel==='6334'?'Baixar 10 TXTs':sel==='3044'?'Baixar JSON':'Baixar XML'}</button>}
            {step===4&&<span style={{fontSize:11,color:C.grn,fontWeight:700}}>✓ Exportado</span>}
          </div>

          {/* Audit */}
          {audit.length>0&&(
            <div style={{background:'#fff',border:`1px solid ${C.brd}`,borderRadius:10,overflow:'hidden'}}>
              <div style={{padding:'9px 12px',borderBottom:`1px solid ${C.brd}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <span style={{fontSize:11,fontWeight:700,color:C.txt}}>🔍 Trilha de Auditoria</span>
                <div style={{display:'flex',gap:6,alignItems:'center'}}><span style={{fontSize:9,color:C.txt3,fontFamily:'monospace'}}>{audit.length} registro(s)</span><button onClick={()=>setAudit([])} style={{fontSize:9,padding:'2px 6px',border:`1px solid ${C.brd}`,borderRadius:4,background:'none',cursor:'pointer',color:C.txt3,outline:'none'}}>🗑</button></div>
              </div>
              {audit.slice(0,10).map((h,i)=>(
                <div key={i} style={{display:'flex',gap:10,padding:'7px 12px',borderBottom:i<audit.length-1?`1px solid ${C.brd}`:'',alignItems:'center',flexWrap:'wrap'}}>
                  <span style={{fontFamily:'monospace',fontSize:9,color:C.txt3,minWidth:130}}>{h.ts}</span>
                  <span style={{fontSize:10,color:C.txt,flex:1}}>{h.acao}</span>
                  {h.cnpj&&<span style={{fontFamily:'monospace',fontSize:9,color:C.txt3}}>{h.cnpj} · {h.dtBase}</span>}
                  <span style={{fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:3,fontFamily:'monospace',background:h.status==='APROVADO'?C.grnb:h.status==='REPROVADO'?C.redb:h.status==='EXPORTADO'?C.blub:C.ambb,color:h.status==='APROVADO'?C.grn:h.status==='REPROVADO'?C.red:h.status==='EXPORTADO'?C.blu:C.amb}}>{h.status}{h.nErros>0?` · ${h.nErros}E`:''}{h.nAvisos>0?` ${h.nAvisos}A':''}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes ald{0%,100%{opacity:.2;transform:scale(.7)}50%{opacity:1;transform:scale(1.2)}}`}</style>
    </div>
  )
}
