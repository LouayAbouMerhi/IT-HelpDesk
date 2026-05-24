<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class DefaultDataSeeder extends Seeder
{
    public function run(): void
    {
        // Insert categories
        DB::table('categories')->insert([
            ['name' => 'Hardware', 'color' => '#FF5733', 'created_at' => Carbon::now(), 'updated_at' => Carbon::now()],
            ['name' => 'Software', 'color' => '#33FF57', 'created_at' => Carbon::now(), 'updated_at' => Carbon::now()],
            ['name' => 'Network', 'color' => '#3357FF', 'created_at' => Carbon::now(), 'updated_at' => Carbon::now()],
            ['name' => 'Email', 'color' => '#FF33F5', 'created_at' => Carbon::now(), 'updated_at' => Carbon::now()],
            ['name' => 'Access Request', 'color' => '#F5FF33', 'created_at' => Carbon::now(), 'updated_at' => Carbon::now()],
            ['name' => 'Other', 'color' => '#A1A1A1', 'created_at' => Carbon::now(), 'updated_at' => Carbon::now()],
        ]);

        // Insert priorities
        DB::table('priorities')->insert([
            ['name' => 'Low', 'level' => 1, 'color' => '#00FF00', 'created_at' => Carbon::now(), 'updated_at' => Carbon::now()],
            ['name' => 'Medium', 'level' => 2, 'color' => '#FFA500', 'created_at' => Carbon::now(), 'updated_at' => Carbon::now()],
            ['name' => 'High', 'level' => 3, 'color' => '#FF0000', 'created_at' => Carbon::now(), 'updated_at' => Carbon::now()],
            ['name' => 'Critical', 'level' => 4, 'color' => '#8B0000', 'created_at' => Carbon::now(), 'updated_at' => Carbon::now()],
        ]);

        // Insert statuses
        DB::table('statuses')->insert([
            ['name' => 'Open', 'color' => '#3498db', 'created_at' => Carbon::now(), 'updated_at' => Carbon::now()],
            ['name' => 'In Progress', 'color' => '#f39c12', 'created_at' => Carbon::now(), 'updated_at' => Carbon::now()],
            ['name' => 'Pending', 'color' => '#e67e22', 'created_at' => Carbon::now(), 'updated_at' => Carbon::now()],
            ['name' => 'Resolved', 'color' => '#27ae60', 'created_at' => Carbon::now(), 'updated_at' => Carbon::now()],
            ['name' => 'Closed', 'color' => '#95a5a6', 'created_at' => Carbon::now(), 'updated_at' => Carbon::now()],
        ]);

        $this->command->info('✓ Default data (categories, priorities, statuses) seeded successfully!');
    }
}