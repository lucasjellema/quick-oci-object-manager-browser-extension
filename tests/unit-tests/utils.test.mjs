/**
 * Tests for utils.mjs module
 * Tests the utility functions used throughout the application
 */

import { jest, test, expect, describe } from '@jest/globals';
import { 
  getParentPath,
  normalizePathForDisplay,
  constructUrl
} from '../../js/modules/utils.mjs';

describe('Utils Module', () => {
  describe('getParentPath function', () => {
    test('should return root for root path', () => {
      expect(getParentPath('/')).toBe('/');
    });
    
    test('should return root for null or empty path', () => {
      expect(getParentPath(null)).toBe('/');
      expect(getParentPath('')).toBe('/');
    });
    
    test('should return root for paths with no parent', () => {
      expect(getParentPath('/file.txt')).toBe('/');
      expect(getParentPath('file.txt')).toBe('/');
    });
    
    test('should handle paths with trailing slashes', () => {
      expect(getParentPath('/folder/')).toBe('/');
      expect(getParentPath('folder/')).toBe('/');
    });
    
    test('should return correct parent path for nested paths', () => {
      expect(getParentPath('/folder/subfolder')).toBe('/folder');
      expect(getParentPath('/folder/subfolder/')).toBe('/folder');
      expect(getParentPath('/folder/subfolder/file.txt')).toBe('/folder/subfolder');
    });
    
    test('should handle paths with multiple levels', () => {
      expect(getParentPath('/level1/level2/level3')).toBe('/level1/level2');
      expect(getParentPath('/level1/level2/level3/')).toBe('/level1/level2');
    });
  });
  
  describe('normalizePathForDisplay function', () => {
    test('should return empty string for root path', () => {
      expect(normalizePathForDisplay('/')).toBe('');
    });
    
    test('should remove leading slash', () => {
      expect(normalizePathForDisplay('/folder')).toBe('folder');
    });
    
    test('should remove trailing slash', () => {
      expect(normalizePathForDisplay('folder/')).toBe('folder');
      expect(normalizePathForDisplay('/folder/')).toBe('folder');
    });
    
    test('should handle paths without leading or trailing slashes', () => {
      expect(normalizePathForDisplay('folder')).toBe('folder');
    });
    
    test('should handle nested paths', () => {
      expect(normalizePathForDisplay('/folder/subfolder')).toBe('folder/subfolder');
      expect(normalizePathForDisplay('/folder/subfolder/')).toBe('folder/subfolder');
    });
    
    test('should preserve case', () => {
      expect(normalizePathForDisplay('/Folder/SubFolder')).toBe('Folder/SubFolder');
    });
  });
  
  describe('constructUrl function', () => {
    test('should return null for null or empty baseUrl', () => {
      expect(constructUrl(null, 'path')).toBeNull();
      expect(constructUrl('', 'path')).toBeNull();
    });
    
    test('should construct URL with encoded path', () => {
      expect(constructUrl('https://example.com', 'path')).toBe('https://example.com/path');
    });
    
    test('should handle paths with special characters', () => {
      expect(constructUrl('https://example.com', 'path with spaces')).toBe('https://example.com/path%20with%20spaces');
      expect(constructUrl('https://example.com', 'folder/subfolder')).toBe('https://example.com/folder%2Fsubfolder');
    });
    
    test('should handle baseUrl with query parameters', () => {
      expect(constructUrl('https://example.com?param=value', 'path')).toBe('https://example.com/path?param=value');
    });
    
    test('should handle baseUrl with trailing slash', () => {
      // Note: This test assumes the function doesn't handle trailing slashes in baseUrl
      // If the function should handle this case, the expected result would be different
      expect(constructUrl('https://example.com/', 'path')).toBe('https://example.com//path');
    });
    
    test('should handle PAR URLs', () => {
      const parUrl = 'https://objectstorage.us-ashburn-1.oraclecloud.com/p/token/bucket/object?param=value';
      expect(constructUrl(parUrl, 'folder/file.txt')).toBe(
        'https://objectstorage.us-ashburn-1.oraclecloud.com/p/token/bucket/object/folder%2Ffile.txt?param=value'
      );
    });
  });
});
