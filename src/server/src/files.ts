import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { parseFile } from 'music-metadata';

const router = Router();

// GET /api/files - Read files from a directory
// Query params: directory (required) - the directory path to read
//              filter (optional) - comma-separated list of file extensions to filter (e.g., "mp3,ogg,wav")
router.get('/', (req, res) => {
  try {
    const { directory, filter } = req.query;

    if (!directory || typeof directory !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Missing or invalid directory parameter'
      });
      return;
    }

    // Security: only allow absolute paths and prevent path traversal
    const decodedDir = decodeURIComponent(directory);
    if (!path.isAbsolute(decodedDir)) {
      res.status(400).json({
        success: false,
        error: 'Only absolute paths are allowed'
      });
      return;
    }

    // Prevent path traversal
    if (decodedDir.includes('..') || decodedDir.includes('~')) {
      res.status(400).json({
        success: false,
        error: 'Invalid path characters'
      });
      return;
    }

    // Check if directory exists
    if (!fs.existsSync(decodedDir)) {
      res.status(404).json({
        success: false,
        error: 'Directory not found'
      });
      return;
    }

    const stats = fs.statSync(decodedDir);
    if (!stats.isDirectory()) {
      res.status(400).json({
        success: false,
        error: 'Path is not a directory'
      });
      return;
    }

    // Read directory contents
    const entries = fs.readdirSync(decodedDir, { withFileTypes: true });
    let files = entries
      .filter(entry => entry.isFile())
      .map(entry => ({
        name: entry.name,
        path: path.join(decodedDir, entry.name)
      }));

    // Apply filter if provided
    if (filter && typeof filter === 'string') {
      const extensions = filter.split(',').map(ext => ext.trim().toLowerCase().replace(/^\./, ''));
      files = files.filter(file => {
        const ext = path.extname(file.name).toLowerCase().replace(/^\./, '');
        return extensions.includes(ext);
      });
    }

    // Sort by name
    files.sort((a, b) => a.name.localeCompare(b.name));

    res.json({
      success: true,
      data: {
        directory: decodedDir,
        files: files,
        count: files.length
      },
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error reading directory:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/files/audio - Stream an audio file
// Query params: path (required) - the absolute file path to stream
router.get('/audio', (req, res) => {
  try {
    const { path: filePath } = req.query;

    if (!filePath || typeof filePath !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Missing or invalid path parameter'
      });
      return;
    }

    // Security: only allow absolute paths and prevent path traversal
    const decodedPath = decodeURIComponent(filePath);
    if (!path.isAbsolute(decodedPath)) {
      res.status(400).json({
        success: false,
        error: 'Only absolute paths are allowed'
      });
      return;
    }

    // Prevent path traversal
    if (decodedPath.includes('..') || decodedPath.includes('~')) {
      res.status(400).json({
        success: false,
        error: 'Invalid path characters'
      });
      return;
    }

    // Check if file exists
    if (!fs.existsSync(decodedPath)) {
      res.status(404).json({
        success: false,
        error: 'File not found'
      });
      return;
    }

    const stats = fs.statSync(decodedPath);
    if (!stats.isFile()) {
      res.status(400).json({
        success: false,
        error: 'Path is not a file'
      });
      return;
    }

    // Get file extension for content type
    const ext = path.extname(decodedPath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.mp3': 'audio/mpeg',
      '.ogg': 'audio/ogg',
      '.wav': 'audio/wav',
      '.flac': 'audio/flac',
      '.m4a': 'audio/mp4',
      '.aac': 'audio/aac'
    };
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    // Stream the file
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Accept-Ranges': 'bytes'
    });

    const stream = fs.createReadStream(decodedPath);
    stream.pipe(res);

    stream.on('error', (error) => {
      console.error('Error streaming file:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Error streaming file'
        });
      }
    });
  } catch (error) {
    console.error('Error streaming audio:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/files/metadata - Get audio file metadata
// Query params: path (required) - the absolute file path
router.get('/metadata', async (req, res) => {
  try {
    const { path: filePath } = req.query;

    if (!filePath || typeof filePath !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Missing or invalid path parameter'
      });
      return;
    }

    // Security: only allow absolute paths and prevent path traversal
    const decodedPath = decodeURIComponent(filePath);
    if (!path.isAbsolute(decodedPath)) {
      res.status(400).json({
        success: false,
        error: 'Only absolute paths are allowed'
      });
      return;
    }

    // Prevent path traversal
    if (decodedPath.includes('..') || decodedPath.includes('~')) {
      res.status(400).json({
        success: false,
        error: 'Invalid path characters'
      });
      return;
    }

    // Check if file exists
    if (!fs.existsSync(decodedPath)) {
      res.status(404).json({
        success: false,
        error: 'File not found'
      });
      return;
    }

    const stats = fs.statSync(decodedPath);
    if (!stats.isFile()) {
      res.status(400).json({
        success: false,
        error: 'Path is not a file'
      });
      return;
    }

    // Parse metadata
    const metadata = await parseFile(decodedPath);
    const common = metadata.common;

    res.json({
      success: true,
      data: {
        title: common.title || path.basename(decodedPath, path.extname(decodedPath)),
        artist: common.artist || 'Unknown Artist',
        album: common.album || 'Unknown Album',
        year: common.year,
        duration: metadata.format.duration,
        genre: common.genre,
        track: common.track,
        picture: common.picture?.[0] ? {
          format: common.picture[0].format,
          data: Buffer.from(common.picture[0].data).toString('base64')
        } : null
      },
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error parsing metadata:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
