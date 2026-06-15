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
        'roleid',
        'fullname',
        'email',
        'passwordhash',
        'phone',
        'department',
        'timezone',
        'is_active',
        'last_login_at',
        'createdat',
        'updatedat','supervisor_id', 'managed_category_id',
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
            'roleid' => $this->roleid,
        ];
    }

    // ==================== RELATIONSHIPS ====================

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'roleid', 'id');
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

    // In app/Models/User.php, add these relationships:

public function supervisor(): BelongsTo
{
    return $this->belongsTo(User::class, 'supervisor_id', 'id');
}

public function subordinates(): HasMany
{
    return $this->hasMany(User::class, 'supervisor_id', 'id');
}

// Add accessor for fullname (since database uses full_name)


// Add accessor for role (converts role_id to role name)
public function getRoleAttribute()
{
    $roles = [
        1 => 'Admin',
        2 => 'Agent',
        3 => 'User',
        4 => 'Supervisor'
    ];
    return $roles[$this->role_id] ?? 'User';
}
}