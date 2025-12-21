// app/auth/verify-email/page.tsx (for Next.js 13+ App Router)

'use client';

import { useEffect } from 'react';

export default function EmailVerifiedPage() {
  useEffect(() => {
    // Extract and log verification info (for debugging)
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    
    const accessToken = params.get('access_token');
    const type = params.get('type');
    
    if (accessToken && type === 'signup') {
      console.log('✅ Email verification successful!');
      // Email is verified - user can now sign in to the app
    }
  }, []);

  return (
    <div className="container">
      <div className="icon">✓</div>
      <h1>Email Verified! 🐱</h1>
      <div className="success-badge">SUCCESS</div>
      
      <p>Your email address has been successfully verified.</p>
      <p>Your MeowMap account is now ready to use!</p>
      
      <div className="instructions">
        <h3>Next Steps:</h3>
        <ol>
          <li>Open the MeowMap app on your device</li>
          <li>Sign in with your email and password</li>
          <li>Start exploring MeowMap!</li>
        </ol>
      </div>
      
      <p className="footer-text">
        You can safely close this page now.
      </p>
      
      <div className="footer">
        <p>MeowMap - Your feline adventure companion</p>
      </div>
    </div>
  );
}

