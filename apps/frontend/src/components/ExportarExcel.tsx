import { FileDown } from 'lucide-react'
import * as XLSX from 'xlsx'

interface ExportarExcelProps {
  dados: any[]
  nomeArquivo?: string
}

export default function ExportarExcel({ dados, nomeArquivo = 'exportacao' }: ExportarExcelProps) {
  
  const handleExportar = () => {
    try {
      if (!dados || dados.length === 0) {
        alert('Não há dados para exportar!')
        return
      }

      console.log('🔄 Iniciando exportação...', { total: dados.length })
      
      // Aviso para grandes volumes
      if (dados.length > 10000) {
        const confirmar = confirm(
          `⚠️ Você está exportando ${dados.length.toLocaleString('pt-BR')} registros.\n\n` +
          `Isso pode demorar alguns segundos.\n\n` +
          `Deseja continuar?`
        )
        if (!confirmar) {
          console.log('❌ Exportação cancelada pelo usuário')
          return
        }
      }
      
      const startTime = Date.now()

      // Preparar dados para Excel - pegar todos os campos disponíveis
      console.log('📝 Preparando dados para Excel...')
      const dadosExcel = dados.map((item, index) => {
        // Log de progresso a cada 5000 registros
        if (index > 0 && index % 5000 === 0) {
          console.log(`   Processando: ${index}/${dados.length} (${((index/dados.length)*100).toFixed(1)}%)`)
        }
        const row: any = {}
        
        // Campos básicos
        row['ID'] = item.id || index + 1
        row['Chave de Acesso'] = item.chaveAcesso || ''
        row['Número'] = item.numero || ''
        row['Série'] = item.serie || ''
        row['Modelo'] = item.modelo || ''
        row['Data Emissão'] = item.dataEmissao || ''
        row['Valor Total'] = item.valorTotal || 0
        row['Status'] = item.status || ''
        row['Tipo'] = item.tipo || ''
        row['Autorizada'] = item.protocolada || ''
        row['Origem'] = item.origem || ''
        
        // Operação
        row['Tipo Operação'] = item.tipoOperacao === '1' ? 'Saída' : item.tipoOperacao === '0' ? 'Entrada' : ''
        row['Natureza Operação'] = item.naturezaOperacao || ''
        
        // Emitente
        if (item.emitente) {
          row['CNPJ Emitente'] = item.emitente.cnpj || ''
          row['Razão Social Emitente'] = item.emitente.razaoSocial || ''
          row['Nome Fantasia Emitente'] = item.emitente.nomeFantasia || ''
          row['IE Emitente'] = item.emitente.ie || ''
          row['Endereço Emitente'] = item.emitente.endereco || ''
          row['Município Emitente'] = item.emitente.municipio || ''
          row['UF Emitente'] = item.emitente.uf || ''
        }
        
        // Destinatário
        if (item.destinatario) {
          row['CNPJ Destinatário'] = item.destinatario.cnpj || ''
          row['CPF/CNPJ Destinatário'] = item.destinatario.cpfCnpj || ''
          row['Razão Social Destinatário'] = item.destinatario.razaoSocial || ''
          row['Nome Destinatário'] = item.destinatario.nome || ''
          row['IE Destinatário'] = item.destinatario.ie || ''
          row['Endereço Destinatário'] = item.destinatario.endereco || ''
          row['Município Destinatário'] = item.destinatario.municipio || ''
          row['UF Destinatário'] = item.destinatario.uf || ''
        }
        
        // Totais/Impostos
        if (item.totais) {
          row['Base Cálculo'] = item.totais.baseCalculo || 0
          row['ICMS'] = item.totais.valorICMS || 0
          row['IPI'] = item.totais.valorIPI || 0
          row['PIS'] = item.totais.valorPIS || 0
          row['COFINS'] = item.totais.valorCOFINS || 0
          row['Frete'] = item.totais.valorFrete || 0
          row['Seguro'] = item.totais.valorSeguro || 0
          row['Desconto'] = item.totais.valorDesconto || 0
          row['Outros'] = item.totais.valorOutros || 0
          row['Descontos Subtotal'] = item.totais.descontos || 0
          row['Acréscimos Subtotal'] = item.totais.acrescimos || 0
        }
        
        // Transporte (NF-e)
        if (item.transporte) {
          row['Modalidade Frete'] = item.transporte.modalidade || ''
          row['CNPJ Transportadora'] = item.transporte.transportadora?.cnpj || ''
          row['Transportadora'] = item.transporte.transportadora?.razaoSocial || ''
          row['Placa Veículo'] = item.transporte.veiculo?.placa || ''
          row['UF Veículo'] = item.transporte.veiculo?.uf || ''
        }
        
        // Pagamento
        if (item.pagamento) {
          row['Forma Pagamento'] = item.pagamento.forma || ''
          row['Valor Pago'] = item.pagamento.valor || 0
        }
        
        // CT-e específico
        if (item.tipoServico) row['Tipo Serviço'] = item.tipoServico
        if (item.tomador) {
          row['Tipo Tomador'] = item.tomador.tipo || ''
          row['CNPJ Tomador'] = item.tomador.cnpj || ''
          row['Razão Social Tomador'] = item.tomador.razaoSocial || ''
        }
        if (item.remetente) {
          row['CNPJ Remetente'] = item.remetente.cnpj || ''
          row['Razão Social Remetente'] = item.remetente.razaoSocial || ''
        }
        if (item.carga) {
          row['Produto Carga'] = item.carga.produto || ''
          row['Peso (kg)'] = item.carga.peso || 0
          row['Volume'] = item.carga.volume || 0
        }
        if (item.rodoviario) {
          row['RNTRC'] = item.rodoviario.rntrc || ''
          row['Placa'] = item.rodoviario.veiculo?.placa || ''
          row['CPF Motorista'] = item.rodoviario.motorista?.cpf || ''
          row['Nome Motorista'] = item.rodoviario.motorista?.nome || ''
        }
        if (item.valores) {
          row['Valor Serviço'] = item.valores.servico || 0
          row['Valor a Receber'] = item.valores.receber || 0
        }
        
        // CF-e específico
        if (item.numeroSAT) row['Número SAT'] = item.numeroSAT
        
        // Informações adicionais
        row['Informações Adicionais'] = item.informacoesAdicionais || ''
        row['Status Manifestação'] = item.statusManifestacao || ''
        
        return row
      })

      console.log('✅ Dados preparados:', dadosExcel.length, 'linhas')

      // Criar workbook
      console.log('📊 Criando planilha Excel...')
      const ws = XLSX.utils.json_to_sheet(dadosExcel)
      const wb = XLSX.utils.book_new()
      
      // Nome da sheet baseado no arquivo
      const nomeSheet = nomeArquivo.includes('nfe') ? 'NF-e' :
                        nomeArquivo.includes('cfe') ? 'CF-e' :
                        nomeArquivo.includes('cte') ? 'CT-e' : 'Documentos'
      
      XLSX.utils.book_append_sheet(wb, ws, nomeSheet)

      // Ajustar largura das colunas
      const maxWidth = 50
      const minWidth = 10
      if (dadosExcel.length > 0) {
        const colWidths = Object.keys(dadosExcel[0]).map(key => {
          const maxLen = Math.max(
            key.length,
            ...dadosExcel.map(row => String(row[key] || '').length)
          )
          return { wch: Math.min(Math.max(maxLen, minWidth), maxWidth) }
        })
        ws['!cols'] = colWidths
      }

      // Gerar nome do arquivo com data/hora
      const agora = new Date()
      const dataHora = `${agora.getFullYear()}${String(agora.getMonth() + 1).padStart(2, '0')}${String(agora.getDate()).padStart(2, '0')}_${String(agora.getHours()).padStart(2, '0')}${String(agora.getMinutes()).padStart(2, '0')}${String(agora.getSeconds()).padStart(2, '0')}`
      const nomeCompleto = `${nomeArquivo}_${dataHora}.xlsx`

      console.log('💾 Salvando arquivo:', nomeCompleto)

      // Salvar arquivo
      XLSX.writeFile(wb, nomeCompleto, { 
        bookType: 'xlsx',
        type: 'binary',
        compression: true
      })

      const tempoTotal = ((Date.now() - startTime) / 1000).toFixed(2)
      console.log(`✅ Exportação concluída em ${tempoTotal}s`)
      
      // Feedback visual com tempo
      alert(
        `✅ Arquivo exportado com sucesso!\n\n` +
        `📊 ${dadosExcel.length.toLocaleString('pt-BR')} registros\n` +
        `⏱️ Tempo: ${tempoTotal}s\n` +
        `📁 Arquivo: ${nomeCompleto}`
      )
      
    } catch (error) {
      console.error('❌ Erro ao exportar:', error)
      alert(`❌ Erro ao exportar arquivo:\n${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  return (
    <button
      onClick={handleExportar}
      disabled={!dados || dados.length === 0}
      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      title={dados?.length ? `Exportar ${dados.length} registros` : 'Nenhum dado para exportar'}
    >
      <FileDown className="w-4 h-4" />
      Exportar Excel ({dados?.length || 0})
    </button>
  )
}
