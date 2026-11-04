package japa.project;

import japa.project.config.SecurityConfig;
import japa.project.controller.ProductController;
import japa.project.service.ProductService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ProductController.class)
@Import({SecurityConfig.class, ProductBulkDeleteControllerTests.TestSecurity.class})
class ProductBulkDeleteControllerTests {
    @TestConfiguration
    @EnableWebSecurity
    static class TestSecurity { }

    @Autowired MockMvc mvc;
    @MockitoBean ProductService service;

    @Test
    void requiresAuthentication() throws Exception {
        mvc.perform(post("/api/products/bulk-delete").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"ids\":[\"" + UUID.randomUUID() + "\"]}"))
                .andExpect(status().isUnauthorized());
        verifyNoInteractions(service);
    }

    @Test
    void validatesSelectionBeforeCallingService() throws Exception {
        String tooMany = IntStream.range(0, 101).mapToObj(i -> "\"" + UUID.randomUUID() + "\"")
                .collect(Collectors.joining(","));
        for (String body : List.of("{}", "{\"ids\":null}", "{\"ids\":[]}", "{\"ids\":[null]}",
                "{\"ids\":[\"invalid\"]}", "{\"ids\":[" + tooMany + "]}")) {
            mvc.perform(post("/api/products/bulk-delete").session(session())
                            .contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isBadRequest());
        }
        verifyNoInteractions(service);
    }

    @Test
    void deletesSelectionAndReturnsEmptyResponse() throws Exception {
        UUID first = UUID.randomUUID(), second = UUID.randomUUID();
        mvc.perform(post("/api/products/bulk-delete").session(session())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"ids\":[\"" + first + "\",\"" + second + "\"]}"))
                .andExpect(status().isNoContent()).andExpect(content().string(""));
        verify(service).deleteMany(List.of(first, second));
    }

    @Test
    void reportsMissingProduct() throws Exception {
        UUID id = UUID.randomUUID();
        doThrow(new ResponseStatusException(HttpStatus.NOT_FOUND)).when(service).deleteMany(List.of(id));
        mvc.perform(post("/api/products/bulk-delete").session(session())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"ids\":[\"" + id + "\"]}"))
                .andExpect(status().isNotFound());
    }

    private MockHttpSession session() {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("SPRING_SECURITY_CONTEXT", new SecurityContextImpl(
                UsernamePasswordAuthenticationToken.authenticated("admin", null, List.of())));
        return session;
    }
}
