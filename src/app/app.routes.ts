import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LoginComponent } from './pages/login/login.component';

export const routes: Routes = [
  {
    path: 'dashboard',
    component: DashboardComponent
  },
  {
    path: '',
    component: LoginComponent
  },
  {
  path: 'onboarding',
  loadComponent: () =>
    import(
      './pages/onboarding/onboarding.component'
    ).then(
      m =>
        m.OnboardingComponent
    )
    }
];