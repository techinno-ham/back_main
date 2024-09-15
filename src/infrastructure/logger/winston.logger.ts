import { createLogger, format, transports } from "winston";
import * as path from 'path'; // Ensure this import is correct
import * as fs from 'fs';

//log to correct path in build(dist) folder
const logsDir = path.join(process.cwd() , "dist" , 'logs');

// Ensure the logs directory exists
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
    console.log(`Created logs directory at: ${logsDir}`);
} else {
    console.log(`Logs directory already exists at: ${logsDir}`);
}

// custom log display format
const customFormat = format.printf(({timestamp, level, stack, message}) => {
    return `${timestamp} - [${level.toUpperCase().padEnd(7)}] - ${stack || message}`
})

const options = {
    error: {
        filename: path.join(logsDir, 'error.log'),
        level: 'error'
    },
    info:{
filename: path.join(logsDir, 'combine.log'),
        level: 'info'
    },
    console: {
        level: 'silly'
    }
}

// for development environment
const devLogger = {
    format: format.combine(
        format.timestamp(),
        format.errors({stack: true}),
        customFormat
    ),
    transports: [new transports.Console(options.console)]
}

// for production environment
const prodLogger = {
    format: format.combine(
        format.timestamp(),
        format.errors({stack: true}),
        format.json()
    ),
    transports: [
        new transports.Console(options.console),
        new transports.File(options.error),
        new transports.File(options.info)
    ]
}

// export log instance based on the current environment
const instanceLogger = (process.env.NODE_ENV === 'production') ? prodLogger : devLogger

export const instance = createLogger(instanceLogger)
