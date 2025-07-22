const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

class ChromeExtensionBuilder {
    constructor() {
        this.sourceDir = path.join(__dirname);
        this.outputPath = path.join(__dirname, 'modern-todo-extension.zip');
        this.excludePatterns = [
            'node_modules/**',
            '.git/**',
            'build.js',
            'package.json',
            'package-lock.json',
            '.gitignore',
            'README.md',
            '*.zip'
        ];
    }

    async build() {
        console.log('🚀 Building Chrome Extension for Web Store...');
        
        try {
            // Clean previous build
            if (fs.existsSync(this.outputPath)) {
                fs.unlinkSync(this.outputPath);
                console.log('✅ Cleaned previous build');
            }

            // Validate required files
            await this.validateFiles();

            // Create zip archive
            await this.createZipArchive();

            console.log('✅ Extension build completed successfully!');
            console.log(`📦 Package ready: ${this.outputPath}`);
            this.printDeploymentInstructions();

        } catch (error) {
            console.error('❌ Build failed:', error.message);
            process.exit(1);
        }
    }

    async validateFiles() {
        console.log('🔍 Validating required files...');
        
        const requiredFiles = [
            'manifest.json',
            'popup/popup.html',
            'popup/popup.css',
            'popup/popup.js',
            'background/service-worker.js',
            'assets/icons/icon16.png',
            'assets/icons/icon48.png',
            'assets/icons/icon128.png'
        ];

        const missingFiles = [];
        
        for (const file of requiredFiles) {
            const filePath = path.join(this.sourceDir, file);
            if (!fs.existsSync(filePath)) {
                missingFiles.push(file);
            }
        }

        if (missingFiles.length > 0) {
            throw new Error(`Missing required files: ${missingFiles.join(', ')}`);
        }

        console.log('✅ All required files found');
    }

    async createZipArchive() {
        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(this.outputPath);
            const archive = archiver('zip', { 
                zlib: { level: 9 } // Maximum compression
            });

            output.on('close', () => {
                const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
                console.log(`📦 Archive created: ${sizeInMB} MB`);
                resolve();
            });

            archive.on('error', (err) => {
                reject(err);
            });

            archive.on('warning', (err) => {
                console.warn('⚠️ Archive warning:', err);
            });

            archive.pipe(output);

            // Add files to archive
            this.addFilesToArchive(archive);

            archive.finalize();
        });
    }

    addFilesToArchive(archive) {
        console.log('📄 Adding files to archive...');
        
        // Add individual files with explicit paths
        const filesToInclude = [
            { src: 'manifest.json', dest: 'manifest.json' },
            { src: 'popup/popup.html', dest: 'popup/popup.html' },
            { src: 'popup/popup.css', dest: 'popup/popup.css' },
            { src: 'popup/popup.js', dest: 'popup/popup.js' },
            { src: 'background/service-worker.js', dest: 'background/service-worker.js' },
            { src: 'assets/icons/icon16.png', dest: 'assets/icons/icon16.png' },
            { src: 'assets/icons/icon48.png', dest: 'assets/icons/icon48.png' },
            { src: 'assets/icons/icon128.png', dest: 'assets/icons/icon128.png' }
        ];

        filesToInclude.forEach(({ src, dest }) => {
            const srcPath = path.join(this.sourceDir, src);
            if (fs.existsSync(srcPath)) {
                archive.file(srcPath, { name: dest });
                console.log(`  ✓ Added: ${src}`);
            } else {
                console.warn(`  ⚠️ Missing: ${src}`);
            }
        });
    }

    printDeploymentInstructions() {
        console.log('\n📋 Next Steps:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🧪 Local Testing:');
        console.log('1. Go to chrome://extensions/');
        console.log('2. Enable "Developer mode" (top right)');
        console.log('3. Click "Load unpacked"');
        console.log('4. Select the project folder (not the zip)');
        console.log('');
        console.log('🚀 Chrome Web Store Deployment:');
        console.log('1. Go to https://chrome.google.com/webstore/devconsole/');
        console.log('2. Click "New Item"');
        console.log('3. Upload the generated .zip file');
        console.log('4. Fill out store listing details');
        console.log('5. Submit for review');
    }
}

// Run the builder
if (require.main === module) {
    const builder = new ChromeExtensionBuilder();
    builder.build().catch(console.error);
}

module.exports = ChromeExtensionBuilder;
