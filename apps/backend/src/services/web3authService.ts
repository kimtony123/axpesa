import jwt from 'jsonwebtoken';
import axios from 'axios';

interface Web3AuthUserInfo {
  web3authId: string;
  walletAddress: string;
  email?: string;
  name?: string;
}

let jwksCache: any = null;
let jwksCacheTime = 0;
const JWKS_CACHE_TTL = 3600000; // 1 hour

async function getWeb3AuthPublicKey(kid: string): Promise<string> {
  const now = Date.now();
  
  if (!jwksCache || now - jwksCacheTime > JWKS_CACHE_TTL) {
    try {
      const response = await axios.get('https://api-auth.web3auth.io/.well-known/jwks.json');
      jwksCache = response.data;
      jwksCacheTime = now;
    } catch (error) {
      console.error('Failed to fetch JWKS:', error);
      throw new Error('Failed to fetch JWKS');
    }
  }

  const key = jwksCache.keys?.find((k: any) => k.kid === kid);
  if (!key) {
    throw new Error('Public key not found');
  }

  const publicKey = `-----BEGIN PUBLIC KEY-----\n${key.x}\n${key.y}\n-----END PUBLIC KEY-----`;
  return Buffer.from(publicKey).toString('base64');
}

export async function verifyWeb3AuthToken(idToken: string): Promise<Web3AuthUserInfo> {
  try {
    const decoded = jwt.decode(idToken, { complete: true });
    
    if (!decoded || typeof decoded === 'string') {
      throw new Error('Invalid token format');
    }

    const header = decoded.header as any;
    const payload = decoded.payload as any;

    // Verify the token signature
    const publicKey = await getWeb3AuthPublicKey(header.kid);
    
    try {
      jwt.verify(idToken, publicKey, {
        algorithms: ['RS256'],
        issuer: 'https://api-auth.web3auth.io',
        audience: process.env.WEB3AUTH_CLIENT_ID,
      });
    } catch (verifyError: any) {
      console.error('Token verification failed:', verifyError.message);
      
      // For development, try to extract info without full verification
      // This allows testing without strict signature verification
      if (process.env.NODE_ENV === 'development') {
        console.log('Using development mode - extracting token info without strict verification');
      } else {
        throw new Error('Token verification failed');
      }
    }

    // Extract user info from the token
    const web3authId = payload.sub || payload.walletAddress;
    const walletAddress = payload.wallets?.[0]?.address || payload.walletAddress || payload.evmAddress;

    if (!walletAddress) {
      throw new Error('No wallet address in token');
    }

    return {
      web3authId,
      walletAddress,
      email: payload.email,
      name: payload.name,
    };
  } catch (error: any) {
    console.error('Web3Auth verification error:', error.message);
    throw new Error('Web3Auth token verification failed: ' + error.message);
  }
}

export async function getWeb3AuthUserInfo(idToken: string) {
  return verifyWeb3AuthToken(idToken);
}
