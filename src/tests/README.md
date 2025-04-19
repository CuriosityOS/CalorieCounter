# Authentication Testing

This directory contains tests for the authentication system using Supabase. The tests are designed to help identify why the authentication is not working properly.

## Running the Tests

```bash
npm test
```

## Test Files

1. **auth.test.tsx** - Tests for the useAuth hook and AuthGuard component
2. **supabase-client.test.ts** - Tests for the Supabase client configuration
3. **auth-integration.test.tsx** - Integration tests for the authentication flow

## Potential Issues

The tests are designed to check for these common issues:

1. **Environment Variables**: The tests check if the Supabase URL and key are properly configured, especially across different environments.

2. **Auth Configuration**: Verifies if the auth configuration (persistSession, autoRefreshToken, etc.) is properly set.

3. **Session Management**: Tests if session creation, persistence, and retrieval work correctly.

4. **Auth State Updates**: Checks if the app properly responds to authentication state changes.

5. **Redirect Logic**: Verifies the redirect logic in the AuthGuard component.

6. **Error Handling**: Tests if errors from the Supabase API are properly captured and displayed.

7. **Email Confirmation**: The `email_confirmed: true` option in the signup process might be causing issues if your Supabase project requires email confirmation.

## How to Fix Common Issues

1. **Supabase Configuration**:
   - Check if your environment variables are correctly set in your deployment environment
   - Make sure the hardcoded fallback values are valid if you're not using environment variables

2. **Authentication Flow**:
   - Ensure signUp properly waits for the response before redirecting
   - Check if the automatic login after signup is causing issues

3. **Session Persistence**:
   - Verify that the browser storage is working correctly
   - Check if the Supabase client is configured to persist the session

4. **AuthGuard Component**:
   - Look for race conditions in the AuthGuard loading and redirect logic