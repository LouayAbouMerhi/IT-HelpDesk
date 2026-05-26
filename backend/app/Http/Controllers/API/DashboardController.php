<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function stats()
    {
        $open = 0;
        $inProgress = 0;
        $resolvedToday = 0;
        $activeAgents = 0;
        
        $ticketsError = null;
        $agentsError = null;

        // 1. Safely parse and calculate ticket metrics
        try {
            $tickets = DB::table('tickets')->get();
            $today = now()->startOfDay();

            foreach ($tickets as $ticket) {
                $ticketArray = (array)$ticket;
                
                // Case-insensitive search for StatusId
                $statusId = null;
                foreach ($ticketArray as $key => $val) {
                    if (strtolower($key) === 'statusid') {
                        $statusId = $val;
                        break;
                    }
                }

                // Case-insensitive search for CreatedAt
                $createdAt = null;
                foreach ($ticketArray as $key => $val) {
                    if (strtolower($key) === 'createdat') {
                        $createdAt = $val;
                        break;
                    }
                }

                // Case-insensitive search for UpdatedAt
                $updatedAt = null;
                foreach ($ticketArray as $key => $val) {
                    if (strtolower($key) === 'updatedat') {
                        $updatedAt = $val;
                        break;
                    }
                }

                if ($statusId == 1) $open++;
                if ($statusId == 2) $inProgress++;
                
                if ($statusId == 3) {
                    $dateToCheck = $updatedAt ?? $createdAt;
                    if ($dateToCheck) {
                        try {
                            if (Carbon::parse($dateToCheck)->greaterThanOrEqualTo($today)) {
                                $resolvedToday++;
                            }
                        } catch (\Exception $dateEx) {
                            // Safe fallback for date parsing
                        }
                    }
                }
            }
        } catch (\Exception $e) {
            $ticketsError = $e->getMessage();
        }

        // 2. Safely parse active agents
        try {
            $users = DB::table('users')->get();
            foreach ($users as $user) {
                $userArray = (array)$user;
                foreach ($userArray as $key => $val) {
                    if (strtolower($key) === 'roleid' && $val == 2) {
                        $activeAgents++;
                        break;
                    }
                }
            }
        } catch (\Exception $e) {
            $agentsError = $e->getMessage();
        }

        // Log issues to storage/logs/laravel.log if any occurred
        if ($ticketsError || $agentsError) {
            \Illuminate\Support\Facades\Log::warning("Dashboard Diagnostic - Tickets: {$ticketsError} | Agents: {$agentsError}");
        }

        // Always return a healthy 200 response to keep the frontend safe
        return response()->json([
            'openTickets'   => $open,
            'inProgress'    => $inProgress,
            'resolvedToday' => $resolvedToday,
            'activeAgents'  => $activeAgents,
            'diagnostic'    => [
                'ticketsError' => $ticketsError,
                'agentsError'  => $agentsError
            ]
        ]);
    }
}