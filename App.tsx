
import * as React from 'react';
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import ChatView from './components/ChatView';
import AuthView from './components/LoginView';

// IMPORTANT: Replace this with your actual Clerk Publishable Key.
// You can get your key from the Clerk Dashboard: https://dashboard.clerk.com
const CLERK_PUBLISHABLE_KEY = 'pk_test_YnJhdmUtcGlrYS0xNS5jbGVyay5hY2NvdW50cy5kZXYk';

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key. Please set CLERK_PUBLISHABLE_KEY in your environment variables.");
}

const App: React.FC = () => {
  return (
    <ClerkProvider 
      publishableKey={CLERK_PUBLISHABLE_KEY}
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#ab68ff',
          colorBackground: '#202123',
        },
        elements: {
          card: 'shadow-none',
          socialButtonsBlockButton: 'border-gray-600 hover:bg-gray-700',
        }
      }}
    >
      <SignedIn>
        <ChatView />
      </SignedIn>
      <SignedOut>
        <AuthView />
      </SignedOut>
    </ClerkProvider>
  );
};

export default App;