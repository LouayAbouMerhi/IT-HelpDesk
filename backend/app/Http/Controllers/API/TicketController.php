<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\TicketAlertMail;

class TicketController extends Controller
{
    // ==================== FETCH RECENT TICKETS (DASHBOARD) ====================
    public function recent() 
    {
        try {
            $tickets = DB::table('tickets')
                ->leftJoin('categories', 'tickets.categoryid', '=', 'categories.id')
                ->leftJoin('users as reporters', 'tickets.createdby', '=', 'reporters.id')
                ->leftJoin('users as agents', 'tickets.assignedto', '=', 'agents.id') 
                ->select(
                    'tickets.*',
                    'categories.name as category_name',
                    'reporters.fullname as creator_name',
                    'agents.fullname as agent_name'
                )
                ->orderBy('tickets.id', 'desc')
                ->limit(100) 
                ->get();
                
            return response()->json($tickets);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    
    // ==================== FETCH ALL TICKETS ====================
    public function index()
    {
        try {
            $tickets = DB::table('tickets')
                ->leftJoin('priorities', 'tickets.priorityid', '=', 'priorities.id')
                ->leftJoin('statuses', 'tickets.statusid', '=', 'statuses.id')
                ->leftJoin('categories', 'tickets.categoryid', '=', 'categories.id')
                ->leftJoin('users as creator', 'tickets.createdby', '=', 'creator.id')
                ->leftJoin('users as agent', 'tickets.assignedto', '=', 'agent.id')
                ->select(
                    'tickets.*', 
                    'priorities.name as priority_name', 
                    'statuses.name as status_name',
                    'categories.name as category_name',
                    'creator.fullname as creator_name',
                    'agent.fullname as agent_name'
                )
                ->orderBy('tickets.createdat', 'desc')
                ->get();
            
            $ticketIds = $tickets->pluck('id')->toArray();
            
            if (!empty($ticketIds)) {
                $attachments = DB::table('attachments')->whereIn('ticketid', $ticketIds)->get()->groupBy('ticketid');
                
                foreach ($tickets as $ticket) {
                    if (isset($attachments[$ticket->id])) {
                        $ticket->attachments = $attachments[$ticket->id]->map(function($att) {
                            return [
                                'filename' => $att->filename,
                                'filepath' => $att->filepath
                            ];
                        })->toArray();
                    } else {
                        $ticket->attachments = [];
                    }
                }
            }

            return response()->json($tickets, 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve active pipeline incidents.',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    // ==================== FETCH A SINGLE TICKET FOR THE MODAL ====================
    public function show($id)
    {
        $ticket = DB::table('tickets')
            ->leftJoin('categories', 'tickets.categoryid', '=', 'categories.id')
            ->leftJoin('users as reporters', 'tickets.createdby', '=', 'reporters.id')
            ->leftJoin('users as agents', 'tickets.assignedto', '=', 'agents.id')
            ->where('tickets.id', $id)
            ->select(
                'tickets.*',
                'categories.name as category_name',
                'reporters.fullname as creator_name',
                'agents.fullname as agent_name'
            )
            ->first();

        if (!$ticket) {
            return response()->json(['message' => 'Ticket not found'], 404);
        }

        $attachments = DB::table('attachments')->where('ticketid', $id)->get();
        $ticket->attachments = $attachments->map(function($att) {
            return [
                'filename' => $att->filename,
                'filepath' => $att->filepath,
                'filesizekb' => $att->filesizekb
            ];
        })->toArray();

        return response()->json($ticket);
    }

    // ==================== STORE NEW INCOMING TICKET ====================
    public function store(Request $request)
    {
        try {
            $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'categoryid' => 'required|integer',
                'priorityid' => 'required|integer',
                'attachments' => 'nullable|array',
                'attachments.*' => 'file|max:5120', 
            ]);

            $user = $request->user(); 

            $latestTicket = DB::table('tickets')->orderBy('id', 'desc')->first();
            $nextId = $latestTicket ? ($latestTicket->id + 1) : 105;
            $referenceNo = 'TKT-' . str_pad($nextId, 5, '0', STR_PAD_LEFT);

            $ticketId = DB::table('tickets')->insertGetId([
                'referenceno' => $referenceNo,
                'title' => $request->title,
                'description' => $request->description,
                'createdby' => $user->id,
                'assignedto' => null,
                'categoryid' => $request->categoryid,
                'priorityid' => $request->priorityid,
                'statusid' => 1, 
                'createdat' => now(), 
                'updatedat' => now(), 
            ]);

            if ($request->hasFile('attachments')) {
                foreach ($request->file('attachments') as $file) {
                    $path = $file->store('attachments', 'public');
                    DB::table('attachments')->insert([
                        'ticketid'   => $ticketId,
                        'uploadedby' => $user->id,
                        'filename'   => $file->getClientOriginalName(),
                        'filepath'   => $path,
                        'filesizekb' => (int) round($file->getSize() / 1024), 
                        'filetype'   => $file->getClientMimeType(),
                        'createdat'  => now(),
                    ]);
                }
            }

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

            return response()->json(['message' => 'Ticket created successfully', 'ticket' => $newTicket], 201);

        } catch (\Exception $e) {
            Log::error("Ticket Creation Error: " . $e->getMessage());
            return response()->json(['message' => 'Failed to create ticket.', 'error' => $e->getMessage()], 500);
        }
    }

    // ==================== UPDATE / EDIT / ASSIGN TICKET ====================
    public function update(Request $request, $id)
    {
        try {
            $ticket = DB::table('tickets')->where('id', $id)->first();
            if (!$ticket) return response()->json(['message' => 'Ticket not found'], 404);

            $updateData = ['updatedat' => now()];
            if ($request->has('title')) $updateData['title'] = $request->title;
            if ($request->has('description')) $updateData['description'] = $request->description;
            if ($request->has('statusid')) $updateData['statusid'] = $request->statusid;
            if ($request->has('priorityid')) $updateData['priorityid'] = $request->priorityid;
            if ($request->has('categoryid')) $updateData['categoryid'] = $request->categoryid;
            
            if ($request->has('agentid')) {
                $updateData['assignedto'] = $request->agentid ? $request->agentid : null;
                
                // --- THE FIX: Auto-set to In Progress (2) when assigned ---
                // We only do this if they actually assigned someone AND didn't manually pick a different status
                if ($request->agentid && !$request->has('statusid')) {
                    $updateData['statusid'] = 2; 
                }
            }

            DB::table('tickets')->where('id', $id)->update($updateData);

            $user = $request->user();
            
            // Log the activity
            DB::table('activity_logs')->insert([
                'user_id'     => $user->id,
                'action'      => $request->has('agentid') ? 'ticket_reassigned' : 'ticket_updated',
                'entity_type' => 'Ticket',
                'entity_id'   => $id,
                'new_value'   => json_encode(['updated_fields' => array_keys($updateData)]),
                'ip_address'  => $request->ip(),
                'user_agent'  => $request->userAgent(),
                'created_at'  => now(),
            ]);

            if ($request->has('agentid') && $request->agentid && $request->agentid != $ticket->assignedto) {
                
                DB::table('notifications')->insert([
                    'userid' => $request->agentid,
                    'ticketid' => $id,
                    'type' => 'ticket_assigned',
                    'title' => 'New Ticket Assigned',
                    'message' => 'You have been assigned to ' . ($ticket->referenceno ?? 'a new ticket'),
                    'isread' => false,
                    'sentviaemail' => true,
                    'createdat' => now()
                ]);

                $agent = DB::table('users')->where('id', $request->agentid)->first();
                if ($agent && $agent->email) {
                    \Illuminate\Support\Facades\Mail::to($agent->email)->send(new \App\Mail\TicketAlertMail(
                        $ticket, 
                        'Ticket Assignment', 
                        "You have been assigned to handle an incident ticket."
                    ));
                }
            }

            return response()->json(['message' => 'Ticket updated successfully']);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Update Error: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to update ticket.', 'error' => $e->getMessage()], 500);
        }
    }

    // ==================== SOFT DELETE / CANCEL TICKET ====================
    // ==================== HARD DELETE TICKET ====================
    public function destroy(Request $request, $id)
    {
        try {
            $ticket = DB::table('tickets')->where('id', $id)->first();
            if (!$ticket) return response()->json(['message' => 'Ticket not found'], 404);

            $user = $request->user();

            // Security Check to ensure employees only delete their own tickets
            $isStandardUser = in_array(strtolower($user->role), ['user', 'employee']) || $user->roleid == 3;
            
            if ($isStandardUser && $ticket->createdby != $user->id) {
                return response()->json(['error' => 'Unauthorized to delete this ticket'], 403);
            }

            // 1. HARD DELETE ALL RELATED DATA FIRST (To prevent SQL Foreign Key crashes)
            DB::table('attachments')->where('ticketid', $id)->delete();
            DB::table('ticketcomments')->where('ticketid', $id)->delete();
            DB::table('internal_notes')->where('ticket_id', $id)->delete();
            DB::table('notifications')->where('ticketid', $id)->delete();
            
            // Optional: Wipe the audit trail for this specific ticket so no trace is left
            DB::table('activity_logs')->where('entity_type', 'Ticket')->where('entity_id', $id)->delete();

            // 2. FINALLY: Hard delete the ticket itself
            DB::table('tickets')->where('id', $id)->delete();

            return response()->json(['message' => 'Ticket completely deleted from the database']);
            
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Delete Error: " . $e->getMessage());
            return response()->json(['message' => 'Failed to delete ticket.', 'error' => $e->getMessage()], 500);
        }
    }

    // ==================== FETCH TICKET HISTORY ====================
    public function history($id)
    {
        try {
            $logs = DB::table('activity_logs')
                ->leftJoin('users', 'activity_logs.user_id', '=', 'users.id')
                ->where('entity_type', 'Ticket')
                ->where('entity_id', $id)
                ->select(
                    'activity_logs.*',
                    'users.fullname as user_name'
                )
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json($logs);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to load history.'], 500);
        }
    }

    // ==================== ASSIGN & ESCALATE TICKET ====================
    // ==================== ASSIGN & ESCALATE TICKET ====================
    public function assignTicket(Request $request, $id)
    {
        try {
            $user = $request->user();
            $agentId = $request->agent_id;
            $isEscalation = $request->boolean('escalate');

            // --- THE FIX: Automatically set statusid to 2 (In Progress) ---
            $updateData = [
                'assignedto' => $agentId, 
                'statusid' => 2, 
                'updatedat' => now()
            ];
            
            if ($isEscalation) {
                $updateData['priorityid'] = 4;
            }

            DB::table('tickets')->where('id', $id)->update($updateData);
            $ticket = DB::table('tickets')->where('id', $id)->first();

            $agentName = $agentId ? DB::table('users')->where('id', $agentId)->value('fullname') : 'Unassigned';

            DB::table('activity_logs')->insert([
                'user_id'     => $user->id,
                'action'      => $isEscalation ? 'ticket_escalated' : 'ticket_reassigned',
                'entity_type' => 'Ticket',
                'entity_id'   => $id,
                // --- THE FIX: Log the status change as well ---
                'new_value'   => json_encode(['assigned_to' => $agentName, 'status' => 'In Progress']),
                'ip_address'  => $request->ip(),
                'user_agent'  => $request->userAgent(),
                'created_at'  => now(),
            ]);
            
            if ($agentId) {
                DB::table('notifications')->insert([
                    'userid' => $request->agent_id,
                    'type' => 'ticket_assigned',
                    'title' => 'New Ticket Assigned',
                    'message' => 'You have been assigned to ticket ' . ($ticket->referenceno ?? ''),
                    'isread' => false,
                    'createdat' => now()
                ]);
            }

            return response()->json(['message' => 'Workflow updated successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to assign ticket.'], 500);
        }
    }

    // ==================== ESCALATE TICKET ====================
    // ==================== ESCALATE TICKET ====================
    public function escalate(Request $request, $id) 
    {
        try {
            $ticket = DB::table('tickets')->where('id', $id)->first();
            if (!$ticket) return response()->json(['message' => 'Ticket not found'], 404);

            $user = $request->user();

            // 1. Update priority to Critical (Priority ID: 4)
            DB::table('tickets')->where('id', $id)->update([
                'priorityid' => 4,
                'updatedat' => now()
            ]);

            // 2. Log Activity
            DB::table('activity_logs')->insert([
                'user_id'     => $user->id,
                'action'      => 'ticket_escalated',
                'entity_type' => 'Ticket',
                'entity_id'   => $id,
                'new_value'   => json_encode(['priority' => 'CRITICAL']),
                'ip_address'  => $request->ip(),
                'user_agent'  => $request->userAgent(),
                'created_at'  => now(),
            ]);

            // 3. Determine WHO to alert
            // If assigned, alert the agent. If unassigned, alert the Category Supervisor.
            $notifyUserId = $ticket->assignedto;
            
            if (!$notifyUserId) {
                $categorySupervisor = DB::table('users')
                    ->where('role', 'Supervisor')
                    ->where('managed_category_id', $ticket->categoryid)
                    ->where(function($q) {
                        $q->where('isactive', true)->orWhere('is_active', true);
                    })
                    ->first();
                $notifyUserId = $categorySupervisor ? $categorySupervisor->id : null;
            }

            // 4. Fire Notification & Email
            if ($notifyUserId && $notifyUserId != $user->id) {
                
                DB::table('notifications')->insert([
                    'userid' => $notifyUserId,
                    'ticketid' => $id,
                    'type' => 'ticket_escalated',
                    'title' => 'URGENT: Ticket Escalated',
                    'message' => "Ticket " . ($ticket->referenceno ?? $id) . " was escalated to CRITICAL by {$user->fullname}.",
                    'isread' => false,
                    'sentviaemail' => true,
                    'createdat' => now()
                ]);

                $notifyUser = DB::table('users')->where('id', $notifyUserId)->first();
                
                if ($notifyUser && $notifyUser->email) {
                    try {
                        \Illuminate\Support\Facades\Mail::to($notifyUser->email)->send(new \App\Mail\TicketAlertMail(
                            $ticket, 
                            'URGENT: Ticket Escalated to CRITICAL', 
                            "Ticket " . ($ticket->referenceno ?? $id) . " has been escalated to CRITICAL priority by {$user->fullname}. Immediate action is required."
                        ));
                    } catch (\Exception $e) {
                        \Illuminate\Support\Facades\Log::error("Escalation Email Failed: " . $e->getMessage());
                    }
                }
            }

            return response()->json(['message' => 'Ticket successfully escalated to Critical and alerts sent!']);
            
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Escalation Error: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to escalate ticket.', 'error' => $e->getMessage()], 500);
        }
    }

    // ==================== INTERNAL NOTES ====================
    public function addInternalNote(Request $request, $id)
    {
        try {
            $request->validate(['note' => 'required|string']);
            $user = $request->user();

            DB::table('internal_notes')->insert([
                'ticket_id'  => $id,
                'user_id'    => $user->id,
                'note'       => $request->note,
                'created_at' => now(),
            ]);

            DB::table('activity_logs')->insert([
                'user_id'     => $user->id,
                'action'      => 'internal_note_added',
                'entity_type' => 'Ticket',
                'entity_id'   => $id,
                'ip_address'  => $request->ip(),
                'user_agent'  => $request->userAgent(),
                'created_at'  => now(),
            ]);

            return response()->json(['message' => 'Note added successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to add note.'], 500);
        }
    }

    public function getInternalNotes($id)
    {
        try {
            $notes = DB::table('internal_notes')
                ->join('users', 'internal_notes.user_id', '=', 'users.id')
                ->where('ticket_id', $id)
                ->select('internal_notes.*', 'users.fullname as author_name', 'users.roleid')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($note) {
                    $note->author_role = $note->roleid == 1 ? 'Admin' : 'Agent';
                    return $note;
                });
            return response()->json($notes);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch notes.'], 500);
        }
    }

    // ==================== FETCH CATEGORIES, PRIORITIES & STATUSES ====================
    public function lookups()
    {
        try {
            return response()->json([
                'categories' => DB::table('categories')->select('id', 'name')->orderBy('id')->get(),
                'priorities' => DB::table('priorities')->select('id', 'name')->orderBy('id')->get(),
                'statuses'   => DB::table('statuses')->select('id', 'name')->orderBy('id')->get() 
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to load lookups'], 500);
        }
    }

    // ==================== FETCH COMMENTS ====================
    public function getComments($id)
    {
        try {
            $comments = DB::table('ticketcomments') 
                ->join('users', 'ticketcomments.userid', '=', 'users.id')
                ->where('ticketid', $id)
                ->select('ticketcomments.*', 'users.fullname as author_name', 'users.roleid')
                ->orderBy('createdat', 'asc')
                ->get();
                
            return response()->json($comments);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch comments', 'details' => $e->getMessage()], 500);
        }
    }

    // ==================== ADD TICKET COMMENT ====================
    public function addComment(Request $request, $id)
    {
        try {
            $request->validate([
                'content' => 'required|string',
                'isinternal' => 'boolean',
                'parentid' => 'nullable|integer',
                // Added validation to accept an array of files via multipart/form-data
                'attachments' => 'nullable|array',
                'attachments.*' => 'file|max:5120', 
            ]);
            
            $user = $request->user();
            $ticket = DB::table('tickets')->where('id', $id)->first();
            
            if (!$ticket) {
                return response()->json(['error' => 'Ticket not found'], 404);
            }

            // 1. Save the Comment
            $commentId = DB::table('ticketcomments')->insertGetId([
                'ticketid'    => $id,
                'userid'      => $user->id,
                'parentid'    => $request->parentid ?? null,
                'content'     => $request->content,
                'isinternal'  => $request->isinternal ?? false,
                'createdat'   => now(),
                'updatedat'   => now(),
            ]);

            // 2. Handle File Attachments if provided
            if ($request->hasFile('attachments')) {
                foreach ($request->file('attachments') as $file) {
                    $path = $file->store('attachments', 'public');
                    DB::table('attachments')->insert([
                        'ticketid'   => $id, // Linking attachments to the ticket
                        'uploadedby' => $user->id,
                        'filename'   => $file->getClientOriginalName(),
                        'filepath'   => $path,
                        'filesizekb' => (int) round($file->getSize() / 1024), 
                        'filetype'   => $file->getClientMimeType(),
                        'createdat'  => now(),
                    ]);
                }
            }

            $agentId = $ticket->agentid ?? $ticket->assignedto ?? $ticket->agent_id ?? null;
            $creatorId = $ticket->userid ?? $ticket->createdby ?? $ticket->user_id ?? null;
            
            $this->processMentions($request->content, $id, $user->fullname);

            // 3. NOTIFY & EMAIL THE ASSIGNED AGENT
            if ($agentId) { 
                DB::table('notifications')->insert([
                    'userid' => $agentId,
                    'ticketid' => $id,
                    'type' => 'new_comment',
                    'title' => 'New Update on ' . ($ticket->referenceno ?? 'Ticket'),
                    'message' => $user->fullname . ' added a comment.',
                    'isread' => false,
                    'sentviaemail' => true, 
                    'createdat' => now()
                ]);

                $agent = DB::table('users')->where('id', $agentId)->first();
                if ($agent && $agent->email) {
                    try {
                        Mail::to($agent->email)->send(new TicketAlertMail(
                            $ticket, 
                            'New Ticket Comment', 
                            "{$user->fullname} has posted a new comment on a ticket assigned to you."
                        ));
                    } catch (\Exception $e) {
                        Log::error("Email Error: " . $e->getMessage());
                    }
                }
            }

            // 4. NOTIFY & EMAIL THE TICKET CREATOR
            if ($creatorId && !$request->isinternal) {
                DB::table('notifications')->insert([
                    'userid' => $creatorId,
                    'ticketid' => $id,
                    'type' => 'new_reply',
                    'title' => 'Response Received',
                    'message' => 'Support replied to your ticket.',
                    'isread' => false,
                    'sentviaemail' => true,
                    'createdat' => now()
                ]);

                $creator = DB::table('users')->where('id', $creatorId)->first();
                if ($creator && $creator->email) {
                    try {
                        Mail::to($creator->email)->send(new TicketAlertMail(
                            $ticket, 
                            'Support Reply Received', 
                            "An IT support agent has replied to your open ticket."
                        ));
                    } catch (\Exception $e) {
                        Log::error("Email Error: " . $e->getMessage());
                    }
                }
            }

            // 5. Log the Activity
            DB::table('activity_logs')->insert([
                'user_id' => $user->id,
                'action' => 'comment_added',
                'entity_type' => 'Ticket',
                'entity_id' => $id,
                'created_at' => now()
            ]);

            return response()->json(['message' => 'Comment posted successfully']);
        } catch (\Exception $e) {
            Log::error('Comment Error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to post comment', 'details' => $e->getMessage()], 500);
        }
    }

    private function processMentions($content, $ticketId, $senderName)
    {
        preg_match_all('/@([a-zA-Z0-9_]+)/', $content, $matches);
        $usernames = $matches[1];

        foreach ($usernames as $username) {
            $mentionedUser = DB::table('users')
                ->where('fullname', 'LIKE', '%' . $username . '%')
                ->orWhere('username', $username)
                ->first();

            if ($mentionedUser) {
                DB::table('notifications')->insert([
                    'userid' => $mentionedUser->id,
                    'ticketid' => $ticketId,
                    'type' => 'mention',
                    'title' => 'You were mentioned',
                    'message' => $senderName . ' tagged you in a comment.',
                    'isread' => false,
                    'sentviaemail' => false,
                    'createdat' => now()
                ]);
            }
        }
    }

    // App\Http\Controllers\API\TicketController.php

    public function myTickets(Request $request) 
    {
        try {
            // Get the currently logged in user's ID
            $userId = $request->user()->id;

            $tickets = DB::table('tickets')
                ->leftJoin('categories', 'tickets.categoryid', '=', 'categories.id')
                ->leftJoin('users as agents', 'tickets.assignedto', '=', 'agents.id') 
                ->where('tickets.createdby', $userId) // ONLY fetch their tickets
                ->select(
                    'tickets.*',
                    'categories.name as category_name',
                    'agents.fullname as agent_name'
                )
                ->orderBy('tickets.id', 'desc')
                ->get();
                
            return response()->json($tickets);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("MyTickets Error: " . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch your tickets'], 500);
        }
    }

    // ==================== FETCH ALL COMPANY TICKETS (EMPLOYEE VIEW) ====================
    public function companyTickets(Request $request) 
    {
        try {
            $tickets = DB::table('tickets')
                ->leftJoin('categories', 'tickets.categoryid', '=', 'categories.id')
                ->leftJoin('users as reporters', 'tickets.createdby', '=', 'reporters.id')
                ->leftJoin('users as agents', 'tickets.assignedto', '=', 'agents.id') 
                ->select(
                    'tickets.*',
                    'categories.name as category_name',
                    'reporters.fullname as creator_name', // We need to know who made it
                    'agents.fullname as agent_name'
                )
                ->orderBy('tickets.id', 'desc')
                ->get();
                
            return response()->json($tickets);
            
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("CompanyTickets Error: " . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch company tickets', 'details' => $e->getMessage()], 500);
        }
    }

    // ==================== AGENT DASHBOARD DATA ====================
    public function agentDashboard(Request $request)
    {
        try {
            $user = $request->user();

            // Fetch active tickets assigned to this specific agent
            $assignedTickets = DB::table('tickets')
                ->leftJoin('categories', 'tickets.categoryid', '=', 'categories.id')
                ->leftJoin('users as reporters', 'tickets.createdby', '=', 'reporters.id')
                ->where('tickets.assignedto', $user->id)
                ->whereIn('tickets.statusid', [1, 2, 5]) // Open, In Progress, Pending
                ->select(
                    'tickets.*',
                    'categories.name as category_name',
                    'reporters.fullname as reporter_name'
                )
                ->orderBy('tickets.updatedat', 'desc')
                ->get();

            // Fetch the agent's recent activity logs
            $activityLogs = DB::table('activity_logs')
                ->where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get();

            return response()->json([
                'tickets' => $assignedTickets,
                'activity_logs' => $activityLogs
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Agent Dashboard Error: " . $e->getMessage());
            return response()->json(['error' => 'Failed to load agent dashboard data'], 500);
        }
    }

    // ==================== SUPERVISOR DASHBOARD DATA ====================
    public function supervisorDashboard()
{
    // Ensure user is authenticated
    if (!Auth::check()) {
        return response()->json(['message' => 'Unauthorized'], 401);
    }

    $user = Auth::user();

    // Get the category ID
    $catId = $user->managed_category_id ?? null;

    if (!$catId) {
        return response()->json(['tickets' => [], 'activity_logs' => []]);
    }

    // 1. Fetch tickets with a JOIN to get the agent's name
    $tickets = DB::table('tickets')
        ->leftJoin('users', 'tickets.assignedto', '=', 'users.id') // Join users table
        ->where('tickets.categoryid', $catId)
        ->select('tickets.*', 'users.fullname as agent_name') // Select the ticket data + the agent's name
        ->get();

    // 2. Fetch logs safely
    $ticketIds = $tickets->pluck('id')->toArray();

    $activityLogs = [];
    if (!empty($ticketIds)) {
        $activityLogs = DB::table('activitylogs')
            ->whereIn('entityid', $ticketIds)
            ->orderBy('createdat', 'desc')
            ->limit(10)
            ->get();
    }

    return response()->json([
        'tickets' => $tickets,
        'activity_logs' => $activityLogs
    ]);
}
}