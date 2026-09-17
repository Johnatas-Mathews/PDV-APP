import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const IconSparkles = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
)

const IconWhatsApp = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
)

const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
  </svg>
)

const IconClock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
)

export default function Fidelidade() {
  const [loading, setLoading] = useState(true)
  const [abaAtiva, setAbaAtiva] = useState('radar') // 'radar', 'extrato', 'clientes', 'regras'

  const [movimentacoes, setMovimentacoes] = useState([])
  const [clientes, setClientes] = useState([])
  const [dadosEmpresa, setDadosEmpresa] = useState(null)

  // Regras
  const [taxaCashback, setTaxaCashback] = useState('5')
  const [validadeDias, setValidadeDias] = useState('30')
  const [limiteAbatimentoCarrinho, setLimiteAbatimentoCarrinho] = useState('50')
  const [salvandoRegras, setSalvandoRegras] = useState(false)

  // Filtros
  const [busca, setBusca] = useState('')

  // Modal Ajuste Manual de Saldo
  const [modalAjusteAberto, setModalAjusteAberto] = useState(false)
  const [clienteSelecionado, setClienteSelecionado] = useState(null)
  const [tipoAjuste, setTipoAjuste] = useState('credito') // 'credito' ou 'debito'
  const [valorAjuste, setValorAjuste] = useState('')
  const [motivoAjuste, setMotivoAjuste] = useState('')
  const [salvandoAjuste, setSalvandoAjuste] = useState(false)

  const carregarDados = async () => {
    setLoading(true)
    try {
      // 1. Clientes
      const { data: cData } = await supabase.from('clientes').select('*').order('nome')
      if (cData) setClientes(cData)

      // 2. Movimentações detalhadas
      const { data: mData } = await supabase
        .from('cashback_movimentacoes')
        .select('*, clientes(id, nome, telefone)')
        .order('id', { ascending: false })
        .limit(100)
      if (mData) setMovimentacoes(mData)

      // 3. Configurações
      const { data: cfgData } = await supabase.from('configuracoes').select('*')
      if (cfgData) {
        const mapa = {}
        cfgData.forEach(c => { mapa[c.chave] = c.valor })
        setTaxaCashback(mapa['cashback_percentual'] !== undefined ? String(mapa['cashback_percentual']) : '5')
        setValidadeDias(mapa['cashback_dias_validade'] !== undefined ? String(mapa['cashback_dias_validade']) : '30')
        setLimiteAbatimentoCarrinho(mapa['cashback_limite_carrinho'] !== undefined ? String(mapa['cashback_limite_carrinho']) : '50')
        setDadosEmpresa({ nome: mapa['empresa_nome'] || 'TECCO' })
      }
    } catch (err) {
      alert('Erro ao carregar módulo de fidelidade: ' + err.message)
    }
    setLoading(false)
  }

  useEffect(() => {
    carregarDados()
  }, [])

  // Salvar Regras do Programa de Fidelidade
  const salvarRegras = async (e) => {
    e.preventDefault()
    setSalvandoRegras(true)
    try {
      const itens = [
        { chave: 'cashback_percentual', valor: String(taxaCashback) },
        { chave: 'cashback_dias_validade', valor: String(validadeDias) },
        { chave: 'cashback_limite_carrinho', valor: String(limiteAbatimentoCarrinho) }
      ]
      for (const item of itens) {
        await supabase.from('configuracoes').upsert(item, { onConflict: 'chave' })
      }
      alert('Regras de Fidelidade & Cashback salvas com sucesso!')
    } catch (err) {
      alert('Erro ao salvar regras: ' + err.message)
    }
    setSalvandoRegras(false)
  }

  // Executar Ajuste Manual com Lote
  const confirmarAjusteManual = async (e) => {
    e.preventDefault()
    if (!clienteSelecionado) return
    const valNum = parseFloat(String(valorAjuste).replace(',', '.')) || 0
    if (valNum <= 0) return alert('Informe um valor válido maior que zero.')

    setSalvandoAjuste(true)
    try {
      const saldoAtual = Number(clienteSelecionado.saldo_cashback || 0)
      let novoSaldo = saldoAtual

      if (tipoAjuste === 'credito') {
        novoSaldo = saldoAtual + valNum
      } else {
        novoSaldo = Math.max(0, saldoAtual - valNum)
      }

      // 1. Atualiza o saldo geral no cliente
      const { error: erroCli } = await supabase
        .from('clientes')
        .update({ saldo_cashback: novoSaldo })
        .eq('id', clienteSelecionado.id)
      if (erroCli) throw erroCli

      // 2. Calcula data de expiração se for crédito
      const dataExp = new Date()
      dataExp.setDate(dataExp.getDate() + (parseInt(validadeDias) || 30))

      // 3. Registra a movimentação detalhada
      const { error: erroMov } = await supabase.from('cashback_movimentacoes').insert([{
        cliente_id: clienteSelecionado.id,
        tipo: 'ajuste',
        valor: valNum,
        saldo_restante: tipoAjuste === 'credito' ? valNum : 0,
        status: tipoAjuste === 'credito' ? 'ativo' : 'utilizado',
        data_expiracao: tipoAjuste === 'credito' ? dataExp.toISOString() : null,
        observacao: `${tipoAjuste === 'credito' ? 'Bônus manual concedido' : 'Débito manual'}: ${motivoAjuste || 'Ajuste de balcão'}`
      }])
      if (erroMov) throw erroMov

      alert(`Saldo de ${clienteSelecionado.nome} atualizado para R$ ${novoSaldo.toFixed(2)}!`)
      setModalAjusteAberto(false)
      setValorAjuste('')
      setMotivoAjuste('')
      await carregarDados()
    } catch (err) {
      alert('Erro ao realizar ajuste: ' + err.message)
    }
    setSalvandoAjuste(false)
  }

  // Disparo de WhatsApp
  const enviarLembreteWhatsApp = (cliente, valorBonus, dataVencimento) => {
    if (!cliente.telefone) return alert('Cliente sem telefone cadastrado!')
    const numLimpo = cliente.telefone.replace(/\D/g, '')
    const ddiTel = numLimpo.length <= 11 ? `55${numLimpo}` : numLimpo
    const nomeLoja = dadosEmpresa?.nome || 'nossa loja'

    const mensagem = encodeURIComponent(
      `Oi, ${cliente.nome}! Tudo bem? ✨\n\n` +
      `Passando para avisar que o seu bônus de *R$ ${Number(valorBonus).toFixed(2)}* no *${nomeLoja}* vence no dia *${dataVencimento}*!\n\n` +
      `Chegaram novidades imperdíveis da nova coleção. Venha nos visitar para aproveitar seu desconto antes que expire! 🛍️`
    )

    window.open(`https://api.whatsapp.com/send?phone=${ddiTel}&text=${mensagem}`, '_blank')
  }

  // Clientes com saldo prestes a vencer nos próximos 7 dias
  const hoje = new Date()
  const daquiSeteDias = new Date()
  daquiSeteDias.setDate(daquiSeteDias.getDate() + 7)

  const lotesPrestesAVencer = movimentacoes.filter(m => {
    if (m.tipo !== 'credito' && m.tipo !== 'ajuste') return false
    if (m.status !== 'ativo' || Number(m.saldo_restante || m.valor) <= 0.05) return false
    if (!m.data_expiracao) return false
    const dExp = new Date(m.data_expiracao)
    return dExp >= hoje && dExp <= daquiSeteDias
  })

  // KPIs
  const clientesComSaldo = clientes.filter(c => Number(c.saldo_cashback || 0) > 0.05)
  const totalSaldoNoMercado = clientes.reduce((acc, c) => acc + Number(c.saldo_cashback || 0), 0)
  const totalPrestesAVencer = lotesPrestesAVencer.reduce((acc, l) => acc + Number(l.saldo_restante || l.valor), 0)
  const totalResgatadoHistorico = movimentacoes
    .filter(m => m.tipo === 'resgate')
    .reduce((acc, m) => acc + Number(m.valor || 0), 0)

  // Filtragem de clientes na aba de clientes
  const clientesFiltrados = clientes.filter(c => {
    const t = busca.toLowerCase()
    return (c.nome && c.nome.toLowerCase().includes(t)) ||
      (c.telefone && c.telefone.includes(t)) ||
      (c.cpf && c.cpf.includes(t))
  })

  return (
    <div className="fid-wrapper">
      <style>{`
        .fid-wrapper { width: 100%; max-width: 1200px; margin: 0 auto; box-sizing: border-box; }
        .page-header { margin-bottom: 1.5rem; }
        .page-title { font-size: 1.75rem; font-weight: 800; color: #0f172a; letter-spacing: -0.025em; display: flex; align-items: center; gap: 10px; }
        .page-subtitle { color: #64748b; font-size: 0.875rem; margin-top: 4px; }

        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
        .kpi-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
        .kpi-title { font-size: 0.72rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; display: block; }
        .kpi-val { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin-top: 4px; display: block; }
        .kpi-sub { font-size: 0.75rem; color: #94a3b8; margin-top: 2px; }

        .tabs-nav { display: flex; gap: 8px; border-bottom: 1px solid #e2e8f0; margin-bottom: 1.5rem; overflow-x: auto; }
        .tab-btn { padding: 10px 18px; border: none; background: transparent; font-size: 0.88rem; font-weight: 600; color: #64748b; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.15s; white-space: nowrap; }
        .tab-btn:hover { color: #0f172a; }
        .tab-btn.active { color: #2563eb; border-bottom-color: #2563eb; }

        .card-box { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.02); margin-bottom: 1.5rem; }
        .card-box h2 { font-size: 1.1rem; font-weight: 800; color: #0f172a; margin-bottom: 1.25rem; }

        .table-responsive { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; border-radius: 12px; }
        table { width: 100%; border-collapse: collapse; text-align: left; min-width: 680px; }
        th { background: #f8fafc; color: #64748b; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; padding: 0.75rem 1rem; border-bottom: 1px solid #e2e8f0; }
        td { padding: 0.85rem 1rem; font-size: 0.88rem; color: #0f172a; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
        tbody tr:hover { background: #f8fafc; }

        .badge-tipo { padding: 3px 8px; border-radius: 6px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; }
        .badge-credito { background: #dcfce7; color: #15803d; }
        .badge-resgate { background: #fee2e2; color: #dc2626; }
        .badge-ajuste { background: #e0f2fe; color: #0369a1; }

        .btn { display: inline-flex; align-items: center; justify-content: center; font-weight: 600; border-radius: 8px; border: none; cursor: pointer; padding: 0.55rem 1.1rem; font-size: 0.85rem; transition: all 0.15s; }
        .btn-primary { background: #2563eb; color: #ffffff; }
        .btn-primary:hover { background: #1d4ed8; }
        .btn-secondary { background: #f1f5f9; color: #475569; }
        .btn-secondary:hover { background: #e2e8f0; }
        .btn-zap { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; font-weight: 700; gap: 4px; padding: 6px 12px; }
        .btn-zap:hover { background: #bbf7d0; }

        .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.25rem; }
        .form-group { display: flex; flex-direction: column; width: 100%; }
        .form-group label { font-size: 0.75rem; font-weight: 700; color: #64748b; margin-bottom: 6px; text-transform: uppercase; }
        .form-group input, .form-group select { height: 40px; padding: 0 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(2px); padding: 1rem; }
        .modal-card { background: #ffffff; width: 100%; max-width: 440px; border-radius: 16px; padding: 1.5rem; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }

        @media (max-width: 900px) {
          .kpi-grid { grid-template-columns: 1fr 1fr; }
          .grid-3 { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .kpi-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="page-header">
        <h1 className="page-title"><IconSparkles /> Fidelidade & Cashback</h1>
        <p className="page-subtitle">Gestão de bônus por lotes, réguas de reativação no WhatsApp e controle de margem</p>
      </div>

      {/* PAINEL DE METRICAS (KPIS) */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-title">Bônus em Aberto (Mercado)</span>
          <span className="kpi-val" style={{ color: '#ca8a04' }}>R$ {totalSaldoNoMercado.toFixed(2)}</span>
          <span className="kpi-sub">{clientesComSaldo.length} clientes com saldo</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-title">A Vencer em 7 Dias</span>
          <span className="kpi-val" style={{ color: '#dc2626' }}>R$ {totalPrestesAVencer.toFixed(2)}</span>
          <span className="kpi-sub">{lotesPrestesAVencer.length} lotes para expirar</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-title">Bônus Já Resgatados</span>
          <span className="kpi-val" style={{ color: '#16a34a' }}>R$ {totalResgatadoHistorico.toFixed(2)}</span>
          <span className="kpi-sub">Economia gerada aos clientes</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-title">Regra Ativa</span>
          <span className="kpi-val" style={{ color: '#2563eb' }}>{taxaCashback}%</span>
          <span className="kpi-sub">Validade de {validadeDias} dias por lote</span>
        </div>
      </div>

      {/* NAVEGAÇÃO ENTRE ABAS */}
      <div className="tabs-nav">
        <button className={`tab-btn ${abaAtiva === 'radar' ? 'active' : ''}`} onClick={() => setAbaAtiva('radar')}>
          🎯 Radar de Urgência ({lotesPrestesAVencer.length})
        </button>
        <button className={`tab-btn ${abaAtiva === 'extrato' ? 'active' : ''}`} onClick={() => setAbaAtiva('extrato')}>
          📋 Extrato Completo de Lotes
        </button>
        <button className={`tab-btn ${abaAtiva === 'clientes' ? 'active' : ''}`} onClick={() => setAbaAtiva('clientes')}>
          👥 Saldos por Cliente & Ajuste
        </button>
        <button className={`tab-btn ${abaAtiva === 'regras' ? 'active' : ''}`} onClick={() => setAbaAtiva('regras')}>
          ⚙️ Regras & Trava Anti-Prejuízo
        </button>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#64748b', padding: '3rem' }}>Carregando dados de fidelidade...</p>
      ) : (
        <>
          {/* ABA 1: RADAR DE URGENCIA (WHATSAPP 1 CLIQUE) */}
          {abaAtiva === 'radar' && (
            <div className="card-box">
              <h2>🎯 Clientes com Bônus a Expirar nos Próximos 7 Dias</h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
                Use o gatilho de escassez: chame esses clientes no WhatsApp para lembrá-los do bônus antes da expiração.
              </p>

              {lotesPrestesAVencer.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
                  <span style={{ fontSize: '2rem', display: 'block', marginBottom: '6px' }}>✨</span>
                  <strong style={{ color: '#0f172a' }}>Nenhum bônus prestes a expirar nos próximos 7 dias!</strong>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>Seus clientes ainda têm tempo hábil de validade.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Cliente</th>
                        <th>WhatsApp</th>
                        <th>Bônus a Vencer</th>
                        <th>Data Limite</th>
                        <th style={{ textAlign: 'center' }}>Ação Rápida</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lotesPrestesAVencer.map(lote => {
                        const dExp = new Date(lote.data_expiracao).toLocaleDateString('pt-BR')
                        const valBonus = Number(lote.saldo_restante || lote.valor)
                        return (
                          <tr key={lote.id}>
                            <td><strong>{lote.clientes?.nome || 'Cliente'}</strong></td>
                            <td>{lote.clientes?.telefone || 'Sem telefone'}</td>
                            <td><strong style={{ color: '#dc2626' }}>R$ {valBonus.toFixed(2)}</strong></td>
                            <td>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#d97706', fontWeight: 600 }}>
                                <IconClock /> {dExp}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                className="btn btn-zap"
                                onClick={() => enviarLembreteWhatsApp(lote.clientes, valBonus, dExp)}
                                title="Enviar lembrete no WhatsApp"
                              >
                                <IconWhatsApp /> Lembrar no Zap
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ABA 2: EXTRATO COMPLETO */}
          {abaAtiva === 'extrato' && (
            <div className="card-box">
              <h2>📋 Extrato Histórico de Movimentações</h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
                Registro contábil de cada bônus emitido nas compras, resgates efetuados no caixa e ajustes manuais.
              </p>

              {movimentacoes.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>Nenhuma movimentação registrada ainda.</p>
              ) : (
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Cliente</th>
                        <th>Operação</th>
                        <th>Valor</th>
                        <th>Expiração</th>
                        <th>Detalhe / Origem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movimentacoes.map(m => {
                        const dataFormatada = new Date(m.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
                        const expFormatada = m.data_expiracao ? new Date(m.data_expiracao).toLocaleDateString('pt-BR') : '-'

                        let badgeCls = 'badge-credito'
                        if (m.tipo === 'resgate') badgeCls = 'badge-resgate'
                        else if (m.tipo === 'ajuste') badgeCls = 'badge-ajuste'

                        return (
                          <tr key={m.id}>
                            <td>{dataFormatada}</td>
                            <td><strong>{m.clientes?.nome || 'Cliente Avulso'}</strong></td>
                            <td>
                              <span className={`badge-tipo ${badgeCls}`}>
                                {m.tipo === 'credito' ? '+ Ganho (Compra)' : m.tipo === 'resgate' ? '- Resgate (Uso)' : '⚡ Ajuste Manual'}
                              </span>
                            </td>
                            <td>
                              <strong style={{ color: m.tipo === 'resgate' ? '#dc2626' : '#16a34a' }}>
                                {m.tipo === 'resgate' ? '-' : '+'} R$ {Number(m.valor).toFixed(2)}
                              </strong>
                            </td>
                            <td>{expFormatada}</td>
                            <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                              {m.venda_id ? `Venda #${m.venda_id}` : (m.observacao || '-')}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ABA 3: CLIENTES & AJUSTE MANUAL */}
          {abaAtiva === 'clientes' && (
            <div className="card-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h2>👥 Saldos de Bônus por Cliente</h2>
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Consulte o saldo individual ou credite/debite bônus manualmente.</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 10px', height: '38px', width: '260px' }}>
                  <IconSearch />
                  <input
                    type="text"
                    placeholder="Buscar cliente..."
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                    style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Telefone</th>
                      <th>Saldo Atual</th>
                      <th style={{ textAlign: 'center' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientesFiltrados.slice(0, 30).map(c => {
                      const saldo = Number(c.saldo_cashback || 0)
                      return (
                        <tr key={c.id}>
                          <td><strong>{c.nome}</strong></td>
                          <td>{c.telefone || '-'}</td>
                          <td>
                            <strong style={{ color: saldo > 0 ? '#16a34a' : '#94a3b8' }}>
                              R$ {saldo.toFixed(2)}
                            </strong>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => {
                                setClienteSelecionado(c)
                                setModalAjusteAberto(true)
                              }}
                              style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                            >
                              ⚡ Ajustar Bônus
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ABA 4: REGRAS DO PROGRAMA & TRAVA ANTI-PREJUIZO */}
          {abaAtiva === 'regras' && (
            <div className="card-box">
              <h2>⚙️ Regras do Programa & Proteção de Margem</h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
                Defina como o bônus é gerado e configure o teto máximo de desconto para não prejudicar sua rentabilidade.
              </p>

              <form onSubmit={salvarRegras}>
                <div className="grid-3">
                  <div className="form-group">
                    <label>Percentual Padrão de Bônus (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="50"
                      value={taxaCashback}
                      onChange={e => setTaxaCashback(e.target.value)}
                      required
                    />
                    <small style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '4px' }}>Digite 0 para suspender novas emissões.</small>
                  </div>

                  <div className="form-group">
                    <label>Validade do Lote (Dias)</label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={validadeDias}
                      onChange={e => setValidadeDias(e.target.value)}
                      required
                    />
                    <small style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '4px' }}>Tempo após a compra para o bônus expirar.</small>
                  </div>

                  <div className="form-group">
                    <label>Teto Máximo de Resgate no Carrinho (%)</label>
                    <input
                      type="number"
                      min="10"
                      max="100"
                      value={limiteAbatimentoCarrinho}
                      onChange={e => setLimiteAbatimentoCarrinho(e.target.value)}
                      required
                    />
                    <small style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '4px' }}>Ex: 50% impede que a compra saia de graça.</small>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" disabled={salvandoRegras}>
                  {salvandoRegras ? 'Salvando...' : 'Salvar Regras da Campanha'}
                </button>
              </form>
            </div>
          )}
        </>
      )}

      {/* MODAL DE AJUSTE MANUAL */}
      {modalAjusteAberto && clienteSelecionado && (
        <div className="modal-overlay" onClick={() => setModalAjusteAberto(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.15rem', color: '#0f172a', marginBottom: '4px' }}>
              Ajustar Bônus: {clienteSelecionado.nome}
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1rem' }}>
              Saldo atual: <strong>R$ {Number(clienteSelecionado.saldo_cashback || 0).toFixed(2)}</strong>
            </p>

            <form onSubmit={confirmarAjusteManual}>
              <div className="form-group" style={{ marginBottom: '10px' }}>
                <label>Tipo de Ajuste</label>
                <select value={tipoAjuste} onChange={e => setTipoAjuste(e.target.value)}>
                  <option value="credito">+ Conceder Bônus (Crédito)</option>
                  <option value="debito">- Descontar Bônus (Débito)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '10px' }}>
                <label>Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0,00"
                  value={valorAjuste}
                  onChange={e => setValorAjuste(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label>Motivo / Observação</label>
                <input
                  type="text"
                  placeholder="Ex: Bonificação de aniversário ou acerto"
                  value={motivoAjuste}
                  onChange={e => setMotivoAjuste(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalAjusteAberto(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={salvandoAjuste}>
                  {salvandoAjuste ? 'Salvando...' : 'Confirmar Lançamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
