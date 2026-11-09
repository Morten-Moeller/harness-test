package de.mmoller.einkaufsliste.shoppinglist;

import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import org.jboss.resteasy.reactive.RestResponse;

@Path("/api/shopping-list")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "shopping-list")
public class ShoppingListResource {

    private final ShoppingListService service;

    public ShoppingListResource(ShoppingListService service) {
        this.service = service;
    }

    @GET
    @APIResponse(
            responseCode = "200",
            description = "The shopping list",
            content = @Content(schema = @Schema(implementation = ShoppingList.class)))
    public ShoppingList getShoppingList() {
        return service.shoppingList();
    }

    @POST
    @Path("/items")
    @APIResponse(
            responseCode = "201",
            description = "The created item",
            content = @Content(schema = @Schema(implementation = Item.class)))
    @APIResponse(responseCode = "400", description = "Validation error")
    public RestResponse<Item> addItem(@Valid CreateItemRequest request) {
        return RestResponse.status(Response.Status.CREATED, service.addItem(request));
    }

    @PATCH
    @Path("/items/{id}")
    @APIResponse(
            responseCode = "200",
            description = "The updated item",
            content = @Content(schema = @Schema(implementation = Item.class)))
    @APIResponse(responseCode = "400", description = "Validation error")
    @APIResponse(responseCode = "404", description = "Unknown item")
    public Item updateItem(@PathParam("id") String id, @Valid UpdateItemRequest request) {
        return service.setDone(id, request.done());
    }

    @DELETE
    @Path("/items/{id}")
    @APIResponse(responseCode = "204", description = "Item deleted")
    @APIResponse(responseCode = "404", description = "Unknown item")
    public void deleteItem(@PathParam("id") String id) {
        service.deleteItem(id);
    }
}
