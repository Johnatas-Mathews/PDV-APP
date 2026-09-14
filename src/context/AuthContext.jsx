import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [operador, setOperador] = useState(() => {
    const salvo = localStorage.getItem('tecco_operador')
    return salvo ? JSON.parse(salvo) : null
  })
  const [modalLoginAberto, setModalLoginAberto] = useState(false)
  const [usuariosDisponiveis, setUsuariosDisponiveis] = useState([])
  const [loadingAuth, setLoadingAuth] = useState(false)

  // Carrega operadores ativos do banco
  const carregarUsuarios = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios_loja')
        .select('id, nome, perfil, ativo')
        .eq('ativo', true)
        .order('nome')

      if (error) throw error
      if (data) setUsuariosDisponiveis(data)
    } catch (err) {
      console.error('Erro ao listar operadores:', err)
    }
  }

  useEffect(() => {
    carregarUsuarios()
    // Se não tiver ninguém logado, abre a tela de login
    if (!operador) {
      setModalLoginAberto(true)
    }
  }, [])

  // Validação do PIN no Supabase
  const autenticar = async (usuarioId, pinDigitado) => {
    setLoadingAuth(true)
    try {
      const { data, error } = await supabase
        .from('usuarios_loja')
        .select('id, nome, perfil, pin, ativo')
        .eq('id', usuarioId)
        .eq('ativo', true)
        .single()

      if (error || !data) {
        alert('Operador não encontrado ou inativo.')
        setLoadingAuth(false)
        return false
      }

      if (String(data.pin).trim() !== String(pinDigitado).trim()) {
        alert('PIN incorreto. Verifique e tente novamente.')
        setLoadingAuth(false)
        return false
      }

      const dadosSessao = {
        id: data.id,
        nome: data.nome,
        perfil: data.perfil // 'admin' ou 'vendedor'
      }

      setOperador(dadosSessao)
      localStorage.setItem('tecco_operador', JSON.stringify(dadosSessao))
      setModalLoginAberto(false)
      setLoadingAuth(false)
      return true
    } catch (err) {
      alert('Erro na autenticação: ' + err.message)
      setLoadingAuth(false)
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem('tecco_operador')
    setOperador(null)
    setModalLoginAberto(true)
  }

  return (
    <AuthContext.Provider
      value={{
        operador,
        isAdmin: operador?.perfil === 'admin',
        modalLoginAberto,
        setModalLoginAberto,
        usuariosDisponiveis,
        carregarUsuarios,
        autenticar,
        logout,
        loadingAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
