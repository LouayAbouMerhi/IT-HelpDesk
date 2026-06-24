<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    /**
     * Returns the full analytics + reporting dataset, computed from the
     * live database. Column names follow the real schema (no underscores):
     * statusid, priorityid, categoryid, assignedto, createdby, createdat,
     * updatedat, referenceno. There is no dedicated resolved-at column, so
     * resolution time is measured as (updatedat - createdat) for tickets
     * that have reached Resolved (3) or Closed (4) — matching how the rest
     * of the app treats resolution timing.
     */
    public function getDashboardAnalytics(Request $request)
    {
        try {
            // ---- Optional date-range filter (?from=YYYY-MM-DD&to=YYYY-MM-DD) ----
            $from = $request->query('from');
            $to   = $request->query('to');

            $base = DB::table('tickets');
            if ($from) {
                $base->whereDate('createdat', '>=', $from);
            }
            if ($to) {
                $base->whereDate('createdat', '<=', $to);
            }

            // Pull the working set once, compute everything in PHP for
            // maximum portability across DB engines (SQLite/MySQL).
            $tickets = $base->get();

            // ---- Lookup maps for human-readable names ----
            $statuses   = DB::table('statuses')->pluck('name', 'id');
            $priorities = DB::table('priorities')->pluck('name', 'id');
            $categories = DB::table('categories')->pluck('name', 'id');
            $users      = DB::table('users')->get()->keyBy('id');

            // ---- 1. Headline metrics ----
            $total      = $tickets->count();
            $open       = $tickets->where('statusid', 1)->count();
            $inProgress = $tickets->where('statusid', 2)->count();
            $resolved   = $tickets->where('statusid', 3)->count();
            $closed     = $tickets->where('statusid', 4)->count();
            $pending    = $tickets->where('statusid', 5)->count();
            $unassigned = $tickets->filter(fn ($t) => empty($t->assignedto))->count();

            $resolveRate = $total > 0
                ? round((($resolved + $closed) / $total) * 100)
                : 0;

            // ---- 2. Average resolution time (hours) ----
            $resolutionHours = [];
            foreach ($tickets as $t) {
                if (in_array((int) $t->statusid, [3, 4], true) && !empty($t->createdat) && !empty($t->updatedat)) {
                    try {
                        $h = Carbon::parse($t->createdat)->floatDiffInHours(Carbon::parse($t->updatedat));
                        if ($h >= 0) {
                            $resolutionHours[] = $h;
                        }
                    } catch (\Exception $e) {
                        // ignore unparseable dates
                    }
                }
            }
            $avgResolutionHours = count($resolutionHours) > 0
                ? round(array_sum($resolutionHours) / count($resolutionHours), 1)
                : 0;

            // ---- 3. Rolling 14-day timeline (created vs resolved) ----
            $timeline = [];
            for ($i = 13; $i >= 0; $i--) {
                $day = Carbon::now()->subDays($i);
                $key = $day->toDateString();

                $createdCount = $tickets->filter(function ($t) use ($key) {
                    return !empty($t->createdat)
                        && Carbon::parse($t->createdat)->toDateString() === $key;
                })->count();

                $resolvedCount = $tickets->filter(function ($t) use ($key) {
                    return in_array((int) $t->statusid, [3, 4], true)
                        && !empty($t->updatedat)
                        && Carbon::parse($t->updatedat)->toDateString() === $key;
                })->count();

                $timeline[] = [
                    'date'     => $day->format('M d'),
                    'count'    => $createdCount,
                    'resolved' => $resolvedCount,
                ];
            }

            // ---- 4. Status breakdown (donut) ----
            $statusColors = [
                'Open' => '#0ea5e9', 'In Progress' => '#f59e0b',
                'Resolved' => '#10b981', 'Closed' => '#64748b', 'Pending' => '#a855f7',
            ];
            $breakdown = [
                ['name' => 'Open',        'value' => $open,       'color' => '#0ea5e9'],
                ['name' => 'In Progress', 'value' => $inProgress, 'color' => '#f59e0b'],
                ['name' => 'Resolved',    'value' => $resolved,   'color' => '#10b981'],
                ['name' => 'Closed',      'value' => $closed,     'color' => '#64748b'],
            ];
            if ($pending > 0) {
                $breakdown[] = ['name' => 'Pending', 'value' => $pending, 'color' => '#a855f7'];
            }

            // ---- 5. Priority breakdown ----
            $priorityColors = [
                'Low' => '#38bdf8', 'Medium' => '#0ea5e9',
                'High' => '#f59e0b', 'Critical' => '#ef4444',
            ];
            $priorityBreakdown = [];
            foreach ($priorities as $pid => $pname) {
                $cnt = $tickets->where('priorityid', $pid)->count();
                $priorityBreakdown[] = [
                    'name'  => $pname,
                    'value' => $cnt,
                    'color' => $priorityColors[$pname] ?? '#0284c7',
                ];
            }

            // ---- 6. Category breakdown ----
            $palette = ['#0284c7', '#0ea5e9', '#38bdf8', '#7dd3fc', '#0369a1', '#075985', '#22d3ee', '#06b6d4'];
            $categoryBreakdown = [];
            $ci = 0;
            foreach ($categories as $cid => $cname) {
                $cnt = $tickets->where('categoryid', $cid)->count();
                if ($cnt > 0) {
                    $categoryBreakdown[] = [
                        'name'  => $cname,
                        'value' => $cnt,
                        'color' => $palette[$ci % count($palette)],
                    ];
                    $ci++;
                }
            }

            // ---- 7. Agent performance ----
            $agentPerformance = [];
            foreach ($users as $u) {
                if ((int) ($u->roleid ?? 0) !== 2) {
                    continue; // agents only
                }
                $assignedTickets = $tickets->where('assignedto', $u->id);
                $assigned = $assignedTickets->count();
                if ($assigned === 0) {
                    continue;
                }
                $resolvedSet = $assignedTickets->filter(
                    fn ($t) => in_array((int) $t->statusid, [3, 4], true)
                );
                $agentHours = [];
                foreach ($resolvedSet as $t) {
                    if (!empty($t->createdat) && !empty($t->updatedat)) {
                        try {
                            $agentHours[] = Carbon::parse($t->createdat)
                                ->floatDiffInHours(Carbon::parse($t->updatedat));
                        } catch (\Exception $e) {
                        }
                    }
                }
                $agentPerformance[] = [
                    'agent'    => $u->fullname ?? ($u->name ?? ('User #' . $u->id)),
                    'assigned' => $assigned,
                    'resolved' => $resolvedSet->count(),
                    'avgHours' => count($agentHours) > 0
                        ? round(array_sum($agentHours) / count($agentHours), 1)
                        : 0,
                ];
            }
            // sort by resolved desc
            usort($agentPerformance, fn ($a, $b) => $b['resolved'] <=> $a['resolved']);

            // ---- 8. Ticket dataset for report/export (latest 500) ----
            $rows = $tickets->sortByDesc('id')->take(500)->map(function ($t) use ($statuses, $priorities, $categories, $users) {
                $creator = isset($users[$t->createdby]) ? ($users[$t->createdby]->fullname ?? null) : null;
                $agent   = (!empty($t->assignedto) && isset($users[$t->assignedto]))
                    ? ($users[$t->assignedto]->fullname ?? null) : null;
                return [
                    'reference' => $t->referenceno ?? ('#' . $t->id),
                    'title'     => $t->title ?? '',
                    'status'    => $statuses[$t->statusid] ?? 'Unknown',
                    'priority'  => $priorities[$t->priorityid] ?? 'Unknown',
                    'category'  => $categories[$t->categoryid] ?? 'Uncategorized',
                    'creator'   => $creator ?? 'Unknown',
                    'agent'     => $agent ?? 'Unassigned',
                    'created'   => $t->createdat ?? null,
                    'updated'   => $t->updatedat ?? null,
                ];
            })->values();

            return response()->json([
                'generatedAt' => Carbon::now()->format('Y-m-d H:i:s'),
                'range'       => ['from' => $from, 'to' => $to],
                'stats' => [
                    'total'              => $total,
                    'open'               => $open,
                    'inProgress'         => $inProgress,
                    'resolved'           => $resolved,
                    'closed'             => $closed,
                    'pending'            => $pending,
                    'resolveRate'        => $resolveRate,
                    'unassigned'         => $unassigned,
                    'avgResolutionHours' => $avgResolutionHours,
                ],
                'timeline'          => $timeline,
                'breakdown'         => $breakdown,
                'priorityBreakdown' => $priorityBreakdown,
                'categoryBreakdown' => $categoryBreakdown,
                'agentPerformance'  => $agentPerformance,
                'tickets'           => $rows,
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Analytics error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to build analytics.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }
}
