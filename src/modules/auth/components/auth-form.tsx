import { useState } from 'react'

import { Link, useSearch } from '@tanstack/react-router'

import { SigninForm } from '@/modules/auth/components/signin-form'
import { SignupForm } from '@/modules/auth/components/signup-form'
import { m } from '@/i18n/paraglide/messages'
import { APP_ROUTES } from '@/lib/routes'

export function AuthForm() {
  const [email, setEmail] = useState('')
  const { mode, redirect, error } = useSearch({ from: APP_ROUTES.login })

  const isSignin = mode === 'signin'
  const oauthFailed = error === 'oauth'
  const next = redirect ?? APP_ROUTES.tracker

  const formProps = { email, oauthFailed, next, onEmailChange: setEmail }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 space-y-2 text-center">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          {isSignin ? m.auth_signinTitle() : m.auth_signupTitle()}
        </h1>
        <p className="text-muted-foreground">
          {isSignin ? m.auth_signinSubtitle() : m.auth_signupSubtitle()}
        </p>
      </div>

      {isSignin ? <SigninForm {...formProps} /> : <SignupForm {...formProps} />}

      <div className="mt-8 space-x-1 text-center">
        <span className="text-muted-foreground">
          {isSignin ? m.auth_noAccount() : m.auth_hasAccount()}
        </span>
        <Link
          to={APP_ROUTES.login}
          search={(prev) => ({ ...prev, mode: isSignin ? 'signup' : 'signin' })}
          className="hover:text-primary underline underline-offset-4"
        >
          {isSignin ? m.auth_switchToSignup() : m.auth_switchToSignin()}
        </Link>
      </div>
    </div>
  )
}
