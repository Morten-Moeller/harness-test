package de.mmoller.einkaufsliste.shoppinglist;

import java.util.List;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

@Schema(requiredProperties = {"name", "items"})
public record ShoppingList(String name, List<Item> items) {}
