import type { FastifyPluginCallback } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../../db/client.js';

const loginSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
});

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(4),
});

export const authRoutes: FastifyPluginCallback = (fastify, _opts, done) => {
    fastify.post('/auth/login', async (request, reply) => {
        const { username, password } = loginSchema.parse(request.body);

        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) {
            reply.code(401);
            return { error: 'Invalid credentials' };
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            reply.code(401);
            return { error: 'Invalid credentials' };
        }

        const token = fastify.jwt.sign(
            { userId: user.id, username: user.username },
            { expiresIn: '8h' },
        );

        return {
            token,
            user: {
                id: user.id,
                username: user.username,
                mustChangePassword: user.mustChangePassword,
            },
        };
    });

    fastify.post('/auth/change-password', {
        preHandler: [fastify.authenticate],
    }, async (request, reply) => {
        const { currentPassword, newPassword } = changePasswordSchema.parse(request.body);
        const { userId } = request.user;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            reply.code(404);
            return { error: 'User not found' };
        }

        const valid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!valid) {
            reply.code(401);
            return { error: 'Current password is incorrect' };
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: userId },
            data: { passwordHash, mustChangePassword: false },
        });

        return { success: true };
    });

    done();
};
