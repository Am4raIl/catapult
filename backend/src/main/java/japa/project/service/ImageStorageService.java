package japa.project.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Service
public class ImageStorageService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("png", "jpg", "jpeg", "gif", "webp", "pdf");

    private final Path root;

    public ImageStorageService(@Value("${app.storage.products-dir}") String directory) {
        this.root = Paths.get(directory).toAbsolutePath().normalize();
    }

    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        String contentType = file.getContentType();
        boolean isImage = contentType != null && contentType.regionMatches(true, 0, "image/", 0, 6);
        boolean isPdf = contentType != null && contentType.equalsIgnoreCase("application/pdf");
        if (!isImage && !isPdf) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "O arquivo enviado não é uma imagem ou PDF válido.");
        }

        String extension = extractExtension(file.getOriginalFilename());
        String filename = UUID.randomUUID() + "." + extension;
        Path destination = resolve(filename);

        try {
            Files.createDirectories(root);
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, destination, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Não foi possível salvar a imagem.", e);
        }

        return filename;
    }

    public void delete(String filename) {
        if (filename == null || filename.isBlank()) {
            return;
        }
        try {
            Files.deleteIfExists(resolve(filename));
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Não foi possível excluir a imagem.", e);
        }
    }

    public Resource load(String filename) {
        Path path = resolve(filename);
        if (!Files.exists(path)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Imagem não encontrada.");
        }
        return new FileSystemResource(path);
    }

    private Path resolve(String filename) {
        Path candidate = root.resolve(filename).normalize();
        if (!candidate.startsWith(root)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nome de arquivo inválido.");
        }
        return candidate;
    }

    private String extractExtension(String originalFilename) {
        String clean = StringUtils.cleanPath(originalFilename == null ? "" : originalFilename);
        int dot = clean.lastIndexOf('.');
        if (dot < 0 || dot == clean.length() - 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "O arquivo de imagem não possui uma extensão válida.");
        }
        String extension = clean.substring(dot + 1).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Formato de imagem não suportado. Use png, jpg, jpeg, gif ou webp.");
        }
        return extension;
    }
}
