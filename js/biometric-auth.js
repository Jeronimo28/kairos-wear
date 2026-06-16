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

// Registrar una nueva credencial biométrica
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

        const publicKeyOptions = {
            challenge: challenge,
            rp: {
                name: 'Kairos Wear',
                id: window.location.hostname
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
                authenticatorAttachment: 'platform',
                userVerification: 'required',
                residentKey: 'preferred'
            },
            timeout: 60000,
            attestation: 'none',
            excludeCredentials: []
        };

        const credential = await navigator.credentials.create({
            publicKey: publicKeyOptions
        });

        if (!credential) {
            throw new Error('No se pudo crear la credencial biométrica');
        }

        return {
            id: credential.id,
            rawId: arrayBufferToBase64(credential.rawId),
            type: credential.type
        };

    } catch (error) {
        console.error('Error registrando credencial biométrica:', error);
        throw new Error('Error al registrar: ' + error.message);
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

        const publicKeyOptions = {
            challenge: challenge,
            rpId: window.location.hostname,
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
        throw new Error('Verificación biométrica fallida: ' + error.message);
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

// Exportar funciones para uso global
window.isWebAuthnSupported = isWebAuthnSupported;
window.isBiometricAvailable = isBiometricAvailable;
window.registerBiometricCredential = registerBiometricCredential;
window.verifyBiometricLogin = verifyBiometricLogin;