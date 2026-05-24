<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Comment extends Model
{
    use HasFactory;

    protected \ = 'ticket_comments';
    protected \ = ['ticket_id', 'user_id', 'comment', 'is_internal'];

    public function ticket()
    {
        return \->belongsTo(Ticket::class);
    }

    public function user()
    {
        return \->belongsTo(User::class);
    }
}
