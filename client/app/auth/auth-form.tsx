'use client';

import React from 'react';
import toast from 'react-hot-toast';

import { signIn, SignInResponse } from 'next-auth/react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { DEFAULT_LOGIN_REDIRECT } from '@/routes';
import {
  LoginFormValues,
  loginFormSchema,
  RegisterFormValues,
  registerFormSchema,
} from '@/lib/validations/auth-schema';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthError } from './auth-error';
import SocialsActions from './socials-actions';
import { registerUser } from './register-user';

interface AuthFormProps {
  variant: 'register' | 'login';
}

type AuthFormValues = LoginFormValues | RegisterFormValues;

type AuthSchema<T extends AuthFormProps['variant']> =
  T extends 'login' ? LoginFormValues : RegisterFormValues;

function AuthForm({ variant }: AuthFormProps) {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get('error');
  let errorMessage = '';

  if (urlError === 'OAuthAccountNotLinked') {
    errorMessage = 'Email already in use with a different provider!';
  } else if (urlError === 'CredentialsSignin') {
    errorMessage = 'Wrong credentials.';
  } else if (urlError === 'OAuthCallbackError') {
    errorMessage = 'An unexpected error occurred.';
  }
  const authSchema = variant === 'login' ? loginFormSchema : registerFormSchema;
  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    mode: 'onChange',
    defaultValues: { email: '', password: '', name: '', confirmPassword: '' },
  });


  const onSubmit: SubmitHandler<AuthFormValues> = async (
    data: AuthSchema<typeof variant>,
  ) => {
    try {
      setIsLoading(true);

      if (variant === 'login') {
        const { email, password } = data as LoginFormValues;
        console.log(`[AuthForm] Attempting login with email: ${email}, password length: ${password.length}, API URL: ${process.env.NEXT_PUBLIC_API_URL}, Current time: ${new Date().toISOString()}, User agent: ${navigator.userAgent}, Network status: ${navigator.onLine ? 'Online' : 'Offline'}`);

        const result = await signIn('credentials', {
          redirect: false,
          email,
          password: password.trim(), // Trim password to remove any accidental whitespace
          callbackUrl: DEFAULT_LOGIN_REDIRECT,
        }) as SignInResponse;
        console.log(`[AuthForm] SignIn function called, waiting for response... Current time: ${new Date().toISOString()}, Network status: ${navigator.onLine ? 'Online' : 'Offline'}`);

        console.log(`[AuthForm] SignIn result received at ${new Date().toISOString()}:`, JSON.stringify(result, null, 2));
        
        if (result.error) {
          const errorMessages = {
            CredentialsSignin: 'Invalid email or password.',
            EmailSignin: 'Email not verified. Please check your inbox.',
            default: 'An error occurred during login. Please try again.',
          };
          const errorMessage = errorMessages[result.error as keyof typeof errorMessages] || errorMessages.default;
          console.error(`[AuthForm] Login error at ${new Date().toISOString()}:`, result.error, 'Full result:', JSON.stringify(result, null, 2), 'Network status:', navigator.onLine ? 'Online' : 'Offline');
          toast.error(errorMessage);
        } else if (result.url) {
          console.log(`[AuthForm] Login successful at ${new Date().toISOString()}, redirecting to:`, result.url);
          router.push(result.url);
        } else if (result.ok) {
          console.log(`[AuthForm] Login successful at ${new Date().toISOString()}, but no URL provided. Using default redirect.`);
          router.push(DEFAULT_LOGIN_REDIRECT);
        } else {
          console.error(`[AuthForm] Unexpected result from signIn at ${new Date().toISOString()}:`, JSON.stringify(result, null, 2));
          toast.error('An unexpected error occurred. Please try again.');
        }
      } else {
        const { email, name, password } = data as RegisterFormValues;
        const result = await registerUser({ email, name, password });
        if (result.success) {
          toast.success('Successfully registered. You can now log in.');
          router.push('/auth/login');
        } else {
          toast.error(result.error || 'Registration failed. Please try again.');
          router.push('/auth/login');
        }
      }
    } catch (err) {
      console.error(`[AuthForm] Unexpected error during form submission at ${new Date().toISOString()}:`);
      if (err instanceof Error) {
        console.error(`Error name: ${err.name}`);
        console.error(`Error message: ${err.message}`);
        console.error(`Error stack: ${err.stack}`);
        console.error(`Network status: ${navigator.onLine ? 'Online' : 'Offline'}, API URL: ${process.env.NEXT_PUBLIC_API_URL}`);
        console.error(JSON.stringify(err, null, 2));
      }
      toast.error('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form className="space-y-4 max-w-sm w-full mx-auto">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="example@email.com" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {variant === 'register' && (
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your name" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input placeholder="********" type="password" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {variant === 'register' && (
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input placeholder="********" type="password" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <AuthError message={errorMessage} />
        <Button
          type="submit"
          className="w-full"
          loading={isLoading}
          disabled={isLoading}
          variant="default"
          onClick={form.handleSubmit(onSubmit)}
        >
          {variant === 'login' ? 'Login' : 'Register'}
        </Button>
      </form>
      {variant === 'login' && <SocialsActions />}
    </Form>
  );
}
export default AuthForm;