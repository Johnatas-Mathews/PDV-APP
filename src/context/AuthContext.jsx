import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [operador, setOperador] = useState(() => {
    const salvo = localStorage.getItem('tecco_operador')
    return salvo ? JSON.parse(salvo) : null
  })
  const [loadingAuth, setLoadingAuth] = useState(false)

  const autenticar = async (usuarioDigitado, senhaDigitada) => {
    setLoadingAuth(true)
    try {
      const loginLimpo = usuarioDigitado.trim().toLowerCase()
      const senhaLimpa = senhaDigitada.trim()

      const { data, error } = await supabase
        .from('usuarios_loja')
        .select('id, nome, login, pin, perfil, ativo, permissoes')
        .or(`login.ilike.${loginLimpo},nome.ilike.${loginLimpo}`)
        .eq('ativo', true)
        .maybeSingle()

      if (error || !data) {
        alert('Usuário não encontrado ou inativo no sistema.')
        setLoadingAuth(false)
        return false
      }

      if (String(data.pin).trim() !== senhaLimpa) {
        alert('Senha incorreta. Verifique e tente novamente.')
        setLoadingAuth(false)
        return false
      }

      // Permissões salvas no banco
      const listaPermissoes = Array.isArray(data.permissoes) ? data.permissoes : []

      const dadosSessao = {
        id: data.id,
        nome: data.nome,
        login: data.login || loginLimpo,
        perfil: data.perfil, // 'admin' ou 'vendedor'
        permissoes: listaPermissoes
      }

      setOperador(dadosSessao)
      localStorage.setItem('tecco_operador', JSON.stringify(dadosSessao))
      setLoadingAuth(false)
      return true
    } catch (err) {
      alert('Erro ao realizar login: ' + err.message)
      setLoadingAuth(false)
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem('tecco_operador')
    setOperador(null)
  }

  // Função auxiliar para verificar permissão
  const temPermissao = (chaveModulo) => {
    if (!operador) return false
    if (operador.perfil === 'admin') return true
    return Array.isArray(operador.permissoes) && operador.permissoes.includes(chaveModulo)
  }

  return (
    <AuthContext.Provider
      value={{
        operador,
        isAdmin: operador?.perfil === 'admin',
        temPermissao,
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
