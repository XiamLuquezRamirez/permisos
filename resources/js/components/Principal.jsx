import React, { useState } from 'react';
import Header from './Header';
//import Sidebar from './Sidebar';
import { useUser } from './UserContext';
import GestionarPermisos from './GestionarPermisos';


const Principal = () => {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const { user, setUser } = useUser();

    return (
        <div className="dashboard-container">
       
       <div className="dashboard-container">
                <Header 
                    currentUser={user}
                    showUserMenu={showUserMenu}
                    setShowUserMenu={setShowUserMenu}
                />
                <div className="main-content">
                    <GestionarPermisos user={user} />
                </div>
            </div>
        </div>
    );
};

export default Principal;