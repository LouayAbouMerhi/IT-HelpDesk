<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    use HasFactory;

    protected \ = 'activity_logs';
    protected \ = ['user_id', 'action', 'model_type', 'model_id', 'properties', 'ip_address', 'user_agent'];

    protected \ = [
        'properties' => 'array',
    ];

    public function user()
    {
        return \->belongsTo(User::class);
    }
}
