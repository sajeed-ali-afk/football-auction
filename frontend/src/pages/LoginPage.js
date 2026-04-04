import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #00ff87, transparent)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #00d4ff, transparent)' }} />

      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 animate-float"
            style={{ background: 'linear-gradient(135deg, #00ff8720, #00d4ff20)', border: '1px solid rgba(0,255,135,0.3)', boxShadow: '0 0 40px rgba(0,255,135,0.2)' }}>
            <span className="text-4xl">⚽</span>
          </div>
          <h1 className="font-display text-5xl tracking-widest text-white">FOOTBALL</h1>
          <p className="font-display text-2xl tracking-widest mt-1" style={{ color: '#00ff87' }}>AUCTION</p>
          <p className="text-gray-500 text-sm mt-2 font-body">Build your dream squad</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8" style={{ background: '#0d0d2b', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}>
          <h2 className="font-display text-2xl tracking-wider text-white mb-6">SIGN IN</h2>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm animate-shake"
              style={{ background: 'rgba(255,61,61,0.1)', border: '1px solid rgba(255,61,61,0.3)', color: '#ff3d3d' }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-2 tracking-wider uppercase">Email</label>
              <input
                type="email" name="email" value={form.email} onChange={handleChange}
                className="input-dark" placeholder="your@email.com" required autoComplete="email" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-2 tracking-wider uppercase">Password</label>
              <input
                type="password" name="password" value={form.password} onChange={handleChange}
                className="input-dark" placeholder="••••••••" required autoComplete="current-password" />
            </div>
            <button type="submit" disabled={loading}
              className="btn-solid w-full rounded-xl text-sm tracking-widest mt-2 h-12">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-dark-500 border-t-transparent rounded-full animate-spin" />
                  SIGNING IN...
                </span>
              ) : 'SIGN IN'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-neon-green hover:underline font-semibold">
                Sign Up
              </Link>
            </p>
          </div>
        </div>

        {/* Demo hint */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-600">Run <code className="text-neon-green">npm run seed</code> in backend to load players</p>
        </div>
      </div>
    </div>
  );
}
