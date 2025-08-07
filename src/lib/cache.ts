import { promises as fs } from 'fs';
import path from 'path';
import { env } from './env.server';

const CACHE_DIR = env.CACHE_DIR;

// Ensure the cache directory exists
async function ensureCacheDir() {
  await fs.mkdir(CACHE_DIR, { recursive: true });
}

// Extract username from LinkedIn URL
export function extractUsernameFromUrl(linkedinUrl: string): string {
  const url = new URL(linkedinUrl);
  const pathParts = url.pathname.split('/').filter(part => part);
  
  // LinkedIn URLs are typically: linkedin.com/in/username
  if (pathParts.length >= 2 && pathParts[0] === 'in') {
    return pathParts[1];
  }
  
  // Fallback: use the last part of the path
  return pathParts[pathParts.length - 1] || 'unknown';
}

// Generate a filename for a LinkedIn profile cache entry
// Format: {username}_{YYYY-MM-DD}.json
export function getCacheFilename(username: string): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day = String(today.getDate()).padStart(2, '0');
  return path.join(CACHE_DIR, `${username}_${year}-${month}-${day}.json`);
}

// Save data to a cache file with metadata
export async function saveToCache(linkedinUrl: string, data: any): Promise<void> {
  await ensureCacheDir();
  const username = extractUsernameFromUrl(linkedinUrl);
  const filename = getCacheFilename(username);
  
  const cacheData = {
    metadata: {
      linkedinUrl,
      username,
      scrapedAt: new Date().toISOString(),
      cacheExpiresAt: new Date(Date.now() + env.CACHE_EXPIRATION_DAYS * 24 * 60 * 60 * 1000).toISOString()
    },
    profileData: data
  };
  
  await fs.writeFile(filename, JSON.stringify(cacheData, null, 2), 'utf-8');
  console.log(`✅ Saved ${username} to cache: ${filename}`);
}

// Load data from a cache file
export async function loadFromCache(linkedinUrl: string): Promise<any | null> {
  const username = extractUsernameFromUrl(linkedinUrl);
  const filename = getCacheFilename(username);
  
  try {
    const data = await fs.readFile(filename, 'utf-8');
    const cacheData = JSON.parse(data);
    console.log(`📋 Loaded ${username} from cache: ${filename}`);
    return cacheData.profileData;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // File not found, not an error for caching purposes
      return null;
    }
    console.error(`❌ Error loading ${username} from cache:`, error);
    return null;
  }
}

// Check if a cache entry exists and is fresh (within the expiration period)
export async function isCacheFresh(linkedinUrl: string): Promise<boolean> {
  const username = extractUsernameFromUrl(linkedinUrl);
  const filename = getCacheFilename(username);
  
  try {
    const stats = await fs.stat(filename);
    const fileDate = stats.mtime; // Modification time of the file
    const today = new Date();

    // Calculate difference in days
    const diffTime = Math.abs(today.getTime() - fileDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const isFresh = diffDays <= env.CACHE_EXPIRATION_DAYS;
    console.log(`🔍 Cache for ${username} is ${isFresh ? 'fresh' : 'expired'} (${diffDays} days old)`);
    return isFresh;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log(`🔍 No cache found for ${username}`);
      return false; // File does not exist
    }
    console.error(`❌ Error checking cache freshness for ${username}:`, error);
    return false;
  }
}

// Get cache info for debugging
export async function getCacheInfo(linkedinUrl: string): Promise<{
  exists: boolean;
  isFresh: boolean;
  filename: string;
  ageInDays?: number;
}> {
  const username = extractUsernameFromUrl(linkedinUrl);
  const filename = getCacheFilename(username);
  
  try {
    const stats = await fs.stat(filename);
    const fileDate = stats.mtime;
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - fileDate.getTime());
    const ageInDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      exists: true,
      isFresh: ageInDays <= env.CACHE_EXPIRATION_DAYS,
      filename,
      ageInDays
    };
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return {
        exists: false,
        isFresh: false,
        filename
      };
    }
    throw error;
  }
}
