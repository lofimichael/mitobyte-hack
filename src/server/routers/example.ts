import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';

export const exampleRouter = router({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),
  
  getAll: publicProcedure.query(() => {
    return [
      { id: 1, text: 'First post' },
      { id: 2, text: 'Second post' },
    ];
  }),

  getUser: protectedProcedure.query(({ ctx }) => {
    return {
      user: ctx.user,
    };
  }),

  updateProfile: protectedProcedure
    .input(z.object({ 
      name: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        user: {
          ...ctx.user,
          name: input.name || ctx.user.name,
        },
      };
    }),
});