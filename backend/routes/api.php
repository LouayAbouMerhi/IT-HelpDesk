<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\DashboardController;
use App\Http\Controllers\API\TicketController;

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
    
    // --- Dashboard & Analytical Pipeline Endpoints ---
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('/dashboard-metrics', [TicketController::class, 'getMetrics']);
    
    
    
    // --- Ticket CRUD Endpoints ---
    Route::get('/tickets', [TicketController::class, 'index']);
    Route::get('/tickets/recent', [TicketController::class, 'recent']);
    Route::get('/tickets/lookups', [TicketController::class, 'lookups']);
    Route::post('/tickets', [TicketController::class, 'store']);
    Route::get('/activity-logs', [App\Http\Controllers\API\AuthController::class, 'getActivityLogs']);
    
});