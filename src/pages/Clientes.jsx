import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

// Ícones SVG minimalistas
const IconPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" /><path d="M12 5v14" />
  </svg>
)

const IconEdit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </svg>
)

const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
)

const IconWhatsApp = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
)

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')

  // Formulário de Cadastro / Edição
  const [idEditando, setIdEditando] = useState(null)
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [cpf, setCpf] = useState('')
  const [endereco, setEndereco] = useState('')
  const [salvando, setSalvando] = useState(false)

  const carregarClientes = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nome', { ascending: true })

      if (error) throw error
      if (data) setClientes(data)
    } catch (err) {
      alert('Erro ao carregar clientes: ' + err.message)
    }
    setLoading(false)
  }

  useEffect(() => {
    carregarClientes()
  }, [])

  const limparFormulario = () => {
    setIdEditando(null)
    setNome('')
    setTelefone('')
    setCpf('')
    setEndereco('')
  }

  const iniciarEdicao = (c) => {
    setIdEditando(c.id)
    setNome(c.nome || '')
    setTelefone(c.telefone || '')
    setCpf(c.cpf || '')
    setEndereco(c.endereco || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const salvarCliente = async (e) => {
    e.preventDefault()
    if (!nome.trim()) return alert('O nome do cliente é obrigatório.')

    setSalvando(true)
    const payload = {
      nome: nome.trim(),
      telefone: telefone.trim() || null,
      cpf: cpf.trim() || null,
      endereco: endereco.trim() || null
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
      await carregarClientes()
    } catch (err) {
      alert('Erro ao salvar cliente: ' + err.message)
    }
    setSalvando(false)
  }

  const excluirCliente = async (id, nomeCli) => {
    if (!confirm(`Deseja realmente excluir o cliente "${nomeCli}"?`)) return
    try {
      const { error } = await supabase.from('clientes').delete().eq('id', id)
      if (error) throw error
      carregarClientes()
    } catch (err) {
      alert('Erro ao excluir cliente: ' + err.message)
    }
  }

  const clientesFiltrados = clientes.filter(c => {
    const t = busca.toLowerCase()
    return (c.nome && c.nome.toLowerCase().includes(t)) ||
      (c.telefone && c.telefone.includes(t)) ||
      (c.cpf && c.cpf.includes(t))
  })

  return (
    <div className="cli-wrapper">
      <style>{`
        .cli-wrapper { width: 100%; max-width: 1200px; margin: 0 auto; box-sizing: border-box; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
        .page-title { font-size: 1.75rem; font-weight: 800; color: #0f172a; letter-spacing: -0.025em; }
        .page-subtitle { color: #64748b; font-size: 0.875rem; margin-top: 4px; }

        .card-box { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.02); margin-bottom: 1.5rem; }
        .card-box h2 { font-size: 1.05rem; font-weight: 700; color: #0f172a; margin-bottom: 1.25rem; }

        .form-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
        .form-group { display: flex; flex-direction: column; width: 100%; min-width: 0; }
        .form-group label { font-size: 0.75rem; font-weight: 700; color: #64748b; margin-bottom: 6px; text-transform: uppercase; }
        .form-group input { height: 42px; padding: 0 0.85rem; border: 1px solid #cbd5e1; border-radius: 10px; background: #ffffff; color: #0f172a; font-size: 0.95rem; width: 100%; box-sizing: border-box; }
        .form-group input:focus { outline: none; border-color: #2563eb; }

        .btn { display: inline-flex; align-items: center; justify-content: center; font-weight: 600; border-radius: 10px; border: none; cursor: pointer; padding: 0.65rem 1.25rem; font-size: 0.9rem; transition: all 0.15s ease; white-space: nowrap; }
        .btn-primary { background: #2563eb; color: #ffffff; }
        .btn-primary:hover { background: #1d4ed8; }
        .btn-secondary { background: #f1f5f9; color: #475569; }
        .btn-secondary:hover { background: #e2e8f0; color: #0f172a; }
        .btn-danger { background: #fee2e2; color: #dc2626; }
        .btn-sm { padding: 0.4rem 0.65rem; font-size: 0.8rem; border-radius: 6px; }

        .controls-bar { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
        .search-box { height: 40px; border: 1px solid #cbd5e1; border-radius: 10px; padding: 0 12px; font-size: 0.9rem; width: 300px; }

        .table-responsive { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; border-radius: 12px; }
        table { width: 100%; border-collapse: collapse; text-align: left; min-width: 650px; }
        th { background: #f8fafc; color: #64748b; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; padding: 0.75rem 1rem; border-bottom: 1px solid #e2e8f0; }
        td { padding: 0.85rem 1rem; font-size: 0.9rem; color: #0f172a; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
        tbody tr:hover { background: #f8fafc; }

        @media (max-width: 768px) {
          .form-grid { grid-template-columns: 1fr; }
          .controls-bar { flex-direction: column; align-items: stretch; }
          .search-box { width: 100%; }
        }
      `}</style>

      <div className="page-header">
        <div>
          <h1 className="page-title">Gestão de Clientes</h1>
          <p className="page-subtitle">Cadastro de clientes, telefones de contato para WhatsApp e endereço de entrega</p>
        </div>
      </div>

      {/* FORMULÁRIO DE CADASTRO / EDIÇÃO */}
      <div className="card-box">
        <h2>{idEditando ? 'Editar Cliente' : 'Novo Cliente'}</h2>
        <form onSubmit={salvarCliente}>
          <div className="form-grid">
            <div className="form-group">
              <label>Nome Completo</label>
              <input type="text" placeholder="Ex: Patrícia Andrade" value={nome} onChange={e => setNome(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>WhatsApp / Telefone</label>
              <input type="text" placeholder="(11) 99999-9999" value={telefone} onChange={e => setTelefone(e.target.value)} />
            </div>

            <div className="form-group">
              <label>CPF</label>
              <input type="text" placeholder="000.000.000-00" value={cpf} onChange={e => setCpf(e.target.value)} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>Endereço / Cidade / Bairro</label>
            <input type="text" placeholder="Rua, número, bairro ou cidade" value={endereco} onChange={e => setEndereco(e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" className="btn btn-primary" disabled={salvando} style={{ gap: '6px' }}>
              <IconPlus /> {salvando ? 'Salvando...' : (idEditando ? 'Salvar Alterações' : 'Cadastrar Cliente')}
            </button>
            {idEditando && (
              <button type="button" className="btn btn-secondary" onClick={limparFormulario}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* TABELA DE CLIENTES */}
      <div className="card-box">
        <div className="controls-bar">
          <h2>Lista de Clientes Cadastrados ({clientesFiltrados.length})</h2>

          <input 
            type="text" 
            className="search-box" 
            placeholder="Buscar por nome, telefone ou CPF..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>Carregando clientes...</p>
        ) : clientesFiltrados.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>Nenhum cliente encontrado.</p>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Contato</th>
                  <th>CPF</th>
                  <th>Endereço</th>
                  <th style={{ textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {clientesFiltrados.map(c => (
                  <tr key={c.id}>
                    <td><strong>{c.nome}</strong></td>
                    <td>
                      {c.telefone ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <IconWhatsApp /> {c.telefone}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>-</span>
                      )}
                    </td>
                    <td>{c.cpf || <span style={{ color: '#94a3b8' }}>-</span>}</td>
                    <td>{c.endereco || <span style={{ color: '#94a3b8' }}>-</span>}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button 
                          type="button" 
                          className="btn btn-sm btn-secondary" 
                          onClick={() => iniciarEdicao(c)}
                          title="Editar dados cadastrais"
                        >
                          <IconEdit /> Editar
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-sm btn-danger" 
                          onClick={() => excluirCliente(c.id, c.nome)}
                          title="Excluir cliente"
                        >
                          <IconTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
