// pages/auth/verify-email.tsx (for Pages Router)
// OR app/auth/verify-email/page.tsx (for App Router)

import { useEffect } from 'react';
import Head from 'next/head';

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
    <>
      <Head>
        <title>Email Verified - MeowMap</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

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

      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        .container {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background: linear-gradient(135deg, #f8f1e4 0%, #dec4a9 100%);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        
        .icon {
          width: 80px;
          height: 80px;
          background: #34C759;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          font-size: 40px;
          color: white;
          font-weight: bold;
        }
        
        h1 {
          color: #d0854f;
          font-size: 28px;
          margin-bottom: 16px;
          font-weight: 700;
          text-align: center;
        }
        
        .success-badge {
          display: inline-block;
          background: #f8f1e4;
          color: #34C759;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 24px;
        }
        
        p {
          color: #6f6d6b;
          font-size: 16px;
          line-height: 1.6;
          margin-bottom: 16px;
          text-align: center;
        }
        
        .instructions {
          background: #f8f1e4;
          border-left: 4px solid #d0854f;
          padding: 20px;
          border-radius: 8px;
          margin: 24px 0;
          max-width: 500px;
          width: 100%;
          text-align: left;
        }
        
        .instructions h3 {
          color: #d0854f;
          font-size: 16px;
          margin-bottom: 12px;
          font-weight: 600;
        }
        
        .instructions ol {
          margin-left: 20px;
          color: #6f6d6b;
          font-size: 14px;
          line-height: 1.8;
        }
        
        .instructions li {
          margin-bottom: 8px;
        }
        
        .footer-text {
          font-size: 14px;
          color: #dec4a9;
          margin-top: 24px;
        }
        
        .footer {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #dec4a9;
          max-width: 500px;
          width: 100%;
        }
        
        .footer p {
          font-size: 12px;
          color: #dec4a9;
          margin: 0;
        }
      `}</style>
    </>
  );
}

