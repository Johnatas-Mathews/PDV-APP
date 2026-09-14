import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { DADOS_EMPRESA_PADRAO } from '../utils/pdfGenerator'

// Ícones SVG minimalistas
const IconStore = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" /><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" /><path d="M2 7h20" />
  </svg>
)

const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

export default function Configuracoes() {
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)

  // Estados dos dados da empresa
  const [nome, setNome] = useState('')
  const [documento, setDocumento] = useState('')
  const [telefone, setTelefone] = useState('')
  const [endereco, setEndereco] = useState('')
  const [cidadeUf, setCidadeUf] = useState('')
  const [instagram, setInstagram] = useState('')
  const [mensagemCupom, setMensagemCupom] = useState('')

  const carregarConfiguracoes = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('configuracoes').select('*')
      if (error) throw error

      if (data) {
        const mapa = {}
        data.forEach(item => { mapa[item.chave] = item.valor })

        setNome(mapa['empresa_nome'] || DADOS_EMPRESA_PADRAO.nome)
        setDocumento(mapa['empresa_documento'] || DADOS_EMPRESA_PADRAO.documento)
        setTelefone(mapa['empresa_telefone'] || DADOS_EMPRESA_PADRAO.telefone)
        setEndereco(mapa['empresa_endereco'] || DADOS_EMPRESA_PADRAO.endereco)
        setCidadeUf(mapa['empresa_cidade_uf'] || DADOS_EMPRESA_PADRAO.cidadeUf)
        setInstagram(mapa['empresa_instagram'] || DADOS_EMPRESA_PADRAO.instagram)
        setMensagemCupom(mapa['empresa_mensagem_cupom'] || DADOS_EMPRESA_PADRAO.mensagemCupom)
      }
    } catch (err) {
      alert('Erro ao carregar configurações: ' + err.message)
    }
    setLoading(false)
  }

  useEffect(() => {
    carregarConfiguracoes()
  }, [])

  const salvarConfiguracoes = async (e) => {
    e.preventDefault()
    setSalvando(true)

    const itensParaSalvar = [
      { chave: 'empresa_nome', valor: nome.trim() },
      { chave: 'empresa_documento', valor: documento.trim() },
      { chave: 'empresa_telefone', valor: telefone.trim() },
      { chave: 'empresa_endereco', valor: endereco.trim() },
      { chave: 'empresa_cidade_uf', valor: cidadeUf.trim() },
      { chave: 'empresa_instagram', valor: instagram.trim() },
      { chave: 'empresa_mensagem_cupom', valor: mensagemCupom.trim() }
    ]

    try {
      for (const item of itensParaSalvar) {
        const { error } = await supabase
          .from('configuracoes')
          .upsert(item, { onConflict: 'chave' })
        if (error) throw error
      }

      alert('Dados da empresa atualizados com sucesso!\nOs novos comprovantes já usarão essas informações.')
    } catch (err) {
      alert('Erro ao salvar configurações: ' + err.message)
    }

    setSalvando(false)
  }

  return (
    <div className="cfg-wrapper">
      <style>{`
        .cfg-wrapper { max-width: 860px; margin: 0 auto; }
        .page-header { margin-bottom: 1.5rem; }
        .page-title { font-size: 1.75rem; font-weight: 800; color: #0f172a; letter-spacing: -0.025em; }
        .page-subtitle { color: #64748b; font-size: 0.875rem; margin-top: 4px; }
        
        .card-box { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.02); margin-bottom: 1.5rem; }
        .card-box h2 { font-size: 1.1rem; font-weight: 700; color: #0f172a; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 8px; }
        .form-row { display: flex; gap: 1rem; margin-bottom: 1.1rem; }
        .form-group { display: flex; flex-direction: column; flex: 1; }
        .form-group label { font-size: 0.75rem; font-weight: 700; color: #64748b; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.04em; }
        .form-group input, .form-group textarea { padding: 0.65rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 10px; background: #ffffff; color: #0f172a; font-size: 0.95rem; }
        .form-group input:focus, .form-group textarea:focus { outline: none; border-color: #2563eb; }
        
        .preview-box { background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 1.25rem; margin-top: 1rem; text-align: center; }
        .preview-title { font-weight: 800; font-size: 1rem; color: #0f172a; text-transform: uppercase; }
        .preview-sub { font-size: 0.8rem; color: #64748b; margin-top: 3px; }
        
        .btn-salvar { display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-weight: 700; border-radius: 10px; border: none; cursor: pointer; padding: 0.8rem 2rem; font-size: 0.95rem; background: #2563eb; color: #ffffff; transition: all 0.15s ease; }
        .btn-salvar:hover { background: #1d4ed8; }
        @media (max-width: 768px) {
          .form-row { flex-direction: column; gap: 0.85rem; }
        }
      `}</style>

      <div className="page-header">
        <h1 className="page-title">Configurações da Empresa</h1>
        <p className="page-subtitle">Personalize a identidade da sua loja para cupons, comprovantes e mensagens</p>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>Carregando dados da loja...</p>
      ) : (
        <form onSubmit={salvarConfiguracoes}>
          <div className="card-box">
            <h2><IconStore /> Identificação & Contato</h2>

            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <label>Nome Fantasia / Razão Social</label>
                <input 
                  type="text" 
                  placeholder="Ex: TECCO MODA & PERFUMARIA"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>CNPJ ou CPF do Emissor</label>
                <input 
                  type="text" 
                  placeholder="00.000.000/0001-00"
                  value={documento}
                  onChange={e => setDocumento(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>WhatsApp / Telefone de Contato</label>
                <input 
                  type="text" 
                  placeholder="(11) 99999-9999"
                  value={telefone}
                  onChange={e => setTelefone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Instagram da Loja</label>
                <input 
                  type="text" 
                  placeholder="@sualoja"
                  value={instagram}
                  onChange={e => setInstagram(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <label>Endereço Completo (Rua, Número, Bairro)</label>
                <input 
                  type="text" 
                  placeholder="Ex: Rua das Flores, 120 - Centro"
                  value={endereco}
                  onChange={e => setEndereco(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Cidade / UF</label>
                <input 
                  type="text" 
                  placeholder="Ex: São Paulo - SP"
                  value={cidadeUf}
                  onChange={e => setCidadeUf(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label>Mensagem de Rodapé no Cupom</label>
              <input 
                type="text" 
                placeholder="Ex: Obrigado pela preferência! Trocas em até 15 dias com este cupom."
                value={mensagemCupom}
                onChange={e => setMensagemCupom(e.target.value)}
              />
            </div>

            {/* Pré-visualização do Cabeçalho do Cupom */}
            <div style={{ marginTop: '1.5rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Pré-visualização no Cabeçalho do Comprovante:
              </span>
              <div className="preview-box">
                <div className="preview-title">{nome || 'NOME DA SUA LOJA'}</div>
                {documento && <div className="preview-sub">{documento}</div>}
                {(endereco || cidadeUf) && <div className="preview-sub">{[endereco, cidadeUf].filter(Boolean).join(' - ')}</div>}
                {telefone && <div className="preview-sub">Tel/WhatsApp: {telefone}</div>}
                {instagram && <div className="preview-sub">Instagram: {instagram}</div>}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.75rem' }}>
              <button type="submit" className="btn-salvar" disabled={salvando}>
                <IconCheck /> {salvando ? 'Salvando...' : 'Salvar Informações'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
