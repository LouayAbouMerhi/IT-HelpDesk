<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class KnowledgeBaseController extends Controller
{
    public function index()
    {
        $articles = DB::table('kb_articles')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($articles);
    }

    public function publish(Request $request)
    {
        $request->validate([
            'ticket_id' => 'required',
            'title' => 'required|string',
            'content' => 'required|string',
            'category' => 'required|string',
            'author_name' => 'required|string'
        ]);

        DB::table('kb_articles')->insert([
            'ticket_id' => $request->ticket_id,
            'title' => $request->title,
            'content' => $request->content,
            'category' => $request->category,
            'author_name' => $request->author_name,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json(['message' => 'Article successfully published to Knowledge Base!']);
    }
}