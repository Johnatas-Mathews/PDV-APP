import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const IconPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" /><path d="M12 5v14" />
  </svg>
)

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
  const [novoNome, setNovoNome] = useState('')
  const [novoLogin, setNovoLogin] = useState('')
  const [novoPin, setNovoPin] = useState('')
  const [novoPerfil, setNovoPerfil] = useState('vendedor')
  const [salvandoUsuario, setSalvandoUsuario] = useState(false)

  const carregarDados = async () => {
    // 1. Configurações
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

    // 2. Operadores
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

  const cadastrarOperador = async (e) => {
    e.preventDefault()
    if (!novoNome.trim() || !novoLogin.trim() || !novoPin.trim()) {
      return alert('Preencha Nome, Usuário de Login e Senha.')
    }

    setSalvandoUsuario(true)
    try {
      const { error } = await supabase.from('usuarios_loja').insert([{
        nome: novoNome.trim(),
        login: novoLogin.trim().toLowerCase(),
        pin: novoPin.trim(),
        perfil: novoPerfil,
        ativo: true
      }])

      if (error) throw error
      alert(`Operador "${novoNome}" cadastrado com sucesso!`)
      setNovoNome('')
      setNovoLogin('')
      setNovoPin('')
      setNovoPerfil('vendedor')
      await carregarDados()
    } catch (err) {
      alert('Erro ao cadastrar operador: ' + err.message)
    }
    setSalvandoUsuario(false)
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
        .cfg-wrapper { width: 100%; max-width: 1100px; margin: 0 auto; }
        .page-header { margin-bottom: 1.5rem; }
        .page-title { font-size: 1.75rem; font-weight: 800; color: #0f172a; letter-spacing: -0.025em; }
        .page-subtitle { color: #64748b; font-size: 0.875rem; margin-top: 4px; }

        .card-box { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.02); margin-bottom: 1.5rem; }
        .card-box h2 { font-size: 1.15rem; font-weight: 800; color: #0f172a; margin-bottom: 1.25rem; }
        
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
        .grid-4 { display: grid; grid-template-columns: 1.5fr 1fr 1fr 1.2fr; gap: 1rem; margin-bottom: 1rem; }
        
        .form-group { display: flex; flex-direction: column; width: 100%; }
        .form-group label { font-size: 0.75rem; font-weight: 700; color: #64748b; margin-bottom: 6px; text-transform: uppercase; }
        .form-group input, .form-group select { height: 42px; padding: 0 0.85rem; border: 1px solid #e2e8f0; border-radius: 10px; background: #ffffff; color: #0f172a; font-size: 0.95rem; width: 100%; box-sizing: border-box; }
        .form-group input:focus, .form-group select:focus { outline: none; border-color: #2563eb; }

        .btn-primary { background: #2563eb; color: #ffffff; padding: 0.65rem 1.25rem; border-radius: 10px; font-weight: 600; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
        .btn-primary:hover { background: #1d4ed8; }

        table { width: 100%; border-collapse: collapse; text-align: left; }
        th { background: #f8fafc; color: #64748b; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; padding: 0.75rem 1rem; border-bottom: 1px solid #e2e8f0; }
        td { padding: 0.85rem 1rem; font-size: 0.88rem; color: #0f172a; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
        tbody tr:hover { background: #f8fafc; }

        .badge-admin { background: #fef3c7; color: #b45309; padding: 3px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; }
        .badge-vendedor { background: #eff6ff; color: #1d4ed8; padding: 3px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; }

        @media (max-width: 768px) {
          .grid-2, .grid-4 { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="page-header">
        <h1 className="page-title">Configurações da Loja</h1>
        <p className="page-subtitle">Dados oficiais dos comprovantes, cashback e operadores do caixa</p>
      </div>

      {/* GESTÃO DE OPERADORES */}
      <div className="card-box">
        <h2>👥 Equipe & Operadores de Caixa</h2>
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
          Cadastre seus vendedores com login e senha próprios. Vendedores só acessam o PDV e as Condicionais.
        </p>

        <form onSubmit={cadastrarOperador} style={{ background: '#f8fafc', padding: '1.1rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
          <div className="grid-4">
            <div className="form-group">
              <label>Nome do Funcionário</label>
              <input type="text" placeholder="Ex: Mariana Silva" value={novoNome} onChange={e => setNovoNome(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Usuário de Login</label>
              <input type="text" placeholder="Ex: mariana" value={novoLogin} onChange={e => setNovoLogin(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Senha</label>
              <input type="password" placeholder="••••" value={novoPin} onChange={e => setNovoPin(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Nível de Acesso</label>
              <select value={novoPerfil} onChange={e => setNovoPerfil(e.target.value)}>
                <option value="vendedor">Vendedor (Só Caixa/PDV)</option>
                <option value="admin">Administrador (Total)</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={salvandoUsuario}>
            <IconPlus /> {salvandoUsuario ? 'Salvando...' : 'Adicionar Operador'}
          </button>
        </form>

        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Usuário</th>
                <th>Nível</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id}>
                  <td><strong>{u.nome}</strong></td>
                  <td style={{ fontFamily: 'monospace', color: '#2563eb' }}>{u.login || 'admin'}</td>
                  <td>
                    <span className={u.perfil === 'admin' ? 'badge-admin' : 'badge-vendedor'}>
                      {u.perfil === 'admin' ? '👑 Administrador' : '🛍️ Vendedor'}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: u.ativo ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
                      {u.ativo ? '● Ativo' : '○ Inativo'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => alternarStatusOperador(u.id, u.ativo)}
                      style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer', fontSize: '0.75rem' }}
                    >
                      {u.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                  </td>
                </tr>
              ))}
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

          <button type="submit" className="btn-primary" disabled={salvandoConfig} style={{ marginTop: '0.75rem' }}>
            {salvandoConfig ? 'Salvando...' : 'Salvar Dados da Loja'}
          </button>
        </form>
      </div>
    </div>
  )
}
