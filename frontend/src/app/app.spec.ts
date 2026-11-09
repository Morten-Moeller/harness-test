import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('renders without the Angular placeholder', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain('Hello');
    expect(compiled.querySelector('router-outlet')).not.toBeNull();
  });

  it('shows the shopping list on the start route', async () => {
    const harness = await RouterTestingHarness.create('/');
    const heading = harness.routeNativeElement?.querySelector('h1');
    expect(heading?.textContent).toContain('Einkaufsliste');
  });
});
