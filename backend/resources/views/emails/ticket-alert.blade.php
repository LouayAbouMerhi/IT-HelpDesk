<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; padding: 30px; margin: 0; }
        .container { max-width: 550px; margin: 0 auto; background: #ffffff; padding: 40px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(15,23,42,0.05); }
        .header { border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 20px; }
        .title { margin: 0; font-size: 20px; font-weight: 800; color: #0f172a; }
        .ref-badge { display: inline-block; padding: 6px 12px; background: #f5f3ff; color: #4f46e5; border-radius: 8px; font-weight: bold; font-size: 12px; letter-spacing: 1px; margin-top: 10px; }
        .content { font-size: 14px; color: #334155; line-height: 1.6; }
        .btn { display: inline-block; padding: 14px 28px; background-color: #4f46e5; color: #ffffff !important; text-decoration: none; border-radius: 10px; font-weight: bold; margin-top: 25px; font-size: 13px; }
        .footer { margin-top: 40px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2 class="title">{{ $alertTitle }}</h2>
            <div class="ref-badge">{{ $ticket->referenceno ?? 'TKT-00' . $ticket->id }}</div>
        </div>
        
        <div class="content">
            <p>Hello,</p>
            <p>{{ $alertMessage }}</p>
            <p><strong>Ticket Title:</strong> {{ $ticket->title ?? 'Untitled Incident' }}</p>
            
            <a href="{{ $frontendUrl }}/dashboard" class="btn">
                View Ticket Details
            </a>
        </div>
        
        <div class="footer">
            &copy; {{ date('Y') }} IT CommandCenter. This is an automated system notification.
        </div>
    </div>
</body>
</html>