<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    protected \ = ['user_id', 'ticket_id', 'title', 'message', 'is_read', 'type'];

    protected \ = [
        'is_read' => 'boolean',
    ];

    public function user()
    {
        return \->belongsTo(User::class);
    }

    public function ticket()
    {
        return \->belongsTo(Ticket::class);
    }
}
