import axios from 'axios';
import https from 'https';

interface RegisterUserParams {
  name: string;
  email: string;
  password: string;
}

interface RegisterUserResult {
  success: boolean;
  user?: any;
  token?: string;
  error?: string | undefined;
}

export const registerUser = async ({ name, email, password }: RegisterUserParams): Promise<RegisterUserResult> => {
  try {
    const response = await axios.post(
      'https://localhost:7232/api/register',
      { Username: email, Password: password, Name: name },
      {
        headers: { 'Content-Type': 'application/json' },
        httpsAgent: new https.Agent({
          rejectUnauthorized: false
        }),
        timeout: 10000,
        validateStatus: (status) => status < 500 // Resolve for status codes less than 500
      }
    );

    if (response.status === 200 || response.status === 201) {
      return { success: true, user: response.data.user, token: response.data.token, error: undefined };
    }

    if (response.status === 400) {
      return { success: false, error: response.data.message || 'Registration failed. Please try again.' };
    }
    return { success: false, error: 'Unexpected response from server.' };
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      return { success: false, error: error.response?.data?.message || error.message || 'An error occurred during registration.' };
    }
    return { success: false, error: 'Failed to register user. Please try again later.' };
  }
};