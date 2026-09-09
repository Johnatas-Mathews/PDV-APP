import { useState, useEffect } from 'react'
import '../styles/pages.css'

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [endereco, setEndereco] = useState('')
  const [cpf, setCpf] = useState('')
  const [editando, setEditando] = useState(null)

  useEffect(() => {
    const dados = JSON.parse(localStorage.getItem('pdv_clientes') || '[]')
    setClientes(dados)
  }, [])

  const salvarCliente = () => {
    if (!nome) {
      alert('Preencha o nome')
      return
    }

    let novaLista
    if (editando) {
      novaLista = clientes.map(c => 
        c.id === editando 
          ? { ...c, nome, email, telefone, endereco, cpf }
          : c
      )
      setEditando(null)
    } else {
      const novoCliente = {
        id: Date.now(),
        nome,
        email,
        telefone,
        endereco,
        cpf,
        dataCadastro: new Date().toLocaleDateString('pt-BR')
      }
      novaLista = [...clientes, novoCliente]
    }

    setClientes(novaLista)
    localStorage.setItem('pdv_clientes', JSON.stringify(novaLista))
    limparForm()
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
    setNome(cliente.nome)
    setEmail(cliente.email)
    setTelefone(cliente.telefone)
    setEndereco(cliente.endereco)
    setCpf(cliente.cpf)
    setEditando(cliente.id)
  }

  const deletar = (id) => {
    if (confirm('Tem certeza que deseja deletar este cliente?')) {
      const novaLista = clientes.filter(c => c.id !== id)
      setClientes(novaLista)
      localStorage.setItem('pdv_clientes', JSON.stringify(novaLista))
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
                onChange={(e) => setTelefone(e.target.value)}
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
                onChange={(e) => setCpf(e.target.value)}
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
            <button className="btn btn-primary" onClick={salvarCliente}>
              {editando ? 'Atualizar' : 'Adicionar'} Cliente
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
                  <td>{cliente.dataCadastro}</td>
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
