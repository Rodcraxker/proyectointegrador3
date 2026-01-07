import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Leaf, User, Recycle, LogOut, QrCode, MapPin, AlertTriangle } from 'lucide-react';
import './style.css'; 

// --- CONFIGURACIÓN DE RED ---
// Esta es tu IP real de la red Wi-Fi de la PUCE
const API_URL = 'http://172.22.28.188:4000'; 

// --- INTERFACES ---
interface Usuario {
  id_usuario: number;
  nombre: string;
  puntos_actuales: number;
}

interface Material {
  id_material: number;
  nombre: string;
  puntos_por_kg: number;
}

interface MensajeEstado {
  texto: string;
  tipo: 'error' | 'success' | 'info' | '';
}

// --- FÓRMULA DE HAVERSINE ---
function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; 
  return d * 1000; 
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

function App() {
  // --- ESTADOS ---
  const [user, setUser] = useState<Usuario | null>(null);
  const [emailInput, setEmailInput] = useState<string>('');
  const [materiales, setMateriales] = useState<Material[]>([]);
  
  // Estados para el proceso de reciclaje
  const [modoEscaneo, setModoEscaneo] = useState(false);
  const [basureroValidado, setBasureroValidado] = useState(false);
  const [distanciaActual, setDistanciaActual] = useState<number | null>(null);

  const [form, setForm] = useState({ materialId: '', peso: '' });
  const [mensaje, setMensaje] = useState<MensajeEstado>({ texto: '', tipo: '' });

  // Cargar materiales al inicio
  useEffect(() => {
    // CAMBIO: Usamos la IP en lugar de localhost
    axios.get(`${API_URL}/api/materiales`)
      .then(res => setMateriales(res.data))
      .catch(err => console.error("Error conectando al backend:", err));
  }, []);

  // --- LOGIN ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/api/login`, { email: emailInput });
      setUser(res.data);
      setMensaje({ texto: '', tipo: '' });
    } catch (err) {
      setMensaje({ texto: 'Usuario no encontrado o error de conexión', tipo: 'error' });
    }
  };

  // --- LÓGICA DEL ESCÁNER Y GPS ---
  const handleScan = (result: any) => {
    if (result) {
      try {
        const rawValue = result[0]?.rawValue;
        if (!rawValue) return;

        const dataBasurero = JSON.parse(rawValue);
        
        if (!dataBasurero.lat || !dataBasurero.lng) {
          setMensaje({ texto: 'QR Inválido: No es un basurero EcoTrace.', tipo: 'error' });
          setModoEscaneo(false);
          return;
        }

        if (!navigator.geolocation) {
          setMensaje({ texto: 'Tu navegador no soporta GPS.', tipo: 'error' });
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;

            const metros = getDistanceFromLatLonInMeters(
              userLat, userLng, 
              dataBasurero.lat, dataBasurero.lng
            );

            setDistanciaActual(Math.round(metros));

            // VALIDACIÓN: 10 metros de margen
            if (metros <= 10) { 
              setBasureroValidado(true);
              setModoEscaneo(false); 
              setMensaje({ texto: `¡Conectado! Estás a ${Math.round(metros)}m del basurero.`, tipo: 'success' });
            } else {
              setModoEscaneo(false);
              setMensaje({ texto: `Estás muy lejos (${Math.round(metros)}m). Acércate al basurero (<5m).`, tipo: 'error' });
            }
          },
          (error) => {
            console.error("Error de GPS:", error);
            setMensaje({ texto: 'Error obteniendo ubicación. Asegúrate de dar permisos.', tipo: 'error' });
            setModoEscaneo(false);
          }
        );

      } catch (error) {
        setMensaje({ texto: 'Error leyendo QR.', tipo: 'error' });
        setModoEscaneo(false);
      }
    }
  };

  // --- ENVIAR DATOS ---
  const handleReciclar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.materialId || !form.peso) return;

    try {
      await axios.post(`${API_URL}/api/reciclar`, {
        id_usuario: user.id_usuario,
        id_material: form.materialId,
        peso: form.peso
      });
      
      const userRes = await axios.get(`${API_URL}/api/usuario/${user.id_usuario}`);
      setUser(userRes.data);
      
      setMensaje({ texto: '¡Puntos sumados exitosamente!', tipo: 'success' });
      setForm({ materialId: '', peso: '' });
      setBasureroValidado(false); 
      setDistanciaActual(null);

    } catch (err: any) {
      setMensaje({ texto: 'Error en el servidor', tipo: 'error' });
    }
  };

  // --- VISTA LOGIN ---
  if (!user) {
    return (
      <div className="container">
        <div className="card login-card">
          <Leaf size={60} color="#059669" style={{marginBottom: 20}} />
          <h1 style={{color: '#1e293b'}}>EcoTrace PUCE</h1>
          <p>Ingresa tu correo institucional</p>
          {mensaje.texto && <div className={`msg-box msg-${mensaje.tipo}`}>{mensaje.texto}</div>}
          <form onSubmit={handleLogin}>
            <input className="input-field" placeholder="ej. estudiante@puce.edu.ec" value={emailInput} onChange={e => setEmailInput(e.target.value)} />
            <button className="btn-primary">Ingresar</button>
          </form>
        </div>
      </div>
    );
  }

  // --- VISTA DASHBOARD ---
  return (
    <div className="container">
      <div className="header">
        <div>
          <h2>Hola, {user.nombre}</h2>
          <span className="user-badge"><User size={14}/> Estudiante</span>
        </div>
        <div style={{textAlign: 'right'}}>
          <div className="points-display">{user.puntos_actuales}</div>
          <small>Puntos</small>
        </div>
      </div>

      {mensaje.texto && (
        <div className={`msg-box msg-${mensaje.tipo}`}>
          {mensaje.tipo === 'error' ? <AlertTriangle size={20}/> : <MapPin size={20}/>}
          {mensaje.texto}
        </div>
      )}

      {!basureroValidado ? (
        <div className="card" style={{textAlign: 'center'}}>
          <h3><QrCode size={24} style={{verticalAlign: 'middle'}}/> Paso 1: Escanear Basurero</h3>
          <p style={{color: '#64748b'}}>Debes estar cerca del basurero para desbloquear el formulario.</p>
          
          {modoEscaneo ? (
            <div style={{marginTop: 20}}>
              <p>Apunta al código QR...</p>
              <div style={{width: '100%', maxWidth: '300px', margin: '0 auto', border: '2px solid #10b981', borderRadius: 8, overflow: 'hidden'}}>
                <Scanner onScan={handleScan} />
              </div>
              <button onClick={() => setModoEscaneo(false)} className="btn-logout" style={{marginTop: 10, width: '100%', justifyContent: 'center'}}>
                Cancelar Cámara
              </button>
            </div>
          ) : (
            <button onClick={() => setModoEscaneo(true)} className="btn-primary" style={{marginTop: 10}}>
              Activar Cámara
            </button>
          )}
        </div>
      ) : (
        <div className="card">
          <h3 className="card-title"><Recycle color="#10b981"/> Registrar Depósito</h3>
          <div style={{fontSize: 12, color: '#059669', marginBottom: 15, display: 'flex', alignItems: 'center', gap: 5}}>
             <MapPin size={12}/> Ubicación validada ({distanciaActual}m)
          </div>
          <hr className="divider" />
          
          <form onSubmit={handleReciclar}>
            <label className="label">Material:</label>
            <select className="input-field" value={form.materialId} onChange={e => setForm({...form, materialId: e.target.value})}>
              <option value="">Seleccione...</option>
              {materiales.map(m => (
                <option key={m.id_material} value={m.id_material}>{m.nombre} ({m.puntos_por_kg} pts/kg)</option>
              ))}
            </select>

            <label className="label">Peso (Kg):</label>
            <input type="number" step="0.1" className="input-field" value={form.peso} onChange={e => setForm({...form, peso: e.target.value})} />

            <button className="btn-primary" type="submit">Confirmar Reciclaje</button>
          </form>
        </div>
      )}

      <button onClick={() => setUser(null)} className="btn-logout">
        <LogOut size={16}/> Cerrar Sesión
      </button>
    </div>
  );
}

export default App;