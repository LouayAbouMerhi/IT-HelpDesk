<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Attachment extends Model
{
    use HasFactory;

    protected \ = ['ticket_id', 'user_id', 'filename', 'original_filename', 'file_path', 'file_size', 'mime_type'];

    public function ticket()
    {
        return \->belongsTo(Ticket::class);
    }

    public function user()
    {
        return \->belongsTo(User::class);
    }
}
