import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import type { CreateItemRequest, Item, ShoppingList, UpdateItemRequest } from '../shared/api';

@Injectable({ providedIn: 'root' })
export class ShoppingListService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/shopping-list';

  load(): Observable<ShoppingList> {
    return this.http.get<ShoppingList>(this.baseUrl);
  }

  addItem(request: CreateItemRequest): Observable<Item> {
    return this.http.post<Item>(`${this.baseUrl}/items`, request);
  }

  setDone(id: string, done: boolean): Observable<Item> {
    const request: UpdateItemRequest = { done };
    return this.http.patch<Item>(this.itemUrl(id), request);
  }

  deleteItem(id: string): Observable<void> {
    return this.http.delete<void>(this.itemUrl(id));
  }

  private itemUrl(id: string): string {
    return `${this.baseUrl}/items/${encodeURIComponent(id)}`;
  }
}
