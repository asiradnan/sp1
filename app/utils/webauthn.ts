import { api } from './api';

// Helper function to convert ArrayBuffer to base64url
function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Helper function to convert base64url to ArrayBuffer
function base64UrlToArrayBuffer(base64url: string): ArrayBuffer {
  // Add padding if needed
  const padding = '='.repeat((4 - (base64url.length % 4)) % 4);
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/') + padding;
  
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function startRegistration(
  username: string,
  firstName: string,
  lastName: string,
  email: string
) {
  console.log("=== START REGISTRATION ===");
  console.log("Input parameters:", { username, firstName, lastName, email });

  try {
    // Step 1: Get registration challenge from server
    console.log("Step 1: Getting registration challenge...");
    const challengeResponse = await api.getRegistrationChallenge({
      username,
      first_name: firstName,
      last_name: lastName,
      email,
    });

    console.log("Challenge response:", challengeResponse);

    // Step 2: Prepare credential creation options
    const credentialCreationOptions: CredentialCreationOptions = {
      publicKey: {
        challenge: base64UrlToArrayBuffer(challengeResponse.challenge),
        rp: {
          id: challengeResponse.rp.id,
          name: challengeResponse.rp.name,
        },
        user: {
          id: base64UrlToArrayBuffer(challengeResponse.user.id),
          name: challengeResponse.user.name,
          displayName: challengeResponse.user.displayName,
        },
        pubKeyCredParams: challengeResponse.pubKeyCredParams.map((param: any) => ({
          type: param.type as PublicKeyCredentialType,
          alg: param.alg,
        })),
        timeout: challengeResponse.timeout,
        authenticatorSelection: {
          authenticatorAttachment: challengeResponse.authenticatorSelection.authenticatorAttachment as AuthenticatorAttachment,
          residentKey: challengeResponse.authenticatorSelection.residentKey as ResidentKeyRequirement,
          userVerification: challengeResponse.authenticatorSelection.userVerification as UserVerificationRequirement,
        },
        attestation: challengeResponse.attestation as AttestationConveyancePreference,
      },
    };

    console.log("Credential creation options:", credentialCreationOptions);

    // Step 3: Create credential using WebAuthn API
    console.log("Step 3: Creating credential with navigator.credentials.create...");
    const credential = await navigator.credentials.create(credentialCreationOptions) as PublicKeyCredential;

    if (!credential) {
      throw new Error("Failed to create credential");
    }

    console.log("Credential created:", credential);
    console.log("Credential ID:", credential.id);
    console.log("Credential rawId:", credential.rawId);
    console.log("Credential response:", credential.response);

    // Ensure we have the required properties
    if (!credential.id) {
      throw new Error("Credential missing required id");
    }

    if (!credential.rawId) {
      throw new Error("Credential missing required rawId");
    }

    const response = credential.response as AuthenticatorAttestationResponse;
    
    if (!response.clientDataJSON) {
      throw new Error("Credential response missing clientDataJSON");
    }

    if (!response.attestationObject) {
      throw new Error("Credential response missing attestationObject");
    }

    // Step 4: Prepare verification data
    const verificationData = {
      username,
      credential_id: credential.id, // This should be the base64url encoded credential ID
      client_data_json: arrayBufferToBase64Url(response.clientDataJSON),
      attestation_object: arrayBufferToBase64Url(response.attestationObject),
    };

    console.log("Verification data:", verificationData);

    // Step 5: Send to server for verification
    console.log("Step 5: Sending verification data to server...");
    const verificationResponse = await api.verifyRegistration(verificationData);

    console.log("Verification response:", verificationResponse);
    console.log("=== REGISTRATION COMPLETED ===");

    return verificationResponse;

  } catch (error) {
    console.error("=== REGISTRATION FAILED ===");
    console.error("Error details:", error);
    
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    throw error;
  }
}

export async function startAuthentication(username?: string) {
  console.log("=== START AUTHENTICATION ===");
  console.log("Username:", username);

  try {
    // Step 1: Get authentication challenge
    const challengeResponse = await api.getAuthenticationChallenge({ username });
    console.log("Challenge response:", challengeResponse);

    // Step 2: Prepare credential request options
    const credentialRequestOptions: CredentialRequestOptions = {
      publicKey: {
        challenge: base64UrlToArrayBuffer(challengeResponse.challenge),
        timeout: challengeResponse.timeout,
        rpId: challengeResponse.rpId,
        allowCredentials: challengeResponse.allowCredentials?.map((cred: any) => ({
          type: 'public-key' as PublicKeyCredentialType,
          id: base64UrlToArrayBuffer(cred.id),
        })),
        userVerification: challengeResponse.userVerification as UserVerificationRequirement,
      },
    };

    console.log("Credential request options:", credentialRequestOptions);

    // Step 3: Get credential
    const credential = await navigator.credentials.get(credentialRequestOptions) as PublicKeyCredential;

    if (!credential) {
      throw new Error("Failed to get credential");
    }

    console.log("Credential retrieved:", credential);

    const response = credential.response as AuthenticatorAssertionResponse;

    // Step 4: Prepare verification data
    const verificationData = {
      credential_id: credential.id,
      authenticator_data: arrayBufferToBase64Url(response.authenticatorData),
      client_data_json: arrayBufferToBase64Url(response.clientDataJSON),
      signature: arrayBufferToBase64Url(response.signature),
      user_handle: response.userHandle ? arrayBufferToBase64Url(response.userHandle) : undefined,
    };

    console.log("Verification data:", verificationData);

    // Step 5: Verify with server
    const verificationResponse = await api.verifyAuthentication(verificationData);
    console.log("Verification response:", verificationResponse);
    console.log("=== AUTHENTICATION COMPLETED ===");

    return verificationResponse;

  } catch (error) {
    console.error("=== AUTHENTICATION FAILED ===");
    console.error("Error details:", error);
    throw error;
  }
}
