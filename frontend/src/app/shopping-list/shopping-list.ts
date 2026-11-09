import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { CreateItemRequest, Item } from '../shared/api';
import { ShoppingListService } from './shopping-list.service';

const SERVER_MESSAGE = 'Der Server ist nicht erreichbar';
const NAME_MISSING_MESSAGE = 'Bitte einen Namen eingeben';

@Component({
  selector: 'app-shopping-list',
  imports: [FormsModule],
  templateUrl: './shopping-list.html',
  styleUrl: './shopping-list.css',
})
export class ShoppingListPage {
  private readonly service = inject(ShoppingListService);
  private readonly nameInput = viewChild.required<ElementRef<HTMLInputElement>>('nameInput');

  protected readonly listName = signal('Einkaufsliste');
  protected readonly items = signal<Item[]>([]);
  protected readonly name = signal('');
  protected readonly quantity = signal('');
  protected readonly validationMessage = signal('');
  protected readonly serverMessage = signal('');

  constructor() {
    this.service.load().subscribe({
      next: (list) => {
        this.listName.set(list.name);
        this.items.set(list.items);
        this.serverMessage.set('');
      },
      error: () => this.serverMessage.set(SERVER_MESSAGE),
    });
  }

  protected add(): void {
    const name = this.name().trim();
    if (name.length === 0) {
      this.validationMessage.set(NAME_MISSING_MESSAGE);
      return;
    }
    const quantity = this.quantity().trim();
    const request: CreateItemRequest = quantity.length > 0 ? { name, quantity } : { name };
    this.service.addItem(request).subscribe({
      next: (item) => {
        this.items.update((items) => [...items, item]);
        this.name.set('');
        this.quantity.set('');
        this.validationMessage.set('');
        this.serverMessage.set('');
        this.nameInput().nativeElement.focus();
      },
      error: () => this.serverMessage.set(SERVER_MESSAGE),
    });
  }

  protected toggleDone(item: Item, checkbox: HTMLInputElement): void {
    this.service.setDone(item.id, !item.done).subscribe({
      next: (updated) => {
        this.items.update((items) => items.map((i) => (i.id === updated.id ? updated : i)));
        this.serverMessage.set('');
      },
      error: () => {
        checkbox.checked = item.done;
        this.serverMessage.set(SERVER_MESSAGE);
      },
    });
  }

  protected remove(item: Item): void {
    this.service.deleteItem(item.id).subscribe({
      next: () => {
        this.items.update((items) => items.filter((i) => i.id !== item.id));
        this.serverMessage.set('');
      },
      error: () => this.serverMessage.set(SERVER_MESSAGE),
    });
  }
}
