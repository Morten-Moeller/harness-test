package de.mmoller.einkaufsliste.shoppinglist;

import jakarta.enterprise.context.ApplicationScoped;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.UnaryOperator;

@ApplicationScoped
public class ShoppingListRepository {

    private final Map<String, Item> items = new LinkedHashMap<>();

    public synchronized List<Item> findAll() {
        return List.copyOf(items.values());
    }

    public synchronized Item save(Item item) {
        items.put(item.id(), item);
        return item;
    }

    public synchronized Optional<Item> update(String id, UnaryOperator<Item> change) {
        return Optional.ofNullable(items.computeIfPresent(id, (key, item) -> change.apply(item)));
    }

    public synchronized boolean delete(String id) {
        return items.remove(id) != null;
    }
}
