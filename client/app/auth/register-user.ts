import axios from 'axios';

interface RegisterUserParams {
  name: string;
  email: string;
  password: string;
}

interface RegisterUserResult {
  success: boolean;
  user?: any;
  token?: string;
  error?: string;
}

export const registerUser = async ({ name, email, password }: RegisterUserParams): Promise<RegisterUserResult> => {
  try {
    console.log('Attempting to register user:', { name, email, passwordLength: password.length, apiUrl: 'https://localhost:7232/api/register' });
    const response = await axios.post(
      'https://localhost:7232/api/register',
      { name, email, password },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
        validateStatus: (status) => status < 500, // Resolve for status codes less than 500
      }
    );

    console.log('Registration response:', response.status, JSON.stringify(response.data, null, 2), 'Headers:', JSON.stringify(response.headers, null, 2));

    if (response.status === 201 || response.status === 200) {
      return { success: true, user: response.data.user, token: response.data.token };
    }
    return { success: false, error: response.data.message || 'Registration failed. Please try again.' };
  } catch (error: unknown) {
    console.error('Registration error:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', JSON.stringify(error.response?.data, null, 2), 'Status:', error.response?.status, 'Headers:', JSON.stringify(error.response?.headers, null, 2));
      return { success: false, error: error.response?.data?.message || error.message };
    }
    return { success: false, error: 'Failed to register user. Please try again later.' };
  }
};