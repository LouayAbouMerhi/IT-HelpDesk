<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Rules\StrongPassword;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log; 
use Illuminate\Support\Facades\Mail;
class AuthController extends Controller
{
    // ==================== REGISTRATION ====================
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255',
            'password' => ['required', 'confirmed', new StrongPassword],
            'department' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:30',
        ]);

        $exists = User::where('email', $request->email)->exists();
        if ($exists) {
            throw ValidationException::withMessages([
                'email' => ['The email has already been taken.'],
            ]);
        }

        // Handle both possible column names safely for passwords
        $passwordColumn = \Schema::hasColumn('users', 'password') ? 'password' : 'passwordhash';

        // Insert using strict lowercase column names
        $userId = DB::table('users')->insertGetId([
            'roleid' => 3, 
            'fullname' => $request->name,
            'email' => $request->email,
            $passwordColumn => Hash::make($request->password),
            'phone' => $request->phone,
            'department' => $request->department,
            'timezone' => 'UTC',
            'isactive' => true,
            'createdat' => now(),
            'updatedat' => now(),
        ]);

        // Insert log using strict lowercase table and columns
        DB::table('activitylogs')->insert([
            'userid' => $userId,
            'action' => 'user_registered',
            'entitytype' => 'User',
            'entityid' => $userId,
            'newvalue' => json_encode(['email' => $request->email, 'roleid' => 3]),
            'ipaddress' => $request->ip(),
            'useragent' => $request->userAgent(),
            'createdat' => now(),
        ]);

        $user = User::find($userId);
        
        // --- JWT Generation ---
        $token = Auth::guard('api')->fromUser($user);

        return response()->json([
            'message' => 'Registration successful',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->fullname, // Lowercase mapping
                'email' => $user->email,
                'role' => 'employee',
                'department' => $user->department,
                'phone' => $user->phone,
            ]
        ], 201);
    }

    // ==================== LOGIN ====================
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();
        
        if (!$user) {
            throw ValidationException::withMessages([
                'email' => ['No account found with this email address.'],
            ]);
        }

        // Check strict lowercase isactive
        if (isset($user->isactive) && !$user->isactive) {
            throw ValidationException::withMessages([
                'email' => ['Your account has been deactivated. Please contact an administrator.'],
            ]);
        }

        $dbPassword = $user->password ?? $user->passwordhash ?? null;

        if (!$dbPassword || !Hash::check($request->password, $dbPassword)) {
            DB::table('activitylogs')->insert([
                'userid' => null,
                'action' => 'login_failed',
                'entitytype' => 'User',
                'oldvalue' => json_encode(['email' => $request->email]),
                'ipaddress' => $request->ip(),
                'useragent' => $request->userAgent(),
                'createdat' => now(),
            ]);
            
            throw ValidationException::withMessages([
                'password' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Generates stateless JWT directly
        $token = Auth::guard('api')->fromUser($user);
        
        // Use strict lowercase roleid
        $roleName = match((int)$user->roleid) {
            1 => 'admin',
            2 => 'agent',
            default => 'employee'
        };
        
        // Update lowercase lastloginat directly via Query Builder to avoid Eloquent timestamp bugs
        DB::table('users')->where('id', $user->id)->update(['lastloginat' => now()]);

        DB::table('activitylogs')->insert([
            'userid' => $user->id,
            'action' => 'user_login',
            'entitytype' => 'User',
            'entityid' => $user->id,
            'ipaddress' => $request->ip(),
            'useragent' => $request->userAgent(),
            'createdat' => now(),
        ]);

        return response()->json([
            'message' => 'Login successful',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->fullname, // Lowercase mapping
                'email' => $user->email,
                'role' => $roleName,
                'department' => $user->department,
                'profile_photo' => null,
                'last_login_at' => now(),
            ]
        ]);
    }

    // ==================== LOGOUT ====================
    public function logout(Request $request)
    {
        $user = $request->user();
        
        if ($user) {
            DB::table('activitylogs')->insert([
                'userid' => $user->id,
                'action' => 'user_logout',
                'entitytype' => 'User',
                'entityid' => $user->id,
                'ipaddress' => $request->ip(),
                'useragent' => $request->userAgent(),
                'createdat' => now(),
            ]);
            
            Auth::guard('api')->logout();
        }

        return response()->json([
            'message' => 'Logged out successfully'
        ]);
    }

    // ==================== FORGOT PASSWORD ====================
    // ==================== FORGOT PASSWORD ====================
    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json(['message' => 'If the email exists in our system, we have sent a password reset link.']);
        }
        
        $token = Str::random(64);
        
        DB::table('passwordresettokens')->where('userid', $user->id)->delete();
        
        DB::table('passwordresettokens')->insert([
            'userid' => $user->id,
            'token' => $token,
            'expiresat' => now()->addMinutes(60),
            'used' => false,
            'createdat' => now(),
        ]);

        // Build the link back to your React frontend URL
        $resetLink = 'http://localhost:5173/reset-password?token=' . $token . '&email=' . urlencode($request->email);

        // Send the actual email
        Mail::send([], [], function ($message) use ($request, $resetLink) {
            $message->to($request->email)
                    ->subject('Password Reset Request - IT CommandCenter')
                    ->html("
                        <h2>Password Reset Request</h2>
                        <p>We received a request to reset the password for your IT HelpDesk account.</p>
                        <p>Click the link below to securely set a new password:</p>
                        <p><a href='{$resetLink}' style='display:inline-block;padding:10px 20px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:5px;'>Reset My Password</a></p>
                        <p>If you did not request this, please ignore this email. This link will expire in 60 minutes.</p>
                    ");
        });

        return response()->json([
            'message' => 'If the email exists in our system, we have sent a password reset link.'
        ]);
    }

    // ==================== RESET PASSWORD ====================
    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => 'required',
            'password' => 'required|min:6',
        ]);

        $resetRecord = DB::table('passwordresettokens')->where('token', $request->token)->first();

        if (!$resetRecord || $resetRecord->used) {
            return response()->json(['message' => 'Invalid or expired token.'], 400);
        }

        if (now()->greaterThan($resetRecord->expiresat)) {
            return response()->json(['message' => 'This token has expired.'], 400);
        }

        $user = User::find($resetRecord->userid);
        if (!$user) {
            return response()->json(['message' => 'User account not found.'], 404);
        }

        $passwordColumn = \Schema::hasColumn('users', 'password') ? 'password' : 'passwordhash';
        
        DB::table('users')->where('id', $user->id)->update([
            $passwordColumn => Hash::make($request->password),
            'updatedat' => now()
        ]);
        
        DB::table('passwordresettokens')->where('id', $resetRecord->id)->update(['used' => true]);

        return response()->json(['message' => 'Password reset successfully!']);
    }

    // ==================== GET CURRENT USER ====================
    public function getUser(Request $request)
    {
        $user = $request->user();
        
        $roleName = match((int)$user->roleid) {
            1 => 'admin',
            2 => 'agent',
            default => 'employee'
        };

        return response()->json([
            'id' => $user->id,
            'name' => $user->fullname,
            'email' => $user->email,
            'role' => $roleName,
            
            'phone' => $user->phone,
            'profile_photo' => null,
            'timezone' => $user->timezone ?? 'UTC',
            'created_at' => $user->createdat,
            'last_login_at' => $user->lastloginat,
        ]);
    }

    // ==================== UPDATE PROFILE ====================
    public function updateProfile(Request $request)
    {
        $user = $request->user();
        
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|string|max:30',
            'timezone' => 'sometimes|string|max:50',
            'current_password' => 'required_with:new_password',
        ]);

        $dbPassword = $user->password ?? $user->passwordhash ?? null;

        if ($request->has('new_password')) {
            $request->validate(['new_password' => ['required', 'confirmed', new StrongPassword]]);
            if (!$dbPassword || !Hash::check($request->current_password, $dbPassword)) {
                throw ValidationException::withMessages([
                    'current_password' => ['The current password field is incorrect.'],
                ]);
            }
        }

        $updates = ['updatedat' => now()];
        
        if ($request->has('name')) $updates['fullname'] = $request->name;
        if ($request->has('phone')) $updates['phone'] = $request->phone;
        if ($request->has('timezone')) $updates['timezone'] = $request->timezone;
        if ($request->has('new_password')) {
            $passwordColumn = \Schema::hasColumn('users', 'password') ? 'password' : 'passwordhash';
            $updates[$passwordColumn] = Hash::make($request->new_password);
        }

        DB::table('users')->where('id', $user->id)->update($updates);

        DB::table('activitylogs')->insert([
            'userid' => $user->id,
            'action' => 'profile_updated',
            'entitytype' => 'User',
            'entityid' => $user->id,
            'newvalue' => json_encode(array_keys($request->except(['current_password', 'new_password', 'new_password_confirmation']))),
            'ipaddress' => $request->ip(),
            'useragent' => $request->userAgent(),
            'createdat' => now(),
        ]);

        return response()->json([
            'message' => 'Profile updated successfully'
        ]);
    }

    // ==================== CHANGE PASSWORD ====================
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'password' => ['required', 'confirmed', new StrongPassword],
        ]);

        $user = $request->user();
        $dbPassword = $user->password ?? $user->passwordhash ?? null;

        if (!$dbPassword || !Hash::check($request->current_password, $dbPassword)) {
            throw ValidationException::withMessages([
                'current_password' => ['The provided password does not match our records.'],
            ]);
        }

        $passwordColumn = \Schema::hasColumn('users', 'password') ? 'password' : 'passwordhash';

        DB::table('users')->where('id', $user->id)->update([
            $passwordColumn => Hash::make($request->password),
            'updatedat' => now()
        ]);

        DB::table('activitylogs')->insert([
            'userid' => $user->id,
            'action' => 'password_changed',
            'entitytype' => 'User',
            'entityid' => $user->id,
            'ipaddress' => $request->ip(),
            'useragent' => $request->userAgent(),
            'createdat' => now(),
        ]);

        return response()->json([
            'message' => 'Password changed successfully'
        ]);
    }

    // ==================== GET ACTIVITY LOGS ====================
    public function getActivityLogs(Request $request)
    {
        $user = $request->user();
        $isAdmin = ((int)$user->roleid === 1);

        $query = DB::table('activitylogs')->orderBy('createdat', 'desc');
        
        if (!$isAdmin) {
            $query->where('userid', $user->id);
        }

        return response()->json($query->paginate(50));
    }
}