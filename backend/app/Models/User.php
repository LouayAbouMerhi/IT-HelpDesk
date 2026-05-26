<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject; // <-- Added JWT Import

class User extends Authenticatable implements JWTSubject // <-- Implemented JWT Contract
{
    use Notifiable; // <-- Removed Sanctum's HasApiTokens trait

    protected $table = 'users';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'role_id',
        'full_name',
        'email',
        'password',
        'phone',
        'department',
        'timezone',
        'is_active',
        'last_login_at',
        'created_at',
        'updated_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'last_login_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // ==================== JWT REQUIRED METHODS ====================
    
    public function getJWTIdentifier()
    {
        return $this->getKey(); // Returns user ID
    }

    public function getJWTCustomClaims()
    {
        // Automatically embeds the user role inside the token payload
        return [
            'role_id' => $this->role_id,
        ];
    }

    // ==================== RELATIONSHIPS ====================

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id', 'id');
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class, 'user_id', 'id');
    }

    public function assignedTickets(): HasMany
    {
        return $this->hasMany(Ticket::class, 'agent_id', 'id');
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class, 'user_id', 'id');
    }
}