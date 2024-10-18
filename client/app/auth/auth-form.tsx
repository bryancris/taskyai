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
  const [formFilled, setFormFilled] = React.useState<boolean>(false);
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

  React.useEffect(() => {
    const values = form.watch();
    console.log('Form values:', values);
    const requiredFields = variant === 'register' ? ['email', 'name', 'password', 'confirmPassword'] : ['email', 'password'];
    setFormFilled(requiredFields.every(field => !!values[field as keyof AuthFormValues]));
    console.log('Form filled:', formFilled);
  }, [form, variant]);

  const onSubmit: SubmitHandler<AuthFormValues> = async (
    data: AuthSchema<typeof variant>,
  ) => {
    try {
      console.log('Login attempt started', { email: data.email });
      setIsLoading(true);

      if (variant === 'login') {
        const { email, password } = data as LoginFormValues;
        
        console.log('Attempting to sign in with:', { email, password: '********' });
        console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
        const result: SignInResponse | undefined = await signIn('credentials', {
          redirect: false,
          email,
          password,
          callbackUrl: DEFAULT_LOGIN_REDIRECT,
        });

        console.log('SignIn result:', JSON.stringify(result, null, 2));

        if (result) {
          if (result.error) {
            const errorMessages = {
              CredentialsSignin: 'Invalid email or password.',
              EmailSignin: 'Email not verified. Please check your inbox.',
              default: 'An error occurred during login. Please try again.',
            };
            console.error('Login error:', result.error, result);
            const errorMessage = errorMessages[result.error as keyof typeof errorMessages] || errorMessages.default;
            toast.error(errorMessage);
          } else if (result.url) {
            console.log('Login successful, redirecting to:', result.url);
            router.push(result.url);
          } else {
            console.error('Unexpected result from signIn:', result);
            toast.error('An unexpected error occurred. Please try again.');
          }
        } else {
          console.error('No result from signIn');
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
      console.error('Error during form submission:', err);
      toast.error('Oops. Something went wrong.');
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