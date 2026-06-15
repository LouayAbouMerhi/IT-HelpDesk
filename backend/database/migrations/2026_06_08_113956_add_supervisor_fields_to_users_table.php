<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
{
    Schema::table('users', function (Blueprint $table) {
        if (!Schema::hasColumn('users', 'supervisor_id')) {
            $table->unsignedBigInteger('supervisor_id')->nullable()->after('role_id');
        }
        if (!Schema::hasColumn('users', 'managed_category_id')) {
            $table->unsignedInteger('managed_category_id')->nullable()->after('supervisor_id');
        }
        if (!Schema::hasColumn('users', 'is_locked')) {
            $table->boolean('is_locked')->default(false)->after('is_active');
        }
        
        // Add foreign key constraint if it doesn't exist
        if (!Schema::hasColumn('users', 'supervisor_id')) {
            $table->foreign('supervisor_id')->references('id')->on('users')->onDelete('set null');
        }
    });
}

public function down()
{
    Schema::table('users', function (Blueprint $table) {
        $table->dropForeign(['supervisor_id']);
        $table->dropColumn(['supervisor_id', 'managed_category_id', 'is_locked']);
    });
}
};
