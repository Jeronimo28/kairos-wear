// js/biometric-auth.js
// ============================================================================
// AUTENTICACIÓN BIOMÉTRICA - API WebAuthn (FIDO2 / W3C Standard)
// ============================================================================
// Este archivo contiene la lógica para registrar y verificar credenciales
// biométricas (como Face ID o Touch ID) de manera local utilizando criptografía
// de clave pública.
// ============================================================================

/**
 * Verifica si el navegador soporta el estándar WebAuthn (API PublicKeyCredential).
 * WebAuthn está disponible en la mayoría de navegadores modernos bajo HTTPS (o localhost).
 * 
 * @returns {boolean} true si el navegador es compatible.
 */
function isWebAuthnSupported() {
    return window.PublicKeyCredential !== undefined;
}

/**
 * Verifica si el dispositivo físico actual cuenta con un autenticador de plataforma activo.
 * Un autenticador de plataforma es el sensor de seguridad integrado en el hardware
 * del dispositivo (ej. Face ID/Touch ID en iPhone/Mac, Windows Hello en PC).
 * 
 * @returns {Promise<boolean>} true si hay un sensor biométrico disponible y configurado.
 */
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

/**
 * Registra una nueva credencial biométrica (Clave de Acceso) en el dispositivo.
 * Genera un par de claves asimétricas: la clave privada se guarda en el Secure Enclave
 * del dispositivo y la clave pública se devuelve para ser guardada en la base de datos (Supabase).
 * 
 * @param {Object} user - Datos del usuario actual logueado.
 * @returns {Promise<Object>} Datos de la clave pública generada para guardar en BD.
 */
async function registerBiometricCredential(user) {
    if (!isWebAuthnSupported()) {
        throw new Error('Tu navegador no soporta autenticación biométrica. Usa Chrome, Edge o Safari.');
    }

    const available = await isBiometricAvailable();
    if (!available) {
        throw new Error('Tu dispositivo no tiene sensor biométrico (huella o Face ID) disponible.');
    }

    try {
        // Generar un reto (challenge) criptográfico aleatorio de 32 bytes para prevenir ataques de replay.
        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);

        // RP ID (Relying Party ID): El dominio exacto de la aplicación.
        // WebAuthn vincula la credencial estrictamente a este dominio.
        // Si el dominio cambia (ej. en phishing), el navegador bloqueará la autenticación.
        const rpId = window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname;

        // Opciones de configuración para navigator.credentials.create()
        const publicKeyOptions = {
            challenge: challenge,
            rp: {
                name: 'Kairos Wear',
                id: rpId // Vinculación de dominio estricta (Previene Phishing)
            },
            user: {
                // El ID de usuario debe ser un buffer de bytes único
                id: new TextEncoder().encode(user.id),
                name: user.email,
                displayName: user.name || user.email
            },
            // Algoritmos criptográficos aceptados (ECDSA con curvas secp256r1 y RSA)
            pubKeyCredParams: [
                { type: 'public-key', alg: -7 },   // ES256 (Criptografía de curva elíptica)
                { type: 'public-key', alg: -257 }  // RS256 (RSA tradicional)
            ],
            authenticatorSelection: {
                // 'platform' restringe el registro a sensores locales (Face ID/Touch ID) del propio dispositivo.
                // Evita que aparezcan menús para insertar llaves USB externas (roaming authenticators).
                authenticatorAttachment: 'platform',
                userVerification: 'required', // Obliga a realizar la comprobación biométrica física
                residentKey: 'required',      // Fuerza que la credencial se guarde localmente en el llavero
                requireResidentKey: true
            },
            timeout: 60000, // Tiempo límite de espera de 1 minuto
            attestation: 'none',
            excludeCredentials: []
        };

        console.log('🔐 Intentando registrar biometría con:', publicKeyOptions);

        // Llamada nativa del navegador. Muestra la pantalla del sistema de Face ID
        const credential = await navigator.credentials.create({
            publicKey: publicKeyOptions
        });

        if (!credential) {
            throw new Error('No se pudo crear la credencial biométrica');
        }

        console.log('✅ Credencial biométrica registrada:', credential.id);

        // Retornar ID de la credencial y su representación en Base64 para guardarla
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

/**
 * Verifica la identidad del usuario usando Face ID o Touch ID.
 * Solicita que el dispositivo firme criptográficamente un desafío enviado por el sistema
 * utilizando la clave privada guardada en el dispositivo.
 * 
 * @returns {Promise<Credential>} El objeto credencial firmado por el dispositivo.
 */
async function verifyBiometricLogin() {
    if (!isWebAuthnSupported()) {
        throw new Error('Tu navegador no soporta autenticación biométrica.');
    }

    try {
        // Leer la credencial guardada localmente
        const savedCredential = JSON.parse(localStorage.getItem('biometric_credential'));
        if (!savedCredential) {
            throw new Error('No hay credencial biométrica registrada.');
        }

        // Generar un reto criptográfico fresco de 32 bytes para prevenir suplantaciones de replay
        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);

        const rpId = window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname;

        // Opciones de configuración para navigator.credentials.get()
        const publicKeyOptions = {
            challenge: challenge,
            rpId: rpId, // Comprobación estricta de origen del navegador
            allowCredentials: [{
                id: base64ToArrayBuffer(savedCredential.rawId),
                type: 'public-key',
                transports: ['internal'] // Exige sensores locales (Face ID/Touch ID nativos)
            }],
            userVerification: 'required', // Requerir biometría física obligatoria
            timeout: 60000
        };

        // Solicita el escaneo facial nativo del dispositivo para firmar el reto
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

// ========== FUNCIONES DE UTILIDAD (Conversiones de ArrayBuffer a Base64 y viceversa) ==========

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

/**
 * Limpia la credencial local guardada en el navegador.
 */
function clearBiometricCredential() {
    localStorage.removeItem('biometric_credential');
    console.log('🗑️ Credencial biométrica eliminada');
}

// Exportación global de funciones para uso en las distintas vistas HTML
window.isWebAuthnSupported = isWebAuthnSupported;
window.isBiometricAvailable = isBiometricAvailable;
window.registerBiometricCredential = registerBiometricCredential;
window.verifyBiometricLogin = verifyBiometricLogin;
window.clearBiometricCredential = clearBiometricCredential;