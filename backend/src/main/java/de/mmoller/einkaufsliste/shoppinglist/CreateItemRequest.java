package de.mmoller.einkaufsliste.shoppinglist;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateItemRequest(
        @NotBlank @Size(max = 100) String name,
        @Size(max = 50) String quantity) {}
