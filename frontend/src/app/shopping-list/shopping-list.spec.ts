import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { Item, ShoppingList } from '../shared/api';
import { ShoppingListPage } from './shopping-list';

const LIST_URL = '/api/shopping-list';
const ITEMS_URL = `${LIST_URL}/items`;

function item(overrides: Partial<Item> = {}): Item {
  return { id: 'id-1', name: 'Milch', quantity: '1 l', done: false, ...overrides };
}

function list(items: Item[] = []): ShoppingList {
  return { name: 'Einkaufsliste', items };
}

describe('ShoppingListPage', () => {
  let fixture: ComponentFixture<ShoppingListPage>;
  let http: HttpTestingController;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShoppingListPage],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ShoppingListPage);
    element = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  function query<T extends Element>(selector: string): T {
    const found = element.querySelector<T>(selector);
    if (!found) {
      throw new Error(`Element not found: ${selector}`);
    }
    return found;
  }

  function text(selector: string): string {
    return element.querySelector(selector)?.textContent?.trim() ?? '';
  }

  function rows(): HTMLElement[] {
    return Array.from(element.querySelectorAll<HTMLElement>('li.item'));
  }

  async function loadList(items: Item[]): Promise<void> {
    http.expectOne(LIST_URL).flush(list(items));
    await fixture.whenStable();
  }

  async function type(id: string, value: string): Promise<void> {
    const input = query<HTMLInputElement>(`#${id}`);
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  async function submit(): Promise<void> {
    query<HTMLFormElement>('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  it('shows the heading and the items of the list', async () => {
    await loadList([item(), item({ id: 'id-2', name: 'Brot', quantity: undefined })]);

    expect(text('h1')).toBe('Einkaufsliste');
    expect(rows().length).toBe(2);
    expect(rows()[0].textContent).toContain('Milch');
    expect(rows()[0].textContent).toContain('1 l');
    expect(rows()[1].textContent).toContain('Brot');
  });

  it('shows a hint when the list is empty', async () => {
    await loadList([]);

    expect(text('.empty')).toBe('Noch keine Artikel');
    expect(rows().length).toBe(0);
  });

  it('labels the form fields and the submit button', async () => {
    await loadList([]);

    expect(text('label[for="item-name"]')).toBe('Artikel');
    expect(text('label[for="item-quantity"]')).toBe('Menge');
    expect(text('button[type="submit"]')).toBe('Hinzufügen');
  });

  it('adds an item at the end, clears the form and focuses the name field', async () => {
    await loadList([item()]);
    await type('item-name', 'Brot');
    await type('item-quantity', '2');
    await submit();

    const request = http.expectOne(ITEMS_URL);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ name: 'Brot', quantity: '2' });
    request.flush(item({ id: 'id-2', name: 'Brot', quantity: '2' }), {
      status: 201,
      statusText: 'Created',
    });
    await fixture.whenStable();

    expect(rows().length).toBe(2);
    expect(rows()[1].textContent).toContain('Brot');
    expect(query<HTMLInputElement>('#item-name').value).toBe('');
    expect(query<HTMLInputElement>('#item-quantity').value).toBe('');
    expect(document.activeElement).toBe(query('#item-name'));
  });

  it('sends no quantity when the field is empty', async () => {
    await loadList([]);
    await type('item-name', ' Salz ');
    await submit();

    const request = http.expectOne(ITEMS_URL);
    expect(request.request.body).toEqual({ name: 'Salz' });
    request.flush(item({ id: 'id-3', name: 'Salz', quantity: undefined }));
  });

  it('rejects an empty name with a message and without a request', async () => {
    await loadList([]);
    await type('item-name', '   ');
    await submit();

    http.expectNone(ITEMS_URL);
    expect(text('.message-validation')).toBe('Bitte einen Namen eingeben');
    expect(rows().length).toBe(0);
  });

  it('marks an item as done and strikes it through', async () => {
    await loadList([item()]);

    query<HTMLInputElement>('input[type="checkbox"]').click();
    await fixture.whenStable();

    const request = http.expectOne(`${ITEMS_URL}/id-1`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ done: true });
    request.flush(item({ done: true }));
    await fixture.whenStable();

    expect(rows()[0].classList.contains('item-done')).toBe(true);
    expect(query<HTMLInputElement>('input[type="checkbox"]').checked).toBe(true);
    expect(rows().length).toBe(1);
  });

  it('takes done back', async () => {
    await loadList([item({ done: true })]);

    query<HTMLInputElement>('input[type="checkbox"]').click();
    await fixture.whenStable();

    const request = http.expectOne(`${ITEMS_URL}/id-1`);
    expect(request.request.body).toEqual({ done: false });
    request.flush(item({ done: false }));
    await fixture.whenStable();

    expect(rows()[0].classList.contains('item-done')).toBe(false);
  });

  it('deletes an item', async () => {
    await loadList([item()]);

    query<HTMLButtonElement>('li.item button').click();
    await fixture.whenStable();

    const request = http.expectOne(`${ITEMS_URL}/id-1`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();

    expect(rows().length).toBe(0);
    expect(text('.empty')).toBe('Noch keine Artikel');
  });

  it('shows a message when the list cannot be loaded', async () => {
    http.expectOne(LIST_URL).error(new ProgressEvent('error'));
    await fixture.whenStable();

    expect(text('.message-server')).toBe('Der Server ist nicht erreichbar');
  });

  it('keeps the list when adding fails', async () => {
    await loadList([item()]);
    await type('item-name', 'Brot');
    await submit();

    http.expectOne(ITEMS_URL).flush('down', { status: 503, statusText: 'Service Unavailable' });
    await fixture.whenStable();

    expect(text('.message-server')).toBe('Der Server ist nicht erreichbar');
    expect(rows().length).toBe(1);
    expect(query<HTMLInputElement>('#item-name').value).toBe('Brot');
  });

  it('keeps the done state when the update fails', async () => {
    await loadList([item()]);
    const checkbox = query<HTMLInputElement>('input[type="checkbox"]');

    checkbox.click();
    await fixture.whenStable();
    http
      .expectOne(`${ITEMS_URL}/id-1`)
      .flush('down', { status: 503, statusText: 'Service Unavailable' });
    await fixture.whenStable();

    expect(checkbox.checked).toBe(false);
    expect(rows()[0].classList.contains('item-done')).toBe(false);
    expect(text('.message-server')).toBe('Der Server ist nicht erreichbar');
  });
});
