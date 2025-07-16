"use strict";
/**
 * Environment Configuration Service
 *
 * This service handles reading environment variables and configuration
 * for the cloud OCR services, including API keys and provider settings.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnvConfig = getEnvConfig;
exports.getOpenAIApiKey = getOpenAIApiKey;
exports.getGoogleCloudApiKey = getGoogleCloudApiKey;
exports.isCloudOCREnabled = isCloudOCREnabled;
exports.getCloudOCRConfig = getCloudOCRConfig;
exports.validateCloudOCRConfig = validateCloudOCRConfig;
exports.logConfiguration = logConfiguration;
exports.getAutoCloudOCRConfig = getAutoCloudOCRConfig;
const expo_constants_1 = require("expo-constants");
/**
 * Load environment configuration
 *
 * This function reads from multiple sources:
 * 1. Process environment variables (for development)
 * 2. Expo Constants (for runtime configuration)
 * 3. App.json extra configuration
 */
function loadEnvConfig() {
    var _a, _b;
    // Get environment variables (works in development and Node.js scripts)
    const processEnv = typeof process !== 'undefined' ? process.env : {};
    // Get Expo constants (works in React Native runtime)
    const expoExtra = ((_a = expo_constants_1.default.expoConfig) === null || _a === void 0 ? void 0 : _a.extra) || ((_b = expo_constants_1.default.manifest) === null || _b === void 0 ? void 0 : _b.extra) || {};
    // Default cloud OCR settings
    const defaultCloudOCRSettings = {
        enableCloudOCR: true,
        primaryProvider: 'openai',
        enableLocalFallback: true,
        enhancedMetadata: true,
        confidenceThreshold: 0.7,
        maxRetries: 3,
        timeout: 30000,
        enableQualityAnalysis: true
    };
    return {
        // API Keys - try multiple sources
        openaiApiKey: processEnv.openaiApiKey ||
            processEnv.OPENAI_API_KEY ||
            processEnv.EXPO_PUBLIC_OPENAI_API_KEY ||
            expoExtra.openaiApiKey,
        googleCloudApiKey: processEnv.googleCloudApiKey ||
            processEnv.GOOGLE_CLOUD_API_KEY ||
            processEnv.EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY ||
            expoExtra.googleCloudApiKey,
        azureApiKey: processEnv.azureApiKey ||
            processEnv.AZURE_API_KEY ||
            processEnv.EXPO_PUBLIC_AZURE_API_KEY ||
            expoExtra.azureApiKey,
        deepSeekApiKey: processEnv.deepSeekApiKey ||
            processEnv.DEEPSEEK_API_KEY ||
            processEnv.EXPO_PUBLIC_DEEPSEEK_API_KEY ||
            expoExtra.deepSeekApiKey,
        // Environment detection
        isDevelopment: __DEV__ || processEnv.NODE_ENV === 'development',
        isProduction: !__DEV__ && processEnv.NODE_ENV === 'production',
        enableDebugLogging: __DEV__ || processEnv.DEBUG_LOGGING === 'true',
        // Cloud OCR settings from app.json
        cloudOCRSettings: {
            ...defaultCloudOCRSettings,
            ...(expoExtra.cloudOCRSettings || {})
        }
    };
}
// Load configuration once
const envConfig = loadEnvConfig();
/**
 * Get the current environment configuration
 */
function getEnvConfig() {
    return envConfig;
}
/**
 * Get OpenAI API key from environment
 */
function getOpenAIApiKey() {
    return envConfig.openaiApiKey;
}
/**
 * Get Google Cloud API key from environment
 */
function getGoogleCloudApiKey() {
    return envConfig.googleCloudApiKey;
}
/**
 * Check if cloud OCR is enabled
 */
function isCloudOCREnabled() {
    return envConfig.cloudOCRSettings.enableCloudOCR;
}
/**
 * Get cloud OCR configuration
 */
function getCloudOCRConfig() {
    return envConfig.cloudOCRSettings;
}
/**
 * Validate configuration for cloud OCR
 */
