import { useState } from 'react';

// Ce composant reçoit une fonction "onLogin" pour prévenir App.jsx quand c'est réussi
export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false); // Basculer entre Login et Inscription
  const [username, setUsername] = useState(''); // Pour l'inscription
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // On choisit la route (Login ou Register)
    // NOTE : Changez l'URL ici par votre URL Render si vous testez en ligne, ou localhost en local
    // Pour l'instant, on laisse localhost pour tester sur votre PC
    const endpoint = isRegistering 
        ? 'https://medina-app.onrender.com' 
        : 'https://medina-app.onrender.com';

    const body = isRegistering 
        ? { username, email, password } 
        : { email, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        // Si c'est un login réussi
        if (!isRegistering) {
            onLogin(data.token, data.user);
        } else {
            // Si l'inscription a marché, on bascule vers le login
            setIsRegistering(false);
            setError("Compte créé ! Connectez-vous maintenant.");
        }
      } else {
        setError(data);
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
    }
  };

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center', 
      height: '100vh', background: '#151b26', color: 'white'
    }}>
      <div style={{background: '#2a3447', padding: '40px', borderRadius: '10px', width: '300px'}}>
        <h2 style={{textAlign: 'center', marginBottom: '20px'}}>
            {isRegistering ? "📝 Créer un compte" : "🔐 Connexion Hôtel"}
        </h2>
        
        {error && <div style={{color: '#ff6b6b', marginBottom: '10px', fontSize: '0.9em'}}>{error}</div>}

        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
          
          {isRegistering && (
            <input 
              type="text" placeholder="Nom d'utilisateur" 
              value={username} onChange={e => setUsername(e.target.value)}
              style={{padding: '10px', borderRadius: '5px', border: 'none'}}
              required
            />
          )}

          <input 
            type="email" placeholder="Email professionnel" 
            value={email} onChange={e => setEmail(e.target.value)}
            style={{padding: '10px', borderRadius: '5px', border: 'none'}}
            required
          />
          
          <input 
            type="password" placeholder="Mot de passe" 
            value={password} onChange={e => setPassword(e.target.value)}
            style={{padding: '10px', borderRadius: '5px', border: 'none'}}
            required
          />

          <button type="submit" style={{
            padding: '10px', background: '#3b82f6', color: 'white', 
            border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold'
          }}>
            {isRegistering ? "S'inscrire" : "Se connecter"}
          </button>
        </form>

        <p style={{marginTop: '20px', textAlign: 'center', fontSize: '0.8em', color: '#ccc', cursor: 'pointer'}}
           onClick={() => setIsRegistering(!isRegistering)}>
           {isRegistering ? "J'ai déjà un compte" : "Pas de compte ? Créer un compte"}
        </p>
      </div>
    </div>
  );
}