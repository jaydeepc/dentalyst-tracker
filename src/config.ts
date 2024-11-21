// You can change this to your deployed backend URL when deploying to production
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

export const API_BASE_URL = BACKEND_URL;

// Helper function to check if backend is healthy
export const checkBackendHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    return {
      isHealthy: data.status === 'healthy',
      isDatabaseConnected: data.database === 'connected',
      timestamp: data.timestamp
    };
  } catch (error) {
    return {
      isHealthy: false,
      isDatabaseConnected: false,
      error: 'Failed to connect to backend'
    };
  }
};
