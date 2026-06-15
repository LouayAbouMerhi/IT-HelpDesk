<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class TicketAlertMail extends Mailable
{
    use Queueable, SerializesModels;

    public $ticket;
    public $alertTitle;
    public $alertMessage;
    public $frontendUrl;

    public function __construct($ticket, $alertTitle, $alertMessage)
    {
        $this->ticket = $ticket;
        $this->alertTitle = $alertTitle;
        $this->alertMessage = $alertMessage;
        
        // Grabs your React URL (e.g., http://localhost:5173) from the .env file
        $this->frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
    }

    public function build()
    {
        $ticketRef = $this->ticket->referenceno ?? 'TKT-00' . $this->ticket->id;
        
        return $this->subject("Update on Ticket: {$ticketRef}")
                    ->view('emails.ticket-alert');
    }
}