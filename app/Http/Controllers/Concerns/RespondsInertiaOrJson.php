<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Express endpoints answer JSON; the same endpoints also feed Inertia pages. A plain JSON
 * request (no X-Inertia header) gets the Express payload, everything else a page/redirect.
 */
trait RespondsInertiaOrJson
{
    protected function wantsPlainJson(Request $request): bool
    {
        return $request->expectsJson() && ! $request->header('X-Inertia');
    }

    /**
     * @param  array<string, mixed>  $extra  extra JSON keys (the redirect only carries the flash message)
     */
    protected function mutated(Request $request, string $message, array $extra = []): JsonResponse|RedirectResponse
    {
        if ($this->wantsPlainJson($request)) {
            return response()->json(['message' => $message] + $extra);
        }

        return back()->with('success', $message);
    }
}
