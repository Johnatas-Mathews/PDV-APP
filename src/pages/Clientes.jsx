import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import '../styles/pages.css'

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [endereco, setEndereco] = useState('')
  const [cpf, setCpf] = useState('')
  const [editando, setEditando] = useState(null)
  const [carregando, setCarregando] = useState(false)

  // 1. Carregar clientes do Supabase
  const carregarClientes = async () => {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('id', { ascending: false })

    if (error) {
      console.error('Erro ao buscar clientes:', error)
    } else {
      setClientes(data || [])
    }
  }

  useEffect(() => {
    carregarClientes()
  }, [])

  // Funções de máscara para blindar campos contra letras
  const formatarCPF = (valor) => {
    return valor
      .replace(/\D/g, '') // remove letras e símbolos
      .slice(0, 11) // limita a 11 números
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  const formatarTelefone = (valor) => {
    return valor
      .replace(/\D/g, '')
      .slice(0, 11)
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d{4})$/, '$1-$2')
  }

  // 2. Salvar ou Atualizar no Supabase
  const salvarCliente = async () => {
    if (!nome.trim()) {
      alert('Preencha o nome')
      return
    }

    if (cpf && cpf.replace(/\D/g, '').length !== 11) {
      alert('O CPF digitado está incompleto (deve conter 11 dígitos)')
      return
    }

    setCarregando(true)

    const payload = {
      nome: nome.trim(),
      email: email.trim() || null,
      telefone: telefone.trim() || null,
      endereco: endereco.trim() || null,
      cpf: cpf.trim() || null
    }

    if (editando) {
      const { error } = await supabase
        .from('clientes')
        .update(payload)
        .eq('id', editando)

      if (error) {
        alert('Erro ao atualizar cliente: ' + error.message)
      } else {
        await carregarClientes()
        limparForm()
      }
    } else {
      const { error } = await supabase
        .from('clientes')
        .insert([payload])

      if (error) {
        alert('Erro ao cadastrar cliente: ' + error.message)
      } else {
        await carregarClientes()
        limparForm()
      }
    }

    setCarregando(false)
  }

  const limparForm = () => {
    setNome('')
    setEmail('')
    setTelefone('')
    setEndereco('')
    setCpf('')
    setEditando(null)
  }

  const editar = (cliente) => {
    setNome(cliente.nome || '')
    setEmail(cliente.email || '')
    setTelefone(cliente.telefone || '')
    setEndereco(cliente.endereco || '')
    setCpf(cliente.cpf || '')
    setEditando(cliente.id)
  }

  // 3. Deletar do Supabase
  const deletar = async (id) => {
    if (confirm('Tem certeza que deseja deletar este cliente?')) {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id)

      if (error) {
        alert('Erro ao deletar cliente: ' + error.message)
      } else {
        await carregarClientes()
      }
    }
  }

  return (
    <div>
      <h1 className="page-title">Clientes</h1>

      <div className="form-container">
        <div className="form-section">
          <h2>{editando ? 'Editar Cliente' : 'Novo Cliente'}</h2>
          
          <div className="form-group">
            <label>Nome *</label>
            <input 
              type="text" 
              value={nome} 
              onChange={(e) => setNome(e.target.value)} 
              placeholder="Nome completo"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="email@example.com"
              />
            </div>

            <div className="form-group">
              <label>Telefone</label>
              <input 
                type="tel" 
                value={telefone} 
                onChange={(e) => setTelefone(formatarTelefone(e.target.value))} 
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>CPF</label>
              <input 
                type="text" 
                value={cpf} 
                onChange={(e) => setCpf(formatarCPF(e.target.value))} 
                placeholder="000.000.000-00"
              />
            </div>

            <div className="form-group">
              <label>Endereço</label>
              <input 
                type="text" 
                value={endereco} 
                onChange={(e) => setEndereco(e.target.value)} 
                placeholder="Rua, número, complemento"
              />
            </div>
          </div>

          <div className="form-buttons">
            <button className="btn btn-primary" onClick={salvarCliente} disabled={carregando}>
              {carregando ? 'Salvando...' : editando ? 'Atualizar Cliente' : 'Adicionar Cliente'}
            </button>
            {editando && (
              <button className="btn btn-secondary" onClick={limparForm}>
                Cancelar
              </button>
            )}
          </div>
        </div>
      </div>

      {clientes.length > 0 && (
        <div className="table-container">
          <h2>Clientes Cadastrados ({clientes.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Telefone</th>
                <th>CPF</th>
                <th>Data Cadastro</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map(cliente => (
                <tr key={cliente.id}>
                  <td>{cliente.nome}</td>
                  <td>{cliente.email || '-'}</td>
                  <td>{cliente.telefone || '-'}</td>
                  <td>{cliente.cpf || '-'}</td>
                  <td>{cliente.created_at ? new Date(cliente.created_at).toLocaleDateString('pt-BR') : '-'}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn btn-sm btn-primary" onClick={() => editar(cliente)}>
                        Editar
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => deletar(cliente.id)}>
                        Deletar
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
  )
}
