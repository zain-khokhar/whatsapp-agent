/**
 * Handout Finder Module
 * Handles handout file discovery and path resolution
 */

const fs = require('fs');
const path = require('path');

// Cache for directory listings to reduce file system operations
const dirCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Extract subject folder from course code
 * @param {string} courseCode - Course code (e.g., "cs101")
 * @returns {string} - Subject folder name (e.g., "CS")
 */
function extractSubjectFolder(courseCode) {
    const match = courseCode.match(/^[a-z]+/i);
    return match 
        ? match[0].toUpperCase() 
        : courseCode.substring(0, 3).toUpperCase();
}

/**
 * Get cached directory listing or read from file system
 * @param {string} dirPath - Directory path
 * @returns {string[]|null} - Array of file/folder names or null if error
 */
function getCachedDirListing(dirPath) {
    const now = Date.now();
    const cached = dirCache.get(dirPath);
    
    // Return cached result if still valid
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
        return cached.files;
    }
    
    // Read from file system
    try {
        if (!fs.existsSync(dirPath)) {
            return null;
        }
        
        const files = fs.readdirSync(dirPath);
        
        // Cache the result
        dirCache.set(dirPath, {
            files,
            timestamp: now
        });
        
        return files;
    } catch (error) {
        console.error(`[Handout Finder] Error reading directory ${dirPath}:`, error.message);
        return null;
    }
}

/**
 * Find handout directory for a subject
 * @param {string} subjectFolder - Subject folder name (e.g., "CS")
 * @returns {string|null} - Full path to handout directory or null
 */
function findHandoutDirectory(subjectFolder) {
    const handoutsBase = path.join(__dirname, '..', 'handouts');
    
    const folders = getCachedDirListing(handoutsBase);
    if (!folders) return null;
    
    // Filter to only directories
    const directories = folders.filter(name => {
        const fullPath = path.join(handoutsBase, name);
        try {
            return fs.statSync(fullPath).isDirectory();
        } catch {
            return false;
        }
    });
    
    // Find matching directory
    const targetPattern = `vu-projects-${subjectFolder.toLowerCase()}-pdfs`;
    const match = directories.find(f => f.toLowerCase() === targetPattern);
    
    return match ? path.join(handoutsBase, match) : null;
}

/**
 * Find handout file for a course code
 * @param {string} courseCode - Course code (e.g., "cs101")
 * @returns {string|null} - Full path to PDF file or null if not found
 */
function findHandoutFile(courseCode) {
    // Extract subject folder
    const subjectFolder = extractSubjectFolder(courseCode);
    
    // Find handout directory
    const handoutDir = findHandoutDirectory(subjectFolder);
    if (!handoutDir) {
        console.log(`[Handout Finder] No handout directory found for subject: ${subjectFolder}`);
        return null;
    }
    
    // Get files in directory
    const files = getCachedDirListing(handoutDir);
    if (!files) {
        console.log(`[Handout Finder] Could not read handout directory: ${handoutDir}`);
        return null;
    }
    
    // Find matching PDF file
    const normalizedCourseCode = courseCode.toLowerCase();
    const matchingFile = files.find(file => {
        const isValidPdf = file.toLowerCase().endsWith('.pdf');
        const normalizedFileName = file.toLowerCase().replace(/[^a-z0-9]/g, '');
        const startsWithCode = normalizedFileName.startsWith(normalizedCourseCode);
        
        return isValidPdf && startsWithCode;
    });
    
    if (!matchingFile) {
        console.log(`[Handout Finder] No PDF found for course code: ${courseCode}`);
        return null;
    }
    
    const filePath = path.join(handoutDir, matchingFile);
    console.log(`[Handout Finder] Found handout: ${filePath}`);
    return filePath;
}

/**
 * Clear the directory cache (useful for testing or forced refresh)
 */
function clearCache() {
    dirCache.clear();
}

module.exports = {
    findHandoutFile,
    extractSubjectFolder,
    clearCache
};
