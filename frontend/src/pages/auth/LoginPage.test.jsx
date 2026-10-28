import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import LoginPage from './LoginPage';

const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    user: null,
    loading: false,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('LoginPage (Full Functional & Security Specifications)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders core input fields (identifier, password, remember me, submit, sso, sign up)', () => {
    render(
      <GoogleOAuthProvider clientId="test-client-id">
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </GoogleOAuthProvider>
    );

    expect(screen.getByPlaceholderText(/Enter your email or username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••••••/i)).toBeInTheDocument();
    expect(screen.getByText(/Remember me on this browser/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Forgot Password\?/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Sign In$/i })).toBeInTheDocument();
    expect(screen.getByText(/Don't have an account\?/i)).toBeInTheDocument();
  });

  it('keeps login frictionless by omitting credential creation rules and navigating to register', () => {
    render(
      <GoogleOAuthProvider clientId="test-client-id">
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </GoogleOAuthProvider>
    );

    const passwordInput = screen.getByPlaceholderText(/••••••••••••/i);
    fireEvent.change(passwordInput, { target: { value: 'ReturningSecret123!' } });

    expect(screen.queryByText(/8\+ Characters/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Special Symbol/i)).not.toBeInTheDocument();

    const signupBtn = screen.getByRole('button', { name: /^Sign up$/i });
    fireEvent.click(signupBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/register');
  });

  it('toggles password masking visibility', () => {
    render(
      <GoogleOAuthProvider clientId="test-client-id">
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </GoogleOAuthProvider>
    );

    const passwordInput = screen.getByPlaceholderText(/••••••••••••/i);
    expect(passwordInput.type).toBe('password');

    const toggleBtn = screen.getByLabelText(/Show password/i);
    fireEvent.click(toggleBtn);
    expect(passwordInput.type).toBe('text');

    fireEvent.click(toggleBtn);
    expect(passwordInput.type).toBe('password');
  });

  it('handles brute-force protection lockout after multiple failed attempts', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));

    render(
      <GoogleOAuthProvider clientId="test-client-id">
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </GoogleOAuthProvider>
    );

    const emailInput = screen.getByPlaceholderText(/Enter your email or username/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••••••/i);
    const submitBtn = screen.getByRole('button', { name: /^Sign In$/i });

    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'WrongPass123!' } });

    fireEvent.click(submitBtn);
    await waitFor(() => expect(screen.getByText(/Invalid email or security passphrase/i)).toBeInTheDocument());

    fireEvent.click(submitBtn);
    await waitFor(() => expect(screen.getByText(/Invalid email or security passphrase/i)).toBeInTheDocument());

    fireEvent.click(submitBtn);
    await waitFor(() => {
      expect(screen.getByText(/Account security protocol engaged: 3 failed attempts/i)).toBeInTheDocument();
    });
  });

  it('redirects to the user role dashboard when email does not contain role keywords', async () => {
    mockLogin.mockResolvedValueOnce({
      user: { id: 'u123', email: 'custom.user@realestate.ph', role: 'agent' },
      token: 'jwt-123',
    });

    render(
      <GoogleOAuthProvider clientId="test-client-id">
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </GoogleOAuthProvider>
    );

    const emailInput = screen.getByPlaceholderText(/Enter your email or username/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••••••/i);
    const submitBtn = screen.getByRole('button', { name: /^Sign In$/i });

    fireEvent.change(emailInput, { target: { value: 'custom.user@realestate.ph' } });
    fireEvent.change(passwordInput, { target: { value: 'ValidPass123!' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/agent/dashboard');
    });
  });

  it('redirects to safe returnUrl when returnUrl parameter matches user clearance', async () => {
    mockLogin.mockResolvedValueOnce({
      user: { id: 'u123', email: 'custom.user@realestate.ph', role: 'broker' },
      token: 'jwt-123',
    });

    window.history.pushState({}, '', '/login?returnUrl=%2Fbroker%2Freports');

    render(
      <GoogleOAuthProvider clientId="test-client-id">
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </GoogleOAuthProvider>
    );

    const emailInput = screen.getByPlaceholderText(/Enter your email or username/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••••••/i);
    const submitBtn = screen.getByRole('button', { name: /^Sign In$/i });

    fireEvent.change(emailInput, { target: { value: 'custom.user@realestate.ph' } });
    fireEvent.change(passwordInput, { target: { value: 'ValidPass123!' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/broker/reports');
    });

    window.history.pushState({}, '', '/');
  });
});
