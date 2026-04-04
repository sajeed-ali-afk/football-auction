import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(form.username, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #bf5af2, transparent)' }} />
      <div className="absolute bottom-1/3 left-1/4 w-80 h-80 rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #00ff87, transparent)' }} />

      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #00ff8720, #00d4ff20)', border: '1px solid rgba(0,255,135,0.3)' }}>
            <span className="text-3xl">⚽</span>
          </div>
          <h1 className="font-display text-4xl tracking-widest text-white">CREATE ACCOUNT</h1>
          <p className="text-gray-500 text-sm mt-1">Join the auction arena</p>
        </div>

        <div className="rounded-2xl p-8" style={{ background: '#0d0d2b', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}>
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm animate-shake"
              style={{ background: 'rgba(255,61,61,0.1)', border: '1px solid rgba(255,61,61,0.3)', color: '#ff3d3d' }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-2 tracking-wider uppercase">Username</label>
              <input
                type="text" name="username" value={form.username} onChange={handleChange}
                className="input-dark" placeholder="coolmanager99" required minLength={3} maxLength={20} />
              <p className="text-xs text-gray-600 mt-1">3–20 characters, shown to other players</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-2 tracking-wider uppercase">Email</label>
              <input
                type="email" name="email" value={form.email} onChange={handleChange}
                className="input-dark" placeholder="your@email.com" required />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-2 tracking-wider uppercase">Password</label>
              <input
                type="password" name="password" value={form.password} onChange={handleChange}
                className="input-dark" placeholder="••••••••" required minLength={6} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-2 tracking-wider uppercase">Confirm Password</label>
              <input
                type="password" name="confirm" value={form.confirm} onChange={handleChange}
                className="input-dark" placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={loading}
              className="btn-solid w-full rounded-xl text-sm tracking-widest mt-2 h-12">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-dark-500 border-t-transparent rounded-full animate-spin" />
                  CREATING...
                </span>
              ) : 'CREATE ACCOUNT'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-neon-green hover:underline font-semibold">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
