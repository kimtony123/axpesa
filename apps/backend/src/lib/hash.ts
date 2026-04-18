import crypto from 'crypto';

const HASH_SALT = process.env.HASH_SALT || 'axpesa-default-salt-change-in-production';

export function hashIdentifier(identifier: string): string {
  return crypto
    .createHash('sha256')
    .update(identifier.toLowerCase().trim() + HASH_SALT)
    .digest('hex');
}

export function verifyHash(identifier: string, hash: string): boolean {
  return hashIdentifier(identifier) === hash;
}

export function maskIdentifier(identifier: string): string {
  if (identifier.includes('@')) {
    const [local, domain] = identifier.split('@');
    if (local.length <= 2) return `**@${domain}`;
    return `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
  }
  
  if (identifier.startsWith('+')) {
    const digits = identifier.slice(1);
    if (digits.length <= 4) return `${'+'.repeat(identifier.length - 4)}${digits.slice(-4)}`;
    return `${'+'.repeat(identifier.length - 6)}${digits.slice(-6)}`;
  }
  
  if (identifier.startsWith('0x')) {
    return `${identifier.slice(0, 8)}...${identifier.slice(-6)}`;
  }
  
  if (identifier.startsWith('cfx:')) {
    const addr = identifier.slice(4);
    return `cfx:${addr.slice(0, 8)}...${addr.slice(-6)}`;
  }
  
  if (identifier.length <= 4) return '*'.repeat(identifier.length);
  return `${identifier.slice(0, 2)}${'*'.repeat(identifier.length - 4)}${identifier.slice(-2)}`;
}
