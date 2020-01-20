import appRoot from 'app-root-path';
import winston from 'winston';
import config from '../config/main';
const { format } = require('winston');
const { combine, timestamp, prettyPrint } = format;

// instantiate a new Winston Logger with the settings defined above
let levelLog = config.logWinston;
let logger = winston.createLogger({
  level: levelLog,
  format: combine(
    timestamp(),
    prettyPrint()
  ),
  handleExceptions: true,
  json: false,
  colorize: false,
  transports: [
    new winston.transports.File({filename: `${appRoot}/logs/error.log`, level: 'error'}),
    new winston.transports.File({filename: `${appRoot}/logs/info.log`, level: 'info'}),
    new winston.transports.File({filename: `${appRoot}/logs/debug.log`, level: 'debug'}),
    new winston.transports.Console()
  ],
  exitOnError: false, // do not exit on handled exceptions
});

module.exports = logger;