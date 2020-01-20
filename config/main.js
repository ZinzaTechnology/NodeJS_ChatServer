export default {
  env: process.env.NODE_ENV || 'development',
  // Secret key for JWT signing and encryption
  secret: process.env.APP_SECRET || 'super secret passphrase',
  // Database connection information
  database: process.env.MONGODB_URI || 'mongodb://localhost:27017/',
  // Set port
  port: process.env.PORT || 3000,
  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    sentinel0: process.env.REDIS_SENTINEL_O || '',
    sentinel1: process.env.REDIS_SENTINEL_1 || '',
    sentinel2: process.env.REDIS_SENTINEL_2 || '',
    sentinelPort: process.env.REDIS_SENTINEL_PORT || 26379,
    masterGroupName: process.env.REDIS_MASTER_GROUP_NAME || '',
    host1: process.env.REDIS_HOST1 || 'localhost',
    port1: process.env.REDIS_PORT1 || 6379,
    sentinel01: process.env.REDIS_SENTINEL_O1 || '',
    sentinel11: process.env.REDIS_SENTINEL_11 || '',
    sentinel21: process.env.REDIS_SENTINEL_21 || '',
    sentinelPort1: process.env.REDIS_SENTINEL_PORT1 || 26379,
    masterGroupName1: process.env.REDIS_MASTER_GROUP_NAME1 || '',
    hostPubSub: process.env.REDIS_HOST_PUBSUB || 'localhost',
    portPubSub: process.env.REDIS_PORT_PUBSUB || 6379,
    sentinelPubSub0: process.env.REDIS_SENTINEL_PUBSUB_O || '',
    sentinelPubSub1: process.env.REDIS_SENTINEL_PUBSUB_1 || '',
    sentinelPubSub2: process.env.REDIS_SENTINEL_PUBSUB_2 || '',
    sentinelPortPubSub: process.env.REDIS_SENTINEL_PORT_PUBSUB || 26379,
    masterGroupNamePubSub:
      process.env.REDIS_MASTER_GROUP_NAME_PUBSUB || '',
    hostPubSub1: process.env.REDIS_HOST_PUBSUB1 || 'localhost',
    portPubSub1: process.env.REDIS_PORT_PUBSUB1 || 6379,
    sentinelPubSub01: process.env.REDIS_SENTINEL_PUBSUB_O1 || '',
    sentinelPubSub11: process.env.REDIS_SENTINEL_PUBSUB_11 || '',
    sentinelPubSub21: process.env.REDIS_SENTINEL_PUBSUB_21 || '',
    sentinelPortPubSub1: process.env.REDIS_SENTINEL_PORT_PUBSUB1 || 26379,
    masterGroupNamePubSub1:
      process.env.REDIS_MASTER_GROUP_NAME_PUBSUB1 || ''
  },
  redisGenKey: {
    host: process.env.REDIS_GENKEY_HOST || 'localhost',
    port: process.env.REDIS_GENKEY_PORT || 6379
  },
  keyRedis: {
    sn: 'Number',
    newSn: 'newNumbers',
    requestNewSn: 'requestNewNumbers',
    conversation: 'conversation',
    channelName: 'channelName',
    userId: 'userId',
    messageId: 'messageId',
    cid: 'conversationId',
    bulkWrite: 'bulk',
    lastSeenMsgOfNumber: 'lastSeenMsgOfNumber',
    language: 'language',
    jwtBlacklist: 'jwtBlacklist',
    Language: 'Language'
  },
  hostKey: process.env.HOST_KEY || 'socket',
  logWinston: process.env.LEVEL || 'debug', // level log: error, info, debug
  numSocketPubToEachCache: process.env.NUM_SOCKET_PUB_TO_EACH_CACHE || 50,
  mail: {
    user: process.env.EMAIL || '',
    password: process.env.EMAIL_PASS || ''
  },
  captcha: {
    siteKey:
      process.env.SITE_KEY_CAPTCHA ||
      '',
    secretKey:
      process.env.SECRET_KEY_CAPTCHA ||
      ''
  }
};
