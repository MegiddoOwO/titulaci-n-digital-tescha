<?php

namespace App\Providers;

use App\Models\Documento;
use App\Models\Tramite;
use App\Policies\DocumentoPolicy;
use App\Policies\TramitePolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(Tramite::class, TramitePolicy::class);
        Gate::policy(Documento::class, DocumentoPolicy::class);

        Vite::prefetch(concurrency: 3);
    }
}
