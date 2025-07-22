declare module 'clientjs' {
  export class ClientJS {
    /**
     * Gets the clients fingerprint as a 32bit integer hash
     */
    getFingerprint(): string;
    
    /**
     * Gets the screen resolution in the format "WxH"
     */
    getScreenResolution(): string;
    
    /**
     * Check if client is visiting from a mobile device
     */
    isMobile(): boolean;
    
    /**
     * Gets the client's browser
     */
    getBrowser(): string;
    
    /**
     * Gets the client's browser version
     */
    getBrowserVersion(): string;
    
    /**
     * Gets the client's OS
     */
    getOS(): string;
    
    /**
     * Gets the client's device
     */
    getDevice(): string;
    
    /**
     * Gets the client's device type (desktop, mobile, tablet)
     */
    getDeviceType(): string;
    
    /**
     * Gets the client's CPU
     */
    getCPU(): string;
    
    /**
     * Gets the client's current plugins
     */
    getPlugins(): string[];
    
    /**
     * Gets the client's timezone
     */
    getTimeZone(): string;
    
    /**
     * Gets the client's language
     */
    getLanguage(): string;
    
    /**
     * Gets the client's system language
     */
    getSystemLanguage(): string;
    
    /**
     * Gets the client's canvas fingerprint
     */
    getCanvasPrint(): string;
  }
} 