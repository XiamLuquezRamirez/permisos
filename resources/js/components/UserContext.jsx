import { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser debe ser usado dentro de un UserProvider');
    }
    return context;
};

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        // Inicializar el estado con los datos del localStorage si existen
        const storedUser = localStorage.getItem('userPermitMe');
        return storedUser ? JSON.parse(storedUser) : null;
    });
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            // Solo actualizar si no hay usuario o si el token ha cambiado
            const storedUser = localStorage.getItem('userPermitMe');
            if (!storedUser) {
                setLoading(false);
                return;
            }

            try {
                const usuario = JSON.parse(storedUser);
                setUser(usuario);
            } catch (error) {
                console.error('Error al parsear usuario:', error);
                localStorage.removeItem('userPermitMe');
                localStorage.removeItem('token');
            }
            
            setLoading(false);
        };

        fetchUser();
    }, []); // Solo se ejecuta al montar el componente

    const value = {
        user,
        setUser,
        loading
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
}

export default UserContext;

