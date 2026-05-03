import React, { useState } from 'react';
import { Building2, Mail, Lock, User as UserIcon, AlertCircle } from 'lucide-react';
import { getUsers, saveUsers, setCurrentUser, ensureMasterUser } from '../store';
import type { User } from '../store';
import { v4 as uuidv4 } from 'uuid';
import CryptoJS from 'crypto-js';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validatePassword = (pass: string) => {
    if (pass.length < 8) return 'A senha deve ter pelo menos 8 caracteres.';
    if (!/[A-Z]/.test(pass)) return 'A senha deve conter pelo menos uma letra maiúscula.';
    if (!/[0-9]/.test(pass)) return 'A senha deve conter pelo menos um número.';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) return 'A senha deve conter pelo menos um caractere especial.';
    return null;
  };

  const validateEmail = (mail: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await ensureMasterUser();
      const users = await getUsers();
      const user = users.find(u =>
        (u.email.toLowerCase() === email.toLowerCase() || u.name.toLowerCase() === email.toLowerCase()) &&
        u.passwordHash === CryptoJS.SHA256(password).toString()
      );
      if (user) {
        setCurrentUser(user);
        onLoginSuccess();
      } else {
        setError('Credenciais inválidas. Verifique seu e-mail/usuário e senha.');
      }
    } catch (err) {
      setError('Erro ao conectar com o banco de dados. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('Por favor, informe seu nome.'); return; }
    if (!validateEmail(email)) { setError('Por favor, informe um e-mail válido.'); return; }
    const passError = validatePassword(password);
    if (passError) { setError(passError); return; }

    setLoading(true);
    try {
      const users = await getUsers();
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        setError('Este e-mail já está em uso.');
        return;
      }
      const newUser: User = {
        id: uuidv4(),
        name,
        email,
        passwordHash: CryptoJS.SHA256(password).toString(),
        role: 'user',
      };
      await saveUsers([...users, newUser]);
      setCurrentUser(newUser);
      onLoginSuccess();
    } catch (err) {
      setError('Erro ao criar conta. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '1rem', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)', width: '100%', maxWidth: '400px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ backgroundColor: '#EEF2FF', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
            <Building2 size={32} color="#4F46E5" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>CRM B2B</h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>{isRegistering ? 'Crie sua conta para acessar' : 'Faça login para acessar o sistema'}</p>
        </div>

        {error && (
          <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem' }}>
            <AlertCircle size={16} style={{ marginTop: '0.125rem', flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={isRegistering ? handleRegister : handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {isRegistering && (
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>Nome Completo</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#9CA3AF' }}><UserIcon size={18} /></div>
                <input type="text" required value={name} onChange={e => setName(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '0.5rem', border: '1px solid #D1D5DB', outline: 'none' }}
                  placeholder="Seu nome" />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>{isRegistering ? 'E-mail' : 'Usuário ou E-mail'}</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#9CA3AF' }}><Mail size={18} /></div>
              <input type={isRegistering ? 'email' : 'text'} required value={email} onChange={e => setEmail(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '0.5rem', border: '1px solid #D1D5DB', outline: 'none' }}
                placeholder={isRegistering ? 'seu@email.com' : 'E-mail ou nome de usuário'} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>Senha</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#9CA3AF' }}><Lock size={18} /></div>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '0.5rem', border: '1px solid #D1D5DB', outline: 'none' }}
                placeholder="Sua senha secreta" />
            </div>
            {isRegistering && (
              <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', fontSize: '0.75rem', color: '#6B7280', margin: '0.5rem 0 0 0' }}>
                <li>Mínimo 8 caracteres</li><li>1 Letra maiúscula</li><li>1 Número</li><li>1 Caractere especial (!@#$%)</li>
              </ul>
            )}
          </div>

          <button type="submit" disabled={loading}
            style={{ width: '100%', backgroundColor: loading ? '#6366F1' : '#4F46E5', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 600, border: 'none', cursor: loading ? 'wait' : 'pointer', marginTop: '0.5rem' }}>
            {loading ? 'Aguarde...' : isRegistering ? 'Criar Conta' : 'Entrar'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#4B5563' }}>
          {isRegistering ? 'Já tem uma conta?' : 'Ainda não tem cadastro?'}
          <button type="button"
            style={{ color: '#4F46E5', fontWeight: 600, marginLeft: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            onClick={() => { setIsRegistering(!isRegistering); setError(''); setPassword(''); }}>
            {isRegistering ? 'Fazer login' : 'Criar conta'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
