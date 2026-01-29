import { useState } from 'react';

// Ce composant reçoit une fonction "onLogin" pour prévenir App.jsx quand c'est réussi
export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false); 
  const [username, setUsername] = useState(''); 
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // --- CORRECTION ICI ---
    // 1. On définit l'adresse de base du CERVEAU (API), pas du site web.
    // REMPLACEZ L'ADRESSE CI-DESSOUS PAR CELLE DE VOTRE SERVICE "medina-api" SUR RENDER
    const apiBase = 'https://medina-api.onrender.com'; 

    // 2. On ajoute le bon chemin (/auth/register ou /auth/login)
    const endpoint = isRegistering 
        ? `${apiBase}/auth/register` 
        : `${apiBase}/auth/login`;
    // ---------------------

    const body = isRegistering 
        ? { username, email, password } 
        : { email, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      // Attention : Si le serveur renvoie une erreur (ex: mot de passe faux), 
      // il faut pouvoir lire le message même si ce n'est pas du JSON parfait parfois.
      const data = await response.json();

      if (response.ok) {
        if (!isRegistering) {
            onLogin(data.token, data.user);
        } else {
            setIsRegistering(false);
            setError("Compte créé ! Connectez-vous maintenant.");
        }
      } else {
        // Affiche l'erreur renvoyée par le serveur (ex: "Mot de passe incorrect")
        setError(typeof data === 'string' ? data : "Erreur d'identification");
      }
    } catch (err) {
      console.error(err);
      setError("Erreur de connexion au serveur (Vérifiez l'URL API)");
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