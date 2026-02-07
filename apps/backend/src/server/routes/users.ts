import type { FastifyPluginCallback } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../../db/client.js';

const createUserSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(4),
});

const updateUserSchema = z.object({
    username: z.string().min(1),
});

const resetPasswordSchema = z.object({
    password: z.string().min(4),
});

export const usersRoutes: FastifyPluginCallback = (fastify, _opts, done) => {
    fastify.addHook('preHandler', fastify.authenticate);

    fastify.get('/users', async () => {
        return prisma.user.findMany({
            select: {
                id: true,
                username: true,
                mustChangePassword: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'asc' },
        });
    });

    fastify.post('/users', async (request, reply) => {
        const { username, password } = createUserSchema.parse(request.body);

        const existing = await prisma.user.findUnique({ where: { username } });
        if (existing) {
            reply.code(409);
            return { error: 'Username already exists' };
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { username, passwordHash, mustChangePassword: true },
            select: { id: true, username: true, mustChangePassword: true, createdAt: true },
        });

        reply.code(201);
        return user;
    });

    fastify.patch('/users/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        const { username } = updateUserSchema.parse(request.body);

        const existing = await prisma.user.findUnique({ where: { username } });
        if (existing && existing.id !== id) {
            reply.code(409);
            return { error: 'Username already taken' };
        }

        return prisma.user.update({
            where: { id },
            data: { username },
            select: { id: true, username: true, mustChangePassword: true, createdAt: true },
        });
    });

    fastify.patch('/users/:id/password', async (request, reply) => {
        const { id } = request.params as { id: string };
        const { password } = resetPasswordSchema.parse(request.body);

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            reply.code(404);
            return { error: 'User not found' };
        }

        const passwordHash = await bcrypt.hash(password, 10);
        return prisma.user.update({
            where: { id },
            data: { passwordHash, mustChangePassword: true },
            select: { id: true, username: true, mustChangePassword: true, createdAt: true },
        });
    });

    fastify.delete('/users/:id', async (request, reply) => {
        const { id } = request.params as { id: string };

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            reply.code(404);
            return { error: 'User not found' };
        }

        await prisma.user.delete({ where: { id } });
        reply.code(204);
    });

    done();
};
