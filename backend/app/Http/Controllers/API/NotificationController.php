<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    // Fetch notifications for the current logged-in user
    public function index(Request $request) {
        $notifications = DB::table('notifications')
            ->where('userid', $request->user()->id) // Using 'userid' to match your table
            ->orderBy('createdat', 'desc')
            ->get();
            
        return response()->json($notifications);
    }

    // Mark a specific notification as read
    public function markAsRead($id) {
        DB::table('notifications')
            ->where('id', $id)
            ->update(['isread' => true, 'readat' => now()]);
            
        return response()->json(['message' => 'Notification marked as read']);
    }
}