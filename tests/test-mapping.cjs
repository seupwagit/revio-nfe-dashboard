// Simula o mapeamento dos dados da API
const dadosAPI = {
  "_id": "20642ef6ff478392c18ee47c1f62cce0",
  "CHV_NFE": "35251106239190000857550000044025071115620267",
  "CNPJ_EMIT": "06239190000857",
  "NOME_EMIT": "INFOCO DISTRIBUIDORA E LOGISTICA LTDA",
  "IE": "206402895113",
  "IND_OPER": "1",
  "DT_DOC": "2025-11-27T21:52:09Z",
  "VL_DOC": 6849.11,
  "PROTOCOLADA": "Não",
  "TIPO": "Recebida",
  "ORIGEM": "Robô do Download Sefaz",
  "STATUS_MANIFESTACAO": ""
};

// Mapeia como o código faz
const mapped = {
  id: dadosAPI._id,
  numero: dadosAPI.NUMERO || '',
  serie: dadosAPI.SERIE || '1',
  modelo: dadosAPI.MODELO || '55',
  chaveAcesso: dadosAPI.CHV_NFE || '',
  dataEmissao: dadosAPI.DT_DOC || '',
  valorTotal: parseFloat(dadosAPI.VL_DOC || 0),
  status: dadosAPI.PROTOCOLADA === 'Sim' ? 'autorizada' : 'processando',
  tipo: dadosAPI.TIPO || 'nfe',
  
  naturezaOperacao: dadosAPI.NAT_OPER || '',
  tipoOperacao: dadosAPI.IND_OPER || '',
  
  emitente: {
    cnpj: dadosAPI.CNPJ_EMIT || '',
    razaoSocial: dadosAPI.NOME_EMIT || '',
    nomeFantasia: dadosAPI.FANTASIA_EMIT || '',
    ie: dadosAPI.IE || '',
    endereco: dadosAPI.END_EMIT || '',
    municipio: dadosAPI.MUN_EMIT || '',
    uf: dadosAPI.UF_EMIT || '',
  },
  
  origem: dadosAPI.ORIGEM || '',
  statusManifestacao: dadosAPI.STATUS_MANIFESTACAO || '',
  protocolada: dadosAPI.PROTOCOLADA || '',
};

console.log('📊 DADOS DA API:');
console.log(JSON.stringify(dadosAPI, null, 2));
console.log('\n📦 DADOS MAPEADOS:');
console.log(JSON.stringify(mapped, null, 2));
console.log('\n✅ Campos preenchidos:');
Object.entries(mapped).forEach(([key, value]) => {
  if (typeof value === 'object' && value !== null) {
    console.log(`  ${key}:`);
    Object.entries(value).forEach(([subKey, subValue]) => {
      console.log(`    ${subKey}: ${subValue || '(vazio)'}`);
    });
  } else {
    console.log(`  ${key}: ${value || '(vazio)'}`);
  }
});
