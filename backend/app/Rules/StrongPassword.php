<?php
// app/Rules/StrongPassword.php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class StrongPassword implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // Minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number, 1 special character
        if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/', $value)) {
            $fail('Password must be at least 8 characters and include uppercase, lowercase, number, and special character.');
        }
    }
}