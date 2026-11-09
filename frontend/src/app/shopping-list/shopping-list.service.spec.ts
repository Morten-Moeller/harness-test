import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { Item, ShoppingList } from '../shared/api';
import { ShoppingListService } from './shopping-list.service';

const LIST_URL = '/api/shopping-list';
const ITEMS_URL = `${LIST_URL}/items`;

function item(overrides: Partial<Item> = {}): Item {
  return { id: 'id-1', name: 'Milch', quantity: '1 l', done: false, ...overrides };
}

describe('ShoppingListService', () => {
  let service: ShoppingListService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ShoppingListService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the shopping list', () => {
    const list: ShoppingList = { name: 'Einkaufsliste', items: [item()] };
    let result: ShoppingList | undefined;
    service.load().subscribe((value) => (result = value));

    const request = http.expectOne(LIST_URL);
    expect(request.request.method).toBe('GET');
    request.flush(list);

    expect(result).toEqual(list);
  });

  it('posts a new item', () => {
    let result: Item | undefined;
    service.addItem({ name: 'Brot', quantity: '2' }).subscribe((value) => (result = value));

    const request = http.expectOne(ITEMS_URL);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ name: 'Brot', quantity: '2' });
    request.flush(item({ id: 'id-2', name: 'Brot', quantity: '2' }), {
      status: 201,
      statusText: 'Created',
    });

    expect(result?.id).toBe('id-2');
  });

  it('patches the done state of an item', () => {
    service.setDone('id-1', true).subscribe();

    const request = http.expectOne(`${ITEMS_URL}/id-1`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ done: true });
    request.flush(item({ done: true }));
  });

  it('deletes an item', () => {
    let completed = false;
    service.deleteItem('id-1').subscribe({ complete: () => (completed = true) });

    const request = http.expectOne(`${ITEMS_URL}/id-1`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });

    expect(completed).toBe(true);
  });

  it('passes a server error to the caller', () => {
    let failed = false;
    service.load().subscribe({ error: () => (failed = true) });

    http.expectOne(LIST_URL).flush('down', { status: 503, statusText: 'Service Unavailable' });

    expect(failed).toBe(true);
  });
});
