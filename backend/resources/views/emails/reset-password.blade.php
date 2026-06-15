<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0; }
        .btn { display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }
        .footer { margin-top: 30px; font-size: 12px; color: #64748b; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <h2>Password Reset Request</h2>
        <p>Hello,</p>
        <p>We received a request to reset the password for your IT CommandCenter account associated with this email address.</p>
        <p>Click the button below to choose a new password:</p>
        
        <a href="http://localhost:5173/reset-password?token={{ $token }}&email={{ $email }}" class="btn">
            Reset Password
        </a>

        <p style="margin-top: 24px;">If you did not request a password reset, no further action is required.</p>
        
        <div class="footer">
            &copy; {{ date('Y') }} Enterprise IT Ops. All rights reserved.
        </div>
    </div>
</body>
</html>