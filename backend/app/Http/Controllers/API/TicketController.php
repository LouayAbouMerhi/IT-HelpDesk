<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TicketController extends Controller
{
    // ==================== FETCH RECENT TICKETS ====================
    
    public function recent()
    {
        try {
            $tickets = DB::table('tickets')
                ->join('categories', 'tickets.categoryid', '=', 'categories.id')
                ->join('users as creator', 'tickets.createdby', '=', 'creator.id')
                ->leftJoin('users as agent', 'tickets.assignedto', '=', 'agent.id') // leftJoin because assignedto can be null
                ->select(
                    'tickets.*',
                    'categories.name as category_name',
                    'creator.fullname as creator_name',
                    'agent.fullname as agent_name'
                )
                ->orderBy('tickets.id', 'desc')
                ->limit(20)
                ->get();

            return response()->json($tickets);
        } catch (\Exception $e) {
            Log::error("Ticket Fetch Error: " . $e->getMessage());
            return response()->json(['error' => 'Failed to retrieve tickets.'], 500);
        }
    }
    
    // ==================== FETCH ALL TICKETS (WITH RELATIONSHIPS) ====================
    public function index()
    {
        try {
            // Updated joins to use your true database lowercase columns: 'priorityid' and 'statusid'
            $tickets = DB::table('tickets')
                ->join('priorities', 'tickets.priorityid', '=', 'priorities.id')
                ->join('statuses', 'tickets.statusid', '=', 'statuses.id')
                ->select(
                    'tickets.*', 
                    'priorities.name as priority_name', 
                    'statuses.name as status_name'
                )
                ->orderBy('tickets.createdat', 'desc') // Updated to 'createdat'
                ->get();
            
            return response()->json($tickets, 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve active pipeline incidents.',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    // ==================== STORE NEW INCOMING TICKET ====================
    // ==================== STORE NEW INCOMING TICKET ====================
    public function store(Request $request)
    {
        try {
            $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'categoryid' => 'required|integer',
                'priorityid' => 'required|integer',
            ]);

            // Gets the authenticated user instance from the JWT payload token securely
            $user = $request->user(); 

            // Automatically generate the incremental reference string sequence
            $latestTicket = DB::table('tickets')->orderBy('id', 'desc')->first();
            $nextId = $latestTicket ? ($latestTicket->id + 1) : 105;
            $referenceNo = 'TKT-' . str_pad($nextId, 5, '0', STR_PAD_LEFT); 

            // Inserts the user data with real, static timestamps
            $ticketId = DB::table('tickets')->insertGetId([
                'referenceno' => $referenceNo,
                'title' => $request->title,
                'description' => $request->description,
                'createdby' => $user->id,
                'assignedto' => null,
                'categoryid' => $request->categoryid,
                'priorityid' => $request->priorityid,
                'statusid' => 1, // Default status: Open
                'createdat' => now(), 
                'updatedat' => now(), 
            ]);

            // --- THE FIX: Reverted to strict lowercase to match your working AuthController ---
            // --- GUARANTEED SYNC: Using the exact same schema as AuthController ---
            DB::table('activity_logs')->insert([
                'user_id'     => $user->id,
                'action'      => 'ticket_created',
                'entity_type' => 'Ticket',
                'entity_id'   => $ticketId,
                'new_value'   => json_encode(['referenceno' => $referenceNo, 'status' => 'Open']),
                'ip_address'  => $request->ip(),
                'user_agent'  => $request->userAgent(),
                'created_at'  => now(),
            ]);

            $newTicket = DB::table('tickets')->where('id', $ticketId)->first();

            return response()->json([
                'message' => 'Ticket created successfully',
                'ticket' => $newTicket
            ], 201);

        } catch (\Exception $e) {
            Log::error("Ticket Creation Error: " . $e->getMessage());
            return response()->json([
                'message' => 'Failed to create ticket.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    // ==================== FETCH CATEGORIES & PRIORITIES ====================
    public function lookups()
    {
        try {
            return response()->json([
                'categories' => DB::table('categories')->select('id', 'name')->orderBy('id')->get(),
                'priorities' => DB::table('priorities')->select('id', 'name')->orderBy('id')->get()
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to load lookups'], 500);
        }
    }
}