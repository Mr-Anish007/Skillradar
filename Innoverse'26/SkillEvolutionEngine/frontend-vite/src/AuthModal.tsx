import { useState } from 'react';

interface AuthModalProps {
    onSuccess: (userData: any) => void;
}

export default function AuthModal({ onSuccess }: AuthModalProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
        const payload = isLogin ? { email, password } : { username, email, password };

        try {
            const response = await fetch(`http://127.0.0.1:8000${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Authentication failed');
            }

            // Save token and pass user data up
            localStorage.setItem('token', data.access_token);
            onSuccess({ id: data.user_id, username: data.username });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
                {/* Decorative background glow */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px] pointer-events-none" />

                <h2 className="text-3xl font-extrabold mb-2 text-white relative z-10">
                    {isLogin ? 'Welcome Back' : 'Join the Evolution'}
                </h2>
                <p className="text-neutral-400 mb-8 relative z-10">
                    {isLogin ? 'Sign in to access your dashboard.' : 'Create an account to track your progress.'}
                </p>

                {error && (
                    <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-xl text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-5 relative z-10">
                    {!isLogin && (
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-1.5">Username</label>
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="Enter your username"
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-1.5">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="you@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-1.5">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="mt-2 w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-semibold rounded-xl px-4 py-3.5 shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all flex items-center justify-center gap-2"
                    >
                        {isLoading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
                    </button>

                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-neutral-700"></div>
                        <span className="flex-shrink-0 mx-4 text-neutral-500 text-xs font-bold uppercase">OR</span>
                        <div className="flex-grow border-t border-neutral-700"></div>
                    </div>

                    <button
                        type="button"
                        disabled={isLoading}
                        onClick={async () => {
                            setIsLoading(true);
                            setError('');
                            try {
                                const response = await fetch(`http://127.0.0.1:8000/api/auth/guest`, { method: 'POST' });
                                const data = await response.json();
                                if (!response.ok) throw new Error(data.detail || 'Guest authentication failed');
                                localStorage.setItem('token', data.access_token);
                                onSuccess({ id: data.user_id, username: data.username });
                            } catch (err: any) {
                                setError(err.message);
                                setIsLoading(false);
                            }
                        }}
                        className="w-full bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-800/50 text-white font-semibold rounded-xl px-4 py-3.5 transition-all flex items-center justify-center gap-2 border border-neutral-700"
                    >
                        Continue as Guest
                    </button>

                    <div className="text-center mt-2">
                        <button
                            type="button"
                            onClick={() => { setIsLogin(!isLogin); setError(''); }}
                            className="text-sm text-neutral-400 hover:text-white transition-colors"
                        >
                            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
