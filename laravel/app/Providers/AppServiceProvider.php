<?php

namespace App\Providers;

use App\Contracts\DictamenPdfRenderer;
use App\Models\Documento;
use App\Models\Tramite;
use App\Policies\DocumentoPolicy;
use App\Policies\TramitePolicy;
use App\Services\NotImplementedDictamenPdfRenderer;
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
        $this->app->bind(DictamenPdfRenderer::class, NotImplementedDictamenPdfRenderer::class);
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
