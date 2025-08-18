const appConfig = {
  name: process.env.REACT_APP_NAME,
  url: process.env.REACT_APP_URL,
  env: process.env.REACT_APP_ENV,
  apiBaseUrl: process.env.REACT_APP_API_BASE_URL,
  enableAnalytics: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
  maintenanceMode: process.env.REACT_APP_MAINTENANCE_MODE === 'true',
};

export default appConfig;
