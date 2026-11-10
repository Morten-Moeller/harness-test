package de.mmoller.einkaufsliste.shoppinglist;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.junit.jupiter.api.Test;

class ShoppingListRepositoryTest {

    private final ShoppingListRepository repository = new ShoppingListRepository();

    @Test
    void updateChangesStoredItemInPlace() {
        Item item = repository.save(new Item("1", "Milch", null, false));

        Item updated = repository.update("1", stored -> stored.withDone(true)).orElseThrow();

        assertTrue(updated.done());
        assertEquals(List.of(item.withDone(true)), repository.findAll());
    }

    @Test
    void updateOfDeletedIdRestoresNothing() {
        repository.save(new Item("1", "Milch", null, false));
        repository.delete("1");

        assertTrue(repository.update("1", stored -> stored.withDone(true)).isEmpty());
        assertEquals(List.of(), repository.findAll());
    }
}
