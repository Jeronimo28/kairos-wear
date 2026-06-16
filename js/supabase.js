// js/supabase.js
const supabaseUrl = 'https://rxsqjhoifmeupqbjhljc.supabase.co';
const supabaseAnonKey = 'sb_publishable_GoXnbk9NQzY8VZ5-M8rhUA_CMmX9HYu';

// Crear cliente
window.supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);

// ========== LOGIN CON GOOGLE (con selector de cuenta) ==========
window.loginWithGoogle = async function() {
    const { data, error } = await window.supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: 'https://jeronimo28.github.io/kairos-wear/index.html',
            queryParams: {
                prompt: 'select_account'
            }
        }
    });
    if (error) {
        console.error('Error login Google:', error);
        alert('Error al iniciar sesión con Google: ' + error.message);
    }
}

// ========== LOGOUT ==========
window.logoutKairos = async function() {
    await window.supabaseClient.auth.signOut();
    localStorage.removeItem('kairosUser');
    window.location.href = 'landing.html';
}

// ========== VERIFICAR 2FA Y REDIRIGIR ==========
window.checkMFAAndRedirect = async function(redirectUrl = '/index.html') {
    try {
        // Primero asegurar que tenemos sesión
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session) return false;
        
        const { data, error } = await window.supabaseClient.auth.mfa.getAuthenticatorAssuranceLevel();
        
        if (error) {
            console.error('Error MFA:', error);
            return false;
        }
        
        console.log('MFA - Nivel actual:', data.currentLevel, 'Nivel requerido:', data.nextLevel);
        
        // Si tiene 2FA activado y no lo ha verificado en esta sesión
        if (data.currentLevel === 'aal1' && data.nextLevel === 'aal2') {
            // Guardar a dónde redirigir después del 2FA
            localStorage.setItem('mfaRedirectAfter', redirectUrl);
            // Redirigir a la página de verificación
            window.location.href = 'mfa-verify.html';
            return true;
        }
        
        return false;
    } catch (err) {
        console.error('Error en checkMFAAndRedirect:', err);
        return false;
    }
}

// Función para obtener sesión actual
async function getCurrentSession() {
    const { data: { session }, error } = await window.supabaseClient.auth.getSession();
    if (error || !session) {
        const { data: { session: refreshed }, error: refreshError } = 
            await window.supabaseClient.auth.refreshSession();
        if (refreshError) return null;
        return refreshed;
    }
    return session;
}

// Sincronizar localStorage con Supabase
async function syncUserWithLocalStorage() {
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (user) {
        const existingUser = JSON.parse(localStorage.getItem('kairosUser') || '{}');
        const updatedUser = {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || existingUser.name || user.email?.split('@')[0],
            loggedIn: true
        };
        localStorage.setItem('kairosUser', JSON.stringify(updatedUser));
        return updatedUser;
    }
    return null;
}

// Ejecutar al cargar
syncUserWithLocalStorage();

// Escuchar cambios de autenticación
window.supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
        syncUserWithLocalStorage();
    }
    if (event === 'SIGNED_OUT') {
        localStorage.removeItem('kairosUser');
    }
});
