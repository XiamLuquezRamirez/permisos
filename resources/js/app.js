import React from 'react';
import { createRoot } from 'react-dom/client';
import { UserProvider } from './components/UserContext';
import App from './components/App';

const root = createRoot(document.getElementById('app'));

root.render(
    <React.StrictMode>
        <UserProvider>
            <App />
        </UserProvider> 
    </React.StrictMode>
);

// Habilitar hot reloading
if (module.hot) {
    module.hot.accept();
}


