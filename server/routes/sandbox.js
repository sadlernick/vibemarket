const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const { promisify } = require('util');
const Project = require('../models/Project');
const License = require('../models/License');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();
const execAsync = promisify(exec);

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads', req.user._id.toString());
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 20
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      '.js', '.ts', '.jsx', '.tsx', '.vue', '.py', '.java', '.cpp', '.c', '.cs',
      '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.dart', '.html', '.css',
      '.scss', '.sass', '.less', '.json', '.xml', '.yaml', '.yml', '.md', '.txt'
    ];
    
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});

router.post('/upload-project', authenticateToken, upload.array('files', 20), async (req, res) => {
  try {
    const { projectId, description } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to upload files for this project' });
    }

    const uploadedFiles = req.files.map(file => ({
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype
    }));

    const projectDir = path.join(__dirname, '../sandbox', projectId);
    await fs.mkdir(projectDir, { recursive: true });

    for (const file of req.files) {
      const destPath = path.join(projectDir, file.originalname);
      await fs.mkdir(path.dirname(destPath), { recursive: true });
      await fs.copyFile(file.path, destPath);
    }

    await fs.writeFile(
      path.join(projectDir, 'project-info.json'),
      JSON.stringify({
        projectId,
        description,
        uploadedAt: new Date(),
        files: uploadedFiles.map(f => f.originalName)
      }, null, 2)
    );

    res.json({
      message: 'Project files uploaded successfully',
      files: uploadedFiles,
      sandboxPath: `/api/sandbox/run/${projectId}`
    });
  } catch (error) {
    console.error('Upload project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/run/:projectId', optionalAuth, async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project || !project.isActive) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const canRun = await checkRunAccess(project, req.user);
    if (!canRun) {
      return res.status(403).json({ error: 'Access denied. License required to run this project.' });
    }

    const projectDir = path.join(__dirname, '../sandbox', projectId);
    
    try {
      await fs.access(projectDir);
    } catch {
      return res.status(404).json({ error: 'Project files not found in sandbox' });
    }

    const projectInfo = JSON.parse(
      await fs.readFile(path.join(projectDir, 'project-info.json'), 'utf8')
    );

    const runResult = await executeProject(projectDir, project);

    await Project.findByIdAndUpdate(projectId, {
      $inc: { 'stats.views': 1 }
    });

    res.json({
      message: 'Project executed successfully',
      projectInfo,
      result: runResult,
      executedAt: new Date()
    });
  } catch (error) {
    console.error('Run project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/code/:projectId', optionalAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { file } = req.query;

    const project = await Project.findById(projectId);
    if (!project || !project.isActive) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const canViewCode = await checkCodeAccess(project, req.user);
    if (!canViewCode) {
      return res.status(403).json({ error: 'Access denied. License required to view code.' });
    }

    const projectDir = path.join(__dirname, '../sandbox', projectId);
    
    try {
      await fs.access(projectDir);
    } catch {
      return res.status(404).json({ error: 'Project files not found' });
    }

    if (file) {
      const filePath = path.join(projectDir, file);
      const normalizedPath = path.normalize(filePath);
      
      if (!normalizedPath.startsWith(projectDir)) {
        return res.status(400).json({ error: 'Invalid file path' });
      }

      try {
        const content = await fs.readFile(filePath, 'utf8');
        const stats = await fs.stat(filePath);
        
        res.json({
          filename: file,
          content,
          size: stats.size,
          modified: stats.mtime
        });
      } catch {
        return res.status(404).json({ error: 'File not found' });
      }
    } else {
      const files = await getDirectoryStructure(projectDir);
      res.json({ files });
    }
  } catch (error) {
    console.error('Get code error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/download/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project || !project.isActive) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const canDownload = await checkDownloadAccess(project, req.user);
    if (!canDownload) {
      return res.status(403).json({ error: 'Access denied. License required to download code.' });
    }

    const projectDir = path.join(__dirname, '../sandbox', projectId);
    
    try {
      await fs.access(projectDir);
    } catch {
      return res.status(404).json({ error: 'Project files not found' });
    }

    const zipPath = path.join(__dirname, '../temp', `${projectId}-${Date.now()}.zip`);
    await fs.mkdir(path.dirname(zipPath), { recursive: true });

    await execAsync(`cd "${projectDir}" && zip -r "${zipPath}" . -x "project-info.json"`);

    await Project.findByIdAndUpdate(projectId, {
      $inc: { 'stats.downloads': 1 }
    });

    res.download(zipPath, `${project.title.replace(/[^a-zA-Z0-9]/g, '-')}.zip`, async (err) => {
      if (!err) {
        try {
          await fs.unlink(zipPath);
        } catch (unlinkErr) {
          console.error('Failed to delete temp file:', unlinkErr);
        }
      }
    });
  } catch (error) {
    console.error('Download project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

async function checkRunAccess(project, user) {
  if (project.access.runApp === 'public') return true;
  if (project.access.runApp === 'private') return false;
  
  if (!user) return false;
  
  if (project.author.toString() === user._id.toString()) return true;
  
  const license = await License.findOne({
    project: project._id,
    licensee: user._id,
    isActive: true,
    'payment.status': 'completed'
  });
  
  return !!license;
}

async function checkCodeAccess(project, user) {
  if (project.access.viewCode === 'public') return true;
  if (project.access.viewCode === 'private') return false;
  
  if (!user) return false;
  
  if (project.author.toString() === user._id.toString()) return true;
  
  const license = await License.findOne({
    project: project._id,
    licensee: user._id,
    isActive: true,
    'payment.status': 'completed'
  });
  
  return license && license.permissions.viewCode;
}

async function checkDownloadAccess(project, user) {
  if (project.access.downloadCode === 'public') return true;
  if (project.access.downloadCode === 'private') return false;
  
  if (!user) return false;
  
  if (project.author.toString() === user._id.toString()) return true;
  
  const license = await License.findOne({
    project: project._id,
    licensee: user._id,
    isActive: true,
    'payment.status': 'completed'
  });
  
  return license && license.permissions.downloadCode;
}

async function executeProject(projectDir, project) {
  try {
    const packageJsonPath = path.join(projectDir, 'package.json');
    
    try {
      await fs.access(packageJsonPath);
      const { stdout, stderr } = await execAsync('npm start', {
        cwd: projectDir,
        timeout: 30000
      });
      return { type: 'node', stdout, stderr, success: true };
    } catch (nodeErr) {
      // Try other execution methods
    }

    const indexHtmlPath = path.join(projectDir, 'index.html');
    try {
      await fs.access(indexHtmlPath);
      const htmlContent = await fs.readFile(indexHtmlPath, 'utf8');
      return { type: 'html', content: htmlContent, success: true };
    } catch (htmlErr) {
      // Continue to other methods
    }

    return { 
      type: 'files', 
      message: 'Project files available for viewing',
      success: true 
    };
  } catch (error) {
    return { 
      type: 'error', 
      message: error.message,
      success: false 
    };
  }
}

async function getDirectoryStructure(dirPath, relativePath = '') {
  const items = [];
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.name === 'project-info.json') continue;
    
    const fullPath = path.join(dirPath, entry.name);
    const relPath = path.join(relativePath, entry.name);
    
    if (entry.isDirectory()) {
      const children = await getDirectoryStructure(fullPath, relPath);
      items.push({
        name: entry.name,
        type: 'directory',
        path: relPath,
        children
      });
    } else {
      const stats = await fs.stat(fullPath);
      items.push({
        name: entry.name,
        type: 'file',
        path: relPath,
        size: stats.size,
        modified: stats.mtime
      });
    }
  }
  
  return items;
}

module.exports = router;