package de.mmoller.einkaufsliste.shoppinglist;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasItems;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;
import static org.junit.jupiter.api.Assertions.assertTrue;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

@QuarkusTest
class ShoppingListResourceTest {

    private static final String LIST = "/api/shopping-list";
    private static final String ITEMS = LIST + "/items";

    private static String createItem(String name, String quantity) {
        return given().contentType(ContentType.JSON)
                .body(Map.of("name", name, "quantity", quantity))
                .when()
                .post(ITEMS)
                .then()
                .statusCode(201)
                .extract()
                .path("id");
    }

    @Test
    void returnsListWithNameAndItemsInInsertionOrder() {
        String first = createItem("Milch", "1 l");
        String second = createItem("Brot", "1");

        List<String> ids = given().when()
                .get(LIST)
                .then()
                .statusCode(200)
                .body("name", equalTo("Einkaufsliste"))
                .body("items.id", hasItems(first, second))
                .extract()
                .path("items.id");

        assertTrue(ids.indexOf(first) < ids.indexOf(second));
    }

    @Test
    void createsItemWithIdAndDoneFalse() {
        given().contentType(ContentType.JSON)
                .body(Map.of("name", "Butter", "quantity", "250 g"))
                .when()
                .post(ITEMS)
                .then()
                .statusCode(201)
                .body("id", notNullValue())
                .body("name", equalTo("Butter"))
                .body("quantity", equalTo("250 g"))
                .body("done", equalTo(false));
    }

    @Test
    void createsItemWithoutQuantity() {
        given().contentType(ContentType.JSON)
                .body(Map.of("name", "Salz"))
                .when()
                .post(ITEMS)
                .then()
                .statusCode(201)
                .body("quantity", nullValue());
    }

    @Test
    void rejectsMissingName() {
        given().contentType(ContentType.JSON)
                .body(Map.of("quantity", "1"))
                .when()
                .post(ITEMS)
                .then()
                .statusCode(400);
    }

    @Test
    void rejectsBlankName() {
        given().contentType(ContentType.JSON)
                .body(Map.of("name", "   "))
                .when()
                .post(ITEMS)
                .then()
                .statusCode(400);
    }

    @Test
    void rejectsNameOver100Characters() {
        given().contentType(ContentType.JSON)
                .body(Map.of("name", "x".repeat(101)))
                .when()
                .post(ITEMS)
                .then()
                .statusCode(400);
    }

    @Test
    void rejectsQuantityOver50Characters() {
        given().contentType(ContentType.JSON)
                .body(Map.of("name", "Mehl", "quantity", "x".repeat(51)))
                .when()
                .post(ITEMS)
                .then()
                .statusCode(400);
    }

    @Test
    void marksItemAsDoneAndTakesItBack() {
        String id = createItem("Käse", "200 g");

        given().contentType(ContentType.JSON)
                .body(Map.of("done", true))
                .when()
                .patch(ITEMS + "/" + id)
                .then()
                .statusCode(200)
                .body("id", equalTo(id))
                .body("done", equalTo(true));

        given().contentType(ContentType.JSON)
                .body(Map.of("done", false))
                .when()
                .patch(ITEMS + "/" + id)
                .then()
                .statusCode(200)
                .body("done", equalTo(false));
    }

    @Test
    void rejectsPatchWithoutDone() {
        String id = createItem("Joghurt", "4");

        given().contentType(ContentType.JSON)
                .body(Map.of())
                .when()
                .patch(ITEMS + "/" + id)
                .then()
                .statusCode(400);
    }

    @Test
    void returns404OnPatchForUnknownId() {
        given().contentType(ContentType.JSON)
                .body(Map.of("done", true))
                .when()
                .patch(ITEMS + "/unknown")
                .then()
                .statusCode(404);
    }

    @Test
    void deletesItem() {
        String id = createItem("Apfel", "6");

        given().when().delete(ITEMS + "/" + id).then().statusCode(204);

        given().when().get(LIST).then().statusCode(200).body("items.id", not(hasItem(id)));
    }

    @Test
    void returns404OnDeleteForUnknownId() {
        given().when().delete(ITEMS + "/unknown").then().statusCode(404);
    }
}
