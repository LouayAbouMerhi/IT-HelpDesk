<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;

class RoleAndPermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions
        $permissions = [
            'view tickets',
            'create tickets',
            'edit tickets',
            'delete tickets',
            'assign tickets',
            'resolve tickets',
            'manage users',
            'view reports',
            'manage categories'
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Create roles
        $adminRole = Role::firstOrCreate(['name' => 'Admin', 'guard_name' => 'web']);
        $agentRole = Role::firstOrCreate(['name' => 'Agent', 'guard_name' => 'web']);
        $managerRole = Role::firstOrCreate(['name' => 'Manager', 'guard_name' => 'web']);
        $employeeRole = Role::firstOrCreate(['name' => 'Employee', 'guard_name' => 'web']);

        // Assign permissions to roles
        $adminRole->syncPermissions(Permission::all());
        
        $agentRole->syncPermissions([
            'view tickets', 'edit tickets', 'assign tickets', 'resolve tickets'
        ]);
        
        $managerRole->syncPermissions([
            'view tickets', 'view reports'
        ]);
        
        $employeeRole->syncPermissions([
            'create tickets', 'view tickets', 'edit tickets'
        ]);

        // Create users
        $admin = User::firstOrCreate(
            ['email' => 'admin@helpdesk.com'],
            [
                'name' => 'Admin User',
                'password' => bcrypt('password123')
            ]
        );
        $admin->assignRole('Admin');

        $agent = User::firstOrCreate(
            ['email' => 'agent@helpdesk.com'],
            [
                'name' => 'Support Agent',
                'password' => bcrypt('password123')
            ]
        );
        $agent->assignRole('Agent');

        $manager = User::firstOrCreate(
            ['email' => 'manager@helpdesk.com'],
            [
                'name' => 'Manager User',
                'password' => bcrypt('password123')
            ]
        );
        $manager->assignRole('Manager');

        $employee = User::firstOrCreate(
            ['email' => 'employee@helpdesk.com'],
            [
                'name' => 'Employee User',
                'password' => bcrypt('password123')
            ]
        );
        $employee->assignRole('Employee');

        $this->command->info('✓ Roles and permissions seeded successfully!');
        $this->command->info('Test users created:');
        $this->command->info('  Admin: admin@helpdesk.com / password123');
        $this->command->info('  Agent: agent@helpdesk.com / password123');
        $this->command->info('  Manager: manager@helpdesk.com / password123');
        $this->command->info('  Employee: employee@helpdesk.com / password123');
    }
}