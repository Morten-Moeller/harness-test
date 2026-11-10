package de.mmoller.einkaufsliste.shoppinglist;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.NotFoundException;
import java.util.UUID;

@ApplicationScoped
public class ShoppingListService {

    static final String LIST_NAME = "Einkaufsliste";

    private final ShoppingListRepository repository;

    public ShoppingListService(ShoppingListRepository repository) {
        this.repository = repository;
    }

    public ShoppingList shoppingList() {
        return new ShoppingList(LIST_NAME, repository.findAll());
    }

    public Item addItem(CreateItemRequest request) {
        Item item = new Item(UUID.randomUUID().toString(), request.name(), request.quantity(), false);
        return repository.save(item);
    }

    public Item setDone(String id, boolean done) {
        return repository.update(id, item -> item.withDone(done)).orElseThrow(() -> notFound(id));
    }

    public void deleteItem(String id) {
        if (!repository.delete(id)) {
            throw notFound(id);
        }
    }

    private static NotFoundException notFound(String id) {
        return new NotFoundException("Item " + id + " not found");
    }
}
