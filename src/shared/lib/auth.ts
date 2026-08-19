import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { db } from '@shared/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { emailField } from '@shared/lib/validation/limits'
import { authConfig } from './auth.config'

// The password has no upper bound here on purpose: this checks a credential that
// already exists, and refusing one longer than we now allow would lock the account
// out rather than protect it. bcrypt reads only the first 72 bytes either way.
const loginSchema = z.object({
  email: emailField(),
  password: z.string().min(6),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
        })
        if (!user) return null

        const valid = await bcrypt.compare(parsed.data.password, user.password)
        if (!valid) return null

        return { id: user.id, email: user.email, name: user.name }
      },
    }),
  ],
})
