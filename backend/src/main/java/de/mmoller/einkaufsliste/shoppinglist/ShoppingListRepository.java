package de.mmoller.einkaufsliste.shoppinglist;

import jakarta.enterprise.context.ApplicationScoped;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@ApplicationScoped
public class ShoppingListRepository {

    private final Map<String, Item> items = new LinkedHashMap<>();

    public synchronized List<Item> findAll() {
        return List.copyOf(items.values());
    }

    public synchronized Optional<Item> find(String id) {
        return Optional.ofNullable(items.get(id));
    }

    public synchronized Item save(Item item) {
        items.put(item.id(), item);
        return item;
    }

    public synchronized boolean delete(String id) {
        return items.remove(id) != null;
    }
}
