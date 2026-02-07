import { logger } from '../logger.js';
import { env } from '../config/env.js';
import { spawn } from 'child_process';
import pg from 'pg';

const { Client } = pg;

function parseConnectionString(url: string): {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
} {
    const parsed = new URL(url);
    return {
        host: parsed.hostname,
        port: parseInt(parsed.port || '5432'),
        user: parsed.username,
        password: parsed.password,
        database: parsed.pathname.slice(1), // Remove leading /
    };
}

async function databaseExists(config: ReturnType<typeof parseConnectionString>): Promise<boolean> {
    const client = new Client({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: 'postgres', // Connect to default database
    });

    try {
        await client.connect();
        const result = await client.query(
            'SELECT 1 FROM pg_database WHERE datname = $1',
            [config.database]
        );
        return result.rowCount! > 0;
    } catch (error) {
        logger.error({ err: error }, 'Failed to check if database exists');
        throw error;
    } finally {
        await client.end();
    }
}

async function createDatabase(config: ReturnType<typeof parseConnectionString>): Promise<void> {
    const client = new Client({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: 'postgres',
    });

    try {
        await client.connect();
        await client.query(`CREATE DATABASE "${config.database}"`);
        logger.info({ database: config.database }, 'Database created');
    } catch (error) {
        logger.error({ err: error }, 'Failed to create database');
        throw error;
    } finally {
        await client.end();
    }
}

async function runMigrations(): Promise<void> {
    return new Promise((resolve, reject) => {
        logger.info('Running Prisma migrations...');
        const prisma = spawn('npx', ['prisma', 'migrate', 'deploy'], {
            stdio: 'inherit',
            env: { ...process.env, DATABASE_URL: env.DATABASE_URL },
        });

        prisma.on('close', (code) => {
            if (code === 0) {
                logger.info('Migrations completed successfully');
                resolve();
            } else {
                reject(new Error(`Prisma migrate failed with code ${code}`));
            }
        });

        prisma.on('error', (error) => {
            logger.error({ err: error }, 'Failed to run migrations');
            reject(error);
        });
    });
}

export async function setupDatabase(): Promise<void> {
    try {
        logger.info('Checking database setup...');
        const config = parseConnectionString(env.DATABASE_URL);

        const exists = await databaseExists(config);

        if (!exists) {
            logger.info({ database: config.database }, 'Database does not exist, creating...');
            await createDatabase(config);
        } else {
            logger.info({ database: config.database }, 'Database exists');
        }

        await runMigrations();
        logger.info('Database setup complete');
    } catch (error) {
        logger.error({ err: error }, 'Database setup failed');
        throw error;
    }
}
