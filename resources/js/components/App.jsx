import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginForm from './LoginForm';
import { useUser } from './UserContext';
import Principal from './Principal';

function App() {
    const { user } = useUser();
    alert("ENTRA APP");
    return (
        <HashRouter>
            <Routes>
                <Route
                    path="/login"
                    element={user ? <Navigate to="/dashboard" /> : <LoginForm />}
                />

                {/* Ruta raíz */}
                <Route
                    path="/"
                    element={user ? <Navigate to="/principal" /> : <Navigate to="/login" />}
                />

                   {/* Ruta protegida */}
                   <Route
                    path="/principal"
                    element={user ? <Principal /> : <Navigate to="/login" />}
                />

                {/* Ruta por defecto */}
                <Route 
                    path="*" 
                    element={<Navigate to="/" />} 
                />
            </Routes>
        </HashRouter>
    );
}

export default App;
