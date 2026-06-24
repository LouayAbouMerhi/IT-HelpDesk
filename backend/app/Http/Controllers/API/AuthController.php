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
use App\Mail\ResetPasswordMail;

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

        // Audit trail — write to the SAME table the audit log reads (activity_logs)
        DB::table('activity_logs')->insert([
            'user_id' => $userId,
            'action' => 'user_registered',
            'entity_type' => 'User',
            'entity_id' => $userId,
            'new_value' => json_encode(['email' => $request->email, 'roleid' => 3]),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        $user = User::find($userId);
        
        // --- JWT Generation ---
        $token = Auth::guard('api')->fromUser($user);

        return response()->json([
            'message' => 'Registration successful',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->fullname, 
                'email' => $user->email,
                'role' => 'employee',
                'department' => $user->department,
                'phone' => $user->phone,
            ]
        ], 201);
    }

    // ==================== LOGIN (WITH ATTEMPT LOCKOUT) ====================
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

        // 1. Check if deactivated
        $isActive = $user->isactive ?? $user->is_active ?? true;
        if (!$isActive) {
            throw ValidationException::withMessages([
                'email' => ['Your account has been deactivated. Please contact an administrator.'],
            ]);
        }

        // 2. Check if locked out
        $isLocked = $user->is_locked ?? false;
        if ($isLocked) {
            throw ValidationException::withMessages([
                'email' => ['Account locked due to multiple failed login attempts. Contact an Admin to unlock it.'],
            ]);
        }

        $dbPassword = $user->password ?? $user->passwordhash ?? null;

        // 3. Password Verification
        if (!$dbPassword || !Hash::check($request->password, $dbPassword)) {
            
            $isAdmin = ($user->role === 'admin' || (isset($user->roleid) && (int)$user->roleid === 1));

            if (!$isAdmin) {
                $attempts = ($user->failed_attempts ?? 0) + 1;
                $lockAccount = $attempts >= 5;

                DB::table('users')->where('id', $user->id)->update([
                    'failed_attempts' => $attempts,
                    'is_locked' => $lockAccount
                ]);

                DB::table('activity_logs')->insert([
                    'user_id' => $user->id,
                    'action' => $lockAccount ? 'account_locked' : 'login_failed',
                    'entity_type' => 'User',
                    'entity_id' => $user->id,
                    'new_value' => json_encode(['email' => $request->email, 'attempt' => $attempts]),
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'created_at' => now(),
                ]);

                throw ValidationException::withMessages([
                    'password' => ["The provided credentials are incorrect. Attempt $attempts of 5."],
                ]);
            } else {
                DB::table('activity_logs')->insert([
                    'user_id' => $user->id,
                    'action' => 'admin_login_failed',
                    'entity_type' => 'User',
                    'entity_id' => $user->id,
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'created_at' => now(),
                ]);

                throw ValidationException::withMessages([
                    'password' => ['The provided credentials are incorrect.'],
                ]);
            }
        }

        // 4. Success! Reset attempts and update login time
        DB::table('users')->where('id', $user->id)->update([
            'failed_attempts' => 0,
            'is_locked' => false,
            'lastloginat' => now()
        ]);

        $token = Auth::guard('api')->fromUser($user);
        
        // Define role names based on IDs
        $roleName = match((int)$user->roleid) {
            1 => 'admin',
            2 => 'agent',
            4 => 'supervisor', // Added support for supervisor
            default => 'employee'
        };

        DB::table('activity_logs')->insert([
            'user_id' => $user->id,
            'action' => 'user_login',
            'entity_type' => 'User',
            'entity_id' => $user->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'message' => 'Login successful',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->fullname ?? $user->name,
                'email' => $user->email,
                'role' => $roleName,
                'roleid' => (int)$user->roleid, // Ensure frontend receives the raw ID
                'supervisor_id' => $user->supervisor_id,
                'managed_category_id' => $user->managed_category_id,
                'last_login_at' => now(),
            ]
        ]);
    }

    // ==================== LOGOUT ====================
    public function logout(Request $request)
    {
        $user = $request->user();
        
        if ($user) {
            DB::table('activity_logs')->insert([
                'user_id' => $user->id,
                'action' => 'user_logout',
                'entity_type' => 'User',
                'entity_id' => $user->id,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'created_at' => now(),
            ]);
            
            Auth::guard('api')->logout();
        }

        return response()->json(['message' => 'Logged out successfully']);
    }

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

        try {
            Mail::to($request->email)->send(new ResetPasswordMail($token, $request->email));
        } catch (\Exception $e) {
            Log::error('Failed to send email: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to send reset email. Please try again later.'], 500);
        }

        return response()->json(['message' => 'If the email exists in our system, we have sent a password reset link.']);
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

        DB::table('activity_logs')->insert([
            'user_id' => $user->id,
            'action' => 'profile_updated',
            'entity_type' => 'User',
            'entity_id' => $user->id,
            'new_value' => json_encode(array_keys($request->except(['current_password', 'new_password', 'new_password_confirmation']))),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json(['message' => 'Profile updated successfully']);
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

        DB::table('activity_logs')->insert([
            'user_id' => $user->id,
            'action' => 'password_changed',
            'entity_type' => 'User',
            'entity_id' => $user->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json(['message' => 'Password changed successfully']);
    }

    // ==================== GET ACTIVITY LOGS ====================
    // ==================== GET ACTIVITY LOGS ====================
    public function getActivityLogs(Request $request)
    {
        try {
            $user = $request->user();
            
            // Admins and Supervisors see everything. Normal users see only their own logs.
            $isManagement = in_array($user->role, ['Admin', 'Supervisor']) || (int)$user->roleid === 1;

            $query = DB::table('activity_logs')
                ->leftJoin('users', 'activity_logs.user_id', '=', 'users.id')
                ->select(
                    'activity_logs.*',
                    'users.fullname as user_name',
                    'users.role as user_role'
                )
                ->orderBy('activity_logs.created_at', 'desc');
            
            if (!$isManagement) {
                $query->where('activity_logs.user_id', $user->id);
            }

            // Pagination ensures the system doesn't crash when logs reach 10,000+ rows
            return response()->json($query->paginate(100));
            
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Activity Log Error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to retrieve logs'], 500);
        }
    }

    // ==================== ADMIN: DEACTIVATE USER ====================
    public function toggleActive($id)
    {
        // 1. MUST use the User Model, not DB::table, so it casts types correctly
        $user = \App\Models\User::find($id);
        
        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        // 2. Safely check which column your database actually uses
        $columnName = null;
        if (array_key_exists('isactive', $user->getAttributes())) {
            $columnName = 'isactive';
        } elseif (array_key_exists('is_active', $user->getAttributes())) {
            $columnName = 'is_active';
        }

        if (!$columnName) {
            return response()->json(['message' => 'Activation column missing in database.'], 500);
        }

        // 3. Force it into a strict boolean and invert it
        $currentStatus = (bool) $user->$columnName;
        $newStatus = !$currentStatus;

        // 4. Save and return the exact new status to the frontend
        $user->$columnName = $newStatus;
        $user->save();

        return response()->json([
            'message' => $newStatus ? 'Account Reactivated!' : 'Account Deactivated!',
            'new_status' => $newStatus 
        ]);
    }

    // ==================== ADMIN: UNLOCK ACCOUNT ====================
    public function unlockAccount(Request $request, $id)
    {
        $request->validate([
            'new_password' => 'required|min:6'
        ]);

        $passwordColumn = \Schema::hasColumn('users', 'password') ? 'password' : 'passwordhash';

        DB::table('users')->where('id', $id)->update([
            'is_locked' => false,
            'failed_attempts' => 0,
            $passwordColumn => Hash::make($request->new_password),
            'updatedat' => now()
        ]);

        return response()->json(['message' => 'Account unlocked and password reset successfully.']);
    }
}