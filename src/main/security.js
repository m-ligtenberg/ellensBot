const { app, shell } = require('electron');
const path = require('path');

class SecurityManager {
  static setupSecurity() {
    app.on('web-contents-created', (event, contents) => {
      contents.on('new-window', (event, navigationUrl) => {
        event.preventDefault();
        shell.openExternal(navigationUrl);
      });

      contents.on('will-navigate', (event, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl);
        
        if (parsedUrl.origin !== 'http://localhost:8080' && parsedUrl.origin !== 'file://') {
          event.preventDefault();
        }
      });

      contents.on('will-attach-webview', (event, webPreferences, params) => {
        delete webPreferences.preload;
        delete webPreferences.preloadURL;

        webPreferences.nodeIntegration = false;
        webPreferences.contextIsolation = true;
      });
    });

    app.on('before-quit', () => {
      SecurityManager.clearSensitiveData();
    });
  }

  static clearSensitiveData() {
    
  }

  static validateFileAccess(filePath) {
    const userDataPath = app.getPath('userData');
    const resolvedPath = path.resolve(filePath);
    
    return resolvedPath.startsWith(userDataPath);
  }
}

module.exports = { SecurityManager };