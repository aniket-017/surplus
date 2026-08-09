const appJson = require('./app.json');

const baseConfig = appJson.expo;
const mapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

module.exports = {
  ...baseConfig,
  android: {
    ...baseConfig.android,
    config: {
      ...(baseConfig.android?.config || {}),
      googleMaps: {
        apiKey: mapsApiKey,
      },
    },
  },
};
