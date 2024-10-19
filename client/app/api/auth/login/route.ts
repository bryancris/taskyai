import { NextResponse } from 'next/server';
import { api } from '@/lib/api';
import { AxiosError } from 'axios';

export const POST = async (req: Request) => {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  try {
    console.log(`Attempting login for email: ${email}`);
    const response = await api.post('/api/login', { email, password });

    if (response.status === 200) {
      const { token, refreshToken } = response.data;
      console.log('Login successful');
      return NextResponse.json({ token, refreshToken }, {
        status: 200,
        headers: { 'Set-Cookie': `token=${token}; HttpOnly; Path=/; Max-Age=3600` }
      });
    }

    console.log('Login failed with status:', response.status);
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch (error) {
    console.error('Login error:', error);
    
    if (error instanceof AxiosError) {
      if (error.response) {
        const { status, data } = error.response;
        console.log(`Server responded with status ${status}:`, data);
        
        if (status === 400) {
          return NextResponse.json({ error: data || 'Bad request' }, { status: 400 });
        } else if (status === 401) {
          return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        } else if (status === 404) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
      } else if (error.request) {
        console.error('No response received:', error.request);
        return NextResponse.json({ error: 'No response received from the server' }, { status: 500 });
      } else {
        console.error('Error setting up the request:', error.message);
        return NextResponse.json({ error: 'Error setting up the request' }, { status: 500 });
      }
    } else if (error instanceof Error) {
      console.error('Unexpected error:', error.message);
      return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    } else {
      console.error('Unknown error:', error);
      return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
    }

    return NextResponse.json({ error: 'An unexpected error occurred. Please try again later.' }, { status: 500 });
  }
};

export const GET = async () => {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
};
