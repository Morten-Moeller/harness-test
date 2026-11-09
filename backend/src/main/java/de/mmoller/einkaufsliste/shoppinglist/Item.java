package de.mmoller.einkaufsliste.shoppinglist;

import org.eclipse.microprofile.openapi.annotations.media.Schema;

@Schema(requiredProperties = {"id", "name", "done"})
public record Item(String id, String name, String quantity, boolean done) {

    public Item withDone(boolean newDone) {
        return new Item(id, name, quantity, newDone);
    }
}
