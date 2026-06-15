<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
class UserController extends Controller
{
    // List all users for the Agent Roster
    public function index() {
        $users = DB::table('users')
            ->select(
                'id', 
                'fullname', 
                'email', 
                'roleid', 
                'supervisor_id', 
                'managed_category_id', 
                'is_active', 
                'is_locked', 
                'failed_attempts',
                // --- NEW: Subquery to count active assigned tickets ---
                DB::raw('(SELECT count(*) FROM tickets WHERE tickets.assignedto = users.id AND tickets.statusid IN (1, 2, 5)) as active_tickets_count')
            )
            ->orderBy('fullname')
            ->get()
            ->map(function ($user) {
                $roleName = 'User';
                if ($user->roleid == 1) $roleName = 'Admin';
                if ($user->roleid == 2) $roleName = 'Agent';
                if ($user->roleid == 4) $roleName = 'Supervisor';
                if ($user->roleid == 0) $roleName = 'Inactive';
                
                $user->role = $roleName;
                $user->is_locked = (bool)($user->is_locked ?? false);
                $user->is_active = (bool)($user->is_active ?? true);
                
                return $user;
            });
            
        return response()->json($users);
    }

    // Admin creates a new employee
    public function store(Request $request)
    {
        $request->validate([
            'fullname' => 'required|string',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:6',
            'role' => 'required|in:Admin,Supervisor,Agent,User'
        ]);

        $roleId = 3;
        if ($request->role === 'Admin') $roleId = 1;
        if ($request->role === 'Agent') $roleId = 2;
        if ($request->role === 'Supervisor') $roleId = 4;
        
        $data = [
            'fullname' => $request->fullname,
            'email' => $request->email,
            'passwordhash' => Hash::make($request->password),
            'roleid' => $roleId,
            'createdat' => now(),
            'is_active' => 1,
            'is_locked' => 0,
            'failed_attempts' => 0
        ];
        
        if (in_array($request->role, ['Agent', 'User']) && $request->has('supervisor_id') && !empty($request->supervisor_id)) {
            $data['supervisor_id'] = $request->supervisor_id;
        }
        
        if ($request->role === 'Supervisor' && $request->has('managed_category_id') && !empty($request->managed_category_id)) {
            $data['managed_category_id'] = $request->managed_category_id;
        }
        
        $userId = DB::table('users')->insertGetId($data);

        return response()->json([
            'message' => 'Employee created successfully',
            'user' => ['id' => $userId, 'role' => $request->role]
        ], 201);
    }

    // Admin updates an existing employee
    public function update(Request $request, $id)
    {
        $request->validate([
            'fullname' => 'required|string',
            'email' => 'required|email|unique:users,email,' . $id,
            'role' => 'required|in:Admin,Supervisor,Agent,User'
        ]);

        $roleId = 3;
        if ($request->role === 'Admin') $roleId = 1;
        if ($request->role === 'Agent') $roleId = 2;
        if ($request->role === 'Supervisor') $roleId = 4;
        
        $data = [
            'fullname' => $request->fullname,
            'email' => $request->email,
            'roleid' => $roleId,
            'updatedat' => now()
        ];
        
        if ($request->has('password') && !empty($request->password)) {
            $data['passwordhash'] = Hash::make($request->password);
        }
        
        if ($request->has('supervisor_id')) {
            $data['supervisor_id'] = $request->supervisor_id;
        }
        
        if ($request->has('managed_category_id')) {
            $data['managed_category_id'] = $request->managed_category_id;
        }
        
        DB::table('users')->where('id', $id)->update($data);

        return response()->json(['message' => 'Employee updated successfully'], 200);
    }

