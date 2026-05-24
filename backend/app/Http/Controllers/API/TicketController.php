<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Ticket;

class TicketController extends Controller
{
    public function recent()
    {
        // Return raw rows without attempting to load any nested relationships
        $tickets = Ticket::orderBy('id', 'asc')->get();
        
        return response()->json($tickets);
    }
    
    public function index()
    {
        $tickets = Ticket::with(['priority', 'status'])
            ->orderBy('created_at', 'desc')
            ->paginate(10);
        
        return response()->json($tickets);
    }
    
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'category_id' => 'required|exists:categories,id',
            'priority_id' => 'required|exists:priorities,id',
        ]);
        
        $ticket = Ticket::create([
            'ticket_number' => 'TKT-' . strtoupper(uniqid()),
            'title' => $request->title,
            'description' => $request->description,
            'category_id' => $request->category_id,
            'priority_id' => $request->priority_id,
            'status_id' => 1,
            'created_by' => auth()->id(),
        ]);
        
        return response()->json($ticket, 201);
    }
}