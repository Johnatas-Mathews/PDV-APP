import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

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

// Catálogo de Módulos para Concessão de Permissões
const MODULOS_DISPONIVEIS = [
  { chave: 'pdv', label: '🛒 PDV (Frente de Caixa)' },
  { chave: 'vendas', label: '📋 Histórico de Vendas' },
  { chave: 'condicionais', label: '👗 Mala de Roupas (Condicional)' },
  { chave: 'contas_receber', label: '💰 Contas a Receber (Receber Crediário)' },
  { chave: 'clientes', label: '👥 Clientes (Consultar / Cadastrar)' },
  { chave: 'produtos', label: '🏷️ Produtos & Grade' },
  { chave: 'dashboard', label: '📈 Dashboard Geral' },
  { chave: 'compras', label: '📦 Compras & Reposição' },
  { chave: 'fornecedores', label: '🚚 Fornecedores' },
  { chave: 'relatorios', label: '📊 Relatórios & DRE' },
  { chave: 'configuracoes', label: '⚙️ Minha Loja (Ajustes Fiscais/Usuários)' }
]

export default function Configuracoes() {
  // Configurações Gerais
  const [empresaNome, setEmpresaNome] = useState('')
  const [empresaDocumento, setEmpresaDocumento] = useState('')
  const [empresaTelefone, setEmpresaTelefone] = useState('')
  const [empresaEndereco, setEmpresaEndereco] = useState('')
  const [empresaCidadeUf, setEmpresaCidadeUf] = useState('')
  const [empresaInstagram, setEmpresaInstagram] = useState('')
  const [empresaMensagemCupom, setEmpresaMensagemCupom] = useState('')
  const [cashbackPercentual, setCashbackPercentual] = useState('5')
  const [salvandoConfig, setSalvandoConfig] = useState(false)

  // Gerenciamento de Operadores
  const [usuarios, setUsuarios] = useState([])
  const [idEditandoUsuario, setIdEditandoUsuario] = useState(null)
  const [nomeUsuario, setNomeUsuario] = useState('')
  const [loginUsuario, setLoginUsuario] = useState('')
  const [senhaUsuario, setSenhaUsuario] = useState('')
  const [perfilUsuario, setPerfilUsuario] = useState('vendedor')
  const [permissoesUsuario, setPermissoesUsuario] = useState(['pdv', 'vendas', 'condicionais', 'contas_receber', 'clientes', 'produtos'])
  const [salvandoUsuario, setSalvandoUsuario] = useState(false)

  const carregarDados = async () => {
    const { data: cfgData } = await supabase.from('configuracoes').select('*')
    if (cfgData) {
      const mapa = {}
      cfgData.forEach(c => { mapa[c.chave] = c.valor })
      setEmpresaNome(mapa['empresa_nome'] || '')
      setEmpresaDocumento(mapa['empresa_documento'] || '')
      setEmpresaTelefone(mapa['empresa_telefone'] || '')
      setEmpresaEndereco(mapa['empresa_endereco'] || '')
      setEmpresaCidadeUf(mapa['empresa_cidade_uf'] || '')
      setEmpresaInstagram(mapa['empresa_instagram'] || '')
      setEmpresaMensagemCupom(mapa['empresa_mensagem_cupom'] || 'Obrigado pela preferência! Volte sempre.')
      setCashbackPercentual(mapa['cashback_percentual'] || '5')
    }

    const { data: uData } = await supabase.from('usuarios_loja').select('*').order('id')
    if (uData) setUsuarios(uData)
  }

  useEffect(() => {
    carregarDados()
  }, [])

  const salvarConfiguracoes = async (e) => {
    e.preventDefault()
    setSalvandoConfig(true)

    const configs = [
      { chave: 'empresa_nome', valor: empresaNome.trim() },
      { chave: 'empresa_documento', valor: empresaDocumento.trim() },
      { chave: 'empresa_telefone', valor: empresaTelefone.trim() },
      { chave: 'empresa_endereco', valor: empresaEndereco.trim() },
      { chave: 'empresa_cidade_uf', valor: empresaCidadeUf.trim() },
      { chave: 'empresa_instagram', valor: empresaInstagram.trim() },
      { chave: 'empresa_mensagem_cupom', valor: empresaMensagemCupom.trim() },
      { chave: 'cashback_percentual', valor: cashbackPercentual }
    ]

    try {
      for (const item of configs) {
        await supabase.from('configuracoes').upsert({ chave: item.chave, valor: item.valor }, { onConflict: 'chave' })
      }
      alert('Configurações salvas com sucesso!')
    } catch (err) {
      alert('Erro ao salvar: ' + err.message)
    }

    setSalvandoConfig(false)
  }

  const limparFormUsuario = () => {
    setIdEditandoUsuario(null)
    setNomeUsuario('')
    setLoginUsuario('')
    setSenhaUsuario('')
    setPerfilUsuario('vendedor')
    setPermissoesUsuario(['pdv', 'vendas', 'condicionais', 'contas_receber', 'clientes', 'produtos'])
  }

  const iniciarEdicaoUsuario = (user) => {
    setIdEditandoUsuario(user.id)
    setNomeUsuario(user.nome || '')
    setLoginUsuario(user.login || '')
    setSenhaUsuario('')
    setPerfilUsuario(user.perfil || 'vendedor')
    setPermissoesUsuario(Array.isArray(user.permissoes) ? user.permissoes : [])
  }

  const togglePermissao = (chave) => {
    setPermissoesUsuario(prev => 
      prev.includes(chave) ? prev.filter(p => p !== chave) : [...prev, chave]
    )
  }

  const salvarOperador = async (e) => {
    e.preventDefault()
    if (!nomeUsuario.trim() || !loginUsuario.trim()) {
      return alert('Informe Nome e Usuário de Login.')
    }

    if (!idEditandoUsuario && !senhaUsuario.trim()) {
      return alert('Defina uma senha para o novo operador.')
    }

    setSalvandoUsuario(true)
    try {
      // Se for admin, concede acesso a todos os módulos
      const permsFinais = perfilUsuario === 'admin' 
        ? MODULOS_DISPONIVEIS.map(m => m.chave)
        : permissoesUsuario

      const payload = {
        nome: nomeUsuario.trim(),
        login: loginUsuario.trim().toLowerCase(),
        perfil: perfilUsuario,
        permissoes: permsFinais
      }

      if (senhaUsuario.trim()) {
        payload.pin = senhaUsuario.trim()
      }

      if (idEditandoUsuario) {
        const { error } = await supabase
          .from('usuarios_loja')
          .update(payload)
          .eq('id', idEditandoUsuario)

        if (error) throw error
        alert('Dados e permissões do operador atualizados com sucesso!')
      } else {
        payload.ativo = true
        const { error } = await supabase
          .from('usuarios_loja')
          .insert([payload])

        if (error) throw error
        alert(`Operador "${nomeUsuario}" cadastrado com sucesso!`)
      }

      limparFormUsuario()
      await carregarDados()
    } catch (err) {
      alert('Erro ao salvar operador: ' + err.message)
    }
    setSalvandoUsuario(false)
  }

  const excluirOperador = async (user) => {
    if (usuarios.length <= 1) {
      return alert('Você não pode excluir o único operador cadastrado!')
    }

    if (!confirm(`Deseja realmente excluir o operador "${user.nome}" (${user.login})?`)) return

    try {
      const { error } = await supabase.from('usuarios_loja').delete().eq('id', user.id)
      if (error) throw error
      alert('Operador excluído com sucesso!')
      if (idEditandoUsuario === user.id) limparFormUsuario()
      await carregarDados()
    } catch (err) {
      alert('Erro ao excluir operador: ' + err.message)
    }
  }

  const alternarStatusOperador = async (id, statusAtual) => {
    try {
      await supabase.from('usuarios_loja').update({ ativo: !statusAtual }).eq('id', id)
      await carregarDados()
    } catch (err) {
      alert('Erro ao alterar status: ' + err.message)
    }
  }

  return (
    <div className="cfg-wrapper">
      <style>{`
        .cfg-wrapper { width: 100%; max-width: 1100px; margin: 0 auto; box-sizing: border-box; }
        .page-header { margin-bottom: 1.5rem; }
        .page-title { font-size: 1.75rem; font-weight: 800; color: #0f172a; letter-spacing: -0.025em; }
        .page-subtitle { color: #64748b; font-size: 0.875rem; margin-top: 4px; }

        .card-box { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.02); margin-bottom: 1.5rem; }
        .card-box h2 { font-size: 1.15rem; font-weight: 800; color: #0f172a; margin-bottom: 1.25rem; }
        
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
        .grid-4 { display: grid; grid-template-columns: 1.4fr 1fr 1fr 1.2fr; gap: 1rem; margin-bottom: 1rem; }
        
        .form-group { display: flex; flex-direction: column; width: 100%; min-width: 0; }
        .form-group label { font-size: 0.75rem; font-weight: 700; color: #64748b; margin-bottom: 6px; text-transform: uppercase; }
        .form-group input, .form-group select { height: 42px; padding: 0 0.85rem; border: 1px solid #cbd5e1; border-radius: 10px; background: #ffffff; color: #0f172a; font-size: 0.95rem; width: 100%; box-sizing: border-box; }
        .form-group input:focus, .form-group select:focus { outline: none; border-color: #2563eb; }

        /* Matriz de Permissões com Checkboxes */
        .permissoes-box { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 1rem; margin-top: 0.75rem; margin-bottom: 1.25rem; }
        .permissoes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 10px; margin-top: 8px; }
        .perm-item { display: flex; align-items: center; gap: 8px; font-size: 0.88rem; color: #1e293b; cursor: pointer; padding: 6px 8px; border-radius: 6px; background: #f8fafc; border: 1px solid #e2e8f0; }
        .perm-item:hover { background: #eff6ff; border-color: #bfdbfe; }
        .perm-item input { width: 16px; height: 16px; cursor: pointer; }

        .btn { display: inline-flex; align-items: center; justify-content: center; font-weight: 600; border-radius: 10px; border: none; cursor: pointer; padding: 0.65rem 1.25rem; font-size: 0.9rem; transition: all 0.15s ease; }
        .btn-primary { background: #2563eb; color: #ffffff; }
        .btn-primary:hover { background: #1d4ed8; }
        .btn-secondary { background: #f1f5f9; color: #475569; }
        .btn-secondary:hover { background: #e2e8f0; color: #0f172a; }
        .btn-danger { background: #fee2e2; color: #dc2626; }
        .btn-sm { padding: 0.4rem 0.65rem; font-size: 0.8rem; border-radius: 6px; }

        .table-responsive { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; border-radius: 12px; }
        table { width: 100%; border-collapse: collapse; text-align: left; min-width: 620px; }
        th { background: #f8fafc; color: #64748b; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; padding: 0.75rem 1rem; border-bottom: 1px solid #e2e8f0; }
        td { padding: 0.85rem 1rem; font-size: 0.88rem; color: #0f172a; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
        tbody tr:hover { background: #f8fafc; }

        .badge-admin { background: #fef3c7; color: #b45309; padding: 3px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; }
        .badge-vendedor { background: #eff6ff; color: #1d4ed8; padding: 3px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; }
        .tag-perm { display: inline-block; background: #f1f5f9; color: #475569; font-size: 0.72rem; padding: 2px 6px; border-radius: 4px; margin: 2px; }

        @media (max-width: 768px) {
          .grid-2, .grid-4 { grid-template-columns: 1fr; }
          .permissoes-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="page-header">
        <h1 className="page-title">Configurações da Loja</h1>
        <p className="page-subtitle">Dados da empresa, controle de acessos e permissões por perfil</p>
      </div>

      {/* GESTÃO DE OPERADORES & PERMISSÕES */}
      <div className="card-box">
        <h2>👥 Equipe & Matriz de Permissões</h2>
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
          Defina exatamente quais telas e módulos cada funcionário pode acessar (ex: permitir que o vendedor receba crediário).
        </p>

        {/* Formulário de Cadastro / Edição com Checkboxes */}
        <form onSubmit={salvarOperador} style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
            {idEditandoUsuario ? `Editando Operador: ${nomeUsuario}` : 'Novo Operador'}
          </span>

          <div className="grid-4">
            <div className="form-group">
              <label>Nome do Funcionário</label>
              <input 
                type="text" 
                placeholder="Ex: Carlos Vendedor" 
                value={nomeUsuario} 
                onChange={e => setNomeUsuario(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group">
              <label>Usuário de Login</label>
              <input 
                type="text" 
                placeholder="Ex: carlos" 
                value={loginUsuario} 
                onChange={e => setLoginUsuario(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group">
              <label>{idEditandoUsuario ? 'Nova Senha (opcional)' : 'Senha'}</label>
              <input 
                type="password" 
                placeholder={idEditandoUsuario ? 'Deixe em branco p/ manter' : '••••'} 
                value={senhaUsuario} 
                onChange={e => setSenhaUsuario(e.target.value)} 
              />
            </div>

            <div className="form-group">
              <label>Tipo de Conta</label>
              <select value={perfilUsuario} onChange={e => setPerfilUsuario(e.target.value)}>
                <option value="vendedor">Personalizado / Vendedor</option>
                <option value="admin">Administrador Geral (Total)</option>
              </select>
            </div>
          </div>

          {/* Seletor de Permissões (Caixas de Seleção) */}
          {perfilUsuario !== 'admin' ? (
            <div className="permissoes-box">
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', display: 'block' }}>
                Marque os módulos que este usuário pode acessar:
              </span>

              <div className="permissoes-grid">
                {MODULOS_DISPONIVEIS.map(mod => (
                  <label key={mod.chave} className="perm-item">
                    <input 
                      type="checkbox" 
                      checked={permissoesUsuario.includes(mod.chave)} 
                      onChange={() => togglePermissao(mod.chave)} 
                    />
                    <span>{mod.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ background: '#fefce8', border: '1px solid #fef08a', padding: '10px 14px', borderRadius: '8px', margin: '10px 0 16px 0', fontSize: '0.85rem', color: '#854d0e' }}>
              👑 <strong>Administrador Geral:</strong> possui acesso liberado a todos os módulos, custos e configurações automaticamente.
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" className="btn btn-primary" disabled={salvandoUsuario} style={{ gap: '6px' }}>
              <IconPlus /> {salvandoUsuario ? 'Salvando...' : (idEditandoUsuario ? 'Salvar Alterações' : 'Cadastrar Operador')}
            </button>
            {idEditandoUsuario && (
              <button type="button" className="btn btn-secondary" onClick={limparFormUsuario}>
                Cancelar Edição
              </button>
            )}
          </div>
        </form>

        {/* Tabela de Operadores */}
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Nome / Login</th>
                <th>Perfil</th>
                <th>Permissões Liberadas</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => {
                const perms = Array.isArray(u.permissoes) ? u.permissoes : []
                return (
                  <tr key={u.id}>
                    <td>
                      <div><strong>{u.nome}</strong></div>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#2563eb' }}>@{u.login || 'admin'}</span>
                    </td>
                    <td>
                      <span className={u.perfil === 'admin' ? 'badge-admin' : 'badge-vendedor'}>
                        {u.perfil === 'admin' ? '👑 Admin Geral' : '🛍️ Vendedor'}
                      </span>
                    </td>
                    <td>
                      {u.perfil === 'admin' ? (
                        <span style={{ fontSize: '0.75rem', color: '#854d0e', fontWeight: 700 }}>Acesso Total (Todos os Módulos)</span>
                      ) : perms.length === 0 ? (
                        <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>Sem permissões</span>
                      ) : (
                        <div>
                          {perms.map(p => {
                            const mod = MODULOS_DISPONIVEIS.find(m => m.chave === p)
                            return (
                              <span key={p} className="tag-perm">
                                {mod ? mod.label.split(' ')[0] + ' ' + mod.label.split(' ')[1] : p}
                              </span>
                            )
                          })}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ color: u.ativo ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
                        {u.ativo ? '● Ativo' : '○ Inativo'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() => iniciarEdicaoUsuario(u)}
                          title="Editar dados e permissões"
                        >
                          <IconEdit /> Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => alternarStatusOperador(u.id, u.ativo)}
                          style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                        >
                          {u.ativo ? 'Desativar' : 'Ativar'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => excluirOperador(u)}
                          title="Excluir operador"
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
        </div>
      </div>

      {/* DADOS DA EMPRESA */}
      <div className="card-box">
        <h2>🏷️ Dados da Empresa & Comprovantes</h2>
        <form onSubmit={salvarConfiguracoes}>
          <div className="grid-2">
            <div className="form-group">
              <label>Nome Fantasia da Loja</label>
              <input type="text" value={empresaNome} onChange={e => setEmpresaNome(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>CNPJ / CPF</label>
              <input type="text" value={empresaDocumento} onChange={e => setEmpresaDocumento(e.target.value)} />
            </div>

            <div className="form-group">
              <label>WhatsApp / Telefone da Loja</label>
              <input type="text" value={empresaTelefone} onChange={e => setEmpresaTelefone(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Instagram (@sualoja)</label>
              <input type="text" value={empresaInstagram} onChange={e => setEmpresaInstagram(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Endereço Completo</label>
              <input type="text" value={empresaEndereco} onChange={e => setEmpresaEndereco(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Cidade / UF</label>
              <input type="text" value={empresaCidadeUf} onChange={e => setEmpresaCidadeUf(e.target.value)} />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Percentual Padrão de Cashback (%)</label>
              <input type="number" step="0.5" min="0" max="50" value={cashbackPercentual} onChange={e => setCashbackPercentual(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Mensagem de Rodapé dos Comprovantes</label>
              <input type="text" value={empresaMensagemCupom} onChange={e => setEmpresaMensagemCupom(e.target.value)} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={salvandoConfig} style={{ marginTop: '0.75rem' }}>
            {salvandoConfig ? 'Salvando...' : 'Salvar Dados da Loja'}
          </button>
        </form>
      </div>
    </div>
  )
}
