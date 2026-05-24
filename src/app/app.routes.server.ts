import { RenderMode, ServerRoute } from '@angular/ssr';
export const serverRoutes: ServerRoute[] = [
  {
    path: 'pin-entry',
    renderMode: RenderMode.Client
  },
  {
    path: 'properties/:id',
    renderMode: RenderMode.Client
  },  
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];