    // Admin permanently deletes an employee
    // ==================== DELETE USER ====================
    public function destroy($id)
    {
        try {
            // 1. Final Safety Check: Ensure they truly have no active assigned tickets
            $activeCount = DB::table('tickets')
                ->where('assignedto', $id)
                ->whereIn('statusid', [1, 2, 5]) // Open, In Progress, Pending
                ->count();

            if ($activeCount > 0) {
                return response()->json([
                    'message' => 'Cannot delete: Agent still has active tickets.'
                ], 422);
            }

            // 2. SCRUB FOREIGN KEYS: Detach the user from all historical records
            
            // A. Detach from any closed/resolved tickets they were assigned to
            DB::table('tickets')->where('assignedto', $id)->update(['assignedto' => null]);
            
            // B. Detach from any tickets they created/reported
            DB::table('tickets')->where('createdby', $id)->update(['createdby' => null]);
            
            // C. Detach from any comments or time logs they wrote
            DB::table('comments')->where('userid', $id)->update(['userid' => null]);
            
            // D. Detach from the system audit/activity logs
            DB::table('activity_logs')->where('user_id', $id)->update(['user_id' => null]);
            
            // E. Remove them as a supervisor from any agents underneath them
            DB::table('users')->where('supervisor_id', $id)->update(['supervisor_id' => null]);

            // 3. Finally, delete the user safely
            DB::table('users')->where('id', $id)->delete();

            return response()->json(['message' => 'Employee deleted and history preserved.']);
            
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Delete User Error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Database constraint prevented deletion.', 
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    // Fetch all tickets assigned to a specific user
    public function userTickets($id) {
        try {
            $tickets = DB::table('tickets')
                ->leftJoin('categories', 'tickets.categoryid', '=', 'categories.id')
                ->leftJoin('users as reporters', 'tickets.createdby', '=', 'reporters.id')
                ->leftJoin('users as agents', 'tickets.assignedto', '=', 'agents.id') 
                ->where('tickets.assignedto', $id) 
                ->select(
                    'tickets.*',
                    'categories.name as category_name',
                    'reporters.fullname as creator_name',
                    'agents.fullname as agent_name'
                )
                ->orderBy('tickets.id', 'desc')
                ->get();
                
            return response()->json($tickets);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // Deactivate / Reactivate user
    public function toggleActive($id)
    {
        $user = DB::table('users')->where('id', $id)->first();
        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $newStatus = !$user->is_active;
        DB::table('users')->where('id', $id)->update([
            'is_active' => $newStatus,
            'is_locked' => $newStatus ? 0 : $user->is_locked,
            'failed_attempts' => $newStatus ? 0 : $user->failed_attempts
        ]);

        return response()->json([
            'message' => $newStatus ? 'Account reactivated!' : 'Account deactivated successfully.',
            'new_status' => $newStatus
        ]);
    }

    // Unlock account and set new password
    public function unlockAccount(Request $request, $id)
    {
        $request->validate([
            'new_password' => 'required|min:6'
        ]);

        $user = DB::table('users')->where('id', $id)->first();
        
        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        DB::table('users')->where('id', $id)->update([
            'is_locked' => false,
            'failed_attempts' => 0,
            'passwordhash' => Hash::make($request->new_password)
        ]);

        return response()->json(['message' => 'Account unlocked and password reset successfully.']);
    }
    
    // Fetch users for dropdowns (Admins, Agents, Supervisors)
    public function getAgents() {
        $agents = DB::table('users')
            ->whereIn('roleid', [1, 2, 4])
            ->where('is_active', 1)
            ->select('id', 'fullname', 'email', 'roleid')
            
            // --- UPDATED: Added '3' to include Resolved tickets in the count ---
            ->selectRaw('(SELECT COUNT(*) FROM tickets WHERE tickets.assignedto = users.id AND tickets.statusid IN (1, 2, 3, 5)) as active_tickets_count')
            
            ->orderBy('fullname')
            ->get()
            ->map(function ($user) {
                if ($user->roleid == 1) $user->role = 'Admin';
                elseif ($user->roleid == 2) $user->role = 'Agent';
                elseif ($user->roleid == 4) $user->role = 'Supervisor';
                else $user->role = 'User';
                
                return $user;
            });
            
        return response()->json($agents);
    }
    
    // Self-Service Profile Update
    public function updateProfile(Request $request, $id) {
        $request->validate(['fullname' => 'required|string']);

        $updateData = ['fullname' => $request->fullname, 'updatedat' => now()];

        if ($request->filled('password')) {
            $request->validate(['password' => 'min:6']);
            $updateData['passwordhash'] = Hash::make($request->password);
        }

        DB::table('users')->where('id', $id)->update($updateData);

        return response()->json(['message' => 'Your profile has been updated!']);
    }

    public function getSupervisorAgents()
{
    $user = Auth::user();
    
    if (!$user || (int)$user->roleid !== 4) {
        return response()->json(['message' => 'Unauthorized'], 403);
    }

    // Instead of matching managed_category_id, match the supervisor_id!
    $agents = DB::table('users')
        ->where('roleid', 2) 
        ->where('supervisor_id', $user->id) // Match agents who report to this supervisor
        ->select(
            'id', 
            'fullname', 
            'roleid',
            DB::raw('(SELECT count(*) FROM tickets WHERE tickets.assignedto = users.id AND tickets.statusid IN (1, 2, 3, 5)) as active_tickets_count')
        )
        ->get()
        ->map(function ($agent) {
            $agent->role = 'Agent'; 
            return $agent;
        });

    return response()->json($agents);
}
}