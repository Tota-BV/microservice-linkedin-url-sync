import { promises as fs } from 'fs';
import path from 'path';

// Railway volume mount point
const VOLUME_PATH = '/data';

// Ensure volume directory exists
async function ensureVolumeDirectory(): Promise<void> {
  try {
    await fs.access(VOLUME_PATH);
  } catch {
    // Directory doesn't exist, create it
    await fs.mkdir(VOLUME_PATH, { recursive: true });
    console.log(`📁 Created volume directory: ${VOLUME_PATH}`);
  }
}

// Save JSON data to volume
export async function saveJsonToVolume(
  data: any, 
  linkedinUrl: string,
  timestamp: Date = new Date()
): Promise<string> {
  try {
    await ensureVolumeDirectory();
    
    // Create safe filename
    const safeUrl = linkedinUrl.replace(/[^a-zA-Z0-9]/g, '_');
    const timestampStr = timestamp.toISOString().replace(/[:.]/g, '-');
    const filename = `linkedin-${timestampStr}-${safeUrl}.json`;
    const filepath = path.join(VOLUME_PATH, filename);
    
    // Save JSON with pretty formatting
    await fs.writeFile(filepath, JSON.stringify(data, null, 2));
    
    console.log(`💾 Saved JSON to volume: ${filepath}`);
    return filepath;
    
  } catch (error) {
    console.error('❌ Error saving JSON to volume:', error);
    throw new Error(`Failed to save JSON to volume: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Read JSON data from volume
export async function readJsonFromVolume(filepath: string): Promise<any> {
  try {
    const data = await fs.readFile(filepath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Error reading JSON from volume:', error);
    throw new Error(`Failed to read JSON from volume: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// List all JSON files in volume
export async function listJsonFiles(): Promise<string[]> {
  try {
    await ensureVolumeDirectory();
    const files = await fs.readdir(VOLUME_PATH);
    return files.filter(file => file.endsWith('.json'));
  } catch (error) {
    console.error('❌ Error listing JSON files:', error);
    return [];
  }
}

// Get volume info
export async function getVolumeInfo(): Promise<{
  exists: boolean;
  path: string;
  fileCount: number;
  totalSize: number;
}> {
  try {
    await ensureVolumeDirectory();
    const files = await listJsonFiles();
    
    let totalSize = 0;
    for (const file of files) {
      const filepath = path.join(VOLUME_PATH, file);
      const stats = await fs.stat(filepath);
      totalSize += stats.size;
    }
    
    return {
      exists: true,
      path: VOLUME_PATH,
      fileCount: files.length,
      totalSize
    };
  } catch (error) {
    console.error('❌ Error getting volume info:', error);
    return {
      exists: false,
      path: VOLUME_PATH,
      fileCount: 0,
      totalSize: 0
    };
  }
}
