package japa.project;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
		"spring.profiles.active=test",
		"spring.datasource.url=jdbc:mysql://localhost:3306/project_test?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true",
		"spring.datasource.username=root",
		"spring.datasource.password=1234",
		"spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver",
		"spring.jpa.hibernate.ddl-auto=validate",
		"spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MariaDBDialect",
		"spring.jpa.properties.hibernate.boot.allow_jdbc_metadata_access=false",
		"spring.flyway.enabled=true",
		"spring.flyway.locations=classpath:db/migration"
})
class ProjectApplicationTests {

	@Test
	void contextLoads() {
	}

}
