
import * as React from 'react';
import { SignIn } from '@clerk/clerk-react';

const AuthView: React.FC = () => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-[#343541]">
            <SignIn path="/" routing="path" signUpUrl="/"/>
        </div>
    );
};

export default AuthView;