function validateCloudOCRConfig() {
    const errors = [];
    const warnings = [];
    // Check if cloud OCR is enabled
    if (!envConfig.cloudOCRSettings.enableCloudOCR) {
        warnings.push('Cloud OCR is disabled in configuration');
    }
    // Check API keys based on primary provider
    const primaryProvider = envConfig.cloudOCRSettings.primaryProvider;
    switch (primaryProvider) {
        case 'openai':
            if (!envConfig.openaiApiKey) {
                errors.push('OpenAI API key is required but not configured');
            }
            else if (!envConfig.openaiApiKey.startsWith('sk-')) {
                warnings.push('OpenAI API key format appears incorrect (should start with sk-)');
            }
            break;
        case 'google-cloud':
            if (!envConfig.googleCloudApiKey) {
                errors.push('Google Cloud API key is required but not configured');
            }
            break;
        case 'azure':
            if (!envConfig.azureApiKey) {
                errors.push('Azure API key is required but not configured');
            }
            break;
        default:
            warnings.push(`Unknown primary provider: ${primaryProvider}`);
    }
    // Check local fallback
    if (!envConfig.cloudOCRSettings.enableLocalFallback && errors.length > 0) {
        errors.push('Local fallback is disabled but cloud provider configuration has errors');
    }
    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}
/**
 * Log current configuration (for debugging)
 */
function logConfiguration() {
    console.log('🔧 Environment Configuration:');
    console.log('================================');
    console.log(`Development: ${envConfig.isDevelopment}`);
    console.log(`Production: ${envConfig.isProduction}`);
    console.log(`Debug Logging: ${envConfig.enableDebugLogging}`);
    console.log('');
    console.log('API Keys:');
    console.log(`OpenAI: ${envConfig.openaiApiKey ? '✅ Configured' : '❌ Missing'}`);
    console.log(`Google Cloud: ${envConfig.googleCloudApiKey ? '✅ Configured' : '❌ Missing'}`);
    console.log(`Azure: ${envConfig.azureApiKey ? '✅ Configured' : '❌ Missing'}`);
    console.log(`DeepSeek: ${envConfig.deepSeekApiKey ? '✅ Configured' : '❌ Missing'}`);
    console.log('');
    console.log('Cloud OCR Settings:');
    console.log(`Enabled: ${envConfig.cloudOCRSettings.enableCloudOCR}`);
    console.log(`Primary Provider: ${envConfig.cloudOCRSettings.primaryProvider}`);
    console.log(`Local Fallback: ${envConfig.cloudOCRSettings.enableLocalFallback}`);
    console.log(`Enhanced Metadata: ${envConfig.cloudOCRSettings.enhancedMetadata}`);
    console.log(`Confidence Threshold: ${envConfig.cloudOCRSettings.confidenceThreshold}`);
    console.log('================================');
    // Validate and show any issues
    const validation = validateCloudOCRConfig();
    if (!validation.isValid || validation.warnings.length > 0) {
        console.log('');
        console.log('⚠️ Configuration Issues:');
        validation.errors.forEach(error => console.log(`❌ ${error}`));
        validation.warnings.forEach(warning => console.log(`⚠️ ${warning}`));
    }
}
/**
 * Auto-configure cloud OCR based on available API keys
 */
function getAutoCloudOCRConfig() {
    const config = getEnvConfig();
    // Determine the best available provider
    let primaryProvider = 'openai'; // Default
    if (config.openaiApiKey) {
        primaryProvider = 'openai';
    }
    else if (config.googleCloudApiKey) {
        primaryProvider = 'google-cloud';
    }
    else if (config.azureApiKey) {
        primaryProvider = 'azure';
    }
    else if (config.deepSeekApiKey) {
        primaryProvider = 'deepseek';
    }
    return {
        useCloudOCR: isCloudOCREnabled() && !!getApiKeyForProvider(primaryProvider),
        primaryProvider,
        enableLocalFallback: config.cloudOCRSettings.enableLocalFallback,
        enhancedMetadata: config.cloudOCRSettings.enhancedMetadata,
        enableRetries: true,
        maxRetries: config.cloudOCRSettings.maxRetries,
        timeout: config.cloudOCRSettings.timeout,
        confidenceThreshold: config.cloudOCRSettings.confidenceThreshold,
        enableQualityAnalysis: config.cloudOCRSettings.enableQualityAnalysis,
        // Provider-specific API keys
        openaiApiKey: config.openaiApiKey,
        googleCloudApiKey: config.googleCloudApiKey,
        azureApiKey: config.azureApiKey,
        deepseekApiKey: config.deepSeekApiKey
    };
}
/**
 * Get API key for a specific provider
 */
function getApiKeyForProvider(provider) {
    switch (provider) {
        case 'openai':
            return envConfig.openaiApiKey;
        case 'google-cloud':
            return envConfig.googleCloudApiKey;
        case 'azure':
            return envConfig.azureApiKey;
        case 'deepseek':
            return envConfig.deepSeekApiKey;
        default:
            return undefined;
    }
}
