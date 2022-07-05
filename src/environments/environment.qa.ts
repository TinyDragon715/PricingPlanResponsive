export const environment = {
  production: true,
  lockSite: false,
  serverUrl: 'https://qa.api.stellar.online/v3/',
  authServerUrl: 'https://qa.api.stellar.online/api/',
  serverV1Url: 'https://qa.api.stellar.online/api/',
  aliveAppIntervalMinutes: 30, // if you keep app inactive
  aliveCheckAppIntervalMinutes: 60, // if you keep app inactive pop a message
  repeatValidateSeconds: 300,
  hasListingDirectory: false,
  identityName: 'Reg Demo',
  serverName: 'Stellar Registration',
  orgType: 'school',
  orgSubType: 'school',
  subServerName: 'Stellar Registration',
  profileImageURL: '',
  enableTranslation: false,
  customKeys: {
    roleAdmin: '5eb137f1d3123a407c7c97cc',// Admin
    roleView: '5ee76348d3123a0ef0d8cb63',// Viewer
    roleEdit: '5ee761c8d3123a0ef0d8cb61',// Editor
  },
  customKeysView: {
    Admin: 'Admin',
    Student: 'View',
    Teacher: 'Edit',
  },
  tokBox: {
    apiKey: '46643372'
  },
  ipStack: {
    apiKey: '4e73b76fa09e6cfe386cf11e94c11e90'
  },
  ST_PUB_KEY: "pk_test_51IBPEQKKCurCNdVKUekZI9qcPRYIJ3QySZLS3I3gMHfT07QkXy0GgYy44qFH4hoOHnymulOpuzgoRw5S3XuNj8mW00KUxCtRY5",
  ST_SECRET_KEY: "sk_test_51IBPEQKKCurCNdVK97RhaU5Pfl4ZkIF33BdRKXaYegjwq77ryNiMbcURb4PRqImNqSFyg1IGEhCD63H8IQngMt4400Xg30FllR",
  FB_APP_ID: "1479396288933958",
  STELLAR_URL: 'https://qa.stellar.conference.interactivelife.me/'
};