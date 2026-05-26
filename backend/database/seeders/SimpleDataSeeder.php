<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Ticket;
use App\Models\Category;
use App\Models\Priority;
use App\Models\Status;
use Illuminate\Support\Facades\Hash;

class SimpleDataSeeder extends Seeder
{
    public function run(): void
    {
        // Clear existing data (optional - comment out if you want to keep existing)
        // User::query()->delete();
        // Ticket::query()->delete();
        
        // ========== CREATE CATEGORIES ==========
        $categories = [
            ['name' => 'Hardware', 'description' => 'Computer, printer, monitor issues'],
            ['name' => 'Software', 'description' => 'OS, applications, software bugs'],
            ['name' => 'Network', 'description' => 'Connectivity, VPN, Wi-Fi issues'],
            ['name' => 'Email', 'description' => 'Outlook, email delivery problems'],
            ['name' => 'Access Request', 'description' => 'Permissions, passwords, account access'],
        ];

        foreach ($categories as $cat) {
            Category::updateOrCreate(['name' => $cat['name']], $cat);
        }
        $this->command->info('✓ Categories seeded');

        // ========== CREATE PRIORITIES ==========
        $priorities = [
            ['name' => 'Low', 'level' => 1, 'color' => '#10b981', 'sla_hours' => 48],
            ['name' => 'Medium', 'level' => 2, 'color' => '#f59e0b', 'sla_hours' => 24],
            ['name' => 'High', 'level' => 3, 'color' => '#f97316', 'sla_hours' => 8],
            ['name' => 'Critical', 'level' => 4, 'color' => '#ef4444', 'sla_hours' => 4],
        ];

        foreach ($priorities as $priority) {
            Priority::updateOrCreate(['name' => $priority['name']], $priority);
        }
        $this->command->info('✓ Priorities seeded');

        // ========== CREATE STATUSES ==========
        $statuses = [
            ['name' => 'Open', 'color' => '#8b5cf6', 'order' => 1],
            ['name' => 'In Progress', 'color' => '#f59e0b', 'order' => 2],
            ['name' => 'Resolved', 'color' => '#10b981', 'order' => 3],
            ['name' => 'Closed', 'color' => '#6b7280', 'order' => 4],
        ];

        foreach ($statuses as $status) {
            Status::updateOrCreate(['name' => $status['name']], $status);
        }
        $this->command->info('✓ Statuses seeded');

        // ========== CREATE USERS ==========
        $users = [
            [
                'name' => 'Admin User',
                'email' => 'admin@helpdesk.com',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'department' => 'IT Management',
                'is_active' => true,
            ],
            [
                'name' => 'Sarah Johnson',
                'email' => 'agent1@helpdesk.com',
                'password' => Hash::make('password123'),
                'role' => 'agent',
                'department' => 'Technical Support',
                'is_active' => true,
            ],
            [
                'name' => 'Mike Chen',
                'email' => 'agent2@helpdesk.com',
                'password' => Hash::make('password123'),
                'role' => 'agent',
                'department' => 'Network Operations',
                'is_active' => true,
            ],
            [
                'name' => 'John Doe',
                'email' => 'employee1@company.com',
                'password' => Hash::make('password123'),
                'role' => 'employee',
                'department' => 'Sales',
                'is_active' => true,
            ],
            [
                'name' => 'Jane Smith',
                'email' => 'employee2@company.com',
                'password' => Hash::make('password123'),
                'role' => 'employee',
                'department' => 'Marketing',
                'is_active' => true,
            ],
            [
                'name' => 'Tamer',
                'email' => 'tamer@gmail.com',
                'password' => Hash::make('Test@1234'),
                'role' => 'employee',
                'department' => 'IT',
                'is_active' => true,
            ],
        ];

        foreach ($users as $userData) {
            User::updateOrCreate(['email' => $userData['email']], $userData);
        }
        $this->command->info('✓ Users seeded (' . count($users) . ' users)');

        // ========== CREATE TICKETS ==========
        $tickets = [
            [
                'ticket_number' => 'TKT-' . strtoupper(uniqid()),
                'title' => 'Cannot connect to VPN',
                'description' => 'Unable to connect to company VPN from home. Getting authentication error.',
                'category_id' => 3,
                'priority_id' => 3,
                'status_id' => 2,
                'created_by' => 4,
                'assigned_to' => 2,
            ],
            [
                'ticket_number' => 'TKT-' . strtoupper(uniqid()),
                'title' => 'Printer not working',
                'description' => 'The office printer is showing error code 0x000001.',
                'category_id' => 1,
                'priority_id' => 2,
                'status_id' => 1,
                'created_by' => 5,
                'assigned_to' => null,
            ],
            [
                'ticket_number' => 'TKT-' . strtoupper(uniqid()),
                'title' => 'Email delivery delayed',
                'description' => 'Emails are taking 30+ minutes to reach recipients.',
                'category_id' => 4,
                'priority_id' => 3,
                'status_id' => 2,
                'created_by' => 4,
                'assigned_to' => 2,
            ],
            [
                'ticket_number' => 'TKT-' . strtoupper(uniqid()),
                'title' => 'Need access to shared drive',
                'description' => 'Requesting access to the Finance shared drive.',
                'category_id' => 5,
                'priority_id' => 2,
                'status_id' => 1,
                'created_by' => 6,
                'assigned_to' => null,
            ],
            [
                'ticket_number' => 'TKT-' . strtoupper(uniqid()),
                'title' => 'Server down - Critical',
                'description' => 'Main application server is offline. Users cannot access CRM.',
                'category_id' => 2,
                'priority_id' => 4,
                'status_id' => 2,
                'created_by' => 4,
                'assigned_to' => 3,
            ],
        ];

        foreach ($tickets as $ticketData) {
            Ticket::create($ticketData);
        }
        $this->command->info('✓ Tickets seeded (' . count($tickets) . ' tickets)');

        $this->command->newLine();
        $this->command->info('====================================');
        $this->command->info('✅ DATABASE SEEDING COMPLETED!');
        $this->command->info('====================================');
        $this->command->newLine();
        $this->command->info('📋 LOGIN CREDENTIALS:');
        $this->command->info('   Admin:    admin@helpdesk.com / password123');
        $this->command->info('   Agent:    agent1@helpdesk.com / password123');
        $this->command->info('   Employee: employee1@company.com / password123');
        $this->command->info('   Tamer:    tamer@gmail.com / Test@1234');
    }
}