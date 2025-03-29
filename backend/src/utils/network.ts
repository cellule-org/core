import os from 'os';
import crypto from 'crypto';

export function getLocalIP(): string {
    const networkInterfaces = os.networkInterfaces();
    for (const interfaceName in networkInterfaces) {
        const interfaces = networkInterfaces[interfaceName];
        if (!interfaces) continue;
        for (const interfaceDetails of interfaces) {
            if (interfaceDetails.family === 'IPv4' && !interfaceDetails.internal) {
                return interfaceDetails.address;
            }
        }
    }
    return '127.0.0.1';
}

export function generateUniqueString(): string {
    if (process.env.SECRET) {
        return process.env.SECRET;
    }
    const ipAddress = getLocalIP();
    const hostname = os.hostname();

    const rawData = `${ipAddress}-${hostname}`;

    const hash = crypto.createHash('sha256');
    hash.update(rawData);
    return hash.digest('hex');
}
