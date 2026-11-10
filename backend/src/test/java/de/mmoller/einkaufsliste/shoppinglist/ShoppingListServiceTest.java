package de.mmoller.einkaufsliste.shoppinglist;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import jakarta.ws.rs.NotFoundException;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class ShoppingListServiceTest {

    private ShoppingListService service;

    @BeforeEach
    void setUp() {
        service = new ShoppingListService(new ShoppingListRepository());
    }

    private Item milk() {
        return service.addItem(new CreateItemRequest("Milch", "1 l"));
    }

    @Test
    void returnsTheListWithItsFixedName() {
        assertEquals("Einkaufsliste", service.shoppingList().name());
        assertEquals(List.of(), service.shoppingList().items());
    }

    @Test
    void addsItemsInInsertionOrder() {
        Item first = milk();
        Item second = service.addItem(new CreateItemRequest("Brot", null));

        assertEquals(List.of(first, second), service.shoppingList().items());
        assertFalse(first.done());
    }

    @Test
    void trimsNameAndDropsBlankQuantity() {
        Item item = service.addItem(new CreateItemRequest("  Eier ", "  "));

        assertEquals("Eier", item.name());
        assertNull(item.quantity());
    }

    @Test
    void marksItemAsDone() {
        Item item = milk();

        Item updated = service.setDone(item.id(), true);

        assertTrue(updated.done());
        assertEquals(List.of(updated), service.shoppingList().items());
    }

    @Test
    void takesDoneBack() {
        Item item = milk();
        service.setDone(item.id(), true);

        Item updated = service.setDone(item.id(), false);

        assertFalse(updated.done());
    }

    @Test
    void deletesItem() {
        Item item = milk();

        service.deleteItem(item.id());

        assertEquals(List.of(), service.shoppingList().items());
    }

    @Test
    void rejectsUnknownIdOnSetDone() {
        assertThrows(NotFoundException.class, () -> service.setDone("unknown", true));
    }

    @Test
    void rejectsUnknownIdOnDelete() {
        assertThrows(NotFoundException.class, () -> service.deleteItem("unknown"));
    }
}
