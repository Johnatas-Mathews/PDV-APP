import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

// Ícones SVG minimalistas nativos
const IconUserPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <line x1="19" x2="19" y1="8" y2="14" /><line x1="22" x2="16" y1="11" y2="11" />
  </svg>
)

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
)

const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </svg>
)

const IconSparkles = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
)

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)

  // Configuração de Cashback
  const [percentualCashback, setPercentualCashback] = useState('5')
  const [salvandoConfig, setSalvandoConfig] = useState(false)

  // Formulário de Cliente
  const [idEditando, setIdEditando] = useState(null)
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [cpf, setCpf] = useState('')
  const [email, setEmail] = useState('')
  const [salvando, setSalvando] = useState(false)

  const carregarDados = async () => {
    setLoading(true)
    // 1. Carrega clientes
    const { data: dataCli } = await supabase
      .from('clientes')
      .select('*')
      .order('nome', { ascending: true })

    if (dataCli) setClientes(dataCli)

    // 2. Carrega o percentual atual de cashback
    const { data: dataCfg } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'cashback_percentual')
      .maybeSingle()

    if (dataCfg) setPercentualCashback(dataCfg.valor)
    setLoading(false)
  }

  useEffect(() => {
    carregarDados()
  }, [])

  const salvarPercentualCashback = async () => {
    const val = parseFloat(percentualCashback)
    if (isNaN(val) || val < 0 || val > 100) {
      alert('Informe uma porcentagem válida entre 0 e 100.')
      return
    }

    setSalvandoConfig(true)
    const { error } = await supabase
      .from('configuracoes')
      .upsert({ chave: 'cashback_percentual', valor: String(val) })

    if (error) {
      alert('Erro ao salvar configuração: ' + error.message)
    } else {
      alert(`Programa de Cashback atualizado para ${val}% em todas as compras!`)
    }
    setSalvandoConfig(false)
  }

  const limparFormulario = () => {
    setIdEditando(null)
    setNome('')
    setTelefone('')
    setCpf('')
    setEmail('')
  }

  const iniciarEdicao = (c) => {
    setIdEditando(c.id)
    setNome(c.nome || '')
    setTelefone(c.telefone || '')
    setCpf(c.cpf || '')
    setEmail(c.email || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const salvarCliente = async (e) => {
    e.preventDefault()
    if (!nome.trim()) {
      alert('Informe o nome do cliente.')
      return
    }

    setSalvando(true)
    const payload = {
      nome: nome.trim(),
      telefone: telefone.trim() || null,
      cpf: cpf.trim() || null,
      email: email.trim() || null
    }

    try {
      if (idEditando) {
        const { error } = await supabase.from('clientes').update(payload).eq('id', idEditando)
        if (error) throw error
        alert('Cliente atualizado com sucesso!')
      } else {
        const { error } = await supabase.from('clientes').insert([payload])
        if (error) throw error
        alert('Cliente cadastrado com sucesso!')
      }

      limparFormulario()
      await carregarDados()
    } catch (err) {
      alert('Erro ao salvar cliente: ' + err.message)
    }

    setSalvando(false)
  }

  const excluirCliente = async (id, nomeCli) => {
    if (!confirm(`Deseja excluir o cliente "${nomeCli}"?`)) return

    const { error } = await supabase.from('clientes').delete().eq('id', id)
    if (error) {
      alert('Não foi possível excluir: ' + error.message)
    } else {
      carregarDados()
    }
  }

  const clientesFiltrados = clientes.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (c.telefone && c.telefone.includes(busca)) ||
    (c.cpf && c.cpf.includes(busca))
  )

  return (
    <div className="cli-wrapper">
      <style>{`
        .cli-wrapper { max-width: 1200px; margin: 0 auto; }
        .page-header { margin-bottom: 1.5rem; }
        .page-title { font-size: 1.75rem; font-weight: 800; color: #0f172a; letter-spacing: -0.025em; }
        .page-subtitle { color: #64748b; font-size: 0.875rem; margin-top: 4px; }
        
        /* Barra de Controle de Cashback */
        .cashback-bar { background: #fffbeb; border: 1px solid #fef3c7; border-radius: 16px; padding: 1.25rem 1.5rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
        .cashback-info { display: flex; align-items: center; gap: 10px; }
        .cashback-title { font-size: 0.95rem; font-weight: 700; color: #92400e; }
        .cashback-desc { font-size: 0.8rem; color: #b45309; }
        .cashback-action { display: flex; align-items: center; gap: 8px; }
        .cashback-input { width: 70px; height: 38px; border: 1px solid #fcd34d; border-radius: 8px; text-align: center; font-weight: 700; font-size: 1rem; color: #92400e; }
        
        .card-box { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.02); margin-bottom: 1.5rem; }
        .card-box h2 { font-size: 1.05rem; font-weight: 700; color: #0f172a; margin-bottom: 1.25rem; }
        .form-row { display: flex; gap: 1rem; margin-bottom: 1rem; }
        .form-group { display: flex; flex-direction: column; flex: 1; }
        .form-group label { font-size: 0.75rem; font-weight: 700; color: #64748b; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.04em; }
        .form-group input { height: 42px; padding: 0 0.85rem; border: 1px solid #e2e8f0; border-radius: 10px; background: #ffffff; color: #0f172a; font-size: 0.95rem; }
        .form-group input:focus { outline: none; border-color: #2563eb; }
        .btn { display: inline-flex; align-items: center; justify-content: center; font-weight: 600; border-radius: 10px; border: none; cursor: pointer; padding: 0.65rem 1.25rem; font-size: 0.9rem; transition: all 0.15s ease; }
        .btn-primary { background: #2563eb; color: #ffffff; }
        .btn-primary:hover { background: #1d4ed8; }
        .btn-amber { background: #d97706; color: #ffffff; }
        .btn-amber:hover { background: #b45309; }
        .btn-secondary { background: #f1f5f9; color: #475569; }
        .btn-secondary:hover { background: #e2e8f0; color: #0f172a; }
        .btn-danger { background: #fee2e2; color: #dc2626; }
        .btn-sm { padding: 0.4rem 0.75rem; font-size: 0.8rem; border-radius: 6px; }
        table { width: 100%; border-collapse: collapse; text-align: left; }
        th { background: #f8fafc; color: #64748b; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.85rem 1rem; border-bottom: 1px solid #e2e8f0; }
        td { padding: 1rem; font-size: 0.9rem; color: #0f172a; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
        tbody tr:hover { background: #f8fafc; }
        .badge-cashback { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 6px; background: #fefce8; color: #a16207; font-weight: 700; border: 1px solid #fef08a; }
        @media (max-width: 768px) {
          .form-row { flex-direction: column; gap: 0.75rem; }
        }
      `}</style>

      <div className="page-header">
        <h1 className="page-title">Clientes & Fidelização</h1>
        <p className="page-subtitle">Gerencie sua base de clientes, contatos e saldos de cashback</p>
      </div>

      {/* Barra de Ajuste Rápido de Cashback da Loja */}
      <div className="cashback-bar">
        <div className="cashback-info">
          <IconSparkles />
          <div>
            <div className="cashback-title">Regra de Cashback da Loja</div>
            <div className="cashback-desc">Porcentagem que o cliente acumula em cada compra para abater nas próximas visitas</div>
          </div>
        </div>
        <div className="cashback-action">
          <input
            type="number"
            min="0"
            max="100"
            step="0.5"
            className="cashback-input"
            value={percentualCashback}
            onChange={e => setPercentualCashback(e.target.value)}
          />
          <span style={{ fontWeight: 700, color: '#92400e' }}>%</span>
          <button 
            className="btn btn-amber btn-sm" 
            onClick={salvarPercentualCashback} 
            disabled={salvandoConfig}
          >
            {salvandoConfig ? 'Salvando...' : 'Atualizar Taxa'}
          </button>
        </div>
      </div>

      {/* Formulário de Cadastro / Edição */}
      <div className="card-box">
        <h2>{idEditando ? 'Editar Dados do Cliente' : 'Novo Cliente'}</h2>
        <form onSubmit={salvarCliente}>
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label>Nome Completo</label>
              <input 
                type="text" 
                placeholder="Ex: Mariana Silva" 
                value={nome} 
                onChange={e => setNome(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group">
              <label>WhatsApp / Celular</label>
              <input 
                type="text" 
                placeholder="Ex: (11) 99999-9999" 
                value={telefone} 
                onChange={e => setTelefone(e.target.value)} 
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>CPF</label>
              <input 
                type="text" 
                placeholder="000.000.000-00" 
                value={cpf} 
                onChange={e => setCpf(e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label>E-mail</label>
              <input 
                type="email" 
                placeholder="cliente@email.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary" disabled={salvando} style={{ gap: '6px' }}>
              <IconUserPlus /> {salvando ? 'Salvando...' : (idEditando ? 'Salvar Alterações' : 'Cadastrar Cliente')}
            </button>
            {idEditando && (
              <button type="button" className="btn btn-secondary" onClick={limparFormulario}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Lista de Clientes */}
      <div className="card-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2>Base de Clientes ({clientes.length})</h2>
          <input 
            type="text" 
            placeholder="Buscar por nome, telefone ou CPF..." 
            value={busca} 
            onChange={e => setBusca(e.target.value)}
            style={{ height: '40px', padding: '0 12px', border: '1px solid #e2e8f0', borderRadius: '10px', width: '280px' }}
          />
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>Carregando clientes...</p>
        ) : clientesFiltrados.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>Nenhum cliente encontrado.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>WhatsApp</th>
                <th>CPF</th>
                <th>Saldo de Cashback</th>
                <th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.map(c => {
                const saldo = Number(c.saldo_cashback || 0)
                return (
                  <tr key={c.id}>
                    <td><strong>{c.nome}</strong></td>
                    <td>{c.telefone || '-'}</td>
                    <td>{c.cpf || '-'}</td>
                    <td>
                      <span className="badge-cashback">
                        <IconSparkles /> R$ {saldo.toFixed(2)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button 
                          className="btn btn-sm btn-secondary" 
                          onClick={() => iniciarEdicao(c)}
                          style={{ gap: '4px' }}
                        >
                          <IconEdit /> Editar
                        </button>
                        <button 
                          className="btn btn-sm btn-danger" 
                          onClick={() => excluirCliente(c.id, c.nome)}
                        >
                          <IconTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
