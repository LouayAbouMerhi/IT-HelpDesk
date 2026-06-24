<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\DashboardController;
use App\Http\Controllers\API\TicketController;
use App\Http\Controllers\API\UserController;
use App\Http\Controllers\API\NotificationController;
use App\Http\Controllers\API\AnalyticsController;
use App\Http\Controllers\API\KnowledgeBaseController;

// ==================== PUBLIC ROUTES ====================
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);

// ==================== PROTECTED ROUTES (JWT AUTH) ====================
Route::middleware('auth:api')->group(function () {
    
    // --- Auth Endpoints ---
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'getUser']);
    Route::post('/profile/update', [AuthController::class, 'updateProfile']);
    Route::post('/profile/change-password', [AuthController::class, 'changePassword']);
    Route::get('/activity-logs', [AuthController::class, 'getActivityLogs']);
    
    // --- Dashboard ---
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    
    // --- Ticket CRUD Endpoints ---
    Route::get('/tickets', [TicketController::class, 'index']);
    Route::get('/tickets/recent', [TicketController::class, 'recent']);
    Route::get('/tickets/lookups', [TicketController::class, 'lookups']);
    Route::post('/tickets', [TicketController::class, 'store']);
    Route::get('/tickets/{id}', [TicketController::class, 'show']); 
    Route::put('/tickets/{id}', [TicketController::class, 'update']);
    Route::delete('/tickets/{id}', [TicketController::class, 'destroy']);
    Route::get('/tickets/{id}/history', [TicketController::class, 'history']);
    Route::get('/my-tickets', [App\Http\Controllers\API\TicketController::class, 'myTickets']);
    Route::get('/company-tickets', [App\Http\Controllers\API\TicketController::class, 'companyTickets']);
    Route::get('/agent/dashboard', [App\Http\Controllers\API\TicketController::class, 'agentDashboard']);
    Route::get('/supervisor/dashboard', [App\Http\Controllers\API\TicketController::class, 'supervisorDashboard']);

    // In routes/api.php
    Route::get('/supervisor/agents', [App\Http\Controllers\API\UserController::class, 'getSupervisorAgents']);
    // --- WORKFLOW ROUTES ---
    Route::post('/tickets/{id}/assign', [TicketController::class, 'assignTicket']);
    Route::post('/tickets/{id}/escalate', [TicketController::class, 'escalate']);
    Route::post('/tickets/{id}/notes', [TicketController::class, 'addInternalNote']);
    Route::get('/tickets/{id}/notes', [TicketController::class, 'getInternalNotes']);

    // --- COMMUNICATION HUB ---
    Route::get('/tickets/{id}/comments', [TicketController::class, 'getComments']);
    Route::post('/tickets/{id}/comments', [TicketController::class, 'addComment']);

    // --- NOTIFICATIONS ---
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);

    // --- USER / PROFILE MANAGEMENT ROUTES ---
    Route::get('/agents', [UserController::class, 'getAgents']);
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);
    Route::get('/users/{id}/tickets', [UserController::class, 'userTickets']);
    Route::put('/profile/{id}', [UserController::class, 'updateProfile']);

    // --- ADMIN SECURITY CONTROLS ---
    
    Route::put('/users/{id}/toggle-active', [AuthController::class, 'toggleActive']);
    Route::post('/users/{id}/unlock', [AuthController::class, 'unlockAccount']);
    Route::get('/supervisor/agents', [UserController::class, 'getSupervisorAgents']);

    Route::get('/analytics', [AnalyticsController::class, 'getDashboardAnalytics']);
    Route::get('/knowledge-base', [KnowledgeBaseController::class, 'index']);
    Route::post('/knowledge-base/publish', [KnowledgeBaseController::class, 'publish']);

    
});