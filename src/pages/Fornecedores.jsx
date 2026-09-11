import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

// Ícones SVG minimalistas nativos
const IconBuilding = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="16" height="20" x="4" y="2" rx="2" />
    <path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M8 10h.01" /><path d="M16 10h.01" /><path d="M8 14h.01" /><path d="M16 14h.01" />
  </svg>
)

const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" /><path d="M12 5v14" />
  </svg>
)

const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </svg>
)

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
)

export default function Fornecedores() {
  const [fornecedores, setFornecedores] = useState([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)

  // Formulário
  const [idEditando, setIdEditando] = useState(null)
  const [nome, setNome] = useState('')
  const [contato, setContato] = useState('')
  const [telefone, setTelefone] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [email, setEmail] = useState('')
  const [cidade, setCidade] = useState('')
  const [salvando, setSalvando] = useState(false)

  const carregarFornecedores = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('fornecedores')
      .select('*')
      .order('nome', { ascending: true })

    if (!error && data) {
      setFornecedores(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    carregarFornecedores()
  }, [])

  const limparFormulario = () => {
    setIdEditando(null)
    setNome('')
    setContato('')
    setTelefone('')
    setCnpj('')
    setEmail('')
    setCidade('')
  }

  const iniciarEdicao = (f) => {
    setIdEditando(f.id)
    setNome(f.nome || '')
    setContato(f.contato || '')
    setTelefone(f.telefone || '')
    setCnpj(f.cnpj || '')
    setEmail(f.email || '')
    setCidade(f.cidade || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const salvarFornecedor = async (e) => {
    e.preventDefault()

    if (!nome.trim()) {
      alert('Informe a Razão Social ou Nome Fantasia do fornecedor.')
      return
    }

    setSalvando(true)

    const payload = {
      nome: nome.trim(),
      contato: contato.trim() || null,
      telefone: telefone.trim() || null,
      cnpj: cnpj.trim() || null,
      email: email.trim() || null,
      cidade: cidade.trim() || null
    }

    try {
      if (idEditando) {
        const { error } = await supabase
          .from('fornecedores')
          .update(payload)
          .eq('id', idEditando)

        if (error) throw error
        alert('Fornecedor atualizado com sucesso!')
      } else {
        const { error } = await supabase
          .from('fornecedores')
          .insert([payload])

        if (error) throw error
        alert('Fornecedor cadastrado com sucesso!')
      }

      limparFormulario()
      await carregarFornecedores()
    } catch (err) {
      alert('Erro ao salvar fornecedor: ' + err.message)
    }

    setSalvando(false)
  }

  const excluirFornecedor = async (id, nomeForn) => {
    if (!confirm(`Deseja realmente excluir o fornecedor "${nomeForn}"?`)) return

    const { error } = await supabase
      .from('fornecedores')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Erro ao excluir: ' + error.message)
    } else {
      carregarFornecedores()
    }
  }

  const fornecedoresFiltrados = fornecedores.filter(f =>
    f.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (f.contato && f.contato.toLowerCase().includes(busca.toLowerCase())) ||
    (f.cnpj && f.cnpj.includes(busca)) ||
    (f.cidade && f.cidade.toLowerCase().includes(busca.toLowerCase()))
  )

  return (
    <div className="forn-wrapper">
      <style>{`
        .forn-wrapper { max-width: 1200px; margin: 0 auto; }
        .page-header { margin-bottom: 1.5rem; }
        .page-title { font-size: 1.75rem; font-weight: 800; color: #0f172a; letter-spacing: -0.025em; }
        .page-subtitle { color: #64748b; font-size: 0.875rem; margin-top: 4px; }
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
        .btn-secondary { background: #f1f5f9; color: #475569; }
        .btn-secondary:hover { background: #e2e8f0; color: #0f172a; }
        .btn-danger { background: #fee2e2; color: #dc2626; }
        .btn-sm { padding: 0.4rem 0.75rem; font-size: 0.8rem; border-radius: 6px; }
        table { width: 100%; border-collapse: collapse; text-align: left; }
        th { background: #f8fafc; color: #64748b; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.85rem 1rem; border-bottom: 1px solid #e2e8f0; }
        td { padding: 1rem; font-size: 0.9rem; color: #0f172a; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
        tbody tr:hover { background: #f8fafc; }
        @media (max-width: 768px) {
          .form-row { flex-direction: column; gap: 0.75rem; }
        }
      `}</style>

      <div className="page-header">
        <h1 className="page-title">Fornecedores & Parceiros</h1>
        <p className="page-subtitle">Cadastre distribuidoras, confecções e marcas parceiras</p>
      </div>

      {/* Formulário de Cadastro / Edição */}
      <div className="card-box">
        <h2>{idEditando ? 'Editar Dados do Fornecedor' : 'Novo Fornecedor'}</h2>
        <form onSubmit={salvarFornecedor}>
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label>Nome / Razão Social</label>
              <input 
                type="text" 
                placeholder="Ex: Confecções Estilo Ltda / Distribuidora Fragrâncias"
                value={nome}
                onChange={e => setNome(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Representante / Contato</label>
              <input 
                type="text" 
                placeholder="Ex: Carlos Representante"
                value={contato}
                onChange={e => setContato(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>WhatsApp / Telefone</label>
              <input 
                type="text" 
                placeholder="Ex: (11) 98888-7777"
                value={telefone}
                onChange={e => setTelefone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>CNPJ</label>
              <input 
                type="text" 
                placeholder="00.000.000/0001-00"
                value={cnpj}
                onChange={e => setCnpj(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Cidade / UF</label>
              <input 
                type="text" 
                placeholder="Ex: São Paulo - SP"
                value={cidade}
                onChange={e => setCidade(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>E-mail para Pedidos</label>
              <input 
                type="email" 
                placeholder="pedidos@fornecedor.com.br"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary" disabled={salvando} style={{ gap: '6px' }}>
              <IconPlus /> {salvando ? 'Salvando...' : (idEditando ? 'Salvar Alterações' : 'Cadastrar Fornecedor')}
            </button>
            {idEditando && (
              <button type="button" className="btn btn-secondary" onClick={limparFormulario}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Listagem */}
      <div className="card-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2>Fornecedores Cadastrados ({fornecedores.length})</h2>
          <input 
            type="text" 
            placeholder="Buscar por nome, contato, cidade..." 
            value={busca} 
            onChange={e => setBusca(e.target.value)}
            style={{ height: '40px', padding: '0 12px', border: '1px solid #e2e8f0', borderRadius: '10px', width: '280px' }}
          />
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>Carregando fornecedores...</p>
        ) : fornecedoresFiltrados.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>Nenhum fornecedor encontrado.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Fornecedor / Razão Social</th>
                <th>Representante</th>
                <th>Contato</th>
                <th>CNPJ</th>
                <th>Cidade</th>
                <th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {fornecedoresFiltrados.map(f => (
                <tr key={f.id}>
                  <td><strong>{f.nome}</strong></td>
                  <td>{f.contato || '-'}</td>
                  <td>
                    <div>{f.telefone || '-'}</div>
                    {f.email && <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{f.email}</span>}
                  </td>
                  <td>{f.cnpj || '-'}</td>
                  <td>{f.cidade || '-'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button 
                        className="btn btn-sm btn-secondary" 
                        onClick={() => iniciarEdicao(f)}
                        style={{ gap: '4px' }}
                      >
                        <IconEdit /> Editar
                      </button>
                      <button 
                        className="btn btn-sm btn-danger" 
                        onClick={() => excluirFornecedor(f.id, f.nome)}
                      >
                        <IconTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
