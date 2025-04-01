/**
 * Unit tests for utility functions
 */
const utils = require('../../js/modules/utils');

describe('Utils Module', () => {
  describe('getParentPath', () => {
    test('should return root for root path', () => {
      expect(utils.getParentPath('/')).toBe('/');
    });

    test('should return root for top-level path', () => {
      expect(utils.getParentPath('/folder')).toBe('/');
    });

    test('should return parent path for nested path', () => {
      expect(utils.getParentPath('/folder/subfolder')).toBe('/folder');
    });

    test('should handle trailing slash', () => {
      expect(utils.getParentPath('/folder/subfolder/')).toBe('/folder');
    });

    test('should handle empty input', () => {
      expect(utils.getParentPath('')).toBe('/');
    });
  });

  describe('normalizePathForDisplay', () => {
    test('should return empty string for root path', () => {
      expect(utils.normalizePathForDisplay('/')).toBe('');
    });

    test('should remove leading slash', () => {
      expect(utils.normalizePathForDisplay('/folder')).toBe('folder');
    });

    test('should remove trailing slash', () => {
      expect(utils.normalizePathForDisplay('folder/')).toBe('folder');
    });

    test('should handle nested paths', () => {
      expect(utils.normalizePathForDisplay('/folder/subfolder')).toBe('folder/subfolder');
    });
  });

  describe('constructUrl', () => {
    test('should construct URL with path', () => {
      const baseUrl = 'https://example.com';
      const path = 'file.txt';
      expect(utils.constructUrl(baseUrl, path)).toBe('https://example.com/file.txt');
    });

    test('should handle URL with query parameters', () => {
      const baseUrl = 'https://example.com?param=value';
      const path = 'file.txt';
      expect(utils.constructUrl(baseUrl, path)).toBe('https://example.com/file.txt?param=value');
    });

    test('should encode path', () => {
      const baseUrl = 'https://example.com';
      const path = 'file with spaces.txt';
      expect(utils.constructUrl(baseUrl, path)).toBe('https://example.com/file%20with%20spaces.txt');
    });

    test('should return null if baseUrl is not provided', () => {
      expect(utils.constructUrl(null, 'file.txt')).toBeNull();
    });
  });

  describe('getFilenameFromPath', () => {
    test('should extract filename from path', () => {
      expect(utils.getFilenameFromPath('/folder/file.txt')).toBe('file.txt');
    });

    test('should return the whole path if no slashes', () => {
      expect(utils.getFilenameFromPath('file.txt')).toBe('file.txt');
    });

    test('should handle trailing slash', () => {
      expect(utils.getFilenameFromPath('/folder/subfolder/')).toBe('subfolder');
    });

    test('should handle empty input', () => {
      expect(utils.getFilenameFromPath('')).toBe('');
    });
  });

  describe('showStatus', () => {
    let mockStatusElement;
    
    beforeEach(() => {
      // Create a mock status element
      mockStatusElement = document.createElement('div');
      mockStatusElement.id = 'statusMessage';
      document.body.appendChild(mockStatusElement);
      
      // Mock setTimeout
      jest.useFakeTimers();
    });
    
    afterEach(() => {
      document.body.removeChild(mockStatusElement);
      jest.useRealTimers();
    });
    
    test('should set status message and class', () => {
      utils.showStatus('Test message', 'success');
      
      expect(mockStatusElement.textContent).toBe('Test message');
      expect(mockStatusElement.className).toBe('status success');
      expect(mockStatusElement.style.display).toBe('block');
    });
    
    test('should use info type by default', () => {
      utils.showStatus('Test message');
      
      expect(mockStatusElement.className).toBe('status info');
    });
    
    test('should hide message after delay', () => {
      utils.showStatus('Test message');
      
      expect(mockStatusElement.style.display).toBe('block');
      
      // Fast-forward time
      jest.advanceTimersByTime(3000);
      
      expect(mockStatusElement.style.display).toBe('none');
    });
  });
});
