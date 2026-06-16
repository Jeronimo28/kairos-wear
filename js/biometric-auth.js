// js/biometric-auth.js
// ============================================
// AUTENTICACIÓN BIOMÉTRICA - WebAuthn API
// ============================================

// Verificar si el navegador soporta WebAuthn
function isWebAuthnSupported() {
    return window.PublicKeyCredential !== undefined;
}

// Verificar si el dispositivo tiene sensor biométrico
async function isBiometricAvailable() {
    if (!isWebAuthnSupported()) return false;
    try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        return available;
    } catch (error) {
        console.error('Error verificando disponibilidad biométrica:', error);
        return false;
    }
}

// Registrar una nueva credencial biométrica (FORZANDO Face ID)
async function registerBiometricCredential(user) {
    if (!isWebAuthnSupported()) {
        throw new Error('Tu navegador no soporta autenticación biométrica. Usa Chrome, Edge o Safari.');
    }

    const available = await isBiometricAvailable();
    if (!available) {
        throw new Error('Tu dispositivo no tiene sensor biométrico (huella o Face ID) disponible.');
    }

    try {
        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);

        // Determinar el RP ID correcto
        const rpId = window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname;

        const publicKeyOptions = {
            challenge: challenge,
            rp: {
                name: 'Kairos Wear',
                id: rpId
            },
            user: {
                id: new TextEncoder().encode(user.id),
                name: user.email,
                displayName: user.name || user.email
            },
            pubKeyCredParams: [
                { type: 'public-key', alg: -7 },
                { type: 'public-key', alg: -257 }
            ],
            authenticatorSelection: {
                authenticatorAttachment: 'platform',  // Fuerza Face ID en iPhone
                userVerification: 'required',
                residentKey: 'required',  // Cambiado de 'preferred' a 'required'
                requireResidentKey: true  // Forzar que la clave sea residente
            },
            timeout: 60000,
            attestation: 'none',
            excludeCredentials: []
        };

        console.log('🔐 Intentando registrar biometría con:', publicKeyOptions);

        const credential = await navigator.credentials.create({
            publicKey: publicKeyOptions
        });

        if (!credential) {
            throw new Error('No se pudo crear la credencial biométrica');
        }

        console.log('✅ Credencial biométrica registrada:', credential.id);

        return {
            id: credential.id,
            rawId: arrayBufferToBase64(credential.rawId),
            type: credential.type
        };

    } catch (error) {
        console.error('Error registrando credencial biométrica:', error);
        
        // Mensajes de error más amigables
        if (error.name === 'NotAllowedError') {
            throw new Error('No se recibió autorización. Asegúrate de usar Face ID o Touch ID.');
        } else if (error.name === 'InvalidStateError') {
            throw new Error('Ya existe una credencial biométrica registrada para este dispositivo.');
        } else {
            throw new Error('Error al registrar: ' + error.message);
        }
    }
}

// Verificar autenticación biométrica
async function verifyBiometricLogin() {
    if (!isWebAuthnSupported()) {
        throw new Error('Tu navegador no soporta autenticación biométrica.');
    }

    try {
        const savedCredential = JSON.parse(localStorage.getItem('biometric_credential'));
        if (!savedCredential) {
            throw new Error('No hay credencial biométrica registrada.');
        }

        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);

        const rpId = window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname;

        const publicKeyOptions = {
            challenge: challenge,
            rpId: rpId,
            allowCredentials: [{
                id: base64ToArrayBuffer(savedCredential.rawId),
                type: 'public-key'
            }],
            userVerification: 'required',
            timeout: 60000
        };

        const credential = await navigator.credentials.get({
            publicKey: publicKeyOptions
        });

        if (!credential) {
            throw new Error('Verificación biométrica fallida');
        }

        return credential;

    } catch (error) {
        console.error('Error verificando biometría:', error);
        
        if (error.name === 'NotAllowedError') {
            throw new Error('No se recibió autorización. Asegúrate de usar Face ID o Touch ID.');
        } else {
            throw new Error('Verificación biométrica fallida: ' + error.message);
        }
    }
}

// ========== FUNCIONES DE UTILIDAD ==========

function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

// ============================================
// FUNCIÓN AUXILIAR PARA LIMPIAR CREDENCIALES
// ============================================
function clearBiometricCredential() {
    localStorage.removeItem('biometric_credential');
    console.log('🗑️ Credencial biométrica eliminada');
}

// ============================================
// EXPORTAR FUNCIONES PARA USO GLOBAL
// ============================================
window.isWebAuthnSupported = isWebAuthnSupported;
window.isBiometricAvailable = isBiometricAvailable;
window.registerBiometricCredential = registerBiometricCredential;
window.verifyBiometricLogin = verifyBiometricLogin;
window.clearBiometricCredential = clearBiometricCredential;
