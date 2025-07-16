const fs = require('fs').promises;
const path = require('path');
const { FILE_SYSTEM } = require('../constants');

/**
 * File management utility class
 * Provides file operations, directory management, and cleanup utilities
 */
class FileManager {
  /**
   * Ensures a directory exists, creates it if it doesn't
   * @param {string} dirPath - Directory path to create
   * @returns {Promise<boolean>} True if directory exists or was created
   */
  static async ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        try {
          await fs.mkdir(dirPath, { recursive: true });
          return true;
        } catch (createError) {
          console.error(`Failed to create directory ${dirPath}:`, createError);
          return false;
        }
      }
      console.error(`Error accessing directory ${dirPath}:`, error);
      return false;
    }
  }

  /**
   * Checks if a file exists
   * @param {string} filePath - Path to the file
   * @returns {Promise<boolean>} True if file exists
   */
  static async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Gets file size in bytes
   * @param {string} filePath - Path to the file
   * @returns {Promise<number>} File size in bytes, -1 if error
   */
  static async getFileSize(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch (error) {
      return -1;
    }
  }

  /**
   * Validates file size against maximum allowed
   * @param {string} filePath - Path to the file
   * @returns {Promise<boolean>} True if file size is valid
   */
  static async isValidFileSize(filePath) {
    const fileSize = await this.getFileSize(filePath);
    return fileSize > 0 && fileSize <= FILE_SYSTEM.MAX_FILE_SIZE;
  }

  /**
   * Deletes a file safely
   * @param {string} filePath - Path to the file to delete
   * @returns {Promise<boolean>} True if file was deleted or didn't exist
   */
  static async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return true; // File doesn't exist, consider it deleted
      }
      console.error(`Failed to delete file ${filePath}:`, error);
      return false;
    }
  }

  /**
   * Moves a file from source to destination
   * @param {string} sourcePath - Source file path
   * @param {string} destinationPath - Destination file path
   * @returns {Promise<boolean>} True if file was moved successfully
   */
  static async moveFile(sourcePath, destinationPath) {
    try {
      // Ensure destination directory exists
      const destinationDir = path.dirname(destinationPath);
      await this.ensureDirectoryExists(destinationDir);

      // Move the file
      await fs.rename(sourcePath, destinationPath);
      return true;
    } catch (error) {
      console.error(
        `Failed to move file from ${sourcePath} to ${destinationPath}:`,
        error
      );
      return false;
    }
  }

  /**
   * Copies a file from source to destination
   * @param {string} sourcePath - Source file path
   * @param {string} destinationPath - Destination file path
   * @returns {Promise<boolean>} True if file was copied successfully
   */
  static async copyFile(sourcePath, destinationPath) {
    try {
      // Ensure destination directory exists
      const destinationDir = path.dirname(destinationPath);
      await this.ensureDirectoryExists(destinationDir);

      // Copy the file
      await fs.copyFile(sourcePath, destinationPath);
      return true;
    } catch (error) {
      console.error(
        `Failed to copy file from ${sourcePath} to ${destinationPath}:`,
        error
      );
      return false;
    }
  }

  /**
   * Lists files in a directory with optional filtering
   * @param {string} dirPath - Directory path
   * @param {string} extension - File extension filter (optional)
   * @returns {Promise<string[]>} Array of file paths
   */
  static async listFiles(dirPath, extension = null) {
    try {
      const files = await fs.readdir(dirPath);
      const filePaths = [];

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);

        if (stats.isFile()) {
          if (!extension || path.extname(file) === extension) {
            filePaths.push(filePath);
          }
        }
      }

      return filePaths;
    } catch (error) {
      console.error(`Failed to list files in ${dirPath}:`, error);
      return [];
    }
  }

  /**
   * Cleans up files older than specified age
   * @param {string} dirPath - Directory path
   * @param {number} maxAgeMs - Maximum age in milliseconds
   * @returns {Promise<number>} Number of files cleaned up
   */
  static async cleanupOldFiles(dirPath, maxAgeMs = 86400000) {
    // Default: 24 hours
    try {
      const files = await this.listFiles(dirPath);
      const now = Date.now();
      let cleanedCount = 0;

      for (const filePath of files) {
        try {
          const stats = await fs.stat(filePath);
          const fileAge = now - stats.mtime.getTime();

          if (fileAge > maxAgeMs) {
            await this.deleteFile(filePath);
            cleanedCount++;
          }
        } catch (error) {
          console.error(`Error processing file ${filePath}:`, error);
        }
      }

      return cleanedCount;
    } catch (error) {
      console.error(`Failed to cleanup files in ${dirPath}:`, error);
      return 0;
    }
  }

  /**
   * Generates a unique filename with timestamp
   * @param {string} prefix - Filename prefix
   * @param {string} extension - File extension
   * @returns {string} Unique filename
   */
  static generateUniqueFilename(
    prefix = FILE_SYSTEM.TEMP_PREFIX,
    extension = FILE_SYSTEM.CSV_EXTENSION
  ) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}${timestamp}_${random}${extension}`;
  }

  /**
   * Creates a temporary file path
   * @param {string} baseDir - Base directory for temp files
   * @param {string} prefix - Filename prefix
   * @param {string} extension - File extension
   * @returns {string} Temporary file path
   */
  static createTempFilePath(
    baseDir,
    prefix = FILE_SYSTEM.TEMP_PREFIX,
    extension = FILE_SYSTEM.CSV_EXTENSION
  ) {
    const filename = this.generateUniqueFilename(prefix, extension);
    return path.join(baseDir, filename);
  }

  /**
   * Reads file content with specified encoding
   * @param {string} filePath - Path to the file
   * @param {string} encoding - File encoding
   * @returns {Promise<string>} File content
   */
  static async readFileContent(filePath, encoding = FILE_SYSTEM.ENCODING) {
    try {
      const content = await fs.readFile(filePath, encoding);
      return content;
    } catch (error) {
      console.error(`Failed to read file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Writes content to a file
   * @param {string} filePath - Path to the file
   * @param {string} content - Content to write
   * @param {string} encoding - File encoding
   * @returns {Promise<boolean>} True if write was successful
   */
  static async writeFileContent(
    filePath,
    content,
    encoding = FILE_SYSTEM.ENCODING
  ) {
    try {
      // Ensure directory exists
      const dirPath = path.dirname(filePath);
      await this.ensureDirectoryExists(dirPath);

      // Write the file
      await fs.writeFile(filePath, content, encoding);
      return true;
    } catch (error) {
      console.error(`Failed to write file ${filePath}:`, error);
      return false;
    }
  }

  /**
   * Safely deletes multiple files
   * @param {string[]} filePaths - Array of file paths to delete
   * @returns {Promise<Object>} Result with success and failure counts
   */
  static async deleteMultipleFiles(filePaths) {
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (const filePath of filePaths) {
      try {
        const deleted = await this.deleteFile(filePath);
        if (deleted) {
          results.success++;
        } else {
          results.failed++;
          results.errors.push(`Failed to delete ${filePath}`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`Error deleting ${filePath}: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Schedules file cleanup after delay
   * @param {string} filePath - Path to the file
   * @param {number} delayMs - Delay in milliseconds
   * @returns {NodeJS.Timeout} Timeout reference
   */
  static scheduleCleanup(filePath, delayMs = FILE_SYSTEM.CLEANUP_DELAY) {
    return setTimeout(async () => {
      try {
        await this.deleteFile(filePath);
      } catch (error) {
        console.error(`Scheduled cleanup failed for ${filePath}:`, error);
      }
    }, delayMs);
  }

  /**
   * Gets directory size in bytes
   * @param {string} dirPath - Directory path
   * @returns {Promise<number>} Directory size in bytes
   */
  static async getDirectorySize(dirPath) {
    try {
      const files = await this.listFiles(dirPath);
      let totalSize = 0;

      for (const filePath of files) {
        const size = await this.getFileSize(filePath);
        if (size > 0) {
          totalSize += size;
        }
      }

      return totalSize;
    } catch (error) {
      console.error(`Failed to get directory size for ${dirPath}:`, error);
      return 0;
    }
  }
}

module.exports = {
  FileManager
};
