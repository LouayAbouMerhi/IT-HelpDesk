<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats()
    {
        return response()->json([
            'openTickets'   => Ticket::where('status_id', 1)->count(),
            'inProgress'    => Ticket::where('status_id', 2)->count(),
            'resolvedToday' => Ticket::where('status_id', 3)->count(),
            'activeAgents'  => User::count(),
        ]);
    }
}