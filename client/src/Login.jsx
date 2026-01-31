import { useState, useEffect } from 'react';

// Récupération automatique de l'URL de l'API (Même logique que App.jsx)
const API_URL = 'https://medina-api.onrender.com'; // <--- ⚠️ METTEZ VOTRE URL RENDER ICI

export default function Login({ onLogin }) {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [error, setError] = useState(null);
    const [inviteToken, setInviteToken] = useState(null);

    // Détecter si l'utilisateur arrive avec une invitation (?token=...)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        if (token) {
            setInviteToken(token);
            setIsRegistering(true); // On le met direct en mode inscription
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        
        const endpoint = isRegistering ? '/auth/register' : '/auth/login';
        const body = isRegistering 
            ? { username, email, password, token: inviteToken } 
            : { email, password };

        try {
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await res.json();
            
            if (!res.ok) throw new Error(data);
            
            // Si inscription réussie, on connecte directement
            if (isRegistering) {
                // On pourrait faire un auto-login, mais pour l'instant on stocke juste le user retourné s'il contient un token, 
                // sinon on demande de se connecter. 
                // Simplification : On demande de se connecter après inscription ou on simule le login.
                // Pour faire simple et robuste, on alerte et on passe au login.
                alert("Compte créé avec succès ! Connectez-vous.");
                window.location.href = "/"; // Nettoie l'URL
            } else {
                onLogin(data.token, data.user);
            }

        } catch (err) {
            setError(typeof err === 'string' ? err : err.message);
        }
    };

    return (
        <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6'}}>
            <div style={{background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px', textAlign:'center'}}>
                
                {/* LOGO */}
                <img src="/logo.png" alt="Belisaire" style={{maxHeight: '80px', marginBottom: '20px'}} />
                
                <h2 style={{marginTop: 0, color: '#333'}}>
                    {isRegistering ? "Invitation Acceptée 🎟️" : "Espace Collaborateur"}
                </h2>

                {error && <div style={{background: '#fee2e2', color: '#ef4444', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize:'14px'}}>{error}</div>}

                <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                    {isRegistering && (
                        <input type="text" placeholder="Votre Nom (ex: Nejib)" value={username} onChange={e => setUsername(e.target.value)} required style={{padding: '12px', borderRadius: '6px', border: '1px solid #ddd'}} />
                    )}
                    <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={{padding: '12px', borderRadius: '6px', border: '1px solid #ddd'}} />
                    <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} required style={{padding: '12px', borderRadius: '6px', border: '1px solid #ddd'}} />
                    
                    <button type="submit" style={{background: '#b8860b', color: 'white', padding: '12px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize:'16px'}}>
                        {isRegistering ? "Créer mon compte" : "Se connecter"}
                    </button>
                </form>

                {!isRegistering && (
                    <div style={{marginTop: '20px', fontSize: '12px', color: '#888'}}>
                        Accès réservé au personnel.<br/>Demandez une invitation à la direction pour créer un compte.
                    </div>
                )}
            </div>
        </div>
    );
}