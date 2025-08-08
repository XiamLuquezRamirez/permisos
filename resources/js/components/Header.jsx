import React, { useState } from 'react';
import { FaChevronDown, FaUserCircle, FaSignOutAlt, FaSignInAlt } from 'react-icons/fa';
import { getImageUrl, getAssetUrl } from '../utils/assetHelper';
import axiosInstance from '../axiosConfig';
import { useUser } from './UserContext';

const Header = ({currentUser, showUserMenu, setShowUserMenu}) => {
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [hover, setHover] = useState(false);
    const { user, setUser } = useUser();

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await axiosInstance.post('/logout');
            // Limpiar el localStorage
            localStorage.removeItem('userPermitMe');
            // Redirigir inmediatamente a la página de login
            //obtener la url actual
            const url = getAssetUrl('login');
            window.location.href = url;
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        } finally {
            setIsLoggingOut(false);
        }
    };

    const handleUpdateUser = (updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem("userPermitMe", JSON.stringify(updatedUser));
    };

    return (
        <header className="header">
        <div className="header-content">
            <div className="logo-section">
                <img src={getImageUrl('images/logo.png')} alt="Logo" />
            </div>
            <div className="header-right">
                <div
                    className="user-section"
                    style={{ marginRight: "25px" }}
                >
                    <div
                        className="user-button"
                        onClick={() => setShowUserMenu(!showUserMenu)}
                    >
                        <div className="user-avatar">
                            <img src={currentUser?.foto} alt="Avatar" />
                        </div>
                        <span style={{ textTransform: "capitalize" }}>
                            {currentUser?.name || "Usuario"}
                        </span>
                        <FaChevronDown />
                    </div>

                    <div
                        className={`user-dropdown ${showUserMenu ? "active" : ""
                            }`}
                    >
                        {/* <div
                            className={`dropdown-item ${isLoggingOut ? "disabled" : ""
                                }`}
                            onClick={() => {
                                setShowProfileModal(true);
                                setShowUserMenu(false);
                            }}
                        >
                            <FaUserCircle />
                            <span>Mi Perfil</span>
                        </div> */}

                        <div
                            className={`dropdown-item ${isLoggingOut ? "disabled" : ""
                                }`}
                            onClick={
                                !isLoggingOut ? handleLogout : undefined
                            }
                            onMouseEnter={() => setHover(true)}
                            onMouseLeave={() => setHover(false)}
                        >

                            {hover ? <FaSignOutAlt /> : <FaSignInAlt />}

                            <span>
                                {isLoggingOut
                                    ? "Cerrando sesión..."
                                    : "Cerrar Sesión"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </header>
    );
};

export default Header;